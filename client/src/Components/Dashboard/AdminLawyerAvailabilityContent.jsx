"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiLoader,
  FiSearch,
  FiCalendar,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBriefcase,
  FiPhone,
  FiMail,
  FiMapPin,
  FiShield,
  FiEye,
  FiFilter,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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

const getTodayInput = () => {
  return new Date().toISOString().slice(0, 10);
};

const getFutureInput = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDay = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-BD", {
    weekday: "long",
  });
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(" ").filter(Boolean);

  if (!parts.length) return "L";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getSlotBadgeClass = (slot) => {
  if (slot.isBooked) {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }

  if (slot.status === "blocked") {
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
};

const getSlotLabel = (slot) => {
  if (slot.isBooked) {
    return slot.bookingStatus === "accepted" ? "Booked" : "Pending";
  }

  if (slot.status === "blocked") return "Blocked";

  return "Available";
};

const normalizeSlotSearch = (value = "") => String(value || "").toLowerCase();

const LawyerAvatar = ({ lawyer }) => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-sm font-black tracking-wide text-white shadow-sm">
    {getInitials(lawyer?.name)}
  </div>
);

const StatCard = ({ title, value, icon: Icon, helper }) => (
  <motion.div
    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>

        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </h3>

        {helper && (
          <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
        )}
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ title, message }) => (
  <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
    <FiCalendar className="mb-3 text-4xl text-slate-400" />

    <p className="text-sm font-black text-slate-700">{title}</p>

    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{message}</p>
  </div>
);

