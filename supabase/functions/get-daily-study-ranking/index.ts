import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let categories: string[] = [];
    try {
      const body = await req.json();
      categories = body.categories || [];
    } catch (_) {
      /* no body */
    }

    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setHours(0, 0, 0, 0);
    const fromISO = new Date(jst.getTime() - 9 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb.rpc("get_daily_study_ranking_v2", {
      from_time: fromISO,
      p_categories: categories.length > 0 ? categories : null,
    });

    if (error) throw error;

    const result = (data || []).map((r: any) => ({
      userId: r.user_id,
      count: r.count,
      username: r.username ?? "名無しさん",
      avatar_url: r.avatar_url ?? null,
      bio: r.bio ?? null,
      department: r.department ?? null,
      acquired_qualifications: r.acquired_qualifications ?? null,
      studying_categories: r.studying_categories ?? [],
      total_answers: r.total_answers,
      correct_answers: r.correct_answers,
      score: 0,
      time_taken: 0,
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[get-daily-study-ranking] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
