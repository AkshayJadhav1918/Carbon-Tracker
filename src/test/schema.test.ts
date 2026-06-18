import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define the CarbonInputs Zod validation schema matching the CarbonInputs interface in src/types.ts
export const carbonInputsSchema = z.object({
  transport_km_car_petrol: z.number().nonnegative(),
  transport_km_car_diesel: z.number().nonnegative(),
  transport_km_car_electric: z.number().nonnegative(),
  transport_km_bus: z.number().nonnegative(),
  transport_km_train: z.number().nonnegative(),
  flights_short_haul: z.number().nonnegative(),
  flights_long_haul: z.number().nonnegative(),
  home_electricity_kwh: z.number().nonnegative(),
  home_gas_kwh: z.number().nonnegative(),
  household_size: z.number().int().positive(),
  diet_type: z.enum(['meat_heavy', 'meat_medium', 'vegetarian', 'vegan']),
  consumption_level: z.enum(['high', 'medium', 'low']),
  device_id: z.string(),
});

describe('CarbonInputs Zod Schema Validation', () => {
  const validInputs = {
    transport_km_car_petrol: 12000,
    transport_km_car_diesel: 0,
    transport_km_car_electric: 1000,
    transport_km_bus: 500,
    transport_km_train: 1500,
    flights_short_haul: 2,
    flights_long_haul: 0,
    home_electricity_kwh: 3500,
    home_gas_kwh: 12000,
    household_size: 3,
    diet_type: 'vegetarian',
    consumption_level: 'medium',
    device_id: 'dev-123456',
  };

  it('parses valid inputs successfully', () => {
    const result = carbonInputsSchema.safeParse(validInputs);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInputs);
    }
  });

  it('fails if a required field is missing', () => {
    const invalidInputs = { ...validInputs } as any;
    delete invalidInputs.diet_type;

    const result = carbonInputsSchema.safeParse(invalidInputs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0].path).toContain('diet_type');
    }
  });

  it('fails if a negative value is passed', () => {
    const invalidInputs = {
      ...validInputs,
      transport_km_car_petrol: -100,
    };

    const result = carbonInputsSchema.safeParse(invalidInputs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0].path).toContain('transport_km_car_petrol');
    }
  });

  it('fails if wrong type is passed', () => {
    const invalidInputs = {
      ...validInputs,
      household_size: 'three', // expected number, got string
    };

    const result = carbonInputsSchema.safeParse(invalidInputs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0].path).toContain('household_size');
    }
  });
});
