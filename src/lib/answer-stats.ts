interface QuestionStats {
  correct: number;
  total: number;
  lastResult: boolean;
}

const STORAGE_KEY = 'questionStats';

function loadStats(): Record<string, QuestionStats> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStats(stats: Record<string, QuestionStats>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore write errors
  }
}

export function updateQuestionStats(questionId: string, isCorrect: boolean): void {
  const stats = loadStats();
  const current = stats[questionId] || { correct: 0, total: 0, lastResult: false };
  current.total += 1;
  if (isCorrect) current.correct += 1;
  current.lastResult = isCorrect;
  stats[questionId] = current;
  saveStats(stats);
}

export function getQuestionStats(questionId: string): QuestionStats | null {
  const stats = loadStats();
  return stats[questionId] || null;
}

export function getAllQuestionStats(): Record<string, QuestionStats> {
  return loadStats();
}

export function getLowAccuracyQuestionIds(threshold = 0.7): string[] {
  const stats = loadStats();
  return Object.entries(stats)
    .filter(([, s]) => s.total > 0 && s.correct / s.total < threshold)
    .map(([id]) => id);
}
