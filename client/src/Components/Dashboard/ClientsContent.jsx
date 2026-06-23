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
  FiCheckCircle,
  FiAlertTriangle,
  FiPlus,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const initialClientForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const initialEditForm = {
  name: "",
  email: "",
  phone: "",
  subscriptionStatus: "inactive",
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
  if (!cleanName) return "C";

  const parts = cleanName.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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

const ClientAvatar = ({ client }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-black tracking-wide text-white shadow-sm shadow-cyan-100">
    {getInitials(client?.name)}
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

const ClientCreateModal = ({
  isOpen,
  form,
  setForm,
  onClose,
  onSubmit,
  creating,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
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
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Create Client
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add a new client account.
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
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Client name"
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
                  {creating ? "Creating..." : "Create Client"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ClientEditModal = ({
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
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Edit Client
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update client profile and account details.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
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
                  placeholder="Client name"
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
                  disabled={submitting}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
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

const DeleteConfirmModal = ({ isOpen, client, onClose, onConfirm, deleting }) => (
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
            Delete client?
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-900">
              {client?.name || "this client"}
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

const ClientsContent = () => {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  });

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialClientForm);

  const [editingClientId, setEditingClientId] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteClient, setSelectedDeleteClient] = useState(null);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((client) => client.subscriptionStatus === "active")
        .length,
      verified: clients.filter((client) => Boolean(client.phoneVerified)).length,
    }),
    [clients]
  );

  const buildParams = useCallback(
    (cursor = null) => {
      const params = {
        limit: 20,
        role: "client",
      };

      if (cursor) params.cursor = cursor;

      if (subscriptionFilter !== "all") {
        params.subscriptionStatus = subscriptionFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      return params;
    },
    [subscriptionFilter, searchTerm]
  );

  const fetchClients = useCallback(
    async ({ append = false, cursor = null } = {}) => {
      if (!token || !isAdmin) return;

      try {
        append ? setLoadingMore(true) : setLoading(true);

        const res = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: buildParams(cursor),
        });

        const nextClients = res.data?.data || [];

        setClients((prev) =>
          append ? [...prev, ...nextClients] : nextClients
        );

        setMeta(
          res.data?.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load clients");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [token, isAdmin, buildParams]
  );

  useEffect(() => {
    fetchClients({ append: false });
  }, [fetchClients]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const delaySearch = setTimeout(() => {
      fetchClients({ append: false });
    }, 450);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, subscriptionFilter, token, isAdmin, fetchClients]);

  const handleRefresh = () => {
    fetchClients({ append: false });
    toast.success("Clients refreshed");
  };

  const handleLoadMore = () => {
    if (!meta?.hasNextPage || !meta?.nextCursor) return;
    fetchClients({ append: true, cursor: meta.nextCursor });
  };

  const openCreateModal = () => {
    setCreateForm(initialClientForm);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateForm(initialClientForm);
  };

  const validateCreateForm = () => {
    if (!createForm.name.trim()) return "Name is required";
    if (!createForm.email.trim()) return "Email is required";
    if (!createForm.phone.trim()) return "Phone is required";
    if (!createForm.password.trim()) return "Password is required";
    return "";
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    const validationMessage = validateCreateForm();
    if (validationMessage) return toast.error(validationMessage);

    try {
      setCreating(true);

      await axios.post(
        `${API_BASE_URL}/users/register/client`,
        {
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          phone: createForm.phone.trim(),
          password: createForm.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Client created successfully");
      closeCreateModal();
      fetchClients({ append: false });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create client");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (client) => {
    setEditingClientId(getUserId(client));

    setEditForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      subscriptionStatus: client.subscriptionStatus || "inactive",
      phoneVerified: Boolean(client.phoneVerified),
      password: "",
    });

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingClientId("");
    setEditForm(initialEditForm);
  };

  const validateEditForm = () => {
    if (!editForm.name.trim()) return "Name is required";
    if (!editForm.email.trim()) return "Email is required";
    if (!editForm.phone.trim()) return "Phone is required";
    return "";
  };

  const buildUpdatePayload = () => {
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      phone: editForm.phone.trim(),
      role: "client",
      subscriptionStatus: editForm.subscriptionStatus,
      phoneVerified: Boolean(editForm.phoneVerified),
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password;
    }

    return payload;
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();

    const validationMessage = validateEditForm();
    if (validationMessage) return toast.error(validationMessage);

    try {
      setSubmitting(true);

      await axios.put(
        `${API_BASE_URL}/users/${editingClientId}`,
        buildUpdatePayload(),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Client updated successfully");
      closeEditModal();
      fetchClients({ append: false });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (client) => {
    const clientId = getUserId(client);

    if (!clientId) return toast.error("Client not found");

    if (clientId === getUserId(authUser)) {
      return toast.error("You cannot delete your own account");
    }

    setSelectedDeleteClient(client);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedDeleteClient(null);
  };

  const confirmDeleteClient = async () => {
    const clientId = getUserId(selectedDeleteClient);
    if (!clientId) return;

    try {
      setDeletingId(clientId);

      await axios.delete(`${API_BASE_URL}/users/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClients((prev) =>
        prev.filter((item) => getUserId(item) !== clientId)
      );

      toast.success("Client deleted successfully");
      closeDeleteModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete client");
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
              Only admins can manage clients.
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
                  Clients Management
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Create, search, filter, edit, and manage client accounts from one clean panel.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Create Client
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

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_190px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by client name, email or phone..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />

                {loading && (
                  <FiLoader className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-600" />
                )}
              </div>

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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard title="Total Clients" value={stats.total} icon={FiUsers} />
            <StatCard title="Active Plans" value={stats.active} icon={FiCheckCircle} />
            <StatCard title="Phone Verified" value={stats.verified} icon={FiCheckCircle} />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  All Clients
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Only users with client role are shown here.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading clients...
                </div>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-black text-slate-700">
                  No clients found
                </p>
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
                        <th className="px-4">Client</th>
                        <th className="px-4">Phone</th>
                        <th className="px-4">Plan</th>
                        <th className="px-4">Verified</th>
                        <th className="px-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {clients.map((client) => {
                        const clientId = getUserId(client);

                        return (
                          <tr
                            key={clientId}
                            className="bg-white shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 hover:shadow-md"
                          >
                            <td className="rounded-l-3xl px-4 py-4">
                              <div className="flex items-center gap-3">
                                <ClientAvatar client={client} />

                                <div>
                                  <p className="font-black text-slate-900">
                                    {client.name || "No name"}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {client.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                              {client.phone || "-"}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusBadgeClass(
                                  client.subscriptionStatus
                                )}`}
                              >
                                {client.subscriptionStatus || "inactive"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  client.phoneVerified
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                }`}
                              >
                                {client.phoneVerified ? "Yes" : "No"}
                              </span>
                            </td>

                            <td className="rounded-r-3xl px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(client)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(client)}
                                  disabled={deletingId === clientId}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                                >
                                  {deletingId === clientId ? (
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
                  {clients.map((client) => {
                    const clientId = getUserId(client);

                    return (
                      <div
                        key={clientId}
                        className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <ClientAvatar client={client} />

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900">
                              {client.name || "No name"}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                              {client.email}
                            </p>
                          </div>

                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black capitalize text-cyan-700 ring-1 ring-cyan-100">
                            Client
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">
                              Phone
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-800">
                              {client.phone || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">
                              Plan
                            </p>
                            <p className="mt-1 text-sm font-black capitalize text-slate-800">
                              {client.subscriptionStatus || "inactive"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">
                              Verified
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-800">
                              {client.phoneVerified ? "Yes" : "No"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <p className="text-xs font-bold text-slate-500">
                              Role
                            </p>
                            <p className="mt-1 text-sm font-black capitalize text-slate-800">
                              Client
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white"
                          >
                            <FiEdit2 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(client)}
                            disabled={deletingId === clientId}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-600 disabled:opacity-60"
                          >
                            {deletingId === clientId ? (
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

      <ClientCreateModal
        isOpen={createModalOpen}
        form={createForm}
        setForm={setCreateForm}
        onClose={closeCreateModal}
        onSubmit={handleCreateClient}
        creating={creating}
      />

      <ClientEditModal
        isOpen={editModalOpen}
        form={editForm}
        setForm={setEditForm}
        onClose={closeEditModal}
        onSubmit={handleUpdateClient}
        submitting={submitting}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        client={selectedDeleteClient}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteClient}
        deleting={Boolean(deletingId)}
      />
    </>
  );
};

export default ClientsContent;