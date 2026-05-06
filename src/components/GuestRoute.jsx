import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Prevents authenticated users from accessing public pages (login, verify-otp).
 * Redirects already-logged-in users to /dashboard.
 *
 * For /verify-otp specifically, also checks that a transactionId exists
 * (meaning the user has completed the initial login step).
 */
export default function GuestRoute() {
  const { isLoggedIn, transactionId } = useAuth();
  const location = useLocation();

  // If fully logged in, redirect to dashboard
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // Guard the /verify-otp page: only accessible after a successful login step
  if (location.pathname === '/verify-otp' && !transactionId) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
