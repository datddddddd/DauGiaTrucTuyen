import { Route, Navigate } from "react-router-dom";
import SellerRoute from "../components/SellerRoute";
import SellerLayout from "../layouts/SellerLayout";
import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerProductsPage from "../pages/seller/SellerProductsPage";
import { ROUTES } from "../constants/routes";

export const sellerRoutes = (
  <Route path="seller" element={<SellerRoute />}>
    <Route element={<SellerLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<SellerDashboardPage />} />
      <Route path="products" element={<SellerProductsPage />} />
    </Route>
  </Route>
);

export default sellerRoutes;
