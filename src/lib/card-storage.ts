import { Card } from "./types";

const CARDS_STORAGE_KEY = 'srsCards';

/**
 * すべてのカードをlocalStorageから読み込む
 */
export function loadAllCards(): { [questionId: string]: Card } {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CARDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * すべてのカードをlocalStorageに保存する
 * @param cards 保存するカードのマップオブジェクト
 */
export function saveAllCards(cards: { [questionId: string]: Card }): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // 無視
  }
}

/**
 * 特定のカードを保存または更新する
 * @param card 保存するカード
 */
export function saveCard(card: Card): void {
  const allCards = loadAllCards();
  allCards[card.questionId] = card;
  saveAllCards(allCards);
}

/**
 * 複数のカードを一度に保存する
 * @param cards 保存するカードの配列
 */
export function saveCards(cards: Card[]): void {
  const allCards = loadAllCards();
  cards.forEach(card => {
    allCards[card.questionId] = card;
  });
  saveAllCards(allCards);
}
