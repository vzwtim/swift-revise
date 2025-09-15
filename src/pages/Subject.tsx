import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getIncompleteQuiz, clearIncompleteQuiz } from "@/lib/quiz-progress";
import { UnitCard } from "@/components/unit-card";
import { Button } from "@/components/ui/button";
import { MasteryPieChart } from "@/components/mastery-pie-chart";
import { subjects } from "@/data/questions";
import { ArrowLeft, Zap } from "lucide-react";
import { loadAllCards } from "@/lib/card-storage";
import { QuizSettingsDialog } from "@/components/quiz-settings-dialog";
import { Card as CardType, MasteryLevel } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function Subject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  

  const [cards, setCards] = useState<{ [questionId: string]: CardType }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quizTarget, setQuizTarget] = useState({ id: '', title: '', description: '' });
  const [incompleteSessions, setIncompleteSessions] = useState<Record<string, { questionIds: number[], currentIndex: number } | null>>({});

  

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const loadedCards = await loadAllCards();
      setCards(loadedCards);

      const currentSubject = subjects.find((s) => s.id === id);
      if (currentSubject) {
        const sessions: Record<string, any> = {};
        currentSubject.units.forEach(unit => {
          const session = getIncompleteQuiz(unit.id);
          if (session) {
            sessions[unit.id] = session;
          }
        });
        setIncompleteSessions(sessions);
      }

      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleOpenSettings = (targetId: string, title: string, description: string) => {
    setQuizTarget({ id: targetId, title, description });
    setIsSettingsOpen(true);
  };

  const subject = subjects.find((s) => s.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-learning p-4 sm:p-8">
        <header className="container mx-auto"><Skeleton className="h-10 w-48" /></header>
        <main className="container mx-auto mt-8 space-y-8">
          <Skeleton className="w-full h-48" />
          <Skeleton className="w-full h-64" />
        </main>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">科目が見つかりません</h1>
          <Button onClick={() => navigate('/')}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  const subjectQuestionIds = new Set(
    subject.units.flatMap((u) => u.questions.map((q) => q.id))
  );
  const subjectCards = Object.values(cards).filter((c) =>
    subjectQuestionIds.has(c.questionId)
  );

  const MASTERY_ORDER: MasteryLevel[] = ['Perfect', 'Great', 'Good', 'Bad', 'Miss', 'New'];

  const progressCounts: Partial<Record<MasteryLevel, number>> = {};
  MASTERY_ORDER.forEach(level => {
    progressCounts[level] = subjectCards.filter(c => c.masteryLevel === level).length;
  });

  const chartConfig = {
    Perfect: { label: "Perfect", color: "#22c55e" },
    Great: { label: "Great", color: "#3b82f6" },
    Good: { label: "Good", color: "#facc15" },
    Bad: { label: "Bad", color: "#f97316" },
    Miss: { label: "Miss", color: "#ef4444" },
    New: { label: "New", color: "#a1a1aa" },
  };

  const handleStartQuiz = (unitId: string) => {
    // 中断セッションがあったらクリアする
    clearIncompleteQuiz(unitId);
    setIncompleteSessions(prev => ({ ...prev, [unitId]: null }));

    const unit = subject?.units.find((u) => u.id === unitId);
    if (!unit) return;
    handleOpenSettings(
      unit.id,
      `${unit.name} のクイズ`,
      "出題範囲の習熟度を選択してください。"
    );
  };

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{subject.name}</h1>
              <p className="text-sm text-muted-foreground">{subject.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 p-6 bg-background/60 backdrop-blur-sm rounded-xl border card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">学習進捗</h2>
            <MasteryPieChart
              progressCounts={progressCounts}
              totalQuestions={subject.totalQuestions}
              size={60}
            />
          </div>
          <div className="h-8 w-full rounded-full overflow-hidden flex">
            {MASTERY_ORDER.map((key) => {
              const value = progressCounts[key] ?? 0;
              if (value === 0) return null;
              const percentage = (value / subject.totalQuestions) * 100;
              return (
                <div
                  key={key}
                  className="h-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: chartConfig[key].color,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
            {MASTERY_ORDER.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: chartConfig[key].color }}
                />
                <div>
                  <span className="font-medium">{chartConfig[key].label}</span>
                  <span className="text-muted-foreground ml-1.5">
                    ({progressCounts[key] ?? 0})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">学習単元</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {subject.units.map((unit) => {
              const incompleteQuiz = incompleteSessions[unit.id];
              return (
                <div key={unit.id} className="flex flex-col gap-2">
                  <div className="flex-grow">
                    <UnitCard unit={unit} onStartQuiz={handleStartQuiz} />
                  </div>
                  {incompleteQuiz && (
                    <Button
                      className="w-full gradient-primary-light animate-pulse-slow"
                      onClick={() => navigate(`/quiz/${unit.id}`, { state: { incompleteQuiz } })}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      続きから ({incompleteQuiz.currentIndex + 1}問目)
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
      <QuizSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        targetId={quizTarget.id}
        title={quizTarget.title}
        description={quizTarget.description}
      />
    </div>
  );
}
