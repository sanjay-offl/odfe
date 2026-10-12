import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/errors';

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

/**
 * Runs an async loader and exposes loading / error / retry. Used for demo "network"
 * reads (reports, dashboard) so real API calls can slot in unchanged.
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = [], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [state, setState] = useState<AsyncState<T>>({ loading: enabled });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    loaderRef
      .current()
      .then((data) => alive && setState({ data, loading: false, error: undefined }))
      .catch((err) => alive && setState((s) => ({ ...s, loading: false, error: errorMessage(err) })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

export interface ActionOptions<R> {
  success?: string | ((result: R) => string);
  onSuccess?: (result: R) => void;
  onError?: (message: string) => void;
  /** Suppress the automatic success toast. */
  silent?: boolean;
}

/** Wraps a mutating service call with pending + error state and consistent toasts. */
export function useAction<Args extends unknown[], R>(action: (...args: Args) => Promise<R>, options: ActionOptions<R> = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const actionRef = useRef(action);
  actionRef.current = action;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const run = useCallback(async (...args: Args): Promise<{ ok: true; data: R } | { ok: false; error: string }> => {
    setPending(true);
    setError(undefined);
    try {
      const data = await actionRef.current(...args);
      const opts = optionsRef.current;
      if (!opts.silent && opts.success) {
        const { default: toast } = await import('react-hot-toast');
        toast.success(typeof opts.success === 'function' ? opts.success(data) : opts.success);
      }
      opts.onSuccess?.(data);
      return { ok: true, data };
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      optionsRef.current.onError?.(message);
      return { ok: false, error: message };
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, reset: () => setError(undefined) };
}

export function useDebounced<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Ticking clock for elapsed kitchen timers and the header date/time. */
export function useClock(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
