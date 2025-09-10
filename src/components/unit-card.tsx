import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Unit } from "@/lib/types";
import { BookOpen, Clock, Plus } from "lucide-react";

interface UnitCardProps {
  unit: Unit;
  onStartQuiz: (unitId: string) => void;
}

export function UnitCard({ unit, onStartQuiz }: UnitCardProps) {
  return (
    <Card className="card-elevated hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
          {unit.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {unit.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{unit.questions.length} 問題</span>
          </div>
        </div>

        <Button 
          onClick={() => onStartQuiz(unit.id)}
          className="w-full"
          size="sm"
        >
          クイズを開始
        </Button>
      </CardContent>
    </Card>
  );
}