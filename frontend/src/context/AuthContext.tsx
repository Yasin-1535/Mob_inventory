import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  UserRole,
  AuthSession,
  mockLogin,
  registerCustomerAccount,
  getStoredSession,
  clearStoredSession,
} from '../services/mockAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (identifier: string, password: string, role: UserRole) => Promise<void>;
  registerCustomer: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const newSession = await mockLogin(identifier, password, role);
      setSession(newSession);
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    setLoading(true);
    try {
      const newSession = await registerCustomerAccount(data);
      setSession(newSession);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session?.isAuthenticated,
        user: session?.user || null,
        role: session?.role || null,
        loading,
        login,
        registerCustomer,
        logout,
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
