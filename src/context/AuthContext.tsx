import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api, setToken, removeToken, getToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (studentData: any) => Promise<User>;
  logout: () => void;
  quickLogin: (role: UserRole) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token');
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (studentData: any): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', studentData);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const quickLogin = async (role: UserRole): Promise<User> => {
    let email = 'admin@edumanage.edu';
    if (role === 'teacher') email = 'dr.sharma@edumanage.edu';
    if (role === 'student') email = 'arav.sharma@student.edu';

    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
