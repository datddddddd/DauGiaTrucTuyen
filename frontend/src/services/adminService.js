import api from "./api";

export const adminService = {
  async getStats() {
    return api.get("/admin/stats");
  },

  async getAllUsers(filters = {}) {
    return api.get("/admin/users", filters);
  },

  async updateUserRole(userId, roleData) {
    return api.put(`/admin/users/${userId}/role`, roleData);
  },

  async deleteUser(userId) {
    return api.delete(`/admin/users/${userId}`);
  },

  async getAllProducts(filters = {}) {
    return api.get("/admin/products", filters);
  },

  async forceCloseAuction(productId) {
    return api.put(`/admin/products/${productId}/close`);
  },

  async getSystemLogs(filters = {}) {
    return api.get("/admin/logs", filters);
  },

  async getAllTransactions(filters = {}) {
    return api.get("/admin/transactions", filters);
  },

  async approveTransaction(transactionId) {
    return api.put(`/admin/transactions/${transactionId}/approve`);
  },
};