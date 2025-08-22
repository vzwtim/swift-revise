import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Question } from "@/lib/types";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: number, timeSpent: number) => void;
  showResult?: boolean;
  selectedAnswer?: number;
}

export function QuizCard({ 
  question, 
  questionNumber, 
  totalQuestions, 
  onAnswer,
  showResult = false,
  selectedAnswer 
}: QuizCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (!showResult) {
      const interval = setInterval(() => {
        setTimeSpent(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, showResult]);

  const handleChoiceSelect = (choiceIndex: number) => {
    if (showResult) return;
    setSelectedChoice(choiceIndex);
  };

  const handleSubmit = () => {
    if (selectedChoice === null) return;
    const timeSpent = Date.now() - startTime;
    onAnswer(selectedChoice, timeSpent);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'hard': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getChoiceStyle = (index: number) => {
    if (!showResult) {
      return selectedChoice === index 
        ? "quiz-answer-card border-primary bg-primary/5" 
        : "quiz-answer-card border-border hover:border-muted-foreground";
    }

    if (index === question.answer) {
      return "quiz-answer-correct border-success";
    }
    
    if (selectedAnswer === index && index !== question.answer) {
      return "quiz-answer-incorrect border-destructive";
    }

    return "border-border opacity-50";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
            {question.difficulty || 'medium'}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(timeSpent / 1000)}s</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>問題 {questionNumber} / {totalQuestions}</span>
            <span>{question.unit}</span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </div>
        
        <CardTitle className="text-lg leading-relaxed mt-4">
          {question.question}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 mb-6">
          {question.choices.map((choice, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getChoiceStyle(index)}`}
              onClick={() => handleChoiceSelect(index)}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1">{choice}</span>
                {showResult && index === question.answer && (
                  <CheckCircle className="h-5 w-5 text-success ml-2" />
                )}
                {showResult && selectedAnswer === index && index !== question.answer && (
                  <XCircle className="h-5 w-5 text-destructive ml-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        {showResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">解説</h4>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={selectedChoice === null}
            className="w-full gradient-primary"
            size="lg"
          >
            回答する
          </Button>
        )}
      </CardContent>
    </Card>
  );
}