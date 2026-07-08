import { Route, Navigate } from "react-router-dom";
import AdminRoute from "../components/AdminRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminBannersPage from "../pages/AdminBannersPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import { ROUTES } from "../constants/routes";

export const adminRoutes = (
  <Route path="admin" element={<AdminRoute />}>
    <Route element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="banners" element={<AdminBannersPage />} />
      <Route path="categories" element={<AdminCategoriesPage />} />
    </Route>
  </Route>
);

export default adminRoutes;
