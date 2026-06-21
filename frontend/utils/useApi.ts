"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken, clearToken } from './token';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, message: 'Unauthorized' };
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: 'Invalid response' };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

export function useApi<T = any>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    const result = await apiFetch<T>(endpoint);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.message || 'Failed to fetch');
    }
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export async function apiPost<T = any>(endpoint: string, body: any) {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut<T = any>(endpoint: string, body: any) {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T = any>(endpoint: string) {
  return apiFetch<T>(endpoint, {
    method: 'DELETE',
  });
}
