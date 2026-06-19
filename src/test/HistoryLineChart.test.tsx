import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import HistoryLineChart from '../components/HistoryLineChart';
import { HistoryEntry } from '../types';

describe('HistoryLineChart Component', () => {
  const mockHistory: HistoryEntry[] = [
    {
      id: 'entry-1',
      timestamp: '2026-06-19T10:00:00.000Z',
      total_kg: 2500,
      breakdown: { transport: 1000, home: 500, diet: 500, consumption: 500 },
      vs_global_average_pct: 62.5,
      vs_paris_target_pct: 125,
      ranked_categories: [],
      insights: [],
      device_id: 'dev-123',
    },
    {
      id: 'entry-2',
      timestamp: '2026-06-18T10:00:00.000Z',
      total_kg: 3200,
      breakdown: { transport: 1200, home: 1000, diet: 500, consumption: 500 },
      vs_global_average_pct: 80,
      vs_paris_target_pct: 160,
      ranked_categories: [],
      insights: [],
      device_id: 'dev-123',
    },
  ];

  it('renders nothing if history has fewer than 2 entries', () => {
    const { container } = render(<HistoryLineChart history={[]} />);
    expect(container.firstChild).toBeNull();

    const { container: containerSingle } = render(
      <HistoryLineChart history={[mockHistory[0]]} />
    );
    expect(containerSingle.firstChild).toBeNull();
  });

  it('renders line chart trend when history has at least 2 entries', () => {
    const { container } = render(<HistoryLineChart history={mockHistory} />);
    expect(container.firstChild).not.toBeNull();

    // Verify title is rendered
    expect(screen.getByText('Carbon Footprint Trend')).toBeInTheDocument();

    // Verify Recharts container
    const rechartsMocks = screen.getAllByTestId('mock-recharts');
    expect(rechartsMocks.length).toBeGreaterThan(0);
  });
});
