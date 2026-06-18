import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface CategoryBreakdownChartProps {
  breakdown: {
    transport: number;
    home: number;
    diet: number;
    consumption: number;
  };
  rankedCategories: Array<{
    category: 'transport' | 'home' | 'diet' | 'consumption';
    kg: number;
    percentage: number;
  }>;
}

// Utility formatting values
const formatKgValue = (val: number): string => {
  return val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${Math.round(val)} kg`;
};

// Friendly labels mapper matching X(r) in original JS
export const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    transport: 'Transport',
    home: 'Home Energy',
    diet: 'Diet',
    consumption: 'Shopping & Goods',
    general: 'General',
  };
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Category emojis
export const getCategoryEmoji = (category: string): string => {
  const map: Record<string, string> = {
    transport: '🚗',
    home: '🏠',
    diet: '🥗',
    consumption: '🛍️',
    general: '🌍',
  };
  return map[category] || '📊';
};

// Color palettes matching tr in original JS
const categoryColors: Record<string, string> = {
  transport: '#15803d',
  home: '#16a34a',
  diet: '#22c55e',
  consumption: '#4ade80',
  general: '#86efac',
};

// Custom tooltip renderer matching rr component in original JS
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { value, payload: dataPayload } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">{dataPayload.label}</p>
      <p className="font-bold text-gray-900">{formatKgValue(value)} CO₂e</p>
    </div>
  );
};

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  breakdown,
  rankedCategories,
}) => {
  // Construct data items for the BarChart
  const data = rankedCategories.map(item => ({
    category: item.category,
    label: getCategoryLabel(item.category),
    kg: item.kg,
    percentage: item.percentage,
  }));

  return (
    <div>
      <div
        role="img"
        aria-label="Bar chart showing annual carbon footprint broken down by category. A data table with the same information follows."
        className="w-full h-56"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} aria-hidden="true">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={val => formatKgValue(val)}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdf4' }} />
            <Bar dataKey="kg" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={categoryColors[entry.category] ?? '#16a34a'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Visually hidden but accessible table matching cloned app */}
      <table className="sr-only">
        <caption>Carbon footprint breakdown by category (annual kg CO₂e)</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">kg CO₂e per year</th>
            <th scope="col">Percentage of total</th>
          </tr>
        </thead>
        <tbody>
          {rankedCategories.map(s => (
            <tr key={s.category}>
              <th scope="row">{getCategoryLabel(s.category)}</th>
              <td>{Math.round(s.kg)}</td>
              <td>{s.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryBreakdownChart;
