import { supabase } from "@/integrations/supabase/client";
import { Card } from "./types";

export const loadAllCards = async (): Promise<{ [questionId: string]: Card }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("loadAllCards: No user session, returning empty cards.");
    return {};
  }

  try {
    console.log("loadAllCards: Fetching cards for user:", user.id);
    const { data: cardsFromDb, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .limit(5000);

    if (error) {
      console.error("loadAllCards: Error loading cards from DB:", error);
      throw error;
    }

    console.log("loadAllCards: Cards fetched from DB:", cardsFromDb);

    const cards: Card[] = (cardsFromDb || []).map(dbCard => ({
      questionId: dbCard.question_id,
      interval: dbCard.interval,
      repetitions: dbCard.repetitions,
      easeFactor: dbCard.ease_factor,
      dueDate: new Date(dbCard.due_date).getTime(),
      lastReviewed: dbCard.last_reviewed ? new Date(dbCard.last_reviewed).getTime() : undefined,
      consecutiveCorrectAnswers: dbCard.consecutive_correct_answers,
      needsReview: dbCard.needs_review,
      masteryLevel: dbCard.mastery_level,
      correct_count: dbCard.correct_count,
      total_count: dbCard.total_count,
      user_id: dbCard.user_id
    }));

    const cardsMap = cards.reduce((acc, card) => {
      acc[card.questionId] = card;
      return acc;
    }, {} as { [questionId: string]: Card });

    console.log("loadAllCards: Mapped cards:", cardsMap);
    return cardsMap;

  } catch (error) {
    console.error("loadAllCards: Error in loadAllCards catch block:", error);
    return {};
  }
};

export const saveCards = async (cardsToSave: Card[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || cardsToSave.length === 0) {
    console.log("saveCards: No user session or no cards to save.");
    return;
  }

  try {
    console.log("saveCards: Saving cards for user:", user.id, "Cards to save count:", cardsToSave.length);
    const recordsToUpsert = cardsToSave.map(card => ({
      user_id: user.id,
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
    }));

    console.log("saveCards: Records to upsert:", recordsToUpsert);

    const { error } = await supabase.from('cards').upsert(recordsToUpsert, {
      onConflict: 'user_id,question_id'
    });

    if (error) {
      console.error("saveCards: Error saving cards to DB:", error);
      throw error;
    }
    console.log("saveCards: Cards saved successfully.");
  } catch (error) {
    console.error("saveCards: Error in saveCards catch block:", error);
  }
};