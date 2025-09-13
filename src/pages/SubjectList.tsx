import { SubjectCard } from "@/components/subject-card";
import { RankingCard } from "@/components/ranking-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3, RefreshCw, BookOpen, LogIn, LogOut, User, CalendarCheck } from "lucide-react";
import { DailyProgressChart } from "@/components/daily-progress-chart";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDailyTarget, setDailyTarget } from "@/lib/answer-stats";
import { loadAllCards } from "@/lib/card-storage";
import { Card as CardType, MasteryLevel } from "@/lib/types";
import { QuizSettingsDialog } from "@/components/quiz-settings-dialog";
import { BulkStudyDialog } from "@/components/bulk-study-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectList() {
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<{ [questionId: string]: CardType }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<number>(getDailyTarget());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkStudyOpen, setIsBulkStudyOpen] = useState(false);
  const [quizTarget, setQuizTarget] = useState({ id: '', title: '', description: '' });
  const [selectedBulkStudyUnitIds, setSelectedBulkStudyUnitIds] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const loadedCards = await loadAllCards();
      setCards(loadedCards);
      setIsLoading(false);
    };
    fetchData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleOpenSettings = (targetId: string, title: string, description: string) => {
    setQuizTarget({ id: targetId, title, description });
    setIsSettingsOpen(true);
  };

  const handleStartLearning = (subjectId: string) => {
    handleOpenSettings(
      `review-${subjectId}`,
      `${subjects.find(s => s.id === subjectId)?.name} の学習`,
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

  const updatedSubjects = subjects.map(subject => {
    const subjectQuestionIds = new Set(
      subject.units.flatMap((u) => u.questions.map((q) => q.id))
    );
    const subjectCards = Object.values(cards).filter((c) =>
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
  const completedQuestions = updatedSubjects.reduce((sum, subject) => sum + (subject.progressCounts.Perfect || 0), 0);
  const overallProgress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTarget(value);
    setDailyTarget(value);
  };

  const renderHeader = () => (
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
          <div className="flex items-center gap-4 text-sm">
            {session && (
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>進捗: {overallProgress}%</span>
              </div>
            )}
            {authLoading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>プロフィール編集</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="mr-2 h-4 w-4" />
                ログイン
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen gradient-learning">
      {renderHeader()}
      <main className="container mx-auto px-4 py-8">
        {authLoading || (session && isLoading) ? (
          <p>Loading...</p> // Replace with skeleton
        ) : !session ? (
          <div className="text-center py-16 bg-background/30 rounded-xl">
            <h2 className="text-2xl font-bold mb-2">ようこそ StudyFlow へ</h2>
            <p className="text-muted-foreground mb-6">学習の記録・分析・競争機能を利用するには、ログインしてください。</p>
            <Button onClick={() => navigate('/auth')}>
              <LogIn className="mr-2 h-4 w-4" />
              ログイン / 新規登録
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <RankingCard />
            </div>

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
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    今日の10問
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    毎日10問の実力テストに挑戦
                  </p>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/daily-challenge')} className="w-full" size="sm">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    挑戦する
                  </Button>
                </CardContent>
              </Card>
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
                  <Button onClick={() => setIsBulkStudyOpen(true)} className="w-full" size="sm">
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
                <Label htmlFor="target" className="text-sm">目標</Label>
                <Input id="target" type="number" value={target} onChange={handleTargetChange} className="w-24 h-8" />
              </div>
              <DailyProgressChart target={target} />
            </div>
          </>
        )}
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