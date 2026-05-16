import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RequireAuth() {
  const { token } = useAuth(); // single source of truth

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
