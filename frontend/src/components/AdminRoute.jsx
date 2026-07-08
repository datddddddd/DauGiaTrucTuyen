import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";

const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isAdmin) {
    return <Navigate to={ROUTES.USER.HOME} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
