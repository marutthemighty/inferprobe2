// lib/costTracking.ts
// Comprehensive cost tracking and optimization for AI API usage

export interface ModelPricing {
  provider: string;
  model: string;
  inputCostPer1M: number;  // Cost per 1M input tokens
  outputCostPer1M: number; // Cost per 1M output tokens
  currency: string;
  freeTier?: {
    requestsPerDay?: number;
    requestsPerMonth?: number;
    tokensPerMonth?: number;
  };
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  model: string;
}

export interface CostComparison {
  currentModel: CostEstimate;
  alternatives: Array<{
    model: string;
    provider: string;
    estimate: CostEstimate;
    savings: number;
    savingsPercent: number;
  }>;
  recommendation: string;
}

// Comprehensive pricing database
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4-turbo': {
    provider: 'OpenAI',
    model: 'GPT-4 Turbo',
    inputCostPer1M: 10.00,
    outputCostPer1M: 30.00,
    currency: 'USD'
  },
  'gpt-4': {
    provider: 'OpenAI',
    model: 'GPT-4',
    inputCostPer1M: 30.00,
    outputCostPer1M: 60.00,
    currency: 'USD'
  },
  'gpt-3.5-turbo': {
    provider: 'OpenAI',
    model: 'GPT-3.5 Turbo',
    inputCostPer1M: 0.50,
    outputCostPer1M: 1.50,
    currency: 'USD'
  },

  // Anthropic
  'claude-3-opus': {
    provider: 'Anthropic',
    model: 'Claude 3 Opus',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    currency: 'USD'
  },
  'claude-3-sonnet': {
    provider: 'Anthropic',
    model: 'Claude 3 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    currency: 'USD'
  },
  'claude-3-haiku': {
    provider: 'Anthropic',
    model: 'Claude 3 Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    currency: 'USD'
  },

  // Groq (FREE!)
  'groq-llama-3.3-70b': {
    provider: 'Groq',
    model: 'Llama 3.3 70B',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    currency: 'USD',
    freeTier: {
      requestsPerDay: 14400,
      requestsPerMonth: 432000
    }
  },
  'groq-llama-3.1-8b': {
    provider: 'Groq',
    model: 'Llama 3.1 8B',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    currency: 'USD',
    freeTier: {
      requestsPerDay: 30000
    }
  },

  // Together AI
  'together-llama-3.1-8b': {
    provider: 'Together AI',
    model: 'Llama 3.1 8B',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.20,
    currency: 'USD'
  },
  'together-llama-3.1-70b': {
    provider: 'Together AI',
    model: 'Llama 3.1 70B',
    inputCostPer1M: 0.88,
    outputCostPer1M: 0.88,
    currency: 'USD'
  },

  // Mistral AI
  'mistral-large': {
    provider: 'Mistral AI',
    model: 'Mistral Large',
    inputCostPer1M: 4.00,
    outputCostPer1M: 12.00,
    currency: 'USD'
  },
  'mistral-medium': {
    provider: 'Mistral AI',
    model: 'Mistral Medium',
    inputCostPer1M: 2.70,
    outputCostPer1M: 8.10,
    currency: 'USD'
  },
  'mistral-small': {
    provider: 'Mistral AI',
    model: 'Mistral Small',
    inputCostPer1M: 1.00,
    outputCostPer1M: 3.00,
    currency: 'USD'
  },

  // Hugging Face (FREE with rate limits)
  'hf-mistral-7b': {
    provider: 'Hugging Face',
    model: 'Mistral 7B',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    currency: 'USD',
    freeTier: {
      requestsPerDay: 1000
    }
  },

  // Ollama (100% FREE - Local)
  'ollama-llama3.1': {
    provider: 'Ollama',
    model: 'Llama 3.1 (Local)',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    currency: 'USD',
    freeTier: {
      requestsPerDay: Infinity
    }
  },

  // Cerebras (FREE tier)
  'cerebras-llama-3.1-8b': {
    provider: 'Cerebras',
    model: 'Llama 3.1 8B',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    currency: 'USD',
    freeTier: {
      requestsPerDay: 10000
    }
  }
};

// Calculate cost for a single request
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const pricing = MODEL_PRICING[modelId];
  
  if (!pricing) {
    // Default fallback pricing
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
      model: 'Unknown Model'
    };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: pricing.currency,
    model: pricing.model
  };
}

// Estimate token count (rough approximation)
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English
  // More accurate would use tiktoken, but this works for estimates
  return Math.ceil(text.length / 4);
}

