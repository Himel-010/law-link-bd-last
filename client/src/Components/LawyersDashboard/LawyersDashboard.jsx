"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Scale, Mail, Phone, BadgeCheck, ShieldCheck, Crown, Loader2, AlertCircle,
  RefreshCcw, Briefcase, MessageCircle, Handshake, Send, CheckCircle2, XCircle,
  Wallet, CalendarDays, UserRound, Paperclip, Lock, RotateCcw, X, Camera, ImagePlus,
  MapPin, FileText, Clock, Save, UserCog, Building2
} from "lucide-react";
import { motion } from "framer-motion";

import lawyerDashboardI18n from "../../json/lawyerDashboard.json";

const normalizeApiBaseUrl = (value = "") => {
  const fallback = "https://law-link-bd-last.vercel.app";
  const raw = String(value || fallback).trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const POST_STATUSES = ["open", "in_progress", "closed", "cancelled"];
const LAWYER_SPECIALIZATIONS = [
  "Family Law", "Criminal Law", "Property Law", "Corporate Law", "Immigration Law",
  "Employment Law", "Tax Law", "Civil Law", "Cyber Law", "Other",
];
const LAWYER_AVAILABILITY = ["available", "busy", "offline"];


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
const SOCIAL_HANDLE_REGEX = /(^|\s)@([a-zA-Z0-9._]{3,30})(?=\s|$|[.,!?])/g;
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

  try {
    if (localToken && localUser) return { user: JSON.parse(localUser), token: localToken };
    if (sessionToken && sessionUser) return { user: JSON.parse(sessionUser), token: sessionToken };
  } catch {
    return { user: null, token: "" };
  }

  return { user: null, token: "" };
};

const saveStoredUser = (user) => {
  if (localStorage.getItem("token")) localStorage.setItem("currentUser", JSON.stringify(user));
  if (sessionStorage.getItem("token")) sessionStorage.setItem("currentUser", JSON.stringify(user));
};

const getLocale = (language) => (language === "bn" ? "bn-BD" : "en-BD");

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);
  if (!parts.length) return "L";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "L";
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDate = (value, language = "en") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(getLocale(language), { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (value, language = "en") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(getLocale(language), {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const toInputDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getTodayInput = () => toInputDate(new Date());

const getFutureInput = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputDate(date);
};

const normalizeSlotText = (value = "") =>
  String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);

const formatCurrency = (value, currency = "BDT", language = "en") => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(amount);
};

const readableFeature = (value, t) => {
  if (value === true) return t.common.enabled;
  if (value === false) return t.common.no;
  if (Number(value) === 999999 || Number(value) === 9999) return t.common.unlimited;
  if (value === null || value === undefined || value === "") return t.common.basic;
  return value;
};

const getFeatureValue = (features = {}, key) => {
  if (!features || typeof features !== "object") return null;
  return features[key];
};

const textStatus = (value = "", t) => t.status?.[String(value).toLowerCase()] || value || "-";
const textSpecialization = (value = "", t) => t.specializations?.[value] || value || "-";
const textAvailability = (value = "", t) => t.availabilityOptions?.[value] || value || "-";

const getSubscriptionBadgeClass = (status) => {
  switch (status) {
    case "active": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending": return "border-amber-200 bg-amber-50 text-amber-700";
    case "expired": return "border-red-200 bg-red-50 text-red-700";
    default: return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

const getApprovalBadgeClass = (approved) =>
  approved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700";

const isLawyerApproved = (user) =>
  Boolean(user?.profileCompleted === true && user?.phoneVerified === 1 && user?.isVerifiedLawyer === true);

const getOtherUser = (connection, user) => {
  const userId = String(user?._id || user?.id || "");
  if (String(connection?.client?._id || connection?.client) === userId) return connection?.lawyer;
  return connection?.client;
};

const isAppointmentConnection = (connection) =>
  connection?.sourceType === "booking" && connection?.status === "accepted" && Boolean(connection?.booking);

const isMyBid = (bid, user) => {
  const userId = String(user?._id || user?.id || "");
  const lawyerId = String(bid?.lawyer?._id || bid?.lawyer || "");
  return userId && lawyerId && userId === lawyerId;
};


const extractAttachmentLinks = (value = "") =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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
    return { valid: true, links: [], message: "" };
  }

  for (const link of links) {
    if (isPossiblePhoneNumber(link)) {
      return {
        valid: false,
        links: [],
        message: t.validation.attachmentPhone || "Phone numbers cannot be shared as attachments.",
      };
    }

    if (isSocialMediaLink(link)) {
      return {
        valid: false,
        links: [],
        message:
          t.validation.attachmentSocial ||
          "Social media links are not allowed. Only Google Drive links can be shared.",
      };
    }

    if (!isGoogleDriveLink(link)) {
      return {
        valid: false,
        links: [],
        message:
          t.validation.attachmentDriveOnly ||
          "Only Google Drive links are allowed as attachments.",
      };
    }
  }

  return { valid: true, links, message: "" };
};

const validateChatMessageText = (value = "", t) => {
  const text = String(value || "").trim();

  BANGLADESH_PHONE_REGEX.lastIndex = 0;
  SOCIAL_HANDLE_REGEX.lastIndex = 0;
  URL_REGEX.lastIndex = 0;

  if (!text) {
    return { valid: false, message: t.validation.messageRequired };
  }

  if (BANGLADESH_PHONE_REGEX.test(text)) {
    BANGLADESH_PHONE_REGEX.lastIndex = 0;
    return {
      valid: false,
      message:
        t.validation.phoneBlocked ||
        "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
    };
  }

  BANGLADESH_PHONE_REGEX.lastIndex = 0;

  const genericNumbers = text.match(GENERIC_PHONE_REGEX) || [];
  for (const item of genericNumbers) {
    const digitsOnly = item.replace(/\D/g, "");
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return {
        valid: false,
        message:
          t.validation.phoneBlocked ||
          "Phone numbers or payment numbers cannot be shared in chat. Please use the platform conversation only.",
      };
    }
  }

  if (PAYMENT_KEYWORDS_REGEX.test(text) || BDT_PAYMENT_TEXT_REGEX.test(text)) {
    return {
      valid: false,
      message:
        t.validation.paymentBlocked ||
        "Payment numbers, BDT payment details, bKash, Nagad, Rocket, or similar payment information cannot be shared in chat.",
    };
  }

  const urls = text.match(URL_REGEX) || [];
  for (const url of urls) {
    if (isSocialMediaLink(url)) {
      return {
        valid: false,
        message:
          t.validation.socialBlocked ||
          "Social media links are not allowed in chat.",
      };
    }

    if (!isGoogleDriveLink(url)) {
      return {
        valid: false,
        message:
          t.validation.externalBlocked ||
          "External links are not allowed in chat. Only Google Drive links can be shared using the attachment option.",
      };
    }
  }

  if (SOCIAL_HANDLE_REGEX.test(text)) {
    SOCIAL_HANDLE_REGEX.lastIndex = 0;
    return {
      valid: false,
      message:
        t.validation.handleBlocked ||
        "Social media handles are not allowed in chat. Please continue communication inside the platform.",
    };
  }

  SOCIAL_HANDLE_REGEX.lastIndex = 0;

  return { valid: true, message: "" };
};

