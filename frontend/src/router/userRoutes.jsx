import { Route, Navigate } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import HomePage from "../pages/HomePage";
import AuctionPage from "../pages/AuctionPage";
import UserDashboardPage from "../pages/UserDashboardPage";
import WalletPage from "../pages/WalletPage";
import WatchlistPage from "../pages/WatchlistPage";
import ProfilePage from "../pages/ProfilePage";
import { ROUTES } from "../constants/routes";

export const userRoutes = (
  <Route element={<UserLayout />}>
    <Route path="auctions" element={<HomePage />} />
    <Route path="auction/:id" element={<AuctionPage />} />

    <Route path="account">
      <Route path="dashboard" element={<UserDashboardPage />} />
      <Route path="wallet" element={<WalletPage />} />
      <Route path="watchlist" element={<WatchlistPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>

    {/* Redirect URL cũ sang URL chuẩn */}
    <Route
      path="dashboard"
      element={<Navigate to={ROUTES.USER.ACCOUNT.DASHBOARD} replace />}
    />
    <Route
      path="wallet"
      element={<Navigate to={ROUTES.USER.ACCOUNT.WALLET} replace />}
    />
    <Route
      path="watchlist"
      element={<Navigate to={ROUTES.USER.ACCOUNT.WATCHLIST} replace />}
    />
    <Route
      path="profile"
      element={<Navigate to={ROUTES.USER.ACCOUNT.PROFILE} replace />}
    />
  </Route>
);

export default userRoutes;
