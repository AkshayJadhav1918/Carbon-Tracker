import { describe, it, expect } from 'vitest';

// Mirror the validateField logic from App.tsx for isolated unit testing
function validateField(name: string, value: any): string | undefined {
  if (name.startsWith('transport_km_')) {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num < 0) return 'Distance cannot be negative';
    if (num > 100000) return 'Value exceeds the maximum allowable annual driving limit (100,000 km)';
  }
  if (name === 'flights_short_haul') {
    const num = Number(value);
    if (isNaN(num)) return 'Must be an integer';
    if (num < 0) return 'Cannot be negative';
    if (num > 50) return 'Short-haul flights capped at 50 per year';
  }
  if (name === 'flights_long_haul') {
    const num = Number(value);
    if (isNaN(num)) return 'Must be an integer';
    if (num < 0) return 'Cannot be negative';
    if (num > 20) return 'Long-haul flights capped at 20 per year';
  }
  if (name.startsWith('home_')) {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num < 0) return 'Energy use cannot be negative';
    if (num > 50000) return 'Value exceeds typical high household energy bounds (50,000 kWh)';
  }
  if (name === 'household_size') {
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) return 'Must be a whole number of people';
    if (num < 1) return 'Must be at least 1 person';
    if (num > 10) return 'Household size fits up to 10 people in calculations';
  }
  if (name === 'device_id') {
    const str = String(value);
    if (str.length < 8) return 'Device ID must be at least 8 characters';
    if (str.length > 64) return 'Device ID must be at most 64 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(str)) return 'Device ID may only contain letters, numbers, hyphens and underscores';
  }
  return undefined;
}

describe('validateField — transport_km fields', () => {
  it('passes valid positive distance', () => {
    expect(validateField('transport_km_car_petrol', 5000)).toBeUndefined();
  });
  it('rejects negative distance', () => {
    expect(validateField('transport_km_car_petrol', -1)).toBe('Distance cannot be negative');
  });
  it('rejects distance over 100000', () => {
    expect(validateField('transport_km_car_diesel', 100001)).toBe('Value exceeds the maximum allowable annual driving limit (100,000 km)');
  });
  it('rejects NaN', () => {
    expect(validateField('transport_km_train', NaN)).toBe('Must be a valid number');
  });
  it('passes zero', () => {
    expect(validateField('transport_km_bus', 0)).toBeUndefined();
  });
});

describe('validateField — flights', () => {
  it('passes valid short haul count', () => {
    expect(validateField('flights_short_haul', 5)).toBeUndefined();
  });
  it('rejects short haul over 50', () => {
    expect(validateField('flights_short_haul', 51)).toBe('Short-haul flights capped at 50 per year');
  });
  it('rejects long haul over 20', () => {
    expect(validateField('flights_long_haul', 21)).toBe('Long-haul flights capped at 20 per year');
  });
  it('rejects negative flights', () => {
    expect(validateField('flights_long_haul', -1)).toBe('Cannot be negative');
  });
});

describe('validateField — home energy', () => {
  it('passes valid kWh', () => {
    expect(validateField('home_electricity_kwh', 3500)).toBeUndefined();
  });
  it('rejects negative energy', () => {
    expect(validateField('home_gas_kwh', -10)).toBe('Energy use cannot be negative');
  });
  it('rejects over 50000', () => {
    expect(validateField('home_electricity_kwh', 50001)).toBe('Value exceeds typical high household energy bounds (50,000 kWh)');
  });
});

describe('validateField — household_size', () => {
  it('passes valid household size', () => {
    expect(validateField('household_size', 3)).toBeUndefined();
  });
  it('rejects zero', () => {
    expect(validateField('household_size', 0)).toBe('Must be at least 1 person');
  });
  it('rejects over 10', () => {
    expect(validateField('household_size', 11)).toBe('Household size fits up to 10 people in calculations');
  });
  it('rejects decimal', () => {
    expect(validateField('household_size', 2.5)).toBe('Must be a whole number of people');
  });
});

describe('validateField — device_id', () => {
  it('passes valid device id', () => {
    expect(validateField('device_id', 'dev-abc123')).toBeUndefined();
  });
  it('rejects too short', () => {
    expect(validateField('device_id', 'abc')).toBe('Device ID must be at least 8 characters');
  });
  it('rejects invalid characters', () => {
    expect(validateField('device_id', 'dev!@#$%^&')).toBe('Device ID may only contain letters, numbers, hyphens and underscores');
  });
  it('rejects too long', () => {
    expect(validateField('device_id', 'a'.repeat(65))).toBe('Device ID must be at most 64 characters');
  });
});
