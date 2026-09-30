import type { Question } from "@/lib/types";

export const FREE_QUESTIONS_PER_SUBJECT = 10;

export function limitQuestionsForFreePlan(questions: Question[], limit = FREE_QUESTIONS_PER_SUBJECT) {
  const counts = new Map<string, number>();
  return questions.filter((question) => {
    const count = counts.get(question.subject) ?? 0;
    if (count >= limit) return false;
    counts.set(question.subject, count + 1);
    return true;
  });
}
