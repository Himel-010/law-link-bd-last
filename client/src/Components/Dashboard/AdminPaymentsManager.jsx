"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Loader2,
  Filter,
  ShieldCheck,
  AlertCircle,
  ReceiptText,
  RefreshCw,
  X,
  CreditCard,
  UserRound,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:4000/api/payments";

const paymentStatusOptions = ["all", "pending", "verified", "rejected", "refunded"];
const methodOptions = ["all", "bkash", "nagad"];
const roleTypeOptions = ["all", "client", "lawyer"];

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

const normalizeMethod = (method) => {
  const value = String(method || "").toLowerCase().trim();
  if (value === "nogod") return "nagad";
  return value;
};

const formatMethod = (method) => {
  const value = normalizeMethod(method);

  if (value === "bkash") return "bKash";
  if (value === "nagad") return "Nagad";

  return "-";
};

const formatCurrency = (value, currency = "BDT") => {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency || "BDT",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${currency || "BDT"} ${Number(value || 0).toLocaleString("en-BD")}`;
  }
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

const getStatusClasses = (status) => {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "verified":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "refunded":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getMethodClasses = (method) => {
  const value = normalizeMethod(method);

  switch (value) {
    case "bkash":
      return "border-pink-200 bg-pink-50 text-pink-700";
    case "nagad":
      return "border-orange-200 bg-orange-50 text-orange-700";
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

const MethodBadge = ({ method }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getMethodClasses(
      method
    )}`}
  >
    {formatMethod(method)}
  </span>
);

