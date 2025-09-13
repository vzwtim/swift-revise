import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MasteryPieChart } from "@/components/mastery-pie-chart";
import { Subject, MasteryLevel } from "@/lib/types";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface SubjectCardProps {
  subject: Subject & { completedQuestions: number };
  progressCounts: Partial<Record<MasteryLevel, number>>;
  onStartLearning: (subjectId: string) => void;
}

export function SubjectCard({ subject, progressCounts, onStartLearning }: SubjectCardProps) {
  // このカード内で使われている古い統計ロジックは削除または修正が必要
  // const completionRate = Math.round((subject.completedQuestions / subject.totalQuestions) * 100);
  const totalDueCards = (progressCounts.Bad || 0) + (progressCounts.Miss || 0);
  const totalNewCards = progressCounts.New || 0;

  return (
    <Card className="card-elevated hover:shadow-lg transition-all duration-200 group flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {subject.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {subject.description}
            </p>
          </div>
          <MasteryPieChart
            progressCounts={progressCounts}
            totalQuestions={subject.totalQuestions}
            size={60}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{subject.totalQuestions} 問題</span>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-green-500 font-medium" title="Perfect">P: {progressCounts.Perfect || 0}</span>
              <span className="text-blue-500 font-medium" title="Great">G: {progressCounts.Great || 0}</span>
              <span className="text-yellow-400 font-medium" title="Good">G: {progressCounts.Good || 0}</span>
              <span className="text-orange-500 font-medium" title="Bad">B: {progressCounts.Bad || 0}</span>
              <span className="text-red-500 font-medium" title="Miss">M: {progressCounts.Miss || 0}</span>
              <span className="text-zinc-400 font-medium" title="New">N: {progressCounts.New || 0}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => onStartLearning(subject.id)}
          className="w-full gradient-primary hover:opacity-90 transition-opacity mt-4"
          size="sm"
        >
          学習を開始
        </Button>
      </CardContent>
    </Card>
  );
}