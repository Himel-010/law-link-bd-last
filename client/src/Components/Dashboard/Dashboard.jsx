import React, { useEffect, useState } from "react";
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiSettings,
  FiFileText,
  FiLayers,
  FiPackage,
  FiDollarSign,
  FiGitPullRequest,
  FiBriefcase,
  FiCalendar,
  FiMail,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";

import OverviewContent from "./OverviewContent";
import ClientsContent from "./ClientsContent";
import UsersContent from "./UsersContent";
import SettingsContent from "./SettingsContent";
import PostContent from "./PostContent";
import AdminSubscriptionContent from "./AdminSubscription";
import AdminPlanContent from "./AdminPlanContent";
import AdminPaymentsManager from "./AdminPaymentsManager";
import AdminConnectionsDashboard from "./ConnectionContent";
import AdminLawyersContent from "./AdminLawyersContent";
import AdminLawyerAvailabilityContent from "./AdminLawyerAvailabilityContent";
import AdminContactMessages from "./AdminContactMessages";

import { signOutSuccess } from "../../Redux/UserSlice/UserSlice";

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

const getStoredAuth = () => {
  const localUser = localStorage.getItem("currentUser");
  const sessionUser = sessionStorage.getItem("currentUser");
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");

  const userData = localUser || sessionUser;
  const token = localToken || sessionToken;

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("User parse error:", error);
    user = null;
  }

  return { user, token };
};

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [authChecked, setAuthChecked] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const { user, token } = getStoredAuth();

    if (!user || !token || isTokenExpired(token)) {
      clearAuthStorage();
      dispatch(signOutSuccess());
      navigate("/", { replace: true });
      return;
    }

    setAuthChecked(true);
  }, [dispatch, navigate]);

  const menuItems = [
    { id: "overview", label: "Overview", icon: FiHome },
    { id: "users", label: "Users", icon: FiUserCheck },
    { id: "clients", label: "Clients", icon: FiUsers },
    { id: "lawyers", label: "Lawyers", icon: FiBriefcase },
    { id: "lawyer-availability", label: "Availability", icon: FiCalendar },
    { id: "posts", label: "Posts", icon: FiFileText },
    { id: "contact-messages", label: "Contact Messages", icon: FiMail },
    { id: "plans", label: "Plans", icon: FiPackage },
    { id: "subscriptions", label: "Subscriptions", icon: FiLayers },
    { id: "payments", label: "Payments", icon: FiDollarSign },
    { id: "bids-proposals", label: "Bids & Proposals", icon: FiGitPullRequest },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  const clientRows = [
    {
      name: "Acme Corporation",
      contact: "Sarah Wilson",
      plan: "Premium",
      status: "Active",
    },
    {
      name: "Nexus Labs",
      contact: "James Clark",
      plan: "Business",
      status: "Active",
    },
    {
      name: "BrightPath",
      contact: "Emma Lewis",
      plan: "Standard",
      status: "Pending",
    },
    {
      name: "Orion Tech",
      contact: "Michael Reed",
      plan: "Premium",
      status: "Active",
    },
  ];

  const posts = [
    {
      id: 1,
      title: "Launch Update for PrimeDesk 2.0",
      category: "Announcement",
      author: "Admin Team",
      status: "Published",
      date: "12 Apr 2026",
      views: "12.4K",
    },
    {
      id: 2,
      title: "How to Improve Team Productivity",
      category: "Blog",
      author: "Sarah Wilson",
      status: "Draft",
      date: "10 Apr 2026",
      views: "4.1K",
    },
    {
      id: 3,
      title: "Monthly Product Roadmap Highlights",
      category: "Update",
      author: "Product Team",
      status: "Published",
      date: "08 Apr 2026",
      views: "8.7K",
    },
    {
      id: 4,
      title: "New Client Success Story",
      category: "Case Study",
      author: "Emma Lewis",
      status: "Review",
      date: "06 Apr 2026",
      views: "2.9K",
    },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "overview":
        return <OverviewContent />;

      case "users":
        return <UsersContent />;

      case "clients":
        return <ClientsContent clientRows={clientRows} />;

      case "lawyers":
        return <AdminLawyersContent />;

      case "lawyer-availability":
        return <AdminLawyerAvailabilityContent />;

      case "posts":
        return <PostContent posts={posts} />;

      case "contact-messages":
        return <AdminContactMessages />;

      case "plans":
        return <AdminPlanContent />;

      case "subscriptions":
        return <AdminSubscriptionContent />;

      case "payments":
        return <AdminPaymentsManager />;

      case "bids-proposals":
        return <AdminConnectionsDashboard />;

      case "settings":
        return <SettingsContent />;

      default:
        return <OverviewContent />;
    }
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600 shadow-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <Sidebar
        menuItems={menuItems}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <main className="flex-1 overflow-y-auto px-6 pt-8 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;