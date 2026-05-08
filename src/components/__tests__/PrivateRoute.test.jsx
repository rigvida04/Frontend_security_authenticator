import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import PrivateRoute from '../PrivateRoute.jsx';

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Route>
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('renders child route for authenticated users', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Route>
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
  });
});
