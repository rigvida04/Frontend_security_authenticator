import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login } from '../services/authService.js';

/* ------------------------------------------------------------------ */
/* Validation helpers                                                   */
/* ------------------------------------------------------------------ */
const EMP_ID_REGEX = /^EMP\d{4,8}$/i; // e.g. EMP1234 or emp12345678

function validateForm({ empId, password }) {
  const errors = {};
  if (!empId.trim()) {
    errors.empId = 'Employee ID is required.';
  } else if (!EMP_ID_REGEX.test(empId.trim())) {
    errors.empId = 'Format: EMP followed by 4–8 digits (e.g. EMP1234).';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* File parsing: extracts empId & password from plain-text or JSON     */
/* ------------------------------------------------------------------ */
function parseCredentialFile(text) {
  // Try JSON first
  try {
    const json = JSON.parse(text);
    const empId = json.empId || json.emp_id || json.employeeId || json.username || '';
    const password = json.password || json.pass || '';
    return { empId: String(empId), password: String(password) };
  } catch {
    // Fall back to KEY=VALUE or KEY: VALUE plain-text lines
    const lines = text.split(/\r?\n/);
    const map = {};
    for (const line of lines) {
      const match = line.match(/^([^=:]+)[=:](.+)$/);
      if (match) {
        const key = match[1].trim().toLowerCase().replace(/[^a-z]/g, '');
        const val = match[2].trim();
        map[key] = val;
      }
    }
    const empId = map['empid'] || map['emp_id'] || map['employeeid'] || map['username'] || '';
    const password = map['password'] || map['pass'] || '';
    return { empId, password };
  }
}

/* ------------------------------------------------------------------ */
/* Shield Icon SVG                                                      */
/* ------------------------------------------------------------------ */
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5L12 1zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const navigate = useNavigate();
  const { setLoginSuccess } = useAuth();
  const fileInputRef = useRef(null);

  /* UI mode: 'manual' | 'file' */
  const [mode, setMode] = useState('manual');

  /* Form state */
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /* File upload state */
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileParseError, setFileParseError] = useState('');

  /* Network state */
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  /* ---- mode switch ---- */
  const switchMode = (m) => {
    setMode(m);
    setApiError('');
    setFieldErrors({});
    setFileParseError('');
  };

  /* ---- file handling ---- */
  const processFile = (file) => {
    setFileParseError('');
    const allowed = ['text/plain', 'application/json', 'text/csv'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(txt|json|csv)$/i)) {
      setFileParseError('Only .txt, .json, or .csv files are supported.');
      return;
    }
    if (file.size > 1024 * 50) { // 50 KB max
      setFileParseError('File too large (max 50 KB).');
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { empId: fEmpId, password: fPass } = parseCredentialFile(e.target.result);
      setEmpId(fEmpId);
      setPassword(fPass);
      setFieldErrors({});
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const removeFile = () => {
    setUploadedFile(null);
    setEmpId('');
    setPassword('');
    setFileParseError('');
  };

  /* ---- form submission ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errors = validateForm({ empId, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const data = await login({ empId: empId.trim().toUpperCase(), password });
      // On success: store userId + transactionId and navigate to OTP page
      setLoginSuccess({
        userId: data.userId,
        transactionId: data.transactionId,
      });
      navigate('/verify-otp');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---- demo shortcut (dev only) ---- */
  const fillDemo = () => {
    setEmpId('EMP1234');
    setPassword('password123');
    setFieldErrors({});
    setApiError('');
  };

  return (
    <div className="page-wrapper">
      <div className="card">
        {/* Branding */}
        <div className="brand">
          <div className="brand-icon"><ShieldIcon /></div>
          <h1>SecureAuth</h1>
          <p>Employee Authentication Portal</p>
        </div>

        {/* Error alert */}
        {apiError && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {apiError}
          </div>
        )}

        {/* Input mode tabs */}
        <div className="tabs" role="tablist">
          <button
            className={`tab-btn ${mode === 'manual' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => switchMode('manual')}
            type="button"
          >
            ✏️ Enter manually
          </button>
          <button
            className={`tab-btn ${mode === 'file' ? 'active' : ''}`}
            role="tab"
            aria-selected={mode === 'file'}
            onClick={() => switchMode('file')}
            type="button"
          >
            📁 Import from file
          </button>
        </div>

        {/* File upload zone */}
        {mode === 'file' && (
          <div className="form-group">
            {fileParseError && (
              <div className="alert alert-error mb-0" style={{ marginBottom: 10 }} role="alert">
                <span>⚠️</span> {fileParseError}
              </div>
            )}
            {uploadedFile ? (
              <div className="file-info">
                <span>📄</span>
                <span className="file-info-name">{uploadedFile.name}</span>
                <button className="file-remove-btn" onClick={removeFile} type="button" title="Remove file">✕</button>
              </div>
            ) : (
              <label
                className={`file-upload-area ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleFileDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.csv"
                  onChange={handleFileInput}
                />
                <div className="file-upload-icon">📤</div>
                <p className="file-upload-text">
                  <strong>Click to browse</strong> or drag & drop your credentials file
                </p>
                <p className="file-upload-text" style={{ marginTop: 4, fontSize: '0.8rem' }}>
                  Supported: .txt, .json, .csv (max 50 KB)
                </p>
              </label>
            )}
            <p className="text-muted" style={{ marginTop: 8, fontSize: '0.78rem' }}>
              File format: <code>empId: EMP1234</code> and <code>password: yourpass</code> (or JSON)
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Employee ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="empId">Employee ID</label>
            <input
              id="empId"
              type="text"
              className={`form-input ${fieldErrors.empId ? 'error' : ''}`}
              placeholder="e.g. EMP1234"
              value={empId}
              onChange={(e) => { setEmpId(e.target.value); setFieldErrors((p) => ({ ...p, empId: '' })); }}
              autoComplete="username"
              spellCheck={false}
            />
            {fieldErrors.empId && <p className="field-error">{fieldErrors.empId}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" />Sending OTP…</> : 'Login & Get OTP →'}
          </button>
        </form>

        {import.meta.env.VITE_MOCK_API === 'true' && (
          <p className="text-center mt-16">
            <button
              type="button"
              onClick={fillDemo}
              style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Fill demo credentials (mock mode)
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
