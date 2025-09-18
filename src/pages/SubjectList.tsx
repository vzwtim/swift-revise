import { SubjectCard } from "@/components/subject-card";
import { RankingCard } from "@/components/ranking-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3, RefreshCw, BookOpen, LogIn, LogOut, User, CalendarCheck, MessageSquare, Check, Filter } from "lucide-react";
import { DailyProgressChart } from "@/components/daily-progress-chart";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDailyTarget, setDailyTarget } from "@/lib/answer-stats";
import { cn, getRankStyle } from "@/lib/utils";
import { loadAllCards } from "@/lib/card-storage";
import { Card as CardType, MasteryLevel, Subject } from "@/lib/types"; // Import Subject
import { QuizSettingsDialog } from "@/components/quiz-settings-dialog";
import { BulkStudyDialog } from "@/components/bulk-study-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const AVAILABLE_CATEGORIES = [
  { id: 'ares', name: 'ARES 不動産ファイナンス' },
  { id: 'takken', name: '宅地建物取引士' },
];

export default function SubjectList() {
  const navigate = useNavigate();
  const { session, user, profile, loading: authLoading, updateStudyingCategories } = useAuth();
  const [cards, setCards] = useState<{ [questionId: string]: CardType }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<number>(getDailyTarget());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkStudyOpen, setIsBulkStudyOpen] = useState(false);
  const [quizTarget, setQuizTarget] = useState({ id: '', title: '', description: '' });
  const [selectedBulkStudyUnitIds, setSelectedBulkStudyUnitIds] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total_answers: number; correct_answers: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Reset stats for re-fetches
      setStats(null);
      setCards({});

      if (session && user) {
        const loadedCards = await loadAllCards();
        setCards(loadedCards);

        try {
          const { data, error } = await supabase
            .from('answer_logs')
            .select('is_correct')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching answer logs:', error);
          } else if (data) {
            const total_answers = data.length;
            const correct_answers = data.filter(log => log.is_correct).length;
            setStats({ total_answers, correct_answers });
          }
        } catch (error) {
          console.error('Error calculating user stats:', error);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [session, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleOpenSettings = (targetId: string, title: string, description: string) => {
    setQuizTarget({ id: targetId, title, description });
    setIsSettingsOpen(true);
  };

  const handleStartLearning = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || subject.units.length === 0) {
      console.error("Subject or units not found for ID:", subjectId);
      return;
    }
    const firstUnitId = subject.units[0].id;
    
    handleOpenSettings(
      firstUnitId,
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

  const handleCategoryToggle = async (categoryId: string) => {
    if (!profile || !profile.studying_categories || !updateStudyingCategories) return;

    const currentCategories = profile.studying_categories;
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId];

    await updateStudyingCategories(newCategories);
  };

  const filteredSubjects = subjects.filter(subject => {
    // If logged out, show all.
    if (!session) return true;
    // If logged in, but no profile or no categories set, show all.
    if (!profile || !profile.studying_categories || profile.studying_categories.length === 0) {
        return true;
    }
    // If logged in and categories are set, filter by them.
    return profile.studying_categories.includes(subject.category);
  });

  const updatedSubjects = filteredSubjects.map(subject => {
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

  const groupedSubjects = updatedSubjects.reduce((acc, subject) => {
    const category = subject.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(subject);
    return acc;
  }, {} as Record<string, (Subject & { progressCounts: Partial<Record<MasteryLevel, number>>, completedQuestions: number })[]>);

  const categoryDisplayNames: Record<string, string> = {
    ares: 'ARES 不動産ファイナンス',
    takken: '宅地建物取引士',
    uncategorized: 'その他',
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
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {session && (
              <>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>進捗: {overallProgress}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>総回答数: {stats ? stats.total_answers : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>正解率: {stats && stats.total_answers > 0 ? `${Math.round((stats.correct_answers / stats.total_answers) * 100)}%` : '0%'}</span>
                </div>
              </>
            )}
            {authLoading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className={cn("cursor-pointer h-8 w-8", getRankStyle(stats?.total_answers))}>
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || ''} />
                    <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/forum')} className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>掲示板</span>
                  </DropdownMenuItem>
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
        {authLoading || isLoading ? (
          <p>Loading...</p> // Replace with skeleton
        ) : (
          <>
            {!session && (
              <Alert className="mb-8 card-elevated">
                <LogIn className="h-4 w-4" />
                <AlertTitle className="font-bold">学習履歴を記録しませんか？</AlertTitle>
                <AlertDescription>
                  <p className="mb-4">
                    ログインすると、学習の進捗が記録され、苦手な問題を効率的に復習できます。
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    ログイン / 新規登録
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {session && (
              <div className="mb-8">
                <RankingCard />
              </div>
            )}
            
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">学習カテゴリ</h2>
              <div className="flex items-center gap-2">
                {session && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        表示カテゴリ設定
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">表示する資格</h4>
                          <p className="text-sm text-muted-foreground">
                            ホームに表示する資格を選択します。
                          </p>
                        </div>
                        <div className="grid gap-2">
                          {AVAILABLE_CATEGORIES.map(category => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={category.id}
                                checked={profile?.studying_categories?.includes(category.id)}
                                onCheckedChange={() => handleCategoryToggle(category.id)}
                              />
                              <Label htmlFor={category.id} className="font-normal">{category.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {session && (
                  <Button onClick={() => setIsBulkStudyOpen(true)} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    まとめて学習
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-12">
              {Object.keys(groupedSubjects).length > 0 ? (
                Object.entries(groupedSubjects).map(([category, subjectsInCategory]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">{categoryDisplayNames[category] || category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      {subjectsInCategory.map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          progressCounts={subject.progressCounts}
                          onStartLearning={handleStartLearning}
                          isLoggedIn={!!session}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                 <div className="text-center py-12 bg-background/30 rounded-xl">
                  <h3 className="text-xl font-bold mb-2">利用可能な学習カテゴリがありません</h3>
                  <p className="text-muted-foreground mb-6">現在、学習できるコンテンツが準備中です。</p>
                </div>
              )}
            </div>
            
            {session && (
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
            )}
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
        subjects={filteredSubjects} // Pass filtered subjects
        onStartBulkStudy={handleStartReview}
      />
    </div>
  );
}
