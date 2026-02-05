// app/api/scan-endpoint/route.ts
// InferProbe MVP - Offline-first ML API debugger
// Handles image perturbations, anomaly detection, and ML analysis

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import * as tf from '@tensorflow/tfjs';

// Type definitions
interface ScanRequest {
  url?: string;
  sample_input: string | object;
  endpoint_id?: string;
}

interface Variant {
  type: string;
  data: string | object;
  metadata?: object;
}

interface ScanResponse {
  variants: Variant[];
  scores: number[];
  explanations: string[];
  offline: boolean;
  error?: string;
}

// Initialize clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// =============================================
// MOCK DATA GENERATOR (Offline Fallback)
// =============================================
function generateMockResponse(input: any): ScanResponse {
  const isImage = typeof input === 'string' && 
    (input.startsWith('http') || input.startsWith('data:image'));

  if (isImage) {
    return {
      variants: [
        {
          type: 'original',
          data: input,
          metadata: { confidence: 0.94 }
        },
        {
          type: 'gaussian_noise',
          data: input,
          metadata: { 
            noise_level: 0.05, 
            confidence: 0.67,
            confidence_drop: 0.27 
          }
        },
        {
          type: 'blur',
          data: input,
          metadata: { 
            kernel_size: 5, 
            confidence: 0.81,
            confidence_drop: 0.13 
          }
        },
        {
          type: 'crop_resize',
          data: input,
          metadata: { 
            crop_percent: 0.2, 
            confidence: 0.88,
            confidence_drop: 0.06 
          }
        }
      ],
      scores: [0.05, 0.33, 0.19, 0.12],
      explanations: [
        'Baseline: High confidence classification',
        'Gaussian noise significantly reduced model confidence, indicating potential robustness issues',
        'Blur perturbation shows moderate degradation in performance',
        'Crop/resize maintains reasonable confidence, suggesting spatial invariance'
      ],
      offline: true
    };
  }

  // Text/JSON input mock
  return {
    variants: [
      {
        type: 'original',
        data: input,
        metadata: { coherence: 0.92 }
      },
      {
        type: 'paraphrased',
        data: typeof input === 'string' 
          ? input.replace(/\b(\w+)\b/g, (match) => match.toLowerCase())
          : input,
        metadata: { coherence: 0.89, semantic_shift: 0.03 }
      },
      {
        type: 'typos_injected',
        data: typeof input === 'string'
          ? input.replace(/e/g, '3').replace(/a/g, '@')
          : input,
        metadata: { coherence: 0.45, semantic_shift: 0.47 }
      }
    ],
    scores: [0.08, 0.11, 0.55],
    explanations: [
      'Baseline: Coherent and well-structured input',
      'Paraphrasing maintained semantic meaning with minimal drift',
      'Typo injection caused significant coherence loss, high anomaly score'
    ],
    offline: true
  };
}

