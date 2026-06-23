import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiLoader,
  FiX,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiCheckCircle,
  FiAlertTriangle,
  FiPlus,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const initialEditForm = {
  name: "",
  email: "",
  phone: "",
  nid: "",
  lawRegNumber: "",
  role: "client",
  subscriptionStatus: "inactive",
  phoneVerified: false,
  password: "",
};

const initialCreateForm = {
  name: "",
  email: "",
  phone: "",
  nid: "",
  lawRegNumber: "",
  role: "client",
  phoneVerified: false,
  password: "",
};

const getStoredAuth = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  let user = null;
  let token = "";

  try {
    if (localToken && localUser) {
      user = JSON.parse(localUser);
      token = localToken;
    } else if (sessionToken && sessionUser) {
      user = JSON.parse(sessionUser);
      token = sessionToken;
    }
  } catch {
    toast.error("Please login again.");
  }

  return { user, token };
};

const getUserId = (user) => user?._id || user?.id;

const getInitials = (name = "") => {
  const cleanName = name.trim();
  if (!cleanName) return "U";

  const parts = cleanName.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getRoleBadgeClass = (role) => {
  if (role === "admin") return "bg-cyan-700 text-white";
  if (role === "lawyer") {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  }
  return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
};

const getStatusBadgeClass = (status) => {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }
  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  }
  if (status === "expired") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
};

