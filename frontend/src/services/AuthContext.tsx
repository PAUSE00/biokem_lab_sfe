import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
export type UserRole = 'Admin' | 'Responsable' | 'Technicien';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isResponsable: boolean;
  isTechnicien: boolean;
  /** Returns true if the current user has at least one of the given roles */
  hasRole: (...roles: UserRole[]) => boolean;
  /** Call after a successful login (token already saved) */
  refreshUser: () => void;
  logout: () => void;
}

/* ─── Context ────────────────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextValue | null>(null);

function readUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUserFromStorage);

  const refreshUser = useCallback(() => {
    setUser(readUserFromStorage());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  // Keep in sync if localStorage changes from another tab
  useEffect(() => {
    const handler = () => refreshUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refreshUser]);

  const role = user?.role ?? null;

  const value: AuthContextValue = {
    user,
    role,
    isAdmin: role === 'Admin',
    isResponsable: role === 'Responsable',
    isTechnicien: role === 'Technicien',
    hasRole: (...roles) => roles.includes(role as UserRole),
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
