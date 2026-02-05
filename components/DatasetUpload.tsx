// components/DatasetUpload.tsx
'use client'

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

interface DatasetItem {
  input: string | object;
  label?: string;
}

interface DatasetUploadProps {
  onDatasetLoaded: (dataset: DatasetItem[]) => void;
  onClose: () => void;
}

export default function DatasetUpload({ onDatasetLoaded, onClose }: DatasetUploadProps) {
  const [uploadedData, setUploadedData] = useState<DatasetItem[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'images' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle CSV upload
  const handleCSVUpload = (file: File) => {
    setIsProcessing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const dataset: DatasetItem[] = results.data.map((row: any, index: number) => {
            // Assume first column is input, second is optional label
            const keys = Object.keys(row);
            return {
              input: row[keys[0]] || '',
              label: row[keys[1]] || `row_${index + 1}`
            };
          });

          setUploadedData(dataset);
          setPreviewData(results.data.slice(0, 10)); // Show first 10 rows
          setFileType('csv');
          setIsProcessing(false);
        } catch (err) {
          setError('Failed to parse CSV file');
          setIsProcessing(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setIsProcessing(false);
      }
    });
  };

  // Handle JSON upload
  const handleJSONUpload = (file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        let dataset: DatasetItem[];
        if (Array.isArray(jsonData)) {
          dataset = jsonData.map((item, index) => ({
            input: typeof item === 'object' ? item : String(item),
            label: item.label || `item_${index + 1}`
          }));
        } else {
          // Single object
          dataset = [{
            input: jsonData,
            label: 'json_object'
          }];
        }

        setUploadedData(dataset);
        setPreviewData(dataset.slice(0, 10));
        setFileType('json');
        setIsProcessing(false);
      } catch (err) {
        setError('Invalid JSON format');
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read JSON file');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  // Handle multiple image uploads
  const handleImageUpload = (files: FileList) => {
    setIsProcessing(true);
    setError(null);

    const imagePromises = Array.from(files).map((file) => {
      return new Promise<DatasetItem>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            input: e.target?.result as string, // Base64
            label: file.name
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises)
      .then((dataset) => {
        setUploadedData(dataset);
        setPreviewData(dataset.slice(0, 10));
        setFileType('images');
        setIsProcessing(false);
      })
      .catch(() => {
        setError('Failed to process images');
        setIsProcessing(false);
      });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      handleCSVUpload(file);
    } else if (fileName.endsWith('.json')) {
      handleJSONUpload(file);
    } else if (file.type.startsWith('image/')) {
      handleImageUpload(files);
    } else {
      setError('Unsupported file type. Please upload CSV, JSON, or images.');
    }
  };

  // Confirm and load dataset
  const handleConfirm = () => {
    if (uploadedData.length === 0) {
      setError('No data to load');
      return;
    }
    onDatasetLoaded(uploadedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-4xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Upload Dataset</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Click to upload dataset
            </p>
            <p className="text-sm text-gray-400">
              Supports: CSV, JSON, or multiple images (PNG, JPG, WEBP)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".csv,.json,image/*"
              multiple
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <p className="text-sm text-indigo-400">Processing files...</p>
            </div>
          )}
        </div>

        {/* File Info */}
        {fileType && uploadedData.length > 0 && (
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {fileType === 'csv' && <FileText className="w-5 h-5 text-green-400" />}
              {fileType === 'json' && <FileText className="w-5 h-5 text-blue-400" />}
              {fileType === 'images' && <Image className="w-5 h-5 text-purple-400" />}
              <div>
                <p className="text-white font-medium">
                  {fileType.toUpperCase()} Dataset
                </p>
                <p className="text-xs text-gray-400">
                  {uploadedData.length} items loaded
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Preview ({previewData.length} of {uploadedData.length} items)
            </h4>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">
                        Input
                      </th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">
                        Label
                      </th>
                      <th className="px-4 py-2 text-left text-gray-400 font-medium">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {uploadedData.slice(0, 10).map((item, index) => {
                      const isImage = typeof item.input === 'string' && 
                        item.input.startsWith('data:image');
                      const isURL = typeof item.input === 'string' && 
                        item.input.startsWith('http');
                      
                      return (
                        <tr key={index} className="hover:bg-gray-800/30">
                          <td className="px-4 py-2 text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2">
                            {isImage ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={item.input as string} 
                                  alt="preview" 
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <span className="text-xs text-gray-400">
                                  Base64 Image
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs truncate block max-w-md">
                                {typeof item.input === 'string' 
                                  ? item.input 
                                  : JSON.stringify(item.input).substring(0, 100)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-xs">
                            {item.label || '-'}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              isImage 
                                ? 'bg-purple-500/20 text-purple-400' 
                                : isURL
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {isImage ? 'Image' : isURL ? 'URL' : 'Text'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploadedData.length === 0}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Load Dataset ({uploadedData.length} items)
          </button>
        </div>
      </div>
    </div>
  );
}
