import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  RotateCcw, 
  Home,
  Calendar,
  Brain
} from "lucide-react";

export default function Result() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const correct = parseInt(searchParams.get('correct') || '0');
  
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "優秀", color: "bg-success", emoji: "🏆" };
    if (score >= 80) return { level: "良好", color: "bg-primary", emoji: "🎯" };
    if (score >= 70) return { level: "普通", color: "bg-warning", emoji: "📈" };
    return { level: "要復習", color: "bg-destructive", emoji: "📚" };
  };

  const performance = getPerformanceLevel(score);

  const getNextReviewDays = (score: number) => {
    if (score >= 90) return 7;
    if (score >= 80) return 3;
    if (score >= 70) return 1;
    return 0.5; // 12 hours
  };

  const nextReviewDays = getNextReviewDays(score);
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 gradient-primary rounded-lg text-primary-foreground">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">学習結果</h1>
              <p className="text-sm text-muted-foreground">スコア分析と次回復習予定</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* メインスコア */}
          <Card className="card-elevated text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <ProgressRing progress={score} size={120} strokeWidth={8}>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{score}%</div>
                    <div className="text-xs text-muted-foreground">スコア</div>
                  </div>
                </ProgressRing>
              </div>
              <CardTitle className="text-2xl">
                <span className="mr-2">{performance.emoji}</span>
                {performance.level}
              </CardTitle>
              <p className="text-muted-foreground">
                {correct} / {total} 問正解
              </p>
            </CardHeader>
          </Card>

          {/* 詳細分析 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">正答率</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-1">
                  {Math.round((correct / total) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  目標は80%以上です
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-success" />
                  <CardTitle className="text-base">記憶定着</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success mb-1">
                  {score >= 80 ? "良好" : "要改善"}
                </div>
                <p className="text-sm text-muted-foreground">
                  SM-2アルゴリズム評価
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-warning" />
                  <CardTitle className="text-base">次回復習</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-warning mb-1">
                  {nextReviewDays < 1 ? "12時間後" : `${Math.round(nextReviewDays)}日後`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextReviewDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 学習のヒント */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                学習アドバイス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {score >= 90 ? (
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-sm text-success-foreground">
                      <strong>素晴らしい成績です！</strong> 知識がしっかり定着しています。
                      次回復習まで1週間空けて、長期記憶への定着を図りましょう。
                    </p>
                  </div>
                ) : score >= 80 ? (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm">
                      <strong>良好な理解度です。</strong> 間違えた問題を重点的に復習し、
                      3日後に再度チャレンジしてみましょう。
                    </p>
                  </div>
                ) : score >= 70 ? (
                  <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <p className="text-sm">
                      <strong>基本は理解できています。</strong> 間違えた問題の解説をもう一度読み、
                      明日復習することをお勧めします。
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-sm text-destructive-foreground">
                      <strong>復習が必要です。</strong> 基礎知識から見直して、
                      12時間後に再度挑戦しましょう。解説をしっかり読んで理解を深めてください。
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>間隔反復学習により、効率的な記憶定着をサポートします</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/')}
              className="flex-1 gradient-primary gap-2"
              size="lg"
            >
              <Home className="h-4 w-4" />
              ホームに戻る
            </Button>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              <RotateCcw className="h-4 w-4" />
              もう一度挑戦
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}