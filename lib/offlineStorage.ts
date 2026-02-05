// lib/offlineStorage.ts
// Offline-first storage manager for InferProbe
// Handles localStorage caching and sync with Supabase

interface CachedTest {
  id: string;
  endpoint_id: string;
  input_data: any;
  output_data: any;
  anomaly_score: number;
  timestamp: number;
  synced: boolean;
}

interface CachedEndpoint {
  id: string;
  name: string;
  url: string;
  type: string;
  timestamp: number;
}

export class OfflineStorageManager {
  private static KEYS = {
    ENDPOINTS: 'inferprobe_endpoints',
    TESTS: 'inferprobe_tests',
    PENDING_SYNC: 'inferprobe_pending_sync',
    LAST_SYNC: 'inferprobe_last_sync',
    OFFLINE_MODE: 'inferprobe_offline_mode'
  };

  // =====================================
  // ENDPOINT MANAGEMENT
  // =====================================

  static saveEndpoint(endpoint: CachedEndpoint): void {
    try {
      const endpoints = this.getEndpoints();
      const existingIndex = endpoints.findIndex(e => e.id === endpoint.id);
      
      if (existingIndex >= 0) {
        endpoints[existingIndex] = endpoint;
      } else {
        endpoints.push(endpoint);
      }
      
      localStorage.setItem(this.KEYS.ENDPOINTS, JSON.stringify(endpoints));
    } catch (error) {
      console.error('Failed to save endpoint:', error);
    }
  }

