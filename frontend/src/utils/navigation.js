import { ROUTES } from "../constants/routes";

export function getHomePathByRole(role) {
  if (role === "admin") return ROUTES.ADMIN.DASHBOARD;
  if (role === "seller") return ROUTES.SELLER.DASHBOARD;
  return ROUTES.USER.HOME;
}

export function isActivePath(pathname, path) {
  if (path === ROUTES.USER.HOME) {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
