import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('expense_tracker_token');
      const savedUser = localStorage.getItem('expense_tracker_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with backend
        api.auth.getMe()
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('expense_tracker_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // Token likely expired
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.auth.login({ identifier, password });
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('expense_tracker_token', res.data.token);
      localStorage.setItem('expense_tracker_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error('Invalid login response from server');
  };

  const register = async (username, email, password, currency = 'USD') => {
    const res = await api.auth.register({ username, email, password, currency });
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('expense_tracker_token', res.data.token);
      localStorage.setItem('expense_tracker_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error('Invalid registration response from server');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('expense_tracker_token');
    localStorage.removeItem('expense_tracker_user');
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('expense_tracker_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error('Could not refresh user', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
