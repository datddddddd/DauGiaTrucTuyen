export const ROUTES = {
  PUBLIC: {
    LANDING: "/",
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
    PAYMENT_RESULT: "/payment-result",
  },
  USER: {
    HOME: "/auctions",
    AUCTION: (id) => `/auction/${id}`,
    ACCOUNT: {
      DASHBOARD: "/account/dashboard",
      WALLET: "/account/wallet",
      WATCHLIST: "/account/watchlist",
      PROFILE: "/account/profile",
    },
  },
  SELLER: {
    ROOT: "/seller",
    DASHBOARD: "/seller/dashboard",
    PRODUCTS: "/seller/products",
  },
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    BANNERS: "/admin/banners",
    CATEGORIES: "/admin/categories",
  },
};
