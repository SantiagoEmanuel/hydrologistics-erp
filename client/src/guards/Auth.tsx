import { useAuth } from "@/hook/useAuth";
import { Navigate, Outlet, useLocation } from "react-router";

interface AuthGuardProps {
  allowedRoles?: string[];
}

export default function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "DRIVER")
      return <Navigate to="/dashboard/routes" replace />;
    if (user.role === "EMPLOYEE")
      return <Navigate to="/dashboard/pos" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
