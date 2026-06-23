"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  BadgeDollarSign,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldCheck,
  User,
  X,
  UserPlus,
  Handshake,
  Hourglass,
} from "lucide-react";
import { restoreUser } from "../../../Redux/UserSlice/UserSlice";
import postDetailsI18n from "../../../json/postDetails.json";

const normalizeApiBaseUrl = (value) => {
  const baseUrl = String(value || "https://law-link-bd-last.vercel.app").replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
const POSTS_API_URL = `${API_BASE_URL}/posts`;
const CONNECTIONS_API_URL = `${API_BASE_URL}/connections`;

const getStoredToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const getStoredUser = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");

  try {
    return JSON.parse(localUser || sessionUser || "null");
  } catch {
    return null;
  }
};

const formatDate = (dateString, t, locale = "en-BD") => {
  if (!dateString) return t.common.notAvailable;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return t.common.notAvailable;

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatBudget = (min, max, t) => {
  const minValue = Number(min || 0);
  const maxValue = Number(max || 0);

  if (!minValue && !maxValue) return t.budget.notSpecified;
  if (minValue && maxValue) return `৳${minValue.toLocaleString()} - ৳${maxValue.toLocaleString()}`;
  if (!minValue && maxValue) return `${t.budget.upTo} ৳${maxValue.toLocaleString()}`;
  return `${t.budget.from} ৳${minValue.toLocaleString()}`;
};

const getStatusLabel = (status, t) => {
  return t.status?.[status] || status?.replace("_", " ") || t.status.open;
};

const getUrgencyLabel = (urgency, t) => {
  return t.urgency?.[urgency] || t.urgency.medium;
};

const getCategoryLabel = (category, t) => {
  return t.category?.[category] || t.category.legalPost;
};

const getConnectionStatusLabel = (status, t) => {
  return t.status?.[status] || status || t.status.pending;
};

const getApiMessage = (message, fallback, language) => {
  if (language === "bn") return fallback;
  return message || fallback;
};

const getStatusClasses = (status) => {
  switch (status) {
    case "open":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "closed":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getUrgencyClasses = (urgency) => {
  switch (urgency) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getConnectionBadgeClasses = (status) => {
  switch (status) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "cancelled":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const reduxCurrentUser = useSelector((state) => state.user.currentUser);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const t = postDetailsI18n[currentLanguage]?.postDetails || postDetailsI18n.en.postDetails;
  const dateLocale = currentLanguage === "bn" ? "bn-BD" : "en-BD";

  const [currentUser, setCurrentUser] = useState(reduxCurrentUser || null);
  const [post, setPost] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [existingConnection, setExistingConnection] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const [bidForm, setBidForm] = useState({
    proposedFee: "",
    estimatedDays: "",
    message: "",
  });

  const isLoggedIn = Boolean(currentUser);
  const isLawyer = currentUser?.role === "lawyer";
  const hasActiveSubscription = currentUser?.subscriptionStatus === "active";
  const hasAcceptedConnection = existingConnection?.status === "accepted";
  const hasPendingConnection = existingConnection?.status === "pending";

  const locationText = useMemo(() => {
    return [post?.division, post?.district].filter(Boolean).join(", ");
  }, [post]);

  const alreadyBidOnPost = useMemo(() => {
    if (!post || (!currentUser?._id && !currentUser?.id)) return false;

    const userId = currentUser._id || currentUser.id;

    return Boolean(
      post?.bids?.some((bid) => {
        const lawyerId = bid?.lawyer?._id || bid?.lawyer;
        return String(lawyerId) === String(userId);
      })
    );
  }, [post, currentUser]);

  const acceptedBid = useMemo(() => {
    if (!post?.acceptedBid || !post?.bids?.length) return null;

    return post.bids.find(
      (bid) => String(bid._id) === String(post.acceptedBid)
    );
  }, [post]);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!reduxCurrentUser && storedUser) {
      dispatch(restoreUser(storedUser));
      setCurrentUser(storedUser);
      return;
    }

    setCurrentUser(reduxCurrentUser || storedUser || null);
  }, [reduxCurrentUser, dispatch]);

  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${POSTS_API_URL}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          getApiMessage(data?.message, t.messages.failedFetchPostDetails, currentLanguage)
        );
      }

      setPost(data.data);
    } catch (err) {
      setPost(null);
      setError(err.message || t.messages.failedFetchPostDetails);
    } finally {
      setLoading(false);
    }
  }, [id, currentLanguage, t]);

  const fetchExistingConnection = useCallback(async () => {
    const token = getStoredToken();

    if (!token || !isLawyer || !id) {
      setExistingConnection(null);
      return;
    }

    try {
      setConnectionLoading(true);

      const response = await fetch(`${CONNECTIONS_API_URL}/my?post=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        setExistingConnection(null);
        return;
      }

      const connection = Array.isArray(data.data) ? data.data[0] : null;
      setExistingConnection(connection || null);
    } catch {
      setExistingConnection(null);
    } finally {
      setConnectionLoading(false);
    }
  }, [id, isLawyer]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  useEffect(() => {
    fetchExistingConnection();
  }, [fetchExistingConnection]);

  const getRequestActionState = () => {
    if (!isLoggedIn) {
      return {
        label: t.actionStates.loginRequestLabel,
        disabled: true,
        reason: t.actionStates.loginRequestReason,
      };
    }

    if (!isLawyer) {
      return {
        label: t.actionStates.onlyLawyerRequestLabel,
        disabled: true,
        reason: t.actionStates.onlyLawyerRequestReason,
      };
    }

    if (post?.status !== "open") {
      return {
        label: t.actionStates.requestClosedLabel,
        disabled: true,
        reason: t.actionStates.requestClosedReason,
      };
    }

    if (!hasActiveSubscription) {
      return {
        label: t.actionStates.upgradeRequired,
        disabled: true,
        reason: t.actionStates.upgradeRequestReason,
      };
    }

    if (existingConnection) {
      return {
        label:
          existingConnection.status === "accepted"
            ? t.actionStates.connectionAccepted
            : existingConnection.status === "pending"
            ? t.actionStates.requestPending
            : existingConnection.status === "rejected"
            ? t.actionStates.requestRejected
            : t.actionStates.requestExists,
        disabled: true,
        reason: `${t.actionStates.connectionStatus}: ${getConnectionStatusLabel(
          existingConnection.status,
          t
        )}`,
      };
    }

    return {
      label: t.actionStates.sendConnectionRequest,
      disabled: false,
      reason: "",
    };
  };

  const getProposalActionState = () => {
    if (!isLoggedIn) {
      return {
        label: t.actionStates.loginProposalLabel,
        disabled: true,
        reason: t.actionStates.loginProposalReason,
      };
    }

    if (!isLawyer) {
      return {
        label: t.actionStates.onlyLawyerProposalLabel,
        disabled: true,
        reason: t.actionStates.onlyLawyerProposalReason,
      };
    }

    if (post?.status !== "open") {
      return {
        label: t.actionStates.proposalClosedLabel,
        disabled: true,
        reason: t.actionStates.proposalClosedReason,
      };
    }

    if (!hasActiveSubscription) {
      return {
        label: t.actionStates.upgradeRequired,
        disabled: true,
        reason: t.actionStates.upgradeProposalReason,
      };
    }

    if (!hasAcceptedConnection) {
      return {
        label: t.actionStates.connectionRequired,
        disabled: true,
        reason: t.actionStates.connectionRequiredReason,
      };
    }

    if (alreadyBidOnPost) {
      return {
        label: t.actionStates.proposalAlreadySent,
        disabled: true,
        reason: t.actionStates.proposalAlreadySentReason,
      };
    }

    return {
      label: t.actionStates.sendProposal,
      disabled: false,
      reason: "",
    };
  };

  const requestActionState = getRequestActionState();
  const proposalActionState = getProposalActionState();

  const openRequestModal = () => {
    setRequestError("");
    setRequestSuccess("");
    setRequestMessage("");
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    if (requestSubmitting) return;

    setIsRequestModalOpen(false);
    setRequestError("");
    setRequestSuccess("");
    setRequestMessage("");
  };

  const submitConnectionRequest = async (e) => {
    e.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setRequestError(t.messages.pleaseLoginFirst);
      return;
    }

    if (!isLawyer) {
      setRequestError(t.messages.onlyLawyersRequest);
      return;
    }

    if (!hasActiveSubscription) {
      setRequestError(t.messages.activeSubscriptionRequest);
      return;
    }

    if (!post?.client?._id && !post?.client) {
      setRequestError(t.messages.clientInfoNotFound);
      return;
    }

    try {
      setRequestSubmitting(true);
      setRequestError("");
      setRequestSuccess("");

      const clientId = post.client?._id || post.client;

      const response = await fetch(`${CONNECTIONS_API_URL}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          postId: post._id,
          requestMessage: requestMessage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          getApiMessage(data?.message, t.messages.failedConnectionRequest, currentLanguage)
        );
      }

      setRequestSuccess(
        getApiMessage(data?.message, t.messages.connectionRequestSent, currentLanguage)
      );
      setExistingConnection(data.data);

      setTimeout(() => {
        closeRequestModal();
      }, 900);
    } catch (err) {
      setRequestError(err.message || t.messages.failedConnectionRequest);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const openBidModal = () => {
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
    setIsBidModalOpen(true);
  };

  const closeBidModal = () => {
    if (bidSubmitting) return;

    setIsBidModalOpen(false);
    setBidError("");
    setBidSuccess("");
    setBidForm({
      proposedFee: "",
      estimatedDays: "",
      message: "",
    });
  };

  const handleBidFormChange = (e) => {
    const { name, value } = e.target;

    setBidForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitBid = async (e) => {
    e.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setBidError(t.messages.pleaseLoginFirst);
      return;
    }

    if (!isLawyer) {
      setBidError(t.messages.onlyLawyersProposal);
      return;
    }

    if (!hasActiveSubscription) {
      setBidError(t.messages.activeSubscriptionProposal);
      return;
    }

    if (!hasAcceptedConnection) {
      setBidError(t.messages.connectionRequiredBeforeProposal);
      return;
    }

    if (!bidForm.proposedFee || !bidForm.estimatedDays || !bidForm.message) {
      setBidError(t.messages.proposalFieldsRequired);
      return;
    }

    try {
      setBidSubmitting(true);
      setBidError("");
      setBidSuccess("");

      const response = await fetch(`${POSTS_API_URL}/${id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposedFee: Number(bidForm.proposedFee),
          estimatedDays: Number(bidForm.estimatedDays),
          message: bidForm.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          getApiMessage(data?.message, t.messages.failedProposal, currentLanguage)
        );
      }

      setBidSuccess(
        getApiMessage(data?.message, t.messages.proposalSent, currentLanguage)
      );
      setPost(data.data);

      setTimeout(() => {
        closeBidModal();
      }, 900);
    } catch (err) {
      setBidError(err.message || t.messages.failedProposal);
    } finally {
      setBidSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-slate-50 to-white pt-24">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex justify-center py-20">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-cyan-100 bg-white px-6 py-4 text-sm font-black text-slate-700 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
              {t.loading.caseDetails}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-slate-50 to-white pt-24">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h1 className="mb-2 text-2xl font-black text-slate-950">
              {t.errorState.title}
            </h1>

            <p className="mb-6 text-sm font-semibold text-red-600">
              {error || t.common.somethingWrong}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.common.goBack}
              </button>

              <button
                onClick={fetchPostDetails}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700"
              >
                <RefreshCcw className="h-4 w-4" />
                {t.common.tryAgain}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showConnectionStep = isLawyer && !hasAcceptedConnection;
  const showProposalStep = isLawyer && hasAcceptedConnection;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-slate-50 to-white pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 shadow-sm hover:bg-cyan-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common.backToPosts}
          </button>

          <button
            onClick={() => {
              fetchPostDetails();
              fetchExistingConnection();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-100"
          >
            <RefreshCcw className="h-4 w-4" />
            {t.common.refresh}
          </button>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <motion.main
            className="overflow-hidden rounded-[32px] border border-cyan-100 bg-white shadow-xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="border-b border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6 md:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClasses(
                    post.status
                  )}`}
                >
                  {getStatusLabel(post.status, t)}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getUrgencyClasses(
                    post.urgency
                  )}`}
                >
                  {getUrgencyLabel(post.urgency, t)}
                </span>

                <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black capitalize text-cyan-700">
                  {getCategoryLabel(post.category, t)}
                </span>

                {Number(post.isPriority) === 1 && (
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                    {t.badges.priorityCase}
                  </span>
                )}
              </div>

              <h1 className="mb-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {post.title || t.common.untitledCase}
              </h1>

              <p className="max-w-3xl text-base leading-7 text-slate-600">
                {t.intro.instruction}
              </p>
            </div>

            <div className="p-6 md:p-8">
              <section className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                    <MessageSquareText className="h-5 w-5 text-cyan-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {t.sections.descriptionTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {t.sections.descriptionSubtitle}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-700 md:text-base">
                    {post.description || t.common.noDescription}
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                    <FileText className="h-5 w-5 text-cyan-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {t.sections.documentsTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {t.sections.documentsSubtitle}
                    </p>
                  </div>
                </div>

                {post.documents?.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {post.documents.map((doc, index) => (
                      <a
                        key={`${doc}-${index}`}
                        href={doc}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t.sections.document} {index + 1}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
                    {t.sections.noDocuments}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                    <Gavel className="h-5 w-5 text-cyan-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {t.sections.proposalActivityTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {t.sections.proposalActivitySubtitle}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-500">
                      {t.sections.totalProposals}
                    </p>

                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-700">
                      {post.bids?.length || 0}
                    </span>
                  </div>

                  {acceptedBid ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                      {t.sections.acceptedProposal}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      {t.sections.noAcceptedProposal}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </motion.main>

          <motion.aside
            className="space-y-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="rounded-[32px] border border-cyan-100 bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                  <Briefcase className="h-5 w-5 text-cyan-700" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    {t.summary.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t.summary.subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <BadgeDollarSign className="h-4 w-4" />
                    {t.summary.budget}
                  </span>

                  <span className="text-right text-sm font-black text-slate-900">
                    {formatBudget(post.budgetMin, post.budgetMax, t)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {t.summary.location}
                  </span>

                  <span className="text-right text-sm font-black text-slate-900">
                    {locationText || t.common.notSpecified}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    {t.summary.posted}
                  </span>

                  <span className="text-right text-sm font-black text-slate-900">
                    {formatDate(post.createdAt, t, dateLocale)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Clock className="h-4 w-4" />
                    {t.summary.updated}
                  </span>

                  <span className="text-right text-sm font-black text-slate-900">
                    {formatDate(post.updatedAt, t, dateLocale)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-cyan-100 bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                  <User className="h-5 w-5 text-cyan-700" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    {t.clientInfo.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t.clientInfo.subtitle}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-lg font-black text-white">
                    {(post.client?.name || "C").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950">
                      {post.client?.name || t.common.unknownClient}
                    </p>

                    <p className="truncate text-sm font-semibold text-slate-500">
                      {post.client?.email || t.common.emailHidden}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-cyan-700">
                  <ShieldCheck className="h-4 w-4" />
                  {t.clientInfo.protectedContact}
                </div>
              </div>
            </div>

            {isLawyer && (
              <div className="rounded-[32px] border border-cyan-100 bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50">
                    {hasAcceptedConnection ? (
                      <Send className="h-5 w-5 text-cyan-700" />
                    ) : (
                      <UserPlus className="h-5 w-5 text-cyan-700" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {hasAcceptedConnection
                        ? t.lawyerBox.step2Title
                        : t.lawyerBox.step1Title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {hasAcceptedConnection
                        ? t.lawyerBox.step2Subtitle
                        : t.lawyerBox.step1Subtitle}
                    </p>
                  </div>
                </div>

                {connectionLoading && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.loading.checkingConnection}
                  </div>
                )}

                {existingConnection && (
                  <div
                    className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold capitalize ${getConnectionBadgeClasses(
                      existingConnection.status
                    )}`}
                  >
                    {t.actionStates.connectionStatus}: {getConnectionStatusLabel(existingConnection.status, t)}
                  </div>
                )}

                {!hasAcceptedConnection && requestActionState.reason && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    {requestActionState.reason}
                  </div>
                )}

                {hasPendingConnection && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
                    {t.lawyerBox.waitingApproval}
                  </div>
                )}

                {hasAcceptedConnection && proposalActionState.reason && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    {proposalActionState.reason}
                  </div>
                )}

                {showConnectionStep && (
                  <button
                    onClick={openRequestModal}
                    disabled={requestActionState.disabled}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition-all ${
                      requestActionState.disabled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-700 text-white shadow-lg shadow-cyan-500/20 hover:from-emerald-600 hover:to-cyan-800"
                    }`}
                  >
                    {existingConnection ? (
                      <Handshake className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {requestActionState.label}
                  </button>
                )}

                {showProposalStep && (
                  <button
                    onClick={openBidModal}
                    disabled={proposalActionState.disabled}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition-all ${
                      proposalActionState.disabled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-gradient-to-r from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-cyan-800"
                    }`}
                  >
                    {alreadyBidOnPost ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {proposalActionState.label}
                  </button>
                )}
              </div>
            )}

            {!isLoggedIn && (
              <div className="rounded-[32px] border border-cyan-100 bg-white p-6 shadow-xl">
                <h2 className="mb-2 text-lg font-black text-slate-950">
                  {t.loginBox.title}
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  {t.loginBox.description}
                </p>
                <Link
                  to="/sign-in"
                  className="flex w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-100"
                >
                  {t.loginBox.button}
                </Link>
              </div>
            )}
          </motion.aside>
        </div>
      </div>

      <AnimatePresence>
        {isRequestModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-gradient-to-br from-emerald-50 to-white p-6">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">
                    <UserPlus className="h-3.5 w-3.5" />
                    {t.requestModal.badge}
                  </div>

                  <h2 className="text-2xl font-black text-slate-950">
                    {t.requestModal.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {t.requestModal.subtitle}
                  </p>
                </div>

                <button
                  onClick={closeRequestModal}
                  disabled={requestSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitConnectionRequest} className="p-6">
                {requestError && (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {requestError}
                  </div>
                )}

                {requestSuccess && (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {requestSuccess}
                  </div>
                )}

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    {t.requestModal.messageLabel}
                  </label>

                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={5}
                    maxLength={1000}
                    placeholder={t.requestModal.messagePlaceholder}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {requestMessage.length}/1000 {t.common.characters}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRequestModal}
                    disabled={requestSubmitting}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t.common.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={requestSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:from-emerald-600 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {requestSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.common.sending}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        {t.requestModal.sendButton}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBidModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-2xl"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-black text-cyan-700">
                    <Send className="h-3.5 w-3.5" />
                    {t.proposalModal.badge}
                  </div>

                  <h2 className="text-2xl font-black text-slate-950">
                    {post.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {t.proposalModal.subtitle}
                  </p>
                </div>

                <button
                  onClick={closeBidModal}
                  disabled={bidSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitBid} className="p-6">
                {bidError && (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {bidError}
                  </div>
                )}

                {bidSuccess && (
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {bidSuccess}
                  </div>
                )}

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-800">
                      {t.proposalModal.feeLabel}
                    </label>

                    <input
                      type="number"
                      name="proposedFee"
                      value={bidForm.proposedFee}
                      onChange={handleBidFormChange}
                      min="0"
                      placeholder={t.proposalModal.feePlaceholder}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-800">
                      {t.proposalModal.daysLabel}
                    </label>

                    <input
                      type="number"
                      name="estimatedDays"
                      value={bidForm.estimatedDays}
                      onChange={handleBidFormChange}
                      min="1"
                      placeholder={t.proposalModal.daysPlaceholder}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    {t.proposalModal.messageLabel}
                  </label>

                  <textarea
                    name="message"
                    value={bidForm.message}
                    onChange={handleBidFormChange}
                    rows={6}
                    maxLength={2000}
                    placeholder={t.proposalModal.messagePlaceholder}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                    required
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {bidForm.message.length}/2000 {t.common.characters}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeBidModal}
                    disabled={bidSubmitting}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t.common.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={bidSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {bidSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.common.sending}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t.proposalModal.badge}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostDetails;