import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Provides authentication state to the entire application.
 * Persists the JWT token and userId in sessionStorage so a page
 * refresh won't immediately log the user out (token expires on tab close).
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('auth_token') || null);
  const [userId, setUserId] = useState(() => sessionStorage.getItem('auth_userId') || null);
  // transactionId is a short-lived value passed between the login and OTP pages;
  // it is NOT persisted to storage.
  const [transactionId, setTransactionId] = useState(null);

  const isLoggedIn = Boolean(token);

  /** Called after /api/login succeeds — stores userId and transactionId so
   *  the OTP page can reference them, but does NOT set isLoggedIn yet. */
  const setLoginSuccess = useCallback(({ userId: uid, transactionId: tid }) => {
    setUserId(uid);
    sessionStorage.setItem('auth_userId', uid);
    setTransactionId(tid);
  }, []);

  /** Called after /api/verify-otp succeeds — stores the JWT and marks
   *  the user as fully authenticated. */
  const setVerifySuccess = useCallback(({ token: jwt }) => {
    setToken(jwt);
    sessionStorage.setItem('auth_token', jwt);
  }, []);

  /** Clears all auth state and storage — used on logout. */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setTransactionId(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_userId');
  }, []);

  const value = {
    isLoggedIn,
    token,
    userId,
    transactionId,
    setLoginSuccess,
    setVerifySuccess,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
