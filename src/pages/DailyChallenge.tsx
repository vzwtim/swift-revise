import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { subjects } from "@/data/questions";
import { UserAnswer, Question } from "@/lib/types";
import { ArrowLeft, RotateCcw, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Function to get 10 random questions from selected categories
const getDailyQuestions = (studyingCategories: string[] | undefined | null): Question[] => {
  const filteredSubjects = studyingCategories && studyingCategories.length > 0
    ? subjects.filter(s => studyingCategories.includes(s.category))
    : subjects; // Fallback to all subjects if none are selected

  const allQuestions = filteredSubjects.flatMap((s) => s.units.flatMap((u) => u.questions));
  
  if (allQuestions.length === 0) {
    return [];
  }

  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
};

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  useEffect(() => {
    // Wait for profile to be loaded
    if (!authLoading) {
      setQuestions(getDailyQuestions(profile?.studying_categories));
      setStartTime(Date.now());
    }
  }, [authLoading, profile]);

  const handleAnswer = (answer: number, timeSpent: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;
    const userAnswer: UserAnswer = { questionId: currentQuestion.id, answer, timeSpent, isCorrect, grade: 0 };

    setAnswers((prev) => [...prev, userAnswer]);
    setShowResult(true);
  };

  const handleNext = async () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - (startTime || endTime)) / 1000);
      setTotalTime(timeTaken);
      setIsComplete(true);
      if (user) {
        await saveResult(timeTaken);
      }
    } else {
      setCurrentQuestionIndex(nextIndex);
      setShowResult(false);
    }
  };

  const saveResult = async (timeTaken: number) => {
    if (!user) return;

    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const { error } = await supabase.from('daily_challenge_results').insert({
      user_id: user.id,
      score: correctAnswers,
      time_taken: timeTaken,
    });

    if (error) {
      console.error('Error saving daily challenge result:', error);
    }
  };

  const handleRestart = () => {
    setQuestions(getDailyQuestions(profile?.studying_categories));
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setIsComplete(false);
    setStartTime(Date.now());
  };

  if (authLoading) {
    return <p>Loading...</p>; // Or a proper skeleton loader
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen gradient-learning flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-2">問題が見つかりません</h2>
          <p className="text-muted-foreground mb-6">
            {profile 
              ? "選択中の学習カテゴリに問題がありません。プロフィール設定からカテゴリを変更してください。"
              : "出題できる問題がありません。ログインすると、学習中の資格に合わせた問題が出題されます。"
            }
          </p>
          {profile ? (
            <Button onClick={() => navigate('/profile')} className="w-full max-w-xs gradient-primary">プロフィール設定に移動</Button>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <Button onClick={() => navigate('/auth')} className="w-full max-w-xs gradient-primary">
                <LogIn className="mr-2 h-4 w-4" />
                ログインしてカテゴリを設定
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full max-w-xs">ホームに戻る</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isComplete) {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    return (
      <div className="min-h-screen gradient-learning flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center p-8 bg-background/80 backdrop-blur-sm rounded-xl border card-elevated">
            <h2 className="text-2xl font-bold mb-2">チャレンジ完了！</h2>
            <p>正解数: {correctAnswers} / {questions.length}</p>
            <p>タイム: {totalTime}秒</p>
            <div className="space-y-3 mt-6">
              <Button onClick={() => navigate('/')} className="w-full gradient-primary">ホームに戻る</Button>
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
              <h1 className="text-lg font-semibold">今日の10問</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-32">
        {currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            showResult={showResult}
            selectedAnswer={showResult ? answers[answers.length - 1]?.answer : undefined}
            lastResult={answers[answers.length - 1]?.isCorrect}
          />
        ) : (
          <p>問題の読み込み中...</p>
        )}
        
        {showResult && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t z-50">
            <div className="container mx-auto px-4">
              <Button onClick={handleNext} size="lg" className="w-full gradient-primary">
                {currentQuestionIndex + 1 >= questions.length ? "結果を見る" : "次の問題"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}