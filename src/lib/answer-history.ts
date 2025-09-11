import { supabase } from "@/integrations/supabase/client";
import { UserAnswer } from "@/lib/types";
// Import your generated types from Supabase
// import { Database } from "./database.types";

// Define the table name for answer_history
const TABLE_NAME = "answer_history";

export async function saveAnswerHistory(sessionId: string, answer: UserAnswer) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .insert({
      session_id: sessionId,
      question_id: answer.questionId,
      answer: answer.answer,
      time_spent: answer.timeSpent,
      is_correct: answer.isCorrect,
      grade: answer.grade,
    });

  if (error) {
    console.error("Failed to save answer history", error);
    console.error("Supabase error details:", error);
  }
}

export async function fetchAnswerHistory(sessionId: string) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch answer history", error);
    return [];
  }

  return data ?? [];
}
