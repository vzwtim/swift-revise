import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRankStyle = (totalAnswers: number | null | undefined) => {
  const count = totalAnswers || 0;
  if (count >= 1000) {
    return 'ring-2 ring-offset-2 ring-yellow-400 shadow-lg shadow-yellow-400/50'; // Gold
  }
  if (count >= 500) {
    return 'ring-2 ring-offset-2 ring-slate-400'; // Silver
  }
  if (count >= 100) {
    return 'ring-2 ring-offset-2 ring-orange-400'; // Bronze
  }
  return ''; // Default (no ring)
};

export const getStatusColor = (masteryLevel: string | undefined) => {
  switch (masteryLevel) {
    case 'Perfect':
      return 'bg-green-500';
    case 'Great':
      return 'bg-blue-500';
    case 'Good':
      return 'bg-yellow-400';
    case 'Bad':
      return 'bg-orange-500';
    case 'Miss':
      return 'bg-red-500';
    case 'New':
      return 'bg-zinc-400';
    default:
      return 'bg-gray-200';
  }
};