import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function formatExpiry(exp) {
  if (!exp) return 'N/A';
  return new Date(exp * 1000).toLocaleString();
}

export default function DashboardPage() {
  const { userId, token, logout } = useAuth();
  const navigate = useNavigate();

  const payload = token ? decodeJwtPayload(token) : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-brand">
          <span>🛡️</span> SecureAuth
        </div>
        <div className="dashboard-header-actions">
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            Logged in as <strong>{userId || 'Unknown'}</strong>
          </span>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '7px 16px' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="dashboard-content">
        {/* Welcome card */}
        <div className="welcome-card">
          <h2>Welcome back, {userId || 'Employee'} 👋</h2>
          <p>You have successfully authenticated. This is the protected members-only area.</p>
        </div>

        {/* Info tiles */}
        <div className="info-grid">
          <div className="info-tile">
            <div className="info-tile-label">Employee ID</div>
            <div className="info-tile-value">{userId || '—'}</div>
          </div>
          <div className="info-tile">
            <div className="info-tile-label">Session Status</div>
            <div className="info-tile-value">
              <span className="badge badge-green">✓ Active</span>
            </div>
          </div>
          <div className="info-tile">
            <div className="info-tile-label">Auth Method</div>
            <div className="info-tile-value">
              <span className="badge badge-blue">2FA / OTP</span>
            </div>
          </div>
          {payload?.exp && (
            <div className="info-tile">
              <div className="info-tile-label">Token Expires</div>
              <div className="info-tile-value" style={{ fontSize: '0.9rem' }}>{formatExpiry(payload.exp)}</div>
            </div>
          )}
        </div>

        {/* Token display */}
        <div>
          <p className="section-title">Authorization Token (JWT)</p>
          {import.meta.env.VITE_MOCK_API === 'true' && (
            <div className="alert alert-warning">
              <span>⚠️</span> Running in <strong>mock mode</strong>. In production, a real JWT from the backend would be used here.
            </div>
          )}
          <div className="token-box" role="region" aria-label="JWT token">
            {token}
          </div>
          {payload && (
            <div style={{ marginTop: 12 }}>
              <p className="section-title">Decoded Payload</p>
              <div className="token-box">
                <pre style={{ margin: 0 }}>{JSON.stringify(payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Security notice */}
        <div className="alert alert-info" style={{ marginTop: 24 }}>
          <span>ℹ️</span>
          <div>
            <strong>Security Notice:</strong> Your session token is stored in <code>sessionStorage</code> and will be cleared when you close this browser tab. Never share your token with anyone.
          </div>
        </div>
      </main>
    </div>
  );
}