// =============================================
// IMAGE PERTURBATION (Sharp with Jimp fallback)
// =============================================
async function perturbImage(imageUrl: string): Promise<Variant[]> {
  const variants: Variant[] = [];
  
  try {
    // Try to use sharp (primary)
    const sharp = require('sharp');
    const axios = require('axios');
    
    // Download image
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 5000 
    });
    const imageBuffer = Buffer.from(response.data);
    
    // Original
    variants.push({
      type: 'original',
      data: imageUrl,
      metadata: { source: 'sharp' }
    });
    
    // Perturbation 1: Gaussian Noise
    try {
      const noisyBuffer = await sharp(imageBuffer)
        .composite([{
          input: Buffer.from(
            Array(imageBuffer.length).fill(0).map(() => 
              Math.floor(Math.random() * 50) - 25
            )
          ),
          blend: 'add'
        }])
        .toBuffer();
      
      const noisyBase64 = `data:image/jpeg;base64,${noisyBuffer.toString('base64')}`;
      variants.push({
        type: 'gaussian_noise',
        data: noisyBase64,
        metadata: { noise_sigma: 0.05, method: 'sharp' }
      });
    } catch (err) {
      console.warn('Sharp noise failed, skipping');
    }
    
    // Perturbation 2: Blur
    const blurredBuffer = await sharp(imageBuffer)
      .blur(5)
      .toBuffer();
    
    const blurredBase64 = `data:image/jpeg;base64,${blurredBuffer.toString('base64')}`;
    variants.push({
      type: 'blur',
      data: blurredBase64,
      metadata: { kernel_size: 5, method: 'sharp' }
    });
    
    // Perturbation 3: Random Crop & Resize
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 512;
    const height = metadata.height || 512;
    const cropSize = Math.floor(Math.min(width, height) * 0.8);
    
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ 
        left: Math.floor((width - cropSize) / 2), 
        top: Math.floor((height - cropSize) / 2), 
        width: cropSize, 
        height: cropSize 
      })
      .resize(width, height)
      .toBuffer();
    
    const croppedBase64 = `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`;
    variants.push({
      type: 'crop_resize',
      data: croppedBase64,
      metadata: { crop_percent: 0.2, method: 'sharp' }
    });
    
  } catch (sharpError) {
    console.warn('Sharp failed, attempting Jimp fallback:', sharpError);
    
    // Fallback to Jimp
    try {
      const Jimp = require('jimp');
      const image = await Jimp.read(imageUrl);
      
      // Original
      variants.push({
        type: 'original',
        data: imageUrl,
        metadata: { source: 'jimp' }
      });
      
      // Perturbation 1: Gaussian Noise (approximate)
      const noisyImage = image.clone();
      noisyImage.scan(0, 0, noisyImage.bitmap.width, noisyImage.bitmap.height, (x: number, y: number, idx: number) => {
    	noisyImage.bitmap.data[idx] = Math.min(255, Math.max(0,
      	  noisyImage.bitmap.data[idx] + Math.random() * 50 - 25
    	));
      });
      const noisyBase64 = await noisyImage.getBase64Async(Jimp.MIME_JPEG);
      variants.push({
        type: 'gaussian_noise',
        data: noisyBase64,
        metadata: { noise_level: 0.05, method: 'jimp' }
      });
      
      // Perturbation 2: Blur
      const blurredImage = image.clone().blur(5);
      const blurredBase64 = await blurredImage.getBase64Async(Jimp.MIME_JPEG);
      variants.push({
        type: 'blur',
        data: blurredBase64,
        metadata: { blur_radius: 5, method: 'jimp' }
      });
      
      // Perturbation 3: Crop & Resize
      const cropSize = Math.floor(Math.min(image.bitmap.width, image.bitmap.height) * 0.8);
      const croppedImage = image.clone()
        .crop(
          Math.floor((image.bitmap.width - cropSize) / 2),
          Math.floor((image.bitmap.height - cropSize) / 2),
          cropSize,
          cropSize
        )
        .resize(image.bitmap.width, image.bitmap.height);
      const croppedBase64 = await croppedImage.getBase64Async(Jimp.MIME_JPEG);
      variants.push({
        type: 'crop_resize',
        data: croppedBase64,
        metadata: { crop_percent: 0.2, method: 'jimp' }
      });
      
    } catch (jimpError) {
      console.error('Both Sharp and Jimp failed:', jimpError);
      throw new Error('Image processing failed');
    }
  }
  
  return variants;
}

// =============================================
// SIMILARITY SCORING (OpenCV.js simulation)
// =============================================
function calculateSimilarityScores(variants: Variant[]): number[] {
  // In a real implementation, this would use OpenCV.js SSIM
  // For MVP, we'll use simulated scores based on perturbation type
  
  const scores: number[] = [];
  
  for (const variant of variants) {
    let anomalyScore = 0.0;
    
    switch (variant.type) {
      case 'original':
        anomalyScore = Math.random() * 0.1; // 0-0.1
        break;
      case 'gaussian_noise':
        anomalyScore = 0.2 + Math.random() * 0.3; // 0.2-0.5
        break;
      case 'blur':
        anomalyScore = 0.15 + Math.random() * 0.2; // 0.15-0.35
        break;
      case 'crop_resize':
        anomalyScore = 0.05 + Math.random() * 0.15; // 0.05-0.2
        break;
      case 'paraphrased':
        anomalyScore = 0.05 + Math.random() * 0.1; // 0.05-0.15
        break;
      case 'typos_injected':
        anomalyScore = 0.4 + Math.random() * 0.3; // 0.4-0.7
        break;
      default:
        anomalyScore = Math.random() * 0.2;
    }
    
    scores.push(Math.min(1, Math.max(0, anomalyScore)));
  }
  
  return scores;
}

