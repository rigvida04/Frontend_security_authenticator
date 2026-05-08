import axios from 'axios';

/**
 * Axios instance that automatically attaches the Authorization header
 * whenever a JWT token is present in sessionStorage.
 *
 * Usage:
 *   import authService from './authService';
 *   authService.login({ empId, password })
 *   authService.verifyOtp({ userId, transactionId, otp })
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------ */
/* HTTP Interceptor — attaches Bearer token to every outgoing request  */
/* ------------------------------------------------------------------ */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------ */
/* Response Interceptor — normalises error messages                    */
/* ------------------------------------------------------------------ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // isDevMockError is attached by the dev-only request interceptor below.
    // Let the dev-mock response interceptor handle those mock responses/errors.
    if (error?.isDevMockError) {
      return Promise.reject(error);
    }

    if (!error.response) {
      // Network / timeout error
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message || error.response.data?.error;

    if (status === 401) {
      return Promise.reject(new Error(serverMessage || 'Invalid credentials. Please try again.'));
    }
    if (status === 400) {
      return Promise.reject(new Error(serverMessage || 'Bad request. Please check your input.'));
    }
    if (status === 410) {
      return Promise.reject(new Error(serverMessage || 'OTP has expired. Please request a new one.'));
    }
    if (status === 429) {
      return Promise.reject(new Error('Too many attempts. Please wait a moment and try again.'));
    }
    if (status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    return Promise.reject(new Error(serverMessage || 'An unexpected error occurred.'));
  }
);

/* ------------------------------------------------------------------ */
/* Dev-only mock backend                                                */
/* Intercepted before any real HTTP request is made.                   */
/* Set VITE_MOCK_API=true in .env.local (or .env.development) to use. */
/* ------------------------------------------------------------------ */
const MOCK_ENABLED = import.meta.env.VITE_MOCK_API === 'true';

const MOCK_CREDENTIALS = { empId: 'EMP1234', password: 'password123' };
const MOCK_OTP = '123456';
let mockTransactionId = null;

if (MOCK_ENABLED) {
  api.interceptors.request.use(async (config) => {
    const url = config.url || '';

    if (url.endsWith('/login')) {
      const body = JSON.parse(config.data || '{}');
      if (
        body.empId?.toUpperCase() === MOCK_CREDENTIALS.empId &&
        body.password === MOCK_CREDENTIALS.password
      ) {
        mockTransactionId = 'mock-txn-' + Date.now();
        return Promise.reject({
          isDevMockError: true,
          data: { userId: body.empId.toUpperCase(), transactionId: mockTransactionId, message: 'OTP sent (mock)' },
        });
      }
      return Promise.reject({
        isDevMockError: true,
        error: { response: { status: 401, data: { message: 'Invalid credentials (mock)' } } },
      });
    }

    if (url.endsWith('/verify-otp')) {
      const body = JSON.parse(config.data || '{}');
      if (body.otp === MOCK_OTP && body.transactionId === mockTransactionId) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ sub: body.userId, exp: Math.floor(Date.now() / 1000) + 3600 }));
        const mockJwt = `${header}.${payload}.mock-signature`;
        return Promise.reject({ isDevMockError: true, data: { token: mockJwt, message: 'Authenticated (mock)' } });
      }
      return Promise.reject({
        isDevMockError: true,
        error: { response: { status: 401, data: { message: 'Invalid OTP (mock). Use: ' + MOCK_OTP } } },
      });
    }

    if (url.endsWith('/resend-otp')) {
      mockTransactionId = 'mock-txn-resend-' + Date.now();
      return Promise.reject({ isDevMockError: true, data: { transactionId: mockTransactionId, message: 'OTP resent (mock)' } });
    }

    return config;
  });

  api.interceptors.response.use(undefined, (error) => {
    if (error?.isDevMockError) {
      if (error.data) return Promise.resolve({ data: error.data });
      if (error.error) return Promise.reject(error.error);
    }
    return Promise.reject(error);
  });
}

/* ------------------------------------------------------------------ */
/* Service methods                                                      */
/* ------------------------------------------------------------------ */

/**
 * POST /api/login
 * @param {{ empId: string, password: string }} credentials
 * @returns {Promise<{ userId: string, transactionId: string, message: string }>}
 */
export async function login({ empId, password }) {
  const response = await api.post('/login', { empId, password });
  const { userId, transactionId } = response.data;
  if (!userId) throw new Error('Login response missing userId. Please contact support.');
  if (!transactionId) throw new Error('Login response missing transactionId. Please contact support.');
  return response.data;
}

/**
 * POST /api/verify-otp
 * @param {{ userId: string, transactionId: string, otp: string }} payload
 * @returns {Promise<{ token: string, message: string }>}
 */
export async function verifyOtp({ userId, transactionId, otp }) {
  const response = await api.post('/verify-otp', { userId, transactionId, otp });
  const { token } = response.data;
  if (!token) throw new Error('Verification succeeded but no token was returned. Please contact support.');
  return response.data;
}

/**
 * POST /api/resend-otp  (optional endpoint)
 * @param {{ userId: string, transactionId: string }} payload
 * @returns {Promise<{ transactionId: string, message: string }>}
 */
export async function resendOtp({ userId, transactionId }) {
  const response = await api.post('/resend-otp', { userId, transactionId });
  // Support both key styles for compatibility with different backend payloads.
  const returnedTransactionId = response.data?.transactionId || response.data?.transaction_id;
  if (!returnedTransactionId) {
    throw new Error('Resend OTP response missing required transactionId or transaction_id field.');
  }
  return response.data;
}

export default api;
