import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function started.');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    console.log('Supabase client initialized.');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    console.log('Today ISO:', todayISO);

    const { data, error } = await supabaseClient
      .from('answer_logs')
      .select('user_id, profiles(username, avatar_url)')
      .gte('created_at', todayISO);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    console.log('Query executed successfully. Raw data:', JSON.stringify(data)); // 追加: Raw dataの内容を確認

    // ユーザーごとに回答数を集計
    const userCounts = (data || []).reduce((acc, log) => { // dataがnull/undefinedの場合に備えて[]を追加
      if (log.user_id) {
        acc[log.user_id] = {
          count: (acc[log.user_id]?.count || 0) + 1,
          profile: log.profiles // profilesがnullの場合もそのまま保持
        };
      }
      return acc;
    }, {});
    console.log('User counts generated. UserCounts:', JSON.stringify(userCounts)); // 追加: userCountsの内容を確認

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
    console.log('Ranking generated.');

    return new Response(JSON.stringify(rankedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Function caught an error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
