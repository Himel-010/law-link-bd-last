import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:4000/api/contact";

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

const formatDateTime = (value) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString();
};

const getStatusBadgeStyle = (status) => {
  const map = {
    new: {
      background: "#ecfeff",
      color: "#0e7490",
      border: "1px solid #a5f3fc",
    },
    read: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
    replied: {
      background: "#f0fdf4",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    },
    closed: {
      background: "#f1f5f9",
      color: "#334155",
      border: "1px solid #cbd5e1",
    },
  };

  return map[status] || map.new;
};

const getUrgencyBadgeStyle = (urgency) => {
  const map = {
    low: {
      background: "#f8fafc",
      color: "#475569",
      border: "1px solid #cbd5e1",
    },
    normal: {
      background: "#ecfeff",
      color: "#0e7490",
      border: "1px solid #a5f3fc",
    },
    high: {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
    },
    critical: {
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
  };

  return map[urgency] || map.normal;
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(6, 182, 212, 0.12), transparent 34%), linear-gradient(180deg, #f8fafc 0%, #eef8fb 100%)",
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

  overline: {
    width: "fit-content",
    fontSize: "12px",
    fontWeight: 700,
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
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.025em",
  },

  subtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#64748b",
    maxWidth: "760px",
    lineHeight: 1.7,
    fontWeight: 400,
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
    background: "rgba(255, 255, 255, 0.86)",
    border: "1px solid #cffafe",
    borderRadius: "999px",
    boxShadow: "0 10px 28px rgba(8, 145, 178, 0.08)",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(6, 182, 212, 0.24)",
  },

  profileName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  profileRole: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#0891b2",
    lineHeight: 1.2,
    textTransform: "capitalize",
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
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.055)",
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
    fontWeight: 600,
  },

  statValue: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "6px",
  },

  statMeta: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
    fontWeight: 400,
  },

  alertBase: {
    borderRadius: "16px",
    padding: "14px 16px",
    marginBottom: "18px",
    fontSize: "14px",
    fontWeight: 600,
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
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 18px 46px rgba(15, 23, 42, 0.075)",
    overflow: "hidden",
  },

  panelHeader: {
    padding: "22px 24px 18px",
    borderBottom: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg, rgba(236, 254, 255, 0.56), rgba(255, 255, 255, 0.45))",
  },

  panelBody: {
    padding: "22px 24px 24px",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 750,
    color: "#0f172a",
    letterSpacing: "-0.018em",
  },

  panelDesc: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.6,
    fontWeight: 400,
  },

  filters: {
    display: "flex",
    gap: "10px",
    flex: 1,
    minWidth: "280px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },

  searchInput: {
    minWidth: "250px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    color: "#0f172a",
  },

  select: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    color: "#0f172a",
    minWidth: "145px",
  },

  contactList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
    gap: "18px",
  },

  contactCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.045)",
  },

  contactTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
  },

  contactTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
    color: "#0f172a",
    letterSpacing: "-0.015em",
  },

  contactMetaLine: {
    margin: "7px 0 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
    fontWeight: 500,
  },

  contactMessage: {
    margin: "12px 0 16px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
    fontWeight: 400,
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
    fontWeight: 650,
    textTransform: "capitalize",
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
    fontWeight: 650,
  },

  metaValue: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: 600,
    wordBreak: "break-word",
  },

  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    paddingTop: "6px",
  },

  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "12px 17px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 26px rgba(6, 182, 212, 0.22)",
    transition: "all 0.2s ease",
  },

  viewButton: {
    border: "1px solid #a5f3fc",
    background: "#ecfeff",
    color: "#0e7490",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  destructiveButton: {
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#b91c1c",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  ghostButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  emptyState: {
    border: "1px dashed #cbd5e1",
    borderRadius: "20px",
    padding: "34px",
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
    fontWeight: 500,
  },

  loadMoreWrap: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "22px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.58)",
    backdropFilter: "blur(8px)",
  },

  modal: {
    width: "min(980px, 100%)",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    border: "1px solid #cffafe",
    borderRadius: "26px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
  },

  modalHeader: {
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
    fontWeight: 750,
    color: "#0f172a",
    letterSpacing: "-0.018em",
  },

  modalDesc: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: 400,
  },

  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    border: "1px solid #bae6fd",
    background: "#ffffff",
    color: "#0e7490",
    fontSize: "24px",
    lineHeight: 1,
    fontWeight: 500,
    cursor: "pointer",
  },

  modalBody: {
    padding: "24px",
    overflowY: "auto",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "18px 24px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
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
    fontWeight: 650,
  },

  detailValue: {
    fontSize: "14px",
    color: "#0f172a",
    lineHeight: 1.6,
    fontWeight: 500,
    wordBreak: "break-word",
  },

  messageBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px",
  },

  messageText: {
    margin: 0,
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.8,
    fontWeight: 400,
    whiteSpace: "pre-wrap",
  },
};

