import { useMemo, useState } from 'react'
import './App.css'

const INITIAL_FORM = {
  fullName: '',
  email: '',
  employeeId: '',
  password: '',
  confirmPassword: '',
  otp: '',
}

const MOCK_ACCOUNT = {
  employeeId: 'EMP1234',
  password: 'password123',
  otp: '123456',
}

function validateForm(form) {
  const errors = {}

  if (!form.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (!/^[A-Za-z ]{2,50}$/.test(form.fullName.trim())) {
    errors.fullName = 'Use only letters and spaces (2-50 characters).'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.employeeId.trim()) {
    errors.employeeId = 'Employee ID is required.'
  } else if (!/^EMP\d{4}$/.test(form.employeeId.trim().toUpperCase())) {
    errors.employeeId = 'Employee ID must be in format EMP1234.'
  }

  if (!form.password) {
    errors.password = 'Password is required.'
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (!form.otp.trim()) {
    errors.otp = 'OTP is required.'
  } else if (!/^\d{6}$/.test(form.otp.trim())) {
    errors.otp = 'OTP must be exactly 6 digits.'
  }

  return errors
}

function App() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  const securityNote = useMemo(
    () =>
      'This app performs all validation on the frontend and keeps auth state in memory only (no third-party cookies or persistent cookies).',
    [],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    setStatus('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validateForm(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus('Please fix the validation errors.')
      return
    }

    const normalizedEmployeeId = form.employeeId.trim().toUpperCase()
    const isValidMockLogin =
      normalizedEmployeeId === MOCK_ACCOUNT.employeeId &&
      form.password === MOCK_ACCOUNT.password &&
      form.otp.trim() === MOCK_ACCOUNT.otp

    if (!isValidMockLogin) {
      setStatus('Authentication failed. Check Employee ID, password, and OTP.')
      return
    }

    setStatus(`Authenticated successfully for ${form.fullName.trim()}. Session is memory-only.`)
    setForm(INITIAL_FORM)
    setErrors({})
  }

  return (
    <main className="app-shell">
      <section className="card" aria-label="frontend authenticator">
        <h1>Frontend Security Authenticator</h1>
        <p className="subtitle">Validate user details and avoid third-party cookie based auth storage.</p>

        <form noValidate onSubmit={handleSubmit} className="form-grid">
          <label>
            Full Name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              placeholder="John Doe"
            />
            {errors.fullName && <span className="error">{errors.fullName}</span>}
          </label>

          <label>
            Email
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="john@example.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </label>

          <label>
            Employee ID
            <input
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              autoComplete="off"
              placeholder="EMP1234"
            />
            {errors.employeeId && <span className="error">{errors.employeeId}</span>}
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </label>

          <label>
            OTP
            <input
              name="otp"
              value={form.otp}
              onChange={handleChange}
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="123456"
            />
            {errors.otp && <span className="error">{errors.otp}</span>}
          </label>

          <button type="submit">Authenticate</button>
        </form>

        {status && <p className="status">{status}</p>}
        <p className="note">{securityNote}</p>
      </section>
    </main>
  )
}

export default App
