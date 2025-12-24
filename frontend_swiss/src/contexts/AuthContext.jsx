import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser as apiGetCurrentUser, logout as apiLogout } from '@/services/auth.service.js';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const data = await apiGetCurrentUser();
    if (data && data.result_code === 0 && data.user) {
      setUser(data.user);
    } else {
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
    (async () => {
      try {
        await refreshUser();
      } finally {
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
