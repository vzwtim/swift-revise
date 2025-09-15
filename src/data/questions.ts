import { Question, Subject } from '@/lib/types';
import aresCsv from './ARES2024.csv?raw';
import takkenCsv from './takken2024.csv?raw';

// ARES用の科目マップ
const ARES_SUBJECT_MAP: Record<string, string> = {
  '101': '企業と不動産',
  '102': '不動産証券化の概要',
  '103': '不動産投資の基礎',
  '104': '不動産証券化の法務／会計・税務',
  '105': '不動産ファイナンスの基礎',
  '106': '不動産証券化と倫理行動',
};

// 宅建用の科目マップ (ダミー)
const TAKKEN_SUBJECT_MAP: Record<string, string> = {
  '101': '宅建業法',
  '102': '権利関係',
};

// CSVパーサーを汎用化
const parseCsv = (
  csv: string,
  subjectMap: Record<string, string>,
  idPrefix: string
): Question[] => {
  const lines = csv.trim().split(/\r?\n/);
  const rows: string[] = [];
  let buffer: string[] = [];

  for (const line of lines.slice(1)) {
    if (/^\d{3}-\d+,\d+,/.test(line)) {
      if (buffer.length) {
        rows.push(buffer.join(''));
        buffer = [];
      }
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) rows.push(buffer.join(''));

  return rows
    .map((row) => {
      const match = row.match(/^([^,]+),([^,]+),(.*),(TRUE|FALSE),(.*)$/);
      if (!match) return null;
      const [, problemNo, subId, stem, correct, explanation] = match;
      const [subjectCode] = problemNo.split('-');
      const subjectName = subjectMap[subjectCode];
      if (!subjectName) return null;
      return {
        id: `${idPrefix}-${problemNo}-${subId}`,
        subject: subjectName,
        unit: '基本問題',
        question: stem,
        choices: ['TRUE', 'FALSE'],
        answer: correct === 'TRUE' ? 0 : 1,
        explanation,
        category: idPrefix,
      } as Question;
    })
    .filter((q): q is Question => q !== null);
};

// 各カテゴリの問題をパース
export const aresQuestions = parseCsv(aresCsv, ARES_SUBJECT_MAP, 'ares');
export const takkenQuestions = parseCsv(takkenCsv, TAKKEN_SUBJECT_MAP, 'takken');

// すべての問題を結合
export const allQuestions = [...aresQuestions, ...takkenQuestions];

// 科目リスト生成ロジックを汎用化
const createSubjects = (
  subjectMap: Record<string, string>,
  questions: Question[],
  idPrefix: string
): Subject[] => {
  return Object.entries(subjectMap).map(([code, name]) => {
    const subjectQuestions = questions.filter((q) => q.subject === name);
    return {
      id: `${idPrefix}-${code}`,
      name,
      description: `${name}の基本問題`,
      category: idPrefix,
      units: [
        {
          id: `${idPrefix}-${code}-unit`,
          name: '基本問題',
          description: `${name}の全問題`,
          subjectId: `${idPrefix}-${code}`,
          questions: subjectQuestions,
          dueCards: 0,
          newCards: subjectQuestions.length,
        },
      ],
      totalQuestions: subjectQuestions.length,
      completedQuestions: 0,
    } as Subject;
  });
};

// 各カテゴリの科目を生成
const aresSubjects = createSubjects(ARES_SUBJECT_MAP, aresQuestions, 'ares');
const takkenSubjects = createSubjects(TAKKEN_SUBJECT_MAP, takkenQuestions, 'takken');

// すべての科目を結合
export const subjects = [...aresSubjects, ...takkenSubjects];

