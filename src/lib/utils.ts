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