import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function started.'); // 追加
    // 環境変数からSupabaseクライアントを初期化
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    console.log('Supabase client initialized.'); // 追加

    // 今日の開始時刻（UTC）を取得
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    console.log('Today ISO:', todayISO); // 追加

    // answer_logsテーブルから今日の回答をユーザー情報と共に取得
    const { data, error } = await supabaseClient
      .from('answer_logs')
      .select('user_id, profiles(username, avatar_url)')
      .gte('created_at', todayISO);

    if (error) {
      console.error('Supabase query error:', error); // 追加
      throw error;
    }
    console.log('Query executed successfully. Data length:', data?.length); // 追加

    // ユーザーごとに回答数を集計
    const userCounts = data.reduce((acc, log) => {
      if (log.user_id) {
        acc[log.user_id] = {
          count: (acc[log.user_id]?.count || 0) + 1,
          profile: log.profiles
        };
      }
      return acc;
    }, {});
    console.log('User counts generated.'); // 追加

    // ランキング形式に変換し、上位10件を取得
    const rankedUsers = Object.entries(userCounts)
      .map(([userId, { count, profile }]) => ({
        userId,
        count,
        username: profile?.username || '名無しさん',
        avatar_url: profile?.avatar_url
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    console.log('Ranking generated.'); // 追加

    return new Response(JSON.stringify(rankedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Function caught an error:', error.message); // 追加
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});