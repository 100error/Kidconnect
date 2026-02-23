import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OfflineGuardProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export default function OfflineGuard({ children, onRetry }: OfflineGuardProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const checkConnection = async () => {
    setChecking(true);
    setIsConnected(null);
    try {
      const state = await Network.getNetworkStateAsync();
      // On some simulators, isInternetReachable might be null, so fallback to isConnected
      const online = state.isConnected ?? false;
      setIsConnected(online);
    } catch (e) {
      console.log("Network check failed", e);
      setIsConnected(false); // Assume offline on error
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Subscribe to network state updates
    // Note: addNetworkStateListener returns a promise in newer SDKs?
    // Let's handle it safely
    let subscription: { remove: () => void } | null = null;
    
    // Try to subscribe
    // Some versions might be synchronous, some async. 
    // We'll wrap in async function
    const subscribe = async () => {
        try {
            // @ts-ignore - type definition might vary
            subscription = await Network.addNetworkStateListener((state) => {
                setIsConnected(state.isConnected ?? false);
            });
        } catch (e) {
            console.log("Listener error", e);
        }
    };
    
    subscribe();

    return () => {
      // @ts-ignore
      if (subscription && subscription.remove) {
          subscription.remove();
      }
    };
  }, []);

  const handleRetry = () => {
    checkConnection();
    if (onRetry) onRetry();
  };

  if (checking && isConnected === null) {
    // Initial load, show spinner or nothing? 
    // Let's show nothing or a spinner to avoid flash if it's fast.
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="cloud-offline" size={80} color="#B0BEC5" />
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          Games require an internet connection.{'\n'}Please connect to the internet to continue.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#455A64',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF6F00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#78909C',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
