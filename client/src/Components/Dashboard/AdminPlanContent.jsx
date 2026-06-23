import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiPackage,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiSearch,
  FiLayers,
  FiUsers,
  FiBriefcase,
  FiShield,
  FiToggleLeft,
  FiHash,
  FiType,
  FiInfo,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = "http://localhost:4000/api";

const initialForm = {
  name: "",
  slug: "",
  roleType: "client",
  description: "",
  price: 0,
  durationInDays: 30,
  currency: "BDT",
  isActive: true,
  sortOrder: 0,
  features: [],
};

const createEmptyFeature = () => ({
  key: "",
  label: "",
  description: "",
  valueType: "boolean",
  value: false,
  enabled: true,
  sortOrder: 1,
});

const clientFeatureTemplates = [
  {
    key: "case_post_limit",
    label: "Case Post Limit",
    description:
      "How many case posts the client can create during this plan period.",
    valueType: "number",
    value: 1,
    enabled: true,
    sortOrder: 1,
  },
  {
    key: "connection_request_limit",
    label: "Connection Request Limit",
    description: "How many lawyer connection requests the client can send.",
    valueType: "number",
    value: 2,
    enabled: true,
    sortOrder: 2,
  },
  {
    key: "booking_request_limit",
    label: "Consultation Booking Limit",
    description: "How many consultation booking requests the client can send.",
    valueType: "number",
    value: 1,
    enabled: true,
    sortOrder: 3,
  },
  {
    key: "in_app_messaging",
    label: "In-App Messaging",
    description: "Allow the client to send and receive messages inside the app.",
    valueType: "boolean",
    value: true,
    enabled: true,
    sortOrder: 4,
  },
  {
    key: "message_limit",
    label: "Message Limit",
    description: "Maximum number of messages allowed in the reset period.",
    valueType: "number",
    value: 10,
    enabled: true,
    sortOrder: 5,
  },
  {
    key: "message_reset_days",
    label: "Message Reset Days",
    description: "After how many days the message limit will reset.",
    valueType: "number",
    value: 7,
    enabled: true,
    sortOrder: 6,
  },
  {
    key: "lawyer_detail_access",
    label: "Full Lawyer Details",
    description:
      "Allow the client to view lawyer phone, email, image, address, city, fee and full profile details.",
    valueType: "boolean",
    value: false,
    enabled: true,
    sortOrder: 7,
  },
  {
    key: "contact_unlock",
    label: "Contact Unlock",
    description: "Allow the client to unlock contact information.",
    valueType: "boolean",
    value: false,
    enabled: true,
    sortOrder: 8,
  },
  {
    key: "priority_post",
    label: "Priority Case Post",
    description: "Allow the client to create priority case posts.",
    valueType: "boolean",
    value: false,
    enabled: true,
    sortOrder: 9,
  },
];

const lawyerFeatureTemplates = [
  {
    key: "proposal_limit",
    label: "Proposal Limit",
    description:
      "How many proposals the lawyer can send during this plan period.",
    valueType: "number",
    value: 5,
    enabled: true,
    sortOrder: 1,
  },
  {
    key: "connection_request_limit",
    label: "Connection Request Limit",
    description: "How many connection requests the lawyer can use.",
    valueType: "number",
    value: 3,
    enabled: true,
    sortOrder: 2,
  },
  {
    key: "availability_calendar_access",
    label: "Availability Calendar Access",
    description:
      "Allow the lawyer to create, view, update, block and manage consultation availability calendar.",
    valueType: "boolean",
    value: true,
    enabled: true,
    sortOrder: 3,
  },
  {
    key: "availability_slot_limit",
    label: "Availability Slot Limit",
    description:
      "Maximum active availability slots the lawyer can create during this subscription period.",
    valueType: "number",
    value: 10,
    enabled: true,
    sortOrder: 4,
  },
  {
    key: "in_app_messaging",
    label: "In-App Messaging",
    description: "Allow the lawyer to send and receive messages inside the app.",
    valueType: "boolean",
    value: true,
    enabled: true,
    sortOrder: 5,
  },
  {
    key: "message_limit",
    label: "Message Limit",
    description: "Maximum number of messages allowed in the reset period.",
    valueType: "number",
    value: 10,
    enabled: true,
    sortOrder: 6,
  },
  {
    key: "message_reset_days",
    label: "Message Reset Days",
    description: "After how many days the message limit will reset.",
    valueType: "number",
    value: 7,
    enabled: true,
    sortOrder: 7,
  },
  {
    key: "booking_response_access",
    label: "Booking Response Access",
    description: "Allow the lawyer to accept or reject consultation bookings.",
    valueType: "boolean",
    value: true,
    enabled: true,
    sortOrder: 8,
  },
  {
    key: "contact_unlock",
    label: "Contact Unlock",
    description: "Allow the lawyer to unlock contact information.",
    valueType: "boolean",
    value: false,
    enabled: true,
    sortOrder: 9,
  },
  {
    key: "profile_boost",
    label: "Profile Boost",
    description: "Boost the lawyer profile higher in public lawyer search.",
    valueType: "boolean",
    value: false,
    enabled: true,
    sortOrder: 10,
  },
];

