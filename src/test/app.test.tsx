import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
