"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCcw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  Video,
  X,
} from "lucide-react";

import lawyerDetailsI18n from "../../../json/lawyerDetails.json";

const normalizeApiBaseUrl = (value = "") => {
  const fallback = "https://law-link-bd-last.vercel.app";
  const raw = String(value || fallback).trim().replace(/\/+$/, "");

  if (raw.endsWith("/api")) return raw;

  return `${raw}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const CONSULTATION_TYPES = [
  { value: "online", labelKey: "online", icon: Video },
  { value: "phone", labelKey: "phone", icon: Phone },
  { value: "in_person", labelKey: "inPerson", icon: Building2 },
];

const getStoredToken = () => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  return localToken || sessionToken || "";
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

const getInitials = (name = "", fallback = "L") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (!parts.length) return fallback;

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const toInputDate = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
};

const getTodayInput = () => toInputDate(new Date());

const getFutureInput = (days = 14) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputDate(date);
};

const getLocale = (language) => (language === "bn" ? "bn-BD" : "en-BD");

const formatDate = (value, language = "en") => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(getLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDay = (value, language = "en") => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(getLocale(language), {
    weekday: "long",
  });
};

const formatConsultationType = (value = "", t) => {
  const keyMap = {
    online: "online",
    phone: "phone",
    in_person: "inPerson",
  };

  const key = keyMap[value];

  if (key && t?.consultationTypes?.[key]) {
    return t.consultationTypes[key];
  }

  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatMoney = (value, t, language = "en") => {
  const amount = Number(value || 0);

  if (!amount) return t.fallback.feeNotSet;

  return `৳${amount.toLocaleString(getLocale(language))}`;
};

const getSlotStatus = (slot, t) => {
  if (slot?.isBooked) {
    return slot.bookingStatus === "accepted"
      ? t.slotStatus.booked
      : t.slotStatus.pending;
  }

  if (slot?.status === "blocked") {
    return t.slotStatus.blocked;
  }

  if (slot?.isSelectable) {
    return t.slotStatus.available;
  }

  return t.slotStatus.unavailable;
};

const getSlotBadgeClass = (slot) => {
  if (slot?.isBooked) {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }

  if (slot?.status === "blocked") {
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }

  if (slot?.isSelectable) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
};

const getDateRangeError = (startDate, endDate, t) => {
  if (!startDate || !endDate) return t.dateErrors.required;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return t.dateErrors.invalid;
  }

  if (start > end) {
    return t.dateErrors.startAfterEnd;
  }

  return "";
};

const getApiErrorMessage = async (res, fallbackMessage, t) => {
  try {
    const data = await res.json();

    return {
      data,
      message:
        data?.message ||
        data?.error ||
        fallbackMessage ||
        t.api.genericError,
    };
  } catch {
    return {
      data: null,
      message: fallbackMessage || t.api.genericError,
    };
  }
};

const LawyerImage = ({ lawyer, t }) => {
  if (lawyer?.profileImage) {
    return (
      <img
        src={lawyer.profileImage}
        alt={lawyer?.name || t.fallback.lawyerProfileAlt}
        className="h-32 w-32 rounded-[34px] object-cover ring-4 ring-white shadow-sm md:h-40 md:w-40"
      />
    );
  }

  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-[34px] bg-cyan-700 text-4xl font-black text-white ring-4 ring-white shadow-sm md:h-40 md:w-40 md:text-5xl">
      {getInitials(lawyer?.name, t.fallback.initial)}
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, locked = false, t }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
      <Icon className="h-4 w-4 text-cyan-700" />
      {label}
    </div>

    <p className="mt-2 break-words text-sm font-black text-slate-950">
      {locked ? t.fallback.lockedByPlan : value || t.fallback.notAvailable}
    </p>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2 className="text-xl font-black leading-tight text-slate-950 md:text-2xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const EmptyAvailability = ({ t }) => (
  <div className="flex min-h-[300px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
    <div>
      <CalendarDays className="mx-auto mb-4 h-11 w-11 text-slate-400" />

      <p className="text-sm font-black text-slate-700">
        {t.calendar.emptyTitle}
      </p>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {t.calendar.emptyDescription}
      </p>
    </div>
  </div>
);

export default function LawyerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const t =
    lawyerDetailsI18n[currentLanguage]?.lawyerDetails ||
    lawyerDetailsI18n.en.lawyerDetails;

  const bookingSubmitLockRef = useRef(false);

  const [lawyer, setLawyer] = useState(null);
  const [availability, setAvailability] = useState([]);

  const [startDate, setStartDate] = useState(getTodayInput());
  const [endDate, setEndDate] = useState(getFutureInput(14));

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState("online");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loadingLawyer, setLoadingLawyer] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingLocked, setBookingLocked] = useState(false);

  const [pageError, setPageError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [success, setSuccess] = useState("");
  const [successModal, setSuccessModal] = useState(null);

  const token = getStoredToken();
  const currentUser = getStoredUser();

  const isBookingBusy = submitting || bookingLocked;

  const authHeaders = useMemo(() => {
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, [token]);

  const access = lawyer?.access || {};
  const lockedFields = Array.isArray(access?.lockedFields)
    ? access.lockedFields
    : [];

  const isLocked = (field) => lockedFields.includes(field);

  const selectedSlotTypes = useMemo(() => {
    if (!selectedSlot?.consultationTypes?.length) return ["online"];
    return selectedSlot.consultationTypes;
  }, [selectedSlot]);

  const availableDays = useMemo(() => {
    return availability.filter((day) =>
      Array.isArray(day.slots)
        ? day.slots.some((slot) => slot.isSelectable)
        : false
    );
  }, [availability]);

  const openSlots = useMemo(() => {
    return availability.reduce((total, day) => {
      return (
        total +
        (Array.isArray(day.slots)
          ? day.slots.filter((slot) => slot.isSelectable).length
          : 0)
      );
    }, 0);
  }, [availability]);

  const bookedSlots = useMemo(() => {
    return availability.reduce((total, day) => {
      return (
        total +
        (Array.isArray(day.slots)
          ? day.slots.filter((slot) => slot.isBooked).length
          : 0)
      );
    }, 0);
  }, [availability]);

  const selectedSummary = useMemo(() => {
    if (!selectedDay || !selectedSlot) return t.fallback.noSlotSelected;
    return `${formatDate(selectedDay.date, currentLanguage)} at ${
      selectedSlot.time
    }`;
  }, [selectedDay, selectedSlot, t, currentLanguage]);

  const closeSuccessModal = () => {
    setSuccessModal(null);
  };

  const fetchLawyer = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingLawyer(true);
      setPageError("");

      const res = await fetch(`${API_BASE_URL}/users/lawyers/${id}`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const { data, message } = await getApiErrorMessage(
        res,
        t.api.failedLoadLawyer,
        t
      );

      if (!res.ok || !data?.success) {
        throw new Error(message);
      }

      setLawyer(data.data || null);
    } catch (err) {
      setPageError(err.message || t.api.failedLoadLawyer);
    } finally {
      setLoadingLawyer(false);
    }
  }, [id, authHeaders, t]);

  const fetchAvailability = useCallback(async () => {
    if (!id) return;

    const dateRangeError = getDateRangeError(startDate, endDate, t);

    if (dateRangeError) {
      setAvailability([]);
      setSelectedDay(null);
      setSelectedSlot(null);
      setAvailabilityError(dateRangeError);
      return;
    }

    try {
      setLoadingAvailability(true);
      setAvailabilityError("");
      setBookingError("");
      setSuccess("");

      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);

      const res = await fetch(
        `${API_BASE_URL}/lawyer-availability/lawyer/${id}?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        }
      );

      const { data, message } = await getApiErrorMessage(
        res,
        t.api.failedLoadSlots,
        t
      );

      if (!res.ok || !data?.success) {
        throw new Error(message);
      }

      const nextAvailability = Array.isArray(data.data) ? data.data : [];

      setAvailability(nextAvailability);

      const stillExists =
        selectedDay &&
        selectedSlot &&
        nextAvailability.some((day) => {
          const sameDay = String(day.date) === String(selectedDay.date);

          if (!sameDay) return false;

          return (day.slots || []).some(
            (slot) =>
              String(slot.time) === String(selectedSlot.time) &&
              slot.isSelectable
          );
        });

      if (!stillExists) {
        setSelectedDay(null);
        setSelectedSlot(null);
      }
    } catch (err) {
      setAvailability([]);
      setSelectedDay(null);
      setSelectedSlot(null);
      setAvailabilityError(err.message || t.api.failedLoadSlots);
    } finally {
      setLoadingAvailability(false);
    }
  }, [
    id,
    startDate,
    endDate,
    authHeaders,
    selectedDay,
    selectedSlot,
    t,
  ]);

  useEffect(() => {
    fetchLawyer();
  }, [fetchLawyer]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    if (
      selectedSlotTypes.length &&
      !selectedSlotTypes.includes(consultationType)
    ) {
      setConsultationType(selectedSlotTypes[0]);
    }
  }, [selectedSlotTypes, consultationType]);

  const handleSelectSlot = (day, slot) => {
    if (!slot?.isSelectable || isBookingBusy || bookingSubmitLockRef.current) {
      return;
    }

    setSelectedDay(day);
    setSelectedSlot(slot);
    setBookingError("");
    setSuccess("");

    if (Array.isArray(slot.consultationTypes) && slot.consultationTypes.length) {
      setConsultationType(slot.consultationTypes[0]);
    } else {
      setConsultationType("online");
    }
  };

  const handleQuickRange = (days) => {
    if (isBookingBusy || bookingSubmitLockRef.current) return;

    setStartDate(getTodayInput());
    setEndDate(getFutureInput(days));
    setSelectedDay(null);
    setSelectedSlot(null);
    setAvailabilityError("");
    setBookingError("");
    setSuccess("");
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (bookingSubmitLockRef.current || submitting || bookingLocked) {
      return;
    }

    bookingSubmitLockRef.current = true;
    setBookingLocked(true);
    setSubmitting(true);
    setBookingError("");
    setSuccess("");

    try {
      if (!token) {
        setBookingError(t.booking.loginRequired);
        return;
      }

      if (currentUser?.role && currentUser.role !== "client") {
        setBookingError(t.booking.clientOnly);
        return;
      }

      if (!selectedDay || !selectedSlot) {
        setBookingError(t.booking.selectSlot);
        return;
      }

      if (!selectedSlotTypes.includes(consultationType)) {
        setBookingError(t.booking.unsupportedConsultation);
        return;
      }

      if (!subject.trim()) {
        setBookingError(t.booking.subjectRequired);
        return;
      }

      const bookedDetails = {
        lawyerName: lawyer?.name || t.fallback.selectedLawyer,
        date: selectedDay.date,
        time: selectedSlot.time,
        consultationType,
        subject: subject.trim(),
        message: message.trim(),
      };

      const res = await fetch(`${API_BASE_URL}/bookings/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          lawyerId: id,
          requestedDate: selectedDay.date,
          requestedTime: selectedSlot.time,
          consultationType,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const { data, message: apiMessage } = await getApiErrorMessage(
        res,
        t.api.failedBook,
        t
      );

      if (!res.ok || !data?.success) {
        throw new Error(apiMessage);
      }

      const finalMessage = data.message || t.booking.successMessage;

      setSuccess(finalMessage);

      setSuccessModal({
        ...bookedDetails,
        title: t.booking.successTitle,
        messageText: finalMessage,
        bookingId: data?.data?._id || "",
      });

      setSubject("");
      setMessage("");
      setSelectedDay(null);
      setSelectedSlot(null);

      fetchAvailability();
    } catch (err) {
      setBookingError(err.message || t.api.failedBook);
    } finally {
      setSubmitting(false);

      setTimeout(() => {
        bookingSubmitLockRef.current = false;
        setBookingLocked(false);
      }, 1000);
    }
  };

  if (loadingLawyer) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">
        <div className="flex min-h-[460px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-cyan-700" />
            <p className="text-sm font-black text-slate-600">
              {t.loading.lawyerProfile}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-[34px] border border-rose-100 bg-rose-50 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />

            <h3 className="mb-2 text-xl font-black text-rose-700">
              {t.errorState.title}
            </h3>

            <p className="mb-5 text-sm font-semibold text-rose-600">
              {pageError}
            </p>

            <button
              type="button"
              onClick={() => navigate("/lawyers")}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700"
            >
              {t.errorState.backButton}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 pt-24">
        <section className="bg-white pb-8 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => navigate("/lawyers")}
              disabled={isBookingBusy}
              className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.buttons.backToLawyers}
            </button>

            <motion.div
              className="overflow-hidden rounded-[38px] border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-slate-50 shadow-sm"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative p-6 md:p-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-cyan-100/50" />

                <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <LawyerImage lawyer={lawyer} t={t} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                          {lawyer?.name || t.fallback.lawyerProfile}
                        </h1>

                        {lawyer?.isVerifiedLawyer && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {t.hero.verifiedLawyer}
                          </span>
                        )}

                        {lawyer?.phoneVerified === 1 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t.hero.phoneVerified}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                        {lawyer?.bio || t.fallback.noBio}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          <Gavel className="h-3.5 w-3.5 text-cyan-700" />
                          {lawyer?.specialization || t.fallback.legalConsultant}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          <MapPin className="h-3.5 w-3.5 text-cyan-700" />
                          {isLocked("city")
                            ? t.fallback.cityLocked
                            : lawyer?.city || t.fallback.cityNotSet}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          <Clock className="h-3.5 w-3.5 text-cyan-700" />
                          {Number(lawyer?.experienceYears || 0)}{" "}
                          {t.hero.yearsExperience}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                          <Star className="h-3.5 w-3.5 text-cyan-700" />
                          {t.hero.feePrefix}{" "}
                          {formatMoney(lawyer?.consultationFee, t, currentLanguage)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:grid-cols-1">
                    <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {t.stats.availableDays}
                      </p>
                      <p className="mt-1 text-3xl font-black text-slate-950">
                        {availableDays.length}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {t.stats.openSlots}
                      </p>
                      <p className="mt-1 text-3xl font-black text-emerald-700">
                        {openSlots}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {t.stats.bookedPending}
                      </p>
                      <p className="mt-1 text-3xl font-black text-rose-600">
                        {bookedSlots}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pb-20 pt-8">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="space-y-6">
              <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <SectionTitle
                    icon={UserRound}
                    title={t.profileDetails.title}
                    subtitle={t.profileDetails.subtitle}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    icon={UserRound}
                    label={t.profileDetails.name}
                    value={lawyer?.name}
                    t={t}
                  />
                  <InfoCard
                    icon={Gavel}
                    label={t.profileDetails.specialization}
                    value={lawyer?.specialization}
                    t={t}
                  />
                  <InfoCard
                    icon={BriefcaseBusiness}
                    label={t.profileDetails.experience}
                    value={`${Number(lawyer?.experienceYears || 0)} ${
                      t.profileDetails.years
                    }`}
                    t={t}
                  />
                  <InfoCard
                    icon={Star}
                    label={t.profileDetails.consultationFee}
                    value={formatMoney(
                      lawyer?.consultationFee,
                      t,
                      currentLanguage
                    )}
                    t={t}
                  />
                  <InfoCard
                    icon={MapPin}
                    label={t.profileDetails.city}
                    value={lawyer?.city}
                    locked={isLocked("city")}
                    t={t}
                  />
                  <InfoCard
                    icon={Building2}
                    label={t.profileDetails.officeAddress}
                    value={lawyer?.officeAddress}
                    locked={isLocked("officeAddress")}
                    t={t}
                  />
                </div>

                {access?.message && (
                  <div className="mt-4 flex gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{access.message}</span>
                  </div>
                )}
              </div>

              <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <SectionTitle
                    icon={FileText}
                    title={t.about.title}
                    subtitle={t.about.subtitle}
                  />
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold leading-7 text-slate-600">
                    {lawyer?.bio || t.fallback.noProfessionalSummary}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-6 space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <SectionTitle
                      icon={CalendarDays}
                      title={t.calendar.title}
                      subtitle={t.calendar.subtitle}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleQuickRange(days)}
                        disabled={isBookingBusy}
                        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t.calendar.nextDays.replace("{days}", days)}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="date"
                      value={startDate}
                      disabled={isBookingBusy}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setAvailabilityError("");
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <input
                      type="date"
                      value={endDate}
                      disabled={isBookingBusy}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setAvailabilityError("");
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={fetchAvailability}
                      disabled={loadingAvailability || isBookingBusy}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-6 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 xl:col-span-1 xl:w-auto"
                    >
                      {loadingAvailability ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {t.buttons.loadSlots}
                    </button>
                  </div>
                </div>

                {availabilityError && (
                  <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {availabilityError}
                  </div>
                )}

                {loadingAvailability ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50">
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-cyan-700" />
                      <p className="text-sm font-black text-slate-600">
                        {t.loading.availableSlots}
                      </p>
                    </div>
                  </div>
                ) : availability.length === 0 ? (
                  <EmptyAvailability t={t} />
                ) : (
                  <div className="space-y-4">
                    {availability.map((day) => {
                      const dayOpenSlots = (day.slots || []).filter(
                        (slot) => slot.isSelectable
                      ).length;

                      return (
                        <div
                          key={day._id || day.date}
                          className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-black text-slate-950">
                                {formatDate(day.date, currentLanguage)}
                              </h3>

                              <p className="mt-1 text-xs font-bold text-slate-500">
                                {formatDay(day.date, currentLanguage)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  day.isActive
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                }`}
                              >
                                {day.isActive
                                  ? t.calendar.activeDay
                                  : t.calendar.inactive}
                              </span>

                              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                                {t.calendar.openSlots.replace(
                                  "{count}",
                                  dayOpenSlots
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {(day.slots || []).map((slot, index) => {
                              const selected =
                                String(selectedDay?.date) ===
                                  String(day.date) &&
                                String(selectedSlot?.time) ===
                                  String(slot.time);

                              return (
                                <button
                                  key={`${day._id || day.date}-${slot.time}-${index}`}
                                  type="button"
                                  disabled={!slot.isSelectable || isBookingBusy}
                                  onClick={() => handleSelectSlot(day, slot)}
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    selected
                                      ? "border-cyan-600 bg-cyan-50 ring-4 ring-cyan-100"
                                      : slot.isSelectable
                                      ? "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-white"
                                      : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                                  } ${
                                    isBookingBusy
                                      ? "cursor-not-allowed opacity-70"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-base font-black text-slate-950">
                                      {slot.time}
                                    </p>

                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-black ${getSlotBadgeClass(
                                        slot
                                      )}`}
                                    >
                                      {getSlotStatus(slot, t)}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-xs font-bold capitalize text-slate-500">
                                    {(slot.consultationTypes || ["online"])
                                      .map((item) =>
                                        formatConsultationType(item, t)
                                      )
                                      .join(", ")}
                                  </p>

                                  {slot.note && (
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                      {slot.note}
                                    </p>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sticky top-24 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5">
                  <SectionTitle
                    icon={MessageSquareText}
                    title={t.booking.title}
                    subtitle={t.booking.subtitle}
                  />
                </div>

                <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                    {t.booking.selectedSlot}
                  </p>

                  <p
                    className={`mt-1 text-sm font-black ${
                      selectedDay && selectedSlot
                        ? "text-slate-950"
                        : "text-slate-500"
                    }`}
                  >
                    {selectedSummary}
                  </p>
                </div>

                <form onSubmit={handleSubmitBooking} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.booking.consultationType}
                    </label>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {CONSULTATION_TYPES.map((type) => {
                        const Icon = type.icon;
                        const disabled =
                          isBookingBusy ||
                          (selectedSlot &&
                            !selectedSlotTypes.includes(type.value));

                        return (
                          <button
                            key={type.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => setConsultationType(type.value)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-black transition ${
                              consultationType === type.value
                                ? "border-cyan-600 bg-cyan-700 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50"
                            } ${
                              disabled ? "cursor-not-allowed opacity-50" : ""
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {t.consultationTypes[type.labelKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.booking.subject}
                    </label>

                    <input
                      type="text"
                      value={subject}
                      disabled={isBookingBusy}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={160}
                      placeholder={t.booking.subjectPlaceholder}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {subject.length}/160
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      {t.booking.message}
                    </label>

                    <textarea
                      value={message}
                      disabled={isBookingBusy}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={1000}
                      rows={5}
                      placeholder={t.booking.messagePlaceholder}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {message.length}/1000
                    </p>
                  </div>

                  {bookingError && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                      {bookingError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isBookingBusy || !selectedSlot}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBookingBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.buttons.bookingAppointment}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t.buttons.bookAppointment}
                      </>
                    )}
                  </button>

                  <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t.booking.info}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {successModal && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-[34px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-6 pb-6 pt-8 text-center">
                <button
                  type="button"
                  onClick={closeSuccessModal}
                  className="absolute right-4 top-4 rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  {successModal.title}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {successModal.messageText}
                </p>
              </div>

              <div className="space-y-3 px-6 pb-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {t.successModal.lawyer}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {successModal.lawyerName}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t.successModal.date}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatDate(successModal.date, currentLanguage)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t.successModal.time}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {successModal.time}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t.successModal.consultation}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {formatConsultationType(
                        successModal.consultationType,
                        t
                      )}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t.successModal.subject}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {successModal.subject}
                    </p>
                  </div>
                </div>

                {successModal.message && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {t.successModal.message}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                      {successModal.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeSuccessModal}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                  >
                    {t.buttons.continueBrowsing}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/bookings")}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    {t.buttons.viewMyBookings}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
