import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuardModal from '@/components/AuthGuardModal';
import { useFocusEffect } from 'expo-router';

/**
 * Hook to enforce authentication requirement on a screen.
 * Returns the AuthGuardModal component and a function to check auth status.
 */
export function useRequireAuth() {
  const { hasProfile, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Use focus effect to check auth whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!loading && !hasProfile) {
        setShowModal(true);
      }
    }, [hasProfile, loading])
  );

  const AuthGuard = useCallback(() => (
    <AuthGuardModal 
      visible={showModal} 
      onClose={() => setShowModal(false)} 
    />
  ), [showModal]);

  return {
    isAuthorized: hasProfile,
    isLoading: loading,
    AuthGuard
  };
}
