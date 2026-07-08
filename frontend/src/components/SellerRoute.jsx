import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";

const SellerRoute = () => {
  const { isSeller, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isSeller && !isAdmin) {
    return <Navigate to={ROUTES.USER.HOME} replace />;
  }

  return <Outlet />;
};

export default SellerRoute;
