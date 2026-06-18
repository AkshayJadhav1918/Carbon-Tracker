import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import ProgressBar from '../components/ProgressBar';
import HistoryTable from '../components/HistoryTable';
import { HistoryEntry } from '../types';

describe('ProgressBar Component', () => {
  it('renders progress bar with correct label and percentage', () => {
    render(
      <ProgressBar
        id="test-bar"
        label="Test Comparison"
        pct={80}
        benchmark="target benchmark"
        benchmarkKg={4000}
      />
    );

    // Assert label is present
    expect(screen.getByText('Test Comparison')).toBeInTheDocument();
    
    // Assert percentage is displayed
    expect(screen.getByText(/80%/)).toBeInTheDocument();

    // Assert progressbar element has correct aria attribute
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '80');
    expect(progressbar).toHaveAttribute('id', 'test-bar');

    // Assert below benchmark message
    expect(screen.getByText(/✅ You are below the target benchmark/)).toBeInTheDocument();
  });

  it('displays warning when exceeding benchmark', () => {
    render(
      <ProgressBar
        id="test-bar-warn"
        label="Test Comparison"
        pct={120}
        benchmark="target benchmark"
        benchmarkKg={4000}
      />
    );

    // Assert warning message is present
    expect(screen.getByText(/⚠️ You are 20% above the target benchmark/)).toBeInTheDocument();
  });
});

describe('HistoryTable Component', () => {
  const mockHistory: HistoryEntry[] = [
    {
      id: 'entry-1',
      timestamp: '2026-06-18T12:00:00.000Z',
      total_kg: 2500,
      breakdown: {
        transport: 1000,
        home: 500,
        diet: 500,
        consumption: 500,
      },
      vs_global_average_pct: 62.5,
      vs_paris_target_pct: 125,
      ranked_categories: [
        { category: 'transport', kg: 1000, percentage: 40 },
        { category: 'home', kg: 500, percentage: 20 },
        { category: 'diet', kg: 500, percentage: 20 },
        { category: 'consumption', kg: 500, percentage: 20 },
      ],
      insights: [],
      device_id: 'dev-123',
    }
  ];

  it('renders empty state message when history is empty', () => {
    render(<HistoryTable history={[]} />);
    expect(screen.getByText(/No calculation history found/)).toBeInTheDocument();
  });

  it('renders history entries when provided', () => {
    render(<HistoryTable history={mockHistory} />);
    
    // Assert headers and totals are displayed
    expect(screen.getByText(/Past Calculations/)).toBeInTheDocument();
    expect(screen.getByText(/2.5t CO₂e/)).toBeInTheDocument();
    expect(screen.getByText(/Driver: 🚗 Transport/)).toBeInTheDocument();
  });
});
