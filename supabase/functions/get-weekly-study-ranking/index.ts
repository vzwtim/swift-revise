import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // JSTの今週月曜0時 → DBはUTCなので補正してISOに
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dayOfWeek = jstNow.getDay(); // Sunday = 0, Monday = 1
    const diff = jstNow.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayJST = new Date(jstNow.setDate(diff));
    mondayJST.setHours(0, 0, 0, 0);
    const fromISO = new Date(mondayJST.getTime() - 9 * 60 * 60 * 1000).toISOString();

    const { data: logs, error: logsErr } = await sb.from('answer_logs').select('user_id, created_at').gte('created_at', fromISO);

    if (logsErr) throw logsErr;

    const countsMap = (logs || []).reduce((acc, r) => {
      if (r.user_id) {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    const ranked = Object.entries(countsMap).map(([userId, count]) => ({
      userId,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    const userIds = ranked.map((r) => r.userId);

    if (userIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profilesWithFallback, error: profilesErr } = await sb.rpc('get_profiles_with_fallback_name', { p_user_ids: userIds });
      if (profilesErr) throw profilesErr;
      profilesById = (profilesWithFallback || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }

    const statsPromises = userIds.map(id => 
      sb.rpc('get_user_stats', { p_user_id: id }).single()
    );
    const statsResults = await Promise.all(statsPromises);

    const statsMap = statsResults.reduce((acc, result, index) => {
      if (result.data) {
        acc[userIds[index]] = result.data;
      }
      return acc;
    }, {});

    const result = ranked.map((r) => {
      const profile = profilesById[r.userId];
      const stats = statsMap[r.userId] || { total_answers: 0, correct_answers: 0 };
      return {
        userId: r.userId,
        count: r.count,
        username: profile?.display_name ?? '名無しさん',
        avatar_url: profile?.avatar_url ?? null,
        bio: profile?.bio ?? null,
        department: profile?.department ?? null,
        acquired_qualifications: profile?.acquired_qualifications ?? null,
        total_answers: stats.total_answers,
        correct_answers: stats.correct_answers,
        score: 0,
        time_taken: 0
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error("[get-weekly-ranking] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
