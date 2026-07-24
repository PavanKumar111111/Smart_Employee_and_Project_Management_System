import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }
  return <>{children}</>;
}
