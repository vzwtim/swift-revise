import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getMonthlyAnswerCounts } from "@/lib/answer-stats";

interface Props {
  target: number;
}

export function DailyProgressChart({ target }: Props) {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const now = new Date();
    setData(getMonthlyAnswerCounts(now.getFullYear(), now.getMonth()));
  }, []);

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke="hsl(var(--secondary))"
              strokeDasharray="4 4"
              label="目標"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
