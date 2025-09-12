import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => { // ← req に型を付与
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

    const { data, error }: { data: any[] | null; error: Error | null } = await supabaseClient
      .from('answer_logs')
      .select('user_id, profiles(username, avatar_url)')
      .gte('created_at', todayISO);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    console.log('Query executed successfully. Raw data:', JSON.stringify(data));

    const userCounts = (data ?? []).reduce((acc: Record<string, { count: number; profile: any }>, log: any) => {
      if (log.user_id) {
        acc[log.user_id] = {
          count: (acc[log.user_id]?.count || 0) + 1,
          profile: log.profiles
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
        avatar_url: profile?.avatar_url
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    console.log('Ranking generated.');

    return new Response(JSON.stringify(rankedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) { // ← error に型を付与
    if (error instanceof Error) {
      console.error('Function caught an error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    } else {
      console.error('Unknown error:', error);
      return new Response(JSON.stringify({ error: 'Unknown error occurred' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }
});