const UserAvatar = ({ user }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-black tracking-wide text-white shadow-sm shadow-cyan-100">
    {getInitials(user?.name)}
  </div>
);

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </h3>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const CreateUserModal = ({
  isOpen,
  form,
  setForm,
  onClose,
  onSubmit,
  creating,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Create User
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add a new client, lawyer, or admin account.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="client">Client</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="admin">Admin</option>
                </select>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Name"
                />

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Email"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={form.role === "admin" ? "Phone optional" : "Phone"}
                />

                {form.role === "lawyer" && (
                  <>
                    <input
                      name="nid"
                      value={form.nid}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="NID"
                    />

                    <input
                      name="lawRegNumber"
                      value={form.lawRegNumber}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Lawyer Registration"
                    />

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        name="phoneVerified"
                        checked={form.phoneVerified}
                        onChange={handleChange}
                      />
                      <span className="text-sm font-bold text-slate-700">
                        Phone verified
                      </span>
                    </label>
                  </>
                )}

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Password"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:bg-cyan-300"
                >
                  {creating && <FiLoader className="animate-spin" />}
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EditUserModal = ({
  isOpen,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit User</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update profile and account details.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Name"
                />

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Email"
                />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Phone"
                />

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="client">Client</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="admin">Admin</option>
                </select>

                <input
                  name="nid"
                  value={form.nid}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="NID"
                />

                <input
                  name="lawRegNumber"
                  value={form.lawRegNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Lawyer Registration"
                />

                <select
                  name="subscriptionStatus"
                  value={form.subscriptionStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="New Password"
                />

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    name="phoneVerified"
                    checked={form.phoneVerified}
                    onChange={handleChange}
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Phone verified
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:bg-cyan-300"
                >
                  {submitting && <FiLoader className="animate-spin" />}
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DeleteConfirmModal = ({ isOpen, user, onClose, onConfirm, deleting }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <FiAlertTriangle className="h-7 w-7" />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-900">
            Delete user?
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-900">
              {user?.name || "this user"}
            </span>
            ? This cannot be undone.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:bg-rose-300"
            >
              {deleting ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const UsersContent = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  });

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [editingUserId, setEditingUserId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialEditForm);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState(null);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const stats = useMemo(
    () => ({
      total: users.length,
      clients: users.filter((u) => u.role === "client").length,
      lawyers: users.filter((u) => u.role === "lawyer").length,
      active: users.filter((u) => u.subscriptionStatus === "active").length,
    }),
    [users]
  );

  const buildParams = useCallback(
    (cursor = null) => {
      const params = { limit: 20 };

      if (cursor) params.cursor = cursor;
      if (roleFilter !== "all") params.role = roleFilter;
      if (subscriptionFilter !== "all") {
        params.subscriptionStatus = subscriptionFilter;
      }
      if (searchTerm.trim()) params.search = searchTerm.trim();

      return params;
    },
    [roleFilter, subscriptionFilter, searchTerm]
  );

  const fetchUsers = useCallback(
    async ({ append = false, cursor = null } = {}) => {
      if (!token || !isAdmin) return;

      try {
        append ? setLoadingMore(true) : setLoading(true);

        const res = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: buildParams(cursor),
        });

        const nextUsers = res.data?.data || [];

        setUsers((prev) => (append ? [...prev, ...nextUsers] : nextUsers));

        setMeta(
          res.data?.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load users");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [token, isAdmin, buildParams]
  );

  useEffect(() => {
    fetchUsers({ append: false });
  }, [fetchUsers]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const delaySearch = setTimeout(() => {
      fetchUsers({ append: false });
    }, 450);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, roleFilter, subscriptionFilter, token, isAdmin, fetchUsers]);

  const handleRefresh = () => {
    fetchUsers({ append: false });
    toast.success("Users refreshed");
  };

  const handleLoadMore = () => {
    if (!meta?.hasNextPage || !meta?.nextCursor) return;
    fetchUsers({ append: true, cursor: meta.nextCursor });
  };

  const openCreateModal = () => {
    setCreateForm(initialCreateForm);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateForm(initialCreateForm);
  };

  const validateCreateForm = () => {
    if (!createForm.name.trim()) return "Name is required";
    if (!createForm.email.trim()) return "Email is required";
    if (!createForm.password.trim()) return "Password is required";

    if (createForm.role !== "admin" && !createForm.phone.trim()) {
      return "Phone is required";
    }

    if (createForm.role === "lawyer") {
      if (!createForm.nid.trim()) return "NID is required";
      if (!createForm.lawRegNumber.trim()) {
        return "Lawyer registration number is required";
      }
    }

    return "";
  };

  const buildCreateEndpoint = () => {
    if (createForm.role === "lawyer") {
      return `${API_BASE_URL}/users/register/lawyer`;
    }

    if (createForm.role === "admin") {
      return `${API_BASE_URL}/users/register/admin`;
    }

    return `${API_BASE_URL}/users/register/client`;
  };

  const buildCreatePayload = () => {
    const payload = {
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password,
    };

    if (createForm.phone.trim()) {
      payload.phone = createForm.phone.trim();
    }

    if (createForm.role === "lawyer") {
      payload.nid = createForm.nid.trim();
      payload.lawRegNumber = createForm.lawRegNumber.trim();
      payload.phoneVerified = createForm.phoneVerified ? 1 : 0;
    }

    return payload;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const validationMessage = validateCreateForm();
    if (validationMessage) return toast.error(validationMessage);

    try {
      setCreating(true);

      await axios.post(buildCreateEndpoint(), buildCreatePayload(), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("User created successfully");
      closeCreateModal();
      fetchUsers({ append: false });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUserId(getUserId(user));

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      nid: user.nid || "",
      lawRegNumber: user.lawRegNumber || "",
      role: user.role || "client",
      subscriptionStatus: user.subscriptionStatus || "inactive",
      phoneVerified: Boolean(user.phoneVerified),
      password: "",
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId("");
    setForm(initialEditForm);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.role) return "Role is required";
    return "";
  };

  const buildUpdatePayload = () => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      nid: form.nid.trim(),
      lawRegNumber: form.lawRegNumber.trim(),
      role: form.role,
      subscriptionStatus: form.subscriptionStatus,
      phoneVerified: Boolean(form.phoneVerified),
    };

    if (form.password.trim()) payload.password = form.password;
    return payload;
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) return toast.error(validationMessage);

    try {
      setSubmitting(true);

      await axios.put(`${API_BASE_URL}/users/${editingUserId}`, buildUpdatePayload(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("User updated successfully");
      closeModal();
      fetchUsers({ append: false });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (user) => {
    const userId = getUserId(user);

    if (!userId) return toast.error("User not found");

    if (userId === getUserId(authUser)) {
      return toast.error("You cannot delete your own account");
    }

    setSelectedDeleteUser(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedDeleteUser(null);
  };

  const confirmDeleteUser = async () => {
    const userId = getUserId(selectedDeleteUser);
    if (!userId) return;

    try {
      setDeletingId(userId);

      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((item) => getUserId(item) !== userId));
      toast.success("User deleted successfully");
      closeDeleteModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId("");
    }
  };

  if (!token || !authUser) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
          <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              Please login again
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your session has expired.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
          <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Access denied</h2>
            <p className="mt-2 text-sm text-slate-500">
              Only admins can manage users.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="space-y-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600">
                  Admin Dashboard
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  Users Management
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Create, search, filter, edit, and manage all user accounts from one clean panel.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Create User
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-60"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_170px_190px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
                {loading && (
                  <FiLoader className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-600" />
                )}
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">All Roles</option>
                <option value="client">Clients</option>
                <option value="lawyer">Lawyers</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="all">All Plans</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Users" value={stats.total} icon={FiUsers} />
            <StatCard title="Clients" value={stats.clients} icon={FiUser} />
            <StatCard title="Lawyers" value={stats.lawyers} icon={FiBriefcase} />
            <StatCard title="Active Plans" value={stats.active} icon={FiCheckCircle} />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">All Users</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Results update automatically while typing.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading users...
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-black text-slate-700">No users found</p>
                <p className="mt-1 text-xs text-slate-500">
                  Try another keyword or filter.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="px-4">User</th>
                        <th className="px-4">Phone</th>
                        <th className="px-4">Role</th>
                        <th className="px-4">Plan</th>
                        <th className="px-4">Verified</th>
                        <th className="px-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => {
                        const userId = getUserId(user);

                        return (
                          <tr
                            key={userId}
                            className="bg-white shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 hover:shadow-md"
                          >
                            <td className="rounded-l-3xl px-4 py-4">
                              <div className="flex items-center gap-3">
                                <UserAvatar user={user} />

                                <div>
                                  <p className="font-black text-slate-900">
                                    {user.name || "No name"}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {user.email}
                                  </p>

                                  {user.role === "lawyer" && user.lawRegNumber && (
                                    <p className="mt-1 text-xs font-semibold text-slate-400">
                                      Reg: {user.lawRegNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                              {user.phone || "-"}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getRoleBadgeClass(
                                  user.role
                                )}`}
                              >
                                {user.role || "client"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusBadgeClass(
                                  user.subscriptionStatus
                                )}`}
                              >
                                {user.subscriptionStatus || "inactive"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  user.phoneVerified
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                }`}
                              >
                                {user.phoneVerified ? "Yes" : "No"}
                              </span>
                            </td>

                            <td className="rounded-r-3xl px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(user)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(user)}
                                  disabled={deletingId === userId}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                                >
                                  {deletingId === userId ? (
                                    <FiLoader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FiTrash2 className="h-4 w-4" />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:hidden">
                  {users.map((user) => {
                    const userId = getUserId(user);

                    return (
                      <div
                        key={userId}
                        className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <UserAvatar user={user} />

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900">
                              {user.name || "No name"}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                              {user.email}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getRoleBadgeClass(
                              user.role
                            )}`}
                          >
                            {user.role || "client"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">Phone</p>
                            <p className="mt-1 text-sm font-black text-slate-800">
                              {user.phone || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">Role</p>
                            <p className="mt-1 text-sm font-black capitalize text-slate-800">
                              {user.role || "client"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">Plan</p>
                            <p className="mt-1 text-sm font-black capitalize text-slate-800">
                              {user.subscriptionStatus || "inactive"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">Verified</p>
                            <p className="mt-1 text-sm font-black text-slate-800">
                              {user.phoneVerified ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white"
                          >
                            <FiEdit2 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(user)}
                            disabled={deletingId === userId}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-600 disabled:opacity-60"
                          >
                            {deletingId === userId ? (
                              <FiLoader className="h-4 w-4 animate-spin" />
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {meta?.hasNextPage && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:text-slate-300"
                    >
                      {loadingMore && <FiLoader className="animate-spin" />}
                      {loadingMore ? "Loading more..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={createModalOpen}
        form={createForm}
        setForm={setCreateForm}
        onClose={closeCreateModal}
        onSubmit={handleCreateUser}
        creating={creating}
      />

      <EditUserModal
        isOpen={isModalOpen}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSubmit={handleUpdateUser}
        submitting={submitting}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        user={selectedDeleteUser}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        deleting={Boolean(deletingId)}
      />
    </>
  );
};

export default UsersContent;