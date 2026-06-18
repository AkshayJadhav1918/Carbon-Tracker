import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { getCategoryLabel, getCategoryEmoji } from '../utils/categoryUtils';

describe('Category Utility Helpers', () => {
  describe('getCategoryLabel', () => {
    it('returns correct label for known categories', () => {
      expect(getCategoryLabel('transport')).toBe('Transport');
      expect(getCategoryLabel('home')).toBe('Home Energy');
      expect(getCategoryLabel('diet')).toBe('Diet');
      expect(getCategoryLabel('consumption')).toBe('Shopping & Goods');
      expect(getCategoryLabel('general')).toBe('General');
    });

    it('capitalizes and returns unknown categories', () => {
      expect(getCategoryLabel('electricity')).toBe('Electricity');
      expect(getCategoryLabel('other')).toBe('Other');
    });
  });

  describe('getCategoryEmoji', () => {
    it('returns correct emoji for known categories', () => {
      expect(getCategoryEmoji('transport')).toBe('🚗');
      expect(getCategoryEmoji('home')).toBe('🏠');
      expect(getCategoryEmoji('diet')).toBe('🥗');
      expect(getCategoryEmoji('consumption')).toBe('🛍️');
      expect(getCategoryEmoji('general')).toBe('🌍');
    });

    it('returns default emoji for unknown categories', () => {
      expect(getCategoryEmoji('other')).toBe('📊');
      expect(getCategoryEmoji('electricity')).toBe('📊');
    });
  });
});

describe('Express Server API Integration Tests', () => {
  it('GET / - responds with status code', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBeDefined();
  });

  it('POST /api/calculate - calculates footprint with valid inputs', async () => {
    const testInputs = {
      transport_km_car_petrol: 1000,
      transport_km_car_diesel: 0,
      transport_km_car_electric: 0,
      transport_km_bus: 0,
      transport_km_train: 0,
      flights_short_haul: 0,
      flights_long_haul: 0,
      home_electricity_kwh: 1000,
      home_gas_kwh: 0,
      household_size: 1,
      diet_type: 'vegan',
      consumption_level: 'low',
      device_id: 'test-device',
    };

    // Calculations:
    // transport = 1000 * 0.17 = 170
    // home = (1000 * 0.233) / 1 = 233
    // diet = vegan = 1100
    // consumption = low = 1200
    // total = 170 + 233 + 1100 + 1200 = 2703
    const expectedTotal = 170 + 233 + 1100 + 1200; // 2703

    const res = await request(app)
      .post('/api/calculate')
      .send(testInputs)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.total_kg).toBeCloseTo(expectedTotal, 0);
    expect(res.body.breakdown).toEqual({
      transport: 170,
      home: 233,
      diet: 1100,
      consumption: 1200,
    });
    expect(res.body.device_id).toBe('test-device');
    expect(res.body.vs_global_average_pct).toBeDefined();
    expect(res.body.vs_paris_target_pct).toBeDefined();
    expect(res.body.ranked_categories).toBeInstanceOf(Array);
  });
});
