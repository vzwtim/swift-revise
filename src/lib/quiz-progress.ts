const STORAGE_KEY = 'quizProgress';

interface ProgressMap {
  [unitId: string]: number;
}

function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgressMap(map: ProgressMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getQuizProgress(unitId: string): number {
  const map = loadProgress();
  return map[unitId] ?? 0;
}

export function saveQuizProgress(unitId: string, index: number): void {
  const map = loadProgress();
  map[unitId] = index;
  saveProgressMap(map);
}

export function clearQuizProgress(unitId: string): void {
  const map = loadProgress();
  delete map[unitId];
  saveProgressMap(map);
}
