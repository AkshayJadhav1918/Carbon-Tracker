import React, { useState, useEffect } from 'react';
import {
  Car,
  Plane,
  Home as HomeIcon,
  ShoppingBag,
  History,
  TrendingDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Globe,
  Award,
  BookOpen
} from 'lucide-react';
import { CarbonInputs, CarbonResult, Insight, HistoryEntry } from './types';
import ProgressBar from './components/ProgressBar';
import CategoryBreakdownChart, { getCategoryEmoji, getCategoryLabel } from './components/CategoryBreakdownChart';
import HistoryLineChart from './components/HistoryLineChart';
import HistoryTable from './components/HistoryTable';

// Default initial calculator form fields
const initialInputs: CarbonInputs = {
  transport_km_car_petrol: 0,
  transport_km_car_diesel: 0,
  transport_km_car_electric: 0,
  transport_km_bus: 0,
  transport_km_train: 0,
  flights_short_haul: 0,
  flights_long_haul: 0,
  home_electricity_kwh: 0,
  home_gas_kwh: 0,
  household_size: 1,
  diet_type: 'meat_medium',
  consumption_level: 'medium',
  device_id: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'results' | 'history'>('calculator');
  const [inputs, setInputs] = useState<CarbonInputs>(initialInputs);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Loading and result states
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [carbonResult, setCarbonResult] = useState<CarbonResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Synchronize or establish Client Device ID on load
  useEffect(() => {
    let devId = localStorage.getItem('carbon_device_id');
    if (!devId || devId.length < 8) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('carbon_device_id', devId);
    }
    setInputs(prev => ({ ...prev, device_id: devId || '' }));
    loadHistory(devId);
  }, []);

  // API Call to fetch list of past calculations for this client ID
  const loadHistory = async (devId: string) => {
    if (!devId) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/entries/${devId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load past calculations history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper local validation check matching Zod restrictions
  const validateField = (name: keyof CarbonInputs, value: any): string | undefined => {
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
      if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
        return 'Device ID may only contain letters, numbers, hyphens and underscores';
      }
    }
    return undefined;
  };

  const handleInputChange = (name: keyof CarbonInputs, val: any) => {
    setInputs(prev => ({ ...prev, [name]: val }));
    
    if (touchedFields[name]) {
      const error = validateField(name, val);
      setFormErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
    if (calcError) setCalcError(null);
  };

  const handleInputBlur = (name: keyof CarbonInputs) => {
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, inputs[name]);
    setFormErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  };

  // Switch Device ID to load alternative dashboard history profiles
  const handleDeviceIDChange = (newId: string) => {
    handleInputChange('device_id', newId);
    if (/^[a-zA-Z0-9_-]{8,64}$/.test(newId)) {
      localStorage.setItem('carbon_device_id', newId);
      loadHistory(newId);
    }
  };

  // Submit complete questionnaire
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger full touched validation
    const errors: Record<string, string> = {};
    const touched: Record<string, boolean> = {};

    Object.keys(inputs).forEach(key => {
      const field = key as keyof CarbonInputs;
      touched[field] = true;
      const err = validateField(field, inputs[field]);
      if (err) {
        errors[field] = err;
      }
    });

    setFormErrors(errors);
    setTouchedFields(touched);

    if (Object.keys(errors).length > 0) {
      // Focus first error element
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      el?.focus();
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    try {
      // Step 1: Query API backend to calculate raw numerical outputs
      const calcRes = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!calcRes.ok) {
        const errObj = await calcRes.json();
        throw new Error(errObj.error || 'Emissions engine logic failed.');
      }

      const calculatedOutput: CarbonResult = await calcRes.json();
      setCarbonResult(calculatedOutput);

      // Step 2: Fetch customized advisory reduction instructions (rules/Gemini)
      setInsightsLoading(true);
      const insightsRes = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carbon_result: calculatedOutput,
          device_id: inputs.device_id,
        }),
      });

      let calculatedInsights: Insight[] = [];
      if (insightsRes.ok) {
        const insightsObj = await insightsRes.json();
        calculatedInsights = insightsObj.insights || [];
        setInsights(calculatedInsights);
      } else {
        console.warn('Could not load AI recommendations. Proceeding with rules fallbacks.');
      }
      setInsightsLoading(false);

      // Step 3: Record calculation details persistently in historical logs
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carbon_result: calculatedOutput,
          insights: calculatedInsights,
        }),
      });

      // Reload saved trends
      await loadHistory(inputs.device_id);

      // Transition smoothly of tabs to Results screen
      setActiveTab('results');
    } catch (err: any) {
      console.error('Calculation flow failure:', err);
      setCalcError(err?.message || 'Calculation failed. Please check network logs and retry.');
    } finally {
      setIsCalculating(false);
      setInsightsLoading(false);
    }
  };

  // Mock entry deleter for cached client convenience
  const handleDeleteHistoryEntry = async (id: string) => {
    // Standard interface deletes it from state
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleTabChange = (tab: 'calculator' | 'results' | 'history') => {
    if (tab === 'calculator' && carbonResult) {
      // If we already compiled values, keep on results or let them click back
      setActiveTab('calculator');
    } else {
      setActiveTab(tab);
    }
  };

  // Helper form label header renderer
  const SectionHeader = ({ icon, title, description, id }: { icon: string, title: string, description: string, id: string }) => (
    <div className="flex items-start gap-3 mb-5 pb-3 border-b border-gray-100">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <div>
        <h2 id={id} className="text-lg font-bold text-gray-900 font-display">
          {title}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );

  // Form input field renderer
  const InputField = ({
    id,
    label,
    value,
    unit,
    helper,
    error,
    step = 'any',
    min = 0,
    max,
    onChange,
    onBlur,
  }: {
    id: keyof CarbonInputs;
    label: string;
    value: number;
    unit: string;
    helper: string;
    error?: string;
    step?: number | string;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
    onBlur: () => void;
  }) => {
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const ariaDescribedBy = [helper ? helperId : '', error ? errorId : ''].filter(Boolean).join(' ');

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
          {unit && <span className="text-gray-400 font-normal ml-1">({unit})</span>}
        </label>
        <input
          id={id}
          type="number"
          value={value === 0 ? '' : value}
          min={min}
          max={max}
          step={step}
          placeholder="0"
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={!!error}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onBlur={onBlur}
          className={`
            w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-all duration-150 font-mono
            ${error ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}
          `}
        />
        {helper && (
          <span id={helperId} className="block text-xs text-gray-500 leading-normal">
            {helper}
          </span>
        )}
        {error && (
          <span id={errorId} role="alert" className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      {/* 1. STICKY ACTION HEADER BAR */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 py-4 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Globe logo">🌍</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight font-display">
                Carbon Tracker
              </h1>
              <p className="text-[10px] text-gray-400 font-mono hidden sm:block">Annual Footprint Tracker</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-gray-100 border border-gray-100 p-1 rounded-xl" role="tablist">
            <button
              onClick={() => handleTabChange('calculator')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'calculator' || activeTab === 'results'
                  ? 'bg-white text-primary-700 shadow-xs border border-gray-100/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'calculator' || activeTab === 'results'}
              aria-label="Calculator questionnaire"
            >
              Calculator
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-primary-700 shadow-xs border border-gray-100/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-label="Past calculations log history"
            >
              History
            </button>
          </nav>
        </div>
      </header>

      {/* 2. DEVICE ID MANAGEMENT ACCESS PANEL */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <UserCheck className="w-4 h-4 text-primary-600" />
            <span>
              Tracking active calculations profile for device:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="device_id"
              name="device_id"
              type="text"
              value={inputs.device_id}
              onChange={e => handleDeviceIDChange(e.target.value)}
              placeholder="Enter device sync code"
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-700 font-mono w-48 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {formErrors.device_id && (
              <span className="text-[10px] text-red-500 font-medium">⚠️ Format error</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD STAGE BODY */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8">
        
        {/* Tab 1: Form Questionnaire Inputs */}
        {activeTab === 'calculator' && (
          <form
            onSubmit={handleSubmitForm}
            aria-label="Carbon footprint calculator input form"
            noValidate
            className="space-y-8 animate-fade-in"
          >
            {/* Sector A: Transport */}
            <section
              aria-labelledby="transport-heading"
              className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-6"
            >
              <SectionHeader
                id="transport-heading"
                icon="🚗"
                title="Transport"
                description="Enter your annual travel distances in kilometres and number of flights."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="transport_km_car_petrol"
                  label="Petrol Car"
                  value={inputs.transport_km_car_petrol}
                  unit="km/year"
                  helper="Driving in a petrol or hybrid car"
                  error={formErrors.transport_km_car_petrol}
                  onChange={v => handleInputChange('transport_km_car_petrol', v)}
                  onBlur={() => handleInputBlur('transport_km_car_petrol')}
                />
                <InputField
                  id="transport_km_car_diesel"
                  label="Diesel Car"
                  value={inputs.transport_km_car_diesel}
                  unit="km/year"
                  helper="Driving in a diesel fuel car"
                  error={formErrors.transport_km_car_diesel}
                  onChange={v => handleInputChange('transport_km_car_diesel', v)}
                  onBlur={() => handleInputBlur('transport_km_car_diesel')}
                />
                <InputField
                  id="transport_km_car_electric"
                  label="Electric Vehicle"
                  value={inputs.transport_km_car_electric}
                  unit="km/year"
                  helper="Driving in a battery electric vehicle"
                  error={formErrors.transport_km_car_electric}
                  onChange={v => handleInputChange('transport_km_car_electric', v)}
                  onBlur={() => handleInputBlur('transport_km_car_electric')}
                />
                <InputField
                  id="transport_km_bus"
                  label="Bus"
                  value={inputs.transport_km_bus}
                  unit="km/year"
                  helper="Travel by bus, coach or public shuttle"
                  error={formErrors.transport_km_bus}
                  onChange={v => handleInputChange('transport_km_bus', v)}
                  onBlur={() => handleInputBlur('transport_km_bus')}
                />
                <InputField
                  id="transport_km_train"
                  label="Train / Metro"
                  value={inputs.transport_km_train}
                  unit="km/year"
                  helper="Travel by train, metro or overground tram"
                  error={formErrors.transport_km_train}
                  onChange={v => handleInputChange('transport_km_train', v)}
                  onBlur={() => handleInputBlur('transport_km_train')}
                />
                <InputField
                  id="flights_short_haul"
                  label="Short-Haul Flights"
                  value={inputs.flights_short_haul}
                  unit="flights/year"
                  helper="Under 3 hours duration (e.g. within Europe)"
                  error={formErrors.flights_short_haul}
                  step={1}
                  min={0}
                  max={50}
                  onChange={v => handleInputChange('flights_short_haul', Math.round(v))}
                  onBlur={() => handleInputBlur('flights_short_haul')}
                />
                <InputField
                  id="flights_long_haul"
                  label="Long-Haul Flights"
                  value={inputs.flights_long_haul}
                  unit="flights/year"
                  helper="Over 3 hours duration (e.g. trans-atlantic)"
                  error={formErrors.flights_long_haul}
                  step={1}
                  min={0}
                  max={20}
                  onChange={v => handleInputChange('flights_long_haul', Math.round(v))}
                  onBlur={() => handleInputBlur('flights_long_haul')}
                />
              </div>
            </section>

            {/* Sector B: Home Energy */}
            <section
              aria-labelledby="home-heading"
              className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-6"
            >
              <SectionHeader
                id="home-heading"
                icon="🏠"
                title="Home Energy"
                description="Your household's annual energy consumption. Totals are split equally across household inhabitants."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id="home_electricity_kwh"
                  label="Electricity"
                  value={inputs.home_electricity_kwh}
                  unit="kWh/year"
                  helper="Annual domestic electricity usage (UK avg is ~2,900-3,700 kWh)"
                  error={formErrors.home_electricity_kwh}
                  onChange={v => handleInputChange('home_electricity_kwh', v)}
                  onBlur={() => handleInputBlur('home_electricity_kwh')}
                />
                <InputField
                  id="home_gas_kwh"
                  label="Natural Gas"
                  value={inputs.home_gas_kwh}
                  unit="kWh/year"
                  helper="Annual domestic heating gas usage (UK avg is ~12,000 kWh)"
                  error={formErrors.home_gas_kwh}
                  onChange={v => handleInputChange('home_gas_kwh', v)}
                  onBlur={() => handleInputBlur('home_gas_kwh')}
                />
                <InputField
                  id="household_size"
                  label="Household Size"
                  value={inputs.household_size}
                  unit="people"
                  helper="Number of people sharing energy bills (shares carbon footprint)"
                  error={formErrors.household_size}
                  step={1}
                  min={1}
                  max={10}
                  onChange={v => handleInputChange('household_size', Math.round(v))}
                  onBlur={() => handleInputBlur('household_size')}
                />
              </div>
            </section>

            {/* Sector C: Diet & Lifestyle */}
            <section
              aria-labelledby="lifestyle-heading"
              className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 sm:p-6 space-y-6"
            >
              <SectionHeader
                id="lifestyle-heading"
                icon="🥗"
                title="Diet & Lifestyle"
                description="Your dietary pattern and generic consumer shopping habits account for major greenhouse output."
              />
              <div className="space-y-6">
                <div>
                  <fieldset>
                    <legend className="text-sm font-semibold text-gray-700 mb-3">
                      Diet Type
                      <span className="block text-xs font-normal text-gray-400 mt-0.5">
                        Select the choice which closest represents your normal eating diet:
                      </span>
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: 'meat_heavy', label: '🥩 Meat-heavy', desc: 'Eat meat with most regular meals (>100g/day)' },
                        { value: 'meat_medium', label: '🍗 Meat-moderate', desc: 'Eat poultry/meat a few times a week' },
                        { value: 'vegetarian', label: '🥚 Vegetarian', desc: 'No meat or fish, but cheese, milk and eggs ok' },
                        { value: 'vegan', label: '🌱 Vegan', desc: 'Strictly plant-based nutrition only' },
                      ].map(({ value, label, desc }) => (
                        <label
                          key={value}
                          htmlFor={`diet-${value}`}
                          className={`
                            flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer
                            transition-all duration-150 hover:border-primary-300
                            ${
                              inputs.diet_type === value
                                ? 'border-primary-500 bg-primary-50/50 shadow-2xs'
                                : 'border-gray-200 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            id={`diet-${value}`}
                            name="diet_type"
                            value={value}
                            checked={inputs.diet_type === value}
                            onChange={() => handleInputChange('diet_type', value)}
                            className="mt-1 accent-primary-600 focus:ring-primary-500 shrink-0"
                          />
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">{label}</span>
                            <span className="block text-xs text-gray-500 mt-0.5 inline-block">{desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label htmlFor="consumption_level" className="block text-sm font-semibold text-gray-700">
                    Shopping & Consumption Level
                  </label>
                  <span id="consumption-helper" className="text-xs text-gray-500 block leading-normal">
                    How often do you purchase new retail goods (fashion, electronics, furniture)?
                  </span>
                  <select
                    id="consumption_level"
                    name="consumption_level"
                    value={inputs.consumption_level}
                    onChange={e => handleInputChange('consumption_level', e.target.value)}
                    aria-describedby="consumption-helper"
                    className="
                      w-full sm:w-80 rounded-xl border border-gray-200 px-4 py-3 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      bg-white hover:border-gray-300 transition-colors duration-150
                    "
                  >
                    <option value="low">🌿 Low — mostly second-hand and vintage, very few new goods</option>
                    <option value="medium">⚖️ Medium — average standard retailer purchasing frequency</option>
                    <option value="high">🛒 High — frequent trend compras, electronic upgrades and appliances</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Error Indicators */}
            {calcError && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start animate-slide-down">
                <AlertTriangle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Calculation aborted</p>
                  <p className="text-xs text-red-600 mt-1">{calcError}</p>
                </div>
              </div>
            )}

            {/* Submit Action Block */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isCalculating}
                aria-busy={isCalculating}
                className="
                  flex items-center gap-2 bg-primary-600 text-white
                  px-8 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-primary-600/10
                  hover:bg-primary-700 active:scale-[0.98] transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                  min-w-[260px] justify-center
                "
              >
                {isCalculating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Calculating Footprint...</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>Calculate my carbon footprint</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Results Advisory Dashboard */}
        {activeTab === 'results' && carbonResult && (
          <div className="space-y-8 animate-fade-in text-gray-850">
            
            {/* Top Row: General results statement and summary score */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary-50 rounded-full blur-2xl opacity-50 -z-10" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                    Your Results Scorecard
                  </span>
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight font-display mt-2">
                    {carbonResult.total_kg >= 1000
                      ? `${(carbonResult.total_kg / 1000).toFixed(2)} tonnes`
                      : `${Math.round(carbonResult.total_kg)} kg`}{' '}
                    <span className="text-base font-normal text-gray-500">of CO₂e / year</span>
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Estimated total greenhouse impact based on transportation models, energy grid intensity maps, organic diet margins, and material consumption indices.
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-all shrink-0 self-start md:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recalculate Inputs</span>
                </button>
              </div>

              {/* Progress Benchmarking Bars (He component) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-50">
                <ProgressBar
                  id="vs-global"
                  label="Global Average Comparison"
                  pct={carbonResult.vs_global_average_pct}
                  benchmark="global target standard"
                  benchmarkKg={4000}
                />
                <ProgressBar
                  id="vs-paris"
                  label="Paris Agreement Target (Limit)"
                  pct={carbonResult.vs_paris_target_pct}
                  benchmark="Paris 1.5°C target limit"
                  benchmarkKg={2000}
                />
              </div>
            </div>

            {/* Middle Section: Breakdown details (Chart & Table) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Category Breakdown (sr component) */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs md:col-span-12 lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Carbon Footprint Breakdown</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Annual kg CO₂e breakdown by category</p>
                </div>
                <CategoryBreakdownChart
                  breakdown={carbonResult.breakdown}
                  rankedCategories={carbonResult.ranked_categories}
                />
              </div>

              {/* Breakdown detail list */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs md:col-span-12 lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Primary Impact Driver</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Where carbon emissions are heaviest</p>
                </div>

                <div className="space-y-3.5 py-2">
                  {carbonResult.ranked_categories.map((c, idx) => {
                    const col = getCategoryEmoji(c.category);
                    const lbl = getCategoryLabel(c.category);
                    return (
                      <div key={c.category} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">{col}</span>
                          <div>
                            <p className="font-semibold text-gray-800 leading-none">{lbl}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Sector rank #{idx + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {c.kg >= 1000 ? `${(c.kg / 1000).toFixed(1)}t` : `${Math.round(c.kg)} kg`}
                          </p>
                          <p className="text-[10px] text-primary-700 font-medium">{c.percentage}% of total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-primary-600 shrink-0 mt-0.5 animate-bounce" />
                  <p className="text-[10px] text-primary-700 leading-normal">
                    Reducing emissions in your top sectors (<span className="font-bold">{getCategoryLabel(carbonResult.ranked_categories[0].category)}</span>) offers the fastest pathway to meeting individual offset budgets.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Advisory recommendations (ir and nr components) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-primary-500 fill-primary-100" />
                    <h3 className="text-sm font-bold text-gray-900 font-display">
                      Custom Reduction Action Insights
                    </h3>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Action recommendations prioritized by carbon conservation intensity
                  </p>
                </div>
                
                {insightsLoading && (
                  <span className="text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full animate-pulse font-medium shrink-0">
                    Syncing recommendations...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights && insights.length > 0 ? (
                  insights.map((insight, idx) => {
                    const colorMap: Record<number, string> = {
                      1: 'bg-red-500 shadow-red-100/30',
                      2: 'bg-amber-500 shadow-amber-100/30',
                      3: 'bg-emerald-500 shadow-emerald-100/30',
                    };
                    return (
                      <div
                        key={idx}
                        className="border border-gray-100 rounded-2xl p-4.5 space-y-3.5 bg-gray-50/20 relative shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="text-xl" aria-hidden="true">
                            {getCategoryEmoji(insight.category)}
                          </span>
                          <span
                            className={`text-[10px] text-white font-bold px-2 py-0.5 rounded-full shadow-sm ${
                              colorMap[insight.priority] || 'bg-primary-500'
                            }`}
                          >
                            Priority {insight.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed min-h-[72px]">
                          {insight.action}
                        </p>
                        <div className="border-t border-gray-100/80 pt-3 space-y-1">
                          <p className="text-[10px] text-gray-400">⏱️ Implementation Timeframe:</p>
                          <p className="text-[11px] font-semibold text-gray-600">{insight.timeframe}</p>
                          <div className="pt-1.5 flex justify-between items-center text-xs">
                            <span className="text-gray-400 text-[10px]">Est saving:</span>
                            <span className="font-bold text-primary-600 font-mono">
                              -{insight.estimated_saving_kg >= 1000
                                ? `${(insight.estimated_saving_kg / 1000).toFixed(1)}t`
                                : `${Math.round(insight.estimated_saving_kg)} kg`}{' '}
                              CO₂e/yr
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-6 text-xs text-gray-400">
                    Generating suggestions to optimize target profiles...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Historical Records table */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in text-gray-850">
            {/* Trend Graphs render nicely */}
            {history.length >= 2 && <HistoryLineChart history={history} />}

            {/* History logs with expanding Detail rows */}
            {isLoadingHistory ? (
              <div className="text-center py-12 space-y-2 select-none">
                <svg className="animate-spin h-6 w-6 text-primary-600 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs text-gray-450">Retrieving calculations history cache...</p>
              </div>
            ) : (
              <HistoryTable history={history} onDeleteEntry={handleDeleteHistoryEntry} />
            )}
          </div>
        )}

      </main>

      {/* 4. DESIGN PERSISTING FOOTER (matches sources in contentinfo) */}
      <footer role="contentinfo" className="border-t border-gray-100 bg-white mt-16 py-8 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                Data Sources
              </h2>
              <ul className="text-xs text-gray-500 space-y-1 list-none leading-relaxed">
                <li>UK DEFRA 2023 — Transport & Home Energy factors</li>
                <li>US EPA 2023 — Electricity grid emissions</li>
                <li>ICAO Carbon Calculator — Aviation emissions</li>
                <li>Our World in Data 2023 — Diet emissions & global average</li>
                <li>IPCC AR6 / SR1.5 — Consumption & Paris target</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary-600" />
                Methodology & Education Disclaimer
              </h2>
              <p className="text-xs text-gray-500 leading-normal">
                This tool provides estimates for educational purposes using peer-reviewed emission coefficients. Individual results may vary based on local electricity grid mix, heating system performance, vehicle fuel efficiency, and personal shopping cycles.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-gray-400">
            <span>© 2024 Carbon Footprint Awareness Platform</span>
            <span className="flex items-center gap-1">
              Powered by <span className="font-semibold text-primary-600 font-display">Gemini AI</span> & full-stack React models.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
