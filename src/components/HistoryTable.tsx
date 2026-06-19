import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Trash2 } from 'lucide-react';
import { HistoryEntry } from '../types';
import { getCategoryLabel, getCategoryEmoji } from '../utils/categoryUtils';

interface HistoryTableProps {
  history: HistoryEntry[];
  onDeleteEntry?: (id: string) => void;
}

// Utility formatting values
const formatKgValue = (val: number): string => {
  return val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${Math.round(val)} kg`;
};

// Formats detailed row labels
const formatDateStr = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
};

const HistoryTable: React.FC<HistoryTableProps> = ({ history, onDeleteEntry }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3">
        <p className="text-gray-600">No calculation history found for this device yet.</p>
        <p className="text-xs text-gray-500">Complete a carbon footprint calculation to record an entry.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Past Calculations ({history.length})</h3>
        <p className="text-xs text-gray-500">Stored on your browser and account cache</p>
      </div>
      <div className="divide-y divide-gray-100">
        {history.map(entry => {
          const isExpanded = !!expandedIds[entry.id];
          
          // Identify the main emission driver (highest kg)
          const highestCat = entry.ranked_categories?.[0] || { category: 'general', percentage: 100 };
          const categoryLabel = getCategoryLabel(highestCat.category);
          const categoryEmoji = getCategoryEmoji(highestCat.category);

          return (
            <div key={entry.id} className="transition-colors hover:bg-gray-50/50">
              {/* Outer summary row */}
              <button
                onClick={() => toggleExpand(entry.id)}
                className="w-full text-left px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 focus:outline-none focus:bg-gray-50"
                aria-expanded={isExpanded}
                aria-controls={`detail-${entry.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-xl text-primary-700" aria-hidden="true">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{formatDateStr(entry.timestamp)}</p>
                    <p className="text-xs text-gray-500">Device footprint log</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center sm:justify-end gap-3 sm:gap-6">
                  <div className="flex flex-col sm:items-end">
                    <span className="text-base font-bold text-gray-900">
                      {formatKgValue(entry.total_kg)} CO₂e
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      Driver: {categoryEmoji} {categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full">
                      Details
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4.5 h-4.5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expansion Detail Rows (corresponds to cr component) */}
              {isExpanded && (
                <div
                  id={`detail-${entry.id}`}
                  className="px-5 pb-5 sm:px-6 bg-gray-50/30 border-t border-dashed border-gray-100 animate-slide-down space-y-6 pt-4"
                >
                  {/* Category Grid breakdown with values & percentages */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
                      Emission Breakdown
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['transport', 'home', 'diet', 'consumption'] as const).map(cat => {
                        const rawKg = entry.breakdown[cat] || 0;
                        const pct = entry.total_kg > 0 ? (rawKg / entry.total_kg) * 100 : 0;
                        const col = getCategoryEmoji(cat);
                        const lbl = getCategoryLabel(cat);

                        return (
                          <div key={cat} className="bg-white border border-gray-100 rounded-xl p-3 shadow-2xs">
                            <span className="text-lg block mb-1" aria-hidden="true">{col}</span>
                            <span className="text-xs text-gray-600 font-medium block">{lbl}</span>
                            <span className="text-sm font-bold text-gray-900 mt-1 block">
                              {formatKgValue(rawKg)}
                            </span>
                            <span className="text-xs text-gray-500 block mt-0.5">
                              {pct.toFixed(1)}% of total
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Saved insights recommendations inside table expansion */}
                  {entry.insights && entry.insights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                        Planned Target Actions
                      </h4>
                      <div className="space-y-2">
                        {entry.insights.map((insight, index) => {
                          // Styling priorities with soft background shades
                          let priorityColor = 'border-amber-100 bg-amber-50 text-amber-700';
                          if (insight.priority === 1) {
                            priorityColor = 'border-red-100 bg-red-50 text-red-700';
                          } else if (insight.priority === 3) {
                            priorityColor = 'border-emerald-100 bg-emerald-50 text-emerald-700';
                          }

                          return (
                            <div
                              key={index}
                              className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3 shadow-2xs items-start"
                            >
                              <div
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${priorityColor}`}
                              >
                                P{insight.priority}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                  {insight.action}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                  <span>⏱️ {insight.timeframe}</span>
                                  <span>•</span>
                                  <span className="text-primary-700 font-semibold">
                                    Est. Action Saving: -{formatKgValue(insight.estimated_saving_kg)} CO₂e
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  {onDeleteEntry && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this footprint entry?')) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete entry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HistoryTable);
