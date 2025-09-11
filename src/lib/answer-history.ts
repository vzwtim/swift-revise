import { supabase } from "@/integrations/supabase/client";
import { UserAnswer } from "@/lib/types";

const TABLE_NAME = "answer_logs"; // テーブル名を修正

export async function saveAnswerHistory(sessionId: string, answer: UserAnswer) {
  // ログインしているユーザーを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 未ログイン時は何もしない（あるいはローカルに保存するなどの代替策も考えられる）
    console.log("User not logged in. Answer history not saved to DB.");
    return;
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert({
      user_id: user.id, // user_id を追加
      session_id: sessionId,
      question_id: answer.questionId,
      // 'answer' カラムはテーブルにないので削除
      time_spent: answer.timeSpent,
      is_correct: answer.isCorrect,
      grade: answer.grade,
    });

  if (error) {
    console.error("Failed to save answer history", error);
  }
}

export async function fetchAnswerHistory(sessionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id) // user_id で絞り込み
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch answer history", error);
    return [];
  }

  return data ?? [];
}