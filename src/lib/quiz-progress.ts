const PROGRESS_KEY = 'quizProgress';
const INCOMPLETE_QUIZ_KEY = 'incompleteQuizzes';

interface ProgressMap {
  [unitId: string]: number;
}

interface IncompleteQuiz {
  questionIds: number[];
  currentIndex: number;
}

interface IncompleteQuizMap {
  [unitId: string]: IncompleteQuiz;
}

function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgressMap(map: ProgressMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function loadIncompleteQuizzes(): IncompleteQuizMap {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(INCOMPLETE_QUIZ_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveIncompleteQuizzes(map: IncompleteQuizMap): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(INCOMPLETE_QUIZ_KEY, JSON.stringify(map));
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

export function saveIncompleteQuiz(
    unitId: string,
    questionIds: number[],
    currentIndex: number
): void {
    const map = loadIncompleteQuizzes();
    map[unitId] = { questionIds, currentIndex };
    saveIncompleteQuizzes(map);
}

export function getIncompleteQuiz(unitId: string): IncompleteQuiz | null {
    const map = loadIncompleteQuizzes();
    return map[unitId] ?? null;
}

export function clearIncompleteQuiz(unitId: string): void {
    const map = loadIncompleteQuizzes();
    delete map[unitId];
    saveIncompleteQuizzes(map);
}
