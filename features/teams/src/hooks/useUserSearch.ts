'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { XgenUser } from '../types';
import * as teamsApi from '../api/teams-api';

export interface UseUserSearchReturn {
  loading: boolean;
  results: XgenUser[];
  query: string;
  setQuery: (q: string) => void;
  refresh: () => Promise<void>;
}

export function useUserSearch(excludeUserIds: number[] = []): UseUserSearchReturn {
  const [allUsers, setAllUsers] = useState<XgenUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const users = await teamsApi.fetchAllUsers();
      setAllUsers(users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const excludeSet = useMemo(() => new Set(excludeUserIds), [excludeUserIds]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter((u) => !excludeSet.has(u.id))
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.fullName?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 20);
  }, [allUsers, query, excludeSet]);

  return { loading, results, query, setQuery, refresh: load };
}
