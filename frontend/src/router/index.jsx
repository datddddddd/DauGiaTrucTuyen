import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";
import SellerRoute from "../components/SellerRoute";
import { ROUTES } from "../constants/routes";

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

const AppRouter = () => (
  <Routes>
    {/* Public Routes */}
    <Route path={ROUTES.PUBLIC.LANDING} element={<LandingPage />} />
    <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
    <Route path={ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

    {/* Protected User Routes */}
    <Route element={<ProtectedRoute />}>
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

      {/* Seller Routes */}
      <Route element={<SellerRoute />}>
        <Route path="seller">
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="admin">
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to={ROUTES.USER.HOME} replace />} />
  </Routes>
);

export default AppRouter;
