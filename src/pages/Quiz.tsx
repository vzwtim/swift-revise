import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { allQuestions } from "@/data/questions";

import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";

import { SpacedRepetitionScheduler } from "@/lib/scheduler";
import { UserAnswer, Card, Question, Unit } from "@/lib/types";
import { ArrowLeft, RotateCcw, Home } from "lucide-react";
import { saveAnswerLog } from "@/lib/answer-history";
import { initializeCards, buildQuizQuestions } from "@/lib/quiz-builder";

import {
  getIncompleteQuiz,
  saveIncompleteQuiz,
  clearIncompleteQuiz,
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
  const [unit, setUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showNoUnitsError, setShowNoUnitsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean } | null>(null);

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [incompleteSession, setIncompleteSession] = useState<{ questionIds: number[], currentIndex: number } | null>(null);


  useEffect(() => {
    if (!unitId) return;

    const initializeQuiz = async () => {
      setIsLoading(true);

      const allCards = await loadAllCards();
      const { currentCardsMap, newCardsToSave } = await initializeCards(allCards);
      if (newCardsToSave.length > 0) {
        await saveCards(newCardsToSave);
      }
      setCards(currentCardsMap);

      // 外部から再開情報が渡された場合 (e.g. Subjectページから)
      const resumeFromState = location.state?.incompleteQuiz;
      if (resumeFromState) {
        const restoredQuestions = resumeFromState.questionIds
          .map((id: number) => allQuestions.find(q => q.id === id))
          .filter((q?: Question): q is Question => !!q);
        
        if (restoredQuestions.length > 0) {
          setQuestions(restoredQuestions);
          setCurrentQuestionIndex(resumeFromState.currentIndex);
          const { pageTitle, pageDescription } = buildQuizQuestions(unitId, location.search, currentCardsMap);
          setUnit({ id: unitId, name: pageTitle, description: pageDescription, subjectId: "", questions: restoredQuestions, dueCards: 0, newCards: 0 });
          setIsLoading(false);
          // stateをクリア
          navigate(location.pathname, { replace: true, state: {} });
          return;
        }
      }

      // localStorageに中断データがあるか確認
      const savedSession = getIncompleteQuiz(unitId);
      if (savedSession && savedSession.questionIds.length > 0) {
        setIncompleteSession(savedSession);
        setShowResumePrompt(true);
        setIsLoading(false);
        return;
      }

      // 新規クイズ作成
      const { questionsToShow, pageTitle, pageDescription, showNoUnitsError } = buildQuizQuestions(unitId, location.search, currentCardsMap);
      if (showNoUnitsError) {
        setShowNoUnitsError(true);
        setIsLoading(false);
        return;
      }
      setUnit({ id: unitId, name: pageTitle, description: pageDescription, subjectId: "", questions: questionsToShow, dueCards: 0, newCards: questionsToShow.length });
      setQuestions(questionsToShow);
      setCurrentQuestionIndex(0);
      setIsLoading(false);
    };

    initializeQuiz();
  }, [unitId, location.search]);

  useEffect(() => {
    if (questions.length > 0 && Object.keys(cards).length > 0) {
      const card = cards[questions[currentQuestionIndex]?.id];
      setCurrentCard(card || null);
    }
  }, [currentQuestionIndex, questions, cards]);

  useEffect(() => {
    if (feedback?.show) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 1000); // 1秒後に非表示
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleAnswer = async (answer: number, timeSpent: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;
    setFeedback({ show: true, correct: isCorrect });

    const grade = SpacedRepetitionScheduler.calculateGrade({ questionId: currentQuestion.id, answer, timeSpent, isCorrect, grade: 0 });
    const userAnswer: UserAnswer = { questionId: currentQuestion.id, answer, timeSpent, isCorrect, grade };

    setAnswers((prev) => [...prev, userAnswer]);
    setShowResult(true);
    void saveAnswerLog(userAnswer, currentQuestion, sessionId);

    const originalCard = cards[currentQuestion.id];
    if (originalCard) {
      let updatedCard = { ...originalCard };
      updatedCard.total_count += 1;
      if (isCorrect) {
        updatedCard.correct_count += 1;
      }

      updatedCard = SpacedRepetitionScheduler.scheduleCard(updatedCard, grade);

      setCards((prev) => ({ ...prev, [currentQuestion.id]: updatedCard }));

      await saveCards([updatedCard]);
    }
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      setIsComplete(true);
      if (unitId) clearIncompleteQuiz(unitId);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setShowResult(false);
      if (unitId) {
        const questionIds = questions.map(q => q.id);
        saveIncompleteQuiz(unitId, questionIds, nextIndex);
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setIsComplete(false);
    if (unitId) clearIncompleteQuiz(unitId);
  };

  const handleFinish = () => {
    if (unitId) clearIncompleteQuiz(unitId);
    const score = answers.length > 0 ? Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100) : 0;
    navigate(
      `/result?score=${score}&total=${questions.length}&correct=${answers.filter((a) => a.isCorrect).length}`,
      { state: { questions, answers } }
    );
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
    // デバッグ情報を収集
    const searchParams = new URLSearchParams(location.search);
    const levelsParam = searchParams.get("levels");
    const selectedLevels = levelsParam ? levelsParam.split(",") : [];
    const debugInfo = {
      message: "デバッグ情報。この内容をコピーして開発者に送ってください。",
      timestamp: new Date().toISOString(),
      unitId,
      locationSearch: location.search,
      levelsParam,
      selectedLevels,
      allCardsFromState: cards,
      numberOfCards: Object.keys(cards).length,
      questionsLength: questions.length,
      unitExists: !!unit,
    };

    return (
      <div className="min-h-screen gradient-learning p-4 sm:p-8 text-white">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">クイズが見つかりません</h1>
          <p className="text-slate-300 mb-4">選択したレベルの問題がないか、単元が見つかりませんでした。</p>
          <Button onClick={() => navigate('/')} variant="secondary">ホームに戻る</Button>
          <div className="mt-6 p-4 bg-black/60 rounded-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-2 text-yellow-300">デバッグ情報</h2>
            <p className="text-sm text-slate-400 mb-4">問題解決のため、以下の内容をコピーして開発者にお知らせください。</p>
            <pre className="text-xs whitespace-pre-wrap break-all p-3 bg-slate-900 rounded-md">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (showResumePrompt && incompleteSession) {
    return (
      <div className="min-h-screen gradient-learning flex items-center justify-center">
        <div className="text-center space-y-6 p-6 bg-background/80 backdrop-blur-sm rounded-xl border card-elevated">
          <div>
            <h2 className="text-2xl font-bold mb-2">前回の続きから</h2>
            <p className="text-muted-foreground">中断したクイズがあります。</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button
              className="gradient-primary"
              onClick={() => {
                const restoredQuestions = incompleteSession.questionIds
                  .map(id => allQuestions.find(q => q.id === id))
                  .filter((q): q is Question => !!q);
                
                if (restoredQuestions.length > 0) {
                    setQuestions(restoredQuestions);
                    setCurrentQuestionIndex(incompleteSession.currentIndex);
                    const { pageTitle, pageDescription } = buildQuizQuestions(unitId!, location.search, cards);
                    setUnit({ id: unitId!, name: pageTitle, description: pageDescription, subjectId: "", questions: restoredQuestions, dueCards: 0, newCards: 0 });
                }
                setShowResumePrompt(false);
                setIncompleteSession(null);
              }}
            >
              続きから ({incompleteSession.currentIndex + 1}問目)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (unitId) clearIncompleteQuiz(unitId);
                setShowResumePrompt(false);
                setIncompleteSession(null);
                // 新規クイズ作成をトリガー
                const { questionsToShow, pageTitle, pageDescription } = buildQuizQuestions(unitId!, location.search, cards);
                setUnit({ id: unitId!, name: pageTitle, description: pageDescription, subjectId: "", questions: questionsToShow, dueCards: 0, newCards: questionsToShow.length });
                setQuestions(questionsToShow);
                setCurrentQuestionIndex(0);
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
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

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
