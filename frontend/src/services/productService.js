import api from "./api";

export const productService = {
  async getProducts(filters = {}) {
    return api.get("/products", filters);
  },

  async getProduct(productId) {
    return api.get(`/products/${productId}`);
  },

  async getProductBids(productId) {
    return api.get(`/products/${productId}/bids`);
  },

  async placeBid(bidData) {
    return api.post(`/products/${bidData.product_id}/bid`, {
      bid_amount: bidData.bid_amount,
    });
  },

  async createProduct(productData) {
    return api.post("/products", productData);
  },

  async updateProduct(productId, productData) {
    return api.put(`/products/${productId}`, productData);
  },

  async deleteProduct(productId) {
    return api.delete(`/products/${productId}`);
  },
};