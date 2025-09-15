import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MasteryLevel } from '@/lib/types';

interface QuizSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string; // unitId or subjectId (e.g., 'unit-1', 'review-all', 'review-subject-1')
  title: string;
  description: string;
  selectedUnitIds?: string[];
}

const ALL_LEVELS: MasteryLevel[] = ['Perfect', 'Great', 'Good', 'Bad', 'Miss', 'New'];
const DEFAULT_LEVELS: MasteryLevel[] = ['Perfect', 'Great', 'Good', 'Bad', 'Miss', 'New'];

export function QuizSettingsDialog({ open, onOpenChange, targetId, title, description, selectedUnitIds = [] }: QuizSettingsDialogProps) {
  const navigate = useNavigate();
  const [selectedLevels, setSelectedLevels] = useState<MasteryLevel[]>(() => {
    try {
      const savedLevels = localStorage.getItem('quiz_selected_mastery_levels');
      return savedLevels ? JSON.parse(savedLevels) : DEFAULT_LEVELS;
    } catch (error) {
      console.error("Failed to load selected levels from localStorage:", error);
      return DEFAULT_LEVELS;
    }
  });
  const [allQuestions, setAllQuestions] = useState<boolean>(() => {
    try {
      const savedAllQuestions = localStorage.getItem('quiz_all_questions_setting');
      return savedAllQuestions ? JSON.parse(savedAllQuestions) : false;
    } catch (error) {
      console.error("Failed to load allQuestions setting from localStorage:", error);
      return false;
    }
  });

  // selectedLevels が変更されたら localStorage に保存
  useEffect(() => {
    try {
      localStorage.setItem('quiz_selected_mastery_levels', JSON.stringify(selectedLevels));
    } catch (error) {
      console.error("Failed to save selected levels to localStorage:", error);
    }
  }, [selectedLevels]);

  // allQuestions が変更されたら localStorage に保存
  useEffect(() => {
    try {
      localStorage.setItem('quiz_all_questions_setting', JSON.stringify(allQuestions));
    } catch (error) {
      console.error("Failed to save allQuestions setting to localStorage:", error);
    }
  }, [allQuestions]);

  // ダイアログが開かれたときに、localStorageから読み込んだ設定を反映
  useEffect(() => {
    if (open) {
      try {
        const savedLevels = localStorage.getItem('quiz_selected_mastery_levels');
        const savedAllQuestions = localStorage.getItem('quiz_all_questions_setting');

        const loadedLevels = savedLevels ? JSON.parse(savedLevels) : DEFAULT_LEVELS;
        const loadedAllQuestions = savedAllQuestions ? JSON.parse(savedAllQuestions) : false;

        setSelectedLevels(loadedLevels);
        setAllQuestions(loadedAllQuestions);

        // "すべての問題から出題"が選択されている場合、selectedLevelsをALL_LEVELSに強制
        if (loadedAllQuestions) {
          setSelectedLevels(ALL_LEVELS);
        }

      } catch (error) {
        console.error("Failed to load settings on dialog open:", error);
        setSelectedLevels(DEFAULT_LEVELS);
        setAllQuestions(false);
      }
    }
  }, [open]);

  // 既存のuseEffectは削除

  const handleLevelToggle = (level: MasteryLevel, checked: boolean) => {
    if (allQuestions) return; // Do nothing if "All Questions" is checked
    setSelectedLevels(prev =>
      checked ? [...prev, level] : prev.filter(l => l !== level)
    );
  };

  const handleAllQuestionsToggle = (checked: boolean) => {
    setAllQuestions(checked);
    if (checked) {
      setSelectedLevels(ALL_LEVELS);
    } else {
      setSelectedLevels(DEFAULT_LEVELS);
    }
  };

  const handleStartQuiz = () => {
    if (!allQuestions && selectedLevels.length === 0) {
      alert('少なくとも1つのレベルを選択してください。');
      return;
    }
    
    const levelsQuery = allQuestions ? 'all' : selectedLevels.join(',');
    let path = `/quiz/${targetId}?levels=${levelsQuery}`;

    if (targetId === 'bulk-study' && selectedUnitIds && selectedUnitIds.length > 0) {
      path += `&units=${selectedUnitIds.join(',')}`;
    }

    navigate(path);
    onOpenChange(false); // Close dialog on navigation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 py-4">
            {ALL_LEVELS.map(level => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={level}
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={(checked) => handleLevelToggle(level, !!checked)}
                  disabled={allQuestions}
                />
                <Label htmlFor={level} className="font-medium" disabled={allQuestions}>
                  {level}
                </Label>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-questions"
                checked={allQuestions}
                onCheckedChange={handleAllQuestionsToggle}
              />
              <Label htmlFor="all-questions" className="font-medium">
                すべての問題から出題
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStartQuiz} className="w-full">
            クイズを開始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
