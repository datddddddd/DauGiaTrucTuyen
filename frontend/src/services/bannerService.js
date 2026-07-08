import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const bannerService = {
  async getBanners(activeOnly = true) {
    const response = await axios.get(`${API_URL}/banners`, {
      params: { active_only: activeOnly },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getBanner(bannerId) {
    const response = await axios.get(`${API_URL}/banners/${bannerId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async createBanner(formData) {
    const response = await axios.post(`${API_URL}/banners`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  async updateBanner(bannerId, formData) {
    const response = await axios.put(`${API_URL}/banners/${bannerId}`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  },

  async deleteBanner(bannerId) {
    const response = await axios.delete(`${API_URL}/banners/${bannerId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};