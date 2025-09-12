import { useState } from 'react';
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
const DEFAULT_LEVELS: MasteryLevel[] = ['Great', 'Good', 'Bad', 'Miss', 'New'];

export function QuizSettingsDialog({ open, onOpenChange, targetId, title, description, selectedUnitIds = [] }: QuizSettingsDialogProps) {
  const navigate = useNavigate();
  const [selectedLevels, setSelectedLevels] = useState<MasteryLevel[]>(DEFAULT_LEVELS);

  const handleLevelToggle = (level: MasteryLevel, checked: boolean) => {
    setSelectedLevels(prev =>
      checked ? [...prev, level] : prev.filter(l => l !== level)
    );
  };

  const handleStartQuiz = () => {
    if (selectedLevels.length === 0) {
      alert('少なくとも1つのレベルを選択してください。');
      return;
    }
    const levelsQuery = selectedLevels.join(',');
    let path = `/quiz/${targetId}?levels=${levelsQuery}`;

    if (targetId === 'bulk-study' && selectedUnitIds && selectedUnitIds.length > 0) {
      path += `&units=${selectedUnitIds.join(',')}`;
    }

    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {ALL_LEVELS.map(level => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={level}
                checked={selectedLevels.includes(level)}
                onCheckedChange={(checked) => handleLevelToggle(level, !!checked)}
              />
              <Label htmlFor={level} className="font-medium">
                {level}
              </Label>
            </div>
          ))}
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
