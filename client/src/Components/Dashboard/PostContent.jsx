import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4000/api/posts";
const USERS_API_BASE = "http://localhost:4000/api/users";

const initialForm = {
  client: "",
  title: "",
  description: "",
  category: "other",
  budgetMin: 0,
  budgetMax: 0,
  urgency: "medium",
  division: "",
  district: "",
  documents: "",
  status: "open",
  isPriority: 0,
  expiresAt: "",
};

const categoryOptions = [
  "family",
  "criminal",
  "property",
  "corporate",
  "civil",
  "tax",
  "labour",
  "cyber",
  "immigration",
  "other",
];

const urgencyOptions = ["low", "medium", "high"];
const statusOptions = ["open", "in_progress", "closed", "cancelled"];

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

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
};

const getStatusBadgeStyle = (status) => {
  const map = {
    open: {
      background: "#ecfeff",
      color: "#0e7490",
      border: "1px solid #a5f3fc",
    },
    in_progress: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
    closed: {
      background: "#f1f5f9",
      color: "#334155",
      border: "1px solid #cbd5e1",
    },
    cancelled: {
      background: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
  };

  return map[status] || map.open;
};

const getUrgencyBadgeStyle = (urgency) => {
  const map = {
    low: {
      background: "#f8fafc",
      color: "#475569",
      border: "1px solid #cbd5e1",
    },
    medium: {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
    },
    high: {
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
  };

  return map[urgency] || map.medium;
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(6, 182, 212, 0.14), transparent 34%), linear-gradient(180deg, #f8fafc 0%, #eef8fb 100%)",
    padding: "28px",
    color: "#0f172a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: {
    maxWidth: "1450px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "grid",
    gap: "8px",
    maxWidth: "780px",
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
    flexWrap: "wrap",
  },
  profilePill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.82)",
    border: "1px solid #cffafe",
    borderRadius: "999px",
    boxShadow: "0 10px 28px rgba(8, 145, 178, 0.1)",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(6, 182, 212, 0.28)",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  profileRole: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#0891b2",
    lineHeight: 1.2,
    textTransform: "capitalize",
  },
  overline: {
    width: "fit-content",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#0891b2",
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
    borderRadius: "999px",
    padding: "7px 11px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.12,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#64748b",
    maxWidth: "760px",
    lineHeight: 1.7,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    position: "relative",
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
  },
  statAccent: {
    position: "absolute",
    right: "16px",
    top: "16px",
    width: "42px",
    height: "42px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #cffafe, #ecfeff)",
    border: "1px solid #a5f3fc",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "10px",
    fontWeight: 700,
  },
  statValue: {
    fontSize: "30px",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: "6px",
  },
  statMeta: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  alertBase: {
    borderRadius: "16px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
    fontWeight: 700,
  },
  success: {
    background: "#ecfeff",
    color: "#0e7490",
    border: "1px solid #a5f3fc",
  },
  danger: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  panel: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 18px 46px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "22px 24px 18px",
    borderBottom: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg, rgba(236, 254, 255, 0.55), rgba(255, 255, 255, 0.45))",
  },
  panelTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  panelDesc: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  panelBody: {
    padding: "22px 24px 24px",
  },
  formGrid: {
    display: "grid",
    gap: "14px",
  },
  fieldWrap: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
  },
  helperText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "-2px",
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    color: "#0f172a",
    boxSizing: "border-box",
    boxShadow: "0 1px 0 rgba(15, 23, 42, 0.02)",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    color: "#0f172a",
    resize: "vertical",
    minHeight: "120px",
    boxSizing: "border-box",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "12px 17px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 26px rgba(6, 182, 212, 0.24)",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: "14px",
    padding: "12px 17px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  destructiveButton: {
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#b91c1c",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  softButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  cyanSoftButton: {
    border: "1px solid #a5f3fc",
    background: "#ecfeff",
    color: "#0e7490",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  searchWrap: {
    display: "flex",
    gap: "10px",
    flex: 1,
    minWidth: "280px",
    maxWidth: "560px",
  },
  searchInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    color: "#0f172a",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  postList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
    gap: "18px",
  },
  postCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  },
  postTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
  },
  postTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  postDesc: {
    margin: "10px 0 16px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  chipRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  chip: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "capitalize",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "8px",
    marginBottom: "16px",
  },
  metaCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "12px",
  },
  metaLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "6px",
    fontWeight: 800,
  },
  metaValue: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 800,
    wordBreak: "break-word",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    paddingTop: "6px",
  },
  emptyState: {
    border: "1px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "34px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    fontWeight: 700,
  },
  loadMoreWrap: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "22px",
  },
  detailWrapper: {
    marginTop: "24px",
  },
  detailHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  detailCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px",
    fontWeight: 800,
  },
  detailValue: {
    fontSize: "14px",
    color: "#0f172a",
    lineHeight: 1.6,
    fontWeight: 800,
    wordBreak: "break-word",
  },
  bidsGrid: {
    display: "grid",
    gap: "14px",
  },
  bidCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
  },
  bidGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "12px",
    marginBottom: "14px",
  },
  bidMeta: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.56)",
    backdropFilter: "blur(8px)",
  },
  modal: {
    width: "min(920px, 100%)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#ffffff",
    border: "1px solid #cffafe",
    borderRadius: "26px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
  },
  modalHeader: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    padding: "22px 24px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(135deg, #ecfeff, #ffffff)",
  },
  modalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  modalDesc: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    border: "1px solid #bae6fd",
    background: "#ffffff",
    color: "#0e7490",
    fontSize: "22px",
    lineHeight: 1,
    fontWeight: 800,
    cursor: "pointer",
  },
  modalBody: {
    padding: "24px",
  },
};

