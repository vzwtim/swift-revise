const STORAGE_PREFIX = 'quiz-last-index-';

/**
 * 指定された単元の最後に解いた問題のインデックスを保存する
 * @param unitId - 単元ID
 * @param index - 最後に解いた問題の0ベースのインデックス
 */
export function saveLastQuestionIndex(unitId: string, index: number) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${unitId}`, String(index));
  } catch (error) {
    console.error('Failed to save last question index:', error);
  }
}

/**
 * 指定された単元の最後に解いた問題のインデックスを取得する
 * @param unitId - 単元ID
 * @returns 最後に解いた問題のインデックス。なければnull
 */
export function getLastQuestionIndex(unitId: string): number | null {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${unitId}`);
    if (data === null) {
      return null;
    }
    const index = parseInt(data, 10);
    return isNaN(index) ? null : index;
  } catch (error) {
    console.error('Failed to get last question index:', error);
    return null;
  }
}

/**
 * 指定された単元の進捗をクリアする
 * @param unitId - 単元ID
 */
export function clearLastQuestionIndex(unitId: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${unitId}`);
  } catch (error) {
    console.error('Failed to clear last question index:', error);
  }
}