import { Card, UserAnswer } from './types';

// Simplified SM-2 Algorithm for spaced repetition
export class SpacedRepetitionScheduler {
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  private static readonly DAY_IN_MS = 24 * 60 * 60 * 1000;

  static createNewCard(questionId: string): Card {
    return {
      id: `card_${questionId}`,
      questionId,
      interval: 1,
      repetitions: 0,
      easeFactor: this.INITIAL_EASE_FACTOR,
      dueDate: Date.now(),
    };
  }

  static scheduleCard(card: Card, grade: 0 | 1 | 2): Card {
    const newCard = { ...card };
    newCard.lastReviewed = Date.now();

    if (grade === 0) {
      // Forgot - reset card
      newCard.repetitions = 0;
      newCard.interval = 1;
    } else {
      newCard.repetitions += 1;

      if (newCard.repetitions === 1) {
        newCard.interval = 1;
      } else if (newCard.repetitions === 2) {
        newCard.interval = 6;
      } else {
        newCard.interval = Math.round(newCard.interval * newCard.easeFactor);
      }

      // Adjust ease factor based on performance
      const easeFactor = newCard.easeFactor + (0.1 - (2 - grade) * (0.08 + (2 - grade) * 0.02));
      newCard.easeFactor = Math.max(easeFactor, this.MIN_EASE_FACTOR);
    }

    newCard.dueDate = Date.now() + (newCard.interval * this.DAY_IN_MS);
    return newCard;
  }

  static getDueCards(cards: Card[]): Card[] {
    const now = Date.now();
    return cards.filter(card => card.dueDate <= now);
  }

  static getNextReviewDate(cards: Card[]): number | null {
    const futureCards = cards.filter(card => card.dueDate > Date.now());
    if (futureCards.length === 0) return null;
    
    return Math.min(...futureCards.map(card => card.dueDate));
  }

  static calculateGrade(answer: UserAnswer): 0 | 1 | 2 {
    if (!answer.isCorrect) return 0; // Forgot
    
    // If correct, determine difficulty based on time spent
    // This is simplified - you could add more sophisticated logic
    if (answer.timeSpent < 3000) return 2; // Easy (< 3 seconds)
    if (answer.timeSpent < 10000) return 1; // Hard (3-10 seconds)
    return 1; // Default to hard for longer times
  }
}