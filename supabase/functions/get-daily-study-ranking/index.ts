import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // service role を使う
    );
    // JST の今日0時 → DBはUTCなので補正してISOに
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setHours(0, 0, 0, 0);
    const fromISO = new Date(jst.getTime() - 9 * 60 * 60 * 1000).toISOString();
    // 1) 今日の回答ログだけ取得（必要なら limit/offset をつける）
    const { data: logs, error: logsErr } = await sb.from('answer_logs').select('user_id, created_at').gte('created_at', fromISO);
    if (logsErr) throw logsErr;
    // 2) userごとにカウント（メモリ内集計）
    const countsMap = {};
    for (const r of logs || []){
      if (!r.user_id) continue;
      countsMap[r.user_id] = (countsMap[r.user_id] || 0) + 1;
    }
    // 上位10ユーザーの user_id を取る
    const ranked = Object.entries(countsMap).map(([userId, count])=>({
        userId,
        count
      })).sort((a, b)=>b.count - a.count).slice(0, 10);
    const userIds = ranked.map((r)=>r.userId);
    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesErr } = await sb.from('profiles').select('id, username, avatar_url, bio, department, acquired_qualifications').in('id', userIds);
      if (profilesErr) throw profilesErr;
      profilesById = (profiles || []).reduce((acc, p)=>{
        acc[p.id] = p;
        return acc;
      }, {});
    }

    // 各ユーザーの統計情報を一括で取得
    let statsMap = {};
    if (userIds.length > 0) {
      const { data: stats, error: statsErr } = await sb.rpc('get_user_stats_for_ranking', { p_user_ids: userIds });
      if (statsErr) throw statsErr;

      statsMap = (stats || []).reduce((acc, s) => {
        acc[s.user_id] = s;
        return acc;
      }, {});
    }

    const result = ranked.map((r)=> {
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
        total_answers: stats.total_answers,
        correct_answers: stats.correct_answers,
        score: 0,
        time_taken: 0
      };
    });
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error("[get-daily-ranking] error:", error); // ←ログ追加
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
