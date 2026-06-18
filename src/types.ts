export interface CarbonInputs {
  transport_km_car_petrol: number;
  transport_km_car_diesel: number;
  transport_km_car_electric: number;
  transport_km_bus: number;
  transport_km_train: number;
  flights_short_haul: number;
  flights_long_haul: number;
  home_electricity_kwh: number;
  home_gas_kwh: number;
  household_size: number;
  diet_type: 'meat_heavy' | 'meat_medium' | 'vegetarian' | 'vegan';
  consumption_level: 'high' | 'medium' | 'low';
  device_id: string;
}

export interface CarbonResult {
  total_kg: number;
  breakdown: {
    transport: number;
    home: number;
    diet: number;
    consumption: number;
  };
  vs_global_average_pct: number;
  vs_paris_target_pct: number;
  ranked_categories: Array<{
    category: 'transport' | 'home' | 'diet' | 'consumption';
    kg: number;
    percentage: number;
  }>;
  device_id: string;
}

export interface Insight {
  category: 'transport' | 'home' | 'diet' | 'consumption';
  action: string;
  estimated_saving_kg: number;
  timeframe: string;
  priority: number;
}

export interface InsightsResponse {
  insights: Insight[];
  source: 'rules' | 'gemini';
  total_potential_saving_kg: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string; // ISO format
  total_kg: number;
  breakdown: {
    transport: number;
    home: number;
    diet: number;
    consumption: number;
  };
  vs_global_average_pct: number;
  vs_paris_target_pct: number;
  ranked_categories: Array<{
    category: 'transport' | 'home' | 'diet' | 'consumption';
    kg: number;
    percentage: number;
  }>;
  insights: Insight[];
  device_id: string;
}
