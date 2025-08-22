import { useParams, useNavigate } from "react-router-dom";
import { UnitCard } from "@/components/unit-card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { subjects } from "@/data/questions";
import { ArrowLeft, BookOpen, Clock, CheckCircle2 } from "lucide-react";

export default function Subject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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

  const completionRate = Math.round((subject.completedQuestions / subject.totalQuestions) * 100);
  const totalDueCards = subject.units.reduce((sum, unit) => sum + unit.dueCards, 0);
  const totalNewCards = subject.units.reduce((sum, unit) => sum + unit.newCards, 0);

  const handleStartQuiz = (unitId: string) => {
    navigate(`/quiz/${unitId}`);
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
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">学習進捗</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{subject.totalQuestions} 問題</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{subject.completedQuestions} 完了</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span>{totalDueCards + totalNewCards} 待機中</span>
                </div>
              </div>
            </div>
            <ProgressRing progress={completionRate} size={80} strokeWidth={6}>
              <span className="text-sm font-semibold">{completionRate}%</span>
            </ProgressRing>
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
              <h3 className="font-semibold text-destructive">復習が必要です</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {totalDueCards}個のカードが復習期限を迎えています。記憶の定着のために今すぐ復習することをお勧めします。
            </p>
            <Button variant="destructive" size="sm">
              復習を開始
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}