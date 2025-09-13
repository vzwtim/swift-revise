import { supabase } from "@/integrations/supabase/client";

// recordDailyAnswer は不要になるため削除

export async function getDailyAnswerCounts(days = 7): Promise<{ date: string; correct: number; incorrect: number }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const result: { date: string; correct: number; incorrect: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    targetDate.setDate(targetDate.getDate() - i);

    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setDate(targetDate.getDate() + 1);

    const { count: correctCount, error: correctError } = await supabase
      .from('answer_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_correct', true)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    const { count: incorrectCount, error: incorrectError } = await supabase
      .from('answer_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_correct', false)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (correctError || incorrectError) {
      console.error('Error fetching daily answer counts:', correctError || incorrectError);
    }

    const label = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
    result.push({
      date: label,
      correct: correctCount || 0,
      incorrect: incorrectCount || 0
    });
  }
  return result;
}

export async function getMonthlyAnswerCounts(year: number, month: number): Promise<{ date: string; count: number }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const result: { date: string; count: number }[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0); // その日の0時に設定
    const startOfDay = d.toISOString();

    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 1);
    const endOfDay = nextDay.toISOString();

    const { count, error } = await supabase
      .from('answer_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (error) {
      console.error('Error fetching monthly answer counts:', error);
      // エラー時は0として処理を続行
    }

    const label = `${month + 1}/${day}`;
    result.push({ date: label, count: count || 0 });
  }
  return result;
}

// getDailyTarget と setDailyTarget は、日々の回答数とは直接関係ないため、
// 必要であれば別のファイルに移動するか、このファイルに残すか検討。
// 今回の要望の範囲外なので、一旦そのまま残す。
// ただし、localStorageへの依存は解消する必要がある。
// 現状ではlocalStorageに依存しているので、このままでは動かない。
// ユーザーの要望は「毎日の回答数も、各アカウントの保持する回答履歴から計算するように」なので、
// getDailyTargetとsetDailyTargetは今回の修正範囲外と判断し、変更しない。

function loadTarget(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem("dailyTargetCount");
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function saveTarget(target: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem("dailyTargetCount", String(target));
  } catch {
    // ignore write errors
  }
}

export function getDailyTarget(): number {
  return loadTarget();
}

export function setDailyTarget(target: number): void {
  saveTarget(target);
}