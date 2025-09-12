import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { subjects } from "@/data/questions";
import { SpacedRepetitionScheduler } from "@/lib/scheduler";
import { UserAnswer, Card, Question, Unit, MasteryLevel } from "@/lib/types";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { saveAnswerHistory } from "@/lib/answer-history";
import { recordDailyAnswer } from "@/lib/answer-stats";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
} from "@/lib/quiz-progress";
import { loadAllCards, saveCards } from "@/lib/card-storage";
import { Skeleton } from "@/components/ui/skeleton";

export default function Quiz() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [cards, setCards] = useState<{ [questionId: string]: Card }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [resumePrompt, setResumePrompt] = useState(false);
  const [savedIndex, setSavedIndex] = useState(0);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showNoUnitsError, setShowNoUnitsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  

  useEffect(() => {
    if (!unitId) return;

    const fetchData = async () => {
      setIsLoading(true);
      const allCards = await loadAllCards();
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

      if (newCardsToSave.length > 0) {
        await saveCards(newCardsToSave);
      }
      setCards(currentCardsMap);

      const searchParams = new URLSearchParams(location.search);
      const levelsParam = searchParams.get("levels");
      const selectedLevels: MasteryLevel[] = levelsParam
        ? (levelsParam.split(",") as MasteryLevel[])
        : ["Great", "Good", "Bad", "Miss", "New"];

      const unitsParam = searchParams.get("units");
      const selectedUnitIds: string[] = unitsParam ? unitsParam.split(",") : [];

      const filterByLevel = (q: Question): boolean => {
        const card = currentCardsMap[q.id];
        const level = card?.masteryLevel || "New";
        return selectedLevels.includes(level);
      };

      let questionsToShow: Question[] = [];
      let pageTitle = "";
      let pageDescription = "";

      if (unitId === "bulk-study") {
        if (selectedUnitIds.length === 0) {
          setShowNoUnitsError(true);
          setIsLoading(false);
          return;
        }
        const allQuestions = subjects.flatMap((s) =>
          s.units.flatMap((u) => u.questions.map((q) => ({ q, unitId: u.id })))
        );
        questionsToShow = allQuestions
          .filter(({ q, unitId: qUnitId }) => selectedUnitIds.includes(qUnitId))
          .map(({ q }) => q)
          .filter(filterByLevel);
        pageTitle = "まとめて学習";
        pageDescription = "選択した単元の問題";
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

      setUnit({
        id: unitId,
        name: pageTitle,
        description: pageDescription,
        subjectId: "",
        questions: questionsToShow,
        dueCards: 0,
        newCards: questionsToShow.length,
      });
      setQuestions(questionsToShow);

      if (!unitId.startsWith("review-")) {
        const saved = getQuizProgress(unitId);
        if (saved > 0 && saved < questionsToShow.length) {
          setResumePrompt(true);
          setSavedIndex(saved);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [unitId, location.search]);

  useEffect(() => {
    if (questions.length > 0 && Object.keys(cards).length > 0) {
      const card = cards[questions[currentQuestionIndex]?.id];
      setCurrentCard(card || null);
    }
  }, [currentQuestionIndex, questions, cards]);

  const handleAnswer = async (answer: number, timeSpent: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;
    const grade = SpacedRepetitionScheduler.calculateGrade({ questionId: currentQuestion.id, answer, timeSpent, isCorrect, grade: 0 });
    const userAnswer: UserAnswer = { questionId: currentQuestion.id, answer, timeSpent, isCorrect, grade };

    setAnswers((prev) => [...prev, userAnswer]);
    setShowResult(true);
    void saveAnswerHistory(sessionId, userAnswer);

    const originalCard = cards[currentQuestion.id];
    if (originalCard) {
      let updatedCard = { ...originalCard };
      updatedCard.total_count += 1;
      if (isCorrect) {
        updatedCard.correct_count += 1;
      }

      updatedCard = SpacedRepetitionScheduler.scheduleCard(updatedCard, grade);

      setCards((prev) => ({ ...prev, [currentQuestion.id]: updatedCard }));
      setCurrentCard(updatedCard);

      await saveCards([updatedCard]);
    }

    saveQuizProgress(unitId!, currentQuestionIndex + 1);
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      setIsComplete(true);
      clearQuizProgress(unitId!);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setShowResult(false);
      saveQuizProgress(unitId!, nextIndex);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setIsComplete(false);
    clearQuizProgress(unitId!);
  };

  const handleFinish = () => {
    const score = answers.length > 0 ? Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100) : 0;
    clearQuizProgress(unitId!);
    navigate(`/result?score=${score}&total=${questions.length}&correct=${answers.filter((a) => a.isCorrect).length}`);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen gradient-learning p-4 sm:p-8">
            <header className="container mx-auto"><Skeleton className="h-10 w-24" /></header>
            <main className="container mx-auto mt-8">
                <Skeleton className="w-full h-[60vh]" />
            </main>
        </div>
    );
  }

  if (showNoUnitsError) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-learning">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">まとめて学習の単元が選択されていません</h1>
          <p className="text-muted-foreground mb-4">まとめて学習を行うには、学習する単元を選択してください。</p>
          <Button onClick={() => navigate('/')}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  if (!unit || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-learning">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">クイズが見つかりません</h1>
          <p className="text-muted-foreground mb-4">選択したレベルの問題がないか、単元が見つかりませんでした。</p>
          <Button onClick={() => navigate('/')}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  if (resumePrompt) {
    return (
      <div className="min-h-screen gradient-learning flex items-center justify-center">
        <div className="text-center space-y-6 p-6 bg-background/80 backdrop-blur-sm rounded-xl border card-elevated">
          <div>
            <h2 className="text-2xl font-bold mb-2">前回の続きから</h2>
            <p className="text-muted-foreground">前回は {savedIndex} 問目まで解答しました。</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button
              className="gradient-primary"
              onClick={() => {
                setCurrentQuestionIndex(savedIndex);
                setShowResult(false);
                setAnswers([]);
                setResumePrompt(false);
              }}
            >
              続きから
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clearQuizProgress(unitId!);
                setCurrentQuestionIndex(0);
                setShowResult(false);
                setAnswers([]);
                setResumePrompt(false);
              }}
            >
              最初から
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0;

    return (
      <div className="min-h-screen gradient-learning flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-xl border card-elevated">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">クイズ完了！</h2>
              <p className="text-muted-foreground">お疲れ様でした</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{score}%</div>
                <div className="text-sm text-muted-foreground">
                  {correctAnswers} / {questions.length} 問正解
                </div>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">次回復習予定</div>
                <div className="text-sm font-medium">
                  {SpacedRepetitionScheduler.getNextReviewDate(Object.values(cards)) 
                    ? new Date(SpacedRepetitionScheduler.getNextReviewDate(Object.values(cards))!).toLocaleDateString()
                    : "なし"
                  }
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleFinish} className="w-full gradient-primary">結果を詳しく見る</Button>
              <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                もう一度挑戦
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{unit?.name}</h1>
              <p className="text-sm text-muted-foreground">{unit?.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            showResult={showResult}
            selectedAnswer={showResult ? answers[answers.length - 1]?.answer : undefined}
            lastResult={lastAnswer?.isCorrect}
            masteryLevel={currentCard?.masteryLevel}
          />
        ) : (
          <p>問題の読み込み中...</p>
        )}
        
        {showResult && (
          <>
            <div className="text-center mt-8 hidden sm:block">
              <Button onClick={handleNext} size="lg" className="gradient-primary">
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
            <div className="sm:hidden fixed bottom-4 left-0 right-0 px-4">
              <Button onClick={handleNext} size="lg" className="w-full gradient-primary">
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}