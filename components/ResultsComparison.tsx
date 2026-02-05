// components/ResultsComparison.tsx
'use client'

import React, { useState } from 'react';
import { X, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface ComparisonProps {
  onClose: () => void;
  availableResults: Array<{
    id: string;
    timestamp: Date;
    endpointName: string;
    variants: any[];
    scores: number[];
    explanations: string[];
    summary?: any;
  }>;
}

export default function ResultsComparison({ onClose, availableResults }: ComparisonProps) {
  const [selectedResult1, setSelectedResult1] = useState<string>('');
  const [selectedResult2, setSelectedResult2] = useState<string>('');

  const result1 = availableResults.find(r => r.id === selectedResult1);
  const result2 = availableResults.find(r => r.id === selectedResult2);

  // Calculate differences
  const calculateDiff = () => {
    if (!result1 || !result2) return null;

    const avgScore1 = result1.scores.reduce((a, b) => a + b, 0) / result1.scores.length;
    const avgScore2 = result2.scores.reduce((a, b) => a + b, 0) / result2.scores.length;
    const scoreDelta = avgScore2 - avgScore1;
    const scorePercentChange = (scoreDelta / avgScore1) * 100;

    return {
      avgScore1,
      avgScore2,
      scoreDelta,
      scorePercentChange,
      improved: scoreDelta < 0, // Lower anomaly score is better
      variantCountDiff: result2.variants.length - result1.variants.length
    };
  };

  const diff = calculateDiff();

  // Find matching variants between two results
  const findMatchingVariants = () => {
    if (!result1 || !result2) return [];

    return result1.variants.map((v1, idx1) => {
      const matchIdx = result2.variants.findIndex(v2 => v2.type === v1.type);
      
      if (matchIdx >= 0) {
        const score1 = result1.scores[idx1];
        const score2 = result2.scores[matchIdx];
        const delta = score2 - score1;
        
        return {
          type: v1.type,
          score1,
          score2,
          delta,
          percentChange: (delta / score1) * 100,
          explanation1: result1.explanations[idx1],
          explanation2: result2.explanations[matchIdx],
          improved: delta < 0
        };
      }
      
      return null;
    }).filter(Boolean);
  };

  const matchingVariants = findMatchingVariants();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-6xl my-8">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Compare Test Results</h3>
              <p className="text-sm text-gray-400">
                Compare two test runs to detect drift, improvements, or regressions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Result Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Baseline (Before)
              </label>
              <select
                value={selectedResult1}
                onChange={(e) => setSelectedResult1(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a result...</option>
                {availableResults.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.endpointName} - {new Date(result.timestamp).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current (After)
              </label>
              <select
                value={selectedResult2}
                onChange={(e) => setSelectedResult2(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a result...</option>
                {availableResults
                  .filter(r => r.id !== selectedResult1)
                  .map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.endpointName} - {new Date(result.timestamp).toLocaleString()}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Comparison Summary */}
          {diff && (
            <div className={`rounded-lg border p-4 ${
              diff.improved
                ? 'bg-green-500/10 border-green-500/30'
                : diff.scoreDelta > 0.1
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {diff.improved ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                ) : diff.scoreDelta > 0.1 ? (
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Minus className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${
                    diff.improved ? 'text-green-300' : 
                    diff.scoreDelta > 0.1 ? 'text-red-300' : 'text-yellow-300'
                  }`}>
                    {diff.improved 
                      ? '✅ Model Performance Improved' 
                      : diff.scoreDelta > 0.1 
                      ? '⚠️ Model Performance Degraded' 
                      : '➡️ Minimal Change Detected'}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Avg Anomaly Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {(diff.avgScore1 * 100).toFixed(1)}%
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <span className={`font-bold ${
                          diff.improved ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(diff.avgScore2 * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 mb-1">Change</p>
                      <div className="flex items-center gap-1">
                        {diff.improved ? (
                          <TrendingDown className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`font-bold ${
                          diff.improved ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {diff.scoreDelta > 0 ? '+' : ''}{(diff.scoreDelta * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400 mb-1">Percent Change</p>
                      <span className={`font-bold ${
                        diff.improved ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {diff.scorePercentChange > 0 ? '+' : ''}{diff.scorePercentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Variant-by-Variant Comparison */}
          {matchingVariants.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h4 className="font-semibold text-white">Variant Comparison</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {matchingVariants.length} matching variants found
                </p>
              </div>

              <div className="divide-y divide-gray-700">
                {matchingVariants.map((variant: any, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-white mb-1">{variant.type}</h5>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">
                            Before: <span className="text-white font-medium">
                              {(variant.score1 * 100).toFixed(1)}%
                            </span>
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-400">
                            After: <span className={`font-medium ${
                              variant.improved ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {(variant.score2 * 100).toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        variant.improved
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : Math.abs(variant.delta) < 0.05
                          ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {variant.delta > 0 ? '+' : ''}{(variant.delta * 100).toFixed(2)}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-900/50 rounded p-2">
                        <p className="text-gray-500 mb-1">Before:</p>
                        <p className="text-gray-300">{variant.explanation1}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded p-2">
                        <p className="text-gray-500 mb-1">After:</p>
                        <p className="text-gray-300">{variant.explanation2}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No comparison selected */}
          {!result1 || !result2 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">Select two results to compare</p>
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
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
