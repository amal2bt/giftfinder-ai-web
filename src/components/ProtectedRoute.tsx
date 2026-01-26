import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: ReactNode;
};

const isAuthenticatedAdmin = () => {
  try {
    // ✅ Use sessionStorage instead of localStorage
    const token = sessionStorage.getItem("auth_token");
    const userRaw = sessionStorage.getItem("auth_user");
    if (!token || !userRaw) return false;

    const user = JSON.parse(userRaw);
    return user?.role?.toLowerCase?.() === "admin";
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  if (!isAuthenticatedAdmin()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
