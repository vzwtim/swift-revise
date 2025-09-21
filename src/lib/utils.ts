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
    case 'new':
      return 'bg-gray-400';
    case 'learning':
      return 'bg-blue-500';
    case 'mastered':
      return 'bg-green-500';
    case 'review':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-200';
  }
};