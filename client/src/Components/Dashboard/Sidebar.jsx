import React, { useEffect, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiLogOut,
  FiHelpCircle,
  FiHome,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiBox,
  FiLayers,
  FiDollarSign,
  FiGitPullRequest,
  FiUserCheck,
  FiCalendar,
  FiMail,
} from "react-icons/fi";
import { signOutSuccess, restoreUser } from "../../Redux/UserSlice/UserSlice";

const DEFAULT_MENU = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "users", label: "Users", icon: FiUsers },
  { id: "clients", label: "Clients", icon: FiBriefcase },
  { id: "lawyers", label: "Lawyers", icon: FiUserCheck },
  { id: "lawyer-availability", label: "Availability", icon: FiCalendar },
  { id: "posts", label: "Posts", icon: FiFileText },
  { id: "contact-messages", label: "Contact Messages", icon: FiMail },
  { id: "plans", label: "Plans", icon: FiBox },
  { id: "subscriptions", label: "Subscriptions", icon: FiLayers },
  { id: "payments", label: "Payments", icon: FiDollarSign },
  { id: "bids-proposals", label: "Bids & Proposals", icon: FiGitPullRequest },
];

const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) return true;

    const decodedPayload = JSON.parse(atob(payloadBase64));
    const expiryTime = decodedPayload.exp;

    if (!expiryTime) return false;

    const currentTime = Math.floor(Date.now() / 1000);

    return expiryTime < currentTime;
  } catch (error) {
    console.error("Token decode error:", error);
    return true;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");

  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("token");
};

const getStoredUser = () => {
  try {
    const localUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");

    if (localUser || sessionUser) {
      return JSON.parse(localUser || sessionUser);
    }

    return null;
  } catch (error) {
    console.error("Stored user parse error:", error);
    return null;
  }
};

const Sidebar = ({ menuItems = DEFAULT_MENU, activeMenu, setActiveMenu }) => {
  const [internalActive, setInternalActive] = useState("overview");
  const [imageError, setImageError] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.user.currentUser);

  const currentActive = activeMenu || internalActive;

  useEffect(() => {
    const localUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");

    const storedUser = localUser || sessionUser;
    const token = localToken || sessionToken;

    if (!storedUser || !token || isTokenExpired(token)) {
      clearAuthStorage();
      dispatch(signOutSuccess());
      navigate("/", { replace: true });
      return;
    }

    if (!currentUser && storedUser) {
      try {
        dispatch(restoreUser(JSON.parse(storedUser)));
      } catch (error) {
        console.error("Failed to restore user:", error);
        clearAuthStorage();
        dispatch(signOutSuccess());
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, dispatch, navigate]);

  useEffect(() => {
    setImageError(false);
  }, [currentUser?.profileImage]);

  const user = currentUser || getStoredUser();

  const getUserInitials = (name = "") => {
    const parts = String(name).trim().split(" ").filter(Boolean);

    if (!parts.length) return "LL";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "LL";

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const hasProfileImage = Boolean(user?.profileImage) && !imageError;

  const handleMenuClick = (id) => {
    setInternalActive(id);

    if (setActiveMenu) {
      setActiveMenu(id);
    }
  };

  const handleLogout = () => {
    clearAuthStorage();
    dispatch(signOutSuccess());
    navigate("/", { replace: true });
  };

  return (
    <aside className="flex h-screen w-[270px] shrink-0 flex-col border-r border-slate-800/60 bg-[#06080F] text-slate-300 shadow-2xl">
      <div className="shrink-0 px-5 pb-4 pt-6">
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-2 transition-all hover:bg-white/[0.05]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg shadow-cyan-500/20">
              {hasProfileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || "Admin"}
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                  {getUserInitials(user?.name)}
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
            </div>

            <div className="flex min-w-0 flex-col items-start">
              <span className="text-sm font-black tracking-wide text-slate-100">
                LawLinkBD
              </span>

              <span className="max-w-[145px] truncate text-xs font-semibold text-slate-400">
                {user?.name || "Logged-in User"}
              </span>

              <span className="max-w-[145px] truncate text-[11px] font-medium capitalize text-slate-500">
                {user?.role || "admin"}
                {user?.email ? ` • ${user.email}` : ""}
              </span>
            </div>
          </div>

          <FiChevronRight className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
        </button>
      </div>

      <div className="shrink-0 px-6 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Main Navigation
        </p>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 pb-6
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-slate-800/50
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
      >
        <LayoutGroup>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentActive === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMenuClick(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3 text-left outline-none transition-colors ${
                    isActive
                      ? "text-cyan-300"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 z-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3.5">
                    <Icon
                      className={`text-[18px] transition-transform duration-300 ${
                        isActive
                          ? "scale-110 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]"
                          : "text-slate-500 group-hover:scale-110 group-hover:text-slate-300"
                      }`}
                    />

                    <span
                      className={`text-sm ${
                        isActive
                          ? "font-semibold text-cyan-100"
                          : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-slate-800/60 bg-[#06080F]/80 p-4 backdrop-blur-md">
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <FiHelpCircle className="text-[18px] text-slate-500 group-hover:text-slate-300" />
          Support & Docs
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <FiLogOut className="text-[18px] text-slate-500 group-hover:text-red-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;