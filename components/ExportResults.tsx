// components/ExportResults.tsx
'use client'

import React from 'react';
import { Download, FileText, FileJson, Table } from 'lucide-react';

interface ExportResultsProps {
  scanResults?: any;
  batchResults?: any;
  endpointName?: string;
}

export default function ExportResults({ scanResults, batchResults, endpointName }: ExportResultsProps) {
  
  // Export as JSON
  const exportAsJSON = () => {
    const data = batchResults || scanResults;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inferprobe-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const exportAsCSV = () => {
    let csvContent = '';
    
    if (batchResults) {
      // Batch results CSV
      csvContent = 'Label,Input,Variant Type,Anomaly Score,Explanation,Max Score,High Risk Count\n';
      
      batchResults.results.forEach((result: any) => {
        result.variants.forEach((variant: any, idx: number) => {
          const row = [
            result.label || '',
            typeof result.original_input === 'string' 
              ? result.original_input.replace(/"/g, '""').substring(0, 100)
              : JSON.stringify(result.original_input).substring(0, 100),
            variant.type,
            result.scores[idx].toFixed(4),
            result.explanations[idx].replace(/"/g, '""'),
            result.summary.max_anomaly_score.toFixed(4),
            result.summary.high_risk_count
          ].map(v => `"${v}"`).join(',');
          
          csvContent += row + '\n';
        });
      });
    } else if (scanResults) {
      // Single scan CSV
      csvContent = 'Variant Type,Anomaly Score,Explanation,Metadata\n';
      
      scanResults.variants.forEach((variant: any, idx: number) => {
        const row = [
          variant.type,
          scanResults.scores[idx].toFixed(4),
          scanResults.explanations[idx].replace(/"/g, '""'),
          JSON.stringify(variant.metadata || {})
        ].map(v => `"${v}"`).join(',');
        
        csvContent += row + '\n';
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inferprobe-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Markdown Report
  const exportAsMarkdown = () => {
    let markdown = `# InferProbe Scan Report\n\n`;
    markdown += `**Endpoint:** ${endpointName || 'N/A'}\n`;
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    
    if (batchResults) {
      markdown += `## Batch Scan Summary\n\n`;
      markdown += `- **Total Inputs:** ${batchResults.batch_summary.total_inputs}\n`;
      markdown += `- **Total Variants:** ${batchResults.batch_summary.total_variants}\n`;
      markdown += `- **Average Anomaly Score:** ${(batchResults.batch_summary.avg_anomaly_score * 100).toFixed(2)}%\n`;
      markdown += `- **High Risk Inputs:** ${batchResults.batch_summary.high_risk_inputs}\n`;
      markdown += `- **Processing Time:** ${batchResults.batch_summary.processing_time_ms}ms\n\n`;
      markdown += `---\n\n`;
      
      batchResults.results.forEach((result: any, idx: number) => {
        markdown += `## Result ${idx + 1}: ${result.label || 'Unlabeled'}\n\n`;
        markdown += `**Input:** ${typeof result.original_input === 'string' 
          ? result.original_input.substring(0, 200) 
          : JSON.stringify(result.original_input).substring(0, 200)}...\n\n`;
        
        markdown += `**Summary:**\n`;
        markdown += `- Max Anomaly Score: ${(result.summary.max_anomaly_score * 100).toFixed(2)}%\n`;
        markdown += `- Average Anomaly Score: ${(result.summary.avg_anomaly_score * 100).toFixed(2)}%\n`;
        markdown += `- High Risk Variants: ${result.summary.high_risk_count}\n\n`;
        
        markdown += `**Variants:**\n\n`;
        result.variants.forEach((variant: any, vIdx: number) => {
          markdown += `### ${variant.type}\n`;
          markdown += `- **Anomaly Score:** ${(result.scores[vIdx] * 100).toFixed(2)}%\n`;
          markdown += `- **Explanation:** ${result.explanations[vIdx]}\n\n`;
        });
        
        markdown += `---\n\n`;
      });
    } else if (scanResults) {
      markdown += `## Single Scan Results\n\n`;
      markdown += `**Offline Mode:** ${scanResults.offline ? 'Yes' : 'No'}\n\n`;
      
      scanResults.variants.forEach((variant: any, idx: number) => {
        markdown += `### ${variant.type}\n\n`;
        markdown += `- **Anomaly Score:** ${(scanResults.scores[idx] * 100).toFixed(2)}%\n`;
        markdown += `- **Explanation:** ${scanResults.explanations[idx]}\n`;
        
        if (variant.metadata) {
          markdown += `- **Metadata:** ${JSON.stringify(variant.metadata, null, 2)}\n`;
        }
        
        markdown += `\n---\n\n`;
      });
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inferprobe-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!scanResults && !batchResults) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={exportAsJSON}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      >
        <FileJson className="w-4 h-4" />
        Export JSON
      </button>
      
      <button
        onClick={exportAsCSV}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
      >
        <Table className="w-4 h-4" />
        Export CSV
      </button>
      
      <button
        onClick={exportAsMarkdown}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
      >
        <FileText className="w-4 h-4" />
        Export Report (MD)
      </button>
    </div>
  );
}
