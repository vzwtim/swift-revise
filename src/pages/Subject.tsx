import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UnitCard } from "@/components/unit-card";
import { Button } from "@/components/ui/button";
import { MasteryPieChart } from "@/components/mastery-pie-chart";
import { subjects } from "@/data/questions";
import { ArrowLeft, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getAllQuestionStats } from "@/lib/answer-stats";
import { loadAllCards } from "@/lib/card-storage";
import { QuizSettingsDialog } from "@/components/quiz-settings-dialog";
import { MasteryLevel } from "@/lib/types";

export default function Subject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quizTarget, setQuizTarget] = useState({ id: '', title: '', description: '' });

  const handleOpenSettings = (targetId: string, title: string, description: string) => {
    setQuizTarget({ id: targetId, title, description });
    setIsSettingsOpen(true);
  };
  
  const subject = subjects.find(s => s.id === id);
  
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

  const allCards = loadAllCards();

  // --- Chart Logic Start ---
  const subjectQuestionIds = new Set(
    subject.units.flatMap((u) => u.questions.map((q) => q.id))
  );
  const subjectCards = Object.values(allCards).filter((c) =>
    subjectQuestionIds.has(c.questionId)
  );

  const progressCounts = {
    Perfect: subjectCards.filter((c) => c.masteryLevel === "Perfect").length,
    Great: subjectCards.filter((c) => c.masteryLevel === "Great").length,
    Good: subjectCards.filter((c) => c.masteryLevel === "Good").length,
    Bad: subjectCards.filter((c) => c.masteryLevel === "Bad").length,
    Miss: subjectCards.filter((c) => c.masteryLevel === "Miss").length,
    New: subjectCards.filter((c) => c.masteryLevel === "New").length,
  };

  const chartData = [
    {
      name: subject.name,
      Perfect: progressCounts.Perfect,
      Great: progressCounts.Great,
      Good: progressCounts.Good,
      Bad: progressCounts.Bad,
      Miss: progressCounts.Miss,
      New: progressCounts.New,
    },
  ];

  const chartConfig = {
    Perfect: { label: "Perfect", color: "#22c55e" }, // green-500
    Great: { label: "Great", color: "#3b82f6" }, // blue-500
    Good: { label: "Good", color: "#facc15" }, // yellow-400
    Bad: { label: "Bad", color: "#f97316" }, // orange-500
    Miss: { label: "Miss", color: "#ef4444" }, // red-500
    New: { label: "New", color: "#a1a1aa" }, // zinc-400
  };
  // --- Chart Logic End ---

  const totalDueCards = (progressCounts.Bad || 0) + (progressCounts.Miss || 0);
  const totalNewCards = progressCounts.New || 0;

  const handleStartQuiz = (unitId: string) => {
    const unit = subject?.units.find(u => u.id === unitId);
    if (!unit) return;
    handleOpenSettings(
      unit.id,
      `${unit.name} のクイズ`,
      '出題範囲の習熟度を選択してください。'
    );
  };

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
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
        {/* 進捗統計 */}
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
            {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((key) => {
              const value = progressCounts[key];
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
            {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: chartConfig[key].color }}
                />
                <div>
                  <span className="font-medium">{chartConfig[key].label}</span>
                  <span className="text-muted-foreground ml-1.5">
                    ({progressCounts[key]})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 単元一覧 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">学習単元</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subject.units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onStartQuiz={handleStartQuiz}
              />
            ))}
          </div>
        </div>

        {/* 復習推奨 */}
        {totalDueCards > 0 && (
          <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Items to Review</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {totalDueCards} cards are due for review. It's recommended to review them now to strengthen your memory.
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleOpenSettings(
                `review-${subject.id}`,
                `${subject.name} の復習`,
                'この分野の復習対象問題から、選択した習熟度の問題が出題されます。'
              )}
            >
              Start Review
            </Button>
          </div>
        )}
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