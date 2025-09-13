import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabaseClient
      .from('daily_challenge_results')
      .select('score, time_taken, user_id, profiles(username, avatar_url)')
      .gte('created_at', todayISO)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    const rankedUsers = data.map(result => ({
      userId: result.user_id,
      count: result.score,
      time_taken: result.time_taken,
      username: result.profiles?.username || '名無しさん',
      avatar_url: result.profiles?.avatar_url || null
    }));

    return new Response(JSON.stringify(rankedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
