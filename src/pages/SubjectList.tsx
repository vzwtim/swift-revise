import { SubjectCard } from "@/components/subject-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3, RefreshCw, BookOpen } from "lucide-react";
import { DailyProgressChart } from "@/components/daily-progress-chart";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllQuestionStats, getDailyTarget, setDailyTarget } from "@/lib/answer-stats";
import { loadAllCards } from "@/lib/card-storage";
import { MasteryLevel } from "@/lib/types";
import { QuizSettingsDialog } from "@/components/quiz-settings-dialog";
import { BulkStudyDialog } from "@/components/bulk-study-dialog";

export default function SubjectList() {
  const navigate = useNavigate();
  const [target, setTarget] = useState<number>(getDailyTarget());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkStudyOpen, setIsBulkStudyOpen] = useState(false);
  const [quizTarget, setQuizTarget] = useState({ id: '', title: '', description: '' });
  const [selectedBulkStudyUnitIds, setSelectedBulkStudyUnitIds] = useState<string[]>([]);

  const handleOpenSettings = (targetId: string, title: string, description: string) => {
    setQuizTarget({ id: targetId, title, description });
    setIsSettingsOpen(true);
  };

  const handleStartLearning = (subjectId: string) => {
    const subject = updatedSubjects.find(s => s.id === subjectId);
    if (!subject) return;
    // Note: This is now treated as a review of the entire subject
    handleOpenSettings(
      `review-${subject.id}`,
      `${subject.name} の学習`,
      '出題範囲の習熟度を選択してください。'
    );
  };

  const handleStartReview = (selectedUnitIds: string[]) => {
    setSelectedBulkStudyUnitIds(selectedUnitIds);
    handleOpenSettings(
      'bulk-study',
      'まとめて学習',
      '選択した単元の問題をまとめて学習します。'
    );
  };

  const allCards = loadAllCards();

  const updatedSubjects = subjects.map(subject => {
    const subjectQuestionIds = new Set(
      subject.units.flatMap((u) => u.questions.map((q) => q.id))
    );
    const subjectCards = Object.values(allCards).filter((c) =>
      subjectQuestionIds.has(c.questionId)
    );

    const progressCounts: Partial<Record<MasteryLevel, number>> = {};
    subjectCards.forEach(card => {
      const level = card.masteryLevel || 'New';
      progressCounts[level] = (progressCounts[level] || 0) + 1;
    });
    
    const completedQuestions = progressCounts.Perfect || 0;

    return { ...subject, progressCounts, completedQuestions };
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

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTarget(value);
    setDailyTarget(value);
  };

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

        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="mb-8 card-elevated border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
                まとめて学習
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                学習したい単元を選択してまとめて学習
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsBulkStudyOpen(true)}
                className="w-full"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                単元を選択して学習
              </Button>
            </CardContent>
          </Card>
          {updatedSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              progressCounts={subject.progressCounts}
              onStartLearning={handleStartLearning}
            />
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            毎日の回答数
          </h3>
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="target" className="text-sm">
              目標
            </Label>
            <Input
              id="target"
              type="number"
              value={target}
              onChange={handleTargetChange}
              className="w-24 h-8"
            />
          </div>
          <DailyProgressChart target={target} />
        </div>
      </main>
      <QuizSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        targetId={quizTarget.id}
        title={quizTarget.title}
        description={quizTarget.description}
        selectedUnitIds={selectedBulkStudyUnitIds}
      />
      <BulkStudyDialog
        open={isBulkStudyOpen}
        onOpenChange={setIsBulkStudyOpen}
        subjects={subjects}
        onStartBulkStudy={handleStartReview}
      />
    </div>
  );
}