const permissionHelpText = {
  case_post_limit: "Number input. Example: 1 for free plan, 10 for paid plan.",
  connection_request_limit:
    "Number input. Controls connection request limit inside the subscription period.",
  booking_request_limit:
    "Number input. Controls consultation booking request limit.",
  in_app_messaging: "Toggle. Turn on to allow messaging.",
  message_limit: "Number input. Works with Message Reset Days.",
  message_reset_days: "Number input. Example: 7 means reset every 7 days.",
  lawyer_detail_access:
    "Toggle. Turn on for paid client plans to show full lawyer details.",
  contact_unlock:
    "Toggle. Turn on if this plan can unlock contact information.",
  priority_post: "Toggle. Turn on to allow priority case posts.",
  proposal_limit: "Number input. Controls how many proposals lawyer can send.",
  availability_calendar_access:
    "Toggle. Must be turned on to allow lawyer availability calendar access.",
  availability_slot_limit:
    "Number input. Must be greater than 0. Controls how many availability slots lawyer can create.",
  booking_response_access:
    "Toggle. Turn on to allow accept/reject consultation bookings.",
  profile_boost: "Toggle. Turn on to boost lawyer profile visibility.",
};

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

const normalizeSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeFeatureKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const formatFeatureValue = (feature) => {
  if (feature.valueType === "boolean") {
    return feature.value ? "Allowed" : "Blocked";
  }

  if (feature.valueType === "number") {
    return Number(feature.value || 0);
  }

  return feature.value || "-";
};

const getRoleBadgeClass = (roleType) => {
  if (roleType === "lawyer") {
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  }

  return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";
};

const getStatusBadgeClass = (isActive) => {
  if (isActive) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
};

const getTypeIcon = (valueType) => {
  if (valueType === "number") return FiHash;
  if (valueType === "string") return FiType;
  return FiToggleLeft;
};

