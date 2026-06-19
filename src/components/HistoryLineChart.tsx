import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { HistoryEntry } from '../types';

interface HistoryLineChartProps {
  history: HistoryEntry[];
}

const formatKgValue = (val: number): string => {
  return val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${Math.round(val)} kg`;
};

// Line chart custom tooltip
const CustomLineTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { value, payload: dataPayload } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-600">{dataPayload.fullDate}</p>
      <p className="font-bold text-gray-900">{formatKgValue(value)} CO₂e</p>
    </div>
  );
};

const HistoryLineChart: React.FC<HistoryLineChartProps> = ({ history }) => {
  // Sort reverse chronologically for chart display (oldest to newest)
  const chartData = [...history]
    .reverse()
    .map(entry => {
      const dateObj = new Date(entry.timestamp);
      return {
        date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: dateObj.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        kg: entry.total_kg,
      };
    });

  if (chartData.length < 2) {
    // Hidden in original application if there are fewer than 2 entries
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Carbon Footprint Trend</h3>
      <div className="w-full h-48" role="img" aria-label="Line chart showing your carbon footprint history over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={val => `${Math.round(val)} kg`}
              width={56}
            />
            <Tooltip content={<CustomLineTooltip />} />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 1, fill: '#fff', stroke: '#16a34a' }}
              activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(HistoryLineChart);
