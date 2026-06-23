"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhoneAlt,
  FaIdCard,
  FaBalanceScale,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaCrown,
  FaCalendarAlt,
  FaRegEdit,
  FaCreditCard,
  FaHistory,
  FaClock,
  FaReceipt,
  FaArrowRight,
  FaSyncAlt,
  FaHandshake,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaBriefcase,
  FaMapMarkerAlt,
  FaGavel,
  FaComments,
  FaPaperclip,
  FaLock,
  FaCamera,
} from "react-icons/fa";
import {
  MdVerifiedUser,
  MdSubscriptions,
  MdWorkspacePremium,
} from "react-icons/md";
import { RiProfileLine } from "react-icons/ri";

import userProfileI18n from "../../json/userProfile.json";

const normalizeApiBaseUrl = (baseUrl = "") => {
  const cleanBaseUrl = String(baseUrl || "").replace(/\/+$/, "");

  if (!cleanBaseUrl) return "/api";
  return cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const GOOGLE_DRIVE_HOSTS = ["drive.google.com"];

const SOCIAL_MEDIA_HOSTS = [
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "t.me",
  "telegram.me",
  "wa.me",
  "whatsapp.com",
  "www.whatsapp.com",
  "messenger.com",
  "www.messenger.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
];

const BANGLADESH_PHONE_REGEX =
  /(?:\+?88)?01[3-9]\d{8}|(?:\+?8801[3-9]\d{8})/g;

const GENERIC_PHONE_REGEX = /(?:\+?\d[\d\s\-().]{6,}\d)/g;

const SOCIAL_HANDLE_REGEX =
  /(^|\s)@([a-zA-Z0-9._]{3,30})(?=\s|$|[.,!?])/g;

const PAYMENT_KEYWORDS_REGEX =
  /\b(bkash|b-kash|bikash|nagad|nogod|rocket|upay|surecash|payment number|send money|cash out|personal number|agent number|merchant number)\b/i;

const BDT_PAYMENT_TEXT_REGEX =
  /\b(?:bdt|tk|৳)\s*\d+|\d+\s*(?:bdt|tk|taka|৳)\b/i;

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

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

const updateStoredAuthUser = (updatedUser) => {
  if (!updatedUser) return;

  try {
    const localUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");

    if (localUser) {
      const currentUser = JSON.parse(localUser);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...currentUser, ...updatedUser })
      );
      return;
    }

    if (sessionUser) {
      const currentUser = JSON.parse(sessionUser);
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({ ...currentUser, ...updatedUser })
      );
    }
  } catch (error) {
    console.error("Stored auth update error:", error);
  }
};

const buildProfileImagePreview = (file) => {
  if (!file) return "";
  return URL.createObjectURL(file);
};

const formatDate = (dateString, locale = "en-BD", fallback = "Not available") => {
  if (!dateString) return fallback;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (
  dateString,
  locale = "en-BD",
  fallback = "Not available"
) => {
  if (!dateString) return fallback;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value, currency = "BDT", locale = "en-BD") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const replaceTemplate = (text = "", values = {}) => {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, value);
  }, text);
};

