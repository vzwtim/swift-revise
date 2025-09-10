import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDailyAnswerCounts } from "@/lib/answer-stats";

export function DailyProgressChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    setData(getDailyAnswerCounts());
  }, []);

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
