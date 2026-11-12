import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'bidx_admin_session';

// Supported default admin credentials
const VALID_CREDENTIALS = [
  { username: 'admin', email: 'admin@bidx.com', password: 'admin' },
  { username: 'admin', email: 'admin@bidx.com', password: 'admin123' },
  { username: 'organiser', email: 'organiser@bidx.com', password: 'password123' },
];

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

    // Check credentials
    const match = VALID_CREDENTIALS.find(c => 
      (c.username.toLowerCase() === trimmedId || c.email.toLowerCase() === trimmedId) && 
      c.password === trimmedPw
    );

    // Also allow 'admin' / 'admin' as fallback
    const isValid = match || (trimmedId === 'admin' && trimmedPw === 'admin');

    if (!isValid) {
      throw new Error('Invalid admin credentials. Please enter a valid username/email and password.');
    }

    const userData = {
      id: 'admin_slc_01',
      username: match ? match.username : 'admin',
      email: match ? match.email : 'admin@bidx.com',
      displayName: 'SLC Chief Organiser',
      role: 'ADMIN',
      tenantId: 'tenant_slc_2026',
      token: 'jwt_mock_token_admin_' + Date.now(),
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
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
