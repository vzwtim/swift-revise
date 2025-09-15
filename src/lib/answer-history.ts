import { supabase } from "@/integrations/supabase/client";
import { UserAnswer, Question } from "@/lib/types";

const TABLE_NAME = "answer_logs";

export async function saveAnswerLog(answer: UserAnswer, question: Question, sessionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("User not logged in. Answer log not saved to DB.");
    return;
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert({
      user_id: user.id,
      question_id: question.id,
      is_correct: answer.isCorrect,
      subject: question.category, // Use category from question
      session_id: sessionId,
      grade: answer.grade,
    });

  if (error) {
    console.error("Failed to save answer log", error);
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