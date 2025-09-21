import { supabase } from "@/integrations/supabase/client";
import { Card } from "./types";

export const loadAllCards = async (): Promise<{ [questionId: string]: Card }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading cards from Supabase:', error);
      return {};
    }

    const cardsMap: { [questionId: string]: Card } = {};
    if (data) {
      const debugCard = data.find(c => c.question_id === 'ares-101-24-1-1');
      if (debugCard) {
        console.log('[DEBUG] DB Record for ares-101-24-1-1:', debugCard);
        
        const mappedCard = {
          questionId: debugCard.question_id,
          interval: debugCard.interval,
          repetitions: debugCard.repetitions,
          easeFactor: debugCard.ease_factor,
          dueDate: new Date(debugCard.due_date).getTime(),
          lastReviewed: debugCard.last_reviewed ? new Date(debugCard.last_reviewed).getTime() : undefined,
          consecutiveCorrectAnswers: debugCard.consecutive_correct_answers,
          needsReview: debugCard.needs_review,
          masteryLevel: debugCard.mastery_level,
          correct_count: debugCard.correct_count,
          total_count: debugCard.total_count,
        };
        console.log('[DEBUG] Mapped Card for ares-101-24-1-1:', mappedCard);
      }

      data.forEach(dbCard => {
        cardsMap[dbCard.question_id] = {
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
        };
      });
    }
    return cardsMap;
  }
  return {};
};

export const saveCards = async (cardsToSave: Card[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || cardsToSave.length === 0) {
    console.log("saveCards: No user session or no cards to save.");
    return;
  }

  try {
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

    const { error } = await supabase.from('cards').upsert(recordsToUpsert, {
      onConflict: 'user_id,question_id'
    });

    if (error) {
      console.error("saveCards: Error saving cards to DB:", error);
      throw error;
    }
  } catch (error) {
    console.error("saveCards: Error in saveCards catch block:", error);
  }
};