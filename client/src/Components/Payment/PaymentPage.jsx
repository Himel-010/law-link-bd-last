"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiCopy,
  FiCreditCard,
  FiLoader,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
  FiXCircle,
} from "react-icons/fi";
import { FaGem } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const PAYMENT_METHODS = [
  {
    label: "bKash",
    value: "bkash",
    icon: FiSmartphone,
    color: "from-pink-500 to-rose-600",
    receiverNumber: "01700000000",
    hint: "Send money to the bKash receiver number below, then submit your transaction ID.",
  },
  {
    label: "Nagad",
    value: "nagad",
    icon: FiCreditCard,
    color: "from-orange-500 to-red-600",
    receiverNumber: "01800000000",
    hint: "Send money to the Nagad receiver number below, then submit your transaction ID.",
  },
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

const getPaymentContext = () => {
  try {
    const raw = sessionStorage.getItem("paymentContext");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("Payment context parse error:", error);
    return null;
  }
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `৳${amount.toLocaleString("en-BD")}`;
};

const validateBangladeshPhone = (value = "") => {
  const cleaned = String(value).trim();
  return /^01[3-9]\d{8}$/.test(cleaned);
};

const ProcessingPaymentModal = ({ open, stage }) => {
  if (!open) return null;

  const isSuccess = stage === "success";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md overflow-hidden rounded-[34px] border border-white/20 bg-white p-8 text-center shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            {!isSuccess && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-cyan-100"
                  animate={{ scale: [1, 1.12, 1], opacity: [1, 0.45, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-dashed border-cyan-500"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                <motion.div
                  className="absolute inset-5 rounded-full bg-cyan-50"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/30">
                  <FiRefreshCw className="h-8 w-8 animate-spin" />
                </div>
              </>
            )}

            {isSuccess && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-100"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 12 }}
                />

                <motion.div
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/30"
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 13 }}
                >
                  <FiCheckCircle className="h-10 w-10" />
                </motion.div>
              </>
            )}
          </div>

          <motion.h2
            key={stage}
            className="text-3xl font-black tracking-tight text-slate-950"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isSuccess ? "Payment Successful" : "Completing Payment..."}
          </motion.h2>

          <motion.p
            key={`${stage}-text`}
            className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-500"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isSuccess
              ? "Your payment information has been submitted successfully. Redirecting you now."
              : "Please wait while we securely submit and sync your payment information."}
          </motion.p>

          {!isSuccess && (
            <div className="mt-6 space-y-2">
              <motion.div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-600"
                  initial={{ width: "12%" }}
                  animate={{ width: ["12%", "55%", "82%", "96%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                Syncing payment
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [paymentContext, setPaymentContext] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [note, setNote] = useState("");

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [processingStage, setProcessingStage] = useState("processing");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const authHeaders = useMemo(() => {
    if (!token) return {};

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);

    const context = getPaymentContext();

    if (!context?.subscription?._id || !context?.plan?._id) {
      setError("Payment information was not found. Please choose a plan again.");
      return;
    }

    setPaymentContext(context);
  }, []);

  const plan = paymentContext?.plan;
  const subscription = paymentContext?.subscription;

  const selectedPaymentMethod = PAYMENT_METHODS.find(
    (method) => method.value === selectedMethod
  );

  const totalPayable = formatCurrency(plan?.price);

  const canSubmit =
    Boolean(paymentContext) &&
    Boolean(selectedMethod) &&
    Boolean(transactionId.trim()) &&
    Boolean(senderNumber.trim()) &&
    !submitting;

  const handleBackToPlans = () => {
    if (submitting) return;

    navigate("/plans");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCopyReceiverNumber = async () => {
    if (!selectedPaymentMethod?.receiverNumber) return;

    try {
      await navigator.clipboard.writeText(selectedPaymentMethod.receiverNumber);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      setError("Failed to copy receiver number.");
    }
  };

  const validatePaymentForm = () => {
    const errors = {};

    if (!authUser || !token) {
      errors.auth = "Please login first to complete the payment.";
    }

    if (!subscription?._id) {
      errors.subscription = "Subscription information was not found.";
    }

    if (!selectedMethod) {
      errors.selectedMethod = "Please select bKash or Nagad first.";
    }

    if (!transactionId.trim()) {
      errors.transactionId = "Transaction ID is required.";
    } else if (transactionId.trim().length < 6) {
      errors.transactionId = "Transaction ID looks too short.";
    }

    if (!senderNumber.trim()) {
      errors.senderNumber = "Sender number is required.";
    } else if (!validateBangladeshPhone(senderNumber)) {
      errors.senderNumber =
        "Enter a valid Bangladeshi number. Example: 017xxxxxxxx";
    }

    setFieldErrors(errors);

    if (errors.auth || errors.subscription) {
      setError(errors.auth || errors.subscription);
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    setError("");

    const isValid = validatePaymentForm();

    if (!isValid) return;

    try {
      setSubmitting(true);
      setProcessingStage("processing");
      setProcessingModalOpen(true);

      await axios.post(
        `${API_BASE_URL}/payments/create`,
        {
          subscriptionId: subscription._id,
          method: selectedMethod,
          transactionId: transactionId.trim(),
          senderNumber: senderNumber.trim(),
          receiverNumber: selectedPaymentMethod?.receiverNumber || null,
          amount: Number(plan?.price || 0),
          note: note.trim() || null,
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 900));

      setProcessingStage("success");
      sessionStorage.removeItem("paymentContext");

      await new Promise((resolve) => setTimeout(resolve, 1200));

      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setProcessingModalOpen(false);
      setProcessingStage("processing");

      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/40 to-slate-50 px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <ProcessingPaymentModal
        open={processingModalOpen}
        stage={processingStage}
      />

      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={handleBackToPlans}
          disabled={submitting}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Plans
        </button>

        <motion.div
          className="mx-auto mb-8 max-w-2xl text-center"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-xl shadow-amber-500/25">
            <FaGem className="h-9 w-9" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Complete Payment
          </h1>
        </motion.div>

        {error && (
          <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <FiXCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-bold leading-5">{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/20">
                <FaGem className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                  Selected Plan
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {plan?.name || "Package"}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {plan?.description || "Legal service subscription plan"}
                </p>
              </div>
            </div>

            <div className="my-6 h-px bg-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-5">
                <span className="text-sm font-bold text-slate-500">
                  Amount
                </span>
                <span className="text-3xl font-black text-slate-950">
                  {totalPayable}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="text-sm font-bold text-slate-500">
                  Duration
                </span>
                <span className="text-sm font-black text-slate-950">
                  {plan?.durationInDays || 30} Days
                </span>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="text-sm font-bold text-slate-500">
                  Account Type
                </span>
                <span className="text-sm font-black capitalize text-slate-950">
                  {plan?.roleType || authUser?.role || "User"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5">
                <span className="text-sm font-bold text-slate-500">
                  Verification
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  <FiShield className="h-3.5 w-3.5" />
                  Admin Review
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Payment Details
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Select a method before entering transaction information.
                </p>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 sm:flex">
                <FiCreditCard className="h-6 w-6" />
              </div>
            </div>

            {!paymentContext ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <FiXCircle className="h-8 w-8" />
                </div>

                <h3 className="text-xl font-black text-slate-950">
                  No Payment Context
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                  Please go back to the plans page and select a package again.
                </p>

                <button
                  type="button"
                  onClick={handleBackToPlans}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
                >
                  Go to Plans
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-5">
                <div>
                  <label className="mb-3 block text-sm font-black text-slate-800">
                    Select Payment Method *
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const active = selectedMethod === method.value;

                      return (
                        <button
                          key={method.value}
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setSelectedMethod(method.value);
                            clearFieldError("selectedMethod");
                          }}
                          className={`relative overflow-hidden rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            active
                              ? "border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10"
                              : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40"
                          }`}
                        >
                          <div
                            className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${method.color} text-white shadow-md`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <p className="text-sm font-black text-slate-950">
                            {method.label}
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Send Money
                          </p>

                          {active && (
                            <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white">
                              <FiCheckCircle className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {fieldErrors.selectedMethod && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {fieldErrors.selectedMethod}
                    </p>
                  )}

                  <AnimatePresence>
                    {selectedPaymentMethod && (
                      <motion.div
                        className="mt-4 rounded-3xl border border-cyan-100 bg-cyan-50/80 p-4"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                          Receiver Number
                        </p>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-2xl font-black text-slate-950">
                              {selectedPaymentMethod.receiverNumber}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {selectedPaymentMethod.label} Send Money
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyReceiverNumber}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-cyan-700 shadow-sm transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {copied ? (
                              <>
                                <FiCheckCircle className="h-4 w-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <FiCopy className="h-4 w-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>

                        <p className="mt-3 text-sm font-semibold leading-6 text-cyan-800">
                          {selectedPaymentMethod.hint}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-800">
                      Transaction ID *
                    </label>

                    <input
                      type="text"
                      value={transactionId}
                      disabled={submitting}
                      onChange={(e) => {
                        setTransactionId(e.target.value);
                        clearFieldError("transactionId");
                      }}
                      placeholder={
                        selectedPaymentMethod
                          ? `${selectedPaymentMethod.label} transaction ID`
                          : "Select method first"
                      }
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        fieldErrors.transactionId
                          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                          : "border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      }`}
                    />

                    {fieldErrors.transactionId && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        {fieldErrors.transactionId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-800">
                      Sender Number *
                    </label>

                    <input
                      type="text"
                      value={senderNumber}
                      disabled={submitting}
                      onChange={(e) => {
                        setSenderNumber(e.target.value);
                        clearFieldError("senderNumber");
                      }}
                      placeholder="Example: 017xxxxxxxx"
                      className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        fieldErrors.senderNumber
                          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                          : "border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      }`}
                    />

                    {fieldErrors.senderNumber && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        {fieldErrors.senderNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Payment Note
                  </label>

                  <textarea
                    rows={3}
                    value={note}
                    disabled={submitting}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note for admin"
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-3xl border border-cyan-100 bg-cyan-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Total Payable
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {plan?.name || "Selected Package"}
                    </p>
                  </div>

                  <p className="text-3xl font-black text-slate-950">
                    {totalPayable}
                  </p>
                </div>

                {!selectedMethod && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                    Please select bKash or Nagad before submitting payment.
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    canSubmit
                      ? "bg-gradient-to-r from-cyan-500 to-sky-600 shadow-cyan-500/20 hover:from-cyan-600 hover:to-sky-700"
                      : "bg-slate-400 shadow-slate-300/20"
                  }`}
                  whileHover={{ scale: canSubmit ? 1.01 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                >
                  {submitting ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Submitting Payment...
                    </>
                  ) : (
                    <>
                      Submit Payment
                      <FiArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;