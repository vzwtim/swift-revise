import { SubjectCard } from "@/components/subject-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3, RefreshCw, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllQuestionStats, getLowAccuracyQuestionIds } from "@/lib/answer-stats";

export default function SubjectList() {
  const navigate = useNavigate();

  const handleStartLearning = (subjectId: string) => {
    navigate(`/subjects/${subjectId}`);
  };

  const handleStartReview = () => {
    navigate('/quiz/review-all');
  };

  const stats = getAllQuestionStats();
  const lowIds = new Set(getLowAccuracyQuestionIds());

  const updatedSubjects = subjects.map(subject => {
    const updatedUnits = subject.units.map(unit => {
      const dueCards = unit.questions.filter(q => lowIds.has(q.id)).length;
      const newCards = unit.questions.filter(q => !stats[q.id]).length;
      return { ...unit, dueCards, newCards };
    });
    const questionIds = new Set(subject.units.flatMap(u => u.questions.map(q => q.id)));
    const completedQuestions = Object.keys(stats).filter(id => questionIds.has(id)).length;
    return { ...subject, units: updatedUnits, completedQuestions };
  });

  const totalQuestions = updatedSubjects.reduce((sum, subject) => sum + subject.totalQuestions, 0);
  const completedQuestions = updatedSubjects.reduce((sum, subject) => sum + subject.completedQuestions, 0);
  const overallProgress = Math.round((completedQuestions / totalQuestions) * 100);

  // 全単元の復習対象カードを集計
  const totalDueCards = updatedSubjects.reduce((sum, subject) =>
    sum + subject.units.reduce((unitSum, unit) => unitSum + unit.dueCards, 0), 0
  );
  const totalNewCards = updatedSubjects.reduce((sum, subject) =>
    sum + subject.units.reduce((unitSum, unit) => unitSum + unit.newCards, 0), 0
  );

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-lg text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StudyFlow</h1>
                <p className="text-sm text-muted-foreground">不動産ファイナンス学習</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>進捗: {overallProgress}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">学習科目</h2>
          <p className="text-muted-foreground">
            間隔反復学習で効率的に知識を定着させましょう
          </p>
        </div>

        {/* 一括復習カード */}
        {(totalDueCards > 0 || totalNewCards > 0) && (
          <Card className="mb-8 card-elevated border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
                一括復習
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                すべての単元の復習対象問題をまとめて学習
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {totalDueCards + totalNewCards} 問題
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {totalDueCards > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      復習 {totalDueCards}
                    </Badge>
                  )}
                  {totalNewCards > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      新規 {totalNewCards}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleStartReview}
                className="w-full"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                一括復習を開始
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {updatedSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onStartLearning={handleStartLearning}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary">
            <span>🧠</span>
            <span>SM-2アルゴリズムによる最適化された復習スケジュール</span>
          </div>
        </div>
      </main>
    </div>
  );
}