import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";
import SellerRoute from "../components/SellerRoute";
import { ROUTES } from "../constants/routes";

// Import Layouts
import UserLayout from "../layouts/UserLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";

// Import all pages directly
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import HomePage from "../pages/HomePage";
import AuctionPage from "../pages/AuctionPage";
import UserDashboardPage from "../pages/UserDashboardPage";
import WalletPage from "../pages/WalletPage";
import WatchlistPage from "../pages/WatchlistPage";
import ProfilePage from "../pages/ProfilePage";

import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerProductsPage from "../pages/seller/SellerProductsPage";

import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminBannersPage from "../pages/AdminBannersPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import PaymentResult from "../pages/PaymentResult";

const AppRouter = () => (
  <Routes>
    {/* Public Routes */}
    <Route path={ROUTES.PUBLIC.LANDING} element={<LandingPage />} />
    <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
    <Route path={ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
    <Route path={ROUTES.PUBLIC.PAYMENT_RESULT} element={<PaymentResult />} />

    {/* Protected User Routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<UserLayout />}>
        <Route path="auctions" element={<HomePage />} />
        <Route path="auction/:id" element={<AuctionPage />} />

        <Route path="account">
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="dashboard" element={<Navigate to={ROUTES.USER.ACCOUNT.DASHBOARD} replace />} />
        <Route path="wallet" element={<Navigate to={ROUTES.USER.ACCOUNT.WALLET} replace />} />
        <Route path="watchlist" element={<Navigate to={ROUTES.USER.ACCOUNT.WATCHLIST} replace />} />
        <Route path="profile" element={<Navigate to={ROUTES.USER.ACCOUNT.PROFILE} replace />} />
      </Route>

      {/* Seller Routes */}
      <Route path="seller" element={<SellerRoute />}>
        <Route element={<SellerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.USER.HOME} replace />} />
  </Routes>
);

export default AppRouter;
