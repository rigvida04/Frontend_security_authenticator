import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import GuestRoute from '../GuestRoute.jsx';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('GuestRoute', () => {
  it('allows /login for logged out users', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, transactionId: null });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<h1>Login</h1>} />
            <Route path="/verify-otp" element={<h1>Verify OTP</h1>} />
          </Route>
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('redirects /verify-otp to /login when transactionId is missing', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, transactionId: null });

    render(
      <MemoryRouter initialEntries={['/verify-otp']}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<h1>Login</h1>} />
            <Route path="/verify-otp" element={<h1>Verify OTP</h1>} />
          </Route>
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Verify OTP' })).not.toBeInTheDocument();
  });

  it('redirects authenticated users to /dashboard', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, transactionId: 'txn-123' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<h1>Login</h1>} />
            <Route path="/verify-otp" element={<h1>Verify OTP</h1>} />
          </Route>
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
  });
});
