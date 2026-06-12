import api from "./api";

export const watchlistService = {
  async getWatchlist() {
    return api.get("/watchlist");
  },

  async addToWatchlist(productId) {
    return api.post("/watchlist", { product_id: productId });
  },

  async removeFromWatchlist(watchlistId) {
    return api.delete(`/watchlist/${watchlistId}`);
  },

  async removeProductFromWatchlist(productId) {
    return api.delete(`/watchlist/product/${productId}`);
  },

  async isInWatchlist(productId) {
    try {
      const watchlist = await this.getWatchlist();
      return watchlist.some((item) => item.product_id === productId);
    } catch (error) {
      return false;
    }
  },
};