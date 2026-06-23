import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaIdCard,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaSave,
  FaLock,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaCamera,
  FaTrashAlt,
} from "react-icons/fa";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=e5e7eb&color=111827&size=256";

const UserSettings = () => {
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nid: "",
    lawRegNumber: "",
    phoneVerified: 0,
    role: "client",
    profileImage: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (storedUser) {
      const userImage =
        storedUser.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          storedUser.name || "User"
        )}&background=e5e7eb&color=111827&size=256`;

      setFormData({
        name: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.phone || "",
        nid: storedUser.nid || "",
        lawRegNumber: storedUser.lawRegNumber || "",
        phoneVerified: storedUser.phoneVerified ?? 0,
        role: storedUser.role || "client",
        profileImage: storedUser.profileImage || "",
      });

      setPreviewImage(userImage);
    }
  }, [storedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phoneVerified" ? Number(value) : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setPreviewImage(imageUrl);
    setError("");
    setMessage("New profile image selected ✅");
  };

  const removeSelectedImage = () => {
    const fallback =
      formData.name?.trim()
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
            formData.name
          )}&background=e5e7eb&color=111827&size=256`
        : DEFAULT_AVATAR;

    setSelectedImageFile(null);
    setPreviewImage(fallback);

    setFormData((prev) => ({
      ...prev,
      profileImage: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getRoleIcon = (role) => {
    if (role === "admin") return <FaUserShield className="text-red-500" />;
    if (role === "lawyer") return <FaUserTie className="text-amber-500" />;
    return <FaUser className="text-sky-500" />;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!storedUser?._id) {
        throw new Error("User ID not found. Please login again.");
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.role === "lawyer") {
        payload.nid = formData.nid;
        payload.lawRegNumber = formData.lawRegNumber;
        payload.phoneVerified = formData.phoneVerified;
      }

      // image upload backend না থাকলে demo হিসেবে base64 / preview save করতে পারো
      // production এ multer / cloudinary / storage use করা ভালো
      if (selectedImageFile) {
        payload.profileImage = previewImage;
      }

      const res = await fetch(
        `http://localhost:5000/api/users/${storedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Profile update failed");
      }

      const updatedUser = {
        ...storedUser,
        ...(data.user || data),
        profileImage: payload.profileImage || storedUser.profileImage || "",
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setFormData((prev) => ({
        ...prev,
        profileImage: updatedUser.profileImage || "",
      }));
      setMessage("Profile updated successfully ✅");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage("");
    setError("");

    try {
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        throw new Error("All password fields are required");
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters");
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New password and confirm password do not match");
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password section ready ✅ Backend route add korle fully kaj korbe.");
    } catch (err) {
      setError(err.message || "Password update failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Update your personal information, profile photo, and password.
          </p>
        </motion.div>

        {(message || error) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-2xl border px-4 py-3 ${
              error
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-600"
            }`}
          >
            {error || message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-1"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                  />

                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition"
                  >
                    <FaCamera size={14} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <FaCamera />
                    Change Photo
                  </button>

                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                  >
                    <FaTrashAlt />
                    Remove
                  </button>
                </div>

                <h2 className="text-2xl font-semibold mt-5">
                  {formData.name || "User"}
                </h2>
                <p className="text-gray-500 mt-1">{formData.email || "No email"}</p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm border border-gray-200">
                  {getRoleIcon(formData.role)}
                  <span className="capitalize text-gray-700">{formData.role}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <FaEnvelope className="text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium break-all text-gray-800">
                      {formData.email || "N/A"}
                    </p>
                  </div>
                </div>

                {formData.role !== "admin" && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <FaPhoneAlt className="text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">
                        {formData.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {formData.role === "lawyer" && (
                  <>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <FaIdCard className="text-amber-500" />
                      <div>
                        <p className="text-sm text-gray-500">NID</p>
                        <p className="font-medium text-gray-800">
                          {formData.nid || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <FaGavel className="text-violet-500" />
                      <div>
                        <p className="text-sm text-gray-500">Law Reg. Number</p>
                        <p className="font-medium text-gray-800">
                          {formData.lawRegNumber || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      {Number(formData.phoneVerified) === 1 ? (
                        <FaCheckCircle className="text-emerald-500" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Phone Verification</p>
                        <p className="font-medium text-gray-800">
                          {Number(formData.phoneVerified) === 1
                            ? "Verified"
                            : "Not Verified"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* EDIT PROFILE */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm"
            >
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                Edit Profile
              </h3>

              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    />
                  </div>

                  {formData.role !== "admin" && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      disabled
                      className="w-full rounded-2xl bg-gray-100 border border-gray-300 px-4 py-3 outline-none cursor-not-allowed capitalize text-gray-600"
                    />
                  </div>

                  {formData.role === "lawyer" && (
                    <>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          NID
                        </label>
                        <input
                          type="text"
                          name="nid"
                          value={formData.nid}
                          onChange={handleChange}
                          placeholder="Enter your NID"
                          className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Law Registration Number
                        </label>
                        <input
                          type="text"
                          name="lawRegNumber"
                          value={formData.lawRegNumber}
                          onChange={handleChange}
                          placeholder="Enter law registration number"
                          className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Phone Verification
                        </label>
                        <select
                          name="phoneVerified"
                          value={formData.phoneVerified}
                          onChange={handleChange}
                          className="w-full rounded-2xl bg-white border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                        >
                          <option value={0}>Not Verified</option>
                          <option value={1}>Verified</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition disabled:opacity-60"
                  >
                    <FaSave />
                    {loading ? "Saving..." : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* CHANGE PASSWORD */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm"
            >
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                Change Password
              </h3>

              <form onSubmit={handlePasswordUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Current password"
                        className="w-full rounded-2xl bg-white border border-gray-300 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="New password"
                        className="w-full rounded-2xl bg-white border border-gray-300 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm password"
                        className="w-full rounded-2xl bg-white border border-gray-300 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 hover:bg-black text-white px-6 py-3 font-medium transition disabled:opacity-60"
                  >
                    <FaLock />
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;