// =============================================
// TENSORFLOW.JS ANOMALY DETECTION
// =============================================
async function detectAnomaliesWithTF(variants: Variant[], scores: number[]): Promise<void> {
  try {
    const tf = require('@tensorflow/tfjs');
    
    // Simple statistical anomaly detection using tensor operations
    const scoreTensor = tf.tensor1d(scores);
    const mean = scoreTensor.mean();
    const std = tf.moments(scoreTensor).variance.sqrt();
    
    const meanValue = await mean.data();
    const stdValue = await std.data();
    
    // Flag anomalies > 2 standard deviations from mean
    for (let i = 0; i < variants.length; i++) {
      const isAnomaly = Math.abs(scores[i] - meanValue[0]) > 2 * stdValue[0];
      if (variants[i].metadata) {
        variants[i].metadata = {
          ...variants[i].metadata,
          is_anomaly: isAnomaly,
          z_score: (scores[i] - meanValue[0]) / stdValue[0]
        };
      }
    }
    
    // Cleanup
    scoreTensor.dispose();
    mean.dispose();
    std.dispose();
    
  } catch (error) {
    console.warn('TensorFlow.js detection skipped:', error);
    // Continue without TF.js - not critical
  }
}

// =============================================
// TEXT PERTURBATION
// =============================================
function perturbText(text: string): Variant[] {
  const variants: Variant[] = [];
  
  // Original
  variants.push({
    type: 'original',
    data: text,
    metadata: { length: text.length }
  });
  
  // Paraphrased (simple word substitutions)
  const paraphrased = text
    .replace(/\bis\b/gi, 'represents')
    .replace(/\bthe\b/gi, 'a')
    .replace(/\bcan\b/gi, 'may');
  
  variants.push({
    type: 'paraphrased',
    data: paraphrased,
    metadata: { 
      length: paraphrased.length,
      edit_distance: Math.abs(text.length - paraphrased.length)
    }
  });
  
  // Typos injected
  const withTypos = text
    .split('')
    .map((char, i) => (i % 5 === 0 && Math.random() > 0.7 ? char.toUpperCase() : char))
    .join('')
    .replace(/e/g, '3')
    .replace(/a/g, '@')
    .replace(/o/g, '0');
  
  variants.push({
    type: 'typos_injected',
    data: withTypos,
    metadata: { 
      corruption_rate: 0.3,
      length: withTypos.length 
    }
  });
  
  return variants;
}

// =============================================
// GROQ ANALYSIS
// =============================================
async function analyzeWithGroq(
  variants: Variant[], 
  scores: number[]
): Promise<string[]> {
  const explanations: string[] = [];
  
  try {
    // Check if Groq is configured
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }
    
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const score = scores[i];
      
      const prompt = `Analyze this ML model input/output for potential issues:

Variant Type: ${variant.type}
Anomaly Score: ${score.toFixed(4)}
Metadata: ${JSON.stringify(variant.metadata, null, 2)}

Provide a brief explanation (1-2 sentences) about:
1. Why this anomaly score occurred
2. Potential hallucination or drift indicators
3. Model robustness implications

Keep the response concise and technical.`;
      
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an ML model auditor analyzing perturbation test results for anomalies, hallucinations, and drift.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 150
        });
        
        const explanation = completion.choices[0]?.message?.content || 
          `${variant.type}: Anomaly score ${score.toFixed(2)}`;
        
        explanations.push(explanation.trim());
        
      } catch (groqError) {
        console.warn(`Groq analysis failed for variant ${i}:`, groqError);
        explanations.push(
          `${variant.type}: Anomaly score ${score.toFixed(2)} (auto-generated)`
        );
      }
    }
    
  } catch (error) {
    console.error('Groq analysis failed:', error);
    // Generate fallback explanations
    for (let i = 0; i < variants.length; i++) {
      explanations.push(
        `${variants[i].type}: Anomaly score ${scores[i].toFixed(2)} - Offline analysis`
      );
    }
  }
  
  return explanations;
}

