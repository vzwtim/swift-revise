import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { subjects } from "@/data/questions";
import { SpacedRepetitionScheduler } from "@/lib/scheduler";
import { UserAnswer, Card, Question } from "@/lib/types";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { saveAnswerHistory } from "@/lib/answer-history";
import {
  updateQuestionStats,
  getQuestionStats,
  getLowAccuracyQuestionIds,
} from "@/lib/answer-stats";

export default function Quiz() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Find unit and questions or handle review-all case
  let unit, questions;
  
  if (unitId === 'review-all') {
    // 一括復習: 正答率が低い問題のみを収集
    const allQuestions = subjects.flatMap(s => s.units.flatMap(u => u.questions));
    const lowIds = new Set(getLowAccuracyQuestionIds());
    const reviewQuestions = allQuestions.filter(q => lowIds.has(q.id));

    unit = {
      id: 'review-all',
      name: '一括復習',
      description: 'すべての単元の復習対象問題',
      subjectId: 'all'
    };
    questions = reviewQuestions;
  } else {
    // 通常の単元別クイズ。正答率が低い問題を優先して出題
    unit = subjects
      .flatMap(s => s.units)
      .find(u => u.id === unitId);
    const lowIds = new Set(getLowAccuracyQuestionIds());
    questions = (unit?.questions || []).slice().sort((a, b) => {
      const aLow = lowIds.has(a.id);
      const bLow = lowIds.has(b.id);
      return aLow === bLow ? 0 : aLow ? -1 : 1;
    });
  }
  
  useEffect(() => {
    if (questions.length > 0) {
      // Initialize cards for questions
      const initialCards = questions.map(q => 
        SpacedRepetitionScheduler.createNewCard(q.id)
      );
      setCards(initialCards);
    }
  }, [questions.length]);

  if (!unit || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-learning">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">クイズが見つかりません</h1>
          <Button onClick={() => navigate('/')}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentStats = getQuestionStats(currentQuestion.id);

  const handleAnswer = (answer: number, timeSpent: number) => {
    const isCorrect = answer === currentQuestion.answer;
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer,
      timeSpent,
      isCorrect,
      grade: SpacedRepetitionScheduler.calculateGrade({
        questionId: currentQuestion.id,
        answer,
        timeSpent,
        isCorrect,
        grade: 0
      })
    };

    setAnswers(prev => [...prev, userAnswer]);
    setShowResult(true);
    void saveAnswerHistory(sessionId, userAnswer);
    updateQuestionStats(currentQuestion.id, isCorrect);

    // Update card with spaced repetition
    const cardIndex = cards.findIndex(c => c.questionId === currentQuestion.id);
    if (cardIndex !== -1) {
      const updatedCard = SpacedRepetitionScheduler.scheduleCard(
        cards[cardIndex], 
        userAnswer.grade
      );
      setCards(prev => {
        const newCards = [...prev];
        newCards[cardIndex] = updatedCard;
        return newCards;
      });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      setIsComplete(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setIsComplete(false);
  };

  const handleFinish = () => {
    const score = Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100);
    navigate(`/result?score=${score}&total=${questions.length}&correct=${answers.filter(a => a.isCorrect).length}`);
  };

  if (isComplete) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / answers.length) * 100);

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
                  {SpacedRepetitionScheduler.getNextReviewDate(cards) 
                    ? new Date(SpacedRepetitionScheduler.getNextReviewDate(cards)!).toLocaleDateString()
                    : "なし"
                  }
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleFinish}
                className="w-full gradient-primary"
              >
                結果を詳しく見る
              </Button>
              <Button 
                onClick={handleRestart}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                もう一度挑戦
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{unit.name}</h1>
              <p className="text-sm text-muted-foreground">クイズモード</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <QuizCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={showResult ? answers[answers.length - 1]?.answer : undefined}
          lastResult={currentStats?.lastResult}
        />
        
        {showResult && (
          <>
            <div className="text-center mt-8 hidden sm:block">
              <Button
                onClick={handleNext}
                size="lg"
                className="gradient-primary"
              >
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
            <div className="sm:hidden fixed bottom-4 left-0 right-0 px-4">
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full gradient-primary"
              >
                {currentQuestionIndex + 1 >= questions.length ? "完了" : "次の問題"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}