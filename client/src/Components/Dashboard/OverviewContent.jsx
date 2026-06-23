"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGitPullRequest,
  FiLayers,
  FiLoader,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = "http://localhost:4000/api";

const CHART_COLORS = [
  "#06b6d4",
  "#8b5cf6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#64748b",
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

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-BD").format(Number(value || 0));
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

const formatTimeAgo = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hrs ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;

  return formatDateTime(value);
};

const formatCardValue = (item) => {
  if (item?.type === "currency") {
    return formatCurrency(item.value);
  }

  return formatNumber(item?.value);
};

const getChangeText = (change) => {
  if (change === null || change === undefined) return null;

  const numericChange = Number(change || 0);
  const prefix = numericChange > 0 ? "+" : "";

  return `${prefix}${numericChange}%`;
};

const getChangeClass = (change) => {
  const numericChange = Number(change || 0);

  if (numericChange > 0) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (numericChange < 0) return "text-rose-600 bg-rose-50 border-rose-100";

  return "text-slate-500 bg-slate-50 border-slate-100";
};

const getCardIcon = (key) => {
  const icons = {
    totalRevenue: FiDollarSign,
    totalUsers: FiUsers,
    openPosts: FiFileText,
    bidsProposals: FiGitPullRequest,
    connections: FiBriefcase,
    activeSubscriptions: FiLayers,
  };

  return icons[key] || FiBarChart2;
};

const getCardSoftStyle = (key) => {
  const styles = {
    totalRevenue: {
      icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
      glow: "bg-emerald-100/70",
    },
    totalUsers: {
      icon: "bg-cyan-50 text-cyan-600 border-cyan-100",
      glow: "bg-cyan-100/70",
    },
    openPosts: {
      icon: "bg-violet-50 text-violet-600 border-violet-100",
      glow: "bg-violet-100/70",
    },
    bidsProposals: {
      icon: "bg-amber-50 text-amber-600 border-amber-100",
      glow: "bg-amber-100/70",
    },
    connections: {
      icon: "bg-blue-50 text-blue-600 border-blue-100",
      glow: "bg-blue-100/70",
    },
    activeSubscriptions: {
      icon: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
      glow: "bg-fuchsia-100/70",
    },
  };

  return (
    styles[key] || {
      icon: "bg-slate-50 text-slate-600 border-slate-100",
      glow: "bg-slate-100/70",
    }
  );
};

const getStatusTone = (status) => {
  switch (status) {
    case "active":
    case "accepted":
    case "verified":
    case "closed":
    case "open":
      return "emerald";

    case "pending":
    case "in_progress":
      return "amber";

    case "rejected":
    case "cancelled":
    case "expired":
    case "refunded":
      return "rose";

    case "blocked":
      return "red";

    default:
      return "slate";
  }
};

const StatusPill = ({ children, tone = "slate" }) => {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    red: "border-red-200 bg-red-50 text-red-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${
        toneClass[tone] || toneClass.slate
      }`}
    >
      {String(children || "-").replaceAll("_", " ")}
    </span>
  );
};

const EmptyState = ({
  title = "No data found",
  description = "Nothing to show yet.",
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>
    </div>
  );
};

const OverviewCard = ({ item, index }) => {
  const Icon = getCardIcon(item.key);
  const changeText = getChangeText(item.change);
  const style = getCardSoftStyle(item.key);

  return (
    <motion.div
      key={item.key || item.title}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="h-full"
    >
      <div className="relative flex h-full min-h-[190px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-100 hover:shadow-xl">
        <div
          className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl ${style.glow}`}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500">{item.title}</p>

            <h3 className="mt-4 break-words text-3xl font-black tracking-tight text-slate-900">
              {formatCardValue(item)}
            </h3>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style.icon}`}
          >
            <Icon className="text-lg" />
          </div>
        </div>

        <div className="relative mt-auto pt-5">
          {changeText ? (
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getChangeClass(
                item.change
              )}`}
            >
              {changeText}
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-400">
              Live
            </span>
          )}

          <p className="mt-3 min-h-[18px] text-xs font-semibold text-slate-500">
            {item.description || "Live platform data"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-sm font-black text-slate-900">{label}</p>
      <p className="mt-1 text-sm font-semibold text-cyan-700">
        Value: {formatNumber(payload[0]?.value)}
      </p>
    </div>
  );
};

