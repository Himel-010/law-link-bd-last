"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { restoreUser } from "../../Redux/UserSlice/UserSlice";

const API_BASE_URL = "http://localhost:4000/api";

const getStoredAuth = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  let user = null;
  let token = "";

  try {
    if (localUser || sessionUser) {
      user = JSON.parse(localUser || sessionUser);
    }

    token = localToken || sessionToken || "";
  } catch (error) {
    console.error("Failed to parse stored auth:", error);
  }

  return { user, token };
};

const getUserId = (user) => {
  return user?._id || user?.id || "";
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (!parts.length) return "A";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "A";

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const SettingsContent = () => {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.user.currentUser);

  const fileInputRef = useRef(null);

  const [token, setToken] = useState("");
  const [adminUser, setAdminUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adminId = useMemo(() => getUserId(adminUser), [adminUser]);

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
    const storedAuth = getStoredAuth();

    setToken(storedAuth.token);

    if (reduxUser) {
      setAdminUser(reduxUser);
      return;
    }

    if (storedAuth.user) {
      setAdminUser(storedAuth.user);
      dispatch(restoreUser(storedAuth.user));
    }
  }, [reduxUser, dispatch]);

  useEffect(() => {
    if (!adminUser) return;

    setFormData({
      name: adminUser?.name || "",
      email: adminUser?.email || "",
      phone: adminUser?.phone || "",
    });

    setProfilePreview(adminUser?.profileImage || "");
  }, [adminUser]);

  const fetchAdminProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: authHeaders,
        withCredentials: true,
      });

      const userData = res.data?.data;

      if (userData) {
        setAdminUser(userData);
        dispatch(restoreUser(userData));

        localStorage.setItem("currentUser", JSON.stringify(userData));
        sessionStorage.setItem("currentUser", JSON.stringify(userData));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setProfileImageFile(file);
    setProfilePreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!adminId) {
      setError("Admin account not found.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = new FormData();

      payload.append("name", formData.name.trim());

      if (formData.phone.trim()) {
        payload.append("phone", formData.phone.trim());
      }

      if (profileImageFile) {
        payload.append("profileImage", profileImageFile);
      }

      const res = await axios.put(`${API_BASE_URL}/users/${adminId}`, payload, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      const updatedUser = res.data?.data;

      if (updatedUser) {
        setAdminUser(updatedUser);
        setProfileImageFile(null);
        setProfilePreview(updatedUser?.profileImage || "");

        dispatch(restoreUser(updatedUser));
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }

      setSuccess(res.data?.message || "Admin profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          Loading admin settings...
        </div>
      </div>
    );
  }

  if (!adminUser || adminUser?.role !== "admin") {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="text-lg font-bold">Access denied</h3>
            <p className="mt-1 text-sm font-medium">
              Only admin accounts can manage admin settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Account
            </div>

            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              Account Settings
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage your admin name, phone number, and profile image.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {(error || success) && (
          <div className="mt-6">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {success}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Full Name
            </label>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="Enter admin name"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Email Address
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                name="email"
                value={formData.email}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 pl-11 text-sm font-semibold text-slate-500 outline-none"
                placeholder="Admin email"
              />
            </div>

            <p className="mt-2 text-xs font-medium text-slate-400">
              Email is shown from your account and is not editable here.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Phone
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="+880 1XXX-XXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Role
            </label>

            <input
              value={adminUser?.role || "admin"}
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold capitalize text-slate-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900">Profile Image</h3>
        <p className="mt-1 text-sm text-slate-500">
          Upload or update your admin profile photo.
        </p>

        <div className="mt-6 flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="relative">
            {profilePreview ? (
              <img
                src={profilePreview}
                alt={adminUser?.name || "Admin"}
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-slate-800 to-slate-950 text-3xl font-black text-white shadow-md">
                {getInitials(adminUser?.name)}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-white shadow-lg transition hover:scale-105"
            >
              <Camera className="h-4 w-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <h4 className="mt-4 max-w-full truncate text-lg font-bold text-slate-900">
            {adminUser?.name || "Admin User"}
          </h4>

          <p className="mt-1 max-w-full truncate text-sm text-slate-500">
            {adminUser?.email}
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <Camera className="h-4 w-4" />
            Choose Image
          </button>

          {profileImageFile && (
            <p className="mt-3 max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Selected: {profileImageFile.name}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-800">Account Status</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Role</span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold capitalize text-white">
              {adminUser?.role || "admin"}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Phone</span>
            <span className="text-sm font-semibold text-slate-800">
              {adminUser?.phone || "Not added"}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SettingsContent;