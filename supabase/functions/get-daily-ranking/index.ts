import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function started.');
    // Authorizationヘッダーを取得。存在しない場合はundefined
    const authHeader = req.headers.get('Authorization');

    // Supabaseクライアントを初期化
    // Authorizationヘッダーが存在しない場合は、匿名アクセスとして初期化
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } } // authHeaderがない場合は空文字列を渡す
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
    console.log('Query executed successfully. Raw data:', JSON.stringify(data));

    const safeData = data || [];

    const userCounts = safeData.reduce((acc, log) => {
      if (log.user_id) {
        acc[log.user_id] = {
          count: (acc[log.user_id]?.count || 0) + 1,
          profile: log.profiles || { username: '名無しさん', avatar_url: null }
        };
      }
      return acc;
    }, {});
    console.log('User counts generated. UserCounts:', JSON.stringify(userCounts));

    const rankedUsers = Object.entries(userCounts)
      .map(([userId, { count, profile }]) => ({
        userId,
        count,
        username: profile?.username || '名無しさん',
        avatar_url: profile?.avatar_url || null
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