  static getEndpoints(): CachedEndpoint[] {
    try {
      const data = localStorage.getItem(this.KEYS.ENDPOINTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get endpoints:', error);
      return [];
    }
  }

  static deleteEndpoint(id: string): void {
    try {
      const endpoints = this.getEndpoints().filter(e => e.id !== id);
      localStorage.setItem(this.KEYS.ENDPOINTS, JSON.stringify(endpoints));
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
    }
  }

  // =====================================
  // TEST MANAGEMENT
  // =====================================

  static saveTest(test: CachedTest): void {
    try {
      const tests = this.getTests();
      tests.push(test);
      
      // Keep only last 100 tests to prevent localStorage overflow
      const trimmed = tests.slice(-100);
      localStorage.setItem(this.KEYS.TESTS, JSON.stringify(trimmed));
      
      // Add to pending sync if not synced
      if (!test.synced) {
        this.addToPendingSync(test);
      }
    } catch (error) {
      console.error('Failed to save test:', error);
    }
  }

  static getTests(endpointId?: string): CachedTest[] {
    try {
      const data = localStorage.getItem(this.KEYS.TESTS);
      const tests = data ? JSON.parse(data) : [];
      
      if (endpointId) {
        return tests.filter((t: CachedTest) => t.endpoint_id === endpointId);
      }
      
      return tests;
    } catch (error) {
      console.error('Failed to get tests:', error);
      return [];
    }
  }

  static deleteTest(id: string): void {
    try {
      const tests = this.getTests().filter(t => t.id !== id);
      localStorage.setItem(this.KEYS.TESTS, JSON.stringify(tests));
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  }

  // =====================================
  // SYNC MANAGEMENT
  // =====================================

  static addToPendingSync(test: CachedTest): void {
    try {
      const pending = this.getPendingSync();
      pending.push(test);
      localStorage.setItem(this.KEYS.PENDING_SYNC, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to add to pending sync:', error);
    }
  }

  static getPendingSync(): CachedTest[] {
    try {
      const data = localStorage.getItem(this.KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get pending sync:', error);
      return [];
    }
  }

  static clearPendingSync(): void {
    try {
      localStorage.removeItem(this.KEYS.PENDING_SYNC);
    } catch (error) {
      console.error('Failed to clear pending sync:', error);
    }
  }

  static async syncToSupabase(supabaseClient: any): Promise<boolean> {
    try {
      const pending = this.getPendingSync();
      
      if (pending.length === 0) {
        return true;
      }

      // Prepare data for Supabase
      const testsToSync = pending.map(test => ({
        endpoint_id: test.endpoint_id,
        status: 'completed',
        input_data: test.input_data,
        output_data: test.output_data,
        anomaly_score: test.anomaly_score,
        executed_at: new Date(test.timestamp).toISOString()
      }));

      // Insert to Supabase
      const { error } = await supabaseClient
        .from('tests')
        .insert(testsToSync);

      if (error) {
        console.error('Supabase sync failed:', error);
        return false;
      }

      // Mark tests as synced
      const tests = this.getTests();
      const syncedIds = new Set(pending.map(t => t.id));
      const updated = tests.map(test => 
        syncedIds.has(test.id) ? { ...test, synced: true } : test
      );
      
      localStorage.setItem(this.KEYS.TESTS, JSON.stringify(updated));
      this.clearPendingSync();
      this.setLastSyncTime();
      
      return true;
    } catch (error) {
      console.error('Sync to Supabase failed:', error);
      return false;
    }
  }

  static setLastSyncTime(): void {
    try {
      localStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  static getLastSyncTime(): Date | null {
    try {
      const data = localStorage.getItem(this.KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // =====================================
  // OFFLINE MODE
  // =====================================

  static isOfflineMode(): boolean {
    try {
      const data = localStorage.getItem(this.KEYS.OFFLINE_MODE);
      return data === 'true';
    } catch (error) {
      return false;
    }
  }

  static setOfflineMode(offline: boolean): void {
    try {
      localStorage.setItem(this.KEYS.OFFLINE_MODE, String(offline));
    } catch (error) {
      console.error('Failed to set offline mode:', error);
    }
  }

  // =====================================
  // STORAGE STATS
  // =====================================

  static getStorageStats(): {
    endpoints: number;
    tests: number;
    pendingSync: number;
    lastSync: Date | null;
    storageUsed: string;
  } {
    const endpoints = this.getEndpoints();
    const tests = this.getTests();
    const pending = this.getPendingSync();
    const lastSync = this.getLastSyncTime();

    // Estimate storage usage
    let storageUsed = 0;
    for (const key in localStorage) {
      if (key.startsWith('inferprobe_')) {
        storageUsed += localStorage[key].length + key.length;
      }
    }

    return {
      endpoints: endpoints.length,
      tests: tests.length,
      pendingSync: pending.length,
      lastSync,
      storageUsed: `${(storageUsed / 1024).toFixed(2)} KB`
    };
  }

  // =====================================
  // CACHE MANAGEMENT
  // =====================================

  static clearCache(): void {
    try {
      const keysToKeep = [this.KEYS.ENDPOINTS, this.KEYS.OFFLINE_MODE];
      
      for (const key in this.KEYS) {
        const storageKey = this.KEYS[key as keyof typeof this.KEYS];
        if (!keysToKeep.includes(storageKey)) {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  static exportData(): string {
    try {
      const data = {
        endpoints: this.getEndpoints(),
        tests: this.getTests(),
        pending: this.getPendingSync(),
        lastSync: this.getLastSyncTime(),
        exportedAt: new Date().toISOString()
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '{}';
    }
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.endpoints) {
        localStorage.setItem(this.KEYS.ENDPOINTS, JSON.stringify(data.endpoints));
      }
      
      if (data.tests) {
        localStorage.setItem(this.KEYS.TESTS, JSON.stringify(data.tests));
      }
      
      if (data.pending) {
        localStorage.setItem(this.KEYS.PENDING_SYNC, JSON.stringify(data.pending));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Auto-sync utility
export class AutoSync {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  static start(supabaseClient: any): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(async () => {
      if (!OfflineStorageManager.isOfflineMode() && navigator.onLine) {
        const pending = OfflineStorageManager.getPendingSync();
        
        if (pending.length > 0) {
          console.log(`Auto-syncing ${pending.length} pending tests...`);
          const success = await OfflineStorageManager.syncToSupabase(supabaseClient);
          
          if (success) {
            console.log('Auto-sync completed successfully');
          } else {
            console.warn('Auto-sync failed, will retry later');
          }
        }
      }
    }, this.SYNC_INTERVAL_MS);
  }

  static stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default OfflineStorageManager;
