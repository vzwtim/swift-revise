import { useState } from "react";
import { SubjectCard } from "@/components/subject-card";
import { subjects } from "@/data/questions";
import { GraduationCap, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SubjectList() {
  const navigate = useNavigate();

  const handleStartLearning = (subjectId: string) => {
    navigate(`/subjects/${subjectId}`);
  };

  const totalQuestions = subjects.reduce((sum, subject) => sum + subject.totalQuestions, 0);
  const completedQuestions = subjects.reduce((sum, subject) => sum + subject.completedQuestions, 0);
  const overallProgress = Math.round((completedQuestions / totalQuestions) * 100);

  return (
    <div className="min-h-screen gradient-learning">
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
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>進捗: {overallProgress}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">学習科目</h2>
          <p className="text-muted-foreground">
            間隔反復学習で効率的に知識を定着させましょう
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onStartLearning={handleStartLearning}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary">
            <span>🧠</span>
            <span>SM-2アルゴリズムによる最適化された復習スケジュール</span>
          </div>
        </div>
      </main>
    </div>
  );
}