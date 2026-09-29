import type { AccountResponse, SessionResponse } from '@padosipro/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isApiError, setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { api } from '@/api/endpoints';
import { loadApiUrl } from '@/config/api-url';
import { secureStorage } from '@/lib/storage';

const TOKEN_KEY = 'padosipro.session';

type SessionState =
  | { status: 'loading' }
  /** A token is stored but the server couldn't be reached to confirm it. */
  | { status: 'offline'; message: string }
  | { status: 'signedOut' }
  | { status: 'signedIn'; account: AccountResponse };

interface SessionContextValue {
  state: SessionState;
  account: AccountResponse | null;
  signIn(session: SessionResponse): Promise<void>;
  setAccount(account: AccountResponse): void;
  signOut(): Promise<void>;
  retry(): void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const clearLocalSession = useCallback(async () => {
    setAuthToken(null);
    await secureStorage.remove(TOKEN_KEY);
    queryClient.clear();
    setState({ status: 'signedOut' });
  }, [queryClient]);

  // Restore the session on launch: this is what keeps a user logged in across restarts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadApiUrl();
      const token = await secureStorage.get(TOKEN_KEY);
      if (!token) {
        if (!cancelled) setState({ status: 'signedOut' });
        return;
      }
      setAuthToken(token);
      try {
        const account = await api.me();
        if (!cancelled) setState({ status: 'signedIn', account });
      } catch (error) {
        if (cancelled) return;
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          await clearLocalSession();
        } else {
          setState({
            status: 'offline',
            message: isApiError(error) ? error.message : "Can't reach PadosiPro right now.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, clearLocalSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clearLocalSession());
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  const signIn = useCallback(async (session: SessionResponse) => {
    setAuthToken(session.token);
    await secureStorage.set(TOKEN_KEY, session.token);
    setState({ status: 'signedIn', account: { user: session.user, profile: session.profile } });
  }, []);

  const setAccount = useCallback((account: AccountResponse) => {
    setState({ status: 'signedIn', account });
  }, []);

  const signOut = useCallback(async () => {
    // Revoke server-side first (best effort); the local session ends either way.
    await api.logout().catch(() => {});
    await clearLocalSession();
  }, [clearLocalSession]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      account: state.status === 'signedIn' ? state.account : null,
      signIn,
      setAccount,
      signOut,
      retry,
    }),
    [state, signIn, setAccount, signOut, retry],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}
