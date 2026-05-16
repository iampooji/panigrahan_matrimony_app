import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RequireGuest({ children }) {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
