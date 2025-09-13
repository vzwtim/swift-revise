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
    // 【修正点②】RPCからの返り値はprofilesがネストされていないため、マッピングを調整
    const rankedUsers = data.map((result)=>({
        userId: result.user_id,
        score: result.score,
        time_taken: result.time_taken,
        username: result.username || '名無しさん',
        avatar_url: result.avatar_url || null // ネストされていない
      }));
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
