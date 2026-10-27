import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('bookmind_token') || '');
  const queryClient = useQueryClient();

  // Safely clear all cached queries to prevent cross-user data leakage
  const clearClientCache = useCallback(() => {
    if (queryClient) {
      queryClient.clear();
    }
  }, [queryClient]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('bookmind_token', token);
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('bookmind_token');
      clearClientCache();
      setUser(null);
      setLoading(false);
    }
  }, [token, clearClientCache]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Session check failed:', err.response?.data || err.message);
      clearClientCache();
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Purge any stale queries from previous session before authenticating
    clearClientCache();
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, readingGoal, favoriteGenres) => {
    // Purge any stale queries before creating new account session
    clearClientCache();
    const res = await axios.post('/api/auth/register', {
      name,
      email,
      password,
      readingGoal,
      favoriteGenres
    });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    // Wipe all cached query data from memory immediately
    clearClientCache();
    setToken('');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await axios.put('/api/auth/profile', profileData);
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateProfile, clearClientCache }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