const getStatusLabel = (status, t) => {
  const value = String(status || "").toLowerCase();
  return (
    t?.status?.[value] ||
    t?.roles?.[value] ||
    t?.common?.[value] ||
    status ||
    t?.common?.unknown
  );
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    case "lawyer":
      return "bg-cyan-100 text-cyan-700 border border-cyan-200";
    case "client":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getSubscriptionBadgeStyle = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "expired":
      return "bg-red-100 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-700 border border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getPaymentBadgeStyle = (status) => {
  switch (status) {
    case "verified":
    case "paid":
    case "free":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
    case "unpaid":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
    case "failed":
      return "bg-red-100 text-red-700 border border-red-200";
    case "refunded":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getConnectionBadgeStyle = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "blocked":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getBidBadgeStyle = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "withdrawn":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const getFeatureDisplayValue = (value, t) => {
  if (typeof value === "boolean") return value ? t.common.yes : t.common.no;

  if (typeof value === "number") {
    if (value === 999999 || value === 9999) return t.common.unlimited;
    return value.toLocaleString();
  }

  return value || t.common.dash;
};

const getOtherUserFromConnection = (connection, user) => {
  const userId = String(user?._id || user?.id || "");

  if (String(connection?.client?._id || connection?.client) === userId) {
    return connection?.lawyer;
  }

  return connection?.client;
};

const getBookingConnectionId = (booking) => {
  return String(booking?.connection?._id || booking?.connection || "");
};

const getConnectionBookingId = (connection) => {
  return String(connection?.booking?._id || connection?.booking || "");
};

const isBookingBasedConnection = (connection) => {
  return (
    connection?.sourceType === "booking" ||
    Boolean(connection?.booking?._id || connection?.booking)
  );
};

const getConnectionTitle = (connection, t) => {
  if (isBookingBasedConnection(connection)) {
    return connection?.booking?.subject || t.chat.appointmentConversation;
  }

  return connection?.post?.title || t.chat.caseConversation;
};

const getConnectionSubtitle = (connection, t, locale) => {
  if (isBookingBasedConnection(connection)) {
    const date = formatDate(
      connection?.booking?.requestedDate,
      locale,
      t.common.notAvailable
    );
    const time = connection?.booking?.requestedTime || t.chat.timeNotSet;
    const type = formatConsultationType(
      connection?.booking?.consultationType || "online"
    );

    return `${date} • ${time} • ${type}`;
  }

  return connection?.post?.category || t.chat.legalCaseChat;
};

const extractAttachmentLinks = (value = "") => {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isPossiblePhoneNumber = (value = "") => {
  const cleaned = String(value).replace(/[\s\-()+]/g, "");
  return /^\d{7,15}$/.test(cleaned);
};

const getHostnameFromTextUrl = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
};

const isGoogleDriveLink = (value = "") => {
  try {
    const normalized = value.startsWith("www.") ? `https://${value}` : value;
    const url = new URL(normalized);

    return (
      url.protocol === "https:" &&
      GOOGLE_DRIVE_HOSTS.includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

const isSocialMediaLink = (value = "") => {
  const host = getHostnameFromTextUrl(value);

  if (!host) return false;

  return SOCIAL_MEDIA_HOSTS.some(
    (blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`)
  );
};

const validateAttachmentLinks = (value = "", t) => {
  const links = extractAttachmentLinks(value);

  if (links.length === 0) {
    return {
      valid: true,
      links: [],
      message: "",
    };
  }

  for (const link of links) {
    if (isPossiblePhoneNumber(link)) {
      return {
        valid: false,
        links: [],
        message: t.validation.phoneAttachment,
      };
    }

    if (isSocialMediaLink(link)) {
      return {
        valid: false,
        links: [],
        message: t.validation.socialAttachment,
      };
    }

    if (!isGoogleDriveLink(link)) {
      return {
        valid: false,
        links: [],
        message: t.validation.driveAttachmentOnly,
      };
    }
  }

  return {
    valid: true,
    links,
    message: "",
  };
};

const validateChatMessageText = (value = "", t) => {
  const text = String(value || "").trim();

  BANGLADESH_PHONE_REGEX.lastIndex = 0;
  SOCIAL_HANDLE_REGEX.lastIndex = 0;
  URL_REGEX.lastIndex = 0;

  if (!text) {
    return {
      valid: false,
      message: t.validation.messageRequired,
    };
  }

  if (BANGLADESH_PHONE_REGEX.test(text)) {
    BANGLADESH_PHONE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message: t.validation.phoneBlocked,
    };
  }

  BANGLADESH_PHONE_REGEX.lastIndex = 0;

  const genericNumbers = text.match(GENERIC_PHONE_REGEX) || [];

  for (const item of genericNumbers) {
    const digitsOnly = item.replace(/\D/g, "");

    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return {
        valid: false,
        message: t.validation.phoneBlocked,
      };
    }
  }

  if (PAYMENT_KEYWORDS_REGEX.test(text) || BDT_PAYMENT_TEXT_REGEX.test(text)) {
    return {
      valid: false,
      message: t.validation.paymentBlocked,
    };
  }

  const urls = text.match(URL_REGEX) || [];

  for (const url of urls) {
    if (isSocialMediaLink(url)) {
      return {
        valid: false,
        message: t.validation.socialBlocked,
      };
    }

    if (!isGoogleDriveLink(url)) {
      return {
        valid: false,
        message: t.validation.externalBlocked,
      };
    }
  }

  if (SOCIAL_HANDLE_REGEX.test(text)) {
    SOCIAL_HANDLE_REGEX.lastIndex = 0;

    return {
      valid: false,
      message: t.validation.handleBlocked,
    };
  }

  SOCIAL_HANDLE_REGEX.lastIndex = 0;

  return {
    valid: true,
    message: "",
  };
};

const UserProfile = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const t =
    userProfileI18n[currentLanguage]?.userProfile ||
    userProfileI18n.en.userProfile;
  const locale = currentLanguage === "bn" ? "bn-BD" : "en-BD";

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [connections, setConnections] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [selectedChatConnectionId, setSelectedChatConnectionId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatAttachments, setChatAttachments] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [chatError, setChatError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: "",
    phone: "",
    city: "",
    officeAddress: "",
    bio: "",
    profileImage: null,
  });
  const [profilePreview, setProfilePreview] = useState("");

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (reduxUser) {
      setAuthUser(reduxUser);
      setToken(storedAuth.token);
      return;
    }

    setAuthUser(storedAuth.user);
    setToken(storedAuth.token);
  }, [reduxUser]);

  const user = authUser;

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fileAuthHeaders = useMemo(() => {
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const openEditProfileModal = useCallback(() => {
    setError("");
    setSuccessMessage("");
    setEditProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      city: user?.city || "",
      officeAddress: user?.officeAddress || "",
      bio: user?.bio || "",
      profileImage: null,
    });
    setProfilePreview(user?.profileImage || "");
    setShowEditProfile(true);
  }, [user]);

  const closeEditProfileModal = useCallback(() => {
    setShowEditProfile(false);
    setEditProfileForm({
      name: "",
      phone: "",
      city: "",
      officeAddress: "",
      bio: "",
      profileImage: null,
    });
    setProfilePreview("");
  }, []);

  const handleEditProfileChange = useCallback((field, value) => {
    setEditProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleEditProfileImageChange = useCallback((file) => {
    if (!file) return;

    const previewUrl = buildProfileImagePreview(file);

    setEditProfileForm((prev) => ({
      ...prev,
      profileImage: file,
    }));
    setProfilePreview(previewUrl);
  }, []);

  const handleUpdateProfile = useCallback(
    async (e) => {
      e.preventDefault();

      if (!token) {
        setError(t.messages.loginMissing);
        return;
      }

      if (user?.role !== "client") {
        setError(t.editProfile.clientOnlyError);
        return;
      }

      const cleanName = String(editProfileForm.name || "").trim();
      const cleanPhone = String(editProfileForm.phone || "").trim();

      if (!cleanName) {
        setError(t.editProfile.nameRequired);
        return;
      }

      if (!cleanPhone) {
        setError(t.editProfile.phoneRequired);
        return;
      }

      try {
        setUpdatingProfile(true);
        setError("");
        setSuccessMessage("");

        const formData = new FormData();
        formData.append("name", cleanName);
        formData.append("phone", cleanPhone);
        formData.append("city", String(editProfileForm.city || "").trim());
        formData.append(
          "officeAddress",
          String(editProfileForm.officeAddress || "").trim()
        );
        formData.append("bio", String(editProfileForm.bio || "").trim());

        if (editProfileForm.profileImage) {
          formData.append("profileImage", editProfileForm.profileImage);
        }

        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          method: "PATCH",
          headers: fileAuthHeaders,
          credentials: "include",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || t.editProfile.updateFailed);
        }

        const updatedUser = data.data || null;

        if (updatedUser) {
          setAuthUser((prev) => ({ ...prev, ...updatedUser }));
          updateStoredAuthUser(updatedUser);
        }

        setSuccessMessage(data.message || t.editProfile.updateSuccess);
        closeEditProfileModal();
      } catch (err) {
        setError(err.message || t.editProfile.updateFailed);
      } finally {
        setUpdatingProfile(false);
      }
    },
    [
      token,
      user?.role,
      editProfileForm,
      fileAuthHeaders,
      closeEditProfileModal,
      t.messages.loginMissing,
      t.editProfile,
    ]
  );

  const fetchActiveSubscription = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingSubscription(true);

      const res = await fetch(`${API_BASE_URL}/subscriptions/my/current`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setActiveSubscription(null);
        return;
      }

      setActiveSubscription(data.data || null);
    } catch {
      setActiveSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  }, [token, authHeaders]);

  const fetchSubscriptionHistory = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingHistory(true);

      const res = await fetch(
        `${API_BASE_URL}/subscriptions/my/history?limit=5`,
        {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setSubscriptionHistory([]);
        return;
      }

      setSubscriptionHistory(data.data || []);
    } catch {
      setSubscriptionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, authHeaders]);

  const fetchPayments = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingPayments(true);

      const res = await fetch(`${API_BASE_URL}/payments/my-payments?limit=5`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setPayments([]);
        return;
      }

      setPayments(data.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [token, authHeaders]);

  const fetchConnections = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingConnections(true);

      const res = await fetch(`${API_BASE_URL}/connections/my?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setConnections([]);
        return;
      }

      setConnections(data.data || []);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [token, authHeaders]);

  const fetchMyPosts = useCallback(async () => {
    if (!token || user?.role !== "client") return;

    try {
      setLoadingPosts(true);

      const res = await fetch(`${API_BASE_URL}/posts/client/my-posts?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setMyPosts([]);
        return;
      }

      setMyPosts(data.data || []);
    } catch {
      setMyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, authHeaders, user?.role]);

  const fetchMyAppointments = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingAppointments(true);

      const res = await fetch(`${API_BASE_URL}/bookings/my?limit=50`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setAppointments([]);
        return;
      }

      setAppointments(Array.isArray(data.data) ? data.data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [token, authHeaders]);

  const refreshProfileData = useCallback(async () => {
    try {
      setError("");
      setSuccessMessage("");

      await Promise.all([
        fetchActiveSubscription(),
        fetchSubscriptionHistory(),
        fetchPayments(),
        fetchConnections(),
        fetchMyPosts(),
        fetchMyAppointments(),
      ]);
    } catch {
      setError(t.messages.refreshProfileFailed);
    }
  }, [
    fetchActiveSubscription,
    fetchSubscriptionHistory,
    fetchPayments,
    fetchConnections,
    fetchMyPosts,
    fetchMyAppointments,
    t.messages,
  ]);

  useEffect(() => {
    if (token) refreshProfileData();
  }, [token, refreshProfileData]);

  const subscriptionStatus = useMemo(() => {
    if (activeSubscription?.status) return activeSubscription.status;
    return user?.subscriptionStatus || "none";
  }, [activeSubscription, user]);

  const hasActiveSubscription = useMemo(() => {
    return (
      activeSubscription?.status === "active" ||
      user?.subscriptionStatus === "active"
    );
  }, [activeSubscription?.status, user?.subscriptionStatus]);

  const canUseChat = useMemo(() => {
    if (user?.role === "admin") return true;
    return hasActiveSubscription;
  }, [hasActiveSubscription, user?.role]);

  const currentPlanName = useMemo(() => {
    return (
      activeSubscription?.planName ||
      activeSubscription?.plan?.name ||
      t.common.notAvailable
    );
  }, [activeSubscription, t.common.notAvailable]);

  const currentPlanPrice = useMemo(() => {
    if (!activeSubscription) return 0;
    return activeSubscription.price || activeSubscription.plan?.price || 0;
  }, [activeSubscription]);

  const currentPlanCurrency = useMemo(() => {
    return (
      activeSubscription?.currency ||
      activeSubscription?.plan?.currency ||
      "BDT"
    );
  }, [activeSubscription]);

  const activeFeatures = useMemo(() => {
    const features = { ...(activeSubscription?.features || {}) };

    if (canUseChat) {
      features.in_app_messaging = true;
    }

    return Object.entries(features).map(([key, value]) => ({
      key,
      value,
    }));
  }, [activeSubscription, canUseChat]);

  const acceptedConnections = useMemo(() => {
    return connections.filter((connection) => connection.status === "accepted");
  }, [connections]);

  const acceptedAppointmentConnections = useMemo(() => {
    const appointmentIds = new Set(
      appointments.map((booking) => String(booking?._id)).filter(Boolean)
    );

    const appointmentConnectionIds = new Set(
      appointments.map(getBookingConnectionId).filter(Boolean)
    );

    return acceptedConnections.filter((connection) => {
      const connectionId = String(connection?._id || "");
      const bookingId = getConnectionBookingId(connection);

      return (
        isBookingBasedConnection(connection) &&
        (appointmentConnectionIds.has(connectionId) ||
          appointmentIds.has(bookingId))
      );
    });
  }, [acceptedConnections, appointments]);

  const selectedChatConnection = useMemo(() => {
    return acceptedAppointmentConnections.find(
      (connection) => String(connection._id) === String(selectedChatConnectionId)
    );
  }, [acceptedAppointmentConnections, selectedChatConnectionId]);

  const pendingConnectionCount = useMemo(() => {
    return connections.filter((connection) => connection.status === "pending")
      .length;
  }, [connections]);

  const pendingProposalCount = useMemo(() => {
    return myPosts.reduce((total, post) => {
      return (
        total +
        (post.bids || []).filter((bid) => bid.status === "pending").length
      );
    }, 0);
  }, [myPosts]);

  const activeAppointmentCount = useMemo(() => {
    return appointments.filter((appointment) =>
      ["pending", "accepted"].includes(appointment.status)
    ).length;
  }, [appointments]);

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "overview",
        label: t.tabs.overview,
        icon: <RiProfileLine />,
        count: null,
      },
      {
        id: "connections",
        label: t.tabs.connections,
        icon: <FaHandshake />,
        count: pendingConnectionCount,
      },
      {
        id: "chat",
        label: t.tabs.chat,
        icon: <FaComments />,
        count: acceptedAppointmentConnections.length,
      },
      {
        id: "appointments",
        label: t.tabs.appointments,
        icon: <FaCalendarAlt />,
        count: activeAppointmentCount,
      },
    ];

    if (user?.role === "client") {
      baseTabs.push({
        id: "proposals",
        label: t.tabs.proposals,
        icon: <FaPaperPlane />,
        count: pendingProposalCount,
      });
    }

    baseTabs.push({
      id: "billing",
      label: t.tabs.billing,
      icon: <FaCreditCard />,
      count: null,
    });

    return baseTabs;
  }, [
    user?.role,
    pendingConnectionCount,
    pendingProposalCount,
    acceptedAppointmentConnections.length,
    activeAppointmentCount,
    t.tabs,
  ]);

  const fetchConnectionMessages = useCallback(
    async (connectionId) => {
      if (!token || !connectionId) return;

      try {
        setLoadingMessages(true);
        setChatError("");

        const res = await fetch(
          `${API_BASE_URL}/connections/${connectionId}/messages`,
          {
            method: "GET",
            headers: authHeaders,
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || t.messages.loadMessagesFailed);
        }

        setChatMessages(data.data || []);

        await fetch(`${API_BASE_URL}/connections/${connectionId}/messages/read`, {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        });
      } catch (err) {
        setChatMessages([]);
        setChatError(
          err.message || t.messages.chatLockedError
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, authHeaders, t.messages]
  );

  useEffect(() => {
    if (activeTab !== "chat") return;

    if (acceptedAppointmentConnections.length === 0) {
      setSelectedChatConnectionId("");
      setChatMessages([]);
      return;
    }

    const exists = acceptedAppointmentConnections.some(
      (connection) =>
        String(connection._id) === String(selectedChatConnectionId)
    );

    if (!selectedChatConnectionId || !exists) {
      setSelectedChatConnectionId(acceptedAppointmentConnections[0]._id);
    }
  }, [activeTab, acceptedAppointmentConnections, selectedChatConnectionId]);

  useEffect(() => {
    if (activeTab === "chat" && selectedChatConnectionId) {
      fetchConnectionMessages(selectedChatConnectionId);
    }
  }, [activeTab, selectedChatConnectionId, fetchConnectionMessages]);

  const handleCancelAppointment = async (bookingId) => {
    if (!token || !bookingId) return;

    const confirmed = window.confirm(
      t.messages.cancelConfirm
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(`cancel-booking-${bookingId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({
          cancelReason: t.messages.cancelReason,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || t.messages.cancelFailed);
      }

      setSuccessMessage(data.message || t.messages.cancelSuccess);
      await fetchMyAppointments();
      await fetchConnections();
    } catch (err) {
      setError(err.message || t.messages.cancelFailed);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleConnectionAction = async (connectionId, action) => {
    if (!token || !connectionId || !["accept", "reject"].includes(action)) return;

    try {
      setActionLoadingId(`${action}-${connectionId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${connectionId}/${action}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            responseMessage:
              action === "accept"
                ? t.messages.connectionAccepted
                : t.messages.connectionRejected,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || replaceTemplate(t.messages.connectionActionFailed, { action }));
      }

      setSuccessMessage(data.message || replaceTemplate(t.messages.connectionActionSuccess, { action }));
      await fetchConnections();

      if (action === "accept") {
        setSelectedChatConnectionId(connectionId);
        setActiveTab("chat");
      }
    } catch (err) {
      setError(err.message || replaceTemplate(t.messages.connectionActionFailed, { action }));
    } finally {
      setActionLoadingId("");
    }
  };

  const handleAcceptProposal = async (postId, bidId) => {
    if (!token || !postId || !bidId) return;

    try {
      setActionLoadingId(`accept-bid-${bidId}`);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `${API_BASE_URL}/posts/${postId}/accept-bid/${bidId}`,
        {
          method: "PATCH",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || t.messages.proposalAcceptFailed);
      }

      setSuccessMessage(data.message || t.messages.proposalAcceptSuccess);
      await fetchMyPosts();
      await fetchConnections();
      setActiveTab("chat");
    } catch (err) {
      setError(err.message || t.messages.proposalAcceptFailed);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!token || !selectedChatConnectionId) {
      setChatError(t.messages.selectConversationFirst);
      return;
    }

    const messageValidation = validateChatMessageText(chatMessage, t);

    if (!messageValidation.valid) {
      setChatError(messageValidation.message);
      return;
    }

    const attachmentValidation = validateAttachmentLinks(chatAttachments, t);

    if (!attachmentValidation.valid) {
      setChatError(attachmentValidation.message);
      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const res = await fetch(
        `${API_BASE_URL}/connections/${selectedChatConnectionId}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify({
            message: chatMessage.trim(),
            attachments: attachmentValidation.links,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || t.messages.sendMessageFailed);
      }

      setChatMessage("");
      setChatAttachments("");
      setShowAttachmentInput(false);

      const newMessages = data?.data?.connection?.messages || [];
      setChatMessages(newMessages);

      await fetchConnections();
    } catch (err) {
      setChatError(
        err.message || t.messages.sendMessageLocked
      );
    } finally {
      setSendingMessage(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-4xl text-white shadow-lg">
            <FaUserCircle />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-800">
            {t.messages.noUserTitle}
          </h2>

          <p className="mt-3 text-base leading-relaxed text-slate-500">
            {t.messages.noUserDesc}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mt-14 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 opacity-95" />
          <div className="absolute right-0 top-0 h-72 w-72 translate-x-20 -translate-y-20 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-20 translate-y-20 rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-3xl font-bold text-white shadow-xl backdrop-blur-md md:h-32 md:w-32 md:text-4xl"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.name || t.common.unnamedUser}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user?.name)
                  )}
                </motion.div>

                <div className="text-white">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                      {user?.name || t.common.unnamedUser}
                    </h1>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-semibold capitalize backdrop-blur-md">
                      {getStatusLabel(user?.role || "client", t)}
                    </span>
                  </div>

                  <p className="flex items-center gap-2 text-base text-white/90 md:text-lg">
                    <FaEnvelope className="text-white/90" />
                    {user?.email || t.common.notAvailable}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getSubscriptionBadgeStyle(
                        subscriptionStatus
                      )}`}
                    >
                      {t.hero.subscription}: {getStatusLabel(subscriptionStatus, t)}
                    </span>

                    <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                      {t.hero.joined}: {formatDate(user?.createdAt, locale, t.common.notAvailable)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  onClick={openEditProfileModal}
                  disabled={user?.role !== "client"}
                  whileHover={user?.role === "client" ? { scale: 1.03 } : {}}
                  whileTap={user?.role === "client" ? { scale: 0.97 } : {}}
                  className={`inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-cyan-700 shadow-lg transition-all hover:shadow-xl ${
                    user?.role !== "client" ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <FaRegEdit />
                  {t.hero.editProfile}
                </motion.button>

                <motion.button
                  onClick={refreshProfileData}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-slate-900/20 px-6 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-slate-900/30"
                >
                  <FaSyncAlt />
                  {t.hero.refresh}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-20 z-30 mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}

                {Number(tab.count) > 0 && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.id
                        ? "bg-white text-cyan-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
            {successMessage}
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewTab
            user={user}
            subscriptionStatus={subscriptionStatus}
            activeSubscription={activeSubscription}
            activeFeatures={activeFeatures}
            currentPlanName={currentPlanName}
            currentPlanPrice={currentPlanPrice}
            currentPlanCurrency={currentPlanCurrency}
            loadingSubscription={loadingSubscription}
            t={t}
            locale={locale}
          />
        )}

        {activeTab === "connections" && (
          <ConnectionsTab
            user={user}
            connections={connections}
            loading={loadingConnections}
            actionLoadingId={actionLoadingId}
            onAccept={(id) => handleConnectionAction(id, "accept")}
            onReject={(id) => handleConnectionAction(id, "reject")}
            onOpenChat={(id) => {
              setSelectedChatConnectionId(id);
              setActiveTab("chat");
            }}
            t={t}
            locale={locale}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            user={user}
            connections={acceptedAppointmentConnections}
            selectedConnectionId={selectedChatConnectionId}
            selectedConnection={selectedChatConnection}
            messages={chatMessages}
            loadingConnections={loadingConnections}
            loadingMessages={loadingMessages}
            sendingMessage={sendingMessage}
            chatMessage={chatMessage}
            chatAttachments={chatAttachments}
            showAttachmentInput={showAttachmentInput}
            chatError={chatError}
            canUseChat={canUseChat}
            onSelectConnection={setSelectedChatConnectionId}
            onMessageChange={(value) => {
              setChatMessage(value);
              setChatError("");
            }}
            onAttachmentsChange={(value) => {
              setChatAttachments(value);
              setChatError("");
            }}
            onToggleAttachmentInput={() => {
              setShowAttachmentInput((prev) => !prev);
              setChatError("");
            }}
            onClearAttachment={() => {
              setChatAttachments("");
              setShowAttachmentInput(false);
              setChatError("");
            }}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() =>
              selectedChatConnectionId &&
              fetchConnectionMessages(selectedChatConnectionId)
            }
            t={t}
            locale={locale}
          />
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab
            user={user}
            appointments={appointments}
            loading={loadingAppointments}
            actionLoadingId={actionLoadingId}
            onCancelAppointment={handleCancelAppointment}
            onRefreshAppointments={fetchMyAppointments}
            onOpenAppointmentChat={(connectionId) => {
              setSelectedChatConnectionId(connectionId);
              setActiveTab("chat");
            }}
            t={t}
            locale={locale}
          />
        )}

        {activeTab === "proposals" && user?.role === "client" && (
          <ProposalsTab
            posts={myPosts}
            loading={loadingPosts}
            actionLoadingId={actionLoadingId}
            onAcceptProposal={handleAcceptProposal}
            t={t}
            locale={locale}
          />
        )}

        {activeTab === "billing" && (
          <BillingTab
            activeSubscription={activeSubscription}
            subscriptionHistory={subscriptionHistory}
            payments={payments}
            loadingHistory={loadingHistory}
            loadingPayments={loadingPayments}
            fetchPayments={fetchPayments}
            t={t}
            locale={locale}
          />
        )}

        {showEditProfile && (
          <EditProfileModal
            user={user}
            form={editProfileForm}
            preview={profilePreview}
            loading={updatingProfile}
            t={t}
            onChange={handleEditProfileChange}
            onImageChange={handleEditProfileImageChange}
            onClose={closeEditProfileModal}
            onSubmit={handleUpdateProfile}
          />
        )}
      </div>
    </div>
  );
};


const EditProfileModal = ({
  user,
  form,
  preview,
  loading,
  t,
  onChange,
  onImageChange,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-xl md:px-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">
                {t.editProfile.badge}
              </p>

              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                {t.editProfile.title}
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {t.editProfile.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              aria-label={t.editProfile.close}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 md:p-8">
          {user?.role !== "client" && (
            <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-extrabold text-amber-800">
                {t.editProfile.clientOnlyTitle}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                {t.editProfile.clientOnlyDesc}
              </p>
            </div>
          )}

          <div className="mb-8 rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-white bg-cyan-100 text-cyan-700 shadow-md">
                {preview ? (
                  <img
                    src={preview}
                    alt={form.name || t.common.unnamedUser}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black">
                    {getInitials(form.name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {t.editProfile.photoTitle}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {t.editProfile.photoDesc}
                </p>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-700">
                  <FaCamera />
                  {t.editProfile.chooseImage}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loading || user?.role !== "client"}
                    onChange={(e) => onImageChange(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InputField
              label={t.editProfile.fullName}
              value={form.name}
              required
              icon={<FaUserCircle />}
              placeholder={t.editProfile.fullNamePlaceholder}
              disabled={loading || user?.role !== "client"}
              onChange={(value) => onChange("name", value)}
            />

            <InputField
              label={t.editProfile.phoneNumber}
              value={form.phone}
              required
              icon={<FaPhoneAlt />}
              placeholder={t.editProfile.phonePlaceholder}
              disabled={loading || user?.role !== "client"}
              onChange={(value) => onChange("phone", value)}
            />

            <InputField
              label={t.editProfile.city}
              value={form.city}
              icon={<FaMapMarkerAlt />}
              placeholder={t.editProfile.cityPlaceholder}
              disabled={loading || user?.role !== "client"}
              onChange={(value) => onChange("city", value)}
            />

            <InputField
              label={t.editProfile.officeAddress}
              value={form.officeAddress}
              icon={<FaBriefcase />}
              placeholder={t.editProfile.officeAddressPlaceholder}
              disabled={loading || user?.role !== "client"}
              onChange={(value) => onChange("officeAddress", value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-extrabold text-slate-700">
              {t.editProfile.bio}
            </label>
            <textarea
              value={form.bio}
              rows={5}
              maxLength={1000}
              placeholder={t.editProfile.bioPlaceholder}
              disabled={loading || user?.role !== "client"}
              onChange={(e) => onChange("bio", e.target.value)}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
              <span>{t.editProfile.bioHint}</span>
              <span>{String(form.bio || "").length}/1000</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {t.editProfile.cancel}
            </button>

            <button
              type="submit"
              disabled={loading || user?.role !== "client"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaCheck />
              {loading ? t.editProfile.saving : t.editProfile.saveChanges}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const InputField = ({
  label,
  value,
  placeholder,
  required = false,
  icon,
  disabled,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-extrabold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>
    </div>
  );
};

const ChatTab = ({
  user,
  connections,
  selectedConnectionId,
  selectedConnection,
  messages,
  loadingConnections,
  loadingMessages,
  sendingMessage,
  chatMessage,
  chatAttachments,
  showAttachmentInput,
  chatError,
  canUseChat,
  onSelectConnection,
  onMessageChange,
  onAttachmentsChange,
  onToggleAttachmentInput,
  onClearAttachment,
  onSendMessage,
  onRefreshMessages,
  t,
  locale,
}) => {
  const userId = String(user?._id || user?.id || "");
  const otherUser = getOtherUserFromConnection(selectedConnection, user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <FaComments className="text-cyan-700" />
              {t.chat.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.chat.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshMessages}
            disabled={!selectedConnectionId || loadingMessages}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
          >
            <FaSyncAlt />
            {t.chat.refreshChat}
          </button>
        </div>
      </div>

      {!canUseChat && (
        <div className="m-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FaLock />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-amber-800">
                {t.chat.activeSubscriptionRequired}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                {t.chat.subscriptionRequiredDesc}
              </p>

              <a
                href="/plans"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-amber-700"
              >
                <FaCrown />
                {t.chat.choosePlan}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-900">
              {t.chat.appointmentChats}
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600">
              {connections.length}
            </span>
          </div>

          {loadingConnections ? (
            <LoadingBox text={t.chat.loadingChats} />
          ) : connections.length === 0 ? (
            <EmptyBox text={t.chat.emptyChats} />
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => {
                const partner = getOtherUserFromConnection(connection, user);
                const isActive =
                  String(connection._id) === String(selectedConnectionId);
                const lastMessage =
                  connection.messages?.[connection.messages.length - 1];

                return (
                  <button
                    key={connection._id}
                    type="button"
                    onClick={() => onSelectConnection(connection._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-300 bg-white shadow-md"
                        : "border-slate-200 bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
                          isActive
                            ? "bg-cyan-600 text-white"
                            : "bg-cyan-50 text-cyan-700"
                        }`}
                      >
                        {getInitials(partner?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-extrabold text-slate-900">
                            {partner?.name || t.common.unknownUser}
                          </p>

                          <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-extrabold text-cyan-700">
                            {t.chat.appointment}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {getConnectionTitle(connection, t)}
                        </p>

                        <p className="mt-2 truncate text-xs text-slate-500">
                          {lastMessage?.message || t.chat.noMessagesYet}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-h-[620px] flex-col bg-white">
          {selectedConnection ? (
            <>
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-extrabold text-cyan-700">
                      {getInitials(otherUser?.name)}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {otherUser?.name || t.chat.conversation}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {getConnectionSubtitle(selectedConnection, t, locale)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-extrabold capitalize ${getConnectionBadgeStyle(
                      selectedConnection.status
                    )}`}
                  >
                    {selectedConnection.status}
                  </span>
                </div>
              </div>

              {chatError && (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {chatError}
                </div>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">
                {loadingMessages ? (
                  <LoadingBox text={t.chat.loadingMessages} />
                ) : messages.length === 0 ? (
                  <EmptyBox text={t.chat.emptyMessages} />
                ) : (
                  messages.map((item) => {
                    const senderId = String(item.sender?._id || item.sender);
                    const isMine = senderId === userId;

                    return (
                      <div
                        key={item._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-cyan-600 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-extrabold ${
                              isMine ? "text-cyan-50" : "text-slate-500"
                            }`}
                          >
                            {isMine ? t.chat.you : item.sender?.name || t.chat.user}
                          </p>

                          <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                            {item.message}
                          </p>

                          {item.attachments?.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.attachments.map((attachment, index) => (
                                <a
                                  key={`${attachment}-${index}`}
                                  href={attachment}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                                    isMine
                                      ? "bg-white/15 text-white"
                                      : "bg-slate-100 text-cyan-700"
                                  }`}
                                >
                                  <FaPaperclip />
                                  {replaceTemplate(t.chat.googleDriveAttachment, {
                                    index: index + 1,
                                  })}
                                </a>
                              ))}
                            </div>
                          )}

                          <p
                            className={`mt-2 text-[11px] font-medium ${
                              isMine ? "text-cyan-50/80" : "text-slate-400"
                            }`}
                          >
                            {formatDateTime(item.createdAt, locale, t.common.notAvailable)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={onSendMessage}
                className="border-t border-slate-200 bg-white p-5"
              >
                <div className="grid gap-3">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => onMessageChange(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder={
                      canUseChat
                        ? t.chat.writePlaceholder
                        : t.chat.lockedPlaceholder
                    }
                    disabled={!canUseChat || sendingMessage}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  {showAttachmentInput && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {t.chat.attachmentTitle}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {t.chat.attachmentDesc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={onClearAttachment}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                        >
                          <FaTimes />
                          {t.chat.remove}
                        </button>
                      </div>

                      <input
                        type="url"
                        value={chatAttachments}
                        onChange={(e) => onAttachmentsChange(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        disabled={!canUseChat || sendingMessage}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={onToggleAttachmentInput}
                        disabled={!canUseChat || sendingMessage}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          showAttachmentInput
                            ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <FaPaperclip />
                        {t.chat.attachment}
                      </button>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {chatMessage.length}/2000 {t.chat.characters}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-red-500">
                          {t.chat.blockedNote}
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !canUseChat || sendingMessage || !chatMessage.trim()
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaPaperPlane />
                      {sendingMessage ? t.chat.sending : t.chat.sendMessage}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyBox text={t.chat.selectChat} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OverviewTab = ({
  user,
  subscriptionStatus,
  activeSubscription,
  activeFeatures,
  currentPlanName,
  currentPlanPrice,
  currentPlanCurrency,
  loadingSubscription,
  t,
  locale,
}) => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
      <div className="space-y-8 xl:col-span-2">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-xl text-cyan-700">
              <RiProfileLine />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t.overview.personalTitle}
              </h2>

              <p className="text-sm text-slate-500">
                {t.overview.personalDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InfoCard
              icon={<FaUserCircle />}
              label={t.labels.fullName}
              value={user?.name || t.common.notAvailable}
            />

            <InfoCard
              icon={<FaEnvelope />}
              label={t.labels.emailAddress}
              value={user?.email || t.common.notAvailable}
            />

            <InfoCard
              icon={<FaPhoneAlt />}
              label={t.labels.phoneNumber}
              value={user?.phone || t.common.notAvailable}
            />

            <InfoCard
              icon={<FaUserShield />}
              label={t.labels.userRole}
              value={getStatusLabel(user?.role || "client", t)}
              capitalize
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700">
              <FaBalanceScale />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t.overview.legalTitle}
              </h2>

              <p className="text-sm text-slate-500">
                {t.overview.legalDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InfoCard
              icon={<FaIdCard />}
              label={t.labels.nationalId}
              value={user?.nid || t.common.notAvailable}
            />

            <InfoCard
              icon={<FaBalanceScale />}
              label={t.labels.lawRegistrationNumber}
              value={user?.lawRegNumber || t.common.notAvailable}
            />

            <InfoCard
              icon={<MdVerifiedUser />}
              label={t.labels.phoneVerification}
              value={user?.phoneVerified ? t.status.verified : t.status.notVerified}
            />

            <InfoCard
              icon={<FaCalendarAlt />}
              label={t.labels.accountCreated}
              value={formatDate(user?.createdAt, locale, t.common.notAvailable)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t.overview.summaryTitle}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t.overview.summaryDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <SummaryCard
              title={t.labels.currentRole}
              value={getStatusLabel(user?.role || "client", t)}
              icon={<FaUserShield />}
              styleClass={getRoleBadgeStyle(user?.role)}
            />

            <SummaryCard
              title={t.labels.subscription}
              value={getStatusLabel(subscriptionStatus, t)}
              icon={<MdSubscriptions />}
              styleClass={getSubscriptionBadgeStyle(subscriptionStatus)}
            />

            <SummaryCard
              title={t.labels.phoneStatus}
              value={user?.phoneVerified ? t.status.verified : t.status.unverified}
              icon={user?.phoneVerified ? <FaCheckCircle /> : <FaTimesCircle />}
              styleClass={
                user?.phoneVerified
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }
            />
          </div>
        </motion.div>
      </div>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-xl text-white shadow-md">
              <FaCrown />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {t.overview.subscriptionPlan}
              </h3>

              <p className="text-sm text-slate-500">
                {t.overview.subscriptionPlanDesc}
              </p>
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 ${getSubscriptionBadgeStyle(
              subscriptionStatus
            )}`}
          >
            <p className="mb-2 text-sm font-medium">{t.overview.status}</p>

            <h4 className="text-2xl font-extrabold capitalize">
              {getStatusLabel(subscriptionStatus, t)}
            </h4>
          </div>

          <div className="mt-5 space-y-4">
            <MiniDetail label={t.overview.currentPlan} value={currentPlanName} />

            <MiniDetail
              label={t.overview.price}
              value={
                activeSubscription
                  ? formatCurrency(currentPlanPrice, currentPlanCurrency, locale)
                  : t.common.notAvailable
              }
            />

            <MiniDetail
              label={t.overview.startDate}
              value={formatDate(activeSubscription?.startDate, locale, t.common.notAvailable)}
            />

            <MiniDetail
              label={t.overview.endDate}
              value={formatDate(activeSubscription?.endDate, locale, t.common.notAvailable)}
            />

            <MiniDetail
              label={t.overview.accountType}
              value={(user?.role || "client").toUpperCase()}
            />
          </div>

          <a
            href="/plans"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl"
          >
            Manage Subscription
            <FaArrowRight />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-xl text-cyan-700">
              <MdWorkspacePremium />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {t.overview.planFeatures}
              </h3>

              <p className="text-sm text-slate-500">
                {t.overview.planFeaturesDesc}
              </p>
            </div>
          </div>

          {loadingSubscription ? (
            <LoadingBox text={t.overview.loadingFeatures} />
          ) : activeFeatures.length === 0 ? (
            <EmptyBox text={t.overview.noPlanFeatures} />
          ) : (
            <div className="space-y-3">
              {activeFeatures.slice(0, 8).map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="min-w-0 truncate text-sm font-bold text-slate-700 capitalize">
                    {feature.key.replaceAll("_", " ")}
                  </p>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-900">
                    {getFeatureDisplayValue(feature.value, t)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <h3 className="mb-5 text-xl font-bold text-slate-800">
            {t.overview.verificationStatus}
          </h3>

          <div className="space-y-4">
            <StatusRow icon={<FaEnvelope />} label={t.labels.emailAvailable} status={!!user?.email} t={t} />
            <StatusRow icon={<FaPhoneAlt />} label={t.labels.phoneAdded} status={!!user?.phone} t={t} />
            <StatusRow icon={<MdVerifiedUser />} label={t.labels.phoneVerified} status={!!user?.phoneVerified} t={t} />
            <StatusRow icon={<FaBalanceScale />} label={t.labels.lawyerCredentials} status={!!user?.lawRegNumber} t={t} />
            <StatusRow icon={<FaIdCard />} label={t.labels.nidSubmitted} status={!!user?.nid} t={t} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ConnectionsTab = ({
  user,
  connections,
  loading,
  actionLoadingId,
  onAccept,
  onReject,
  onOpenChat,
  t,
  locale,
}) => {
  const incomingPending = connections.filter((connection) => {
    const requestedById = connection.requestedBy?._id || connection.requestedBy;
    const userId = user?._id || user?.id;

    return (
      connection.status === "pending" &&
      String(requestedById) !== String(userId)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {t.connections.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.connections.desc}
          </p>
        </div>

        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700">
          {t.connections.pending}: {incomingPending.length}
        </span>
      </div>

      {loading ? (
        <LoadingBox text={t.connections.loading} />
      ) : connections.length === 0 ? (
        <EmptyBox text={t.connections.empty} />
      ) : (
        <div className="space-y-5">
          {connections.map((connection) => {
            const requestedById =
              connection.requestedBy?._id || connection.requestedBy;
            const userId = user?._id || user?.id;
            const canRespond =
              connection.status === "pending" &&
              String(requestedById) !== String(userId);

            return (
              <div
                key={connection._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getConnectionBadgeStyle(
                          connection.status
                        )}`}
                      >
                        {getStatusLabel(connection.status, t)}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {connection.post?.category || t.common.case}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900">
                      {connection.post?.title || t.connections.untitledCase}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {connection.requestMessage || t.connections.noRequestMessage}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <MiniDetail
                        label={t.labels.client}
                        value={connection.client?.name || "-"}
                      />

                      <MiniDetail
                        label={t.labels.lawyer}
                        value={connection.lawyer?.name || "-"}
                      />

                      <MiniDetail
                        label={t.labels.requested}
                        value={formatDateTime(connection.createdAt, locale, t.common.notAvailable)}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3">
                    {canRespond && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAccept(connection._id)}
                          disabled={
                            actionLoadingId === `accept-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-green-700 disabled:opacity-60"
                        >
                          <FaCheck />
                          {actionLoadingId === `accept-${connection._id}`
                            ? t.connections.accepting
                            : t.connections.acceptRequest}
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject(connection._id)}
                          disabled={
                            actionLoadingId === `reject-${connection._id}`
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          <FaTimes />
                          {actionLoadingId === `reject-${connection._id}`
                            ? t.connections.rejecting
                            : t.connections.reject}
                        </button>
                      </>
                    )}

                    {connection.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(connection._id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                      >
                        <FaComments />
                        {t.connections.openChat}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const ProposalsTab = ({
  posts,
  loading,
  actionLoadingId,
  onAcceptProposal,
  t,
  locale,
}) => {
  const postsWithBids = posts.filter((post) => post.bids?.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {t.proposals.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.proposals.desc}
          </p>
        </div>

        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700">
          {t.proposals.cases}: {postsWithBids.length}
        </span>
      </div>

      {loading ? (
        <LoadingBox text={t.proposals.loading} />
      ) : postsWithBids.length === 0 ? (
        <EmptyBox text={t.proposals.empty} />
      ) : (
        <div className="space-y-6">
          {postsWithBids.map((post) => (
            <div
              key={post._id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
            >
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 capitalize">
                    {getStatusLabel(post.status || "open", t)}
                  </span>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 capitalize">
                    {post.category || t.common.case}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {post.title || t.proposals.untitledCase}
                </h3>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <FaBriefcase />
                    {t.labels.budget}: {formatCurrency(post.budgetMin || 0, "BDT", locale)} -{" "}
                    {formatCurrency(post.budgetMax || 0, "BDT", locale)}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <FaMapMarkerAlt />
                    {[post.division, post.district].filter(Boolean).join(", ") ||
                      t.proposals.locationNotSpecified}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <FaGavel />
                    {t.labels.proposals}: {post.bids?.length || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {post.bids.map((bid) => {
                  const lawyer = bid.lawyer || {};
                  const isAcceptedPost = post.status === "in_progress";
                  const canAccept =
                    post.status === "open" && bid.status === "pending";

                  return (
                    <div
                      key={bid._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getBidBadgeStyle(
                                bid.status
                              )}`}
                            >
                              {getStatusLabel(bid.status, t)}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                              {formatDateTime(bid.createdAt, locale, t.common.notAvailable)}
                            </span>
                          </div>

                          <h4 className="text-lg font-extrabold text-slate-900">
                            {lawyer.name || t.common.unknownLawyer}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {t.labels.reg}: {lawyer.lawRegNumber || t.common.notAvailable} •{" "}
                            {lawyer.email || t.common.noEmail}
                          </p>

                          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                            {bid.message || t.proposals.noProposalMessage}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <MiniDetail
                              label={t.labels.proposedFee}
                              value={formatCurrency(bid.proposedFee, "BDT", locale)}
                            />

                            <MiniDetail
                              label={t.labels.estimatedDays}
                              value={`${bid.estimatedDays || 0} ${t.proposals.days}`}
                            />
                          </div>
                        </div>

                        <div className="min-w-[220px]">
                          <button
                            type="button"
                            onClick={() => onAcceptProposal(post._id, bid._id)}
                            disabled={
                              !canAccept ||
                              actionLoadingId === `accept-bid-${bid._id}`
                            }
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed ${
                              canAccept
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <FaCheck />
                            {actionLoadingId === `accept-bid-${bid._id}`
                              ? t.proposals.accepting
                              : bid.status === "accepted"
                              ? t.proposals.accepted
                              : isAcceptedPost
                              ? t.proposals.caseInProgress
                              : t.proposals.acceptProposal}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};


const getAppointmentBadgeStyle = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "completed":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const formatConsultationType = (value = "") => {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const AppointmentsTab = ({
  user,
  appointments,
  loading,
  actionLoadingId,
  onCancelAppointment,
  onRefreshAppointments,
  onOpenAppointmentChat,
  t,
  locale,
}) => {
  const upcomingAppointments = useMemo(() => {
    return appointments.filter((booking) =>
      ["pending", "accepted"].includes(booking.status)
    );
  }, [appointments]);

  const completedAppointments = useMemo(() => {
    return appointments.filter((booking) =>
      ["completed", "cancelled", "rejected"].includes(booking.status)
    );
  }, [appointments]);

  const renderAppointmentCard = (booking) => {
    const isClient = user?.role === "client";
    const otherPerson = isClient ? booking.lawyer : booking.client;
    const canCancel = ["pending", "accepted"].includes(booking.status);
    const isCancelling = actionLoadingId === `cancel-booking-${booking._id}`;
    const bookingConnectionId = getBookingConnectionId(booking);
    const canOpenChat =
      booking.status === "accepted" && Boolean(bookingConnectionId);

    return (
      <div
        key={booking._id}
        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getAppointmentBadgeStyle(
                  booking.status
                )}`}
              >
                {getStatusLabel(booking.status || "unknown", t)}
              </span>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 capitalize">
                {formatConsultationType(booking.consultationType || "online")}
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                {t.labels.booked}: {formatDateTime(booking.createdAt, locale, t.common.notAvailable)}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              {booking.subject || t.appointments.appointment}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {booking.message || t.appointments.noExtraMessage}
            </p>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <MiniDetail
                label={isClient ? t.labels.lawyer : t.labels.client}
                value={otherPerson?.name || "-"}
              />

              <MiniDetail
                label={t.labels.date}
                value={formatDate(booking.requestedDate, locale, t.common.notAvailable)}
              />

              <MiniDetail
                label={t.labels.time}
                value={booking.requestedTime || "-"}
              />

              <MiniDetail
                label={t.labels.fee}
                value={
                  booking.lawyer?.consultationFee
                    ? formatCurrency(booking.lawyer.consultationFee, "BDT", locale)
                    : t.common.notSet
                }
              />
            </div>

            {booking.responseMessage && (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800">
                {booking.responseMessage}
              </div>
            )}

            {booking.cancelReason && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                {t.labels.cancelReason}: {booking.cancelReason}
              </div>
            )}
          </div>

          <div className="flex min-w-[220px] flex-col gap-3">
            {canOpenChat ? (
              <button
                type="button"
                onClick={() => onOpenAppointmentChat(bookingConnectionId)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
              >
                <FaComments />
                {t.appointments.openChat}
              </button>
            ) : booking.status === "accepted" ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-extrabold text-slate-500"
              >
                <FaLock />
                {t.appointments.chatNotReady}
              </button>
            ) : null}

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancelAppointment(booking._id)}
                disabled={isCancelling}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                <FaTimes />
                {isCancelling ? t.appointments.cancelling : t.appointments.cancelAppointment}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
            <FaCalendarAlt className="text-cyan-700" />
            {t.appointments.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.appointments.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshAppointments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} />
          {t.hero.refresh}
        </button>
      </div>

      {loading ? (
        <LoadingBox text={t.appointments.loading} />
      ) : appointments.length === 0 ? (
        <EmptyBox text={t.appointments.empty} />
      ) : (
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.appointments.upcoming}
              </h3>
              <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700">
                {upcomingAppointments.length}
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyBox text={t.appointments.noUpcoming} />
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.appointments.history}
              </h3>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700">
                {completedAppointments.length}
              </span>
            </div>

            {completedAppointments.length === 0 ? (
              <EmptyBox text={t.appointments.noHistory} />
            ) : (
              <div className="space-y-4">
                {completedAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const BillingTab = ({
  activeSubscription,
  subscriptionHistory,
  payments,
  loadingHistory,
  loadingPayments,
  fetchPayments,
  t,
  locale,
}) => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl text-violet-700">
              <FaHistory />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t.billing.subscriptionHistory}
              </h2>

              <p className="text-sm text-slate-500">
                {t.billing.subscriptionHistoryDesc}
              </p>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <LoadingBox text={t.billing.loadingSubscriptionHistory} />
        ) : subscriptionHistory.length === 0 ? (
          <EmptyBox text={t.billing.emptySubscriptionHistory} />
        ) : (
          <div className="space-y-4">
            {subscriptionHistory.map((sub) => (
              <div
                key={sub._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {sub.planName || sub.plan?.name || t.common.unknownPlan}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {sub.planSlug || sub.plan?.slug || "-"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getSubscriptionBadgeStyle(
                      sub.status
                    )}`}
                  >
                    {getStatusLabel(sub.status, t)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <MiniDetail
                    label={t.overview.price}
                    value={formatCurrency(sub.price, sub.currency, locale)}
                  />

                  <MiniDetail label={t.labels.start} value={formatDate(sub.startDate, locale, t.common.notAvailable)} />

                  <MiniDetail label={t.labels.end} value={formatDate(sub.endDate, locale, t.common.notAvailable)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-xl text-green-700">
              <FaReceipt />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {t.billing.paymentHistory}
              </h2>

              <p className="text-sm text-slate-500">
                {t.billing.paymentHistoryDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPayments}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            {t.billing.refresh}
          </button>
        </div>

        {loadingPayments ? (
          <LoadingBox text={t.billing.loadingPaymentHistory} />
        ) : payments.length === 0 ? (
          <EmptyBox text={t.billing.emptyPaymentHistory} />
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {payment.planName || t.billing.planPayment}
                    </h3>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      {t.labels.txn}: {payment.transactionId || t.common.dash}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${getPaymentBadgeStyle(
                      payment.paymentStatus
                    )}`}
                  >
                    {getStatusLabel(payment.paymentStatus, t)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <MiniDetail
                    label={t.labels.amount}
                    value={formatCurrency(
                      payment.amount,
                      payment.currency || "BDT",
                      locale
                    )}
                  />

                  <MiniDetail label={t.labels.method} value={payment.method || t.common.dash} />

                  <MiniDetail
                    label={t.labels.submitted}
                    value={formatDateTime(
                      payment.paymentDate || payment.createdAt,
                      locale,
                      t.common.notAvailable
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, capitalize = false }) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-lg text-cyan-700 shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <h4
            className={`mt-1 break-words text-base font-bold text-slate-800 ${
              capitalize ? "capitalize" : ""
            }`}
          >
            {value}
          </h4>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryCard = ({ title, value, icon, styleClass }) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className="text-lg text-slate-600">{icon}</div>
      </div>

      <div
        className={`inline-flex rounded-full px-4 py-2 text-sm font-bold capitalize ${styleClass}`}
      >
        {value}
      </div>
    </motion.div>
  );
};

const MiniDetail = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 break-words font-semibold capitalize text-slate-800">
        {value}
      </p>
    </div>
  );
};

const StatusRow = ({ icon, label, status, t }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-cyan-700">
          {icon}
        </div>

        <span className="font-medium text-slate-700">{label}</span>
      </div>

      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
          status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {status ? <FaCheckCircle /> : <FaTimesCircle />}
        {status ? t.common.done : t.common.missing}
      </div>
    </div>
  );
};

const LoadingBox = ({ text }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600">
      <FaClock className="animate-pulse text-cyan-600" />
      {text}
    </div>
  );
};

const EmptyBox = ({ text }) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
};

export default UserProfile;
