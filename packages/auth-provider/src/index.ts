'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AvailableSections, AuthContextType } from '@xgen/types';
import { getAuthCookie, setCookieAuth, removeAuthCookie, clearAllAuth, clearAllUserData, devLog } from '@xgen/utils';

const CookieContext = createContext<AuthContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [availableSections, setAvailableSections] = useState<AvailableSections | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const hasAccessToSection = useCallback((sectionId: string): boolean => {
    if (!availableSections) return false;
    return [...(availableSections.available_user_section || []), ...(availableSections.available_admin_section || [])].includes(sectionId);
  }, [availableSections]);

  const refreshAuth = useCallback(async () => {
    try {
      const userId = getAuthCookie('user_id'), username = getAuthCookie('username'), accessToken = getAuthCookie('access_token');
      if (userId && username && accessToken) {
        setUserState({ user_id: parseInt(userId), username, access_token: accessToken });
        setIsAuthenticated(true);
        const us = getAuthCookie('available_user_section'), as2 = getAuthCookie('available_admin_section');
        if (us || as2) setAvailableSections({ available_user_section: us ? us.split(',').filter(Boolean) : [], available_admin_section: as2 ? as2.split(',').filter(Boolean) : [] });
      } else { setUserState(null); setIsAuthenticated(false); setAvailableSections(null); }
    } catch (e) { devLog.error('Error refreshing auth:', e); setUserState(null); setIsAuthenticated(false); }
    finally { setIsInitialized(true); }
  }, []);

  const setUser = useCallback(async (u: User | null) => {
    if (u) { setCookieAuth('user_id', u.user_id.toString()); setCookieAuth('username', u.username); setCookieAuth('access_token', u.access_token); setUserState(u); setIsAuthenticated(true); }
    else { setUserState(null); setIsAuthenticated(false); setAvailableSections(null); }
  }, []);

  const clearAuth = useCallback((clearStorage = true) => {
    setIsLoggingOut(true); clearAllAuth(); removeAuthCookie('available_user_section'); removeAuthCookie('available_admin_section');
    setUserState(null); setIsAuthenticated(false); setAvailableSections(null);
    if (clearStorage) clearAllUserData(false);
    setTimeout(() => setIsLoggingOut(false), 100);
  }, []);

  const updateAvailableSections = useCallback((s: AvailableSections) => {
    setAvailableSections(s); setCookieAuth('available_user_section', s.available_user_section.join(',')); setCookieAuth('available_admin_section', s.available_admin_section.join(','));
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);

  return <CookieContext.Provider value={{ user, availableSections, isAuthenticated, isInitialized, isLoggingOut, setUser, clearAuth, refreshAuth, hasAccessToSection, updateAvailableSections }}>{children}</CookieContext.Provider>;
};

export const useAuth = (): AuthContextType => { const ctx = useContext(CookieContext); if (!ctx) throw new Error('useAuth must be used within CookieProvider'); return ctx; };
export const useCookie = useAuth;
export const AuthGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback = null }) => { const { isAuthenticated, isInitialized } = useAuth(); if (!isInitialized) return null; if (!isAuthenticated) return <>{fallback}</>; return <>{children}</>; };
export default CookieProvider;
