// components/AdversarialTestModal.tsx
'use client'

import React, { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, XCircle, Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ADVERSARIAL_ATTACKS, AdversarialAttack, calculateSafetyScore } from '@/lib/adversarialAttacks';

interface AdversarialTestModalProps {
  onClose: () => void;
  selectedEndpoint?: string;
  endpointName?: string;
  onRunTests: (attacks: AdversarialAttack[]) => Promise<any[]>;
}

export default function AdversarialTestModal({ 
  onClose, 
  selectedEndpoint,
  endpointName,
  onRunTests 
}: AdversarialTestModalProps) {
  const [selectedAttacks, setSelectedAttacks] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [safetyScore, setSafetyScore] = useState<any>(null);

  // Filter attacks
  const filteredAttacks = ADVERSARIAL_ATTACKS.filter(attack => {
    const categoryMatch = filterCategory === 'all' || attack.category === filterCategory;
    const severityMatch = filterSeverity === 'all' || attack.severity === filterSeverity;
    return categoryMatch && severityMatch;
  });

  // Toggle attack selection
  const toggleAttack = (id: string) => {
    const newSelected = new Set(selectedAttacks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttacks(newSelected);
  };

  // Select all filtered
  const selectAll = () => {
    const newSelected = new Set(filteredAttacks.map(a => a.id));
    setSelectedAttacks(newSelected);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedAttacks(new Set());
  };

  // Run adversarial tests
  const runTests = async () => {
    if (!selectedEndpoint) {
      alert('Please select an endpoint first');
      return;
    }

    if (selectedAttacks.size === 0) {
      alert('Please select at least one attack to test');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setSafetyScore(null);

    const attacksToRun = ADVERSARIAL_ATTACKS.filter(a => selectedAttacks.has(a.id));
    
    try {
      const results = await onRunTests(attacksToRun);
      setTestResults(results);

      // Calculate safety score
      const scoreData = results.map(r => ({
        passed: r.passed,
        severity: r.attack.severity
      }));
      const score = calculateSafetyScore(scoreData);
      setSafetyScore(score);

    } catch (error) {
      console.error('Adversarial testing failed:', error);
      alert('Testing failed. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-6xl my-8">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold text-white">Adversarial Safety Testing</h3>
              </div>
              <p className="text-sm text-gray-400">
                Test your AI model against {ADVERSARIAL_ATTACKS.length} known attack vectors
              </p>
              {endpointName && (
                <p className="text-xs text-gray-500 mt-1">
                  Target: <span className="text-indigo-400">{endpointName}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="jailbreak">Jailbreak</option>
              <option value="prompt_injection">Prompt Injection</option>
              <option value="data_leak">Data Leak</option>
              <option value="bias">Bias</option>
              <option value="hallucination">Hallucination</option>
              <option value="safety">Safety Bypass</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={selectAll}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Select All ({filteredAttacks.length})
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-800 max-h-[600px]">
          {/* Left: Attack List */}
          <div className="p-4 overflow-y-auto">
            <div className="space-y-2">
              {filteredAttacks.map((attack) => (
                <button
                  key={attack.id}
                  onClick={() => toggleAttack(attack.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedAttacks.has(attack.id)
                      ? 'bg-red-600/20 border-red-500'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {selectedAttacks.has(attack.id) ? (
                        <CheckCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-600 rounded" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white text-sm truncate">{attack.name}</p>
                        <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                          attack.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : attack.severity === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : attack.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {attack.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{attack.description}</p>
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                        {attack.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div className="p-4 overflow-y-auto">
            {testResults.length === 0 && !isRunning ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Select attacks and run tests to see results</p>
                  <p className="text-xs mt-2">
                    {selectedAttacks.size} attack{selectedAttacks.size !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
            ) : isRunning ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-400 animate-spin" />
                  <p className="text-white font-medium">Running adversarial tests...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Testing {selectedAttacks.size} attack vectors
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Safety Score */}
                {safetyScore && (
                  <div className={`p-4 rounded-lg border ${
                    safetyScore.score >= 90
                      ? 'bg-green-500/10 border-green-500/30'
                      : safetyScore.score >= 70
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">Safety Score</h4>
                      <span className={`text-3xl font-bold ${
                        safetyScore.score >= 90 ? 'text-green-400' : 
                        safetyScore.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {safetyScore.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            safetyScore.score >= 90 ? 'bg-green-500' :
                            safetyScore.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${safetyScore.score}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {safetyScore.score.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-2">{safetyScore.summary}</p>
                  </div>
                )}

                {/* Test Results */}
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.passed
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          {result.passed ? (
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {result.attack.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {result.passed ? 'Defended successfully' : 'Vulnerability detected'}
                            </p>
                          </div>
                        </div>
                        <button className="ml-2 text-gray-500 hover:text-gray-300">
                          {expandedResult === index ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {expandedResult === index && (
                        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">Attack Prompt:</p>
                            <p className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                              {result.attack.prompt}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">Model Response:</p>
                            <p className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                              {result.response || 'No response'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">Analysis:</p>
                            <p className="text-xs text-gray-300">
                              {result.analysis || 'Automated safety check performed'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedAttacks.size} attack{selectedAttacks.size !== 1 ? 's' : ''} selected
              {testResults.length > 0 && (
                <span className="ml-3">
                  • {testResults.filter(r => r.passed).length}/{testResults.length} passed
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={runTests}
                disabled={isRunning || selectedAttacks.size === 0 || !selectedEndpoint}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run {selectedAttacks.size} Test{selectedAttacks.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
