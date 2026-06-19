import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';

describe('CategoryBreakdownChart Component', () => {
  const mockProps = {
    breakdown: {
      transport: 1200,
      home: 800,
      diet: 400,
      consumption: 200,
    },
    rankedCategories: [
      { category: 'transport' as const, kg: 1200, percentage: 46 },
      { category: 'home' as const, kg: 800, percentage: 31 },
      { category: 'diet' as const, kg: 400, percentage: 15 },
      { category: 'consumption' as const, kg: 200, percentage: 8 },
    ],
  };

  it('renders the chart and accessible breakdown table correctly', () => {
    render(<CategoryBreakdownChart {...mockProps} />);

    // Check that Recharts mock container is rendered
    const rechartsMock = screen.getAllByTestId('mock-recharts');
    expect(rechartsMock.length).toBeGreaterThan(0);

    // Check that the accessible table elements are rendered
    const tableCaption = screen.getByText('Carbon footprint breakdown by category (annual kg CO₂e)');
    expect(tableCaption).toBeInTheDocument();

    // Check header columns
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('kg CO₂e per year')).toBeInTheDocument();
    expect(screen.getByText('Percentage of total')).toBeInTheDocument();

    // Check that categories, values and percentages render
    expect(screen.getByRole('rowheader', { name: 'Transport' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1200' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '46%' })).toBeInTheDocument();

    expect(screen.getByRole('rowheader', { name: 'Home Energy' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '800' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '31%' })).toBeInTheDocument();

    expect(screen.getByRole('rowheader', { name: 'Diet' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '400' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '15%' })).toBeInTheDocument();

    expect(screen.getByRole('rowheader', { name: 'Shopping & Goods' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '200' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '8%' })).toBeInTheDocument();
  });
});
