"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Loader2,
  ShieldCheck,
  Users,
  UserCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Ban,
  MessageCircle,
  Briefcase,
  Scale,
  User,
  Mail,
  Phone,
  Filter,
  AlertCircle,
  X,
  Send,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const statusOptions = [
  "all",
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "blocked",
];

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
  } catch (error) {
    console.error("Auth parse error:", error);
  }

  return { user, token };
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoneyRange = (post) => {
  const min = Number(post?.budgetMin || 0);
  const max = Number(post?.budgetMax || 0);

  if (!min && !max) return "-";

  const formatter = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  });

  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
  if (min) return `From ${formatter.format(min)}`;
  return `Up to ${formatter.format(max)}`;
};

const getStatusClasses = (status) => {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "blocked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClasses(
      status
    )}`}
  >
    {status || "-"}
  </span>
);

const RoleBadge = ({ role }) => {
  const className =
    role === "lawyer"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : role === "client"
      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${className}`}
    >
      {role || "-"}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, tone = "cyan" }) => {
  const toneClass = {
    cyan: "bg-cyan-600 shadow-cyan-100",
    emerald: "bg-emerald-600 shadow-emerald-100",
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-600 shadow-rose-100",
    slate: "bg-slate-900 shadow-slate-100",
    violet: "bg-violet-600 shadow-violet-100",
  };

  return (
    <motion.div
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${toneClass[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

const getUserName = (user) => user?.name || "Unknown user";
const getUserEmail = (user) => user?.email || "-";

export default function AdminConnectionsDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [contactDetails, setContactDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState("");
  const [postFilter, setPostFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const [editModal, setEditModal] = useState({
    open: false,
    connection: null,
    status: "",
    responseMessage: "",
  });

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const filteredConnections = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return connections;

    return connections.filter((connection) => {
      const clientName = connection.client?.name?.toLowerCase() || "";
      const clientEmail = connection.client?.email?.toLowerCase() || "";
      const lawyerName = connection.lawyer?.name?.toLowerCase() || "";
      const lawyerEmail = connection.lawyer?.email?.toLowerCase() || "";
      const postTitle = connection.post?.title?.toLowerCase() || "";
      const requestMessage = connection.requestMessage?.toLowerCase() || "";

      return (
        clientName.includes(term) ||
        clientEmail.includes(term) ||
        lawyerName.includes(term) ||
        lawyerEmail.includes(term) ||
        postTitle.includes(term) ||
        requestMessage.includes(term)
      );
    });
  }, [connections, search]);

  const proposalRows = useMemo(() => {
    const map = new Map();

    connections.forEach((connection) => {
      const requestedByRole = connection.requestedBy?.role;
      const isLawyerProposal =
        requestedByRole === "lawyer" ||
        String(connection.requestedBy?._id || connection.requestedBy) ===
          String(connection.lawyer?._id || connection.lawyer);

      if (!isLawyerProposal) return;

      const lawyerId = connection.lawyer?._id || connection.lawyer;
      const clientId = connection.client?._id || connection.client;
      const key = `${lawyerId}-${clientId}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          lawyer: connection.lawyer,
          client: connection.client,
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          latestAt: connection.createdAt,
        });
      }

      const item = map.get(key);

      item.total += 1;

      if (connection.status === "pending") item.pending += 1;
      if (connection.status === "accepted") item.accepted += 1;
      if (connection.status === "rejected") item.rejected += 1;

      if (new Date(connection.createdAt) > new Date(item.latestAt)) {
        item.latestAt = connection.createdAt;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latestAt) - new Date(a.latestAt)
    );
  }, [connections]);

  const stats = useMemo(() => {
    const totalConnections = connections.length;
    const pending = connections.filter((item) => item.status === "pending").length;
    const accepted = connections.filter((item) => item.status === "accepted").length;
    const rejected = connections.filter((item) => item.status === "rejected").length;
    const blocked = connections.filter((item) => item.status === "blocked").length;

    const lawyerSentProposals = connections.filter((connection) => {
      return (
        connection.requestedBy?.role === "lawyer" ||
        String(connection.requestedBy?._id || connection.requestedBy) ===
          String(connection.lawyer?._id || connection.lawyer)
      );
    }).length;

    const clientSentRequests = connections.filter((connection) => {
      return (
        connection.requestedBy?.role === "client" ||
        String(connection.requestedBy?._id || connection.requestedBy) ===
          String(connection.client?._id || connection.client)
      );
    }).length;

    const activeChats = connections.filter(
      (item) => item.status === "accepted" && item.messages?.length > 0
    ).length;

    return {
      totalConnections,
      pending,
      accepted,
      rejected,
      blocked,
      lawyerSentProposals,
      clientSentRequests,
      activeChats,
    };
  }, [connections]);

  const totalPages = useMemo(() => {
    return Math.max(Math.ceil(total / limit), 1);
  }, [total, limit]);

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (status !== "all") {
      params.set("status", status);
    }

    if (clientFilter.trim()) {
      params.set("client", clientFilter.trim());
    }

    if (lawyerFilter.trim()) {
      params.set("lawyer", lawyerFilter.trim());
    }

    if (postFilter.trim()) {
      params.set("post", postFilter.trim());
    }

    return params.toString();
  }, [page, limit, status, clientFilter, lawyerFilter, postFilter]);

  const fetchConnections = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoading(true);
      setError("");

      const query = buildQuery();

      const res = await fetch(`${API_BASE_URL}/connections/my?${query}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to fetch connections");
      }

      setConnections(data.data || []);
      setTotal(Number(data.total || 0));
    } catch (err) {
      setError(err.message || "Failed to fetch connections");
      setConnections([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, authHeaders, buildQuery]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const fetchConnectionDetails = async (connectionId) => {
    if (!connectionId) return;

    try {
      setDetailLoading(true);
      setContactDetails(null);
      setError("");

      const res = await fetch(`${API_BASE_URL}/connections/${connectionId}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to fetch connection details");
      }

      setSelectedConnection(data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch connection details");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchContactDetails = async (connectionId) => {
    if (!connectionId) return;

    try {
      setContactLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/connections/${connectionId}/contact`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to fetch contact details");
      }

      setContactDetails(data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch contact details");
    } finally {
      setContactLoading(false);
    }
  };

  const openEditModal = (connection) => {
    clearAlerts();

    setEditModal({
      open: true,
      connection,
      status: connection.status || "pending",
      responseMessage: connection.responseMessage || "",
    });
  };

  const closeEditModal = () => {
    if (actionLoadingId) return;

    setEditModal({
      open: false,
      connection: null,
      status: "",
      responseMessage: "",
    });
  };

  const updateConnectionStatus = async () => {
    const connection = editModal.connection;

    if (!connection?._id) return;

    try {
      setActionLoadingId(connection._id);
      clearAlerts();

      const res = await fetch(
        `${API_BASE_URL}/connections/admin/${connection._id}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            status: editModal.status,
            responseMessage: editModal.responseMessage,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to update connection");
      }

      setMessage(data.message || "Connection updated successfully");
      closeEditModal();

      await fetchConnections();

      if (selectedConnection?._id === connection._id) {
        await fetchConnectionDetails(connection._id);
      }
    } catch (err) {
      setError(err.message || "Failed to update connection");
    } finally {
      setActionLoadingId("");
    }
  };

  const deleteConnection = async (connection) => {
    const confirmed = window.confirm(
      `Delete connection between ${getUserName(connection.client)} and ${getUserName(
        connection.lawyer
      )}?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(connection._id);
      clearAlerts();

      const res = await fetch(
        `${API_BASE_URL}/connections/admin/${connection._id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to delete connection");
      }

      setMessage(data.message || "Connection deleted successfully");
      setConnections((prev) => prev.filter((item) => item._id !== connection._id));

      if (selectedConnection?._id === connection._id) {
        setSelectedConnection(null);
      }
    } catch (err) {
      setError(err.message || "Failed to delete connection");
    } finally {
      setActionLoadingId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setClientFilter("");
    setLawyerFilter("");
    setPostFilter("");
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 pt-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Login token paoa jai nai. Please abar login koro.
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 pt-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Current user data paoa jai nai. Please abar login koro.
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 pt-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Forbidden: Only admin can manage connections.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/70 via-slate-50 to-white p-4 pt-24 sm:p-6 sm:pt-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Admin Connection Vision
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              Client-Lawyer Connections
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              See every client-lawyer connection, proposal direction, post context,
              request status, messages, and contact details from one admin dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-cyan-100 bg-white/80 px-4 py-3 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-sm font-black text-white">
              {(authUser?.name || authUser?.email || "A")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">
                {authUser?.name || "Admin User"}
              </p>
              <p className="text-xs font-bold capitalize text-cyan-700">
                {authUser?.role || "admin"}
              </p>
            </div>
          </div>
        </motion.div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Loaded Connections"
            value={stats.totalConnections}
            icon={Users}
            tone="cyan"
          />
          <StatCard
            title="Accepted"
            value={stats.accepted}
            icon={CheckCircle2}
            tone="emerald"
          />
          <StatCard title="Pending" value={stats.pending} icon={Clock} tone="amber" />
          <StatCard
            title="Lawyer Proposals"
            value={stats.lawyerSentProposals}
            icon={Send}
            tone="violet"
          />
          <StatCard
            title="Client Requests"
            value={stats.clientSentRequests}
            icon={UserCheck}
            tone="cyan"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            tone="rose"
          />
          <StatCard title="Blocked" value={stats.blocked} icon={Ban} tone="slate" />
          <StatCard
            title="Active Chats"
            value={stats.activeChats}
            icon={MessageCircle}
            tone="emerald"
          />
        </div>

        <div className="mb-8 rounded-3xl border border-cyan-100 bg-white/90 p-5 shadow-xl backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
              <Filter className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Filter Connections
              </h2>
              <p className="text-sm text-slate-500">
                Search by client, lawyer, post title, email, or request message.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search loaded connections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <select
              value={status}
              onChange={handleStatusChange}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold capitalize text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Status" : item}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Client ID filter"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
            />

            <input
              type="text"
              value={lawyerFilter}
              onChange={(e) => {
                setLawyerFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Lawyer ID filter"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              value={postFilter}
              onChange={(e) => {
                setPostFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Post ID filter"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
            />

            <button
              onClick={fetchConnections}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-cyan-800"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-xl">
          <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-white px-5 py-5">
            <h2 className="text-xl font-black text-slate-950">
              Connections Table
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Total results from backend: {total}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-cyan-700">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm font-black">Loading connections...</span>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-100 bg-cyan-50">
                <Link2 className="h-7 w-7 text-cyan-700" />
              </div>
              <p className="text-lg font-black text-slate-900">
                No connections found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing filters or refresh the dashboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1450px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Lawyer</th>
                    <th className="px-5 py-4">Request From</th>
                    <th className="px-5 py-4">Post</th>
                    <th className="px-5 py-4">Budget</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Messages</th>
                    <th className="px-5 py-4">Requested</th>
                    <th className="px-5 py-4">Last Message</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredConnections.map((connection) => {
                    const requestedByRole =
                      connection.requestedBy?.role ||
                      (String(connection.requestedBy?._id || connection.requestedBy) ===
                      String(connection.lawyer?._id || connection.lawyer)
                        ? "lawyer"
                        : "client");

                    return (
                      <tr
                        key={connection._id}
                        className="transition hover:bg-cyan-50/40"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {getUserName(connection.client)}
                          </p>
                          <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-500">
                            {getUserEmail(connection.client)}
                          </p>
                          <div className="mt-2">
                            <RoleBadge role="client" />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {getUserName(connection.lawyer)}
                          </p>
                          <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-500">
                            {getUserEmail(connection.lawyer)}
                          </p>
                          <div className="mt-2">
                            <RoleBadge role="lawyer" />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-900">
                            {connection.requestedBy?.name || "-"}
                          </p>
                          <div className="mt-2">
                            <RoleBadge role={requestedByRole} />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            {requestedByRole === "lawyer"
                              ? "Lawyer proposal to client"
                              : "Client request to lawyer"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[240px] truncate text-sm font-black text-slate-950">
                            {connection.post?.title || "-"}
                          </p>
                          <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
                            {connection.post?.category || "-"} ·{" "}
                            {connection.post?.status || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-700">
                            {formatMoneyRange(connection.post)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={connection.status} />
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-950">
                            {connection.messages?.length || 0}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {formatDateTime(connection.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {formatDateTime(connection.lastMessageAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => fetchConnectionDetails(connection._id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:bg-cyan-100"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>

                            <button
                              onClick={() => openEditModal(connection)}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Status
                            </button>

                            <button
                              onClick={() => deleteConnection(connection)}
                              disabled={actionLoadingId === connection._id}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              {actionLoadingId === connection._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
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
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-100 bg-slate-50 px-5 py-4">
            <p className="text-sm font-bold text-slate-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl">
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-5 py-5">
            <h2 className="text-xl font-black text-slate-950">
              Lawyer Proposal Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Shows how many proposals each lawyer sent to each client from the
              loaded connections.
            </p>
          </div>

          {proposalRows.length === 0 ? (
            <div className="p-8 text-sm font-bold text-slate-500">
              No lawyer-to-client proposals found in the loaded data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Lawyer</th>
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Total Proposals</th>
                    <th className="px-5 py-4">Pending</th>
                    <th className="px-5 py-4">Accepted</th>
                    <th className="px-5 py-4">Rejected</th>
                    <th className="px-5 py-4">Latest Proposal</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {proposalRows.map((row) => (
                    <tr key={row.key} className="hover:bg-violet-50/40">
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {getUserName(row.lawyer)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {getUserEmail(row.lawyer)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {getUserName(row.client)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {getUserEmail(row.client)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-black text-slate-950">
                        {row.total}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-amber-700">
                        {row.pending}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-emerald-700">
                        {row.accepted}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-rose-700">
                        {row.rejected}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatDateTime(row.latestAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedConnection && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Connection Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Client-lawyer pair, post, proposal, status, messages and contact.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnection(null);
                    setContactDetails(null);
                  }}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center p-12 text-cyan-700">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="text-sm font-black">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-[800px] w-full">
                      <tbody className="divide-y divide-slate-200">
                        <DetailRow
                          label="Client"
                          value={
                            <UserBlock
                              icon={<User className="h-4 w-4" />}
                              user={selectedConnection.client}
                              role="client"
                            />
                          }
                        />
                        <DetailRow
                          label="Lawyer"
                          value={
                            <UserBlock
                              icon={<Scale className="h-4 w-4" />}
                              user={selectedConnection.lawyer}
                              role="lawyer"
                            />
                          }
                        />
                        <DetailRow
                          label="Requested By"
                          value={
                            <div>
                              <p className="font-black">
                                {selectedConnection.requestedBy?.name || "-"}
                              </p>
                              <div className="mt-2">
                                <RoleBadge role={selectedConnection.requestedBy?.role} />
                              </div>
                            </div>
                          }
                        />
                        <DetailRow
                          label="Post"
                          value={
                            <div>
                              <p className="font-black">
                                {selectedConnection.post?.title || "-"}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {selectedConnection.post?.category || "-"} ·{" "}
                                {selectedConnection.post?.status || "-"} ·{" "}
                                {formatMoneyRange(selectedConnection.post)}
                              </p>
                            </div>
                          }
                        />
                        <DetailRow
                          label="Status"
                          value={<StatusBadge status={selectedConnection.status} />}
                        />
                        <DetailRow
                          label="Request Message"
                          value={selectedConnection.requestMessage || "-"}
                        />
                        <DetailRow
                          label="Response Message"
                          value={selectedConnection.responseMessage || "-"}
                        />
                        <DetailRow
                          label="Created At"
                          value={formatDateTime(selectedConnection.createdAt)}
                        />
                        <DetailRow
                          label="Accepted At"
                          value={formatDateTime(selectedConnection.acceptedAt)}
                        />
                        <DetailRow
                          label="Last Message At"
                          value={formatDateTime(selectedConnection.lastMessageAt)}
                        />
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => fetchContactDetails(selectedConnection._id)}
                      disabled={contactLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
                    >
                      {contactLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      Load Contact Details
                    </button>

                    <button
                      onClick={() => openEditModal(selectedConnection)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Change Status
                    </button>
                  </div>

                  {contactDetails && (
                    <div className="overflow-hidden rounded-2xl border border-emerald-100">
                      <div className="bg-emerald-50 px-5 py-4">
                        <h4 className="text-lg font-black text-emerald-800">
                          Contact Details
                        </h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full">
                          <tbody className="divide-y divide-slate-200">
                            <DetailRow
                              label="Client Contact"
                              value={
                                <ContactBlock person={contactDetails.client} />
                              }
                            />
                            <DetailRow
                              label="Lawyer Contact"
                              value={
                                <ContactBlock person={contactDetails.lawyer} lawyer />
                              }
                            />
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="bg-slate-50 px-5 py-4">
                      <h4 className="text-lg font-black text-slate-950">
                        Messages ({selectedConnection.messages?.length || 0})
                      </h4>
                    </div>

                    {!selectedConnection.messages?.length ? (
                      <div className="p-5 text-sm font-bold text-slate-500">
                        No messages in this connection yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                              <th className="px-5 py-4">Sender</th>
                              <th className="px-5 py-4">Message</th>
                              <th className="px-5 py-4">Attachments</th>
                              <th className="px-5 py-4">Read Count</th>
                              <th className="px-5 py-4">Sent At</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {selectedConnection.messages.map((item) => (
                              <tr key={item._id} className="hover:bg-slate-50">
                                <td className="px-5 py-4">
                                  <p className="text-sm font-black text-slate-950">
                                    {item.sender?.name || "-"}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {item.sender?.role || "-"}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="max-w-[360px] text-sm font-semibold leading-6 text-slate-700">
                                    {item.message}
                                  </p>
                                </td>

                                <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                  {item.attachments?.length || 0}
                                </td>

                                <td className="px-5 py-4 text-sm font-bold text-slate-700">
                                  {item.readBy?.length || 0}
                                </td>

                                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                  {formatDateTime(item.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModal.open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl rounded-[28px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-xl font-black text-slate-950">
                  Update Connection Status
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Change pending, accepted, rejected, cancelled or blocked status.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Status
                  </label>

                  <select
                    value={editModal.status}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold capitalize text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Response Message
                  </label>

                  <textarea
                    rows={4}
                    value={editModal.responseMessage}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        responseMessage: e.target.value,
                      }))
                    }
                    placeholder="Optional admin response message..."
                    className="w-full resize-none rounded-2xl border border-slate-300 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeEditModal}
                    disabled={Boolean(actionLoadingId)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={updateConnectionStatus}
                    disabled={Boolean(actionLoadingId)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                  >
                    {actionLoadingId && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <tr className="bg-white even:bg-slate-50">
      <td className="w-[260px] border-r border-slate-200 px-5 py-4 text-sm font-black text-slate-600">
        {label}
      </td>
      <td className="px-5 py-4 text-sm font-bold text-slate-950">
        {value || "-"}
      </td>
    </tr>
  );
}

function UserBlock({ user, role, icon }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-black text-slate-950">
        {icon}
        {user?.name || "Unknown user"}
      </p>
      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Mail className="h-3.5 w-3.5" />
        {user?.email || "-"}
      </p>
      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Phone className="h-3.5 w-3.5" />
        {user?.phone || "-"}
      </p>
      <div className="mt-2">
        <RoleBadge role={role || user?.role} />
      </div>
    </div>
  );
}

function ContactBlock({ person, lawyer = false }) {
  return (
    <div>
      <p className="font-black text-slate-950">{person?.name || "-"}</p>
      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Mail className="h-3.5 w-3.5" />
        {person?.email || "-"}
      </p>
      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Phone className="h-3.5 w-3.5" />
        {person?.phone || "-"}
      </p>
      {lawyer && (
        <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Briefcase className="h-3.5 w-3.5" />
          Law Reg: {person?.lawRegNumber || "-"}
        </p>
      )}
    </div>
  );
}