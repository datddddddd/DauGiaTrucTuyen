import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--page-bg)" }}
      >
        <p style={{ color: "var(--text)" }}>⏳ Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.PUBLIC.LOGIN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
