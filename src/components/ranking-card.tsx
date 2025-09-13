import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RankedUser {
  userId: string;
  count: number;
  score: number;
  time_taken: number;
  username: string;
  avatar_url: string | null;
}

export function RankingCard() {
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dailyChallenge');

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
        // TODO: Show a message that the ranking is not available yet
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

    return (
      <ol className="space-y-4">
        {ranking.map((user, index) => (
          <li key={user.userId} className="flex items-center gap-4">
            <div className="font-bold text-lg w-6 text-center">{index + 1}</div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">{getScoreLabel(user)}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          ランキング
        </CardTitle>
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
