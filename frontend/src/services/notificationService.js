import api from "./api";

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    return api.get("/notifications", { unread_only: unreadOnly });
  },

  async getUnreadCount() {
    return api.get("/notifications/unread-count");
  },

  async markAsRead(notificationId) {
    return api.put(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead() {
    return api.put("/notifications/mark-all-read");
  },

  async deleteNotification(notificationId) {
    return api.delete(`/notifications/${notificationId}`);
  },
};