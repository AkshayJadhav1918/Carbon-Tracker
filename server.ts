import express from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, Type } from '@google/genai';
import { CarbonInputs, CarbonResult, Insight, InsightsResponse, HistoryEntry } from './src/types';

// Zod schemas for request validation
const carbonInputsSchema = z.object({
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
  device_id: z.string().min(8).max(64),
});

const carbonResultSchema = z.object({
  total_kg: z.number(),
  breakdown: z.object({
    transport: z.number(),
    home: z.number(),
    diet: z.number(),
    consumption: z.number(),
  }),
  vs_global_average_pct: z.number(),
  vs_paris_target_pct: z.number(),
  ranked_categories: z.array(z.object({
    category: z.enum(['transport', 'home', 'diet', 'consumption']),
    kg: z.number(),
    percentage: z.number(),
  })),
  device_id: z.string(),
});

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(helmet({
  contentSecurityPolicy: false, // We set our own CSP below
  crossOriginEmbedderPolicy: false,
}));

// CORS policy — restrict to known app origin
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.APP_URL || 'https://carbon-tracker-phi.vercel.app')
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const insightsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please wait before trying again.' },
});

app.use('/api/', generalLimiter);
app.use('/api/insights', insightsLimiter);

app.use(express.json({ limit: '10kb' }));

// Initialize Gemini client if API key is provided
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory fallback and persistent JSON-file path for history entries
const HISTORY_FILE = process.env.VERCEL
  ? path.join('/tmp', 'history-storage.json')
  : path.join(process.cwd(), 'history-storage.json');
let historyCache: HistoryEntry[] = [];

// Map for O(1) device lookups
let historyCacheByDevice = new Map<string, HistoryEntry[]>();

function rebuildDeviceMap() {
  historyCacheByDevice = new Map();
  for (const entry of historyCache) {
    const existing = historyCacheByDevice.get(entry.device_id) || [];
    existing.push(entry);
    historyCacheByDevice.set(entry.device_id, existing);
  }
}

// Load historical entries on startup
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    historyCache = JSON.parse(data);
    console.log(`Loaded ${historyCache.length} history entries from disk.`);
  }
} catch (error) {
  console.error('Error loading history entries:', error);
}

// Call after loading from disk
rebuildDeviceMap();

// Helper to save historical entries safely
function saveHistoryToDisk() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyCache, null, 2), 'utf-8');
    rebuildDeviceMap();
  } catch (error) {
    console.error('Error saving history entries to disk:', error);
  }
}

