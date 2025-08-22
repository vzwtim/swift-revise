import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Subject } from "@/lib/types";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface SubjectCardProps {
  subject: Subject;
  onStartLearning: (subjectId: string) => void;
}

export function SubjectCard({ subject, onStartLearning }: SubjectCardProps) {
  const completionRate = Math.round((subject.completedQuestions / subject.totalQuestions) * 100);
  const totalDueCards = subject.units.reduce((sum, unit) => sum + unit.dueCards, 0);
  const totalNewCards = subject.units.reduce((sum, unit) => sum + unit.newCards, 0);

  return (
    <Card className="card-elevated hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {subject.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {subject.description}
            </p>
          </div>
          <ProgressRing progress={completionRate} size={60} strokeWidth={4}>
            <span className="text-xs font-medium">{completionRate}%</span>
          </ProgressRing>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{subject.totalQuestions} 問題</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{subject.completedQuestions} 完了</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {totalDueCards > 0 && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              復習 {totalDueCards}
            </Badge>
          )}
          {totalNewCards > 0 && (
            <Badge variant="secondary" className="text-xs">
              新規 {totalNewCards}
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => onStartLearning(subject.id)}
          className="w-full gradient-primary hover:opacity-90 transition-opacity"
          size="sm"
        >
          学習を開始
        </Button>
      </CardContent>
    </Card>
  );
}