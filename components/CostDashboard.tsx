// components/CostDashboard.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingDown, TrendingUp, Zap, AlertCircle, BarChart3 } from 'lucide-react';
import { costTracker, MODEL_PRICING, compareCosts, estimateTokens } from '@/lib/costTracking';

interface CostDashboardProps {
  onClose: () => void;
}

export default function CostDashboard({ onClose }: CostDashboardProps) {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [savings, setSavings] = useState<any[]>([]);

  useEffect(() => {
    updateStats();
  }, [timeframe]);

  const updateStats = () => {
    const cost = costTracker.getTotalCost(timeframe);
    const tokens = costTracker.getTotalTokens(timeframe);
    const opportunities = costTracker.getSavingsOpportunities();

    setTotalCost(cost);
    setTotalTokens(tokens);
    setSavings(opportunities);
  };

  const clearData = () => {
    if (confirm('Clear all cost tracking data? This cannot be undone.')) {
      costTracker.clear();
      updateStats();
    }
  };

  // Get free models
  const freeModels = Object.entries(MODEL_PRICING)
    .filter(([_, pricing]) => pricing.inputCostPer1M === 0)
    .map(([id, pricing]) => ({
      id,
      name: pricing.model,
      provider: pricing.provider,
      freeTier: pricing.freeTier
    }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-5xl my-8">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-white">Cost Optimization Dashboard</h3>
              </div>
              <p className="text-sm text-gray-400">
                Track API costs and discover savings opportunities
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 mt-4">
            {(['day', 'week', 'month', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tf === 'all' ? 'All Time' : `Last ${tf.charAt(0).toUpperCase() + tf.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-medium text-green-300">Total Spent</h4>
              </div>
              <p className="text-3xl font-bold text-white">
                ${totalCost.toFixed(4)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {timeframe === 'all' ? 'All time' : `Last ${timeframe}`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-medium text-blue-300">Total Tokens</h4>
              </div>
              <p className="text-3xl font-bold text-white">
                {totalTokens.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Input + Output combined
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-medium text-purple-300">Potential Savings</h4>
              </div>
              <p className="text-3xl font-bold text-white">
                ${savings.reduce((sum, s) => sum + s.potentialSavings, 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                By switching models
              </p>
            </div>
          </div>

          {/* Savings Opportunities */}
          {savings.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-white">Savings Opportunities</h4>
              </div>
              
              <div className="space-y-2">
                {savings.slice(0, 5).map((saving, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium mb-1">
                          Switch from <span className="text-red-400">{saving.fromModel}</span> to{' '}
                          <span className="text-green-400">{saving.toModel}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {saving.requestCount} requests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">
                          -${saving.potentialSavings.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">per period</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free Models Recommendation */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-300 mb-2">💰 100% Free AI Models Available</h4>
                <p className="text-sm text-gray-300 mb-3">
                  These models have NO API costs and can save you significant money:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {freeModels.map((model) => (
                    <div
                      key={model.id}
                      className="bg-gray-900/50 rounded p-2 border border-gray-700"
                    >
                      <p className="text-sm font-medium text-white">{model.name}</p>
                      <p className="text-xs text-gray-400">{model.provider}</p>
                      {model.freeTier && (
                        <p className="text-xs text-green-400 mt-1">
                          {model.freeTier.requestsPerDay && `${model.freeTier.requestsPerDay.toLocaleString()} req/day`}
                          {model.freeTier.requestsPerMonth && `${model.freeTier.requestsPerMonth.toLocaleString()} req/month`}
                          {model.freeTier.requestsPerDay === Infinity && 'Unlimited (Local)'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cost Comparison Tool */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h4 className="font-semibold text-white">Quick Cost Comparison</h4>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Compare costs for a typical request across different models:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(MODEL_PRICING).slice(0, 8).map(([id, pricing]) => {
                  const cost = (1000 / 1_000_000) * (pricing.inputCostPer1M + pricing.outputCostPer1M);
                  
                  return (
                    <div
                      key={id}
                      className={`p-3 rounded-lg border ${
                        cost === 0
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-gray-900 border-gray-700'
                      }`}
                    >
                      <p className="text-xs font-medium text-white mb-1">{pricing.model}</p>
                      <p className="text-lg font-bold">
                        <span className={cost === 0 ? 'text-green-400' : 'text-gray-300'}>
                          {cost === 0 ? 'FREE' : `$${cost.toFixed(5)}`}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">per 1K tokens</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-300 mb-2">💡 Cost Optimization Tips</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Use smaller models (8B) for simple tasks - they're 10-50x cheaper</li>
                  <li>• Try Groq or Cerebras for FREE ultra-fast inference</li>
                  <li>• Run Ollama locally for zero API costs and complete privacy</li>
                  <li>• Batch requests when possible to reduce overhead</li>
                  <li>• Use max_tokens limits to control output costs</li>
                  <li>• Cache common responses to avoid redundant API calls</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex items-center justify-between">
          <button
            onClick={clearData}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear Tracking Data
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