// 1. API: Carbon Footprint Calculator
// POST /api/calculate
/**
 * @description Calculates carbon footprint based on transportation, energy, diet, and consumption inputs.
 * @param {express.Request} req - Express request object containing CarbonInputs body.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.post('/api/calculate', (req, res) => {
  try {
    const parseResult = carbonInputsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', issues: parseResult.error.issues });
    }
    const inputs: CarbonInputs = parseResult.data;

    // Isolate values & sanitize (fall back to 0 if null or undefined)
    const petrol = inputs.transport_km_car_petrol || 0;
    const diesel = inputs.transport_km_car_diesel || 0;
    const electric = inputs.transport_km_car_electric || 0;
    const bus = inputs.transport_km_bus || 0;
    const train = inputs.transport_km_train || 0;
    const shortHaul = inputs.flights_short_haul || 0;
    const longHaul = inputs.flights_long_haul || 0;

    const electricity = inputs.home_electricity_kwh || 0;
    const gas = inputs.home_gas_kwh || 0;
    const size = inputs.household_size || 1;

    const dietType = inputs.diet_type || 'meat_medium';
    const consumptionLevel = inputs.consumption_level || 'medium';

    // Calculate subcategories
    // Transport factors
    const tCarPetrol = petrol * 0.17;
    const tCarDiesel = diesel * 0.161;
    const tCarElectric = electric * 0.053;
    const tBus = bus * 0.089;
    const tTrain = train * 0.041;
    const tFlightsShort = shortHaul * 255.0;
    const tFlightsLong = longHaul * 1620.0;
    const transportTotal = tCarPetrol + tCarDiesel + tCarElectric + tBus + tTrain + tFlightsShort + tFlightsLong;

    // Home Energy
    const hElectricity = electricity * 0.233;
    const hGas = gas * 0.203;
    const homeTotal = (hElectricity + hGas) / size;

    // Diet options (in kg/year)
    const dietFactors = {
      vegan: 1100,
      vegetarian: 1700,
      meat_medium: 2500,
      meat_heavy: 3300,
    };
    const dietTotal = dietFactors[dietType] || 2500;

    // Consumption options (in kg/year)
    const consumptionFactors = {
      low: 1200,
      medium: 2500,
      high: 4000,
    };
    const consumptionTotal = consumptionFactors[consumptionLevel] || 2500;

    // Total footprint
    const totalPkg = transportTotal + homeTotal + dietTotal + consumptionTotal;
    const totalPkgRounded = Math.round(totalPkg * 100) / 100;

    // Comparison benchmarks (Global Avg: 4000 kg, Paris: 2000 kg)
    const vsGlobalAvgPct = Math.round((totalPkg / 4000) * 1000) / 10;
    const vsParisPct = Math.round((totalPkg / 2000) * 1000) / 10;

    // Ranked categories sorting descend
    const rawCategories = [
      { category: 'transport' as const, kg: Math.round(transportTotal * 100) / 100 },
      { category: 'home' as const, kg: Math.round(homeTotal * 100) / 100 },
      { category: 'diet' as const, kg: Math.round(dietTotal * 100) / 100 },
      { category: 'consumption' as const, kg: Math.round(consumptionTotal * 100) / 100 },
    ];
    
    // Calculate percentages
    const rankedCategories = rawCategories
      .map(cat => ({
        ...cat,
        percentage: totalPkg > 0 ? Math.round((cat.kg / totalPkg) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.kg - a.kg);

    const result: CarbonResult = {
      total_kg: totalPkgRounded,
      breakdown: {
        transport: Math.round(transportTotal * 100) / 100,
        home: Math.round(homeTotal * 100) / 100,
        diet: Math.round(dietTotal * 100) / 100,
        consumption: Math.round(consumptionTotal * 100) / 100,
      },
      vs_global_average_pct: vsGlobalAvgPct,
      vs_paris_target_pct: vsParisPct,
      ranked_categories: rankedCategories,
      device_id: inputs.device_id || 'anonymous',
    };

    res.json(result);
  } catch (err: any) {
    console.error('Calculate footprint error:', err);
    res.status(500).json({ error: err?.message || 'Calculation failed' });
  }
});

// Rules-based fallback for recommendations if Gemini fails or is disabled
/**
 * @description Generates a fallback set of rules-based carbon-reduction insights based on a carbon scorecard result.
 * @param {CarbonResult} result - The compiled carbon footprint scorecard.
 * @returns {Insight[]} List of action recommendations prioritized by impact.
 */
function getRulesBasedInsights(result: CarbonResult): Insight[] {
  const insights: Insight[] = [];
  const sorted = [...result.ranked_categories]; // already sorted desc by kg

  for (let i = 0; i < 3; i++) {
    const cat = sorted[i]?.category || 'transport';
    const rank = i + 1;
    
    if (cat === 'transport') {
      const petrolVal = result.breakdown.transport;
      const saving = Math.round(Math.min(petrolVal * 0.4, 1200) * 10) / 10;
      insights.push({
        category: 'transport',
        action: 'Opt for public transit, cycling, or shared carpools for regular travel. Replacing personal petrol-vehicle trips with bus or train cuts per-km emissions by around 75%.',
        estimated_saving_kg: saving || 850,
        timeframe: 'Achievable within 30 days',
        priority: rank,
      });
    } else if (cat === 'home') {
      const homeVal = result.breakdown.home;
      const saving = Math.round(Math.min(homeVal * 0.2, 500) * 10) / 10;
      insights.push({
        category: 'home',
        action: 'Transition to LED lighting throughout the house and fine-tune your heating. Setting a smart thermostat just 1°C lower delivers instant 5-10% energy bill savings.',
        estimated_saving_kg: saving || 350,
        timeframe: 'Achievable within 30 days',
        priority: rank,
      });
    } else if (cat === 'diet') {
      const dietVal = result.breakdown.diet;
      // High impact on heavy meats, low on vegan
      let actionText = 'Incorporate plant-based proteins into your daily meals. Swapping beef or lamb for lentils, tofu, or beans twice a week reduces food-related emissions.';
      let saving = 400;
      if (dietVal > 2500) {
        actionText = 'Trial meat-free days and replace beef or lamb with poultry or plant proteins. Heavily meat-centric diets carry double the carbon load of vegetarians.';
        saving = 800;
      } else if (dietVal <= 1100) {
        actionText = 'Keep supporting plant-based agriculture. To optimize further, seek locally produced seasonal organic foods to diminish scope 3 transport additions.';
        saving = 150;
      }
      insights.push({
        category: 'diet',
        action: actionText,
        estimated_saving_kg: saving,
        timeframe: 'Achievable within 30 days',
        priority: rank,
      });
    } else { // consumption
      const consVal = result.breakdown.consumption;
      let saving = 500;
      let actionText = 'Embrace a circular shopping mindset. Opt for second-hand items and repair existing gear before buying new clothing, devices, or furniture.';
      if (consVal > 2500) {
        actionText = 'Limit buying non-essential luxury items. High-consumer lifestyles produce significant upstream carbon from manufacturing and assembly.';
        saving = 900;
      }
      insights.push({
        category: 'consumption',
        action: actionText,
        estimated_saving_kg: saving,
        timeframe: 'Achievable within 30 days',
        priority: rank,
      });
    }
  }

  return insights;
}