const AdminLawyerAvailabilityContent = () => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [lawyerSearch, setLawyerSearch] = useState("");

  const [availability, setAvailability] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const [startDate, setStartDate] = useState(getTodayInput());
  const [endDate, setEndDate] = useState(getFutureInput(30));
  const [slotFilter, setSlotFilter] = useState("");

  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const selectedLawyer = useMemo(() => {
    return lawyers.find((lawyer) => {
      const id = lawyer._id || lawyer.id;
      return id === selectedLawyerId;
    });
  }, [lawyers, selectedLawyerId]);

  const filteredLawyers = useMemo(() => {
    const q = lawyerSearch.trim().toLowerCase();

    if (!q) return lawyers;

    return lawyers.filter((lawyer) => {
      return (
        lawyer.name?.toLowerCase().includes(q) ||
        lawyer.email?.toLowerCase().includes(q) ||
        lawyer.phone?.toLowerCase().includes(q) ||
        lawyer.specialization?.toLowerCase().includes(q) ||
        lawyer.city?.toLowerCase().includes(q)
      );
    });
  }, [lawyers, lawyerSearch]);

  const filteredAvailability = useMemo(() => {
    if (!slotFilter) return availability;

    return availability
      .map((day) => {
        const slots = (day.slots || []).filter((slot) => {
          if (slotFilter === "available") {
            return slot.isSelectable;
          }

          if (slotFilter === "booked") {
            return slot.isBooked;
          }

          if (slotFilter === "pending") {
            return slot.isBooked && slot.bookingStatus === "pending";
          }

          if (slotFilter === "accepted") {
            return slot.isBooked && slot.bookingStatus === "accepted";
          }

          if (slotFilter === "blocked") {
            return slot.status === "blocked";
          }

          return true;
        });

        return {
          ...day,
          slots,
        };
      })
      .filter((day) => day.slots.length > 0);
  }, [availability, slotFilter]);

  const stats = useMemo(() => {
    const allSlots = availability.flatMap((day) => day.slots || []);

    return {
      days: availability.length,
      totalSlots: allSlots.length,
      availableSlots: allSlots.filter((slot) => slot.isSelectable).length,
      bookedSlots: allSlots.filter((slot) => slot.isBooked).length,
      pendingSlots: allSlots.filter(
        (slot) => slot.isBooked && slot.bookingStatus === "pending"
      ).length,
      acceptedSlots: allSlots.filter(
        (slot) => slot.isBooked && slot.bookingStatus === "accepted"
      ).length,
      blockedSlots: allSlots.filter((slot) => slot.status === "blocked").length,
    };
  }, [availability]);

  const fetchLawyers = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingLawyers(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/users/dropdown`, {
        headers: authHeaders,
        params: {
          role: "lawyer",
          search: lawyerSearch.trim(),
          limit: 100,
        },
        withCredentials: true,
      });

      const onlyLawyers = (res.data?.data || []).filter(
        (user) => user.role === "lawyer"
      );

      setLawyers(onlyLawyers);

      if (!selectedLawyerId && onlyLawyers.length > 0) {
        setSelectedLawyerId(onlyLawyers[0]._id || onlyLawyers[0].id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load lawyers");
    } finally {
      setLoadingLawyers(false);
    }
  }, [token, isAdmin, authHeaders, lawyerSearch, selectedLawyerId]);

  const fetchAvailability = useCallback(async () => {
    if (!token || !isAdmin || !selectedLawyerId) return;

    try {
      setLoadingAvailability(true);
      setError("");
      setResponse(null);

      const res = await axios.get(
        `${API_BASE_URL}/lawyer-availability/lawyer/${selectedLawyerId}`,
        {
          headers: authHeaders,
          params: {
            startDate,
            endDate,
          },
          withCredentials: true,
        }
      );

      setAvailability(res.data?.data || []);

      setResponse({
        success: true,
        message: res.data?.message || "Availability fetched successfully",
      });
    } catch (err) {
      setAvailability([]);
      setError(
        err?.response?.data?.message || "Failed to load lawyer availability"
      );
    } finally {
      setLoadingAvailability(false);
    }
  }, [token, isAdmin, selectedLawyerId, authHeaders, startDate, endDate]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const timer = setTimeout(fetchLawyers, 300);
    return () => clearTimeout(timer);
  }, [token, isAdmin, lawyerSearch, fetchLawyers]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleRefreshAll = () => {
    fetchLawyers();
    fetchAvailability();
  };

  const resetFilters = () => {
    setStartDate(getTodayInput());
    setEndDate(getFutureInput(30));
    setSlotFilter("");
    setLawyerSearch("");
  };

  const visibleSlotTypes = (slot) => {
    if (!Array.isArray(slot.consultationTypes) || !slot.consultationTypes.length) {
      return "online";
    }

    return slot.consultationTypes.join(", ").replaceAll("_", " ");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            Please login again
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Login token paoa jai nai. Please abar login koro.
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="rounded-[32px] border border-amber-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            User data missing
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Current user data paoa jai nai. Please abar login koro.
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
            Only admins can view lawyer availability.
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

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  Lawyer Availability
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  View lawyer calendar slots, booked appointments, pending
                  requests and available consultation times.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={loadingLawyers || loadingAvailability}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  <FiRefreshCw
                    className={
                      loadingLawyers || loadingAvailability ? "animate-spin" : ""
                    }
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <FiFilter />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 xl:grid-cols-[1fr_220px_180px_180px_170px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={lawyerSearch}
                  onChange={(e) => setLawyerSearch(e.target.value)}
                  placeholder="Search lawyer by name, email, phone, city..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <select
                value={selectedLawyerId}
                onChange={(e) => setSelectedLawyerId(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">Select Lawyer</option>

                {filteredLawyers.map((lawyer) => (
                  <option key={lawyer._id || lawyer.id} value={lawyer._id || lawyer.id}>
                    {lawyer.name} {lawyer.city ? `— ${lawyer.city}` : ""}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />

              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Slots</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {selectedLawyer && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <LawyerAvatar lawyer={selectedLawyer} />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedLawyer.name}
                      </h3>

                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                        Lawyer
                      </span>

                      {selectedLawyer.isVerifiedLawyer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                          <FiShield />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      {selectedLawyer.email && (
                        <span className="inline-flex items-center gap-1">
                          <FiMail />
                          {selectedLawyer.email}
                        </span>
                      )}

                      {selectedLawyer.phone && (
                        <span className="inline-flex items-center gap-1">
                          <FiPhone />
                          {selectedLawyer.phone}
                        </span>
                      )}

                      {selectedLawyer.city && (
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin />
                          {selectedLawyer.city}
                        </span>
                      )}

                      {selectedLawyer.specialization && (
                        <span className="inline-flex items-center gap-1">
                          <FiBriefcase />
                          {selectedLawyer.specialization}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-700 ring-1 ring-cyan-100">
                  {formatDate(startDate)} — {formatDate(endDate)}
                </div>
              </div>
            </div>
          )}

          {response?.success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {response.message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Available Days"
              value={stats.days}
              icon={FiCalendar}
              helper="Calendar dates"
            />

            <StatCard
              title="Total Slots"
              value={stats.totalSlots}
              icon={FiClock}
              helper={`${stats.availableSlots} available`}
            />

            <StatCard
              title="Booked"
              value={stats.bookedSlots}
              icon={FiXCircle}
              helper={`${stats.acceptedSlots} accepted`}
            />

            <StatCard
              title="Pending"
              value={stats.pendingSlots}
              icon={FiAlertCircle}
              helper={`${stats.blockedSlots} blocked`}
            />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Availability Calendar
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Booked and pending slots cannot be used by another client.
                </p>
              </div>

              <p className="text-sm font-bold text-slate-400">
                Showing {filteredAvailability.length} days
              </p>
            </div>

            {loadingAvailability ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading availability...
                </div>
              </div>
            ) : !selectedLawyerId ? (
              <EmptyState
                title="Select a lawyer"
                message="Choose a lawyer from the dropdown to view availability calendar."
              />
            ) : filteredAvailability.length === 0 ? (
              <EmptyState
                title="No availability found"
                message="No availability slots found for this lawyer in the selected date range."
              />
            ) : (
              <div className="grid gap-4">
                {filteredAvailability.map((day) => {
                  const availableCount = (day.slots || []).filter(
                    (slot) => slot.isSelectable
                  ).length;

                  const bookedCount = (day.slots || []).filter(
                    (slot) => slot.isBooked
                  ).length;

                  return (
                    <motion.div
                      key={day._id || day.date}
                      className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">
                              {formatDate(day.date)}
                            </h4>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                              {formatDay(day.date)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                day.isActive
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              }`}
                            >
                              {day.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                              {availableCount} available
                            </span>

                            <span className="rounded-2xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">
                              {bookedCount} booked
                            </span>

                            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                              {(day.slots || []).length} total
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
                        >
                          <FiEye />
                          View Details
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {(day.slots || []).map((slot, index) => (
                          <div
                            key={`${day._id}-${slot.time}-${index}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-base font-black text-slate-900">
                                {slot.time}
                              </p>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${getSlotBadgeClass(
                                  slot
                                )}`}
                              >
                                {getSlotLabel(slot)}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-semibold capitalize text-slate-500">
                              {visibleSlotTypes(slot)}
                            </p>

                            {slot.note && (
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                {slot.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {formatDate(selectedDay.date)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDay(selectedDay.date)} availability slots
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50"
                >
                  <FiXCircle />
                </button>
              </div>

              <div className="space-y-4 p-6">
                {(selectedDay.slots || []).map((slot, index) => (
                  <div
                    key={`${slot.time}-${index}`}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {slot.time}
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-slate-500">
                          {visibleSlotTypes(slot)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${getSlotBadgeClass(
                          slot
                        )}`}
                      >
                        {getSlotLabel(slot)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">
                          Slot Status
                        </p>
                        <p className="mt-1 text-sm font-black capitalize text-slate-900">
                          {slot.status}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">
                          Booking Status
                        </p>
                        <p className="mt-1 text-sm font-black capitalize text-slate-900">
                          {slot.bookingStatus || "none"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">
                          Selectable
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {slot.isSelectable ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {slot.note && (
                      <div className="mt-3 rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-slate-500">Note</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {slot.note}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminLawyerAvailabilityContent;