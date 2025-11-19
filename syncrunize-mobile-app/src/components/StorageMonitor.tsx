// components/StorageMonitor.tsx
// ✅ FIX: Monitor storage quota and auto-cleanup when needed
// Prevents QuotaExceededError and warns users about storage issues

import { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import { monitorAndCleanupStorage, getStorageWarningMessage } from '../utils/storageQuota';

export const StorageMonitor: React.FC = () => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log('[StorageMonitor] Checking storage quota on startup...');

        const { cleaned, itemsCleared, estimate } = await monitorAndCleanupStorage();

        if (cleaned) {
          console.log(`[StorageMonitor] Auto-cleaned ${itemsCleared} cache items due to high storage usage`);
          setWarningMessage(`Storage optimized: Cleared ${itemsCleared} old cache items`);
          setShowToast(true);
        } else {
          // Check if we should warn user
          const warning = getStorageWarningMessage(estimate);
          if (warning) {
            console.warn(`[StorageMonitor] ${warning}`);
            setWarningMessage(warning);
            setShowToast(true);
          }
        }
      } catch (error) {
        console.error('[StorageMonitor] Failed to check storage:', error);
      }
    };

    // Check on component mount (app startup)
    checkStorage();

    // Also check periodically every 30 minutes
    const intervalId = setInterval(checkStorage, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <IonToast
      isOpen={showToast}
      message={warningMessage || ''}
      duration={5000}
      position="top"
      color={warningMessage?.includes('optimized') ? 'success' : 'warning'}
      onDidDismiss={() => setShowToast(false)}
    />
  );
};