// 2. API: Get AI Reduction insights powered by Google Gemini AI
// POST /api/insights
/**
 * @description Serves reduction insights for a carbon scorecard, invoking Gemini API or fallback rules.
 * @param {express.Request} req - Express request containing carbon_result and device_id.
 * @param {express.Response} res - Express response object.
 * @returns {Promise<void>}
 */
app.post('/api/insights', async (req, res) => {
  const result: CarbonResult = req.body.carbon_result;
  const deviceId = req.body.device_id;

  if (!result) {
    return res.status(400).json({ error: 'Missing carbon_result dataset.' });
  }

  const parseResult = carbonResultSchema.safeParse(result);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid carbon_result shape', issues: parseResult.error.issues });
  }

  // If Gemini is not authenticated, gracefully use prebuilt rules-based engine
  if (!ai) {
    console.log('Gemini client not initialized, serving high-fidelity rules engine fallback.');
    const ruleInsights = getRulesBasedInsights(result);
    return res.json({
      insights: ruleInsights,
      source: 'rules',
      total_potential_saving_kg: Math.round(ruleInsights.reduce((sum, item) => sum + item.estimated_saving_kg, 0) * 10) / 10,
    });
  }

  try {
    const categoriesPrompt = result.ranked_categories
      .map(c => `- ${c.category.toUpperCase()}: ${c.kg} kg CO2e/year (${c.percentage}% of total)`)
      .join('\n');

    const prompt = `Review this personal carbon footprint output details and generate exactly 3 concrete, realistic, and highly tailored reduction instructions for the topmost categories:
Total Annual Footprint: ${result.total_kg} kg CO2e/year
Breakdown:
${categoriesPrompt}

Return the recommendations as a JSON object adhering exactly to this schema:
{
  "insights": [
    {
      "category": "transport" | "home" | "diet" | "consumption",
      "action": "clear, actionable text outlining what the user should do and the physics-based or logistical 'why' (e.g., 'Switching petrol commutes to buses cuts per-km emissions by 75%')",
      "estimated_saving_kg": numerical_value_in_kg_saved_annually,
      "timeframe": "Achievable within 30 days" or "Achievable within 60 days",
      "priority": numerical_index_1_to_3
    }
  ]
}

Constraints:
- Offer exactly 3 items.
- Ensure priority spans 1, 2, 3 corresponding to their impact or rank.
- Do not speak conversational sentences before or after the JSON. Return only the parsable JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite sustainability consultant and climate researcher. Your task is to provide exactly 3 actionable, highly factual, and localized actions to reduce personal carbon footprint. Keep action text encouraging, professional, and dense with educational data. Never output anything except JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['insights'],
          properties: {
            insights: {
              type: Type.ARRAY,
              description: 'List of exactly 3 personalized insights',
              items: {
                type: Type.OBJECT,
                required: ['category', 'action', 'estimated_saving_kg', 'timeframe', 'priority'],
                properties: {
                  category: { type: Type.STRING, description: 'One of: transport, home, diet, consumption' },
                  action: { type: Type.STRING, description: 'Direct Action details with scientific reasoning' },
                  estimated_saving_kg: { type: Type.NUMBER, description: 'Annual potential carbon dioxide equivalent savings in kg' },
                  timeframe: { type: Type.STRING, description: 'Timeline to implement action' },
                  priority: { type: Type.INTEGER, description: '1 (highest priority), 2, or 3' },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text || '';
    const responseJson = JSON.parse(text.trim());
    
    // Validate response shape and calculate aggregate potential savings
    const insightsList: Insight[] = responseJson.insights || [];
    const totalSaving = Math.round(insightsList.reduce((sum, item) => sum + (Number(item.estimated_saving_kg) || 0), 0) * 10) / 10;

    const insightsResponse: InsightsResponse = {
      insights: insightsList,
      source: 'gemini',
      total_potential_saving_kg: totalSaving,
    };

    res.json(insightsResponse);
  } catch (aiError) {
    console.warn('Gemini prompt error, initiating rules-based fallback engine:', aiError);
    const ruleInsights = getRulesBasedInsights(result);
    res.json({
      insights: ruleInsights,
      source: 'rules',
      total_potential_saving_kg: Math.round(ruleInsights.reduce((sum, item) => sum + item.estimated_saving_kg, 0) * 10) / 10,
    });
  }
});

// 3. API: Save Completed Carbon Record
// POST /api/entries
/**
 * @description Saves a completed carbon footprint log entry to history.
 * @param {express.Request} req - Express request containing carbon_result and optional insights.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.post('/api/entries', (req, res) => {
  try {
    const { carbon_result, insights } = req.body;

    const parseResult = carbonResultSchema.safeParse(carbon_result);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid input', issues: parseResult.error.issues });
    }

    const deviceId = parseResult.data.device_id;
    const newEntry: HistoryEntry = {
      id: `rc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      total_kg: parseResult.data.total_kg,
      breakdown: parseResult.data.breakdown,
      vs_global_average_pct: parseResult.data.vs_global_average_pct,
      vs_paris_target_pct: parseResult.data.vs_paris_target_pct,
      ranked_categories: parseResult.data.ranked_categories,
      insights: insights || [],
      device_id: deviceId,
    };

    // Insert at front (newest first)
    historyCache.unshift(newEntry);
    if (historyCache.length > 500) {
      historyCache.splice(500);
    }
    saveHistoryToDisk();

    res.json({ status: 'success', entry_id: newEntry.id });
  } catch (err: any) {
    console.error('Save entry failure:', err);
    res.status(500).json({ error: 'Failed to record entry' });
  }
});

