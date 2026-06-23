import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiHash,
  FiLoader,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiStar,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiX,
  FiXCircle,
} from "react-icons/fi";

const API_BASE_URL = "http://localhost:4000/api";

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

const formatDate = (date) => {
  if (!date) return "N/A";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "N/A";
  }
};

const formatMoney = (amount) => {
  const number = Number(amount || 0);
  return `BDT ${number.toLocaleString("en-US")}`;
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);
  if (!parts.length) return "L";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const isPhoneVerified = (user) => Number(user?.phoneVerified || 0) === 1;
const isProfileComplete = (user) => Boolean(user?.profileCompleted);
const isApproved = (user) => Boolean(user?.isVerifiedLawyer);

const canApproveLawyer = (user) => {
  return isProfileComplete(user);
};

const isFullyActiveLawyer = (user) => {
  return isPhoneVerified(user) && isProfileComplete(user) && isApproved(user);
};

const StatusPill = ({ type, children }) => {
  const classes = {
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    info: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${classes[type]}`}
    >
      {children}
    </span>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, type = "info" }) => {
  const styles = {
    info: "bg-cyan-600 shadow-cyan-100",
    success: "bg-emerald-600 shadow-emerald-100",
    warning: "bg-amber-500 shadow-amber-100",
    danger: "bg-rose-600 shadow-rose-100",
    purple: "bg-violet-600 shadow-violet-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${styles[type]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <p className="mt-3 break-words text-base font-black text-slate-950">
      {value || "N/A"}
    </p>
  </div>
);

const EmptyState = ({ title, message }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
      <FiUserCheck className="h-7 w-7" />
    </div>
    <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
  </div>
);

const LawyerAvatar = ({ lawyer, size = "md" }) => {
  const sizes = {
    sm: "h-11 w-11 text-sm rounded-2xl",
    md: "h-14 w-14 text-base rounded-2xl",
    lg: "h-24 w-24 text-2xl rounded-[28px]",
  };

  if (lawyer?.profileImage) {
    return (
      <img
        src={lawyer.profileImage}
        alt={lawyer.name || "Lawyer"}
        className={`${sizes[size]} shrink-0 object-cover ring-4 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center bg-slate-900 font-black text-white ring-4 ring-white`}
    >
      {getInitials(lawyer?.name)}
    </div>
  );
};

const LawyerVerificationModal = ({
  lawyer,
  open,
  onClose,
  onVerifyPhone,
  onApproveWithPhone,
  onRemoveApproval,
  actionLoading,
}) => {
  if (!open || !lawyer) return null;

  const phoneDone = isPhoneVerified(lawyer);
  const profileDone = isProfileComplete(lawyer);
  const approvedDone = isApproved(lawyer);
  const fullActive = isFullyActiveLawyer(lawyer);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur-xl md:px-7">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Lawyer Verification Details
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Review profile, verify phone, and approve lawyer access.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(actionLoading)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(92vh-86px)] overflow-y-auto p-5 md:p-7">
            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <LawyerAvatar lawyer={lawyer} size="lg" />

                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      {lawyer.name || "Unnamed Lawyer"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {lawyer.specialization || "No specialization added"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {approvedDone ? (
                        <StatusPill type="success">
                          <FiCheckCircle />
                          Lawyer Approved
                        </StatusPill>
                      ) : (
                        <StatusPill type="danger">
                          <FiXCircle />
                          Lawyer Not Approved
                        </StatusPill>
                      )}

                      {phoneDone ? (
                        <StatusPill type="success">
                          <FiPhone />
                          Phone Verified
                        </StatusPill>
                      ) : (
                        <StatusPill type="warning">
                          <FiPhone />
                          Phone Not Verified
                        </StatusPill>
                      )}

                      {profileDone ? (
                        <StatusPill type="success">
                          <FiUserCheck />
                          Profile Complete
                        </StatusPill>
                      ) : (
                        <StatusPill type="danger">
                          <FiAlertCircle />
                          Profile Incomplete
                        </StatusPill>
                      )}

                      <StatusPill type="info">
                        <FiClock />
                        {lawyer.availability || "available"}
                      </StatusPill>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  {!phoneDone && (
                    <button
                      type="button"
                      onClick={() => onVerifyPhone(lawyer)}
                      disabled={actionLoading === lawyer._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === lawyer._id ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiPhone />
                      )}
                      Verify Phone
                    </button>
                  )}

                  {!fullActive && (
                    <button
                      type="button"
                      onClick={() => onApproveWithPhone(lawyer)}
                      disabled={!canApproveLawyer(lawyer) || actionLoading === lawyer._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {actionLoading === lawyer._id ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiShield />
                      )}
                      Verify Phone & Approve
                    </button>
                  )}

                  {approvedDone && (
                    <button
                      type="button"
                      onClick={() => onRemoveApproval(lawyer)}
                      disabled={actionLoading === lawyer._id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === lawyer._id ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiXCircle />
                      )}
                      Remove Approval
                    </button>
                  )}
                </div>
              </div>

              {!profileDone && (
                <div className="mt-5 flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                  <FiAlertCircle className="mt-1 shrink-0" />
                  This lawyer cannot be approved yet. The lawyer profile must be completed first.
                </div>
              )}

              {profileDone && !fullActive && (
                <div className="mt-5 flex gap-3 rounded-3xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm font-bold leading-6 text-cyan-800">
                  <FiShield className="mt-1 shrink-0" />
                  Admin can approve this lawyer now. Clicking “Verify Phone & Approve” will set phone verified and lawyer approved together.
                </div>
              )}

              {fullActive && (
                <div className="mt-5 flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-800">
                  <FiCheckCircle className="mt-1 shrink-0" />
                  This lawyer is fully verified and can appear publicly.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoCard icon={FiMail} label="Email" value={lawyer.email} />
              <InfoCard icon={FiPhone} label="Phone" value={lawyer.phone} />
              <InfoCard icon={FiHash} label="NID" value={lawyer.nid} />
              <InfoCard
                icon={FiAward}
                label="Law Registration No."
                value={lawyer.lawRegNumber}
              />
              <InfoCard
                icon={FiBriefcase}
                label="Experience"
                value={`${lawyer.experienceYears ?? 0} years`}
              />
              <InfoCard icon={FiMapPin} label="City" value={lawyer.city} />
              <InfoCard
                icon={FiHash}
                label="Consultation Fee"
                value={formatMoney(lawyer.consultationFee)}
              />
              <InfoCard
                icon={FiStar}
                label="Rating"
                value={`${lawyer.rating ?? 0} / 5`}
              />
              <InfoCard
                icon={FiBriefcase}
                label="Cases Handled"
                value={lawyer.casesHandled ?? 0}
              />
              <InfoCard
                icon={FiCalendar}
                label="Joined"
                value={formatDate(lawyer.createdAt)}
              />
              <InfoCard
                icon={FiShield}
                label="Subscription"
                value={lawyer.subscriptionStatus || "none"}
              />
              <InfoCard
                icon={FiUserCheck}
                label="Profile Completed"
                value={profileDone ? "Yes" : "No"}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <FiMapPin />
                  Office Address
                </div>
                <p className="mt-3 min-h-[70px] rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                  {lawyer.officeAddress || "No office address added."}
                </p>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                  <FiUser />
                  Lawyer Bio
                </div>
                <p className="mt-3 min-h-[70px] rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                  {lawyer.bio || "No bio added."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LawyerRowCard = ({
  lawyer,
  onView,
  onVerifyPhone,
  onApproveWithPhone,
  onRemoveApproval,
  actionLoading,
}) => {
  const phoneDone = isPhoneVerified(lawyer);
  const profileDone = isProfileComplete(lawyer);
  const approvedDone = isApproved(lawyer);
  const fullActive = isFullyActiveLawyer(lawyer);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <LawyerAvatar lawyer={lawyer} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black text-slate-950">
                {lawyer.name || "Unnamed Lawyer"}
              </h3>

              {fullActive ? (
                <StatusPill type="success">
                  <FiCheckCircle />
                  Live
                </StatusPill>
              ) : approvedDone ? (
                <StatusPill type="info">
                  <FiShield />
                  Approved
                </StatusPill>
              ) : (
                <StatusPill type="danger">
                  <FiXCircle />
                  Pending
                </StatusPill>
              )}
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {lawyer.specialization || "No specialization"} •{" "}
              {lawyer.city || "No city"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {phoneDone ? (
                <StatusPill type="success">
                  <FiPhone />
                  Phone Verified
                </StatusPill>
              ) : (
                <StatusPill type="warning">
                  <FiPhone />
                  Phone Not Verified
                </StatusPill>
              )}

              {profileDone ? (
                <StatusPill type="success">
                  <FiUserCheck />
                  Profile Complete
                </StatusPill>
              ) : (
                <StatusPill type="danger">
                  <FiAlertCircle />
                  Incomplete Profile
                </StatusPill>
              )}

              <StatusPill type="neutral">
                <FiCalendar />
                {formatDate(lawyer.createdAt)}
              </StatusPill>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Phone
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-900">
                  {lawyer.phone || "N/A"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Reg No.
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-900">
                  {lawyer.lawRegNumber || "N/A"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Fee
                </p>
                <p className="mt-1 truncate text-sm font-black text-slate-900">
                  {formatMoney(lawyer.consultationFee)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-black uppercase text-slate-400">
                  Subscription
                </p>
                <p className="mt-1 truncate text-sm font-black capitalize text-slate-900">
                  {lawyer.subscriptionStatus || "none"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:w-[380px] xl:flex-col">
          <button
            type="button"
            onClick={() => onView(lawyer)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <FiEye />
            View Details
          </button>

          {!phoneDone && (
            <button
              type="button"
              onClick={() => onVerifyPhone(lawyer)}
              disabled={actionLoading === lawyer._id}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === lawyer._id ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiPhone />
              )}
              Verify Phone
            </button>
          )}

          {!fullActive && (
            <button
              type="button"
              onClick={() => onApproveWithPhone(lawyer)}
              disabled={!profileDone || actionLoading === lawyer._id}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {actionLoading === lawyer._id ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiShield />
              )}
              Verify & Approve
            </button>
          )}

          {approvedDone && (
            <button
              type="button"
              onClick={() => onRemoveApproval(lawyer)}
              disabled={actionLoading === lawyer._id}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === lawyer._id ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiXCircle />
              )}
              Remove Approval
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminLawyerVerificationDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const fetchLawyers = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          role: "lawyer",
          limit: 100,
        },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setLawyers(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load lawyers");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchLawyers();
  }, [fetchLawyers, reloadKey]);

  const triggerReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const updateSelectedLawyer = useCallback((updatedLawyer) => {
    if (!updatedLawyer) return;

    setSelectedLawyer((prev) => {
      if (!prev || prev._id !== updatedLawyer._id) return prev;
      return {
        ...prev,
        ...updatedLawyer,
      };
    });
  }, []);

  const updateLawyerState = useCallback(
    (lawyerId, updatedData) => {
      setLawyers((prev) =>
        prev.map((lawyer) =>
          lawyer._id === lawyerId
            ? {
                ...lawyer,
                ...updatedData,
              }
            : lawyer
        )
      );

      updateSelectedLawyer({
        _id: lawyerId,
        ...updatedData,
      });
    },
    [updateSelectedLawyer]
  );

  const handleUpdateLawyer = useCallback(
    async (lawyer, payload, successMessage) => {
      if (!lawyer?._id) return;

      try {
        setActionLoading(lawyer._id);
        setError("");
        setSuccess("");

        const res = await axios.put(`${API_BASE_URL}/users/${lawyer._id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const updatedUser = res.data?.data || res.data?.user || payload;

        updateLawyerState(lawyer._id, {
          ...payload,
          ...updatedUser,
        });

        setSuccess(successMessage || res.data?.message || "Lawyer updated successfully");
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to update lawyer");
      } finally {
        setActionLoading("");
      }
    },
    [token, updateLawyerState]
  );

  const handleVerifyPhone = useCallback(
    async (lawyer) => {
      const confirmed = window.confirm(
        `Verify phone number for ${lawyer?.name || "this lawyer"}?`
      );

      if (!confirmed) return;

      await handleUpdateLawyer(
        lawyer,
        {
          phoneVerified: 1,
        },
        "Phone number verified successfully"
      );
    },
    [handleUpdateLawyer]
  );

  const handleApproveWithPhone = useCallback(
    async (lawyer) => {
      if (!isProfileComplete(lawyer)) {
        setError("This lawyer profile is incomplete. Complete profile first.");
        return;
      }

      const confirmed = window.confirm(
        `Verify phone and approve ${lawyer?.name || "this lawyer"}?`
      );

      if (!confirmed) return;

      await handleUpdateLawyer(
        lawyer,
        {
          phoneVerified: 1,
          isVerifiedLawyer: true,
        },
        "Phone verified and lawyer approved successfully"
      );
    },
    [handleUpdateLawyer]
  );

  const handleRemoveApproval = useCallback(
    async (lawyer) => {
      const confirmed = window.confirm(
        `Remove approval from ${lawyer?.name || "this lawyer"}?`
      );

      if (!confirmed) return;

      await handleUpdateLawyer(
        lawyer,
        {
          isVerifiedLawyer: false,
        },
        "Lawyer approval removed successfully"
      );
    },
    [handleUpdateLawyer]
  );

  const handleViewLawyer = useCallback((lawyer) => {
    setSelectedLawyer(lawyer);
    setModalOpen(true);
    setError("");
    setSuccess("");
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedLawyer(null);
  }, []);

  const filteredLawyers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return lawyers.filter((lawyer) => {
      const matchesSearch =
        !q ||
        lawyer.name?.toLowerCase().includes(q) ||
        lawyer.email?.toLowerCase().includes(q) ||
        lawyer.phone?.toLowerCase().includes(q) ||
        lawyer.city?.toLowerCase().includes(q) ||
        lawyer.specialization?.toLowerCase().includes(q) ||
        lawyer.lawRegNumber?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "approved") {
        return isFullyActiveLawyer(lawyer);
      }

      if (statusFilter === "pending") {
        return !isApproved(lawyer);
      }

      if (statusFilter === "phonePending") {
        return !isPhoneVerified(lawyer);
      }

      if (statusFilter === "profileIncomplete") {
        return !isProfileComplete(lawyer);
      }

      return true;
    });
  }, [lawyers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: lawyers.length,
      live: lawyers.filter(isFullyActiveLawyer).length,
      pending: lawyers.filter((lawyer) => !isApproved(lawyer)).length,
      phonePending: lawyers.filter((lawyer) => !isPhoneVerified(lawyer)).length,
      incomplete: lawyers.filter((lawyer) => !isProfileComplete(lawyer)).length,
    };
  }, [lawyers]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Please login again</h2>
          <p className="mt-2 text-sm text-slate-500">
            Login token not found. Please login again.
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">User data missing</h2>
          <p className="mt-2 text-sm text-slate-500">
            Current user data not found. Please login again.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Access denied</h2>
          <p className="mt-2 text-sm text-slate-500">
            Only admin can manage lawyer verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="space-y-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600">
                  Admin Dashboard
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                  Lawyer Verification
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Verify phone numbers, approve lawyers, and control who can appear in the public lawyer list.
                </p>
              </div>

              <button
                type="button"
                onClick={triggerReload}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_240px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search lawyer by name, email, phone, city, specialization or reg no..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div className="relative">
                <FiFilter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-black text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="all">All Lawyers</option>
                  <option value="approved">Live / Fully Verified</option>
                  <option value="pending">Approval Pending</option>
                  <option value="phonePending">Phone Pending</option>
                  <option value="profileIncomplete">Profile Incomplete</option>
                </select>
              </div>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              <FiCheckCircle />
              {success}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">
              <FiAlertCircle />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Lawyers"
              value={stats.total}
              subtitle="All lawyer accounts"
              icon={FiUser}
              type="info"
            />
            <StatCard
              title="Live Lawyers"
              value={stats.live}
              subtitle="Phone + profile + approved"
              icon={FiCheckCircle}
              type="success"
            />
            <StatCard
              title="Pending Approval"
              value={stats.pending}
              subtitle="Not approved yet"
              icon={FiClock}
              type="warning"
            />
            <StatCard
              title="Phone Pending"
              value={stats.phonePending}
              subtitle="Need phone verify"
              icon={FiPhone}
              type="danger"
            />
            <StatCard
              title="Incomplete"
              value={stats.incomplete}
              subtitle="Profile not ready"
              icon={FiAlertCircle}
              type="purple"
            />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Lawyer List</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {filteredLawyers.length} of {lawyers.length} lawyers.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading lawyers...
                </div>
              </div>
            ) : filteredLawyers.length === 0 ? (
              <EmptyState
                title="No lawyers found"
                message="No lawyer matched your current search or filter. Try changing the filter or refresh the list."
              />
            ) : (
              <div className="grid gap-4">
                {filteredLawyers.map((lawyer) => (
                  <LawyerRowCard
                    key={lawyer._id}
                    lawyer={lawyer}
                    onView={handleViewLawyer}
                    onVerifyPhone={handleVerifyPhone}
                    onApproveWithPhone={handleApproveWithPhone}
                    onRemoveApproval={handleRemoveApproval}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <LawyerVerificationModal
        lawyer={selectedLawyer}
        open={modalOpen}
        onClose={closeModal}
        onVerifyPhone={handleVerifyPhone}
        onApproveWithPhone={handleApproveWithPhone}
        onRemoveApproval={handleRemoveApproval}
        actionLoading={actionLoading}
      />
    </>
  );
}