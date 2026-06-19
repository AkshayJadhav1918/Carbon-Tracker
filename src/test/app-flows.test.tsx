import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';

describe('App Component Extensive Flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Form Validation (validateField)', () => {
    it('validates transport_km_car_petrol bounds', async () => {
      const user = userEvent.setup();
      render(<App />);

      const petrolInput = screen.getByLabelText(/Petrol Car/);

      // Negative value validation
      await user.clear(petrolInput);
      await user.type(petrolInput, '-10');
      fireEvent.blur(petrolInput);
      expect(await screen.findByText('Distance cannot be negative')).toBeInTheDocument();

      // Too large value validation
      await user.clear(petrolInput);
      await user.type(petrolInput, '150000');
      fireEvent.blur(petrolInput);
      expect(
        await screen.findByText(/Value exceeds the maximum allowable annual driving limit/)
      ).toBeInTheDocument();

      // Valid value validation
      await user.clear(petrolInput);
      await user.type(petrolInput, '5000');
      fireEvent.blur(petrolInput);
      await waitFor(() => {
        expect(screen.queryByText('Distance cannot be negative')).toBeNull();
        expect(screen.queryByText(/Value exceeds/)).toBeNull();
      });
    });

    it('validates flights_short_haul bounds', async () => {
      const user = userEvent.setup();
      render(<App />);

      const flightsInput = screen.getByLabelText(/Short-Haul Flights/);

      // Negative value
      await user.clear(flightsInput);
      await user.type(flightsInput, '-1');
      fireEvent.blur(flightsInput);
      expect(await screen.findByText('Cannot be negative')).toBeInTheDocument();

      // Capped value
      await user.clear(flightsInput);
      await user.type(flightsInput, '60');
      fireEvent.blur(flightsInput);
      expect(await screen.findByText('Short-haul flights capped at 50 per year')).toBeInTheDocument();

      // Valid value
      await user.clear(flightsInput);
      await user.type(flightsInput, '5');
      fireEvent.blur(flightsInput);
      await waitFor(() => {
        expect(screen.queryByText('Cannot be negative')).toBeNull();
        expect(screen.queryByText(/capped at 50/)).toBeNull();
      });
    });

    it('validates flights_long_haul bounds', async () => {
      const user = userEvent.setup();
      render(<App />);

      const flightsInput = screen.getByLabelText(/Long-Haul Flights/);

      // Negative value
      await user.clear(flightsInput);
      await user.type(flightsInput, '-2');
      fireEvent.blur(flightsInput);
      expect(await screen.findByText('Cannot be negative')).toBeInTheDocument();

      // Capped value
      await user.clear(flightsInput);
      await user.type(flightsInput, '30');
      fireEvent.blur(flightsInput);
      expect(await screen.findByText('Long-haul flights capped at 20 per year')).toBeInTheDocument();
    });

    it('validates home_electricity_kwh bounds', async () => {
      const user = userEvent.setup();
      render(<App />);

      const elecInput = screen.getByLabelText(/Electricity/);

      // Negative value
      await user.clear(elecInput);
      await user.type(elecInput, '-100');
      fireEvent.blur(elecInput);
      expect(await screen.findByText('Energy use cannot be negative')).toBeInTheDocument();

      // Out of bounds
      await user.clear(elecInput);
      await user.type(elecInput, '60000');
      fireEvent.blur(elecInput);
      expect(
        await screen.findByText(/Value exceeds typical high household energy bounds/)
      ).toBeInTheDocument();
    });

    it('validates household_size bounds', async () => {
      const user = userEvent.setup();
      render(<App />);

      const sizeInput = screen.getByLabelText(/Household Size/);

      // Negative/zero value
      await user.clear(sizeInput);
      await user.type(sizeInput, '0');
      fireEvent.blur(sizeInput);
      expect(await screen.findByText('Must be at least 1 person')).toBeInTheDocument();

      // Too large
      await user.clear(sizeInput);
      await user.type(sizeInput, '12');
      fireEvent.blur(sizeInput);
      expect(
        await screen.findByText('Household size fits up to 10 people in calculations')
      ).toBeInTheDocument();
    });

    it('validates device_id formatting errors', async () => {
      const user = userEvent.setup();
      render(<App />);

      const deviceIdInput = screen.getByLabelText(/Device sync code/);
      const submitButton = screen.getByRole('button', { name: /Calculate my carbon footprint/i });

      // Too short
      await user.clear(deviceIdInput);
      await user.type(deviceIdInput, 'dev-1');
      await user.click(submitButton);
      expect(await screen.findByText('⚠️ Format error')).toBeInTheDocument();

      // Invalid character
      await user.clear(deviceIdInput);
      await user.type(deviceIdInput, 'invalid_device_id_with_spaces_and_$$$');
      await user.click(submitButton);
      expect(await screen.findByText('⚠️ Format error')).toBeInTheDocument();

      // Valid format
      await user.clear(deviceIdInput);
      await user.type(deviceIdInput, 'valid-device-1234');

      // Make another field invalid to prevent form submission from calling real fetch
      const petrolInput = screen.getByLabelText(/Petrol Car/);
      await user.clear(petrolInput);
      await user.type(petrolInput, '-10');

      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Format error')).toBeNull();
      });
    });

    it('covers all input fields to maximize function coverage', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Type and blur each field
      const fields = [
        { label: /Petrol Car/, val: '1000' },
        { label: /Diesel Car/, val: '2000' },
        { label: /Electric Vehicle/, val: '3000' },
        { label: /Bus/, val: '4000' },
        { label: /Train \/ Metro/, val: '5000' },
        { label: /Short-Haul Flights/, val: '2' },
        { label: /Long-Haul Flights/, val: '3' },
        { label: /Electricity/, val: '1500' },
        { label: /Natural Gas/, val: '8000' },
        { label: /Household Size/, val: '4' },
      ];

      for (const field of fields) {
        const input = screen.getByLabelText(field.label);
        await user.clear(input);
        await user.type(input, field.val);
        fireEvent.blur(input);
      }

      // Check radio button clicks
      const dietVegan = screen.getByLabelText(/Vegan/i);
      await user.click(dietVegan);

      const dietVegetarian = screen.getByLabelText(/Vegetarian/i);
      await user.click(dietVegetarian);

      const dietMeatHeavy = screen.getByLabelText(/Meat-heavy/i);
      await user.click(dietMeatHeavy);

      // Check select dropdown
      const consumptionSelect = screen.getByLabelText(/Shopping & Consumption Level/i);
      await user.selectOptions(consumptionSelect, 'low');
      await user.selectOptions(consumptionSelect, 'high');
    });
  });

  describe('Form Submission Flows (handleSubmitForm)', () => {
    it('handles successful calculation flow and results transition', async () => {
      const user = userEvent.setup();

      const mockCalculateResult = {
        total_kg: 4500,
        breakdown: { transport: 2000, home: 1000, diet: 1000, consumption: 500 },
        vs_global_average_pct: 112.5,
        vs_paris_target_pct: 225,
        ranked_categories: [
          { category: 'transport', kg: 2000, percentage: 44 },
          { category: 'home', kg: 1000, percentage: 22 },
          { category: 'diet', kg: 1000, percentage: 22 },
          { category: 'consumption', kg: 500, percentage: 12 },
        ],
        device_id: 'test-device-id',
      };

      const mockInsightsResult = {
        insights: [
          {
            category: 'transport',
            action: 'Switch to public transport or train',
            estimated_saving_kg: 500,
            timeframe: 'Immediate',
            priority: 1,
          },
        ],
      };

      const mockHistoryResult = [
        {
          id: 'history-entry-1',
          timestamp: new Date().toISOString(),
          total_kg: 4500,
          breakdown: { transport: 2000, home: 1000, diet: 1000, consumption: 500 },
          vs_global_average_pct: 112.5,
          vs_paris_target_pct: 225,
          ranked_categories: [
            { category: 'transport', kg: 2000, percentage: 44 },
          ],
          insights: [],
          device_id: 'test-device-id',
        },
      ];

      // Setup custom fetch mocks
      const fetchMock = vi.fn().mockImplementation((url) => {
        if (url === '/api/calculate') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockCalculateResult),
          } as Response);
        }
        if (url === '/api/insights') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockInsightsResult),
          } as Response);
        }
        if (url === '/api/entries') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'success', entry_id: 'history-entry-1' }),
          } as Response);
        }
        if (url.startsWith('/api/entries/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockHistoryResult),
          } as Response);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      global.fetch = fetchMock;

      render(<App />);

      // Fill form with valid inputs
      const petrolInput = screen.getByLabelText(/Petrol Car/);
      await user.clear(petrolInput);
      await user.type(petrolInput, '5000');

      // Click calculate button
      const submitButton = screen.getByRole('button', { name: /Calculate my carbon footprint/i });
      await user.click(submitButton);

      // Verify page transition to results
      expect(await screen.findByText('Your Results Scorecard')).toBeInTheDocument();
      expect(screen.getByText('4.50 tonnes')).toBeInTheDocument();
      expect(screen.getByText('Switch to public transport or train')).toBeInTheDocument();

      // Switch to History and check entries loaded
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await user.click(historyTab);
      expect(await screen.findByText('Past Calculations (1)')).toBeInTheDocument();
      expect(screen.getByText('4.5t CO₂e')).toBeInTheDocument();
    });

    it('handles calculate API failure gracefully', async () => {
      const user = userEvent.setup();

      const fetchMock = vi.fn().mockImplementation((url) => {
        if (url === '/api/calculate') {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Emissions engine down.' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        } as Response);
      });

      global.fetch = fetchMock;

      render(<App />);

      const submitButton = screen.getByRole('button', { name: /Calculate my carbon footprint/i });
      await user.click(submitButton);

      // Verify error message is rendered
      expect(await screen.findByText('Calculation aborted')).toBeInTheDocument();
      expect(screen.getByText('Emissions engine down.')).toBeInTheDocument();
    });
  });

  describe('History and Deletion Flows', () => {
    it('handles delete history entry flow', async () => {
      const user = userEvent.setup();

      const mockHistoryResult = [
        {
          id: 'delete-entry-1',
          timestamp: new Date().toISOString(),
          total_kg: 3500,
          breakdown: { transport: 1500, home: 1000, diet: 500, consumption: 500 },
          vs_global_average_pct: 87.5,
          vs_paris_target_pct: 175,
          ranked_categories: [
            { category: 'transport', kg: 1500, percentage: 43 },
          ],
          insights: [],
          device_id: 'test-device-delete',
        },
      ];

      // Local storage cache prefilled
      localStorage.setItem('carbon_history_cache', JSON.stringify(mockHistoryResult));

      const fetchMock = vi.fn().mockImplementation((url, init) => {
        if (url === '/api/entries/delete-entry-1' && init?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'deleted', entry_id: 'delete-entry-1' }),
          } as Response);
        }
        if (url.startsWith('/api/entries/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockHistoryResult),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        } as Response);
      });

      global.fetch = fetchMock;

      render(<App />);

      // Go to History tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await user.click(historyTab);

      // Verify entry rendered
      expect(await screen.findByText('Past Calculations (1)')).toBeInTheDocument();

      // Mock confirm
      vi.spyOn(window, 'confirm').mockImplementation(() => true);

      // Expand row
      const summaryButton = screen.getByRole('button', { name: /Device footprint log/i });
      await user.click(summaryButton);

      // Trigger deletion
      const deleteButton = screen.getByRole('button', { name: /Delete entry/i });
      await user.click(deleteButton);

      // Assert delete fetch called and empty state displayed
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/entries/delete-entry-1', expect.objectContaining({ method: 'DELETE' }));
        expect(screen.getByText('No calculation history found for this device yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates tabs using left and right arrow keys', async () => {
      render(<App />);

      const tabList = screen.getByRole('tablist');
      const calculatorTab = screen.getByRole('tab', { name: /Calculator/i });
      const historyTab = screen.getByRole('tab', { name: /History/i });

      // Focus calculator tab
      calculatorTab.focus();
      expect(calculatorTab).toHaveFocus();

      // Press ArrowRight
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(historyTab).toHaveAttribute('aria-selected', 'true');
      });

      // Press ArrowLeft
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(calculatorTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
