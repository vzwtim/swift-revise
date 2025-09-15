import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    let categories = [];
    try {
      const body = await req.json();
      categories = body.categories || [];
    } catch (e) {
      categories = [];
    }

    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setHours(0, 0, 0, 0);
    const fromISO = new Date(jst.getTime() - 9 * 60 * 60 * 1000).toISOString();

    let query = sb.from('answer_logs').select('user_id, created_at').gte('created_at', fromISO);
    if (categories && Array.isArray(categories) && categories.length > 0) {
      query = query.in('subject', categories);
    }

    const { data: logs, error: logsErr } = await query;
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

    const { data: profilesData, error: profilesErr } = await sb
      .from('profiles')
      .select('id, username, avatar_url, bio, department, acquired_qualifications, studying_categories')
      .in('id', userIds);
    if (profilesErr) throw profilesErr;

    const profilesById = (profilesData || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const { data: statsList, error: statsErr } = await sb.rpc('get_user_stats_for_ranking', { p_user_ids: userIds });
    if (statsErr) throw statsErr;

    const statsMap = (statsList || []).reduce((acc, stats) => {
      acc[stats.user_id] = stats;
      return acc;
    }, {});

    const result = ranked.map((r) => {
      const profile = profilesById[r.userId];
      const stats = statsMap[r.userId] || { total_answers: 0, correct_answers: 0 };
      return {
        userId: r.userId,
        count: r.count,
        username: profile?.username ?? '名無しさん',
        avatar_url: profile?.avatar_url ?? null,
        bio: profile?.bio ?? null,
        department: profile?.department ?? null,
        acquired_qualifications: profile?.acquired_qualifications ?? null,
        studying_categories: profile?.studying_categories ?? [],
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
    console.error("[get-daily-study-ranking] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