const LawyerDashboard = () => {
  const reduxUser = useSelector((state) => state.user.currentUser);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const t = lawyerDashboardI18n[currentLanguage]?.lawyerDashboard || lawyerDashboardI18n.en.lawyerDashboard;

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [connections, setConnections] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availabilityList, setAvailabilityList] = useState([]);

  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachmentText, setAttachmentText] = useState("");
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilitySuccess, setAvailabilitySuccess] = useState("");
  const [chatError, setChatError] = useState("");

  const [availabilityStartDate, setAvailabilityStartDate] = useState(getTodayInput());
  const [availabilityEndDate, setAvailabilityEndDate] = useState(getFutureInput(30));
  const [availabilityForm, setAvailabilityForm] = useState({
    date: getTodayInput(),
    slotsText: "09:00 AM\n10:00 AM\n11:00 AM",
    consultationTypes: ["online"],
    note: "",
  });

  const [blockRangeForm, setBlockRangeForm] = useState({
    startDate: getTodayInput(),
    endDate: getFutureInput(7),
    reason: "",
  });

  const [profilePreview, setProfilePreview] = useState("");
  const [profileForm, setProfileForm] = useState({
    specialization: "", experienceYears: "", bio: "", officeAddress: "",
    city: "", consultationFee: "", availability: "available", profileImage: null,
  });

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
  const lawyerApproved = isLawyerApproved(user);

  const authHeaders = useMemo(() => token ? {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } : {}, [token]);

  const authOnlyHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const activeFeatures = activeSubscription?.features || {};
  const hasActiveSubscription = activeSubscription?.status === "active" || user?.subscriptionStatus === "active";
  const canUseChat = user?.role === "admin" ? true : hasActiveSubscription;

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      specialization: user.specialization || "",
      experienceYears: user.experienceYears !== undefined && user.experienceYears !== null ? String(user.experienceYears) : "",
      bio: user.bio || "",
      officeAddress: user.officeAddress || "",
      city: user.city || "",
      consultationFee: user.consultationFee !== undefined && user.consultationFee !== null ? String(user.consultationFee) : "",
      availability: user.availability || "available",
      profileImage: null,
    });
    setProfilePreview(user.profileImage || "");
  }, [user]);

  const fetchMe = useCallback(async () => {
    if (!token) return null;
    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_BASE_URL}/users/me`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) return null;
      const updatedUser = data.data || null;
      if (updatedUser) {
        setAuthUser(updatedUser);
        saveStoredUser(updatedUser);
      }
      return updatedUser;
    } catch {
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [token, authHeaders]);

  const fetchActiveSubscription = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_BASE_URL}/subscriptions/my/current`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      setActiveSubscription(res.ok && data?.success ? data.data || null : null);
    } catch {
      setActiveSubscription(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [token, authHeaders]);

  const fetchConnections = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingConnections(true);
      const res = await fetch(`${API_BASE_URL}/connections/my?limit=50`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      setConnections(res.ok && data?.success ? data.data || [] : []);
    } catch {
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [token, authHeaders]);

  const fetchMyAppointments = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;
    try {
      setLoadingAppointments(true);
      const res = await fetch(`${API_BASE_URL}/bookings/my?limit=50`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      setAppointments(res.ok && data?.success && Array.isArray(data.data) ? data.data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [token, user?.role, authHeaders]);

  const fetchAllPostsForBids = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;
    try {
      setLoadingPosts(true);
      const responses = await Promise.all(
        POST_STATUSES.map(async (status) => {
          const res = await fetch(`${API_BASE_URL}/posts?status=${status}&limit=100`, { method: "GET", headers: authHeaders, credentials: "include" });
          const data = await res.json();
          if (!res.ok || !data?.success) return [];
          return data.data || [];
        })
      );
      const merged = responses.flat();
      const unique = Array.from(new Map(merged.map((post) => [post._id, post])).values());
      setAllPosts(unique);
    } catch {
      setAllPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, user?.role, authHeaders]);

  const fetchMyAvailability = useCallback(async () => {
    if (!token || user?.role !== "lawyer") return;
    try {
      setLoadingAvailability(true);
      setAvailabilityError("");
      const params = new URLSearchParams();
      params.set("startDate", availabilityStartDate);
      params.set("endDate", availabilityEndDate);
      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my?${params.toString()}`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.availabilityFailed);
      setAvailabilityList(data.data || []);
    } catch (err) {
      setAvailabilityList([]);
      setAvailabilityError(err.message || t.validation.availabilityFailed);
    } finally {
      setLoadingAvailability(false);
    }
  }, [token, user?.role, authHeaders, availabilityStartDate, availabilityEndDate, t]);

  const refreshDashboard = useCallback(async () => {
    setError("");
    setSuccessMessage("");
    await Promise.all([fetchMe(), fetchActiveSubscription(), fetchConnections(), fetchMyAppointments(), fetchAllPostsForBids(), fetchMyAvailability()]);
  }, [fetchMe, fetchActiveSubscription, fetchConnections, fetchMyAppointments, fetchAllPostsForBids, fetchMyAvailability]);

  useEffect(() => {
    if (token && user) refreshDashboard();
  }, [token, user?._id, user?.id, refreshDashboard]);

  const myBids = useMemo(() => {
    const result = [];
    allPosts.forEach((post) => {
      (post.bids || []).forEach((bid) => {
        if (isMyBid(bid, user)) result.push({ post, bid });
      });
    });
    return result.sort((a, b) => new Date(b.bid.createdAt || b.post.createdAt) - new Date(a.bid.createdAt || a.post.createdAt));
  }, [allPosts, user]);

  const pendingBids = myBids.filter((item) => item.bid.status === "pending");
  const acceptedBids = myBids.filter((item) => item.bid.status === "accepted");
  const rejectedBids = myBids.filter((item) => item.bid.status === "rejected");
  const pendingConnections = connections.filter((connection) => connection.status === "pending" && connection.sourceType !== "booking");
  const appointmentConnections = connections.filter(isAppointmentConnection);
  const selectedConnection = appointmentConnections.find((connection) => String(connection._id) === String(selectedConnectionId));
  const upcomingAppointments = appointments.filter((booking) => ["pending", "accepted"].includes(booking.status));
  const completedAppointments = appointments.filter((booking) => ["completed", "cancelled", "rejected"].includes(booking.status));

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError(t.validation.imageOnly);
      return;
    }
    setProfileForm((prev) => ({ ...prev, profileImage: file }));
    setProfilePreview(URL.createObjectURL(file));
    setProfileError("");
  };

  const validateProfileForm = () => {
    if (!profileForm.specialization) return t.validation.specialization;
    if (profileForm.experienceYears === "") return t.validation.experienceRequired;
    if (Number(profileForm.experienceYears) < 0 || Number(profileForm.experienceYears) > 80) return t.validation.experienceRange;
    if (!user?.profileImage && !profileForm.profileImage) return t.validation.profileImage;
    if (!profileForm.bio.trim()) return t.validation.bio;
    if (!profileForm.city.trim()) return t.validation.city;
    if (profileForm.consultationFee === "") return t.validation.consultationFee;
    if (Number(profileForm.consultationFee) < 0) return t.validation.feeNegative;
    if (!profileForm.availability) return t.validation.availability;
    return "";
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    const validationError = validateProfileForm();
    if (validationError) {
      setProfileError(validationError);
      return;
    }
    try {
      setSavingProfile(true);
      const payload = new FormData();
      payload.append("specialization", profileForm.specialization);
      payload.append("experienceYears", profileForm.experienceYears);
      payload.append("bio", profileForm.bio);
      payload.append("officeAddress", profileForm.officeAddress);
      payload.append("city", profileForm.city);
      payload.append("consultationFee", profileForm.consultationFee);
      payload.append("availability", profileForm.availability);
      if (profileForm.profileImage) payload.append("profileImage", profileForm.profileImage);
      const isCompleting = !user?.profileCompleted;
      const endpoint = isCompleting ? `${API_BASE_URL}/users/lawyer/profile/complete` : `${API_BASE_URL}/users/lawyer/profile`;
      const method = isCompleting ? "PUT" : "PATCH";
      const res = await fetch(endpoint, { method, headers: authOnlyHeaders, credentials: "include", body: payload });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || data?.error || t.validation.profileSaveFailed);
      if (data.data) {
        setAuthUser(data.data);
        saveStoredUser(data.data);
      }
      setProfileForm((prev) => ({ ...prev, profileImage: null }));
      setProfileSuccess(data.message || t.validation.profileSaveSuccess);
      await fetchMe();
    } catch (err) {
      setProfileError(err.message || t.validation.profileSaveFailed);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    try {
      setSavingAvailability(true);
      setAvailabilityError("");
      setAvailabilitySuccess("");
      if (!lawyerApproved) {
        setAvailabilityError(t.validation.approvalRequired);
        return;
      }
      const times = normalizeSlotText(availabilityForm.slotsText);
      if (!availabilityForm.date) {
        setAvailabilityError(t.validation.workingDate);
        return;
      }
      if (times.length === 0) {
        setAvailabilityError(t.validation.timeSlot);
        return;
      }
      const payload = {
        date: availabilityForm.date,
        isActive: true,
        slots: times.map((time) => ({
          time,
          status: "available",
          consultationTypes: availabilityForm.consultationTypes,
          note: availabilityForm.note,
        })),
      };
      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.availabilitySaveFailed);
      setAvailabilitySuccess(data.message || t.validation.availabilitySaveSuccess);
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || t.validation.availabilitySaveFailed);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleAvailabilityFormChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityTypeToggle = (type) => {
    setAvailabilityForm((prev) => {
      const exists = prev.consultationTypes.includes(type);
      const nextTypes = exists ? prev.consultationTypes.filter((item) => item !== type) : [...prev.consultationTypes, type];
      return { ...prev, consultationTypes: nextTypes.length ? nextTypes : ["online"] };
    });
  };

  const handleBlockSlot = async (availabilityId, time) => {
    if (!availabilityId || !time) return;
    try {
      setActionLoadingId(`block-slot-${availabilityId}-${time}`);
      setAvailabilityError("");
      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my/${availabilityId}/block-slot`, {
        method: "PATCH", headers: authHeaders, credentials: "include", body: JSON.stringify({ time, reason: "Slot blocked by lawyer" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.blockSlotFailed);
      setAvailabilitySuccess(data.message || t.validation.blockSlotSuccess);
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || t.validation.blockSlotFailed);
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockDay = async (availabilityId) => {
    if (!availabilityId) return;
    try {
      setActionLoadingId(`block-day-${availabilityId}`);
      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my/${availabilityId}/block-day`, {
        method: "PATCH", headers: authHeaders, credentials: "include", body: JSON.stringify({ reason: "Day blocked by lawyer" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.blockDayFailed);
      await fetchMyAvailability();
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    if (!availabilityId) return;
    try {
      setActionLoadingId(`delete-availability-${availabilityId}`);
      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my/${availabilityId}`, {
        method: "DELETE", headers: authHeaders, credentials: "include", body: JSON.stringify({ reason: "Availability deleted by lawyer" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.deleteFailed);
      await fetchMyAvailability();
    } finally {
      setActionLoadingId("");
    }
  };


  const handleBlockRangeChange = (e) => {
    const { name, value } = e.target;
    setBlockRangeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlockRange = async (e) => {
    e.preventDefault();

    try {
      setActionLoadingId("block-range");
      setAvailabilityError("");
      setAvailabilitySuccess("");

      const res = await fetch(`${API_BASE_URL}/lawyer-availability/my/block-range`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify(blockRangeForm),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || t.validation.blockRangeFailed || "Failed to block date range");
      }

      setAvailabilitySuccess(data.message || t.validation.blockRangeSuccess || "Date range blocked successfully");
      await fetchMyAvailability();
    } catch (err) {
      setAvailabilityError(err.message || t.validation.blockRangeFailed || "Failed to block date range");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleConnectionAction = async (connectionId, action) => {
    if (!token || !connectionId || !["accept", "reject"].includes(action)) return;
    try {
      setActionLoadingId(`${action}-${connectionId}`);
      const res = await fetch(`${API_BASE_URL}/connections/${connectionId}/${action}`, {
        method: "PATCH", headers: authHeaders, credentials: "include", body: JSON.stringify({ responseMessage: `${action}ed` }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Action failed");
      await fetchConnections();
      if (action === "accept") {
        setSelectedConnectionId(connectionId);
        setActiveTab("chat");
      }
    } finally {
      setActionLoadingId("");
    }
  };

  const handleWithdrawBid = async (postId, bidId) => {
    if (!token || !postId || !bidId) return;
    try {
      setActionLoadingId(`withdraw-${bidId}`);
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/bid/${bidId}`, {
        method: "PATCH", headers: authHeaders, credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.withdrawFailed);
      setSuccessMessage(data.message || t.validation.withdrawSuccess);
      await fetchAllPostsForBids();
    } catch (err) {
      setError(err.message || t.validation.withdrawFailed);
    } finally {
      setActionLoadingId("");
    }
  };

  const fetchMessages = useCallback(async (connectionId) => {
    if (!token || !connectionId) return;
    try {
      setLoadingMessages(true);
      setChatError("");
      const res = await fetch(`${API_BASE_URL}/connections/${connectionId}/messages`, { method: "GET", headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || t.validation.messagesFailed);
      setMessages(data.data || []);
    } catch (err) {
      setMessages([]);
      setChatError(err.message || t.validation.messagesFailed);
    } finally {
      setLoadingMessages(false);
    }
  }, [token, authHeaders, t]);

  useEffect(() => {
    if (activeTab === "chat" && selectedConnectionId) fetchMessages(selectedConnectionId);
  }, [activeTab, selectedConnectionId, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedConnectionId) {
      setChatError(t.validation.conversationRequired);
      return;
    }

    const messageValidation = validateChatMessageText(messageText, t);
    if (!messageValidation.valid) {
      setChatError(messageValidation.message);
      return;
    }

    const attachmentValidation = validateAttachmentLinks(attachmentText, t);
    if (!attachmentValidation.valid) {
      setChatError(attachmentValidation.message);
      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const res = await fetch(`${API_BASE_URL}/connections/${selectedConnectionId}/messages`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({
          message: messageText.trim(),
          attachments: attachmentValidation.links,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || t.validation.sendFailed);
      }

      setMessageText("");
      setAttachmentText("");
      setShowAttachmentInput(false);

      if (data.data?.connection?.messages) {
        setMessages(data.data.connection.messages);
      } else if (data.data?.messages) {
        setMessages(data.data.messages);
      } else {
        await fetchMessages(selectedConnectionId);
      }

      await fetchConnections();
    } catch (err) {
      setChatError(err.message || t.validation.sendFailedPlan || t.validation.sendFailed);
    } finally {
      setSendingMessage(false);
    }
  };

  const subscriptionStatus = activeSubscription?.status || user?.subscriptionStatus || "none";
  const currentPlanName = activeSubscription?.planName || activeSubscription?.plan?.name || t.overview.noActivePlan;

  const proposalLimit = getFeatureValue(activeFeatures, "proposal_limit");
  const connectionLimit = getFeatureValue(activeFeatures, "connection_request_limit");
  const inAppMessaging = canUseChat ? true : getFeatureValue(activeFeatures, "in_app_messaging");
  const contactUnlock = getFeatureValue(activeFeatures, "contact_unlock");
  const availabilityCalendarAccess = getFeatureValue(activeFeatures, "availability_calendar_access");
  const availabilitySlotLimit = getFeatureValue(activeFeatures, "availability_slot_limit");

  if (!user) return <AccessState title={t.auth.noLawyerTitle} text={t.auth.noLawyerDesc} />;
  if (user.role !== "lawyer") return <AccessState title={t.auth.accessOnlyTitle} text={t.auth.accessOnlyDesc} danger />;

  const tabs = [
    { id: "overview", label: t.tabs.overview, icon: Scale },
    { id: "profile", label: user.profileCompleted ? t.tabs.updateProfile : t.tabs.setupProfile, icon: UserCog, count: user.profileCompleted ? 0 : 1 },
    { id: "availability", label: t.tabs.availability, icon: CalendarDays, count: availabilityList.length },
    { id: "bids", label: t.tabs.bids, icon: Send, count: myBids.length },
    { id: "requests", label: t.tabs.requests, icon: Handshake, count: pendingConnections.length },
    { id: "appointments", label: t.tabs.appointments, icon: CalendarDays, count: upcomingAppointments.length },
    { id: "chat", label: t.tabs.chat, icon: MessageCircle, count: appointmentConnections.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/40 to-white px-4 py-10 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Hero user={user} t={t} subscriptionStatus={subscriptionStatus} lawyerApproved={lawyerApproved} pendingConnections={pendingConnections} appointmentConnections={appointmentConnections} />

        {!user.profileCompleted && (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900">{t.hero.completeTitle}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">{t.hero.completeDesc}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveTab("profile")} className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700">
                {t.tabs.setupProfile}
              </button>
            </div>
          </div>
        )}

        <div className="sticky top-20 z-30 mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all ${isActive ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20" : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"}`}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {Number(tab.count) > 0 && <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white text-cyan-700" : "bg-red-100 text-red-700"}`}>{tab.count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {error && <AlertBox type="error" text={error} />}
            {successMessage && <AlertBox type="success" text={successMessage} />}
          </div>
          <button type="button" onClick={refreshDashboard} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100">
            <RefreshCcw className="h-4 w-4" />
            {t.hero.refreshDashboard}
          </button>
        </div>

        {activeTab === "overview" && (
          <OverviewTab t={t} language={currentLanguage} user={user} loading={loadingProfile} activeSubscription={activeSubscription} subscriptionStatus={subscriptionStatus} currentPlanName={currentPlanName} proposalLimit={proposalLimit} connectionLimit={connectionLimit} inAppMessaging={inAppMessaging} contactUnlock={contactUnlock} availabilityCalendarAccess={availabilityCalendarAccess} availabilitySlotLimit={availabilitySlotLimit} myBids={myBids} pendingBids={pendingBids} acceptedBids={acceptedBids} rejectedBids={rejectedBids} pendingConnections={pendingConnections} appointmentConnections={appointmentConnections} lawyerApproved={lawyerApproved} onSetupProfile={() => setActiveTab("profile")} />
        )}

        {activeTab === "profile" && (
          <ProfileTab t={t} user={user} form={profileForm} preview={profilePreview} saving={savingProfile} error={profileError} success={profileSuccess} onChange={handleProfileInputChange} onImageChange={handleProfileImageChange} onSubmit={handleSaveProfile} />
        )}

        {activeTab === "availability" && (
          <AvailabilityTab t={t} language={currentLanguage} approved={lawyerApproved} activeSubscription={activeSubscription} availabilityList={availabilityList} form={availabilityForm} blockRangeForm={blockRangeForm} startDate={availabilityStartDate} endDate={availabilityEndDate} loading={loadingAvailability} saving={savingAvailability} actionLoadingId={actionLoadingId} error={availabilityError} success={availabilitySuccess} availabilityCalendarAccess={availabilityCalendarAccess} availabilitySlotLimit={availabilitySlotLimit} onStartDateChange={setAvailabilityStartDate} onEndDateChange={setAvailabilityEndDate} onRefresh={fetchMyAvailability} onFormChange={handleAvailabilityFormChange} onTypeToggle={handleAvailabilityTypeToggle} onSubmit={handleSaveAvailability} onBlockSlot={handleBlockSlot} onBlockDay={handleBlockDay} onDeleteAvailability={handleDeleteAvailability} onBlockRangeChange={handleBlockRangeChange} onBlockRange={handleBlockRange} />
        )}

        {activeTab === "bids" && (
          <BidsTab t={t} language={currentLanguage} loading={loadingPosts} myBids={myBids} actionLoadingId={actionLoadingId} onWithdrawBid={handleWithdrawBid} />
        )}

        {activeTab === "requests" && (
          <RequestsTab t={t} language={currentLanguage} user={user} loading={loadingConnections} connections={connections.filter((connection) => connection.sourceType !== "booking")} actionLoadingId={actionLoadingId} onAccept={(id) => handleConnectionAction(id, "accept")} onReject={(id) => handleConnectionAction(id, "reject")} onOpenChat={(id) => { setSelectedConnectionId(id); setActiveTab("chat"); }} />
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab t={t} language={currentLanguage} appointments={appointments} upcomingAppointments={upcomingAppointments} completedAppointments={completedAppointments} loading={loadingAppointments} onRefreshAppointments={fetchMyAppointments} onOpenAppointmentChat={(booking) => { const connectionId = booking?.connection?._id || booking?.connection; if (connectionId) { setSelectedConnectionId(connectionId); setActiveTab("chat"); } }} />
        )}

        {activeTab === "chat" && (
          <ChatTab t={t} language={currentLanguage} user={user} connections={appointmentConnections} selectedConnectionId={selectedConnectionId} selectedConnection={selectedConnection} messages={messages} canUseChat={canUseChat} loadingConnections={loadingConnections} loadingMessages={loadingMessages} sendingMessage={sendingMessage} messageText={messageText} attachmentText={attachmentText} showAttachmentInput={showAttachmentInput} chatError={chatError} onSelectConnection={setSelectedConnectionId} onMessageChange={(value) => { setMessageText(value); setChatError(""); }} onAttachmentChange={(value) => { setAttachmentText(value); setChatError(""); }} onToggleAttachmentInput={() => { setShowAttachmentInput((prev) => !prev); setChatError(""); }} onClearAttachment={() => { setAttachmentText(""); setShowAttachmentInput(false); setChatError(""); }} onSendMessage={handleSendMessage} onRefreshMessages={() => selectedConnectionId && fetchMessages(selectedConnectionId)} />
        )}
      </div>
    </div>
  );
};

const AccessState = ({ title, text, danger = false }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-white px-4">
    <div className={`w-full max-w-lg rounded-3xl border ${danger ? "border-red-100" : "border-slate-100"} bg-white p-10 text-center shadow-2xl`}>
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-cyan-100 text-cyan-700"}`}>
        {danger ? <AlertCircle className="h-9 w-9" /> : "L"}
      </div>
      <h2 className="mt-6 text-3xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-slate-500">{text}</p>
    </div>
  </div>
);

const Hero = ({ user, t, subscriptionStatus, lawyerApproved, pendingConnections, appointmentConnections }) => (
  <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)]">
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-cyan-500 to-sky-500 opacity-95" />
    <div className="relative px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-3xl font-black text-white shadow-xl backdrop-blur-md md:h-32 md:w-32 md:text-4xl">
            {user.profileImage ? <img src={user.profileImage} alt={user.name || t.common.lawyer} className="h-full w-full object-cover" /> : getInitials(user.name)}
          </motion.div>
          <div className="text-white">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{user.name || t.hero.titleFallback}</h1>
              <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur-md">{t.common.lawyer}</span>
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${getSubscriptionBadgeClass(subscriptionStatus)}`}>{textStatus(subscriptionStatus, t)}</span>
              <span className={`rounded-full border px-4 py-1.5 text-sm font-bold ${getApprovalBadgeClass(lawyerApproved)}`}>{lawyerApproved ? t.common.approved : t.common.notApproved}</span>
            </div>
            <div className="space-y-2 text-sm text-white/90 md:text-base">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{user.email || t.hero.noEmail}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{user.phone || t.hero.noPhone}</p>
              <p className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" />{t.hero.reg} {user.lawRegNumber || t.common.notAvailable}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <HeroMiniCard icon={<UserCog className="h-5 w-5" />} label={t.hero.profile} value={user.profileCompleted ? t.common.done : t.common.setup} />
          <HeroMiniCard icon={<ShieldCheck className="h-5 w-5" />} label={t.hero.adminApproval} value={lawyerApproved ? t.common.yes : t.common.no} />
          <HeroMiniCard icon={<Handshake className="h-5 w-5" />} label={t.hero.requests} value={pendingConnections.length} />
          <HeroMiniCard icon={<MessageCircle className="h-5 w-5" />} label={t.hero.appointmentChats} value={appointmentConnections.length} />
        </div>
      </div>
    </div>
  </motion.div>
);

const HeroMiniCard = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-md">
    <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-white/80">{label}</p>{icon}</div>
    <h3 className="text-3xl font-black">{value}</h3>
  </div>
);

const OverviewTab = ({ t, language, user, loading, activeSubscription, subscriptionStatus, currentPlanName, proposalLimit, connectionLimit, inAppMessaging, contactUnlock, availabilityCalendarAccess, availabilitySlotLimit, myBids, pendingBids, acceptedBids, rejectedBids, pendingConnections, appointmentConnections, lawyerApproved, onSetupProfile }) => (
  <div className="mt-8 grid gap-8 xl:grid-cols-3">
    <div className="space-y-8 xl:col-span-2">
      <SectionCard icon={<Scale className="h-6 w-6" />} title={t.overview.profileTitle} subtitle={t.overview.profileSubtitle}>
        <div className="mb-5 flex flex-wrap gap-3">
          <button type="button" onClick={onSetupProfile} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700">
            <UserCog className="h-4 w-4" />{user.profileCompleted ? t.tabs.updateProfile : t.tabs.setupProfile}
          </button>
          <span className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black ${getApprovalBadgeClass(lawyerApproved)}`}>
            <ShieldCheck className="h-4 w-4" />{lawyerApproved ? t.common.approved : t.common.pending}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={<UserRound />} label={t.overview.name} value={user.name} />
          <InfoCard icon={<Mail />} label={t.overview.email} value={user.email} />
          <InfoCard icon={<Phone />} label={t.overview.phone} value={user.phone || "-"} />
          <InfoCard icon={<BadgeCheck />} label={t.overview.lawReg} value={user.lawRegNumber || "-"} />
          <InfoCard icon={<ShieldCheck />} label={t.overview.phoneVerification} value={user.phoneVerified ? t.common.verified : t.common.notVerified} />
          <InfoCard icon={<CheckCircle2 />} label={t.overview.profileCompleted} value={user.profileCompleted ? t.common.completed : t.common.notCompleted} />
          <InfoCard icon={<Briefcase />} label={t.overview.specialization} value={textSpecialization(user.specialization, t)} />
          <InfoCard icon={<MapPin />} label={t.overview.city} value={user.city || "-"} />
          <InfoCard icon={<Wallet />} label={t.overview.consultationFee} value={formatCurrency(user.consultationFee || 0, "BDT", language)} />
          <InfoCard icon={<CalendarDays />} label={t.overview.joined} value={formatDate(user.createdAt, language)} />
        </div>
      </SectionCard>
      <SectionCard icon={<Briefcase className="h-6 w-6" />} title={t.overview.proposalTitle} subtitle={t.overview.proposalSubtitle}>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title={t.overview.totalBids} value={myBids.length} />
          <StatCard title={t.overview.pending} value={pendingBids.length} />
          <StatCard title={t.overview.accepted} value={acceptedBids.length} />
          <StatCard title={t.overview.rejected} value={rejectedBids.length} />
        </div>
      </SectionCard>
    </div>
    <div className="space-y-8">
      <SectionCard icon={<Crown className="h-6 w-6" />} title={t.overview.subscriptionTitle} subtitle={t.overview.subscriptionSubtitle}>
        {loading ? <LoadingBox text={t.common.loading} /> : (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-5 ${getSubscriptionBadgeClass(subscriptionStatus)}`}>
              <p className="text-sm font-bold">{t.overview.status}</p>
              <h3 className="mt-1 text-2xl font-black capitalize">{textStatus(subscriptionStatus, t)}</h3>
            </div>
            <MiniDetail label={t.overview.currentPlan} value={currentPlanName} />
            <MiniDetail label={t.overview.price} value={activeSubscription ? formatCurrency(activeSubscription.price, activeSubscription.currency || "BDT", language) : t.overview.noActiveSubscription} />
            <MiniDetail label={t.overview.planEnd} value={formatDate(activeSubscription?.endDate, language)} />
          </div>
        )}
      </SectionCard>
      <SectionCard icon={<Wallet className="h-6 w-6" />} title="Feature Access" subtitle="">
        <div className="space-y-3">
          <FeatureRow label={t.overview.proposalLimit} value={proposalLimit} t={t} />
          <FeatureRow label={t.overview.connectionRequests} value={connectionLimit} t={t} />
          <FeatureRow label={t.overview.inAppMessaging} value={inAppMessaging} t={t} />
          <FeatureRow label={t.overview.contactUnlock} value={contactUnlock} t={t} />
          <FeatureRow label={t.overview.availabilityCalendar} value={availabilityCalendarAccess} t={t} />
          <FeatureRow label={t.overview.availabilitySlotLimit} value={availabilitySlotLimit} t={t} />
        </div>
      </SectionCard>
    </div>
  </div>
);

const ProfileTab = ({ t, user, form, preview, saving, error, success, onChange, onImageChange, onSubmit }) => (
  <div className="mt-8 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
    <SectionCard icon={<UserCog className="h-6 w-6" />} title={user.profileCompleted ? t.tabs.updateProfile : t.tabs.setupProfile} subtitle={t.profile.professionalSubtitle}>
      <div className={`rounded-3xl border p-5 ${getApprovalBadgeClass(isLawyerApproved(user))}`}>
        <p className="text-sm font-black">{t.profile.currentStatus}</p>
        <h3 className="mt-1 text-2xl font-black">{isLawyerApproved(user) ? t.profile.approvedLawyer : t.profile.pendingApproval}</h3>
        <p className="mt-2 text-sm font-semibold leading-6">{isLawyerApproved(user) ? t.profile.approvedDesc : t.profile.pendingDesc}</p>
      </div>
      <div className="mt-5 grid gap-3">
        <ProfileCheckRow label={t.profile.profileCompleted} checked={user.profileCompleted} t={t} />
        <ProfileCheckRow label={t.profile.phoneVerified} checked={user.phoneVerified === 1} t={t} />
        <ProfileCheckRow label={t.profile.adminApproved} checked={user.isVerifiedLawyer} t={t} />
      </div>
    </SectionCard>
    <SectionCard icon={<Save className="h-6 w-6" />} title={t.profile.professionalTitle} subtitle={t.profile.professionalSubtitle}>
      {error && <AlertBox type="error" text={error} />}
      {success && <AlertBox type="success" text={success} />}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-black text-slate-800">{t.profile.image}</label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {preview ? <img src={preview} alt={t.profile.image} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><Camera className="h-8 w-8" /></div>}
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700">
                <ImagePlus className="h-4 w-4" />{t.profile.uploadImage}
                <input type="file" accept="image/*" onChange={onImageChange} className="hidden" />
              </label>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{t.profile.imageHelp}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t.profile.specialization}>
            <select name="specialization" value={form.specialization} onChange={onChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100">
              <option value="">{t.profile.selectSpecialization}</option>
              {LAWYER_SPECIALIZATIONS.map((item) => <option key={item} value={item}>{textSpecialization(item, t)}</option>)}
            </select>
          </FormField>
          <FormField label={t.profile.experienceYears}><input type="number" name="experienceYears" min="0" max="80" value={form.experienceYears} onChange={onChange} required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
          <FormField label={t.profile.city}><input name="city" value={form.city} onChange={onChange} required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
          <FormField label={t.profile.consultationFee}><input type="number" name="consultationFee" min="0" value={form.consultationFee} onChange={onChange} required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
          <FormField label={t.profile.availability} className="md:col-span-2">
            <div className="grid grid-cols-3 gap-2">
              {LAWYER_AVAILABILITY.map((item) => (
                <label key={item} className={`cursor-pointer rounded-2xl border px-3 py-3 text-center text-sm font-black transition ${form.availability === item ? "border-cyan-600 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  <input type="radio" name="availability" value={item} checked={form.availability === item} onChange={onChange} className="hidden" />
                  {textAvailability(item, t)}
                </label>
              ))}
            </div>
          </FormField>
          <FormField label={t.profile.officeAddress} className="md:col-span-2"><input name="officeAddress" value={form.officeAddress} onChange={onChange} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
          <FormField label={t.profile.bio} className="md:col-span-2"><textarea name="bio" value={form.bio} onChange={onChange} rows={5} maxLength={1000} required className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /><div className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{t.profile.bioHelp}</span><span>{form.bio.length}/1000</span></div></FormField>
        </div>
        <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 text-sm font-black text-white transition hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-60">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t.profile.saving}</> : <><Save className="h-4 w-4" />{user.profileCompleted ? t.profile.updateButton : t.profile.completeButton}</>}
        </button>
      </form>
    </SectionCard>
  </div>
);

const AvailabilityTab = ({ t, language, approved, activeSubscription, availabilityList, form, blockRangeForm, startDate, endDate, loading, saving, actionLoadingId, error, success, availabilityCalendarAccess, availabilitySlotLimit, onStartDateChange, onEndDateChange, onRefresh, onFormChange, onTypeToggle, onSubmit, onBlockSlot, onBlockDay, onDeleteAvailability, onBlockRangeChange, onBlockRange }) => {
  const allSlots = availabilityList.flatMap((day) => day.slots || []);
  const openSlots = allSlots.filter((slot) => slot.isSelectable).length;
  const bookedSlots = allSlots.filter((slot) => slot.isBooked).length;
  const blockedSlots = allSlots.filter((slot) => slot.status === "blocked").length;
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-8">
        <SectionCard icon={<CalendarDays className="h-6 w-6" />} title={t.calendar.title} subtitle={t.calendar.subtitle}>
          {error && <AlertBox type="error" text={error} />}
          {success && <AlertBox type="success" text={success} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard icon={<Crown />} label={t.calendar.calendarAccess} value={readableFeature(availabilityCalendarAccess, t)} />
            <InfoCard icon={<Clock />} label={t.calendar.slotLimit} value={readableFeature(availabilitySlotLimit, t)} />
            <InfoCard icon={<CalendarDays />} label={t.calendar.planEnd} value={formatDate(activeSubscription?.endDate, language)} />
            <InfoCard icon={<ShieldCheck />} label={t.calendar.approval} value={approved ? t.common.approved : t.common.pending} />
          </div>
        </SectionCard>
        <SectionCard icon={<Save className="h-6 w-6" />} title={t.calendar.addTitle} subtitle={t.calendar.subtitle}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField label={t.calendar.workingDate}><input type="date" name="date" value={form.date} onChange={onFormChange} required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
            <FormField label={t.calendar.availableTimes}><textarea name="slotsText" value={form.slotsText} onChange={onFormChange} rows={5} required className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /><p className="mt-2 text-xs font-semibold text-slate-500">{t.calendar.timesHelp}</p></FormField>
            <FormField label={t.calendar.consultationTypes}><div className="grid gap-2 sm:grid-cols-3">{[{ key: "online", label: t.common.online }, { key: "phone", label: t.common.phone }, { key: "in_person", label: t.common.inPerson }].map((type) => <button key={type.key} type="button" onClick={() => onTypeToggle(type.key)} className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${form.consultationTypes.includes(type.key) ? "border-cyan-600 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{type.label}</button>)}</div></FormField>
            <FormField label={t.calendar.slotNote}><input type="text" name="note" value={form.note} onChange={onFormChange} maxLength={300} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></FormField>
            <button type="submit" disabled={saving || !approved} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 text-sm font-black text-white transition hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-60">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t.common.loading}</> : <><Save className="h-4 w-4" />{t.calendar.saveWorkingDay}</>}</button>
          </form>
        </SectionCard>

        <SectionCard icon={<XCircle className="h-6 w-6" />} title={t.calendar.blockRangeTitle || "Block Date Range"} subtitle={t.calendar.blockRangeSubtitle || "Cancel bookings and block a full range, like a week"}>
          <form onSubmit={onBlockRange} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t.calendar.startDate || "Start Date"}>
                <input
                  type="date"
                  name="startDate"
                  value={blockRangeForm.startDate}
                  onChange={onBlockRangeChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </FormField>

              <FormField label={t.calendar.endDate || "End Date"}>
                <input
                  type="date"
                  name="endDate"
                  value={blockRangeForm.endDate}
                  onChange={onBlockRangeChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </FormField>
            </div>

            <FormField label={t.calendar.reason || "Reason"}>
              <input
                type="text"
                name="reason"
                value={blockRangeForm.reason}
                onChange={onBlockRangeChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder={t.calendar.reasonPlaceholder || "Example: Court work / personal leave"}
              />
            </FormField>

            <button
              type="submit"
              disabled={actionLoadingId === "block-range" || !approved}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {actionLoadingId === "block-range" ? t.calendar.blocking || "Blocking..." : t.calendar.blockRange || "Block Range"}
            </button>
          </form>
        </SectionCard>
      </div>
      <SectionCard icon={<Clock className="h-6 w-6" />} title={t.calendar.workingCalendarTitle} subtitle="">
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}{t.calendar.load}</button>
        </div>
        <div className="mb-5 grid gap-4 md:grid-cols-4"><StatCard title={t.calendar.days} value={availabilityList.length} /><StatCard title={t.calendar.open} value={openSlots} /><StatCard title={t.calendar.booked} value={bookedSlots} /><StatCard title={t.calendar.blocked} value={blockedSlots} /></div>
        {loading ? <LoadingBox text={t.common.loading} /> : availabilityList.length === 0 ? <EmptyBox text={t.calendar.empty} /> : <div className="space-y-5">{availabilityList.map((day) => <div key={day._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-black text-slate-950">{formatDate(day.date, language)}</h3><div className="flex gap-2"><button type="button" onClick={() => onBlockDay(day._id)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700">{t.calendar.blockDay}</button><button type="button" onClick={() => onDeleteAvailability(day._id)} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700">{t.common.delete}</button></div></div><div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{(day.slots || []).map((slot, index) => <div key={`${day._id}-${slot.time}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-base font-black text-slate-950">{slot.time}</p><span className="rounded-full border px-3 py-1 text-xs font-black">{slot.status === "blocked" ? t.common.blocked : slot.isBooked ? t.common.booked : t.common.available}</span></div><button type="button" onClick={() => onBlockSlot(day._id, slot.time)} disabled={slot.status === "blocked" || actionLoadingId === `block-slot-${day._id}-${slot.time}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"><Lock className="h-4 w-4" />{slot.status === "blocked" ? t.calendar.alreadyBlocked : t.calendar.blockSlot}</button></div>)}</div></div>)}</div>}
      </SectionCard>
    </div>
  );
};

const BidsTab = ({ t, language, loading, myBids, actionLoadingId, onWithdrawBid }) => (
  <SectionCard className="mt-8" icon={<Send className="h-6 w-6" />} title={t.bids.title} subtitle="">
    {loading ? <LoadingBox text={t.bids.loading} /> : myBids.length === 0 ? <EmptyBox text={t.bids.empty} /> : <div className="space-y-5">{myBids.map(({ post, bid }) => <div key={`${post._id}-${bid._id}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border px-3 py-1 text-xs font-black capitalize">{textStatus(bid.status, t)}</span><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">{formatDateTime(bid.createdAt, language)}</span></div><h3 className="text-xl font-black text-slate-950">{post.title || "-"}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.description || "-"}</p></div><button type="button" onClick={() => onWithdrawBid(post._id, bid._id)} disabled={bid.status !== "pending" || actionLoadingId === `withdraw-${bid._id}`} className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 disabled:opacity-60"><RotateCcw className="h-4 w-4" />{actionLoadingId === `withdraw-${bid._id}` ? t.bids.withdrawing : t.bids.withdrawBid}</button></div></div>)}</div>}
  </SectionCard>
);

const RequestsTab = ({ t, language, user, loading, connections, actionLoadingId, onAccept, onReject, onOpenChat }) => {
  const userId = String(user?._id || user?.id || "");
  return (
    <SectionCard className="mt-8" icon={<Handshake className="h-6 w-6" />} title={t.requests.title} subtitle="">
      {loading ? <LoadingBox text={t.requests.loading} /> : connections.length === 0 ? <EmptyBox text={t.requests.empty} /> : <div className="space-y-5">{connections.map((connection) => { const requestedById = String(connection.requestedBy?._id || connection.requestedBy || ""); const canRespond = connection.status === "pending" && requestedById !== userId; return <div key={connection._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border px-3 py-1 text-xs font-black capitalize">{textStatus(connection.status, t)}</span><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">{formatDateTime(connection.createdAt, language)}</span></div><h3 className="text-xl font-black text-slate-950">{connection.post?.title || "-"}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{connection.requestMessage || "-"}</p></div><div className="flex min-w-[220px] flex-col gap-3">{canRespond && <><button type="button" onClick={() => onAccept(connection._id)} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">{t.requests.accept}</button><button type="button" onClick={() => onReject(connection._id)} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700">{t.requests.reject}</button></>}{connection.status === "accepted" && <button type="button" onClick={() => onOpenChat(connection._id)} className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white">{t.requests.openChat}</button>}</div></div></div>; })}</div>}
    </SectionCard>
  );
};

const AppointmentsTab = ({ t, language, appointments, upcomingAppointments, completedAppointments, loading, onRefreshAppointments, onOpenAppointmentChat }) => (
  <SectionCard className="mt-8" icon={<CalendarDays className="h-6 w-6" />} title={t.appointments.title} subtitle="">
    <button type="button" onClick={onRefreshAppointments} className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700"><RefreshCcw className="h-4 w-4" />{t.appointments.refresh}</button>
    {loading ? <LoadingBox text={t.appointments.loading} /> : appointments.length === 0 ? <EmptyBox text={t.appointments.empty} /> : <div className="space-y-5">{[...upcomingAppointments, ...completedAppointments].map((booking) => { const connectionId = booking.connection?._id || booking.connection; const canChat = booking.status === "accepted" && Boolean(connectionId); return <div key={booking._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-black text-slate-950">{booking.subject || "-"}</h3><p className="mt-2 text-sm text-slate-600">{formatDate(booking.requestedDate, language)} • {booking.requestedTime || "-"}</p><button type="button" onClick={() => onOpenAppointmentChat(booking)} disabled={!canChat} className={`mt-4 rounded-2xl px-5 py-3 text-sm font-black ${canChat ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-500"}`}>{canChat ? t.appointments.openChat : t.appointments.chatNotReady}</button></div>; })}</div>}
  </SectionCard>
);

const ChatTab = ({ t, language, user, connections, selectedConnectionId, selectedConnection, messages, canUseChat, loadingConnections, loadingMessages, sendingMessage, messageText, attachmentText, showAttachmentInput, chatError, onSelectConnection, onMessageChange, onAttachmentChange, onToggleAttachmentInput, onClearAttachment, onSendMessage, onRefreshMessages }) => {
  const userId = String(user?._id || user?.id || "");
  const otherUser = getOtherUser(selectedConnection, user);
  return (
    <div className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-3 text-2xl font-black text-slate-950"><MessageCircle className="h-6 w-6 text-cyan-700" />{t.chat.title}</h2><button type="button" onClick={onRefreshMessages} disabled={!selectedConnectionId || loadingMessages} className="rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700">{t.chat.refresh}</button></div></div>
      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <h3 className="mb-4 text-lg font-black text-slate-950">{t.chat.clients} ({connections.length})</h3>
          {loadingConnections ? <LoadingBox text={t.common.loading} /> : connections.length === 0 ? <EmptyBox text={t.chat.selectConversation} /> : <div className="space-y-3">{connections.map((connection) => { const client = getOtherUser(connection, user); const active = String(connection._id) === String(selectedConnectionId); return <button key={connection._id} type="button" onClick={() => onSelectConnection(connection._id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-cyan-300 bg-white shadow-md" : "border-slate-200 bg-white/70 hover:bg-white"}`}><p className="font-black text-slate-950">{client?.name || t.chat.client}</p><p className="mt-1 truncate text-xs text-slate-500">{connection.booking?.subject || "-"}</p></button>; })}</div>}
        </div>
        <div className="flex min-h-[620px] flex-col bg-white">
          {selectedConnection ? <>
            <div className="border-b border-slate-200 p-5"><h3 className="text-lg font-black text-slate-950">{otherUser?.name || t.chat.client}</h3></div>
            {chatError && <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{chatError}</div>}
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5">{loadingMessages ? <LoadingBox text={t.chat.loadingMessages} /> : messages.length === 0 ? <EmptyBox text={t.chat.emptyMessages} /> : messages.map((item) => { const isMine = String(item.sender?._id || item.sender) === userId; return <div key={item._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-sm ${isMine ? "rounded-br-md bg-cyan-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}><p className="mb-1 text-xs font-black">{isMine ? t.chat.you : item.sender?.name || t.chat.client}</p><p className="whitespace-pre-wrap text-sm font-semibold leading-6">{item.message}</p>{item.attachments?.length > 0 && <div className="mt-3 space-y-2">{item.attachments.map((attachment, index) => <a key={`${attachment}-${index}`} href={attachment} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${isMine ? "bg-white/15 text-white" : "bg-slate-100 text-cyan-700"}`}><Paperclip className="h-3.5 w-3.5" />{(t.chat.driveAttachment || "Google Drive Attachment {index}").replace("{index}", index + 1)}</a>)}</div>}<p className="mt-2 text-[11px] opacity-80">{formatDateTime(item.createdAt, language)}</p></div></div>; })}</div>
            <form onSubmit={onSendMessage} className="border-t border-slate-200 bg-white p-5">
              <div className="grid gap-3">
                <textarea
                  value={messageText}
                  onChange={(e) => onMessageChange(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={canUseChat ? t.chat.writePlaceholder : t.chat.lockedPlaceholder || "Activate a free or paid plan to use conversation..."}
                  disabled={!canUseChat || sendingMessage}
                  className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400"
                />

                {showAttachmentInput && (
                  <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {t.chat.attachmentTitle || "Google Drive Attachment"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {t.chat.attachmentHelp || "Only https://drive.google.com links are allowed. Phone numbers and social media links are blocked."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onClearAttachment}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        {t.chat.remove || "Remove"}
                      </button>
                    </div>

                    <input
                      type="url"
                      value={attachmentText}
                      onChange={(e) => onAttachmentChange(e.target.value)}
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
                      <Paperclip className="h-4 w-4" />
                      {t.chat.attachment}
                    </button>

                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        {messageText.length}/2000 {t.chat.characters || "characters"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {t.chat.blockedNote || "Phone/payment numbers and social media links are blocked."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canUseChat || sendingMessage || !messageText.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sendingMessage ? t.chat.sending : t.chat.sendMessage}
                  </button>
                </div>
              </div>
            </form>
          </> : <div className="flex flex-1 items-center justify-center p-8"><EmptyBox text={t.chat.selectConversation} /></div>}
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ icon, title, subtitle, children, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] md:p-8 ${className}`}>
    <div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">{icon}</div><div><h2 className="text-2xl font-black text-slate-950">{title}</h2>{subtitle && <p className="text-sm font-semibold text-slate-500">{subtitle}</p>}</div></div>{children}
  </motion.div>
);

const InfoCard = ({ icon, label, value }) => <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">{icon}</div><p className="text-sm font-semibold text-slate-500">{label}</p><h4 className="mt-1 break-words text-base font-black text-slate-900">{value || "-"}</h4></div>;
const MiniDetail = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words font-black capitalize text-slate-800">{value || "-"}</p></div>;
const StatCard = ({ title, value }) => <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">{title}</p><h3 className="mt-1 text-3xl font-black text-slate-950">{value}</h3></div>;
const FeatureRow = ({ label, value, t }) => <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-700">{label}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900">{readableFeature(value, t)}</span></div>;
const ProfileCheckRow = ({ label, checked, t }) => <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-700">{label}</p><span className={`rounded-full px-3 py-1 text-xs font-black ${checked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{checked ? t.common.done : t.common.pending}</span></div>;
const FormField = ({ label, children, className = "" }) => <div className={className}><label className="mb-2 block text-sm font-black text-slate-800">{label}</label>{children}</div>;
const LoadingBox = ({ text }) => <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-cyan-600" />{text}</div>;
const EmptyBox = ({ text }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">{text}</div>;
const AlertBox = ({ text, type = "error" }) => <div className={`mb-5 rounded-2xl border px-5 py-4 text-sm font-bold ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{text}</div>;

export default LawyerDashboard;
