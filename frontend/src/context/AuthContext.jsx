import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'bidx_admin_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(user);

  const login = async (identifier, password) => {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const trimmedPw = (password || '').trim();

    const res = await api.login(trimmedId, trimmedPw);
    if (res && res.success && res.token) {
        const userData = {
          id: res.user.id,
          username: res.user.username || trimmedId,
          email: res.user.email,
          displayName: res.user.fullName || 'Chief Auction Organiser',
          role: res.user.role || 'ADMIN',
          tenantId: res.user.tenantId,
          tenantName: res.user.tenantName,
          token: res.token,
          loginAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        window.dispatchEvent(new Event('bidx:auth-changed'));
      return userData;
    }
    throw new Error('The server did not return a valid login session.');
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.dispatchEvent(new Event('bidx:auth-changed'));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
