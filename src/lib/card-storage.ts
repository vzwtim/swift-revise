import { supabase } from "@/integrations/supabase/client";
import { Card } from "./types";

export const loadAllCards = async (): Promise<{ [questionId: string]: Card }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {};
  }

  try {
    const { data: cardsFromDb, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error loading cards from DB:", error);
      throw error;
    }

    // スネークケースからキャメルケースへ手動で変換
    const cards: Card[] = (cardsFromDb || []).map(dbCard => ({
      id: dbCard.id,
      questionId: dbCard.question_id,
      interval: dbCard.interval,
      repetitions: dbCard.repetitions,
      easeFactor: dbCard.ease_factor,
      dueDate: new Date(dbCard.due_date).getTime(), // ISO文字列からタイムスタンプ数値に変換
      lastReviewed: dbCard.last_reviewed ? new Date(dbCard.last_reviewed).getTime() : undefined,
      consecutiveCorrectAnswers: dbCard.consecutive_correct_answers,
      needsReview: dbCard.needs_review,
      masteryLevel: dbCard.mastery_level,
      correct_count: dbCard.correct_count,
      total_count: dbCard.total_count,
      user_id: dbCard.user_id
    }));

    // 配列を { [questionId]: Card } のマップに変換
    const cardsMap = cards.reduce((acc, card) => {
      acc[card.questionId] = card;
      return acc;
    }, {} as { [questionId: string]: Card });

    return cardsMap;

  } catch (error) {
    console.error("Error in loadAllCards:", error);
    return {};
  }
};

export const saveCards = async (cardsToSave: Card[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || cardsToSave.length === 0) {
    return;
  }

  try {
    // キャメルケースからスネークケースへ手動で変換
    const recordsToUpsert = cardsToSave.map(card => ({
      id: card.id,
      user_id: user.id,
      question_id: card.questionId,
      interval: card.interval,
      repetitions: card.repetitions,
      ease_factor: card.easeFactor,
      due_date: new Date(card.dueDate).toISOString(), // 数値をISO文字列に変換
      last_reviewed: card.lastReviewed ? new Date(card.lastReviewed).toISOString() : null,
      consecutive_correct_answers: card.consecutiveCorrectAnswers,
      needs_review: card.needsReview,
      mastery_level: card.masteryLevel,
      correct_count: card.correct_count,
      total_count: card.total_count,
    }));

    // 'user_id'と'question_id'の複合ユニークキーで競合を判断してupsert
    const { error } = await supabase.from('cards').upsert(recordsToUpsert, {
      onConflict: 'user_id,question_id'
    });

    if (error) {
      console.error("Error saving cards to DB:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveCards:", error);
  }
};