
import { subjects } from "@/data/questions";
import { SpacedRepetitionScheduler } from "@/lib/scheduler";
import { Card, Question, MasteryLevel } from "@/lib/types";

export async function initializeCards(
  allCards: { [questionId: string]: Card }
): Promise<{
  currentCardsMap: { [questionId: string]: Card };
  newCardsToSave: Card[];
}> {
  const currentCardsMap = { ...allCards };
  const allQuestionsForInit = subjects.flatMap((s) =>
    s.units.flatMap((u) => u.questions)
  );
  const newCardsToSave: Card[] = [];
  allQuestionsForInit.forEach((q) => {
    if (!currentCardsMap[q.id]) {
      const newCard = SpacedRepetitionScheduler.createNewCard(q.id);
      currentCardsMap[q.id] = newCard;
      newCardsToSave.push(newCard);
    }
  });
  return { currentCardsMap, newCardsToSave };
}

export function buildQuizQuestions(
  unitId: string,
  locationSearch: string,
  allCards: { [questionId: string]: Card }
): {
  questionsToShow: Question[];
  pageTitle: string;
  pageDescription: string;
  showNoUnitsError: boolean;
} {
  const searchParams = new URLSearchParams(locationSearch);
  const levelsParam = searchParams.get("levels");
  
  // If levels=all is passed, or no levels are specified, don't filter by level.
  const shouldFilterByLevel = levelsParam && levelsParam !== 'all';

  const selectedLevels: MasteryLevel[] = levelsParam
    ? (levelsParam.split(",") as MasteryLevel[])
    : []; // Default to empty, filtering is skipped anyway if param is missing

  const filterByLevel = (q: Question): boolean => {
    if (!shouldFilterByLevel) {
      return true; // Skip filtering
    }
    const card = allCards[q.id];
    const level = card?.masteryLevel || "New";
    return selectedLevels.includes(level);
  };

  let questionsToShow: Question[] = [];
  let pageTitle = "";
  let pageDescription = "";
  let showNoUnitsError = false;

  if (unitId === "bulk-study") {
    if (selectedUnitIds.length === 0) {
      showNoUnitsError = true;
    } else {
      const allQuestions = subjects.flatMap((s) =>
        s.units.flatMap((u) => u.questions.map((q) => ({ q, unitId: u.id })))
      );
      questionsToShow = allQuestions
        .filter(({ unitId: qUnitId }) => selectedUnitIds.includes(qUnitId))
        .map(({ q }) => q)
        .filter(filterByLevel);
      pageTitle = "まとめて学習";
      pageDescription = "選択した単元の問題";
    }
  } else if (unitId === "review-all") {
    const allQuestions = subjects.flatMap((s) =>
      s.units.flatMap((u) => u.questions)
    );
    questionsToShow = allQuestions.filter(filterByLevel);
    pageTitle = "まとめて学習";
    pageDescription = "選択した習熟度の問題";
  } else if (unitId.startsWith("review-")) {
    const subjectId = unitId.replace("review-", "");
    const foundSubject = subjects.find((s) => s.id === subjectId);
    if (foundSubject) {
      const subjectQuestions = foundSubject.units.flatMap((u) => u.questions);
      questionsToShow = subjectQuestions.filter(filterByLevel);
      pageTitle = `${foundSubject.name} の復習`;
      pageDescription = "選択した習熟度の問題";
    }
  } else {
    const foundUnit = subjects
      .flatMap((s) => s.units)
      .find((u) => u.id === unitId);
    if (foundUnit) {
      questionsToShow = [...foundUnit.questions]
        .filter(filterByLevel)
        .sort((a, b) => {
          const cardA = allCards[a.id];
          const cardB = allCards[b.id];
          const needsReviewA = cardA?.needsReview ?? true;
          const needsReviewB = cardB?.needsReview ?? true;
          if (needsReviewA === needsReviewB) return 0;
          return needsReviewA ? -1 : 1;
        });
      pageTitle = foundUnit.name;
      pageDescription = "クイズモード";
    }
  }

  return { questionsToShow, pageTitle, pageDescription, showNoUnitsError };
}
