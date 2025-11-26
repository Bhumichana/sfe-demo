'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SRData {
  name: string;
  value: number;
  fullName: string;
}

interface SRPerformanceChartProps {
  data: SRData[];
  title?: string;
}

// สีสันสำหรับกราฟ (ใช้สีที่สวยงามและแตกต่างกันชัดเจน)
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

// Custom label สำหรับแสดงข้อมูลบนกราฟ
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // แสดงเปอร์เซ็นต์ถ้ามากกว่า 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-border">
        <p className="font-semibold text-foreground">{payload[0].payload.fullName}</p>
        <p className="text-sm text-muted-foreground">
          Calls: <span className="font-bold text-primary">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function SRPerformanceChart({ data, title = 'SR Performance - This Month' }: SRPerformanceChartProps) {
  // คำนวณยอดรวม
  const totalCalls = data.reduce((sum, item) => sum + item.value, 0);

  // ถ้าไม่มีข้อมูล
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Total Calls: <span className="font-bold text-primary">{totalCalls}</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.value / totalCalls) * 100).toFixed(1);
              return `${value} (${entry.payload.value} - ${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{data.length}</div>
            <div className="text-xs text-muted-foreground">Active SRs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalCalls}</div>
            <div className="text-xs text-muted-foreground">Total Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {data.length > 0 ? Math.round(totalCalls / data.length) : 0}
            </div>
            <div className="text-xs text-muted-foreground">Avg per SR</div>
          </div>
        </div>
      </div>
    </div>
  );
}
