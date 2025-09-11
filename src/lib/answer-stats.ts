// import { QuestionStats } from "./types";

const DAILY_KEY = 'dailyAnswerCounts';
const TARGET_KEY = 'dailyTargetCount';

type DailyCount = { correct: number; incorrect: number };

function loadDailyCounts(): Record<string, DailyCount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DAILY_KEY);
    const data = raw ? JSON.parse(raw) : {};

    if (data && Object.values(data).some(v => typeof v === 'number')) {
      console.warn('Old daily count data format detected and cleared.');
      window.localStorage.removeItem(DAILY_KEY);
      return {};
    }

    return data;
  } catch (error) {
    console.error('Error loading daily counts, clearing data:', error);
    window.localStorage.removeItem(DAILY_KEY);
    return {};
  }
}

function saveDailyCounts(counts: Record<string, DailyCount>): void {
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

export function recordDailyAnswer(isCorrect: boolean): void {
  const counts = loadDailyCounts();
  const today = new Date().toISOString().slice(0, 10);
  const todaysCount = counts[today] || { correct: 0, incorrect: 0 };
  if (isCorrect) {
    todaysCount.correct++;
  } else {
    todaysCount.incorrect++;
  }
  counts[today] = todaysCount;
  saveDailyCounts(counts);
}


export function getDailyAnswerCounts(days = 7): { date: string; correct: number; incorrect: number }[] {
  if (typeof window === 'undefined') return [];
  const counts = loadDailyCounts();
  const result: { date: string; correct: number; incorrect: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const count = counts[key] || { correct: 0, incorrect: 0 };
    result.push({ date: label, correct: count.correct, incorrect: count.incorrect });
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
    const count = counts[key] as any;
    result.push({ date: label, count: (count?.correct || 0) + (count?.incorrect || 0) });
  }
  return result;
}

export function getDailyTarget(): number {
  return loadTarget();
}

export function setDailyTarget(target: number): void {
  saveTarget(target);
}
