"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  RefreshCcw,
  Loader2,
  AlertCircle,
  UserRound,
  ArrowRight,
  MapPin,
  BriefcaseBusiness,
  BadgeCheck,
  ShieldCheck,
  Lock,
  Clock,
  Filter,
  Eye,
  X,
  CalendarDays,
} from "lucide-react";

// JSON i18n file
import lawyersI18n from "../../json/lawyers.json";

const normalizeApiBaseUrl = (value = "") => {
  const cleanBase = String(value || "https://law-link-bd-last.vercel.app").replace(/\/$/, "");
  return cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const LAWYER_SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Property Law",
  "Corporate Law",
  "Immigration Law",
  "Employment Law",
  "Tax Law",
  "Civil Law",
  "Cyber Law",
  "Other",
];

const AVAILABILITY_OPTIONS = ["available", "busy", "offline"];

const getStoredToken = () => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  return localToken || sessionToken || "";
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

const getTranslatedSpecialization = (value, t) => {
  if (!value) return "";
  return t.specializations?.[value] || value;
};

const getTranslatedAvailability = (value, t) => {
  if (!value) return "";
  return t.availability?.[value] || value;
};

const LawyerImage = ({ lawyer, t }) => {
  if (lawyer?.profileImage) {
    return (
      <img
        src={lawyer.profileImage}
        alt={lawyer?.name || t.meta.profileAlt}
        className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-white shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-cyan-700 text-2xl font-black text-white ring-4 ring-white shadow-sm">
      {getInitials(lawyer?.name)}
    </div>
  );
};

const EmptyState = ({ onReset, t }) => (
  <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
      <UserRound className="h-8 w-8" />
    </div>

    <h3 className="mt-5 text-2xl font-black text-slate-950">
      {t.empty.title}
    </h3>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      {t.empty.description}
    </p>

    <button
      type="button"
      onClick={onReset}
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
    >
      <RefreshCcw className="h-4 w-4" />
      {t.empty.clearFilters}
    </button>
  </div>
);

const LawyerCard = ({ lawyer, index, t }) => {
  const navigate = useNavigate();

  const lawyerId = lawyer?._id || lawyer?.id || index;
  const access = lawyer?.access || {};
  const hasFullAccess = Boolean(access?.lawyerDetailAccess);
  const lockedFields = Array.isArray(access?.lockedFields)
    ? access.lockedFields
    : [];

  const imageLocked = lockedFields.includes("profileImage");
  const cityLocked = lockedFields.includes("city");

  return (
    <motion.article
      key={lawyerId}
      className="group overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
    >
      <div className="relative bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6">
        <div className="absolute right-5 top-5">
          {lawyer?.isVerifiedLawyer ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t.card.verified}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
              <Clock className="h-3.5 w-3.5" />
              {t.card.pending}
            </span>
          )}
        </div>

        <div className="flex items-start gap-4 pr-24">
          {imageLocked ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-slate-100 text-slate-400 ring-4 ring-white shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
          ) : (
            <LawyerImage lawyer={lawyer} t={t} />
          )}

          <div className="min-w-0 pt-1">
            <h2 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950">
              {lawyer?.name || t.card.unnamedLawyer}
            </h2>

            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 ring-1 ring-slate-200">
              <MapPin className="h-3.5 w-3.5 text-cyan-700" />
              {cityLocked ? t.card.locked : lawyer?.city || t.card.notSet}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {lawyer?.bio && (
          <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-500">
            {lawyer.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
              {t.card.practiceArea}
            </div>

            <p className="mt-2 truncate text-sm font-black text-slate-950">
              {getTranslatedSpecialization(lawyer?.specialization, t) ||
                t.card.legalConsultant}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-700">
              <BriefcaseBusiness className="h-4 w-4" />
              {t.card.experience}
            </div>

            <p className="mt-2 truncate text-sm font-black text-slate-950">
              {Number(lawyer?.experienceYears || 0)} {t.card.years}
            </p>
          </div>
        </div>

        {!hasFullAccess && (
          <div className="flex gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t.card.lockedMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(`/lawyers/${lawyerId}`)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-black text-white transition hover:bg-cyan-800"
        >
          <CalendarDays className="h-4 w-4" />
          {t.card.viewDetailsBook}
        </button>
      </div>
    </motion.article>
  );
};

export default function LawyersPage() {
  const currentLanguage = useSelector(
    (state) => state.language?.currentLanguage || "en"
  );

  const t =
    lawyersI18n[currentLanguage]?.lawyers || lawyersI18n.en.lawyers;

  const [lawyers, setLawyers] = useState([]);
  const [search, setSearch] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [minExperience, setMinExperience] = useState("");
  const [maxConsultationFee, setMaxConsultationFee] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (subscriptionStatus !== "all") count += 1;
    if (specialization !== "all") count += 1;
    if (availability !== "all") count += 1;
    if (sortBy !== "recommended") count += 1;
    if (minExperience !== "") count += 1;
    if (maxConsultationFee !== "") count += 1;

    return count;
  }, [
    subscriptionStatus,
    specialization,
    availability,
    sortBy,
    minExperience,
    maxConsultationFee,
  ]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    params.set("limit", "12");
    params.set("sortBy", sortBy);

    if (search.trim()) params.set("search", search.trim());
    if (subscriptionStatus !== "all") {
      params.set("subscriptionStatus", subscriptionStatus);
    }
    if (specialization !== "all") params.set("specialization", specialization);
    if (availability !== "all") params.set("availability", availability);
    if (minExperience !== "") params.set("minExperience", minExperience);
    if (maxConsultationFee !== "") {
      params.set("maxConsultationFee", maxConsultationFee);
    }

    return params;
  }, [
    search,
    subscriptionStatus,
    specialization,
    availability,
    sortBy,
    minExperience,
    maxConsultationFee,
  ]);

  const fetchLawyers = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        setError("");

        const params = new URLSearchParams(queryParams);

        if (cursor) params.set("cursor", cursor);

        const token = getStoredToken();

        const res = await fetch(
          `${API_BASE_URL}/users/lawyers?${params.toString()}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || t.messages.fetchFailed);
        }

        const newData = Array.isArray(result.data) ? result.data : [];

        setLawyers((prev) => (append ? [...prev, ...newData] : newData));
        setNextCursor(result?.meta?.nextCursor || null);
        setHasNextPage(Boolean(result?.meta?.hasNextPage));
        setFullAccess(Boolean(result?.meta?.lawyerDetailAccess));
      } catch (err) {
        setError(err.message || t.messages.somethingWrong);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [queryParams, t.messages.fetchFailed, t.messages.somethingWrong]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLawyers();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchLawyers]);

  const handleReset = () => {
    setSearch("");
    setSubscriptionStatus("all");
    setSpecialization("all");
    setAvailability("all");
    setSortBy("recommended");
    setMinExperience("");
    setMaxConsultationFee("");
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-24">
      <section className="bg-white pb-7 pt-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3.5 py-1.5 text-xs font-black text-cyan-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.header.badge}
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              {t.header.title}
            </h1>

            <div className="mx-auto mt-7 flex max-w-3xl items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black transition ${
                  showFilters
                    ? "border-cyan-600 bg-cyan-700 text-white shadow-lg shadow-cyan-700/20"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                }`}
                aria-label={t.filters.toggle}
              >
                {showFilters ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}

                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 text-[10px] font-black text-white ring-2 ring-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center justify-center gap-3 text-xs font-bold text-slate-500 sm:flex-row">
              <span>
                {t.header.showing}{" "}
                <span className="font-black text-slate-950">
                  {lawyers.length}
                </span>{" "}
                {lawyers.length === 1
                  ? t.header.approvedLawyerSingular
                  : t.header.approvedLawyerPlural}
              </span>

              <span className="hidden h-1.5 w-1.5 rounded-full bg-slate-300 sm:block" />

              {fullAccess ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  <Eye className="h-3.5 w-3.5" />
                  {t.header.fullAccess}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                  <Lock className="h-3.5 w-3.5" />
                  {t.header.lockedAccess}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showFilters && (
          <motion.section
            className="relative z-10 pb-8"
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 md:p-6">
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-950">
                      {t.filters.title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {t.filters.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {t.filters.reset}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">{t.filters.allSpecializations}</option>
                    {LAWYER_SPECIALIZATIONS.map((item) => (
                      <option key={item} value={item}>
                        {getTranslatedSpecialization(item, t)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">{t.filters.allAvailability}</option>
                    {AVAILABILITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {getTranslatedAvailability(item, t)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="recommended">{t.sort.recommended}</option>
                    <option value="rating">{t.sort.rating}</option>
                    <option value="experience">{t.sort.experience}</option>
                    <option value="feeLow">{t.sort.feeLow}</option>
                    <option value="newest">{t.sort.newest}</option>
                  </select>

                  <select
                    value={subscriptionStatus}
                    onChange={(e) => setSubscriptionStatus(e.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="all">{t.filters.allPlans}</option>
                    <option value="active">{t.subscriptionStatus.active}</option>
                    <option value="pending">{t.subscriptionStatus.pending}</option>
                    <option value="expired">{t.subscriptionStatus.expired}</option>
                    <option value="cancelled">
                      {t.subscriptionStatus.cancelled}
                    </option>
                    <option value="none">{t.subscriptionStatus.none}</option>
                  </select>

                  <div className="relative">
                    <BriefcaseBusiness className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      placeholder={t.filters.minExperiencePlaceholder}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={maxConsultationFee}
                      onChange={(e) => setMaxConsultationFee(e.target.value)}
                      placeholder={t.filters.maxFeePlaceholder}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-11 w-11 animate-spin text-cyan-700" />
                <p className="text-sm font-black text-slate-600">
                  {t.loading.lawyers}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-100 bg-rose-50 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-11 w-11 text-rose-500" />

              <h3 className="mb-2 text-xl font-black text-rose-700">
                {t.error.title}
              </h3>

              <p className="mb-5 text-sm font-semibold text-rose-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => fetchLawyers()}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700"
              >
                {t.error.tryAgain}
              </button>
            </div>
          ) : lawyers.length === 0 ? (
            <EmptyState onReset={handleReset} t={t} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {lawyers.map((lawyer, index) => (
                  <LawyerCard
                    key={lawyer?._id || lawyer?.id || index}
                    lawyer={lawyer}
                    index={index}
                    t={t}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      fetchLawyers({
                        cursor: nextCursor,
                        append: true,
                      })
                    }
                    disabled={loadingMore}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-7 py-4 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t.loading.more}
                      </>
                    ) : (
                      <>
                        {t.actions.loadMore}
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
