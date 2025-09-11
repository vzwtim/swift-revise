export interface Question {
  id: string;
  subject: string;
  unit: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Card {
  id: string;
  questionId: string;
  interval: number; // days
  repetitions: number;
  easeFactor: number;
  dueDate: number; // timestamp
  lastReviewed?: number; // timestamp
  consecutiveCorrectAnswers: number;
  needsReview: boolean;
  masteryLevel: MasteryLevel;
  correct_count: number;
  total_count: number;
}

export type MasteryLevel = "Perfect" | "Great" | "Good" | "Bad" | "Miss" | "New";

export interface QuestionStats {
  correct: number;
  total: number;
  lastResult: boolean;
}

export interface ReviewSession {
  id: string;
  startTime: number;
  endTime?: number;
  subject: string;
  unit?: string;
  questions: Question[];
  answers: UserAnswer[];
  score?: number;
}

export interface UserAnswer {
  questionId: string;
  answer: number;
  timeSpent: number; // milliseconds
  isCorrect: boolean;
  grade: 0 | 1 | 2; // 0: forgot, 1: hard, 2: easy
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  units: Unit[];
  totalQuestions: number;
  completedQuestions: number;
}

export interface Unit {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  questions: Question[];
  dueCards: number;
  newCards: number;
}

export interface LearningStats {
  totalQuestions: number;
  correctAnswers: number;
  streakDays: number;
  totalStudyTime: number; // minutes
  averageScore: number;
  nextReviewDate?: number;
}