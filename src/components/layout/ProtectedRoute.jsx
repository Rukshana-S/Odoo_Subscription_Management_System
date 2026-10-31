import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, authLoading } = useData();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#241733] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#8524E5] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-bright-textMuted tracking-wider font-semibold">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If Customer tries to access Admin/Staff routes, redirect to customer portal
    if (user.role === 'Customer') {
      return <Navigate to="/customer-portal" replace />;
    }
    // If Staff tries to access restricted Admin routes, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route component to redirect already authenticated users away from Login / Signup
export const PublicOnlyRoute = ({ children }) => {
  const { user, authLoading } = useData();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#241733] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#8524E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'Customer') {
      return <Navigate to="/customer-portal" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
