import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    // Calculate the start of the week (Monday)
    const today = new Date();
    const dayOfWeek = today.getUTCDay(); // Sunday = 0, Monday = 1, ...
    const diff = today.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(today.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    const mondayISO = monday.toISOString();

    // 1. Get all answer history for this week
    const { data: historyData, error: historyError } = await supabaseClient
      .from('answer_history')
      .select('user_id')
      .gte('created_at', mondayISO);

    if (historyError) throw historyError;

    // 2. Count answers per user
    const userCounts = historyData.reduce((acc, record) => {
      acc[record.user_id] = (acc[record.user_id] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const userIds = Object.keys(userCounts);
    if (userIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Get user profiles
    const { data: profilesData, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // 4. Combine data and sort
    const rankedUsers = profilesData.map(profile => ({
      userId: profile.id,
      username: profile.username || '名無しさん',
      avatar_url: profile.avatar_url || null,
      count: userCounts[profile.id],
      score: 0, // Dummy data to match the frontend type
      time_taken: 0, // Dummy data to match the frontend type
    })).sort((a, b) => b.count - a.count).slice(0, 10);


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
