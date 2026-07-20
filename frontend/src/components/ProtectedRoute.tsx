import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string; // Optional custom redirect path
}

// Route role mapping for automatic redirection
const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  staff: '/staff/dashboard',
  guest: '/guest',
};

/**
 * ProtectedRoute - Client-side Route Guard with URL Hijack Prevention
 * 
 * Security Features:
 * 1. Role-based access control enforcement
 * 2. Automatic redirection to safe entry points on unauthorized access
 * 3. Silent security logging for audit trail
 * 4. Graceful error handling with user feedback
 */
export default function ProtectedRoute({ 
  allowedRoles, 
  children, 
  fallbackPath 
}: ProtectedRouteProps) {
  const { role, token } = useAuth();
  const location = useLocation();

  // SECURITY: Log unauthorized access attempts
  useEffect(() => {
    if (token && !allowedRoles.includes(role)) {
      // Silent security log - no UI disruption
      console.warn(
        `[SECURITY] Unauthorized route access attempt:`,
        {
          timestamp: new Date().toISOString(),
          currentRole: role,
          attemptedPath: location.pathname,
          allowedRoles,
          userAgent: navigator.userAgent,
        }
      );

      // Optional: Send to backend audit log (non-blocking)
      try {
        fetch('/api/security/unauthorized-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            attempted_path: location.pathname,
            allowed_roles: allowedRoles,
            timestamp: new Date().toISOString(),
          }),
          // Fire-and-forget: don't wait for response
        }).catch(() => {
          // Silently fail - don't block navigation
        });
      } catch (error) {
        // Ignore network errors - security logging is best-effort
      }
    }
  }, [token, role, location.pathname, allowedRoles]);

  // Check authentication status
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // URL HIJACK PREVENTION: Block unauthorized role access
  if (!allowedRoles.includes(role)) {
    // Redirect to user's safe entry point
    const safePath = fallbackPath || ROLE_DEFAULT_PATHS[role];
    
    // Show brief warning toast before redirect (optional enhancement)
    // For now, immediate redirect to prevent any flash of unauthorized content
    return <Navigate to={safePath} replace />;
  }

  // Authorized: render protected content
  return <>{children}</>;
}
