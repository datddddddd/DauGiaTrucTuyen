import api from "./api";

export const bannerService = {
  async getBanners(activeOnly = true) {
    return api.get("/banners", { active_only: activeOnly });
  },

  async getBanner(bannerId) {
    return api.get(`/banners/${bannerId}`);
  },

  async createBanner(bannerData) {
    return api.post("/banners", bannerData);
  },

  async updateBanner(bannerId, bannerData) {
    return api.put(`/banners/${bannerId}`, bannerData);
  },

  async deleteBanner(bannerId) {
    return api.delete(`/banners/${bannerId}`);
  },
};