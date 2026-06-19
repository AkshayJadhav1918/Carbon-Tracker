import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock recharts globally so all chart components return a simple div
vi.mock('recharts', () => {
  const DummyComponent = ({ children, className, id }: { children?: React.ReactNode; className?: string; id?: string }) => {
    return React.createElement('div', { className, id, 'data-testid': 'mock-recharts' }, children);
  };

  return {
    ResponsiveContainer: DummyComponent,
    PieChart: DummyComponent,
    Pie: DummyComponent,
    Cell: DummyComponent,
    Tooltip: DummyComponent,
    Legend: DummyComponent,
    LineChart: DummyComponent,
    Line: DummyComponent,
    BarChart: DummyComponent,
    Bar: DummyComponent,
    XAxis: DummyComponent,
    YAxis: DummyComponent,
    CartesianGrid: DummyComponent,
  };
});

// Mock fetch globally to return a resolved empty JSON response so no real network calls are made during tests
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
  } as Response)
);
