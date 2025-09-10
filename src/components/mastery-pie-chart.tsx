import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MasteryLevel } from '@/lib/types';

type ProgressCounts = Partial<Record<MasteryLevel, number>>;

interface MasteryPieChartProps {
  progressCounts: ProgressCounts;
  totalQuestions: number;
  size?: number;
}

const MASTERY_ORDER: MasteryLevel[] = ['Perfect', 'Great', 'Good', 'Bad', 'Miss', 'New'];

const COLORS: Record<MasteryLevel, string> = {
  Perfect: '#22c55e', // green-500
  Great: '#3b82f6', // blue-500
  Good: '#facc15', // yellow-400
  Bad: '#f97316', // orange-500
  Miss: '#ef4444', // red-500
  New: '#a1a1aa', // zinc-400
};

export function MasteryPieChart({ progressCounts, totalQuestions, size = 80 }: MasteryPieChartProps) {
  const data = MASTERY_ORDER
    .map(key => ({
      name: key,
      value: progressCounts[key] || 0,
    }))
    .filter(item => item.value > 0);

  const perfectCount = progressCounts.Perfect || 0;
  const perfectPercentage = totalQuestions > 0 ? Math.round((perfectCount / totalQuestions) * 100) : 0;

  if (data.length === 0) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }} className="flex items-center justify-center">
         <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">0%</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={size * 0.3}
            outerRadius={size * 0.45}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            paddingAngle={data.length > 1 ? 2 : 0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as MasteryLevel]} stroke={COLORS[entry.name as MasteryLevel]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{perfectPercentage}%</span>
      </div>
    </div>
  );
}
