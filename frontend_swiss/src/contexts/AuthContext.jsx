import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser as apiGetCurrentUser, logout as apiLogout } from '@/services/auth.service.js';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    console.log('[AuthContext] Refreshing user...');
    const data = await apiGetCurrentUser();
    console.log('[AuthContext] getCurrentUser response:', data);
    if (data && data.result_code === 0 && data.user) {
      console.log('[AuthContext] User authenticated:', data.user);
      setUser(data.user);
    } else {
      console.log('[AuthContext] User not authenticated');
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Fetch current user on mount
    console.log('[AuthContext] Component mounted, fetching user...');
    (async () => {
      try {
        await refreshUser();
      } finally {
        console.log('[AuthContext] Auth ready');
        setIsAuthReady(true);
      }
    })();
  }, [refreshUser]);

  const value = {
    user,
    isLoggedIn: !!user,
    isAuthReady,
    isAdmin: !!user && user.role_id === 3,
    isSeller: !!user && user.role_id === 2,
    refreshUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