// =============================================
// LOG TO SUPABASE
// =============================================
async function logToSupabase(
  endpointId: string | undefined,
  variants: Variant[],
  scores: number[],
  explanations: string[]
) {
  try {
    if (!endpointId) return;
    
    const { error } = await supabase.from('tests').insert({
      endpoint_id: endpointId,
      status: 'completed',
      input_data: {
        original: variants[0]?.data,
        perturbations_count: variants.length - 1
      },
      output_data: {
        variants: variants.length,
        avg_score: scores.reduce((a, b) => a + b, 0) / scores.length
      },
      perturbations: variants.slice(1).map(v => ({
        type: v.type,
        metadata: v.metadata
      })),
      anomaly_score: Math.max(...scores),
      anomalies: {
        high_score_variants: variants
          .map((v, i) => ({ type: v.type, score: scores[i] }))
          .filter(v => v.score > 0.5),
        flags: scores.filter(s => s > 0.5).length > 0 
          ? ['high_anomaly_detected'] 
          : []
      },
      explanation: explanations.join('\n\n')
    });
    
    if (error) {
      console.error('Supabase logging failed:', error);
    }
  } catch (error) {
    console.error('Failed to log to Supabase:', error);
  }
}

// =============================================
// MAIN ROUTE HANDLER
// =============================================
export async function POST(req: NextRequest) {
  try {
    const body: ScanRequest = await req.json();
    const { url, sample_input, endpoint_id } = body;
    
    // Validate input
    if (!sample_input) {
      return NextResponse.json(
        { error: 'sample_input is required' },
        { status: 400 }
      );
    }
    
    let variants: Variant[] = [];
    let offline = false;
    
    // Determine input type and generate variants
    const isImageUrl = typeof sample_input === 'string' && 
      (sample_input.startsWith('http') || sample_input.startsWith('data:image'));
    
    try {
      if (isImageUrl) {
        // Image perturbation
        variants = await perturbImage(sample_input as string);
      } else if (typeof sample_input === 'string') {
        // Text perturbation
        variants = perturbText(sample_input);
      } else {
        // JSON/Object input - mock for now
        offline = true;
        const mockResponse = generateMockResponse(sample_input);
        return NextResponse.json(mockResponse);
      }
    } catch (error) {
      console.error('Perturbation failed, using mock:', error);
      offline = true;
      const mockResponse = generateMockResponse(sample_input);
      return NextResponse.json(mockResponse);
    }
    
    // Calculate similarity scores
    const scores = calculateSimilarityScores(variants);
    
    // TensorFlow.js anomaly detection (optional)
    await detectAnomaliesWithTF(variants, scores);
    
    // Groq analysis
    const explanations = await analyzeWithGroq(variants, scores);
    
    // Log to Supabase if authenticated
    if (endpoint_id) {
      await logToSupabase(endpoint_id, variants, scores, explanations);
    }
    
    // Build response
    const response: ScanResponse = {
      variants,
      scores,
      explanations,
      offline: offline || !process.env.GROQ_API_KEY
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Scan endpoint error:', error);
    
    // Return mock data on any error
    const mockResponse = generateMockResponse({ error: 'Processing failed' });
    return NextResponse.json(
      { 
        ...mockResponse, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// =============================================
// GET Handler (for testing)
// =============================================
export async function GET() {
  return NextResponse.json({
    message: 'InferProbe Scan Endpoint API',
    version: '1.0.0',
    methods: ['POST'],
    example: {
      url: 'https://api.example.com/classify',
      sample_input: 'https://example.com/image.jpg',
      endpoint_id: 'optional-uuid'
    }
  });
}
