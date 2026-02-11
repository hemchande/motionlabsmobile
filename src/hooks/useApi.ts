/**
 * React hooks for API calls with loading and error states
 */

import { useState, useCallback } from 'react';
import { ApiError } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | void>;
  reset: () => void;
}

/**
 * Hook for making API calls with loading and error states
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | void> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const apiError = error as ApiError;
        setState({ data: null, loading: false, error: apiError });
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for making API calls that don't need to return data
 */
export function useMutation<T>(
  apiFunction: (...args: any[]) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (...args: any[]): Promise<T | void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setLoading(false);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        setLoading(false);
        throw err;
      }
    },
    [apiFunction]
  );

  return {
    mutate,
    loading,
    error,
  };
}