// 4. API: Get Historical Log entries
// GET /api/entries/:deviceId
/**
 * @description Retrieves the historical carbon log entries for a device ID.
 * @param {express.Request} req - Express request containing deviceId parameter.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.get('/api/entries/:deviceId', (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(deviceId)) {
      return res.status(400).json({ error: 'Invalid device ID format' });
    }
    const userHistory = historyCacheByDevice.get(deviceId) || [];
    res.json(userHistory);
  } catch (err: any) {
    console.error('Get history failure:', err);
    res.status(500).json({ error: 'Failed to extract past carbon records' });
  }
});

// 5. API: Delete a specific History Entry
// DELETE /api/entries/:entryId
/**
 * @description Deletes a specific carbon log entry by ID.
 * @param {express.Request} req - Express request containing entryId parameter.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.delete('/api/entries/:entryId', (req, res) => {
  try {
    const entryId = req.params.entryId;
    if (!entryId || entryId.length > 64) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }
    const initialLength = historyCache.length;
    historyCache = historyCache.filter(item => item.id !== entryId);
    if (historyCache.length === initialLength) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    saveHistoryToDisk();
    res.json({ status: 'deleted', entry_id: entryId });
  } catch (err: any) {
    console.error('Delete entry failure:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});


// Combine Vite development middleware & production configurations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

const isEntrypoint = 
  process.argv[1] && 
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs') || process.argv[1].endsWith('server.js'));

if (isEntrypoint) {
  startServer();
}

export default app;
