interface QuestionStats {
  correct: number;
  total: number;
  lastResult: boolean;
}

const STORAGE_KEY = 'questionStats';
const DAILY_KEY = 'dailyAnswerCounts';
const TARGET_KEY = 'dailyTargetCount';

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

function loadDailyCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDailyCounts(counts: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DAILY_KEY, JSON.stringify(counts));
  } catch {
    // ignore write errors
  }
}

function loadTarget(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(TARGET_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function saveTarget(target: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TARGET_KEY, String(target));
  } catch {
    // ignore write errors
  }
}

function recordDailyAnswer(): void {
  const counts = loadDailyCounts();
  const today = new Date().toISOString().slice(0, 10);
  counts[today] = (counts[today] || 0) + 1;
  saveDailyCounts(counts);
}

export function updateQuestionStats(questionId: string, isCorrect: boolean): void {
  const stats = loadStats();
  const current = stats[questionId] || { correct: 0, total: 0, lastResult: false };
  current.total += 1;
  if (isCorrect) current.correct += 1;
  current.lastResult = isCorrect;
  stats[questionId] = current;
  saveStats(stats);
  recordDailyAnswer();
}

export function getQuestionStats(questionId: string): QuestionStats | null {
  const stats = loadStats();
  return stats[questionId] || null;
}

export function getAllQuestionStats(): Record<string, QuestionStats> {
  return loadStats();
}

export function getDailyAnswerCounts(days = 7): { date: string; count: number }[] {
  if (typeof window === 'undefined') return [];
  const counts = loadDailyCounts();
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: label, count: counts[key] ?? 0 });
  }
  return result;
}

export function getMonthlyAnswerCounts(year: number, month: number): { date: string; count: number }[] {
  if (typeof window === 'undefined') return [];
  const counts = loadDailyCounts();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: { date: string; count: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const label = `${month + 1}/${day}`;
    result.push({ date: label, count: counts[key] ?? 0 });
  }
  return result;
}

export function getDailyTarget(): number {
  return loadTarget();
}

export function setDailyTarget(target: number): void {
  saveTarget(target);
}

export function getLowAccuracyQuestionIds(threshold = 0.7): string[] {
  const stats = loadStats();
  return Object.entries(stats)
    .filter(([, s]) => s.total > 0 && s.correct / s.total < threshold)
    .map(([id]) => id);
}
