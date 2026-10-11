import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse } from '../types';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  userName: string | null;
  role: 'farmer' | 'family_helper' | null;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isHelper: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('krishi_token'));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('krishi_uid'));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('krishi_name'));
  const [role, setRole] = useState<'farmer' | 'family_helper' | null>(() => {
    return (localStorage.getItem('krishi_role') as 'farmer' | 'family_helper') || null;
  });

  const login = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUserId(authData.user_id);
    setUserName(authData.full_name);
    setRole(authData.role);

    localStorage.setItem('krishi_token', authData.access_token);
    localStorage.setItem('krishi_uid', authData.user_id);
    localStorage.setItem('krishi_name', authData.full_name);
    localStorage.setItem('krishi_role', authData.role);
    if (authData.language_preference) {
      localStorage.setItem('krishi_language', authData.language_preference);
    }
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUserName(null);
    setRole(null);
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_uid');
    localStorage.removeItem('krishi_name');
    localStorage.removeItem('krishi_role');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        userName,
        role,
        login,
        logout,
        isAuthenticated: !!token,
        isHelper: role === 'family_helper'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
