// components/OfflineBanner.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle, X, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  onDismiss?: () => void;
}

export default function OfflineBanner({ isOffline, onDismiss }: OfflineBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Reset dismissed state when coming back online
    if (!isOffline) {
      setIsDismissed(false);
      setLastSyncTime(new Date());
    }
  }, [isOffline]);

  useEffect(() => {
    // Check for pending sync data
    const checkPendingSync = () => {
      const pendingTests = localStorage.getItem('inferprobe_pending_sync');
      setShowRetry(!!pendingTests && !isOffline);
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 5000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetrySync = async () => {
    const pendingTests = localStorage.getItem('inferprobe_pending_sync');
    if (!pendingTests) return;

    try {
      const tests = JSON.parse(pendingTests);
      // Attempt to sync pending tests
      // This would call your Supabase sync function
      console.log('Syncing pending tests:', tests);
      
      // Clear pending sync on success
      localStorage.removeItem('inferprobe_pending_sync');
      setShowRetry(false);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (isDismissed || (!isOffline && !showRetry)) {
    return null;
  }

  return (
    <>
      {/* Offline Warning Banner */}
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-40 animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <WifiOff className="w-5 h-5 text-orange-400 mt-0.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-orange-300 mb-1">
                        Offline Mode Active
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs text-orange-200/80">
                          InferProbe is running in offline mode. All features are available with limitations:
                        </p>
                        <ul className="text-xs text-orange-200/70 space-y-0.5 ml-4 list-disc">
                          <li>Using mock perturbation data and simulated scores</li>
                          <li>AI explanations generated locally (not from Groq)</li>
                          <li>Data stored in browser only (not synced to cloud)</li>
                          <li>Image processing may use simplified algorithms</li>
                        </ul>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-300 font-medium">
                          Results are for testing purposes only
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDismiss}
                      className="flex-shrink-0 p-1 text-orange-400 hover:text-orange-300 transition-colors"
                      aria-label="Dismiss offline banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Pending Banner */}
      {!isOffline && showRetry && (
        <div className="fixed top-16 left-0 right-0 z-40 animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Pending data sync available
                    </p>
                    <p className="text-xs text-blue-200/70 mt-0.5">
                      You have offline test results that can be synced to the cloud
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetrySync}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    Sync Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Sync Indicator (Bottom Toast) */}
      {lastSyncTime && !isOffline && (
        <div className="fixed bottom-4 right-4 z-30 animate-fadeIn">
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-green-300">
                Synced {lastSyncTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
