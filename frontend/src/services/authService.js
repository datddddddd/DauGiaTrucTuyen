import api from "./api";

export const authService = {
  async login(username, password, rememberMe = false) {
    return api.post("/auth/login", {
      username,
      password,
      remember_me: rememberMe,
    });
  },

  async register(userData) {
    return api.post("/auth/register", userData);
  },

  async getProfile() {
    return api.get("/auth/me");
  },

  async updateProfile(profileData) {
    return api.put("/auth/profile", profileData);
  },

  async changePassword(passwordData) {
    return api.post("/auth/change-password", passwordData);
  },

  async forgotPassword(email) {
    return api.post("/auth/forgot-password", { email });
  },

  async resetPassword(resetData) {
    return api.post("/auth/reset-password", resetData);
  },

  async logout() {
    return api.post("/auth/logout");
  },

  saveAuthData(token, username, role) {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);
  },

  clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  getUserRole() {
    return localStorage.getItem("role") || "buyer";
  },

  getUsername() {
    return localStorage.getItem("username") || "";
  },

  isAdmin() {
    return this.getUserRole() === "admin";
  },

  isSeller() {
    return this.getUserRole() === "seller";
  },
};