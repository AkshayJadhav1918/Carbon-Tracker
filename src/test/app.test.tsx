import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';

describe('App Component Mounting', () => {
  it('renders App without crashing', () => {
    render(<App />);

    // Assert layout headers are present
    expect(screen.getByText('Carbon Tracker')).toBeInTheDocument();

    // Assert tabs are present
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('switches to History tab on click', async () => {
    const user = userEvent.setup();
    render(<App />);
    const historyTab = screen.getByRole('tab', { name: /history/i });
    await user.click(historyTab);
    expect(historyTab).toHaveAttribute('aria-selected', 'true');
  });
});
