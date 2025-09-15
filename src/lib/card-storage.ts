import { supabase } from "@/integrations/supabase/client";
import { Card } from "./types";

export const loadAllCards = async (): Promise<{ [questionId: string]: Card }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {};
  }

  try {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error loading cards from DB:", error);
      throw error;
    }

    // 配列を { [questionId]: Card } のマップに変換
    const cardsMap = (cards || []).reduce((acc, card) => {
      acc[card.question_id] = card;
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
    // upsertするデータに user_id を付与する
    const recordsToUpsert = cardsToSave.map(card => ({
      ...card,
      user_id: user.id,
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