const StatCard = ({ label, value, tone = "slate", icon: Icon }) => {
  const toneClass = {
    slate: "text-slate-950 border-slate-200 bg-white",
    amber: "text-amber-700 border-amber-100 bg-amber-50/40",
    emerald: "text-emerald-700 border-emerald-100 bg-emerald-50/40",
    rose: "text-rose-700 border-rose-100 bg-rose-50/40",
    blue: "text-blue-700 border-blue-100 bg-blue-50/40",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </div>

        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

const DetailCard = ({ title, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <div className="mt-1 break-words text-sm font-black text-slate-950">
      {value || "-"}
    </div>
  </div>
);

export default function AdminPaymentsManager() {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [roleType, setRoleType] = useState("all");
  const [planSlug, setPlanSlug] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [actionModal, setActionModal] = useState({
    open: false,
    type: "",
    payment: null,
    reason: "",
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

  const stats = useMemo(() => {
    const pending = payments.filter((item) => item.paymentStatus === "pending").length;
    const verified = payments.filter((item) => item.paymentStatus === "verified").length;
    const rejected = payments.filter((item) => item.paymentStatus === "rejected").length;
    const refunded = payments.filter((item) => item.paymentStatus === "refunded").length;

    const loadedAmount = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      pending,
      verified,
      rejected,
      refunded,
      loadedAmount,
    };
  }, [payments]);

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

    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (method !== "all") params.set("method", normalizeMethod(method));
    if (roleType !== "all") params.set("roleType", roleType);
    if (planSlug.trim()) params.set("planSlug", planSlug.trim().toLowerCase());

    return params.toString();
  }, [page, limit, paymentStatus, method, roleType, planSlug]);

  const fetchPayments = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoading(true);
      setError("");

      const query = buildQuery();

      const res = await fetch(`${API_BASE}/admin/all?${query}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to fetch payments");
      }

      let paymentList = data.data || [];

      if (search.trim()) {
        const term = search.trim().toLowerCase();

        paymentList = paymentList.filter((payment) => {
          return (
            payment.transactionId?.toLowerCase().includes(term) ||
            payment.user?.name?.toLowerCase().includes(term) ||
            payment.user?.email?.toLowerCase().includes(term) ||
            payment.user?.phone?.toLowerCase().includes(term) ||
            payment.senderNumber?.toLowerCase().includes(term) ||
            payment.planName?.toLowerCase().includes(term) ||
            payment.planSlug?.toLowerCase().includes(term)
          );
        });
      }

      setPayments(paymentList);
      setTotal(Number(data.total || paymentList.length || 0));
    } catch (err) {
      setError(err.message || "Failed to fetch payments");
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, authHeaders, buildQuery, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const fetchPaymentDetails = async (paymentId) => {
    if (!paymentId) return;

    try {
      setDetailLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/admin/${paymentId}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Failed to fetch payment details");
      }

      setSelectedPayment(data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch payment details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openActionModal = (type, payment) => {
    clearAlerts();

    setActionModal({
      open: true,
      type,
      payment,
      reason: "",
    });
  };

  const closeActionModal = () => {
    if (actionLoading) return;

    setActionModal({
      open: false,
      type: "",
      payment: null,
      reason: "",
    });
  };

  const handlePaymentAction = async () => {
    const payment = actionModal.payment;
    const type = actionModal.type;

    if (!payment?._id || !type) return;

    try {
      setActionLoading(true);
      clearAlerts();

      let url = "";
      let body = null;

      if (type === "verify") {
        url = `${API_BASE}/admin/verify/${payment._id}`;
      }

      if (type === "reject") {
        url = `${API_BASE}/admin/reject/${payment._id}`;
        body = {
          rejectionReason: actionModal.reason || "Rejected by admin",
        };
      }

      if (type === "refund") {
        url = `${API_BASE}/admin/refund/${payment._id}`;
        body = {
          refundReason: actionModal.reason || "Refunded by admin",
        };
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: authHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data.message || "Action failed");
      }

      setMessage(data.message || "Payment action completed successfully");
      closeActionModal();

      await fetchPayments();

      if (selectedPayment?._id === payment._id) {
        await fetchPaymentDetails(payment._id);
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPaymentStatus("all");
    setMethod("all");
    setRoleType("all");
    setPlanSlug("");
    setPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Login token paoa jai nai. Please abar login koro.
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Current user data paoa jai nai. Please abar login koro.
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Forbidden: Only admin can manage payments.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-7 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-7"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              Admin Payment Control
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Payment Verification
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review bKash/Nagad payment requests, verify valid payments,
              reject invalid submissions, and refund verified payments.
            </p>
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

        <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Loaded Amount"
            value={formatCurrency(stats.loadedAmount)}
            tone="slate"
            icon={CreditCard}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            tone="amber"
            icon={AlertCircle}
          />
          <StatCard
            label="Verified"
            value={stats.verified}
            tone="emerald"
            icon={BadgeCheck}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            tone="rose"
            icon={XCircle}
          />
          <StatCard
            label="Refunded"
            value={stats.refunded}
            tone="blue"
            icon={RotateCcw}
          />
        </div>

        <div className="mb-7 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
              <Filter className="h-5 w-5 text-cyan-700" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                Filter Payments
              </h2>
              <p className="text-sm text-slate-500">
                Filter by status, method, role, plan slug, or search manually.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search transaction, user, phone, plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <select
              value={paymentStatus}
              onChange={handleFilterChange(setPaymentStatus)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              {paymentStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all"
                    ? "All Status"
                    : item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={method}
              onChange={handleFilterChange(setMethod)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              {methodOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Methods" : formatMethod(item)}
                </option>
              ))}
            </select>

            <select
              value={roleType}
              onChange={handleFilterChange(setRoleType)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold capitalize text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              {roleTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Roles" : item}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Plan slug"
              value={planSlug}
              onChange={(e) => {
                setPlanSlug(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchPayments}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-5">
            <h2 className="text-xl font-black text-slate-950">
              Payment Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">Total results: {total}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-cyan-700">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm font-black">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-100 bg-cyan-50">
                <ReceiptText className="h-7 w-7 text-cyan-700" />
              </div>

              <p className="text-lg font-black text-slate-900">
                No payments found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing filters or check if users submitted payment requests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Transaction</th>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Sender Number</th>
                    <th className="px-5 py-4">Payment Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="transition hover:bg-cyan-50/40"
                    >
                      <td className="px-5 py-4">
                        <p className="max-w-[190px] truncate text-sm font-black text-slate-950">
                          {payment.transactionId || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-900">
                          {payment.user?.name || "Unknown user"}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-500">
                          {payment.user?.email || "No email"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {payment.user?.phone || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black capitalize text-cyan-700">
                          {payment.roleType || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-black capitalize text-slate-900">
                          {payment.planName || "-"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {payment.planSlug || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-950">
                          {formatCurrency(payment.amount, payment.currency || "BDT")}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <MethodBadge method={payment.method} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.paymentStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {payment.senderNumber || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {formatDateTime(payment.paymentDate || payment.createdAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => fetchPaymentDetails(payment._id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700 transition hover:bg-cyan-100"
                          >
                            <Eye className="h-4 w-4" />
                            Details
                          </button>

                          {payment.paymentStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionModal("verify", payment)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Verify
                              </button>

                              <button
                                type="button"
                                onClick={() => openActionModal("reject", payment)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}

                          {payment.paymentStatus === "verified" && (
                            <button
                              type="button"
                              onClick={() => openActionModal("refund", payment)}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-sm font-bold text-slate-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedPayment && (
            <motion.div
              className="mt-8 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-5">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Payment Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Full payment, user, plan, subscription and verification details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-10 text-cyan-700">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="text-sm font-black">Loading details...</span>
                </div>
              ) : (
                <div className="grid gap-5 p-5 lg:grid-cols-2">
                  <DetailCard title="Payment Information">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Transaction ID" value={selectedPayment.transactionId} />
                      <DetailItem label="Method" value={formatMethod(selectedPayment.method)} />
                      <DetailItem
                        label="Payment Status"
                        value={<StatusBadge status={selectedPayment.paymentStatus} />}
                      />
                      <DetailItem
                        label="Amount"
                        value={formatCurrency(
                          selectedPayment.amount,
                          selectedPayment.currency || "BDT"
                        )}
                      />
                      <DetailItem label="Sender Number" value={selectedPayment.senderNumber} />
                      <DetailItem
                        label="Payment Date"
                        value={formatDateTime(selectedPayment.paymentDate)}
                      />
                      <DetailItem
                        label="Submitted At"
                        value={formatDateTime(selectedPayment.createdAt)}
                      />
                      <DetailItem label="Note" value={selectedPayment.note || "-"} />
                    </div>
                  </DetailCard>

                  <DetailCard title="User Information">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label="User Name"
                        value={selectedPayment.user?.name || "Unknown user"}
                      />
                      <DetailItem label="Email" value={selectedPayment.user?.email || "-"} />
                      <DetailItem label="Phone" value={selectedPayment.user?.phone || "-"} />
                      <DetailItem label="Role Type" value={selectedPayment.roleType} />
                      <DetailItem
                        label="Subscription Status"
                        value={selectedPayment.user?.subscriptionStatus || "-"}
                      />
                    </div>
                  </DetailCard>

                  <DetailCard title="Plan & Subscription">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem label="Plan Name" value={selectedPayment.planName} />
                      <DetailItem label="Plan Slug" value={selectedPayment.planSlug} />
                      <DetailItem
                        label="Subscription Status"
                        value={selectedPayment.subscription?.status || "-"}
                      />
                      <DetailItem
                        label="Subscription Payment"
                        value={selectedPayment.subscription?.payment?.status || "-"}
                      />
                      <DetailItem
                        label="Start Date"
                        value={formatDateTime(selectedPayment.subscription?.startDate)}
                      />
                      <DetailItem
                        label="End Date"
                        value={formatDateTime(selectedPayment.subscription?.endDate)}
                      />
                    </div>
                  </DetailCard>

                  <DetailCard title="Admin Action Details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label="Verified By"
                        value={selectedPayment.verifiedBy?.name || "Not verified"}
                      />
                      <DetailItem
                        label="Verified At"
                        value={formatDateTime(selectedPayment.verifiedAt)}
                      />
                      <DetailItem
                        label="Rejected At"
                        value={formatDateTime(selectedPayment.rejectedAt)}
                      />
                      <DetailItem
                        label="Refunded At"
                        value={formatDateTime(selectedPayment.refundedAt)}
                      />
                      <DetailItem
                        label="Rejection Reason"
                        value={selectedPayment.rejectionReason || "-"}
                      />
                      <DetailItem
                        label="Refund Reason"
                        value={selectedPayment.refundReason || "-"}
                      />
                    </div>
                  </DetailCard>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {actionModal.open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
            >
              <div className="border-b border-slate-100 bg-slate-50 p-5">
                <h3 className="text-xl font-black capitalize text-slate-950">
                  {actionModal.type} Payment
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Transaction: {actionModal.payment?.transactionId}
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-slate-700">
                      {actionModal.payment?.user?.name || "Unknown user"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-slate-700">
                      {formatCurrency(
                        actionModal.payment?.amount,
                        actionModal.payment?.currency || "BDT"
                      )}{" "}
                      by {formatMethod(actionModal.payment?.method)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-slate-700">
                      {formatDateTime(actionModal.payment?.paymentDate)}
                    </span>
                  </div>
                </div>

                {actionModal.type === "verify" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    Are you sure you want to verify this payment? This will activate
                    the related subscription and give the user plan permissions.
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {actionModal.type === "reject"
                        ? "Rejection Reason"
                        : "Refund Reason"}
                    </label>

                    <textarea
                      rows={4}
                      value={actionModal.reason}
                      onChange={(e) =>
                        setActionModal((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder={
                        actionModal.type === "reject"
                          ? "Write rejection reason..."
                          : "Write refund reason..."
                      }
                      className="w-full resize-none rounded-2xl border border-slate-300 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    disabled={actionLoading}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handlePaymentAction}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm
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