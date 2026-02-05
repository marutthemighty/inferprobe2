// components/EndpointTemplateModal.tsx
'use client'

import React, { useState } from 'react';
import { X, Zap, DollarSign, Info, Key, ExternalLink } from 'lucide-react';
import { FREE_ENDPOINT_TEMPLATES, EndpointTemplate, templateToEndpoint } from '@/lib/endpointTemplates';

interface EndpointTemplateModalProps {
  onClose: () => void;
  onSelectTemplate: (endpoint: any) => void;
}

export default function EndpointTemplateModal({ onClose, onSelectTemplate }: EndpointTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EndpointTemplate | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [filterCost, setFilterCost] = useState<'all' | 'free' | 'low'>('all');
  const [filterType, setFilterType] = useState<'all' | 'llm' | 'vision' | 'embedding'>('all');

  const filteredTemplates = FREE_ENDPOINT_TEMPLATES.filter(t => {
    const costMatch = filterCost === 'all' || t.cost === filterCost;
    const typeMatch = filterType === 'all' || t.type === filterType;
    return costMatch && typeMatch;
  });

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate.apiKeyRequired && !apiKey) {
      alert('Please enter your API key');
      return;
    }

    const endpoint = templateToEndpoint(selectedTemplate, apiKey);
    onSelectTemplate(endpoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-5xl my-8">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Free & Low-Cost AI Models</h3>
              <p className="text-sm text-gray-400 mt-1">
                Choose from pre-configured endpoints - no GPT-4 required!
              </p>
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
            <div className="flex gap-2">
              <button
                onClick={() => setFilterCost('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterCost === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All Costs
              </button>
              <button
                onClick={() => setFilterCost('free')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterCost === 'free'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => setFilterCost('low')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterCost === 'low'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Low Cost
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType('llm')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'llm'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                LLM
              </button>
              <button
                onClick={() => setFilterType('vision')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'vision'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Vision
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
          {/* Left: Template List */}
          <div className="p-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-indigo-600/20 border-indigo-500'
                      : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{template.name}</p>
                        {template.cost === 'free' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{template.provider}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {template.type}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Template Details */}
          <div className="p-6">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {selectedTemplate.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      selectedTemplate.cost === 'free'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {selectedTemplate.cost === 'free' ? 'FREE' : 'LOW COST'}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {selectedTemplate.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-300">{selectedTemplate.description}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h5 className="text-sm font-medium text-white">Setup Instructions</h5>
                  </div>
                  <p className="text-xs text-gray-400 bg-gray-800/50 rounded p-3">
                    {selectedTemplate.setupInstructions}
                  </p>
                </div>

                {selectedTemplate.apiKeyRequired && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <Key className="w-4 h-4" />
                      API Key (Required)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your API key is stored locally and never shared
                    </p>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-300 mb-1">Quick Tip</p>
                      <p className="text-xs text-blue-200/80">
                        For fully local and private testing, try <strong>Ollama</strong> - no API key needed!
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUseTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Use This Endpoint
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a template to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