export default function AdminPostsManager() {
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [postsMeta, setPostsMeta] = useState({
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  });

  useEffect(() => {
    const auth = getStoredAuth();
    setAuthUser(auth.user);
    setToken(auth.token);
  }, []);

  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser]);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const stats = useMemo(() => {
    const total = posts.length;
    const open = posts.filter((p) => p.status === "open").length;
    const inProgress = posts.filter((p) => p.status === "in_progress").length;
    const priority = posts.filter((p) => Number(p.isPriority) === 1).length;

    return { total, open, inProgress, priority };
  }, [posts]);

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const buildPostsQuery = ({ cursor = null } = {}) => {
    const params = new URLSearchParams();

    params.set("limit", "20");

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (cursor) {
      params.set("cursor", cursor);
    }

    return `?${params.toString()}`;
  };

  const fetchPosts = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      if (!token || !isAdmin) return;

      try {
        if (append) {
          setLoadMoreLoading(true);
        } else {
          setLoading(true);
        }

        setError("");

        const query = buildPostsQuery({ cursor });

        const res = await fetch(`${API_BASE}/admin/all${query}`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch posts");
        }

        setPosts((prev) => (append ? [...prev, ...(data.data || [])] : data.data || []));
        setPostsMeta(
          data.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        setError(err.message || "Failed to fetch posts");
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [token, isAdmin, search, authHeaders]
  );

  const fetchClients = useCallback(
    async ({ searchValue = "" } = {}) => {
      if (!token || !isAdmin) return;

      try {
        setClientsLoading(true);

        const params = new URLSearchParams();
        params.set("role", "client");
        params.set("limit", "100");

        if (searchValue.trim()) {
          params.set("search", searchValue.trim());
        }

        const res = await fetch(`${USERS_API_BASE}/dropdown?${params.toString()}`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch clients");
        }

        setClients(data.data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch clients");
      } finally {
        setClientsLoading(false);
      }
    },
    [token, isAdmin, authHeaders]
  );

  const fetchSinglePost = useCallback(
    async (id) => {
      if (!token || !isAdmin) return;

      try {
        setDetailLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/admin/${id}`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch post");
        }

        setSelectedPost(data.data);
      } catch (err) {
        setError(err.message || "Failed to fetch post");
      } finally {
        setDetailLoading(false);
      }
    },
    [token, isAdmin, authHeaders]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientSearch = async () => {
    await fetchClients({ searchValue: clientSearch });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "budgetMin" || name === "budgetMax" || name === "isPriority"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setClientSearch("");
  };

  const openCreateModal = async () => {
    clearAlerts();
    resetForm();
    setIsModalOpen(true);

    if (clients.length === 0) {
      await fetchClients();
    }
  };

  const closeModal = () => {
    if (formLoading) return;
    setIsModalOpen(false);
    resetForm();
  };

  const refreshAfterMutation = async (postId = null) => {
    await fetchPosts();
    if (postId) {
      await fetchSinglePost(postId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Login token paoa jai nai. Please abar login koro.");
      return;
    }

    if (!authUser || !isAdmin) {
      setError("Only admin can access this page.");
      return;
    }

    if (!formData.client) {
      setError("Please select a client before saving the post.");
      return;
    }

    try {
      setFormLoading(true);
      clearAlerts();

      const payload = {
        ...formData,
        documents: formData.documents
          ? formData.documents
              .split(",")
              .map((doc) => doc.trim())
              .filter(Boolean)
          : [],
        expiresAt: formData.expiresAt || null,
      };

      const url = editingId
        ? `${API_BASE}/admin/update/${editingId}`
        : `${API_BASE}/admin/create`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setMessage(data.message || "Success");
      const affectedId = editingId || data.data?._id || null;
      resetForm();
      setIsModalOpen(false);
      await refreshAfterMutation(affectedId);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (post) => {
    clearAlerts();

    const selectedClientId = post.client?._id || post.client || "";

    const clientAlreadyLoaded = clients.some((client) => client._id === selectedClientId);

    if (selectedClientId && !clientAlreadyLoaded && post.client?.name) {
      setClients((prev) => [
        {
          _id: selectedClientId,
          name: post.client?.name,
          email: post.client?.email,
          phone: post.client?.phone,
          role: post.client?.role || "client",
        },
        ...prev,
      ]);
    }

    setEditingId(post._id);
    setFormData({
      client: selectedClientId,
      title: post.title || "",
      description: post.description || "",
      category: post.category || "other",
      budgetMin: post.budgetMin || 0,
      budgetMax: post.budgetMax || 0,
      urgency: post.urgency || "medium",
      division: post.division || "",
      district: post.district || "",
      documents: Array.isArray(post.documents) ? post.documents.join(", ") : "",
      status: post.status || "open",
      isPriority: post.isPriority || 0,
      expiresAt: post.expiresAt
        ? new Date(post.expiresAt).toISOString().slice(0, 16)
        : "",
    });

    setIsModalOpen(true);

    if (clients.length === 0) {
      await fetchClients();
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      clearAlerts();

      const res = await fetch(`${API_BASE}/admin/delete/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setMessage(data.message || "Post deleted successfully");
      if (selectedPost?._id === id) setSelectedPost(null);
      await fetchPosts();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusAction = async (id, action) => {
    try {
      setActionLoading(true);
      clearAlerts();

      const res = await fetch(`${API_BASE}/${id}/${action}`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} post`);
      }

      setMessage(data.message || "Status updated");
      await refreshAfterMutation(id);
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptBid = async (postId, bidId) => {
    try {
      setActionLoading(true);
      clearAlerts();

      const res = await fetch(`${API_BASE}/${postId}/accept-bid/${bidId}`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to accept bid");
      }

      setMessage(data.message || "Bid accepted successfully");
      await refreshAfterMutation(postId);
    } catch (err) {
      setError(err.message || "Failed to accept bid");
    } finally {
      setActionLoading(false);
    }
  };

  const renderBadge = (label, customStyle) => (
    <span style={{ ...styles.chip, ...customStyle }}>
      {String(label || "N/A").replace("_", " ")}
    </span>
  );

  const renderPostForm = () => (
    <form onSubmit={handleSubmit} style={styles.formGrid}>
      <div style={styles.row2}>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Client</label>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search client..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
            />

            <button
              type="button"
              onClick={handleClientSearch}
              disabled={clientsLoading}
              style={{
                ...styles.cyanSoftButton,
                opacity: clientsLoading ? 0.7 : 1,
                cursor: clientsLoading ? "not-allowed" : "pointer",
              }}
            >
              {clientsLoading ? "Loading..." : "Find"}
            </button>
          </div>

          <select
            name="client"
            value={formData.client}
            onChange={handleChange}
            required
            style={styles.input}
          >
            <option value="">
              {clientsLoading ? "Loading clients..." : "Select client"}
            </option>

            {clients.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name || "Unnamed Client"} - {user.email || "No email"}
              </option>
            ))}
          </select>

          <div style={styles.helperText}>
            This is admin-only. The selected client will be used as the post owner.
          </div>
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Post Title</label>
          <input
            type="text"
            name="title"
            placeholder="Enter post title"
            value={formData.title}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.fieldWrap}>
        <label style={styles.label}>Description</label>
        <textarea
          name="description"
          placeholder="Write a clear and detailed description"
          rows="5"
          value={formData.description}
          onChange={handleChange}
          required
          style={styles.textarea}
        />
      </div>

      <div style={styles.row2}>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={styles.input}
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Urgency</label>
          <select
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            style={styles.input}
          >
            {urgencyOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.row2}>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Budget Min</label>
          <input
            type="number"
            name="budgetMin"
            placeholder="Minimum budget"
            value={formData.budgetMin}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Budget Max</label>
          <input
            type="number"
            name="budgetMax"
            placeholder="Maximum budget"
            value={formData.budgetMax}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row2}>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Division</label>
          <input
            type="text"
            name="division"
            placeholder="Enter division"
            value={formData.division}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>District</label>
          <input
            type="text"
            name="district"
            placeholder="Enter district"
            value={formData.district}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.fieldWrap}>
        <label style={styles.label}>Document URLs</label>
        <input
          type="text"
          name="documents"
          placeholder="Comma separated document links"
          value={formData.documents}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.row2}>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.input}
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Priority</label>
          <select
            name="isPriority"
            value={formData.isPriority}
            onChange={handleChange}
            style={styles.input}
          >
            <option value={0}>Normal</option>
            <option value={1}>Priority</option>
          </select>
        </div>
      </div>

      <div style={styles.fieldWrap}>
        <label style={styles.label}>Expiry Date & Time</label>
        <input
          type="datetime-local"
          name="expiresAt"
          value={formData.expiresAt}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.buttonRow}>
        <button type="button" onClick={closeModal} style={styles.secondaryButton}>
          Cancel
        </button>

        <button
          type="submit"
          disabled={formLoading}
          style={{
            ...styles.primaryButton,
            opacity: formLoading ? 0.7 : 1,
            cursor: formLoading ? "not-allowed" : "pointer",
          }}
        >
          {formLoading ? "Saving..." : editingId ? "Update Post" : "Create Post"}
        </button>
      </div>
    </form>
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={{ ...styles.alertBase, ...styles.danger }}>
            Login token paoa jai nai. Please abar login koro.
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={{ ...styles.alertBase, ...styles.danger }}>
            Current user data paoa jai nai. Please abar login koro.
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={{ ...styles.alertBase, ...styles.danger }}>
            Forbidden: Only admin can access posts management.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.overline}>Admin Dashboard</span>
            <h1 style={styles.title}>Posts Management Console</h1>
            <p style={styles.subtitle}>
              Manage legal service posts, review bids, control post lifecycle, and
              assign posts to clients through a clean cyan admin interface.
            </p>
          </div>

          <div style={styles.topActions}>
            <div style={styles.profilePill}>
              <div style={styles.avatar}>
                {(authUser?.name || authUser?.email || "A")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <div style={styles.profileName}>
                  {authUser?.name || "Admin User"}
                </div>
                <div style={styles.profileRole}>{authUser?.role || "admin"}</div>
              </div>
            </div>

            <button type="button" onClick={openCreateModal} style={styles.primaryButton}>
              + Create Post
            </button>
          </div>
        </div>

        {message && (
          <div style={{ ...styles.alertBase, ...styles.success }}>{message}</div>
        )}

        {error && (
          <div style={{ ...styles.alertBase, ...styles.danger }}>{error}</div>
        )}

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>Loaded Posts</div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statMeta}>Currently loaded from cursor pagination</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>Open Posts</div>
            <div style={styles.statValue}>{stats.open}</div>
            <div style={styles.statMeta}>Active posts ready for responses</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>In Progress</div>
            <div style={styles.statValue}>{stats.inProgress}</div>
            <div style={styles.statMeta}>Posts currently being handled</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>Priority Posts</div>
            <div style={styles.statValue}>{stats.priority}</div>
            <div style={styles.statMeta}>Marked for urgent visibility</div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.toolbar}>
              <div>
                <h2 style={styles.sectionTitle}>All Posts</h2>
                <p style={styles.panelDesc}>
                  Search, review, edit, and manage all submitted posts.
                </p>
              </div>

              <div style={styles.searchWrap}>
                <input
                  type="text"
                  placeholder="Search posts by keyword..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <button
                  onClick={() => fetchPosts()}
                  style={styles.primaryButton}
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </div>

          <div style={styles.panelBody}>
            {loading ? (
              <div style={styles.emptyState}>Loading posts...</div>
            ) : posts.length === 0 ? (
              <div style={styles.emptyState}>No posts found.</div>
            ) : (
              <>
                <div style={styles.postList}>
                  {posts.map((post) => (
                    <div key={post._id} style={styles.postCard}>
                      <div style={styles.postTop}>
                        <div style={{ flex: 1, minWidth: "260px" }}>
                          <h3 style={styles.postTitle}>{post.title}</h3>

                          <div style={styles.chipRow}>
                            {renderBadge(
                              post.status,
                              getStatusBadgeStyle(post.status)
                            )}
                            {renderBadge(
                              post.urgency,
                              getUrgencyBadgeStyle(post.urgency)
                            )}
                            {Number(post.isPriority) === 1 &&
                              renderBadge("priority", {
                                background: "#ecfeff",
                                color: "#0e7490",
                                border: "1px solid #67e8f9",
                              })}
                          </div>
                        </div>
                      </div>

                      <p style={styles.postDesc}>{post.description}</p>

                      <div style={styles.metaGrid}>
                        <div style={styles.metaCard}>
                          <div style={styles.metaLabel}>Client</div>
                          <div style={styles.metaValue}>
                            {post.client?.name || "N/A"}
                          </div>
                        </div>

                        <div style={styles.metaCard}>
                          <div style={styles.metaLabel}>Category</div>
                          <div style={styles.metaValue}>{post.category}</div>
                        </div>

                        <div style={styles.metaCard}>
                          <div style={styles.metaLabel}>Budget</div>
                          <div style={styles.metaValue}>
                            {formatCurrency(post.budgetMin)} -{" "}
                            {formatCurrency(post.budgetMax)}
                          </div>
                        </div>

                        <div style={styles.metaCard}>
                          <div style={styles.metaLabel}>Bids</div>
                          <div style={styles.metaValue}>
                            {post.bids?.length || 0}
                          </div>
                        </div>
                      </div>

                      <div style={styles.actionRow}>
                        <button
                          onClick={() => fetchSinglePost(post._id)}
                          style={styles.cyanSoftButton}
                          disabled={detailLoading}
                        >
                          {detailLoading && selectedPost?._id !== post._id
                            ? "Loading..."
                            : "View Details"}
                        </button>

                        <button onClick={() => handleEdit(post)} style={styles.softButton}>
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(post._id)}
                          style={styles.destructiveButton}
                          disabled={actionLoading}
                        >
                          Delete
                        </button>

                        {post.status !== "closed" && (
                          <button
                            onClick={() => handleStatusAction(post._id, "close")}
                            style={styles.softButton}
                            disabled={actionLoading}
                          >
                            Close
                          </button>
                        )}

                        {post.status !== "cancelled" && post.status !== "closed" && (
                          <button
                            onClick={() => handleStatusAction(post._id, "cancel")}
                            style={styles.softButton}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {postsMeta.hasNextPage && (
                  <div style={styles.loadMoreWrap}>
                    <button
                      type="button"
                      onClick={() =>
                        fetchPosts({
                          cursor: postsMeta.nextCursor,
                          append: true,
                        })
                      }
                      disabled={loadMoreLoading}
                      style={{
                        ...styles.primaryButton,
                        opacity: loadMoreLoading ? 0.7 : 1,
                        cursor: loadMoreLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loadMoreLoading ? "Loading more..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selectedPost && (
          <div style={styles.detailWrapper}>
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div style={styles.detailHeaderRow}>
                  <div>
                    <h2 style={styles.panelTitle}>Post Details</h2>
                    <p style={styles.panelDesc}>
                      Detailed view of the selected post and submitted bids.
                    </p>
                  </div>

                  <div style={styles.chipRow}>
                    {renderBadge(
                      selectedPost.status,
                      getStatusBadgeStyle(selectedPost.status)
                    )}
                    {renderBadge(
                      selectedPost.urgency,
                      getUrgencyBadgeStyle(selectedPost.urgency)
                    )}
                    {Number(selectedPost.isPriority) === 1 &&
                      renderBadge("priority", {
                        background: "#ecfeff",
                        color: "#0e7490",
                        border: "1px solid #67e8f9",
                      })}
                  </div>
                </div>
              </div>

              <div style={styles.panelBody}>
                {detailLoading ? (
                  <div style={styles.emptyState}>Loading post details...</div>
                ) : (
                  <>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Title</div>
                        <div style={styles.detailValue}>{selectedPost.title}</div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Client</div>
                        <div style={styles.detailValue}>
                          {selectedPost.client?.name || "N/A"}
                          <br />
                          <span style={{ color: "#64748b", fontWeight: 600 }}>
                            {selectedPost.client?.email || "No email"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Selected Lawyer</div>
                        <div style={styles.detailValue}>
                          {selectedPost.selectedLawyer?.name || "Not selected"}
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Category</div>
                        <div style={styles.detailValue}>
                          {selectedPost.category || "N/A"}
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Location</div>
                        <div style={styles.detailValue}>
                          {selectedPost.division || "N/A"}
                          {selectedPost.district
                            ? `, ${selectedPost.district}`
                            : ""}
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Budget Range</div>
                        <div style={styles.detailValue}>
                          {formatCurrency(selectedPost.budgetMin)} -{" "}
                          {formatCurrency(selectedPost.budgetMax)}
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Expires At</div>
                        <div style={styles.detailValue}>
                          {formatDateTime(selectedPost.expiresAt)}
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Documents</div>
                        <div style={styles.detailValue}>
                          {selectedPost.documents?.length
                            ? selectedPost.documents.length
                            : 0}{" "}
                          linked file(s)
                        </div>
                      </div>

                      <div style={styles.detailCard}>
                        <div style={styles.detailLabel}>Total Bids</div>
                        <div style={styles.detailValue}>
                          {selectedPost.bids?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.detailCard, marginBottom: "20px" }}>
                      <div style={styles.detailLabel}>Description</div>
                      <div style={{ ...styles.detailValue, fontWeight: 600 }}>
                        {selectedPost.description}
                      </div>
                    </div>

                    <div>
                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: "14px",
                          fontSize: "18px",
                          fontWeight: 900,
                          color: "#0f172a",
                        }}
                      >
                        Bids
                      </h3>

                      {!selectedPost.bids || selectedPost.bids.length === 0 ? (
                        <div style={styles.emptyState}>No bids found.</div>
                      ) : (
                        <div style={styles.bidsGrid}>
                          {selectedPost.bids.map((bid) => (
                            <div key={bid._id} style={styles.bidCard}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <h4
                                    style={{
                                      margin: 0,
                                      fontSize: "18px",
                                      fontWeight: 900,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {bid.lawyer?.name || "Unknown Lawyer"}
                                  </h4>
                                  <p
                                    style={{
                                      margin: "6px 0 0",
                                      color: "#64748b",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {bid.lawyer?.email || "No email"}
                                  </p>
                                </div>

                                {renderBadge(bid.status || "pending", {
                                  background: "#f8fafc",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                })}
                              </div>

                              <div style={styles.bidGrid}>
                                <div style={styles.bidMeta}>
                                  <div style={styles.detailLabel}>
                                    Proposed Fee
                                  </div>
                                  <div style={styles.detailValue}>
                                    {formatCurrency(bid.proposedFee)}
                                  </div>
                                </div>

                                <div style={styles.bidMeta}>
                                  <div style={styles.detailLabel}>
                                    Estimated Days
                                  </div>
                                  <div style={styles.detailValue}>
                                    {bid.estimatedDays || 0} day(s)
                                  </div>
                                </div>

                                <div style={styles.bidMeta}>
                                  <div style={styles.detailLabel}>Bid Status</div>
                                  <div style={styles.detailValue}>
                                    {bid.status || "N/A"}
                                  </div>
                                </div>

                                <div style={styles.bidMeta}>
                                  <div style={styles.detailLabel}>Lawyer</div>
                                  <div style={styles.detailValue}>
                                    {bid.lawyer?.name || "N/A"}
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  ...styles.bidMeta,
                                  marginBottom: "12px",
                                }}
                              >
                                <div style={styles.detailLabel}>Message</div>
                                <div
                                  style={{
                                    ...styles.detailValue,
                                    fontWeight: 600,
                                  }}
                                >
                                  {bid.message || "No message provided"}
                                </div>
                              </div>

                              {selectedPost.status === "open" &&
                                bid.status !== "withdrawn" && (
                                  <button
                                    onClick={() =>
                                      handleAcceptBid(selectedPost._id, bid._id)
                                    }
                                    style={styles.primaryButton}
                                    disabled={actionLoading}
                                  >
                                    {actionLoading
                                      ? "Processing..."
                                      : "Accept Bid"}
                                  </button>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingId ? "Update Post" : "Create New Post"}
                </h2>
                <p style={styles.modalDesc}>
                  {editingId
                    ? "Update the selected post and reassign the client if needed."
                    : "Create a new post and assign it to a client from the dropdown."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={styles.closeButton}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>{renderPostForm()}</div>
          </div>
        </div>
      )}
    </div>
  );
}