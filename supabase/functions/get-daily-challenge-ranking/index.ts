import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // JSTでの「今日」の開始時刻を計算するロジックは同じ
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setHours(0, 0, 0, 0);
    const todayStartISO = new Date(jst.getTime() - 9 * 60 * 60 * 1000).toISOString();
    // 【修正点①】RPCを使って、作成したDB関数を呼び出す
    const { data, error } = await supabaseClient.rpc('get_daily_ranking_unique_users', {
      start_time: todayStartISO // SQL関数に引数を渡す
    });
    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
        return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const userIds = data.map(result => result.user_id);

    if (userIds.length === 0) {
      return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
      });
    }

    // 複数のユーザー統計情報をユーザーごとに取得
    const statsPromises = userIds.map(id => 
      supabaseClient.rpc('get_user_stats', { p_user_id: id }).single()
    );
    const statsResults = await Promise.all(statsPromises);

    // プロフィール情報とフォールバック名を一括で取得
    const { data: profilesData, error: profilesError } = await supabaseClient.rpc('get_profiles_with_fallback_name', { p_user_ids: userIds });
    if (profilesError) throw profilesError;

    // データを処理しやすいようにMapに変換
    const statsMap = new Map();
    statsResults.forEach((result, index) => {
      if (result.data) {
        statsMap.set(userIds[index], result.data);
      }
    });
    const profilesMap = new Map(profilesData.map(profile => [profile.id, profile])); // id をキーにする

    const rankedUsers = data.map((result) => {
      const stats = statsMap.get(result.user_id) || { total_answers: 0, correct_answers: 0 };
      const profile = profilesMap.get(result.user_id) || { bio: null, department: null, acquired_qualifications: null, display_name: '名無しさん' };
      
      return {
        userId: result.user_id,
        score: result.score,
        time_taken: result.time_taken,
        username: profile.display_name, // フォールバック済みの表示名を使用
        avatar_url: result.avatar_url || profile.avatar_url || null, // 両方から取得を試みる
        bio: profile.bio,
        department: profile.department,
        acquired_qualifications: profile.acquired_qualifications,
        total_answers: stats.total_answers,
        correct_answers: stats.correct_answers,
      };
    });
    return new Response(JSON.stringify(rankedUsers), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error fetching daily ranking:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
