import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // JSTの今日0時を計算
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setHours(0, 0, 0, 0);
    const fromISO = new Date(jst.getTime() - 9 * 60 * 60 * 1000).toISOString();

    // 1. 今日の回答ログを取得
    const { data: logs, error: logsErr } = await sb.from('answer_logs').select('user_id, created_at').gte('created_at', fromISO);
    if (logsErr) throw logsErr;

    // 2. メモリ内でユーザーごとにカウント
    const countsMap = (logs || []).reduce((acc, r) => {
      if (r.user_id) {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    // 3. 上位10ユーザーを決定
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

    // 4. プロフィール情報とフォールバック名を取得
    const { data: profilesWithFallback, error: profilesErr } = await sb.rpc('get_profiles_with_fallback_name', { p_user_ids: userIds });
    if (profilesErr) throw profilesErr;
    const profilesById = (profilesWithFallback || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // 5. 統計情報をユーザーごとに取得
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

    // 6. 最終的なレスポンスを組み立て
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
    console.error("[get-daily-study-ranking] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
