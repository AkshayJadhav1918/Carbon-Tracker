import React from 'react';
import { RotateCcw, Sparkles, Award } from 'lucide-react';
import { CarbonResult, Insight } from '../types';
import ProgressBar from './ProgressBar';
import { getCategoryEmoji, getCategoryLabel } from '../utils/categoryUtils';

const CategoryBreakdownChart = React.lazy(() => import('./CategoryBreakdownChart'));

interface ResultsPanelProps {
  carbonResult: CarbonResult;
  setActiveTab: (tab: 'calculator' | 'results' | 'history') => void;
  insights: Insight[];
  insightsLoading: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  carbonResult,
  setActiveTab,
  insights,
  insightsLoading,
}) => {
  return (
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
              <span className="text-base font-normal text-gray-600">of CO₂e / year</span>
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
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
            <p className="text-[11px] text-gray-600 mt-0.5">Annual kg CO₂e breakdown by category</p>
          </div>
          <React.Suspense fallback={
            <div className="h-56 bg-gray-50/50 animate-pulse rounded-xl flex flex-col items-center justify-center text-xs text-gray-400 border border-gray-100/50">
              <svg className="animate-spin h-5 w-5 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading breakdown chart...</span>
            </div>
          }>
            <CategoryBreakdownChart
              breakdown={carbonResult.breakdown}
              rankedCategories={carbonResult.ranked_categories}
            />
          </React.Suspense>
        </div>

        {/* Breakdown detail list */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-xs md:col-span-12 lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Primary Impact Driver</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">Where carbon emissions are heaviest</p>
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
                      <p className="text-[10px] text-gray-600 mt-0.5">Sector rank #{idx + 1}</p>
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
            <Award className="w-4 h-4 text-primary-700 shrink-0 mt-0.5 animate-bounce" />
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
            <p className="text-[11px] text-gray-600 mt-0.5">
              Action recommendations prioritized by carbon conservation intensity
            </p>
          </div>
          
          {insightsLoading && (
            <span className="text-xs text-primary-800 bg-primary-50 px-2.5 py-1 rounded-full animate-pulse font-medium shrink-0">
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
                    <p className="text-[10px] text-gray-600">⏱️ Implementation Timeframe:</p>
                    <p className="text-[11px] font-semibold text-gray-600">{insight.timeframe}</p>
                    <div className="pt-1.5 flex justify-between items-center text-xs">
                      <span className="text-gray-650 text-[10px]">Est saving:</span>
                      <span className="font-bold text-primary-700 font-mono">
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
            <div className="col-span-3 text-center py-6 text-xs text-gray-600">
              Generating suggestions to optimize target profiles...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ResultsPanel;
