import api from "./api";

export const categoryService = {
  async getCategories() {
    return api.get("/categories");
  },

  async getCategory(categoryId) {
    return api.get(`/categories/${categoryId}`);
  },

  async createCategory(categoryData) {
    return api.post("/categories", categoryData);
  },

  async updateCategory(categoryId, categoryData) {
    return api.put(`/categories/${categoryId}`, categoryData);
  },

  async deleteCategory(categoryId) {
    return api.delete(`/categories/${categoryId}`);
  },
};