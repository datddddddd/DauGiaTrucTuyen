import api from "./api";

export const walletService = {
  async getWallet() {
    return api.get("/wallet");
  },

  async deposit(transactionData) {
    return api.post("/wallet/deposit", transactionData);
  },

  async withdraw(transactionData) {
    return api.post("/wallet/withdraw", transactionData);
  },

  async getTransactions(limit = 50) {
    return api.get("/wallet/transactions", { limit });
  },

  async payForAuction(productId) {
    return api.post(`/wallet/payment/${productId}`);
  },
};