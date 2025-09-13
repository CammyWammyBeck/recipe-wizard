import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
      setIsLoading(false);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isLoading,
    isOnline: isConnected === true,
    isOffline: isConnected === false,
  };
}