export default function AdminContactMessages() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");

  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState("");

  const [contactsMeta, setContactsMeta] = useState({
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
    const total = contacts.length;
    const newMessages = contacts.filter((item) => item.status === "new").length;
    const highPriority = contacts.filter(
      (item) => item.urgency === "high" || item.urgency === "critical"
    ).length;
    const closed = contacts.filter((item) => item.status === "closed").length;

    return {
      total,
      newMessages,
      highPriority,
      closed,
    };
  }, [contacts]);

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const buildContactsQuery = ({ cursor = null } = {}) => {
    const params = new URLSearchParams();

    params.set("limit", "20");

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (status !== "all") {
      params.set("status", status);
    }

    if (urgency !== "all") {
      params.set("urgency", urgency);
    }

    if (cursor) {
      params.set("cursor", cursor);
    }

    return `?${params.toString()}`;
  };

  const fetchContacts = useCallback(
    async ({ cursor = null, append = false } = {}) => {
      if (!token || !isAdmin) return;

      try {
        if (append) {
          setLoadMoreLoading(true);
        } else {
          setLoading(true);
        }

        setError("");

        const query = buildContactsQuery({ cursor });

        const res = await fetch(`${API_BASE}/admin${query}`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch contact messages");
        }

        setContacts((prev) =>
          append ? [...prev, ...(data.data || [])] : data.data || []
        );

        setContactsMeta(
          data.meta || {
            limit: 20,
            hasNextPage: false,
            nextCursor: null,
          }
        );
      } catch (err) {
        setError(err.message || "Failed to fetch contact messages");
      } finally {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [token, isAdmin, search, status, urgency, authHeaders]
  );

  const fetchSingleContact = useCallback(
    async (id) => {
      if (!token || !isAdmin) return;

      try {
        setDetailLoading(true);
        setError("");
        setIsDetailsModalOpen(true);

        const res = await fetch(`${API_BASE}/admin/${id}`, {
          method: "GET",
          headers: authHeaders,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch contact message");
        }

        setSelectedContact(data.data);
      } catch (err) {
        setError(err.message || "Failed to fetch contact message");
        setIsDetailsModalOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [token, isAdmin, authHeaders]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const closeDetailsModal = () => {
    if (deleteLoading) return;

    setIsDetailsModalOpen(false);
    setSelectedContact(null);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this contact message?"
    );

    if (!confirmDelete) return;

    try {
      setDeleteLoading(true);
      clearAlerts();

      const res = await fetch(`${API_BASE}/admin/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setMessage(data.message || "Contact message deleted successfully");

      if (selectedContact?._id === id) {
        setSelectedContact(null);
        setIsDetailsModalOpen(false);
      }

      await fetchContacts();
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderBadge = (label, customStyle) => (
    <span style={{ ...styles.chip, ...customStyle }}>
      {String(label || "N/A").replace("_", " ")}
    </span>
  );

  const trimMessage = (text = "", max = 170) => {
    if (!text) return "No message provided.";
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
  };

  const getButtonStyle = (baseStyle, disabled = false) => ({
    ...baseStyle,
    opacity: disabled ? 0.65 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });

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
            Forbidden: Only admin can access contact messages.
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

            <h1 style={styles.title}>Contact Messages</h1>

            <p style={styles.subtitle}>
              Review public contact submissions, inspect user details, and delete
              unwanted messages from a clean admin-only inbox.
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

            <button
              type="button"
              onClick={() => fetchContacts()}
              disabled={loading}
              style={getButtonStyle(styles.primaryButton, loading)}
            >
              {loading ? "Refreshing..." : "Refresh"}
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
            <div style={styles.statLabel}>Loaded Messages</div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statMeta}>Currently loaded from pagination</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>New Messages</div>
            <div style={styles.statValue}>{stats.newMessages}</div>
            <div style={styles.statMeta}>Messages waiting for review</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>High Priority</div>
            <div style={styles.statValue}>{stats.highPriority}</div>
            <div style={styles.statMeta}>High or critical urgency messages</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statAccent} />
            <div style={styles.statLabel}>Closed</div>
            <div style={styles.statValue}>{stats.closed}</div>
            <div style={styles.statMeta}>Resolved contact messages</div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.toolbar}>
              <div>
                <h2 style={styles.sectionTitle}>All Contact Messages</h2>
                <p style={styles.panelDesc}>
                  Search, filter, view, and delete public contact submissions.
                </p>
              </div>

              <div style={styles.filters}>
                <input
                  type="text"
                  placeholder="Search by name, email, subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={styles.select}
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={styles.select}
                >
                  <option value="all">All Urgency</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>

                <button
                  onClick={() => fetchContacts()}
                  style={getButtonStyle(styles.primaryButton, loading)}
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </div>

          <div style={styles.panelBody}>
            {loading ? (
              <div style={styles.emptyState}>Loading contact messages...</div>
            ) : contacts.length === 0 ? (
              <div style={styles.emptyState}>No contact messages found.</div>
            ) : (
              <>
                <div style={styles.contactList}>
                  {contacts.map((contact) => {
                    const isCurrentLoading =
                      detailLoading && selectedContact?._id === contact._id;

                    return (
                      <div key={contact._id} style={styles.contactCard}>
                        <div style={styles.contactTop}>
                          <div style={{ flex: 1, minWidth: "260px" }}>
                            <h3 style={styles.contactTitle}>
                              {contact.subject || "No Subject"}
                            </h3>

                            <p style={styles.contactMetaLine}>
                              From: {contact.name || "Unknown"} •{" "}
                              {contact.email || "No email"}
                            </p>

                            <div style={styles.chipRow}>
                              {renderBadge(
                                contact.status,
                                getStatusBadgeStyle(contact.status)
                              )}

                              {renderBadge(
                                contact.urgency,
                                getUrgencyBadgeStyle(contact.urgency)
                              )}
                            </div>
                          </div>
                        </div>

                        <p style={styles.contactMessage}>
                          {trimMessage(contact.message)}
                        </p>

                        <div style={styles.metaGrid}>
                          <div style={styles.metaCard}>
                            <div style={styles.metaLabel}>Phone</div>
                            <div style={styles.metaValue}>
                              {contact.phone || "N/A"}
                            </div>
                          </div>

                          <div style={styles.metaCard}>
                            <div style={styles.metaLabel}>Submitted</div>
                            <div style={styles.metaValue}>
                              {formatDateTime(contact.createdAt)}
                            </div>
                          </div>

                          <div style={styles.metaCard}>
                            <div style={styles.metaLabel}>Handled By</div>
                            <div style={styles.metaValue}>
                              {contact.handledBy?.name || "Not handled"}
                            </div>
                          </div>
                        </div>

                        <div style={styles.actionRow}>
                          <button
                            onClick={() => fetchSingleContact(contact._id)}
                            style={getButtonStyle(
                              styles.viewButton,
                              detailLoading
                            )}
                            disabled={detailLoading}
                          >
                            {isCurrentLoading ? "Opening..." : "View Details"}
                          </button>

                          <button
                            onClick={() => handleDelete(contact._id)}
                            style={getButtonStyle(
                              styles.destructiveButton,
                              deleteLoading
                            )}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {contactsMeta.hasNextPage && (
                  <div style={styles.loadMoreWrap}>
                    <button
                      type="button"
                      onClick={() =>
                        fetchContacts({
                          cursor: contactsMeta.nextCursor,
                          append: true,
                        })
                      }
                      disabled={loadMoreLoading}
                      style={getButtonStyle(
                        styles.primaryButton,
                        loadMoreLoading
                      )}
                    >
                      {loadMoreLoading ? "Loading more..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isDetailsModalOpen && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDetailsModal();
            }
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Contact Message Details</h2>
                <p style={styles.modalDesc}>
                  Full read-only view of the selected public contact submission.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetailsModal}
                style={styles.closeButton}
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {detailLoading ? (
                <div style={styles.emptyState}>Loading contact details...</div>
              ) : !selectedContact ? (
                <div style={styles.emptyState}>No contact details found.</div>
              ) : (
                <>
                  <div style={styles.chipRow}>
                    {renderBadge(
                      selectedContact.status,
                      getStatusBadgeStyle(selectedContact.status)
                    )}

                    {renderBadge(
                      selectedContact.urgency,
                      getUrgencyBadgeStyle(selectedContact.urgency)
                    )}
                  </div>

                  <div style={{ height: "18px" }} />

                  <div style={styles.detailGrid}>
                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Name</div>
                      <div style={styles.detailValue}>
                        {selectedContact.name || "N/A"}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Email</div>
                      <div style={styles.detailValue}>
                        {selectedContact.email || "N/A"}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Phone</div>
                      <div style={styles.detailValue}>
                        {selectedContact.phone || "N/A"}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Subject</div>
                      <div style={styles.detailValue}>
                        {selectedContact.subject || "N/A"}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Submitted At</div>
                      <div style={styles.detailValue}>
                        {formatDateTime(selectedContact.createdAt)}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Updated At</div>
                      <div style={styles.detailValue}>
                        {formatDateTime(selectedContact.updatedAt)}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Replied At</div>
                      <div style={styles.detailValue}>
                        {formatDateTime(selectedContact.repliedAt)}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Closed At</div>
                      <div style={styles.detailValue}>
                        {formatDateTime(selectedContact.closedAt)}
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <div style={styles.detailLabel}>Handled By</div>
                      <div style={styles.detailValue}>
                        {selectedContact.handledBy?.name || "Not handled"}
                        {selectedContact.handledBy?.email && (
                          <>
                            <br />
                            <span
                              style={{
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              {selectedContact.handledBy.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.messageBox}>
                    <div style={styles.detailLabel}>Message</div>
                    <p style={styles.messageText}>
                      {selectedContact.message || "No message provided."}
                    </p>
                  </div>

                  {selectedContact.adminNote && (
                    <div style={styles.messageBox}>
                      <div style={styles.detailLabel}>Admin Note</div>
                      <p style={styles.messageText}>
                        {selectedContact.adminNote}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={closeDetailsModal}
                style={styles.ghostButton}
              >
                Close
              </button>

              {selectedContact?._id && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedContact._id)}
                  style={getButtonStyle(styles.destructiveButton, deleteLoading)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Message"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}