// Compare costs across different models
export function compareCosts(
  currentModelId: string,
  inputTokens: number,
  outputTokens: number
): CostComparison {
  const currentCost = calculateCost(currentModelId, inputTokens, outputTokens);
  
  // Get alternative models (all models except current)
  const alternatives = Object.keys(MODEL_PRICING)
    .filter(id => id !== currentModelId)
    .map(modelId => {
      const estimate = calculateCost(modelId, inputTokens, outputTokens);
      const savings = currentCost.totalCost - estimate.totalCost;
      const savingsPercent = currentCost.totalCost > 0 
        ? (savings / currentCost.totalCost) * 100 
        : 0;

      return {
        model: MODEL_PRICING[modelId].model,
        provider: MODEL_PRICING[modelId].provider,
        estimate,
        savings,
        savingsPercent
      };
    })
    .sort((a, b) => b.savings - a.savings) // Sort by highest savings first
    .slice(0, 5); // Top 5 alternatives

  // Generate recommendation
  let recommendation = 'Current model is cost-effective.';
  
  const topAlternative = alternatives[0];
  if (topAlternative && topAlternative.savings > 0.01) {
    const savingsPerMonth = topAlternative.savings * 30; // Rough monthly estimate
    recommendation = `Switch to ${topAlternative.model} to save $${topAlternative.savings.toFixed(4)} per request (${topAlternative.savingsPercent.toFixed(1)}% reduction). Potential monthly savings: $${savingsPerMonth.toFixed(2)}`;
  } else if (alternatives.some(a => a.estimate.totalCost === 0)) {
    const freeModel = alternatives.find(a => a.estimate.totalCost === 0);
    recommendation = `Consider ${freeModel?.model} for 100% cost savings (FREE tier available).`;
  }

  return {
    currentModel: currentCost,
    alternatives,
    recommendation
  };
}

// Track cumulative costs
export class CostTracker {
  private usage: Array<{
    timestamp: Date;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }> = [];

  addUsage(modelId: string, inputTokens: number, outputTokens: number) {
    const estimate = calculateCost(modelId, inputTokens, outputTokens);
    
    this.usage.push({
      timestamp: new Date(),
      modelId,
      inputTokens,
      outputTokens,
      cost: estimate.totalCost
    });

    // Store in localStorage
    this.save();
  }

  getTotalCost(timeframe: 'day' | 'week' | 'month' | 'all' = 'all'): number {
    const filtered = this.getUsageByTimeframe(timeframe);
    return filtered.reduce((sum, u) => sum + u.cost, 0);
  }

  getTotalTokens(timeframe: 'day' | 'week' | 'month' | 'all' = 'all'): number {
    const filtered = this.getUsageByTimeframe(timeframe);
    return filtered.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
  }

  getUsageByModel(modelId: string) {
    return this.usage.filter(u => u.modelId === modelId);
  }

  private getUsageByTimeframe(timeframe: 'day' | 'week' | 'month' | 'all') {
    if (timeframe === 'all') return this.usage;

    const now = new Date();
    const cutoff = new Date();

    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }

    return this.usage.filter(u => u.timestamp >= cutoff);
  }

  getSavingsOpportunities(): Array<{
    fromModel: string;
    toModel: string;
    potentialSavings: number;
    requestCount: number;
  }> {
    const opportunities: any[] = [];

    // Group usage by model
    const modelUsage = new Map<string, number>();
    this.usage.forEach(u => {
      modelUsage.set(u.modelId, (modelUsage.get(u.modelId) || 0) + 1);
    });

    // Find cheaper alternatives for each model used
    modelUsage.forEach((count, modelId) => {
      const avgInput = this.getUsageByModel(modelId)
        .reduce((sum, u) => sum + u.inputTokens, 0) / count;
      const avgOutput = this.getUsageByModel(modelId)
        .reduce((sum, u) => sum + u.outputTokens, 0) / count;

      const comparison = compareCosts(modelId, avgInput, avgOutput);
      const topAlternative = comparison.alternatives[0];

      if (topAlternative && topAlternative.savings > 0) {
        opportunities.push({
          fromModel: MODEL_PRICING[modelId]?.model || modelId,
          toModel: topAlternative.model,
          potentialSavings: topAlternative.savings * count,
          requestCount: count
        });
      }
    });

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  save() {
    try {
      localStorage.setItem('inferprobe_cost_tracking', JSON.stringify(this.usage));
    } catch (error) {
      console.error('Failed to save cost tracking:', error);
    }
  }

  load() {
    try {
      const data = localStorage.getItem('inferprobe_cost_tracking');
      if (data) {
        this.usage = JSON.parse(data).map((u: any) => ({
          ...u,
          timestamp: new Date(u.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load cost tracking:', error);
    }
  }

  clear() {
    this.usage = [];
    localStorage.removeItem('inferprobe_cost_tracking');
  }
}

// Singleton instance
export const costTracker = new CostTracker();

// Initialize on load
if (typeof window !== 'undefined') {
  costTracker.load();
}

export default costTracker;