const BarChartCard = ({ title, subtitle, data = [] }) => {
  const hasData = data.some((item) => Number(item.value || 0) > 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600">
          <FiBarChart2 />
        </div>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 700 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 700 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`${entry.label}-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const PieChartCard = ({ title, subtitle, data = [] }) => {
  const hasData = data.some((item) => Number(item.value || 0) > 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600">
          <FiActivity />
        </div>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.label}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-sm font-bold text-slate-700">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-black text-slate-900">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RecentUserItem = ({ user }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-100 hover:bg-cyan-50/30">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-sm font-black text-cyan-700">
      {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
    </div>

    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-bold text-slate-900">
        {user?.name || "Unknown User"}
      </h4>
      <p className="truncate text-xs font-medium text-slate-500">
        {user?.email || "-"}
      </p>
    </div>

    <div className="text-right">
      <StatusPill tone={user?.role === "lawyer" ? "violet" : "cyan"}>
        {user?.role || "-"}
      </StatusPill>

      <p className="mt-2 text-xs font-medium text-slate-400">
        {formatTimeAgo(user?.createdAt)}
      </p>
    </div>
  </div>
);

const RecentPostItem = ({ post }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-100 hover:bg-violet-50/30">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h4 className="truncate text-base font-bold text-slate-900">
          {post?.title || "Untitled Post"}
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          {post?.client?.name || "Unknown Client"} · {post?.category || "-"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={getStatusTone(post?.status)}>
          {post?.status || "-"}
        </StatusPill>

        {post?.isPriority === 1 && <StatusPill tone="amber">Priority</StatusPill>}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
      <span>Urgency: {post?.urgency || "-"}</span>
      <span>•</span>
      <span>
        Budget: {formatCurrency(post?.budgetMin)} -{" "}
        {formatCurrency(post?.budgetMax)}
      </span>
      <span>•</span>
      <span>{formatTimeAgo(post?.createdAt)}</span>
    </div>
  </div>
);

const RecentPaymentItem = ({ payment }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
      <FiCreditCard />
    </div>

    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-bold text-slate-900">
        {payment?.user?.name || "Unknown User"}
      </h4>

      <p className="truncate text-xs font-medium text-slate-500">
        {payment?.planName || payment?.plan?.name || "-"} ·{" "}
        {payment?.method || "-"}
      </p>
    </div>

    <div className="text-right">
      <p className="text-sm font-black text-slate-900">
        {formatCurrency(payment?.amount)}
      </p>

      <div className="mt-2">
        <StatusPill tone={getStatusTone(payment?.paymentStatus)}>
          {payment?.paymentStatus || "-"}
        </StatusPill>
      </div>
    </div>
  </div>
);

const RecentConnectionItem = ({ connection }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-100 hover:bg-blue-50/30">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h4 className="truncate text-sm font-bold text-slate-900">
          {connection?.client?.name || "Client"} ↔{" "}
          {connection?.lawyer?.name || "Lawyer"}
        </h4>

        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {connection?.post?.title || "No post title"}
        </p>
      </div>

      <StatusPill tone={getStatusTone(connection?.status)}>
        {connection?.status || "-"}
      </StatusPill>
    </div>

    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
      {connection?.requestMessage || "No request message."}
    </p>

    <p className="mt-3 text-xs font-semibold text-slate-400">
      Requested by {connection?.requestedBy?.name || "-"} ·{" "}
      {formatTimeAgo(connection?.createdAt)}
    </p>
  </div>
);

const RecentSubscriptionItem = ({ subscription }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-fuchsia-100 hover:bg-fuchsia-50/30">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600">
      <FiLayers />
    </div>

    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-bold text-slate-900">
        {subscription?.user?.name || "Unknown User"}
      </h4>

      <p className="truncate text-xs font-medium text-slate-500">
        {subscription?.planName || subscription?.plan?.name || "-"} ·{" "}
        {subscription?.roleType || "-"}
      </p>
    </div>

    <div className="text-right">
      <p className="text-sm font-black text-slate-900">
        {formatCurrency(subscription?.price)}
      </p>

      <div className="mt-2">
        <StatusPill tone={getStatusTone(subscription?.status)}>
          {subscription?.status || "-"}
        </StatusPill>
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500">
        <Icon />
      </div>
    </div>

    {children}
  </div>
);

const OverviewContent = () => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

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

  const fetchOverview = useCallback(
    async ({ silent = false } = {}) => {
      if (!token || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const res = await fetch(`${API_BASE_URL}/admin/overview`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to fetch overview data");
        }

        setOverview(data.data || null);
      } catch (err) {
        setError(err.message || "Failed to fetch overview data");
        setOverview(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAdmin, authHeaders]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const cards = overview?.cards || [];
  const charts = overview?.charts || {};

  const recentUsers = overview?.recent?.users || [];
  const recentPosts = overview?.recent?.posts || [];
  const recentPayments = overview?.recent?.payments || [];
  const recentConnections = overview?.recent?.connections || [];
  const recentSubscriptions = overview?.recent?.subscriptions || [];

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
        Login token paoa jai nai. Please abar login koro.
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
        Current user data paoa jai nai. Please abar login koro.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
        Forbidden: Only admin can view overview dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <FiLoader className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Loading overview data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-b from-cyan-50/50 via-white to-white">
      <motion.div
        className="flex flex-col justify-between gap-4 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm lg:flex-row lg:items-center"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
            <FiActivity />
            Admin Live Overview
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Platform Overview
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Live summary of users, posts, bids, connections, subscriptions, and
            payments from your backend API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOverview({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {refreshing ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          Refresh
        </button>
      </motion.div>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="No overview cards found"
              description="The API did not return any card data."
            />
          </div>
        ) : (
          cards.map((item, index) => (
            <OverviewCard key={item.key || item.title} item={item} index={index} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PieChartCard
          title="Users By Role"
          subtitle="Client, lawyer, and admin distribution"
          data={charts.usersByRole || []}
        />

        <BarChartCard
          title="Posts By Status"
          subtitle="Current legal post status breakdown"
          data={charts.postsByStatus || []}
        />

        <BarChartCard
          title="Bids & Proposals"
          subtitle="Proposal status from post bids"
          data={charts.bidsByStatus || []}
        />

        <PieChartCard
          title="Connections By Status"
          subtitle="Client-lawyer connection lifecycle"
          data={charts.connectionsByStatus || []}
        />

        <BarChartCard
          title="Payments By Status"
          subtitle="Manual payment verification status"
          data={charts.paymentsByStatus || []}
        />

        <PieChartCard
          title="Subscriptions By Status"
          subtitle="Subscription lifecycle summary"
          data={charts.subscriptionsByStatus || []}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Users"
          subtitle="Latest registered platform users"
          icon={FiUsers}
        >
          <div className="space-y-4">
            {recentUsers.length === 0 ? (
              <EmptyState />
            ) : (
              recentUsers.map((user) => (
                <RecentUserItem key={user._id} user={user} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Posts"
          subtitle="Latest legal service posts"
          icon={FiFileText}
        >
          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <EmptyState />
            ) : (
              recentPosts.map((post) => (
                <RecentPostItem key={post._id} post={post} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Payments"
          subtitle="Latest manual payment records"
          icon={FiCreditCard}
        >
          <div className="space-y-4">
            {recentPayments.length === 0 ? (
              <EmptyState />
            ) : (
              recentPayments.map((payment) => (
                <RecentPaymentItem key={payment._id} payment={payment} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Connections"
          subtitle="Latest client-lawyer connection requests"
          icon={FiBriefcase}
        >
          <div className="space-y-4">
            {recentConnections.length === 0 ? (
              <EmptyState />
            ) : (
              recentConnections.map((connection) => (
                <RecentConnectionItem
                  key={connection._id}
                  connection={connection}
                />
              ))
            )}
          </div>
        </SectionCard>

        <div className="xl:col-span-2">
          <SectionCard
            title="Recent Subscriptions"
            subtitle="Latest user subscription activity"
            icon={FiCheckCircle}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {recentSubscriptions.length === 0 ? (
                <div className="lg:col-span-2">
                  <EmptyState />
                </div>
              ) : (
                recentSubscriptions.map((subscription) => (
                  <RecentSubscriptionItem
                    key={subscription._id}
                    subscription={subscription}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default OverviewContent;