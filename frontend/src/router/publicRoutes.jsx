import { Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import { ROUTES } from "../constants/routes";

export const publicRoutes = (
  <>
    <Route path={ROUTES.PUBLIC.LANDING} element={<LandingPage />} />
    <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
    <Route path={ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
  </>
);

export default publicRoutes;
