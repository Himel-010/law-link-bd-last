"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBriefcase,
  FiUser,
  FiMessageCircle,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";
import { FaCrown, FaGem, FaStar, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import i18n from "../../json/plans.json";

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

const getVisibleFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];

  return features
    .filter((feature) => {
      if (!feature) return false;
      if (feature.enabled === false) return false;

      if (feature.valueType === "boolean") return Boolean(feature.value);
      if (feature.valueType === "number") return Number(feature.value) > 0;
      if (feature.valueType === "string") {
        return String(feature.value || "").trim() !== "";
      }

      return false;
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
};

const formatFeatureValue = (feature, t) => {
  if (!feature) return "-";

  if (feature.valueType === "boolean") {
    return feature.value ? t.card.yes : t.card.no;
  }

  if (feature.valueType === "number") {
    const numberValue = Number(feature.value || 0);

    if (numberValue === 999999 || numberValue === 9999) {
      return t.card.unlimited;
    }

    return numberValue.toLocaleString();
  }

  return feature.value || "-";
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount === 0) return null;
  return `৳${amount.toLocaleString("en-BD")}`;
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

const getPlanId = (subscription) => {
  if (!subscription) return "";
  if (typeof subscription.plan === "string") return subscription.plan;
  return subscription.plan?._id || subscription.plan?.id || "";
};

const getPlanTone = (plan, index) => {
  const price = Number(plan.price || 0);

  if (price === 0) {
    return {
      label: "Starter",
      icon: FaStar,
      ring: "border-slate-200",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      glow: "from-slate-100 to-white",
      button: "bg-slate-900 hover:bg-slate-800",
      crown: "bg-slate-900 text-white",
    };
  }

  if (index === 1 || price >= 1000) {
    return {
      label: "Popular",
      icon: FaCrown,
      ring: "border-amber-300",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      glow: "from-amber-100 via-yellow-50 to-white",
      button:
        "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700",
      crown: "bg-gradient-to-br from-amber-400 to-yellow-600 text-white",
    };
  }

  return {
    label: "Premium",
    icon: FaGem,
    ring: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    glow: "from-yellow-100 via-amber-50 to-white",
    button:
      "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700",
    crown: "bg-gradient-to-br from-yellow-400 to-amber-600 text-white",
  };
};

const RoleSelectionModal = ({ open, onSelectRole, t }) => {
  if (!open) return null;

  const roleOptions = [
    {
      id: "client",
      title: t.roleModal.client.title,
      description: t.roleModal.client.description,
      button: t.roleModal.client.button,
      icon: FiUser,
      iconClass: "from-amber-400 to-yellow-600",
    },
    {
      id: "lawyer",
      title: t.roleModal.lawyer.title,
      description: t.roleModal.lawyer.description,
      button: t.roleModal.lawyer.button,
      icon: FiBriefcase,
      iconClass: "from-slate-900 to-slate-700",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white px-6 py-8 text-center sm:px-10">
            <div className="absolute left-0 top-0 h-28 w-28 rounded-br-full bg-amber-100/70" />
            <div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-full bg-yellow-100/70" />

            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-xl shadow-amber-500/20">
                <FaCrown className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {t.roleModal.title}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                {t.roleModal.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {roleOptions.map((role) => {
              const Icon = role.icon;

              return (
                <motion.button
                  key={role.id}
                  type="button"
                  onClick={() => onSelectRole(role.id)}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-[0_22px_60px_rgba(245,158,11,0.16)]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.iconClass} text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    {role.title}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {role.description}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-amber-700">
                    {role.button}
                    <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CurrentSubscriptionStrip = ({
  subscription,
  loading,
  selectedRole,
  onChangeRole,
}) => {
  if (!selectedRole) return null;

  if (loading) {
    return (
      <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-sm">
        Checking current subscription...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto mb-6 flex max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">
            No active subscription found
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Choose a package below.
          </p>
        </div>

        <button
          type="button"
          onClick={onChangeRole}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:bg-white"
        >
          Change Type
          <FiArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-6 flex max-w-4xl flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
          <FiCheckCircle className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black text-slate-900">
            Current: {subscription.planName || "Active Plan"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Ends: {formatDate(subscription.endDate)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChangeRole}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
      >
        Change Type
        <FiArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const PlanCard = ({
  plan,
  index,
  t,
  onChoose,
  choosingPlanId,
  currentSubscription,
  pendingSubscription,
}) => {
  const visibleFeatures = getVisibleFeatures(plan.features);

  const isFree = Number(plan.price || 0) === 0;
  const isChoosing = choosingPlanId === plan._id;
  const tone = getPlanTone(plan, index);
  const ToneIcon = tone.icon;

  const currentPlanId = getPlanId(currentSubscription);

  const isCurrentPlan =
    currentSubscription?.status === "active" && currentPlanId === plan._id;

  const hasActiveOtherPlan =
    currentSubscription?.status === "active" && currentPlanId !== plan._id;

  const hasPendingPayment = Boolean(pendingSubscription?._id);

  const buttonState = useMemo(() => {
    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        disabled: true,
        className: "bg-emerald-600",
        icon: FiCheckCircle,
      };
    }

    if (hasPendingPayment) {
      return {
        text: "Continue Payment",
        disabled: isChoosing,
        className: tone.button,
        icon: FiCreditCard,
      };
    }

    if (hasActiveOtherPlan && isFree) {
      return {
        text: "Active Plan Exists",
        disabled: true,
        className: "bg-slate-400",
        icon: FiCheckCircle,
      };
    }

    if (hasActiveOtherPlan && !isFree) {
      return {
        text: "Upgrade Plan",
        disabled: isChoosing,
        className: tone.button,
        icon: FiArrowRight,
      };
    }

    return {
      text: isFree ? t.card.choosePackage : "Purchase Plan",
      disabled: isChoosing,
      className: tone.button,
      icon: isFree ? FiArrowRight : FiCreditCard,
    };
  }, [
    isCurrentPlan,
    hasPendingPayment,
    hasActiveOtherPlan,
    isFree,
    isChoosing,
    tone.button,
    t,
  ]);

  const ButtonIcon = buttonState.icon;

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[28px] border ${tone.ring} bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(245,158,11,0.18)]`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div
        className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${tone.glow}`}
      />

      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl transition group-hover:bg-amber-300/40" />

      <div className="relative">
        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.crown} shadow-lg`}
            >
              <ToneIcon className="h-5 w-5" />
            </div>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tone.badge}`}
            >
              {tone.label}
            </span>

            {isCurrentPlan && (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Active Now
              </span>
            )}

            {hasPendingPayment && (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Payment Pending
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            {plan.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {plan.description || t.card.defaultDescription}
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-950">
              {isFree ? t.card.free : formatCurrency(plan.price)}
            </span>

            {!isFree && (
              <span className="mb-1 text-sm font-medium text-slate-500">
                / {plan.durationInDays} {t.card.days}
              </span>
            )}
          </div>

          {isFree && (
            <p className="mt-1 text-sm text-slate-500">
              {plan.durationInDays} {t.card.days}
            </p>
          )}
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800">
              {t.card.includedFeatures}
            </h4>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              {visibleFeatures.length} {t.card.items}
            </span>
          </div>

          {visibleFeatures.length > 0 ? (
            <div className="space-y-2">
              {visibleFeatures.slice(0, 6).map((feature, featureIndex) => (
                <div
                  key={`${feature.key}-${featureIndex}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2 text-slate-700">
                    <FaCheckCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="truncate text-sm font-medium">
                      {feature.label || feature.key}
                    </span>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-900">
                    {formatFeatureValue(feature, t)}
                  </span>
                </div>
              ))}

              {visibleFeatures.length > 6 && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-3 py-3 text-center text-sm font-semibold text-amber-700">
                  {t.card.moreFeaturesPrefix}
                  {visibleFeatures.length - 6} {t.card.moreFeaturesSuffix}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              {t.card.noFeatures}
            </div>
          )}
        </div>

        <motion.button
          type="button"
          onClick={() => onChoose(plan, pendingSubscription)}
          disabled={buttonState.disabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-80 ${buttonState.className}`}
          whileHover={{ scale: buttonState.disabled ? 1 : 1.02 }}
          whileTap={{ scale: buttonState.disabled ? 1 : 0.97 }}
        >
          {isChoosing ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {buttonState.text}
              <ButtonIcon className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const PlansPage = () => {
  const navigate = useNavigate();

  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const reduxUser = useSelector((state) => state.user.currentUser);
  const t = i18n[currentLanguage]?.plans || i18n.en.plans;

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(true);
  const [plans, setPlans] = useState([]);

  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loadingCurrentSubscription, setLoadingCurrentSubscription] =
    useState(false);
  const [pendingSubscriptionsByPlan, setPendingSubscriptionsByPlan] = useState(
    {}
  );

  const [loading, setLoading] = useState(false);
  const [choosingPlanId, setChoosingPlanId] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const auth = getStoredAuth();

    if (reduxUser) {
      setAuthUser(reduxUser);
      setToken(auth.token);
      return;
    }

    setAuthUser(auth.user);
    setToken(auth.token);
  }, [reduxUser]);

  useEffect(() => {
    if (authUser?.role && ["client", "lawyer"].includes(authUser.role)) {
      setSelectedRole(authUser.role);
      setShowRoleModal(false);
    }
  }, [authUser]);

  const selectedRoleLabel = useMemo(() => {
    if (selectedRole === "lawyer") return t.header.lawyerBadge;
    if (selectedRole === "client") return t.header.clientBadge;
    return "Subscription Packages";
  }, [selectedRole, t]);

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!token || !authUser || !["client", "lawyer"].includes(authUser.role)) {
      setCurrentSubscription(null);
      return;
    }

    try {
      setLoadingCurrentSubscription(true);

      const res = await axios.get(`${API_BASE_URL}/subscriptions/my/current`, {
        headers: authHeaders,
        withCredentials: true,
      });

      setCurrentSubscription(res.data?.data || null);
    } catch {
      setCurrentSubscription(null);
    } finally {
      setLoadingCurrentSubscription(false);
    }
  }, [token, authUser, authHeaders]);

  const fetchPlans = useCallback(async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await axios.get(`${API_BASE_URL}/plans`, {
        params: {
          roleType: selectedRole,
        },
      });

      setPlans(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t.states.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, t]);

  useEffect(() => {
    if (selectedRole) {
      fetchPlans();
    }
  }, [selectedRole, fetchPlans]);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setPlans([]);
    setError("");
    setMessage("");
    setShowRoleModal(false);
  };

  const openRoleModal = () => {
    setShowRoleModal(true);
  };

  const goToPaymentPage = (plan, subscription) => {
    sessionStorage.setItem(
      "paymentContext",
      JSON.stringify({
        plan,
        subscription,
        createdAt: Date.now(),
      })
    );

    navigate("/payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChoosePlan = async (plan, pendingSubscription = null) => {
    try {
      setError("");
      setMessage("");

      if (pendingSubscription?._id) {
        goToPaymentPage(plan, pendingSubscription);
        return;
      }

      if (!token || !authUser) {
        setError("Please login first to purchase a subscription.");
        return;
      }

      if (!["client", "lawyer"].includes(authUser.role)) {
        setError("Only client or lawyer accounts can purchase subscriptions.");
        return;
      }

      if (authUser.role !== plan.roleType) {
        setError(
          `You selected a ${plan.roleType} package, but you are logged in as ${authUser.role}. Please login with the correct account type.`
        );
        return;
      }

      const currentPlanId = getPlanId(currentSubscription);

      if (
        currentSubscription?.status === "active" &&
        currentPlanId === plan._id
      ) {
        setMessage("This plan is already active.");
        return;
      }

      setChoosingPlanId(plan._id);

      const res = await axios.post(
        `${API_BASE_URL}/subscriptions/choose-plan`,
        {
          planId: plan._id,
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      const subscription = res.data?.data;

      if (!subscription) {
        throw new Error("Subscription was not created");
      }

      const paymentRequired = res.data?.nextStep?.paymentRequired;

      if (!paymentRequired) {
        setMessage(res.data?.message || "Subscription activated successfully.");
        setCurrentSubscription(subscription);
        setPendingSubscriptionsByPlan((prev) => {
          const next = { ...prev };
          delete next[plan._id];
          return next;
        });

        const storedAuth = getStoredAuth();

        if (storedAuth.user) {
          const updatedUser = {
            ...storedAuth.user,
            subscriptionStatus: "active",
            currentSubscription: subscription._id,
          };

          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
          setAuthUser(updatedUser);
        }

        return;
      }

      setPendingSubscriptionsByPlan((prev) => ({
        ...prev,
        [plan._id]: subscription,
      }));

      goToPaymentPage(plan, subscription);
    } catch (err) {
      const existingSubscription = err?.response?.data?.data;
      const nextStep = err?.response?.data?.nextStep;

      if (existingSubscription && nextStep?.paymentRequired) {
        setPendingSubscriptionsByPlan((prev) => ({
          ...prev,
          [plan._id]: existingSubscription,
        }));

        goToPaymentPage(plan, existingSubscription);
      } else {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to choose plan"
        );
      }
    } finally {
      setChoosingPlanId("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-white pb-12 pt-24">
      <RoleSelectionModal
        open={showRoleModal}
        onSelectRole={handleSelectRole}
        t={t}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.header
          className="mx-auto mb-8 max-w-4xl text-center"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
            <FaCrown className="h-4 w-4" />
            {selectedRoleLabel}
          </div>

        </motion.header>

        <CurrentSubscriptionStrip
          subscription={currentSubscription}
          loading={loadingCurrentSubscription}
          selectedRole={selectedRole}
          onChangeRole={openRoleModal}
        />

        {message && (
          <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mx-auto mb-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!selectedRole ? (
          <motion.div
            className="mx-auto max-w-xl rounded-3xl border border-dashed border-amber-300 bg-amber-50/40 px-6 py-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/20">
              <FaCrown className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black text-slate-950">
              Choose a package type first
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Select client or lawyer to view matching subscription packages.
            </p>

            <button
              type="button"
              onClick={openRoleModal}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-600 hover:to-yellow-700"
            >
              Select Package Type
              <FiArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <FiLoader className="h-5 w-5 animate-spin text-amber-600" />
              {t.states.loading}
            </div>
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FiMessageCircle className="h-7 w-7" />
            </div>

            <p className="text-lg font-bold text-slate-700">
              {t.states.emptyTitle}
            </p>

            <p className="mt-2 text-slate-500">
              No active packages are available for this role right now.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan._id || `${plan.roleType}-${plan.slug}`}
                plan={plan}
                index={index}
                t={t}
                onChoose={handleChoosePlan}
                choosingPlanId={choosingPlanId}
                currentSubscription={currentSubscription}
                pendingSubscription={pendingSubscriptionsByPlan[plan._id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPage;