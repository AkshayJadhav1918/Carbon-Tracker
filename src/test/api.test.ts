import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server';

const validCarbonResult = {
  total_kg: 5000,
  breakdown: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
  vs_global_average_pct: 125,
  vs_paris_target_pct: 250,
  ranked_categories: [
    { category: 'transport', kg: 2000, percentage: 40 },
    { category: 'diet', kg: 1500, percentage: 30 },
    { category: 'home', kg: 1000, percentage: 20 },
    { category: 'consumption', kg: 500, percentage: 10 },
  ],
  device_id: 'test-device',
};

// ─── POST /api/insights ───────────────────────────────────────────────────────
describe('POST /api/insights', () => {
  it('returns rules-based insights when Gemini is unavailable', async () => {
    const res = await request(app)
      .post('/api/insights')
      .send({ carbon_result: validCarbonResult, device_id: 'test-device' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.insights).toBeInstanceOf(Array);
    expect(res.body.insights.length).toBe(3);
    expect(res.body.source).toBeDefined();
    expect(res.body.total_potential_saving_kg).toBeGreaterThan(0);
  });

  it('returns 400 when carbon_result is missing', async () => {
    const res = await request(app)
      .post('/api/insights')
      .send({})
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
  });

  it('returns 400 when carbon_result has invalid shape', async () => {
    const res = await request(app)
      .post('/api/insights')
      .send({ carbon_result: { total_kg: 'not-a-number' } })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/entries + GET /api/entries/:deviceId ──────────────────────────
describe('POST /api/entries + GET /api/entries/:deviceId', () => {
  const deviceId = 'save-test-device';

  const carbonResult = {
    total_kg: 3500,
    breakdown: { transport: 1000, home: 800, diet: 1100, consumption: 600 },
    vs_global_average_pct: 87.5,
    vs_paris_target_pct: 175,
    ranked_categories: [
      { category: 'diet', kg: 1100, percentage: 31.4 },
      { category: 'transport', kg: 1000, percentage: 28.6 },
      { category: 'home', kg: 800, percentage: 22.9 },
      { category: 'consumption', kg: 600, percentage: 17.1 },
    ],
    device_id: deviceId,
  };

  it('saves entry successfully and retrieves it by device ID', async () => {
    const saveRes = await request(app)
      .post('/api/entries')
      .send({ carbon_result: carbonResult, insights: [] })
      .set('Accept', 'application/json');

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.status).toBe('success');
    expect(saveRes.body.entry_id).toBeDefined();

    const getRes = await request(app).get(`/api/entries/${deviceId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toBeInstanceOf(Array);
    expect(getRes.body.length).toBeGreaterThan(0);
    expect(getRes.body[0].total_kg).toBe(3500);
  });

  it('returns 400 for invalid device ID format', async () => {
    const res = await request(app).get('/api/entries/bad!id');
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/calculate error path ──────────────────────────────────────────
describe('POST /api/calculate — validation errors', () => {
  it('returns 400 for negative transport value', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({ transport_km_car_petrol: -999 })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
  });

  it('returns 400 for completely empty body', async () => {
    const res = await request(app)
      .post('/api/calculate')
      .send({})
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/entries/:entryId ────────────────────────────────────────────
describe('DELETE /api/entries/:entryId', () => {
  it('deletes an existing entry successfully', async () => {
    const carbonResult = {
      total_kg: 4000,
      breakdown: { transport: 1500, home: 800, diet: 1100, consumption: 600 },
      vs_global_average_pct: 100,
      vs_paris_target_pct: 200,
      ranked_categories: [
        { category: 'transport', kg: 1500, percentage: 37.5 },
        { category: 'diet', kg: 1100, percentage: 27.5 },
        { category: 'home', kg: 800, percentage: 20 },
        { category: 'consumption', kg: 600, percentage: 15 },
      ],
      device_id: 'delete-test-device',
    };

    const saveRes = await request(app)
      .post('/api/entries')
      .send({ carbon_result: carbonResult, insights: [] })
      .set('Accept', 'application/json');

    expect(saveRes.status).toBe(200);
    const entryId = saveRes.body.entry_id;

    const deleteRes = await request(app).delete(`/api/entries/${entryId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.status).toBe('deleted');

    const getRes = await request(app).get('/api/entries/delete-test-device');
    expect(getRes.body.find((e: any) => e.id === entryId)).toBeUndefined();
  });

  it('returns 404 for non-existent entry ID', async () => {
    const res = await request(app).delete('/api/entries/nonexistent-entry-id-xyz');
    expect(res.status).toBe(404);
  });
});
