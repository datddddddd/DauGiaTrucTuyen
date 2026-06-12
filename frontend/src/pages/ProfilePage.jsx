import { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import { authService } from "../services";

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateProfile(profileData);
      setMessage("Cập nhật thông tin thành công!");
    } catch (error) {
      setMessage("Cập nhật thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage("Mật khẩu mới không khớp!");
      setLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setMessage("Đổi mật khẩu thành công!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      setMessage("Đổi mật khẩu thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6 text-center">Vui lòng đăng nhập...</div>;
  }

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <h1 className="text-2xl font-semibold text-brand-h mb-6">Hồ sơ của tôi</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-brand-border">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium ${
                activeTab === "profile"
                  ? "text-accent border-b-2 border-accent"
                  : "text-brand-text"
              }`}
            >
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 font-medium ${
                activeTab === "security"
                  ? "text-accent border-b-2 border-accent"
                  : "text-brand-text"
              }`}
            >
              Bảo mật
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full p-3 rounded-xl border border-brand-border bg-code-bg text-brand-h"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full p-3 rounded-xl border border-brand-border bg-code-bg text-brand-h"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Họ tên đầy đủ
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, full_name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Địa chỉ
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
              >
                {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
              >
                {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;