const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => {
      if (!disabled) onChange(!checked);
    }}
    disabled={disabled}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
      checked ? "bg-cyan-600" : "bg-slate-300"
    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          {value}
        </h3>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-100">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const PermissionCard = ({ feature, index, updateFeature, removeFeature }) => {
  const TypeIcon = getTypeIcon(feature.valueType);

  return (
    <motion.div
      layout
      className={`rounded-[28px] border bg-white p-5 shadow-sm transition ${
        feature.enabled ? "border-slate-200" : "border-slate-200 opacity-70"
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
            <TypeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Permission Name
                </label>
                <input
                  type="text"
                  value={feature.label}
                  onChange={(e) =>
                    updateFeature(index, "label", e.target.value)
                  }
                  placeholder="Availability Calendar Access"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Backend Key
                </label>
                <input
                  type="text"
                  value={feature.key}
                  onChange={(e) => updateFeature(index, "key", e.target.value)}
                  placeholder="availability_calendar_access"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                What does this permission do?
              </label>
              <textarea
                value={feature.description}
                onChange={(e) =>
                  updateFeature(index, "description", e.target.value)
                }
                rows={2}
                placeholder="Explain this permission for admin..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            {permissionHelpText[feature.key] && (
              <div className="mt-3 flex gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-semibold leading-5 text-cyan-800">
                <FiInfo className="mt-0.5 shrink-0" />
                <span>{permissionHelpText[feature.key]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-[340px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Type
              </label>
              <select
                value={feature.valueType}
                onChange={(e) =>
                  updateFeature(index, "valueType", e.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              >
                <option value="boolean">Toggle</option>
                <option value="number">Number</option>
                <option value="string">Text</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Sort
              </label>
              <input
                type="number"
                value={feature.sortOrder}
                onChange={(e) =>
                  updateFeature(
                    index,
                    "sortOrder",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Permission Value
            </label>

            {feature.valueType === "boolean" ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {feature.value ? "Allowed" : "Blocked"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Turn on/off this permission
                  </p>
                </div>

                <ToggleSwitch
                  checked={Boolean(feature.value)}
                  onChange={(checked) => updateFeature(index, "value", checked)}
                />
              </div>
            ) : feature.valueType === "number" ? (
              <input
                type="number"
                min="0"
                value={feature.value}
                onChange={(e) =>
                  updateFeature(
                    index,
                    "value",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Enter limit"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            ) : (
              <input
                type="text"
                value={feature.value}
                onChange={(e) => updateFeature(index, "value", e.target.value)}
                placeholder="Enter text value"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-800">
                Permission Active
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Include in this plan
              </p>
            </div>

            <ToggleSwitch
              checked={Boolean(feature.enabled)}
              onChange={(checked) => updateFeature(index, "enabled", checked)}
            />
          </div>

          <button
            type="button"
            onClick={() => removeFeature(index)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
          >
            <FiTrash2 />
            Remove Permission
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AdminPlanContent = () => {
  const [form, setForm] = useState(initialForm);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingPlanId, setEditingPlanId] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const selectedRoleTemplates = useMemo(() => {
    return form.roleType === "lawyer"
      ? lawyerFeatureTemplates
      : clientFeatureTemplates;
  }, [form.roleType]);

  const filteredPlans = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return plans;

    return plans.filter((plan) => {
      const featureMatch = Array.isArray(plan.features)
        ? plan.features.some((feature) => {
            return (
              feature.key?.toLowerCase().includes(q) ||
              feature.label?.toLowerCase().includes(q) ||
              feature.description?.toLowerCase().includes(q)
            );
          })
        : false;

      return (
        plan.name?.toLowerCase().includes(q) ||
        plan.slug?.toLowerCase().includes(q) ||
        plan.roleType?.toLowerCase().includes(q) ||
        plan.description?.toLowerCase().includes(q) ||
        featureMatch
      );
    });
  }, [plans, searchTerm]);

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.isActive).length,
      client: plans.filter((plan) => plan.roleType === "client").length,
      lawyer: plans.filter((plan) => plan.roleType === "lawyer").length,
    }),
    [plans]
  );

  const fetchPlans = useCallback(async () => {
    if (!token || !isAdmin) return;

    try {
      setLoadingPlans(true);
      setError("");

      const params = {};
      if (roleFilter) params.roleType = roleFilter;
      if (activeFilter !== "") params.isActive = activeFilter;

      const res = await axios.get(`${API_BASE_URL}/plans/admin/all/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setPlans(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoadingPlans(false);
    }
  }, [token, isAdmin, roleFilter, activeFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans, reloadKey]);

  const triggerReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setEditingPlanId("");
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
    setError("");
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setError("");
    setResponse(null);
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((plan) => {
    setEditingPlanId(plan._id);

    const normalizedFeatures = Array.isArray(plan.features)
      ? plan.features.map((feature, index) => ({
          key: feature.key || "",
          label: feature.label || "",
          description: feature.description || "",
          valueType: feature.valueType || "boolean",
          value:
            feature.valueType === "boolean"
              ? Boolean(feature.value)
              : feature.valueType === "number"
              ? Number(feature.value || 0)
              : feature.value || "",
          enabled:
            feature.enabled === undefined ? true : Boolean(feature.enabled),
          sortOrder: feature.sortOrder ?? index + 1,
        }))
      : [];

    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      roleType: plan.roleType || "client",
      description: plan.description || "",
      price: plan.price ?? 0,
      durationInDays: plan.durationInDays ?? 30,
      currency: plan.currency || "BDT",
      isActive: Boolean(plan.isActive),
      sortOrder: plan.sortOrder ?? 0,
      features: normalizedFeatures,
    });

    setError("");
    setResponse(null);
    setIsModalOpen(true);
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      setForm((prev) => {
        let updatedValue = type === "checkbox" ? checked : value;

        if (["price", "durationInDays", "sortOrder"].includes(name)) {
          updatedValue = value === "" ? "" : Number(value);
        }

        const updated = {
          ...prev,
          [name]: updatedValue,
        };

        if (name === "name" && !editingPlanId) {
          updated.slug = normalizeSlug(value);
        }

        if (name === "slug") {
          updated.slug = normalizeSlug(value);
        }

        return updated;
      });

      setError("");
      setResponse(null);
    },
    [editingPlanId]
  );

  const handleRoleChange = useCallback((e) => {
    const newRoleType = e.target.value;

    setForm((prev) => ({
      ...prev,
      roleType: newRoleType,
      features: [],
    }));

    setError("");
    setResponse(null);
  }, []);

  const addFeature = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          ...createEmptyFeature(),
          sortOrder: prev.features.length + 1,
        },
      ],
    }));

    setError("");
    setResponse(null);
  }, []);

  const addRoleTemplates = useCallback(() => {
    setForm((prev) => {
      const templates =
        prev.roleType === "lawyer"
          ? lawyerFeatureTemplates
          : clientFeatureTemplates;

      const existingKeys = new Set(
        prev.features.map((feature) => normalizeFeatureKey(feature.key))
      );

      const newFeatures = templates
        .filter((feature) => !existingKeys.has(feature.key))
        .map((feature) => ({ ...feature }));

      return {
        ...prev,
        features: [...prev.features, ...newFeatures],
      };
    });

    setError("");
    setResponse(null);
  }, []);

  const replaceWithRoleTemplates = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      features:
        prev.roleType === "lawyer"
          ? lawyerFeatureTemplates.map((feature) => ({ ...feature }))
          : clientFeatureTemplates.map((feature) => ({ ...feature })),
    }));

    setError("");
    setResponse(null);
  }, []);

  const quickAddFeature = useCallback((template) => {
    setForm((prev) => {
      const key = normalizeFeatureKey(template.key);
      const exists = prev.features.some(
        (feature) => normalizeFeatureKey(feature.key) === key
      );

      if (exists) return prev;

      return {
        ...prev,
        features: [...prev.features, { ...template }],
      };
    });

    setError("");
    setResponse(null);
  }, []);

  const removeFeature = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter(
        (_, featureIndex) => featureIndex !== index
      ),
    }));

    setError("");
    setResponse(null);
  }, []);

  const updateFeature = useCallback((index, field, value) => {
    setForm((prev) => {
      const updatedFeatures = prev.features.map((feature, featureIndex) => {
        if (featureIndex !== index) return feature;

        const updatedFeature = {
          ...feature,
          [field]: value,
        };

        if (field === "label" && !feature.key) {
          updatedFeature.key = normalizeFeatureKey(value);
        }

        if (field === "key") {
          updatedFeature.key = normalizeFeatureKey(value);
        }

        if (field === "valueType") {
          if (value === "boolean") updatedFeature.value = false;
          if (value === "number") updatedFeature.value = 0;
          if (value === "string") updatedFeature.value = "";
        }

        return updatedFeature;
      });

      return {
        ...prev,
        features: updatedFeatures,
      };
    });

    setError("");
    setResponse(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!token) return "Login token paoa jai nai. Please abar login koro.";
    if (!authUser) {
      return "Current user data paoa jai nai. Please abar login koro.";
    }
    if (!isAdmin) return "Only admin can manage plans.";
    if (!form.name.trim()) return "Plan name is required.";
    if (!form.slug.trim()) return "Plan slug is required.";
    if (!form.roleType) return "Role type is required.";

    if (!["client", "lawyer"].includes(form.roleType)) {
      return "Role type must be client or lawyer.";
    }

    if (form.price === "" || Number(form.price) < 0) {
      return "Valid price is required.";
    }

    if (form.durationInDays === "" || Number(form.durationInDays) < 1) {
      return "Duration days must be at least 1.";
    }

    const keys = new Set();

    for (let i = 0; i < form.features.length; i += 1) {
      const feature = form.features[i];
      const key = normalizeFeatureKey(feature.key || feature.label);

      if (!key) return `Permission ${i + 1} key or label is required.`;
      if (!feature.label.trim()) {
        return `Permission ${i + 1} label is required.`;
      }

      if (keys.has(key)) return `Duplicate permission key found: ${key}`;

      keys.add(key);

      if (!["number", "boolean", "string"].includes(feature.valueType)) {
        return `Permission "${feature.label}" has invalid value type.`;
      }

      if (feature.valueType === "number") {
        const numberValue = Number(feature.value);

        if (Number.isNaN(numberValue)) {
          return `Permission "${feature.label}" value must be a number.`;
        }

        if (numberValue < 0) {
          return `Permission "${feature.label}" value cannot be negative.`;
        }
      }
    }

    return "";
  }, [token, authUser, isAdmin, form]);

  const buildPayload = useCallback(() => {
    return {
      name: form.name.trim(),
      slug: normalizeSlug(form.slug || form.name),
      roleType: form.roleType,
      description: form.description.trim(),
      price: Number(form.price),
      durationInDays: Number(form.durationInDays),
      currency: form.currency.trim().toUpperCase() || "BDT",
      isActive: Boolean(form.isActive),
      sortOrder: Number(form.sortOrder || 0),
      features: form.features.map((feature, index) => {
        const valueType = feature.valueType || "boolean";

        let value = feature.value;

        if (valueType === "number") value = Number(value || 0);
        if (valueType === "boolean") value = Boolean(value);
        if (valueType === "string") value = String(value || "").trim();

        return {
          key: normalizeFeatureKey(feature.key || feature.label),
          label: feature.label.trim(),
          description: String(feature.description || "").trim(),
          valueType,
          value,
          enabled: Boolean(feature.enabled),
          sortOrder: Number(feature.sortOrder ?? index + 1),
        };
      }),
    };
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationMessage = validateForm();

      if (validationMessage) {
        setError(validationMessage);
        return;
      }

      try {
        setSubmitting(true);
        setError("");
        setResponse(null);

        const payload = buildPayload();

        let res;

        if (editingPlanId) {
          res = await axios.patch(
            `${API_BASE_URL}/plans/admin/${editingPlanId}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          res = await axios.post(`${API_BASE_URL}/plans`, payload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }

        setResponse(res.data);
        closeModal();
        triggerReload();
      } catch (err) {
        const serverMessage =
          err?.response?.data?.message || "Failed to save plan";
        const syncedInfo = err?.response?.data?.syncedSubscriptions;
        const extraInfo = syncedInfo
          ? ` Synced matched: ${syncedInfo.matchedCount || 0}, modified: ${
              syncedInfo.modifiedCount || 0
            }.`
          : "";

        setError(`${serverMessage}${extraInfo}`);
      } finally {
        setSubmitting(false);
      }
    },
    [
      validateForm,
      buildPayload,
      editingPlanId,
      token,
      closeModal,
      triggerReload,
    ]
  );

  const handleDelete = useCallback(
    async (planId) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this plan? If this plan has active or pending subscriptions, backend will block the delete."
      );

      if (!confirmed) return;

      try {
        setDeletingId(planId);
        setError("");
        setResponse(null);

        const res = await axios.delete(`${API_BASE_URL}/plans/admin/${planId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setResponse(res.data);

        if (editingPlanId === planId) closeModal();

        triggerReload();
      } catch (err) {
        const serverMessage =
          err?.response?.data?.message || "Failed to delete plan";
        const activeOrPending =
          err?.response?.data?.activeOrPendingSubscriptions;

        if (activeOrPending !== undefined) {
          setError(
            `${serverMessage} Active/Pending subscriptions found: ${activeOrPending}. You can deactivate this plan instead.`
          );
        } else {
          setError(serverMessage);
        }
      } finally {
        setDeletingId("");
      }
    },
    [token, editingPlanId, closeModal, triggerReload]
  );

  const successMessage = useMemo(() => {
    if (!response?.success) return "";

    const baseMessage = response?.message || "Operation completed successfully";

    if (response?.syncedSubscriptions) {
      const matched = response.syncedSubscriptions.matchedCount || 0;
      const modified = response.syncedSubscriptions.modifiedCount || 0;

      return `${baseMessage}. Synced subscriptions: ${modified}/${matched}.`;
    }

    return baseMessage;
  }, [response]);

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
            Only admins can manage plans.
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
                  Plan & Permission Management
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Create and update client or lawyer plans. When a plan is
                  updated, active and pending subscriptions for that plan can be
                  synced by the backend.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <FiPlus />
                  Create Plan
                </button>

                <button
                  type="button"
                  onClick={triggerReload}
                  disabled={loadingPlans}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-60"
                >
                  <FiRefreshCw className={loadingPlans ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by plan name, slug, role or permission..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Roles</option>
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
              </select>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {response?.success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Plans" value={stats.total} icon={FiLayers} />
            <StatCard
              title="Active Plans"
              value={stats.active}
              icon={FiCheckCircle}
            />
            <StatCard title="Client Plans" value={stats.client} icon={FiUsers} />
            <StatCard
              title="Lawyer Plans"
              value={stats.lawyer}
              icon={FiBriefcase}
            />
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">All Plans</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Client and lawyer plan permissions are separated by role type.
                </p>
              </div>
            </div>

            {loadingPlans ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                  <FiLoader className="animate-spin text-cyan-600" />
                  Loading plans...
                </div>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <FiPackage className="mb-3 text-4xl text-slate-400" />
                <p className="text-sm font-black text-slate-700">
                  No plans found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Create a new plan or change your filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPlans.map((plan) => {
                  const sortedFeatures = Array.isArray(plan.features)
                    ? plan.features
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(a.sortOrder || 0) -
                            Number(b.sortOrder || 0)
                        )
                    : [];

                  return (
                    <motion.div
                      key={plan._id}
                      className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xl font-black text-slate-900">
                              {plan.name}
                            </h4>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getRoleBadgeClass(
                                plan.roleType
                              )}`}
                            >
                              {plan.roleType}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                                plan.isActive
                              )}`}
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {plan.slug}
                          </p>

                          {plan.description && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                              {plan.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                              {plan.currency || "BDT"} {plan.price}
                            </span>

                            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                              {plan.durationInDays} days
                            </span>

                            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                              {sortedFeatures.length} permissions
                            </span>
                          </div>

                          {sortedFeatures.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {sortedFeatures.slice(0, 8).map((feature, index) => (
                                <span
                                  key={`${feature.key}-${index}`}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                                >
                                  {feature.label}: {formatFeatureValue(feature)}
                                </span>
                              ))}

                              {sortedFeatures.length > 8 && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                  +{sortedFeatures.length - 8} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(plan)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700"
                          >
                            <FiEdit2 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(plan._id)}
                            disabled={deletingId === plan._id}
                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            {deletingId === plan._id ? (
                              <FiLoader className="h-4 w-4 animate-spin" />
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                            {deletingId === plan._id ? "Checking..." : "Delete"}
                          </button>
                        </div>
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
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingPlanId ? "Update Plan" : "Create Plan"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingPlanId
                      ? "After update, active and pending subscriptions using this plan will be synced."
                      : "Use clear permission cards with toggle and limit inputs."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                {editingPlanId && (
                  <div className="flex gap-3 rounded-[24px] border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-cyan-800">
                    <FiRefreshCw className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-black">Auto sync after update</p>
                      <p className="mt-1 text-xs font-semibold leading-5">
                        The backend will copy the latest plan permissions to
                        active and pending subscriptions that are using this
                        plan.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="mb-5">
                    <h4 className="text-lg font-black text-slate-900">
                      Basic Information
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Select role type first. Client and lawyer permissions are
                      different.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Plan Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Lawyer Premium"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Slug *
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        placeholder="e.g. lawyer-premium"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Role Type *
                      </label>
                      <select
                        name="roleType"
                        value={form.roleType}
                        onChange={handleRoleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      >
                        <option value="client">Client Plan</option>
                        <option value="lawyer">Lawyer Plan</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Currency
                      </label>
                      <input
                        type="text"
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        placeholder="BDT"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Price *
                      </label>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        value={form.price}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Duration Days *
                      </label>
                      <input
                        type="number"
                        name="durationInDays"
                        min="1"
                        value={form.durationInDays}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        name="sortOrder"
                        value={form.sortOrder}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 xl:mt-7">
                      <span>
                        <span className="block text-sm font-bold text-slate-700">
                          Active Plan
                        </span>
                        <span className="block text-xs text-slate-500">
                          Show this plan publicly
                        </span>
                      </span>

                      <ToggleSwitch
                        checked={Boolean(form.isActive)}
                        onChange={(checked) =>
                          setForm((prev) => ({ ...prev, isActive: checked }))
                        }
                      />
                    </label>

                    <div className="md:col-span-2 xl:col-span-4">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Plan description"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h4 className="flex items-center gap-2 text-lg font-black text-slate-900">
                        <FiShield className="text-cyan-600" />
                        Dynamic Permissions
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Current role:{" "}
                        <span className="font-black capitalize text-slate-900">
                          {form.roleType}
                        </span>
                        . Add permissions using simple cards.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={replaceWithRoleTemplates}
                        className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100"
                      >
                        <FiRefreshCw />
                        Use {form.roleType} Defaults
                      </button>

                      <button
                        type="button"
                        onClick={addRoleTemplates}
                        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 hover:bg-cyan-100"
                      >
                        <FiPlus />
                        Add Missing Defaults
                      </button>

                      <button
                        type="button"
                        onClick={addFeature}
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
                      >
                        <FiPlus />
                        Custom Permission
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 rounded-[24px] border border-cyan-100 bg-white p-4">
                    <p className="mb-3 text-sm font-black text-slate-800">
                      Quick Add{" "}
                      {form.roleType === "client" ? "Client" : "Lawyer"}{" "}
                      Permissions
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedRoleTemplates.map((template) => {
                        const exists = form.features.some(
                          (feature) =>
                            normalizeFeatureKey(feature.key) ===
                            normalizeFeatureKey(template.key)
                        );

                        return (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => quickAddFeature(template)}
                            disabled={exists}
                            className={`rounded-full px-3 py-2 text-xs font-black transition ${
                              exists
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 hover:bg-cyan-100"
                            }`}
                          >
                            {exists ? "Added" : "+"} {template.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {form.features.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
                      <FiPackage className="mx-auto mb-3 text-4xl text-slate-400" />
                      <p className="text-sm font-black text-slate-700">
                        No permissions added yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Click Use {form.roleType} Defaults to add
                        backend-supported permissions.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {form.features
                        .map((feature, index) => ({ feature, index }))
                        .sort(
                          (a, b) =>
                            Number(a.feature.sortOrder || 0) -
                            Number(b.feature.sortOrder || 0)
                        )
                        .map(({ feature, index }) => (
                          <PermissionCard
                            key={`${feature.key || "custom"}-${index}`}
                            feature={feature}
                            index={index}
                            updateFeature={updateFeature}
                            removeFeature={removeFeature}
                          />
                        ))}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white/95 pt-5 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        {editingPlanId ? "Updating & Syncing..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        {editingPlanId ? "Update & Sync Plan" : "Create Plan"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPlanContent;