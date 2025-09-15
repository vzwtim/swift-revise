import { SubjectCard } from "@/components/subject-card";
import { RankingCard } from "@/components/ranking-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3, RefreshCw, BookOpen, LogIn, LogOut, User, CalendarCheck, MessageSquare, Check } from "lucide-react";
import { DailyProgressChart } from "@/components/daily-progress-chart";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    if (!session) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const loadedCards = await loadAllCards();
      setCards(loadedCards);

      if (user) {
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

  const filteredSubjects = subjects.filter(subject => 
    !profile || !profile.studying_categories || profile.studying_categories.includes(subject.category)
  );

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
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">学習中の資格</DropdownMenuLabel>
                  {AVAILABLE_CATEGORIES.map(category => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategoryToggle(category.id);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="w-6 mr-2 flex items-center justify-center">
                        {profile?.studying_categories?.includes(category.id) && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                      <span>{category.name}</span>
                    </DropdownMenuItem>
                  ))}
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

            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold">学習カテゴリ</h2>
              <Button onClick={() => setIsBulkStudyOpen(true)} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                まとめて学習
              </Button>
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
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-background/30 rounded-xl">
                  <h3 className="text-xl font-bold mb-2">学習カテゴリが選択されていません</h3>
                  <p className="text-muted-foreground mb-6">プロフィール編集画面から、学習したいカテゴリを選択してください。</p>
                  <Button onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    プロフィールを編集
                  </Button>
                </div>
              )}
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
        subjects={filteredSubjects} // Pass filtered subjects
        onStartBulkStudy={handleStartReview}
      />
    </div>
  );
}