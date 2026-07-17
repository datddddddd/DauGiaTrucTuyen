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
  async toggleUserBlock(userId) {
    return api.put(`/admin/users/${userId}/toggle-block`);
  },
  async verifySeller(userId) {
    return api.put(`/admin/users/${userId}/verify-seller`);
  },
  async resetUserPassword(userId) {
    return api.put(`/admin/users/${userId}/reset-password`);
  },
  async approveProduct(productId) {
    return api.put(`/admin/products/${productId}/approve`);
  },
  async rejectProduct(productId) {
    return api.put(`/admin/products/${productId}/reject`);
  },
  async deleteProduct(productId) {
    return api.delete(`/products/${productId}`);
  },
  async getReports() {
    return api.get("/reports");
  },
  async resolveReport(reportId, actionData) {
    return api.put(`/reports/${reportId}/resolve`, actionData);
  },
  async completeEscrow(productId) {
    return api.post(`/admin/products/${productId}/complete-escrow`);
  },
  async getAllPayments(filters = {}) {
    return api.get("/admin/payments", filters);
  },
  async getPaymentStats() {
    return api.get("/admin/payments/stats");
  },
  async getPaymentDetails(paymentId) {
    return api.get(`/admin/payments/${paymentId}`);
  },
  async releasePayment(paymentId) {
    return api.post(`/admin/payments/${paymentId}/release`);
  }
};