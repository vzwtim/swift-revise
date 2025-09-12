import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, YAxis } from "recharts";
import { getDailyAnswerCounts } from "@/lib/answer-stats";
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart";

interface Props {
  target: number;
}

export function DailyProgressChart({ target }: Props) {
  const [data, setData] = useState<{ date: string; correct: number; incorrect: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const dailyCounts = await getDailyAnswerCounts(30);
      setData(dailyCounts);
    };
    fetchData();
  }, []);

  return (
    <ChartContainer config={{}} className="w-full h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <Tooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex items-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: `hsl(var(--quiz-${name === 'correct' ? 'correct' : 'incorrect'}))` }}
                    />
                    <span>{`${name === 'correct' ? '正解' : '不正解'}: ${value}`}</span>
                  </div>
                )}
              />
            }
          />
          <Legend verticalAlign="top" height={36}/>
          <Bar dataKey="correct" stackId="a" fill="hsl(var(--quiz-correct))" name="正解" />
          <Bar dataKey="incorrect" stackId="a" fill="hsl(var(--quiz-incorrect))" name="不正解" />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 4"
            >
              <ReferenceLine.Label value="目標" position="insideTopRight" fill="hsl(var(--primary))" fontSize={12} />
            </ReferenceLine>
            )}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
