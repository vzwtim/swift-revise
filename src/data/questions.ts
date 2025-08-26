import { Question, Subject } from '@/lib/types';
import ares2023Csv from './ARES2023.csv?raw';
import ares2024Csv from './ARES2024.csv?raw';

const SUBJECT_MAP: Record<string, string> = {
  '101': '企業と不動産',
  '102': '不動産証券化の概要',
  '103': '不動産投資の基礎',
  '104': '不動産証券化の法務／会計・税務',
  '105': '不動産ファイナンスの基礎',
  '106': '不動産証券化と倫理行動',
};

const parseAresCsv = (csv: string, year: string): Question[] => {
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
      const subjectName = SUBJECT_MAP[subjectCode];
      if (!subjectName) return null;
      return {
        id: `ares-${year}-${problemNo}-${subId}`,
        subject: subjectName,
        unit: '○×問題',
        question: stem,
        choices: ['TRUE', 'FALSE'],
        answer: correct === 'TRUE' ? 0 : 1,
        explanation,
      } as Question;
    })
    .filter((q): q is Question => q !== null);
};

const ares2023Questions = parseAresCsv(ares2023Csv, '2023');
const ares2024Questions = parseAresCsv(ares2024Csv, '2024');

export const aresQuestions = [...ares2023Questions, ...ares2024Questions];

export const subjects: Subject[] = Object.entries(SUBJECT_MAP).map(([code, name]) => {
  const questions = aresQuestions.filter((q) => q.subject === name);
  return {
    id: `ares-${code}`,
    name,
    description: `${name}の○×問題`,
    units: [
      {
        id: `ares-${code}-unit`,
        name: '○×問題',
        description: `${name}の全問題`,
        subjectId: `ares-${code}`,
        questions,
        dueCards: 0,
        newCards: questions.length,
      },
    ],
    totalQuestions: questions.length,
    completedQuestions: 0,
  } as Subject;
});

