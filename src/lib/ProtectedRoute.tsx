import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirebase } from './FirebaseContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useFirebase();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to home or a login page if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    // Redirect to home if they don't have the required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
