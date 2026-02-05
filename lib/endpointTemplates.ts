// lib/endpointTemplates.ts
// Pre-configured free and low-cost AI model endpoints

export interface EndpointTemplate {
  id: string;
  name: string;
  provider: string;
  url: string;
  type: 'llm' | 'vision' | 'embedding' | 'custom';
  cost: 'free' | 'low' | 'medium';
  description: string;
  apiKeyRequired: boolean;
  setupInstructions: string;
  headers?: Record<string, string>;
  exampleRequest?: any;
}

export const FREE_ENDPOINT_TEMPLATES: EndpointTemplate[] = [
  // Groq (Fast & Free)
  {
    id: 'groq-llama-3.3-70b',
    name: 'Groq - Llama 3.3 70B',
    provider: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    type: 'llm',
    cost: 'free',
    description: 'Ultra-fast inference with Llama 3.3 70B. Free tier: 14,400 requests/day',
    apiKeyRequired: true,
    setupInstructions: 'Get free API key from https://console.groq.com/keys',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Your prompt here' }],
      temperature: 0.7
    }
  },
  
  {
    id: 'groq-llama-3.1-8b',
    name: 'Groq - Llama 3.1 8B',
    provider: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    type: 'llm',
    cost: 'free',
    description: 'Smaller, faster model. Free tier: 30 requests/minute',
    apiKeyRequired: true,
    setupInstructions: 'Get free API key from https://console.groq.com/keys',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: 'Your prompt here' }],
      temperature: 0.7
    }
  },

  // Hugging Face Inference API (Free)
  {
    id: 'hf-mistral-7b',
    name: 'Hugging Face - Mistral 7B',
    provider: 'Hugging Face',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    type: 'llm',
    cost: 'free',
    description: 'Free Mistral 7B via Hugging Face. Rate limits apply',
    apiKeyRequired: true,
    setupInstructions: 'Get free token from https://huggingface.co/settings/tokens',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      inputs: 'Your prompt here',
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7
      }
    }
  },

  {
    id: 'hf-blip-image',
    name: 'Hugging Face - BLIP Image Captioning',
    provider: 'Hugging Face',
    url: 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
    type: 'vision',
    cost: 'free',
    description: 'Free image captioning model',
    apiKeyRequired: true,
    setupInstructions: 'Get free token from https://huggingface.co/settings/tokens',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      inputs: 'https://example.com/image.jpg'
    }
  },

  // Together AI (Free Trial)
  {
    id: 'together-llama-3.1-8b',
    name: 'Together AI - Llama 3.1 8B',
    provider: 'Together AI',
    url: 'https://api.together.xyz/v1/chat/completions',
    type: 'llm',
    cost: 'low',
    description: '$25 free credit. Then $0.20 per 1M tokens',
    apiKeyRequired: true,
    setupInstructions: 'Sign up at https://api.together.xyz/ for free credits',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      messages: [{ role: 'user', content: 'Your prompt here' }],
      temperature: 0.7
    }
  },

  // Ollama (Fully Local - FREE)
  {
    id: 'ollama-llama3.1',
    name: 'Ollama - Llama 3.1 (Local)',
    provider: 'Ollama',
    url: 'http://localhost:11434/api/generate',
    type: 'llm',
    cost: 'free',
    description: 'Run AI models locally. 100% free, fully private',
    apiKeyRequired: false,
    setupInstructions: 'Install Ollama from https://ollama.com, then run: ollama pull llama3.1',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'llama3.1',
      prompt: 'Your prompt here',
      stream: false
    }
  },

  {
    id: 'ollama-llama3.2-vision',
    name: 'Ollama - Llama 3.2 Vision (Local)',
    provider: 'Ollama',
    url: 'http://localhost:11434/api/generate',
    type: 'vision',
    cost: 'free',
    description: 'Local vision model. Fully private',
    apiKeyRequired: false,
    setupInstructions: 'Install Ollama, then run: ollama pull llama3.2-vision',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'llama3.2-vision',
      prompt: 'Describe this image',
      images: ['base64_image_data'],
      stream: false
    }
  },

  // OpenRouter (Access Multiple Models)
  {
    id: 'openrouter-llama-3.1-8b',
    name: 'OpenRouter - Llama 3.1 8B (Free)',
    provider: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    type: 'llm',
    cost: 'free',
    description: 'Free tier available. Access to 100+ models',
    apiKeyRequired: true,
    setupInstructions: 'Get API key from https://openrouter.ai/keys',
    headers: {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://inferprobe.app',
      'X-Title': 'InferProbe'
    },
    exampleRequest: {
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'user', content: 'Your prompt here' }]
    }
  },

  // Cerebras (Fast & Free)
  {
    id: 'cerebras-llama-3.1-8b',
    name: 'Cerebras - Llama 3.1 8B',
    provider: 'Cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    type: 'llm',
    cost: 'free',
    description: 'World\'s fastest AI inference. Free tier available',
    apiKeyRequired: true,
    setupInstructions: 'Get free API key from https://cloud.cerebras.ai/',
    headers: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      model: 'llama3.1-8b',
      messages: [{ role: 'user', content: 'Your prompt here' }],
      stream: false
    }
  }
];

// Helper function to get templates by cost
export function getTemplatesByCost(cost: 'free' | 'low' | 'medium'): EndpointTemplate[] {
  return FREE_ENDPOINT_TEMPLATES.filter(t => t.cost === cost);
}

// Helper function to get templates by type
export function getTemplatesByType(type: 'llm' | 'vision' | 'embedding' | 'custom'): EndpointTemplate[] {
  return FREE_ENDPOINT_TEMPLATES.filter(t => t.type === type);
}

// Helper function to convert template to endpoint
export function templateToEndpoint(template: EndpointTemplate, apiKey?: string) {
  return {
    id: `ep_${Date.now()}`,
    name: template.name,
    url: template.url,
    type: template.type,
    headers: {
      ...template.headers,
      ...(apiKey && template.apiKeyRequired ? { 'Authorization': `Bearer ${apiKey}` } : {})
    }
  };
}
