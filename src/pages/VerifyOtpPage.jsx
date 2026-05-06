import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { verifyOtp, resendOtp } from '../services/authService.js';
import OtpInput from '../components/OtpInput.jsx';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { userId, transactionId, setLoginSuccess, setVerifySuccess } = useAuth();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /* Resend OTP timer */
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const canResend = countdown <= 0 && !resending && !loading;

  /* ---- OTP change ---- */
  const handleOtpChange = useCallback((val) => {
    setOtp(val);
    setOtpError('');
    setApiError('');
  }, []);

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setOtpError('');

    if (otp.length < OTP_LENGTH) {
      setOtpError(`Please enter all ${OTP_LENGTH} digits.`);
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ userId, transactionId, otp });
      setVerifySuccess({ token: data.token });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Resend ---- */
  const handleResend = async () => {
    if (!canResend) return;
    setApiError('');
    setSuccessMsg('');
    setResending(true);
    try {
      const data = await resendOtp({ userId, transactionId });
      // Update transactionId if the backend issues a new one
      if (data.transactionId || data.transaction_id) {
        setLoginSuccess({
          userId,
          transactionId: data.transactionId || data.transaction_id,
        });
      }
      setCountdown(RESEND_COOLDOWN);
      setOtp('');
      setSuccessMsg('A new OTP has been sent to your registered device.');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setResending(false);
    }
  };

  /* ---- Dev mock auto-fill ---- */
  const fillMockOtp = () => {
    setOtp('123456');
    setOtpError('');
    setApiError('');
  };

  const maskedId = userId
    ? userId.length > 4
      ? userId.slice(0, 3) + '***' + userId.slice(-2)
      : '***'
    : '***';

  return (
    <div className="page-wrapper">
      <div className="card">
        {/* Header */}
        <div className="brand">
          <div className="brand-icon" style={{ background: '#059669' }}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="#fff"/>
            </svg>
          </div>
          <h1>OTP Verification</h1>
          <p>Enter the {OTP_LENGTH}-digit code sent to <strong>{maskedId}</strong></p>
        </div>

        {/* Alerts */}
        {apiError && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {apiError}
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" role="status">
            <span>✅</span> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group text-center">
            <label className="form-label" style={{ display: 'block', marginBottom: 12 }}>
              One-Time Password
            </label>
            <OtpInput
              length={OTP_LENGTH}
              value={otp}
              onChange={handleOtpChange}
              hasError={Boolean(otpError)}
              disabled={loading}
            />
            {otpError && <p className="field-error text-center" style={{ marginTop: 8 }}>{otpError}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || otp.length < OTP_LENGTH}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner" />Verifying…</> : 'Verify OTP →'}
          </button>
        </form>

        {/* Resend section */}
        <div className="text-center mt-16">
          {countdown > 0 ? (
            <p className="timer-text">
              Resend OTP in <span>{countdown}s</span>
            </p>
          ) : (
            <p className="timer-text">
              Didn't receive a code?{' '}
              <button
                className="resend-btn"
                onClick={handleResend}
                disabled={!canResend}
                type="button"
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
            </p>
          )}
        </div>

        {import.meta.env.VITE_MOCK_API === 'true' && (
          <p className="text-center mt-8">
            <button
              type="button"
              onClick={fillMockOtp}
              style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Fill mock OTP (mock mode)
            </button>
          </p>
        )}

        {/* Back link */}
        <div className="text-center mt-16">
          <Link to="/login" className="back-link" style={{ justifyContent: 'center' }}>
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
