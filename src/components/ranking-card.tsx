import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileCard } from './user-profile-card';

// データはフラット化されているので、ネストした profiles は不要
interface RankedUser {
  userId: string;
  count: number;
  score: number;
  time_taken: number;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
  department?: string | null;
  acquired_qualifications?: string[] | null;
  total_answers: number;
  correct_answers: number;
}

export function RankingCard() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dailyChallenge');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      setError(null);

      let functionName = '';
      switch (activeTab) {
        case 'dailyChallenge':
          functionName = 'get-daily-challenge-ranking';
          break;
        case 'dailyStudy':
          functionName = 'get-daily-study-ranking';
          break;
        case 'weeklyStudy':
          functionName = 'get-weekly-study-ranking';
          break;
        default:
          setLoading(false);
          return;
      }

      if (!functionName) {
        setRanking([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke(functionName);

      if (error) {
        setError(error.message);
        console.error('Error fetching ranking:', error);
      } else {
        setRanking(data || []);
      }
      setLoading(false);
    };

    fetchRanking();
  }, [activeTab]);

  const renderBody = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-sm text-destructive">ランキングの読み込みに失敗しました。</p>;
    }

    if (ranking.length === 0) {
      return <p className="text-sm text-muted-foreground">ランキングはまだありません。</p>;
    }

    const getScoreLabel = (user: RankedUser) => {
      switch (activeTab) {
        case 'dailyChallenge':
          return `${user.score}点 / ${user.time_taken}秒`;
        case 'dailyStudy':
        case 'weeklyStudy':
          return `${user.count}問`;
        default:
          return '';
      }
    }

    const displayedRanking = showAll ? ranking : ranking.slice(0, 3);

    return (
      <>
        <ol className="space-y-4">
          {displayedRanking.map((user, index) => {
            // 順位に応じてリングのスタイルを決定
            const rankRingClass = [
              'ring-yellow-400', // 1位: 金
              'ring-slate-400', // 2位: 銀
              'ring-orange-800'  // 3位: 銅
            ][index];

            return (
              <li key={user.userId} className="flex items-center gap-4">
                <div className="font-bold text-lg w-6 text-center">{index + 1}</div>
                <UserProfileCard
                  profile={user}
                  total_answers={user.total_answers}
                  correct_answers={user.correct_answers}
                >
                  <Avatar className={`h-10 w-10 cursor-pointer ${rankRingClass ? `ring-2 ring-offset-2 ring-offset-background ${rankRingClass}` : ''}`}>
                    <AvatarImage src={user.avatar_url || undefined} alt={user.username || ''} />
                    <AvatarFallback>{user.username?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                </UserProfileCard>
                <div className="flex-1">
                  <p className="font-medium">{user.username || '名無しさん'}</p>
                  <p className="text-sm text-muted-foreground">{getScoreLabel(user)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {ranking.length > 3 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(prev => !prev)}>
              {showAll ? '閉じる' : 'もっと見る'}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            ランキング
          </CardTitle>
          <Button onClick={() => navigate('/daily-challenge')} size="sm" variant="outline" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            今日の10問に挑戦
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dailyChallenge">今日の10問</TabsTrigger>
            <TabsTrigger value="dailyStudy">今日の勉強量</TabsTrigger>
            <TabsTrigger value="weeklyStudy">今週の勉強量</TabsTrigger>
          </TabsList>
          <TabsContent value="dailyChallenge" className="mt-4">
            {renderBody()}
          </TabsContent>
          <TabsContent value="dailyStudy" className="mt-4">
            {renderBody()}
          </TabsContent>
          <TabsContent value="weeklyStudy" className="mt-4">
            {renderBody()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
