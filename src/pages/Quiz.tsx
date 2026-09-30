import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { SpacedRepetitionScheduler } from "@/lib/scheduler";
import { UserAnswer, Card, Question, Unit } from "@/lib/types";
import { ArrowLeft, RotateCcw, Home, Loader2, Crown, LockKeyhole } from "lucide-react";
import { saveAnswerLog } from "@/lib/answer-history";
import { buildQuizQuestions } from "@/lib/quiz-builder";
import {
  getLastQuestionIndex,
  saveLastQuestionIndex,
  clearLastQuestionIndex,
} from "@/lib/quiz-progress";
import { saveCards } from "@/lib/card-storage";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor, getMasteryLevelName } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { FREE_QUESTIONS_PER_SUBJECT, limitQuestionsForFreePlan } from "@/lib/access";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Quiz() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, cards: globalCards, isCardsLoading, updateCards } = useAuth();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [localCards, setLocalCards] = useState<{ [questionId: string]: Card }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [unit, setUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fullQuestionCount, setFullQuestionCount] = useState(0);
  const [isFreeLimitApplied, setIsFreeLimitApplied] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyCards, setDirtyCards] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean } | null>(null);

  // Ref to hold the latest state and functions for cleanup effect
  const latestStateRef = useRef({
    user,
    dirtyCards,
    localCards,
    isSaving,
    updateCards,
    saveCards,
  });
  useEffect(() => {
    latestStateRef.current = {
      user,
      dirtyCards,
      localCards,
      isSaving,
      updateCards,
      saveCards,
    };
  }); // No dependency array, runs on every render

  useEffect(() => {
    // This effect runs only on mount and unmount
    return () => {
      // On unmount, save any dirty cards
      const { user, dirtyCards, localCards, isSaving, updateCards, saveCards } = latestStateRef.current;

      if (!user || dirtyCards.size === 0 || isSaving) return;

      const cardsToSave = Array.from(dirtyCards)
        .map((id) => localCards[id])
        .filter((card): card is Card => card !== undefined);

      if (cardsToSave.length > 0) {
        saveCards(cardsToSave)
          .then(() => {
            updateCards(cardsToSave);
          })
          .catch(error => {
            console.error("Failed to save dirty cards on unmount:", error);
          });
      }
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  useEffect(() => {
    if (!isCardsLoading) {
      setLocalCards(globalCards);
    }
  }, [globalCards, isCardsLoading]);

  useEffect(() => {
    // Wait for auth and card loading to finish before setting up the quiz
    if (!unitId || authLoading || isCardsLoading || subscriptionLoading) {
      setIsLoading(true);
      return;
    }

    const setupQuiz = () => {
      setIsLoading(true);
      // Use globalCards to build the initial question list, so it doesn't change during the quiz
      const { questionsToShow: allMatchingQuestions, pageTitle, pageDescription, showNoUnitsError } = buildQuizQuestions(unitId, location.search, globalCards);
      
      if (showNoUnitsError) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const questionsToShow = isPremium ? allMatchingQuestions : limitQuestionsForFreePlan(allMatchingQuestions);
      setFullQuestionCount(allMatchingQuestions.length);
      setIsFreeLimitApplied(questionsToShow.length < allMatchingQuestions.length);
      setUnit({ id: unitId, name: pageTitle, description: pageDescription, subjectId: "", questions: questionsToShow, dueCards: 0, newCards: questionsToShow.length });
      setQuestions(questionsToShow);

      if (questionsToShow.length > 0) {
        if (user) {
          const lastIndex = getLastQuestionIndex(unitId);
          if (lastIndex !== null && lastIndex < questionsToShow.length - 1) {
            setCurrentQuestionIndex(lastIndex + 1);
          } else {
            setCurrentQuestionIndex(0);
          }
        } else {
          setCurrentQuestionIndex(0);
        }
      }
      setIsLoading(false);
    };

    setupQuiz();
    // Depend on globalCards, not localCards, to prevent re-running on answer
  }, [unitId, location.search, user, authLoading, isCardsLoading, globalCards, isPremium, subscriptionLoading]);

  useEffect(() => {
    if (feedback?.show) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const saveDirtyCards = async () => {
    if (!user || dirtyCards.size === 0 || isSaving) return;

    setIsSaving(true);
    const cardsToSave = Array.from(dirtyCards)
      .map((id) => localCards[id])
      .filter((card): card is Card => card !== undefined);

    if (cardsToSave.length > 0) {
      try {
        await saveCards(cardsToSave);
        updateCards(cardsToSave); // Update global state
        setDirtyCards(new Set());
      } catch (error) {
        console.error("Failed to save dirty cards:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
    }
  };

  const handleAnswer = async (answer: number, timeSpent: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;
    setFeedback({ show: true, correct: isCorrect });

    const userAnswer: UserAnswer = { 
      questionId: currentQuestion.id, 
      answer, 
      timeSpent, 
      isCorrect, 
      grade: 0
    };

    const grade = SpacedRepetitionScheduler.calculateGrade(userAnswer);

    setAnswers((prev) => [...prev, { ...userAnswer, grade: grade }]);
    setShowResult(true);

    if (user) {
      try {
        await saveAnswerLog({ ...userAnswer, grade: grade }, currentQuestion, sessionId);
        const originalCard = localCards[currentQuestion.id];
        if (originalCard) {
          let updatedCard = { ...originalCard };
          updatedCard.total_count += 1;
          if (isCorrect) {
            updatedCard.correct_count += 1;
          }
          updatedCard = SpacedRepetitionScheduler.scheduleCard(updatedCard, grade);
          setLocalCards((prev) => ({ ...prev, [currentQuestion.id]: updatedCard }));
          setDirtyCards((prev) => new Set(prev).add(currentQuestion.id));
        }
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    }
  };

  const handleNext = async () => {
    if (user && unitId) {
      saveLastQuestionIndex(unitId, currentQuestionIndex);
    }
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      await saveDirtyCards();
      setIsComplete(true);
      if (user && unitId) clearLastQuestionIndex(unitId);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    if (user && unitId) clearLastQuestionIndex(unitId);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setIsComplete(false);
  };

  const handleFinish = () => {
    saveDirtyCards();
    if (user && unitId) clearLastQuestionIndex(unitId);
    const score = answers.length > 0 ? Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100) : 0;
    navigate(
      `/result?score=${score}&total=${questions.length}&correct=${answers.filter((a) => a.isCorrect).length}`,
      { state: { questions, answers } }
    );
  };

  const handleQuestionSelect = (value: string) => {
    const newIndex = parseInt(value, 10);
    if (!isNaN(newIndex)) {
      if (user && unitId) {
        clearLastQuestionIndex(unitId);
      }
      setCurrentQuestionIndex(newIndex);
      setShowResult(false);
    }
  };

  if (authLoading || isCardsLoading || subscriptionLoading || isLoading) {
    return (
      <div className="min-h-screen gradient-learning p-4 sm:p-8">
        <header className="container mx-auto"><Skeleton className="h-10 w-24" /></header>
        <main className="container mx-auto mt-8">
          <Skeleton className="w-full h-[60vh]" />
        </main>
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
                  {SpacedRepetitionScheduler.getNextReviewDate(Object.values(localCards)) 
                    ? new Date(SpacedRepetitionScheduler.getNextReviewDate(Object.values(localCards))!).toLocaleDateString()
                    : "なし"
                  }
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleFinish} className="w-full gradient-primary" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                結果を詳しく見る
              </Button>
              <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                もう一度挑戦
              </Button>
              {isFreeLimitApplied && (
                <Button onClick={() => navigate('/billing')} className="w-full gap-2">
                  <Crown className="h-4 w-4" />
                  残り{Math.max(fullQuestionCount - questions.length, 0)}問を解放
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="secondary" className="w-full gap-2">
                <Home className="h-4 w-4" />
                ホームに戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentCard = currentQuestion ? localCards[currentQuestion.id] : null;

  return (
    <div className="min-h-screen gradient-learning">
      {feedback?.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`text-9xl font-bold animate-pop-out ${feedback.correct ? 'text-green-400' : 'text-red-500'}`}>
            {feedback.correct ? '○' : '×'}
          </div>
        </div>
      )}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{unit?.name}</h1>
              <p className="text-sm text-muted-foreground">{unit?.description}</p>
            </div>
            {!isPremium && (
              <Badge variant="outline" className="hidden sm:flex gap-1 whitespace-nowrap">
                <LockKeyhole className="h-3 w-3" />無料 各科目{FREE_QUESTIONS_PER_SUBJECT}問
              </Badge>
            )}
            {questions.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={String(currentQuestionIndex)} onValueChange={handleQuestionSelect}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="問題を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {questions.map((question, index) => {
                      const card = localCards[question.id];
                      const masteryLevel = card?.masteryLevel || 'New';
                      return (
                        <SelectItem key={index} value={String(index)}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <span className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(masteryLevel)}`}></span>
                              <span>{index + 1} 問目</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{getMasteryLevelName(masteryLevel)}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            masteryLevel={currentCard?.masteryLevel}
          />
        ) : (
          <p>問題の読み込み中...</p>
        )}
        
        {showResult && (
          <>
            <div className="text-center mt-8 hidden sm:block">
              <Button onClick={handleNext} size="lg" className="gradient-primary" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
            <div className="sm:hidden fixed bottom-4 left-0 right-0 px-4">
              <Button onClick={handleNext} size="lg" className="w-full gradient-primary" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
