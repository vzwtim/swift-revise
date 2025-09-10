import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Subject } from "@/lib/types";

interface BulkStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  onStartBulkStudy: (selectedUnitIds: string[]) => void;
}

export function BulkStudyDialog({ open, onOpenChange, subjects, onStartBulkStudy }: BulkStudyDialogProps) {
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSelectedUnits(new Set()); // Reset selected units when dialog closes
    }
  }, [open]);

  const handleUnitSelect = (unitId: string, isChecked: boolean) => {
    setSelectedUnits(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(unitId);
      } else {
        newSet.delete(unitId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUnits(() => {
      const newSet = new Set<string>();
      if (checked) {
        subjects.forEach(subject => {
          subject.units.forEach(unit => {
            newSet.add(unit.id);
          });
        });
      }
      return newSet;
    });
  };

  const handleSelectAllInSubject = (subjectId: string, isChecked: boolean) => {
    setSelectedUnits(prev => {
      const newSet = new Set(prev);
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        subject.units.forEach(unit => {
          if (isChecked) {
            newSet.add(unit.id);
          } else {
            newSet.delete(unit.id);
          }
        });
      }
      return newSet;
    });
  };

  const handleStart = () => {
    onStartBulkStudy(Array.from(selectedUnits));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>まとめて学習</DialogTitle>
          <DialogDescription>
            学習したい単元を選択してください。
          </DialogDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="select-all-units"
              checked={subjects.flatMap(s => s.units.map(u => u.id)).every(unitId => selectedUnits.has(unitId))}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            />
            <Label htmlFor="select-all-units" className="font-semibold">
              全選択
            </Label>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="grid gap-4 py-4">
            {subjects.map(subject => (
              <div key={subject.id} className="mb-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={subject.units.every(unit => selectedUnits.has(unit.id)) && subject.units.length > 0}
                    onCheckedChange={(checked) => handleSelectAllInSubject(subject.id, checked as boolean)}
                  />
                  <Label htmlFor={`subject-${subject.id}`} className="text-base font-semibold">
                    {subject.name}
                  </Label>
                </div>
                <div className="ml-6 grid gap-2">
                  {subject.units.map(unit => (
                    <div key={unit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={selectedUnits.has(unit.id)}
                        onCheckedChange={(checked) => handleUnitSelect(unit.id, checked as boolean)}
                      />
                      <Label htmlFor={`unit-${unit.id}`}>
                        {unit.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleStart} disabled={selectedUnits.size === 0}>
            学習を開始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
