import { Card, MasteryLevel } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

// Supabaseのcardsテーブルの型（一部）
// DBのスキーマと一致させる
interface SupabaseCard {
  id?: string;
  user_id: string;
  question_id: string;
  interval: number;
  repetitions: number;
  ease_factor: number;
  due_date: string; // ISO 8601 string
  last_reviewed: string | null; // ISO 8601 string
  consecutive_correct_answers: number;
  needs_review: boolean;
  mastery_level: string;
  correct_count: number;
  total_count: number;
}

// アプリ内のCard型をSupabaseの型に変換
function mapToSupabase(card: Card, userId: string): Omit<SupabaseCard, 'id'> {
  return {
    user_id: userId,
    question_id: card.questionId,
    interval: card.interval,
    repetitions: card.repetitions,
    ease_factor: card.easeFactor,
    due_date: new Date(card.dueDate).toISOString(),
    last_reviewed: card.lastReviewed ? new Date(card.lastReviewed).toISOString() : null,
    consecutive_correct_answers: card.consecutiveCorrectAnswers,
    needs_review: card.needsReview,
    mastery_level: card.masteryLevel,
    correct_count: card.correct_count,
    total_count: card.total_count,
  };
}

// Supabaseの型をアプリ内のCard型に変換
function mapFromSupabase(dbCard: SupabaseCard): Card {
  return {
    id: dbCard.id!, // DBから取得したカードは必ずidを持つ
    questionId: dbCard.question_id,
    interval: dbCard.interval,
    repetitions: dbCard.repetitions,
    easeFactor: dbCard.ease_factor,
    dueDate: new Date(dbCard.due_date).getTime(),
    lastReviewed: dbCard.last_reviewed ? new Date(dbCard.last_reviewed).getTime() : undefined,
    consecutiveCorrectAnswers: dbCard.consecutive_correct_answers,
    needsReview: dbCard.needs_review,
    masteryLevel: dbCard.mastery_level as MasteryLevel, // Assuming the string matches MasteryLevel type
    correct_count: dbCard.correct_count,
    total_count: dbCard.total_count,
  };
}


/**
 * すべてのカードをSupabaseから読み込む
 */
export async function loadAllCards(): Promise<{ [questionId: string]: Card }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("User not logged in, returning empty cards.");
    return {};
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error loading cards:', error);
    return {};
  }

  if (!data) {
    return {};
  }

  const cardsMap: { [questionId: string]: Card } = {};
  data.forEach((dbCard: SupabaseCard) => {
    const card = mapFromSupabase(dbCard);
    cardsMap[card.questionId] = card;
  });

  return cardsMap;
}


/**
 * 複数のカードをSupabaseに保存する
 * @param cards 保存するカードの配列
 */
export async function saveCards(cards: Card[]): Promise<{ error: PostgrestError | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: "User not authenticated", details: "", hint: "", code: "401" } };
  }
  if (cards.length === 0) {
    return { error: null };
  }

  const supabaseCards = cards.map(card => mapToSupabase(card, user.id));

  const { error } = await supabase
    .from('cards')
    .upsert(supabaseCards, { onConflict: 'user_id,question_id' });

  if (error) {
    console.error('Error saving cards:', error);
  }

  return { error };
}