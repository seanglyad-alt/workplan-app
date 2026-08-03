/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart2, Calendar, MessageSquare, Settings, Bell, 
  Sparkles, Video, Play, CheckCircle2, XCircle, Trash2, CalendarRange, Clock, ThumbsUp, Heart, RefreshCw, Layers,
  Facebook, LogOut, User, Info, Pause, CheckSquare, Square,
  Lock, Eye, EyeOff, ShieldCheck, Fingerprint, LogIn, Key, Mail, Moon, Sun, Table, Globe, Printer, PlusCircle, ChevronDown, Check, Menu, X
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import Dashboard from "./components/Dashboard";
import PowerEditor from "./components/PowerEditor";
import CommentManager from "./components/CommentManager";
import PageSettings from "./components/PageSettings";
import VideoCarouselEditor from "./components/VideoCarouselEditor";
import Footer from "./components/Footer";
import WorkPlan from "./components/WorkPlan";
import UserProfile from "./components/UserProfile";
import SystemManagement from "./components/SystemManagement";
import { fetchWithAuth } from "./lib/api.ts";
import { VideoPost, Comment, AutoReplyRule, PageSettings as PageSettingsType, UserRole, AnalyticsData, PostStatus } from "./types";
import { loginWithGoogle, loginWithEmail, resetPassword, logout as logoutFbAuth, subscribeToAuthChanges, getAuthToken, updateLocalUser } from "./lib/auth-client.ts";
import { User as FirebaseUser } from "firebase/auth";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "editor" | "comments" | "settings" | "carousel" | "workplan" | "profile">("workplan");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // WorkPlan Topbar Tab States & Action Triggers
  const [workPlanTab, setWorkPlanTab] = useState<"dashboard" | "calendar" | "month-calendar" | "datagrid" | "manager" | "report">("dashboard");
  const [workPlanIsExportMode, setWorkPlanIsExportMode] = useState<boolean>(false);
  const [workPlanCounts, setWorkPlanCounts] = useState<{ week: number; month: number; pages: number }>({ week: 0, month: 0, pages: 0 });
  const [workPlanMonths, setWorkPlanMonths] = useState<{ id: string; name: string; nameKh: string; status: "COMPLETED" | "IN_PROGRESS" }[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [workPlanSelectedMonthId, setWorkPlanSelectedMonthId] = useState<string>("");
  const [workPlanOnSelectMonthId, setWorkPlanOnSelectMonthId] = useState<((id: string) => void) | null>(null);
  const [workPlanOnOpenNewPost, setWorkPlanOnOpenNewPost] = useState<(() => void) | null>(null);
  const [workPlanOnOpenCreateMonth, setWorkPlanOnOpenCreateMonth] = useState<(() => void) | null>(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Memoized Sync Callbacks to prevent infinite re-render loops
  const handleCountsUpdate = useCallback((counts: { week: number; month: number; pages: number }) => {
    setWorkPlanCounts(prev => {
      if (prev.week === counts.week && prev.month === counts.month && prev.pages === counts.pages) {
        return prev;
      }
      return counts;
    });
  }, []);

  const handleMonthsSync = useCallback((data: {
    months: { id: string; name: string; nameKh: string; status: "COMPLETED" | "IN_PROGRESS" }[];
    selectedMonthId: string;
    onSelectMonthId: (id: string) => void;
    onOpenNewPost: () => void;
    onOpenCreateMonth: () => void;
  }) => {
    setWorkPlanMonths(prev => (prev === data.months ? prev : data.months));
    setWorkPlanSelectedMonthId(prev => (prev === data.selectedMonthId ? prev : data.selectedMonthId));
    setWorkPlanOnSelectMonthId(() => data.onSelectMonthId);
    setWorkPlanOnOpenNewPost(() => data.onOpenNewPost);
    setWorkPlanOnOpenCreateMonth(() => data.onOpenCreateMonth);
  }, []);

  // Current user authentication session
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<UserRole | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("app_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme", theme);
    }

    // Inject / remove a comprehensive light-mode override stylesheet.
    // Using attribute selectors ([class*="..."]) guarantees the rules match
    // even when Tailwind v4 JIT doesn't re-process escaped class names at build time.
    const STYLE_ID = "light-mode-injected-overrides";
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (theme === "light") {
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = `
        /* ═══════════════════════════════════════════════════════════════════
           LIGHT MODE — Runtime Injected Override Stylesheet
           Covers every dark hex bg color found in the project (exact match).
           Branded colors (#1877f2, #f02849, #10b981, #166fe5, #00ebff) are
           intentionally excluded so they are never overridden.
        ═══════════════════════════════════════════════════════════════════ */

        /* ── Root & body ──────────────────────────────────────────────────── */
        html.light, html.light body {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* ── Exact dark hex backgrounds → white surface ───────────────────── */
        html.light [class*="bg-[#07070a]"],
        html.light [class*="bg-[#07080c]"],
        html.light [class*="bg-[#0a0a0b]"],
        html.light [class*="bg-[#0a0a0c]"],
        html.light [class*="bg-[#0b2545]"],
        html.light [class*="bg-[#0c0c0e]"],
        html.light [class*="bg-[#0f0f12]"],
        html.light [class*="bg-[#0f0f13]"],
        html.light [class*="bg-[#111115]"],
        html.light [class*="bg-[#111116]"],
        html.light [class*="bg-[#141418]"],
        html.light [class*="bg-[#141419]"],
        html.light [class*="bg-[#16161a]"],
        html.light [class*="bg-[#16161b]"],
        html.light [class*="bg-[#18181f]"],
        html.light [class*="bg-[#18191a]"],
        html.light [class*="bg-[#1a1a20]"],
        html.light [class*="bg-[#1c1e21]"],
        html.light [class*="bg-[#1f1f23]"],
        html.light [class*="bg-[#242526]"],
        html.light [class*="bg-[#2a2a30]"],
        html.light [class*="bg-[#303031]"],
        html.light [class*="bg-[#4e4f50]"],
        html.light [class*="bg-[#5c5d5e]"] {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
        }

        /* ── Header & semantic nav ────────────────────────────────────────── */
        html.light header,
        html.light nav {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07) !important;
        }

        /* ── Table structure ──────────────────────────────────────────────── */
        html.light thead,
        html.light thead tr {
          background-color: #e2e8f0 !important;
        }
        html.light thead th {
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
          background-color: #e2e8f0 !important;
        }
        html.light tbody tr { border-color: #f1f5f9 !important; }
        html.light tbody tr:hover { background-color: #f8fafc !important; }
        html.light td { border-color: #e2e8f0 !important; }

        /* ── Typography ───────────────────────────────────────────────────── */
        html.light h1, html.light h2, html.light h3,
        html.light h4, html.light h5, html.light h6 { color: #0f172a !important; }
        html.light [class*="text-white"] { color: #0f172a !important; }
        html.light [class*="text-slate-1"],
        html.light [class*="text-slate-2"] { color: #1e293b !important; }
        html.light [class*="text-slate-3"],
        html.light [class*="text-slate-4"] { color: #475569 !important; }
        html.light [class*="text-slate-5"] { color: #64748b !important; }

        /* ── Dark text-[#xxx] literal classes ─────────────────────────────── */
        html.light [class*="text-[#e"], html.light [class*="text-[#c"],
        html.light [class*="text-[#d"], html.light [class*="text-[#b"],
        html.light [class*="text-[#a"], html.light [class*="text-[#9"],
        html.light [class*="text-[#8"] { color: #334155 !important; }

        /* ── Inputs ───────────────────────────────────────────────────────── */
        html.light input,
        html.light select,
        html.light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        html.light input::placeholder,
        html.light textarea::placeholder { color: #94a3b8 !important; }
        html.light input:focus,
        html.light select:focus,
        html.light textarea:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
          outline: none !important;
        }

        /* ── Gradient buttons: always white text ──────────────────────────── */
        html.light [class*="bg-gradient"] { color: #ffffff !important; }
        html.light [class*="bg-gradient"] * { color: #ffffff !important; }

        /* ── Solid colour action buttons (non-tinted) keep white text ─────── */
        html.light [class*="bg-blue-6"] { color: #ffffff !important; }
        html.light [class*="bg-blue-5"]:not([class*="/"]) { color: #ffffff !important; }
        html.light [class*="bg-violet-6"] { color: #ffffff !important; }
        html.light [class*="bg-violet-5"]:not([class*="/"]) { color: #ffffff !important; }
        html.light [class*="bg-indigo-6"] { color: #ffffff !important; }
        html.light [class*="bg-emerald-5"]:not([class*="/"]),
        html.light [class*="bg-emerald-6"] { color: #ffffff !important; }
        html.light [class*="bg-rose-5"]:not([class*="/"]),
        html.light [class*="bg-rose-6"] { color: #ffffff !important; }
        html.light [class*="bg-sky-5"]:not([class*="/"]),
        html.light [class*="bg-sky-6"] { color: #ffffff !important; }
        html.light [class*="bg-teal-5"]:not([class*="/"]),
        html.light [class*="bg-teal-6"] { color: #ffffff !important; }
        html.light [class*="bg-amber-5"]:not([class*="/"]),
        html.light [class*="bg-orange-5"]:not([class*="/"]) { color: #ffffff !important; }

        /* ── Tinted badge/pill backgrounds (opacity variants) ─────────────── */
        html.light [class*="bg-rose-"][class*="/"]   { background-color: #ffe4e6 !important; color: #be123c !important; border-color: #fecdd3 !important; }
        html.light [class*="bg-blue-"][class*="/"]   { background-color: #dbeafe !important; color: #1d4ed8 !important; border-color: #bfdbfe !important; }
        html.light [class*="bg-amber-"][class*="/"]  { background-color: #fef3c7 !important; color: #b45309 !important; border-color: #fde68a !important; }
        html.light [class*="bg-emerald-"][class*="/"]{ background-color: #d1fae5 !important; color: #047857 !important; border-color: #a7f3d0 !important; }
        html.light [class*="bg-violet-"][class*="/"] { background-color: #ede9fe !important; color: #6d28d9 !important; border-color: #ddd6fe !important; }
        html.light [class*="bg-sky-"][class*="/"]    { background-color: #e0f2fe !important; color: #0369a1 !important; border-color: #bae6fd !important; }
        html.light [class*="bg-cyan-"][class*="/"]   { background-color: #cffafe !important; color: #0e7490 !important; border-color: #a5f3fc !important; }
        html.light [class*="bg-green-"][class*="/"]  { background-color: #dcfce7 !important; color: #15803d !important; border-color: #bbf7d0 !important; }
        html.light [class*="bg-indigo-"][class*="/"] { background-color: #e0e7ff !important; color: #4338ca !important; border-color: #c7d2fe !important; }
        html.light [class*="bg-orange-"][class*="/"] { background-color: #ffedd5 !important; color: #c2410c !important; border-color: #fed7aa !important; }
        html.light [class*="bg-yellow-"][class*="/"] { background-color: #fefce8 !important; color: #a16207 !important; border-color: #fef08a !important; }
        html.light [class*="bg-purple-"][class*="/"] { background-color: #f3e8ff !important; color: #7e22ce !important; border-color: #e9d5ff !important; }

        /* ── Borders ──────────────────────────────────────────────────────── */
        html.light [class*="border-white/"] { border-color: #e2e8f0 !important; }
        html.light [class*="border-slate-7"],
        html.light [class*="border-slate-8"] { border-color: #e2e8f0 !important; }
        html.light [class*="divide-white/"] > * + * { border-color: #e2e8f0 !important; }
        html.light hr { border-color: #e2e8f0 !important; }

        /* ── Aside & sidebar panels ───────────────────────────────────────── */
        html.light aside { background-color: #ffffff !important; border-color: #e2e8f0 !important; }

        /* ── Dropdowns, popovers, dialogs ─────────────────────────────────── */
        html.light [role="menu"],
        html.light [role="listbox"],
        html.light [role="dialog"] {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
          color: #0f172a !important;
        }

        /* ── Scrollbars ───────────────────────────────────────────────────── */
        html.light ::-webkit-scrollbar-track { background: #f1f5f9; }
        html.light ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        html.light ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* ── Toggle switch track ──────────────────────────────────────────── */
        html.light [class*="bg-slate-7"],
        html.light [class*="bg-slate-8"],
        html.light [class*="bg-slate-9"] { background-color: #cbd5e1 !important; }
      `;
    } else {
      if (el) {
        el.remove();
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Login credentials states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // In-memory frontend sync states
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<PageSettingsType | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // States
  const [isSyncing, setIsSyncing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeModal, setActiveModal] = useState<"profile" | "about" | null>(null);

  // Queue stream filters and pagination limits
  const [queueFilter, setQueueFilter] = useState<"all" | "published" | "scheduled" | "draft">("all");
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [activeBulkAction, setActiveBulkAction] = useState<"reschedule" | null>(null);
  const [bulkRescheduleTime, setBulkRescheduleTime] = useState<string>("");
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(6);

  // Facebook Integration states
  const [fbUser, setFbUser] = useState<{ id: string; name: string; avatar: string; email: string } | null>(null);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [fbLogs, setFbLogs] = useState<any[]>([]);

  // Initial full sync on start
  const fetchAllData = async () => {
    setIsSyncing(true);
    try {
      const endpoints = [
        "/api/posts", "/api/comments", "/api/rules", "/api/settings",
        "/api/notifications", "/api/analytics", "/api/auth/facebook/me", "/api/auth/me"
      ];

      const responses = await Promise.all(endpoints.map(path => fetchWithAuth(path)));
      
      const results = await Promise.all(responses.map(async (res, i) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error(`Failed to parse JSON from ${endpoints[i]}:`, text.substring(0, 100));
          throw new Error(`Invalid JSON from ${endpoints[i]}`);
        }
      }));

      const [resPosts, resComments, resRules, resSettings, resNotifications, resAnalytics, resFb, resMe] = results;

      setPosts(Array.isArray(resPosts) ? resPosts : []);
      setComments(Array.isArray(resComments) ? resComments : []);
      setRules(Array.isArray(resRules) ? resRules : []);
      setSettings(resSettings?.pageSettings || null);
      setRoles(Array.isArray(resSettings?.userRoles) ? resSettings.userRoles : []);
      setNotifications(Array.isArray(resNotifications) ? resNotifications : []);
      setAnalytics(resAnalytics || null);
      setDbUser(resMe || null);
      
      setFbUser(resFb?.user);
      setFacebookPages(Array.isArray(resFb?.pages) ? resFb.pages : []);
      setFbLogs(Array.isArray(resFb?.logs) ? resFb.logs : []);

      const unreads = (Array.isArray(resNotifications) ? resNotifications : []).filter((n: any) => !n.isRead).length;
      setUnreadNotifications(unreads);
    } catch (err) {
      console.error("កំហុសក្នុងការទាញយកទិន្នន័យពីម៉ាស៊ីនបម្រើ (Error fetching backend data):", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    setIsSubmittingLogin(true);
    setLoginError("");
    try {
      await loginWithEmail(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "Failed to login. Please check credentials.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setLoginError("Please enter your email first to reset password.");
      return;
    }
    try {
      await resetPassword(loginEmail);
      alert("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setLoginError(err.message || "Failed to send reset email.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const res = await fetchWithAuth("/api/auth/facebook/url");
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        "facebook_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left}`
      );
      if (!popup) {
        alert("សូមបើកការអនុញ្ញាត Pop-up Blockers ដើម្បីភ្ជាប់គណនីហ្វេសប៊ុក! (Please enable popups for Facebook login.)");
      }
    } catch (err) {
      console.error("Facebook Login error:", err);
    }
  };

  const handleFacebookLogout = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchWithAuth("/api/auth/facebook/logout", { method: "POST" });
      if (res.ok) {
        setFbUser(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectFacebookPage = async (pageId: string) => {
    setIsSyncing(true);
    try {
      const res = await fetchWithAuth("/api/auth/facebook/select-page", {
        method: "POST",
        body: JSON.stringify({ pageId })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Select page error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFacebookToken = async (token: string, cookies?: string, appId?: string, appSecret?: string) => {
    setIsSyncing(true);
    try {
      const res = await fetchWithAuth("/api/auth/facebook/import-token", {
        method: "POST",
        body: JSON.stringify({ token, cookies, appId, appSecret })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed raw token check");
      }
      await fetchAllData();
      return true;
    } catch (err: any) {
      console.error("Token import error:", err);
      alert(err.message || "Failed validating custom Facebook credentials.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Poll notifications less aggressively & simulate scheduled publishing updates
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setFirebaseUser(user);
      setIsInitializingAuth(false);
      if (user) {
        fetchAllData();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!firebaseUser) return;
      try {
        const resNotif = await fetchWithAuth("/api/notifications");
        const dataNotif = await resNotif.json();
        setNotifications(dataNotif);
        setUnreadNotifications(dataNotif.filter((n: any) => !n.isRead).length);
      } catch (e) {
        console.warn("Silent notification fetch failed");
      }
    }, 15000); // 15s

    return () => clearInterval(interval);
  }, [firebaseUser]);

  // 1. Publish video immediately simulation
  const handleForcePublish = async (postId: string) => {
    setIsSyncing(true);
    try {
      const response = await fetchWithAuth(`/api/posts/${postId}/publish`, {
        method: "POST"
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Cancel / Delete video item from queue
  const handleCancelPost = async (postId: string) => {
    if (!confirm("តើប្អូនពិតជាចង់លុបឬបោះចោលកាលវិភាគវីដេអូនេះមែនទេ? (Are you sure you want to delete this scheduled post?)")) return;
    setIsSyncing(true);
    try {
      const response = await fetchWithAuth(`/api/posts/${postId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Bulk action on selected posts
  const handleBulkAction = async (action: "delete" | "pause" | "reschedule", data?: any) => {
    if (selectedPostIds.length === 0) return;
    
    if (action === "delete") {
      if (!confirm(`តើបងពិតជាចង់លុបវីដេអូទាំង ${selectedPostIds.length} នេះមែនទេ? (Are you sure you want to delete these ${selectedPostIds.length} selected posts?)`)) {
        return;
      }
    }

    setIsSyncing(true);
    try {
      const response = await fetchWithAuth("/api/posts/bulk", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedPostIds,
          action,
          data
        })
      });
      if (response.ok) {
        setSelectedPostIds([]); // Clear selection on success
        await fetchAllData();
      } else {
        const errData = await response.json();
        alert(`មានបញ្ហា៖ ${errData.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("មានបញ្ហាក្នុងការតភ្ជាប់សូមព្យាយាមឡើងវិញ!");
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. New Scheduled Post creation handler
  const handlePostCreated = async (newPost: any) => {
    try {
      const response = await fetchWithAuth("/api/posts", {
        method: "POST",
        body: JSON.stringify(newPost)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Manual / AI reply submission handler
  const handleReplySubmitted = async (commentId: string, text: string, isAutoReplied?: boolean) => {
    try {
      const response = await fetchWithAuth(`/api/comments/${commentId}/reply`, {
        method: "POST",
        body: JSON.stringify({ replyText: text, isAutoReplied })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Create new auto responder reply rule keyword conditions
  const handleRuleAdded = async (newRule: any) => {
    try {
      const response = await fetchWithAuth("/api/rules", {
        method: "POST",
        body: JSON.stringify(newRule)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rule activation toggler support
  const handleRuleToggle = async (ruleId: string) => {
    try {
      const response = await fetchWithAuth(`/api/rules/${ruleId}/toggle`, {
        method: "POST"
      });
      if (response.ok) {
        const updatedRules = rules.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r);
        setRules(updatedRules);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRuleEdited = async (ruleId: string, updatedFields: Partial<AutoReplyRule>) => {
    try {
      const response = await fetchWithAuth(`/api/rules/${ruleId}`, {
        method: "PUT",
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRuleDeleted = async (ruleId: string) => {
    try {
      const response = await fetchWithAuth(`/api/rules/${ruleId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Connected Facebook Page custom configurations saved
  const handleSettingsSaved = async (updatedSettings: Partial<PageSettingsType>) => {
    try {
      const response = await fetchWithAuth("/api/settings", {
        method: "POST",
        body: JSON.stringify(updatedSettings)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Dynamic User Role accounts management added
  const handleRoleAdded = async (newRole: Omit<UserRole, "id" | "avatar">) => {
    try {
      const response = await fetchWithAuth("/api/settings/roles", {
        method: "POST",
        body: JSON.stringify(newRole)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleUpdated = async (roleId: string, updatedRole: Omit<UserRole, "id" | "avatar">) => {
    try {
      const response = await fetchWithAuth(`/api/settings/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify(updatedRole)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleDeleted = async (roleId: string) => {
    const targetRole = roles.find(r => r.id === roleId);
    if (targetRole) {
      const r = (targetRole.role || "").toLowerCase();
      const n = (targetRole.name || "").toLowerCase();
      const e = (targetRole.email || "").toLowerCase();
      if (r === "admin" || r === "super admin" || n.includes("super admin") || e === "admin@app.local" || e === "seanglyad@gmail.com") {
        alert("មិនអាចលុបគណនី Super Admin ឬ Admin បានទេ! (Super Admin cannot be deleted)");
        return;
      }
    }
    try {
      setIsSyncing(true);
      const res = await fetchWithAuth(`/api/settings/roles/${roleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "បរាជ័យក្នុងការលុបបុគ្គលិក!");
        return;
      }
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err) {
      console.error(err);
      alert("បរាជ័យក្នុងការលុបបុគ្គលិក!");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProfile = async (userId: string, data: Partial<UserRole & { password?: string }>) => {
    try {
      setIsSyncing(true);
      const response = await fetchWithAuth(`/api/settings/roles/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពព័ត៌មាន!");
      }

      const updated = await response.json();
      
      setRoles(prev => prev.map(r => r.id === userId ? updated : r));
      if (dbUser?.id?.toString() === userId?.toString()) {
        setDbUser(updated);
        updateLocalUser(updated);
      }
      alert("បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានជោគជ័យ!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "មានបញ្ហាបច្ចេកទេសក្នុងការរក្សាទុក!");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // 8. Live simulated follower comment payload creation webhook
  const handleSimulateActivity = async () => {
    setIsSyncing(true);
    try {
      const response = await fetchWithAuth("/api/simulate/activity", {
        method: "POST"
      });
      if (response.ok) {
        await fetchAllData();
        // Give a little visual success alert feedback popup
        setShowNotificationPopup(true);
        setTimeout(() => setShowNotificationPopup(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetchWithAuth("/api/notifications/read-all", { method: "POST" });
      setUnreadNotifications(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (isInitializingAuth) {
    return <div className={`min-h-screen flex items-center justify-center ${theme === "light" ? "bg-slate-100 text-slate-900" : "bg-[#07070a] text-slate-200"}`}>
      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
    </div>;
  }

  if (!firebaseUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6 md:p-8 selection:bg-blue-500/30 selection:text-blue-200 ${theme === "light" ? "bg-slate-100 text-slate-900" : "bg-[#07070a] text-slate-200"}`}>
        <button
          type="button"
          onClick={toggleTheme}
          className={`absolute top-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${theme === "light" ? "bg-white/90 text-slate-900 border-slate-200 shadow-md shadow-slate-200/40 hover:bg-slate-50" : "bg-[#111116]/90 text-slate-200 border-white/[0.08] hover:bg-[#16161a]"}`}
        >
          {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === "light" ? "Light mode" : "Dark mode"}</span>
        </button>
        
        {/* Abstract background decorative patterns */}
        <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme === "light" ? "from-slate-100/90 via-slate-200/80 to-white" : "from-blue-900/10 via-[#07070a] to-[#050507]"} z-0 pointer-events-none`} />
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl z-0 pointer-events-none ${theme === "light" ? "bg-slate-300/70" : "bg-blue-600/10"}`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl z-0 pointer-events-none ${theme === "light" ? "bg-slate-200/70" : "bg-indigo-600/10"}`} />

        <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Brand Presentation Left Side Column */}
          <div className="lg:col-span-7 space-y-6 text-left hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[10px] font-semibold uppercase tracking-wider ${theme === "light" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" : "bg-blue-500/10 border-blue-500/15 text-blue-400"}`}>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>ប្រព័ន្ធគ្រប់គ្រងផែនការការងារប្រចាំសប្តាហ៍ & ខែ</span>
              </div>
              
              <h2 className={`text-4xl font-extrabold font-display leading-[1.125] tracking-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                គ្រប់គ្រង និងរៀបចំ<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">ផែនការការងារ</span>យ៉ាងជាក់លាក់
              </h2>
              
              <p className={`text-xs leading-relaxed font-sans max-w-xl ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                ប្រព័ន្ធគ្រប់គ្រងផែនការការងារ គឺជាឧបករណ៍ច្បាស់លាស់ សម្រាប់រៀបចំ តាមដាន និងគ្រប់គ្រងផែនការការងារប្រចាំសប្តាហ៍ និងប្រចាំខែ ជាមួយនឹង Dashboard ស្ថិតិ DataGrid និងរបាយការណ៍ Export ស្ស្ថាបនា។
              </p>
            </motion.div>

            {/* Platform statistics decorative rows */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className={`p-4 rounded-2xl backdrop-blur-md ${theme === "light" ? "bg-slate-100 border border-slate-200" : "bg-[#111115]/80 border border-white/[0.04]"}`}>
                <span className={`block text-xl font-bold font-mono ${theme === "light" ? "text-slate-900" : "text-white"}`}>5 សប្ត.</span>
                <span className={`block text-[10px] uppercase tracking-wider font-sans font-medium mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>ក្នុងមួយខែ</span>
              </div>
              <div className={`p-4 rounded-2xl backdrop-blur-md ${theme === "light" ? "bg-slate-100 border border-slate-200" : "bg-[#111115]/80 border border-white/[0.04]"}`}>
                <span className={`block text-xl font-bold font-mono ${theme === "light" ? "text-slate-900" : "text-white"}`}>7 ថ្ងៃ</span>
                <span className={`block text-[10px] uppercase tracking-wider font-sans font-medium mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>ក្នុងមួយសប្តាហ៍</span>
              </div>
              <div className={`p-4 rounded-2xl backdrop-blur-md ${theme === "light" ? "bg-slate-100 border border-slate-200" : "bg-[#111115]/80 border border-white/[0.04]"}`}>
                <span className={`block text-xl font-bold font-mono ${theme === "light" ? "text-slate-900" : "text-white"}`}>Real-time</span>
                <span className={`block text-[10px] uppercase tracking-wider font-sans font-medium mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>Dashboard</span>
              </div>
            </motion.div>
          </div>

          {/* Login Form Right Column */}
          <div className="lg:col-span-5 w-full mx-auto max-w-md lg:max-w-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`p-8 rounded-3xl shadow-2xl space-y-7 backdrop-blur-lg relative ${theme === "light" ? "bg-white border border-slate-200/70 text-slate-900 shadow-lg" : "bg-[#111116] border border-white/[0.08] text-slate-200"}`}
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-600/10 text-blue-400 border border-blue-500/15 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-bold font-display ${theme === "light" ? "text-slate-900" : "text-white"}`}>ចូលប្រើប្រព័ន្ធគ្រប់គ្រង</h3>
                <p className={`text-xs font-sans px-4 ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់របស់អ្នក (Please login to continue).</p>
                {loginError && (
                  <div className={`rounded-xl px-4 py-3 text-sm font-medium ${theme === "light" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-rose-500/10 text-rose-200 border border-rose-500/20"}`}>
                    {loginError}
                  </div>
                )}
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 block font-sans">បង្កើតឈ្មោះ/អ៊ីមែល (Username or Email)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                      type="text" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isSubmittingLogin}
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl leading-5 sm:text-sm font-sans transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${theme === "light" ? "bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-500" : "bg-[#16161a] border border-white/[0.08] text-slate-200 placeholder-slate-500"}`}
                      placeholder="Enter email (e.g., admin@app.local)" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 block font-sans">ពាក្យសម្ងាត់ (Password)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isSubmittingLogin}
                      className={`block w-full pl-10 pr-10 py-3 rounded-xl leading-5 sm:text-sm font-sans transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${theme === "light" ? "bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-500" : "bg-[#16161a] border border-white/[0.08] text-slate-200 placeholder-slate-500"}`}
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className={`h-4 w-4 rounded text-blue-600 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${theme === "light" ? "bg-white border-slate-300" : "bg-[#16161a] border border-white/[0.2]"}`}
                    />
                    <label htmlFor="remember-me" className={`ml-2 block ${theme === "light" ? "text-slate-600" : "text-slate-400"} cursor-pointer`}>
                      ចងចាំខ្ញុំ (Remember me)
                    </label>
                  </div>

                  <div className="text-sm">
                    <button type="button" onClick={handleForgotPassword} className="font-medium text-blue-400 hover:text-blue-300 transition-colors text-xs cursor-pointer">
                      ភ្លេចពាក្យសម្ងាត់?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans"
                >
                  {isSubmittingLogin ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>ចូលប្រព័ន្ធ (Sign in)</span>}
                </button>
              </form>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className={`h-px flex-1 ${theme === "light" ? "bg-slate-300/40" : "bg-white/[0.06]"}`}></div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-none">OR CONTINUE WITH</span>
                  <div className={`h-px flex-1 ${theme === "light" ? "bg-slate-300/40" : "bg-white/[0.06]"}`}></div>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className={`w-full h-12 rounded-xl transition-all font-medium font-sans flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer ${theme === "light" ? "bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-200" : "bg-[#16161a] hover:bg-white/[0.05] border border-white/[0.1] text-slate-300"}`}
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">ចូលដោយប្រើ Google (Sign in with Google Mail)</span>
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-500 font-sans leading-relaxed">
                ដោយការបន្តចូលប្រើប្រាស់ ប្អូនយល់ព្រមតាមគោលការណ៍រក្សាការសម្ងាត់ និងបទបញ្ជាផ្ទៃក្នុងរបស់ក្រុមហ៊ុន។
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-blue-500/30 selection:text-blue-200 ${theme === "light" ? "bg-slate-100 text-slate-900" : "bg-[#0a0a0b] text-slate-200"}`}>
      
      {/* 1. TOP GLOBAL NAVIGATION HEADER */}
      <header className={`print-hide sticky top-0 z-40 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 print:hidden border-b transition-colors ${
        theme === "light"
          ? "bg-white/90 border-slate-200/80 text-slate-900 shadow-sm"
          : "bg-[#0f0f12]/95 border-white/[0.08] text-slate-200 shadow-xl"
      }`}>
        <div className="max-w-[1850px] mx-auto">
          
          {/* MAIN TOP BAR (Single row on desktop & mobile) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Brand Logo - Click to toggle Dashboard */}
            <button
              type="button"
              onClick={() => {
                if (workPlanTab === "dashboard") {
                  setWorkPlanTab("calendar");
                  setWorkPlanIsExportMode(false);
                } else {
                  setWorkPlanTab("dashboard");
                  setWorkPlanIsExportMode(false);
                }
              }}
              title="ចុចដើម្បីបើក/បិទ Dashboard ស្ថិតិ (Toggle Dashboard)"
              className={`flex items-center gap-2 sm:gap-2.5 shrink-0 group cursor-pointer rounded-xl px-1.5 py-1 transition-all ${
                workPlanTab === "dashboard"
                  ? "bg-blue-600/10 border border-blue-500/20"
                  : "hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <span className={`p-1.5 sm:p-2 rounded-xl border shadow-sm flex items-center justify-center transition-all ${
                workPlanTab === "dashboard"
                  ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                  : theme === "light" ? "bg-slate-200/80 border-slate-300 text-slate-800" : "bg-blue-600/10 border-blue-500/15 text-blue-400"
              }`}>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="text-left">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className={`text-xs sm:text-sm md:text-base font-bold font-display tracking-tight leading-tight ${
                    workPlanTab === "dashboard" ? "text-blue-400" : theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    គ្រប់គ្រងផែនការការងារ
                  </h1>
                  {workPlanTab === "dashboard" && (
                    <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono font-bold shrink-0">
                      Dashboard
                    </span>
                  )}
                </div>
                <p className={`text-[9px] sm:text-[10px] font-sans line-clamp-1 hidden sm:block ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}>
                  កាលវិភាគផែនការការងារប្រចាំសប្តាហ៍ & ប្រចាំខែ
                </p>
              </div>
            </button>

            {/* CENTER TOPBAR TAB MENU NAVIGATION - DESKTOP VIEW (Visible on xl screens >= 1280px) */}
            {activeTab === "workplan" && (
              <nav className="hidden xl:flex items-center p-[2px] rounded-2xl animate-gemini-border shadow-xl shadow-cyan-500/20 transition-all">
                <div className={`flex items-center gap-1.5 p-1.5 rounded-[14px] w-full h-full transition-all ${
                  theme === 'light'
                    ? 'bg-[#f0f7ff]'
                    : 'bg-[#141d33]'
                }`}>
                  {/* 1. Week Calendar */}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkPlanTab("calendar");
                      setWorkPlanIsExportMode(false);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                      workPlanTab === "calendar" && !workPlanIsExportMode
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-300 shadow-md shadow-sky-500/40 font-black"
                        : theme === 'light'
                        ? "bg-white border-slate-300 text-slate-800 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 shadow-xs"
                        : "bg-[#0f172a] border-blue-500/25 text-slate-200 hover:text-white hover:bg-sky-500/25 hover:border-sky-400/50"
                    }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 ${workPlanTab === "calendar" && !workPlanIsExportMode ? "text-white" : "text-sky-400"}`} />
                    <span>ប្រតិទិនសប្តាហ៍</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      workPlanTab === "calendar" && !workPlanIsExportMode ? "bg-white/20 text-white" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }`}>
                      {workPlanCounts.week}
                    </span>
                  </button>

                  {/* 2. Month Calendar */}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkPlanTab("month-calendar");
                      setWorkPlanIsExportMode(false);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                      workPlanTab === "month-calendar" && !workPlanIsExportMode
                        ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-300 shadow-md shadow-cyan-500/40 font-black"
                        : theme === 'light'
                        ? "bg-white border-slate-300 text-slate-800 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 shadow-xs"
                        : "bg-[#0f172a] border-cyan-500/25 text-slate-200 hover:text-white hover:bg-cyan-500/25 hover:border-cyan-400/50"
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${workPlanTab === "month-calendar" && !workPlanIsExportMode ? "text-white" : "text-cyan-400"}`} />
                    <span>ប្រតិទិនខែ</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      workPlanTab === "month-calendar" && !workPlanIsExportMode ? "bg-white/20 text-white" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}>
                      {workPlanCounts.month}
                    </span>
                  </button>

                  {/* 3. DataGrid */}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkPlanTab("datagrid");
                      setWorkPlanIsExportMode(false);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                      workPlanTab === "datagrid" && !workPlanIsExportMode
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-300 shadow-md shadow-emerald-500/40 font-black"
                        : theme === 'light'
                        ? "bg-white border-slate-300 text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-xs"
                        : "bg-[#0f172a] border-emerald-500/25 text-slate-200 hover:text-white hover:bg-emerald-500/25 hover:border-emerald-400/50"
                    }`}
                  >
                    <Table className={`w-3.5 h-3.5 ${workPlanTab === "datagrid" && !workPlanIsExportMode ? "text-white" : "text-emerald-400"}`} />
                    <span>តារាងទិន្នន័យ DataGrid</span>
                  </button>

                  {/* 4. Pages & Platforms */}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkPlanTab("manager");
                      setWorkPlanIsExportMode(false);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                      workPlanTab === "manager" && !workPlanIsExportMode
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-300 shadow-md shadow-violet-500/40 font-black"
                        : theme === 'light'
                        ? "bg-white border-slate-300 text-slate-800 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 shadow-xs"
                        : "bg-[#0f172a] border-violet-500/25 text-slate-200 hover:text-white hover:bg-violet-500/25 hover:border-violet-400/50"
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${workPlanTab === "manager" && !workPlanIsExportMode ? "text-white" : "text-violet-400"}`} />
                    <span>Pages &amp; Platforms</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      workPlanTab === "manager" && !workPlanIsExportMode ? "bg-white/20 text-white" : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    }`}>
                      {workPlanCounts.pages}
                    </span>
                  </button>

                  {/* 5. Export Report */}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkPlanTab("report");
                      setWorkPlanIsExportMode(true);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                      workPlanIsExportMode || workPlanTab === "report"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-amber-300 shadow-md shadow-orange-500/40 font-black"
                        : theme === 'light'
                        ? "bg-amber-500/15 border border-amber-500/40 text-amber-900 hover:bg-amber-500/25 shadow-xs"
                        : "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:bg-amber-500/30"
                    }`}
                  >
                    <Printer className={`w-3.5 h-3.5 ${workPlanIsExportMode || workPlanTab === "report" ? "text-white" : "text-amber-400"}`} />
                    <span>Export Report</span>
                  </button>
                </div>
              </nav>
            )}

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Month Selector & Create Month Button */}
              {activeTab === "workplan" && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Month Dropdown Selector Popover */}
                  {workPlanMonths.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans shadow-sm border ${
                          theme === 'light' 
                            ? 'bg-blue-50/80 hover:bg-blue-100/80 border-blue-200 text-blue-900' 
                            : 'bg-[#16161a] hover:bg-white/[0.08] border-blue-500/30 text-blue-300'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold">
                          {workPlanMonths.find(m => m.id === workPlanSelectedMonthId)?.nameKh || "ជ្រើសរើសខែ"}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMonthDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Popover Menu displaying detailed month list */}
                      {isMonthDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsMonthDropdownOpen(false)} 
                          />
                          <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 font-sans ${theme === 'light' ? 'bg-white border border-slate-200 shadow-slate-200/60' : 'bg-[#111115] border border-white/[0.12]'}`}>
                            <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between ${theme === 'light' ? 'text-slate-500 border-b border-slate-100' : 'text-slate-400 border-b border-white/[0.06]'}`}>
                              <span>បញ្ជីខែផែនការ</span>
                              <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                {workPlanMonths.find(m => m.id === workPlanSelectedMonthId)?.nameKh || "ជ្រើសរើស"}
                              </span>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                              {workPlanMonths.map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setWorkPlanSelectedMonthId(m.id);
                                    if (workPlanOnSelectMonthId) workPlanOnSelectMonthId(m.id);
                                    setIsMonthDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                    m.id === workPlanSelectedMonthId
                                      ? "bg-blue-600/15 text-blue-600 border-l-2 border-blue-500 font-bold"
                                      : theme === 'light' ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                  }`}
                                >
                                  <span>{m.nameKh} ({m.name})</span>
                                  {m.id === workPlanSelectedMonthId && (
                                    <Check className="w-3.5 h-3.5 text-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Create Next Month Launcher */}
                  <button
                    type="button"
                    onClick={() => workPlanOnOpenCreateMonth && workPlanOnOpenCreateMonth()}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer font-sans whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>បង្កើតខែបន្ទាប់</span>
                  </button>
                </div>
              )}

              {/* Quick Add Post Button */}
              {activeTab === "workplan" && (
                <button
                  type="button"
                  onClick={() => workPlanOnOpenNewPost && workPlanOnOpenNewPost()}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer font-sans active:scale-95 whitespace-nowrap shrink-0"
                  title="បន្ថែមផុសថ្មី"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ បន្ថែមផុសថ្មី</span>
                  <span className="sm:hidden font-bold">ផុសថ្មី</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  theme === "light" ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200" : "bg-[#16161a] border-white/[0.06] text-slate-200 hover:bg-white/10"
                }`}
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === "light" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
              </button>

              {/* Compact Avatar + Dropdown Menu */}
              {firebaseUser && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(prev => !prev)}
                    className={`flex items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer ${
                      showUserDropdown
                        ? "bg-blue-500/10 border-blue-500/20"
                        : theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 'bg-[#16161a] border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                    title={(dbUser?.name) || firebaseUser.displayName || "User"}
                  >
                    <img
                      src={(dbUser?.avatar) || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((dbUser?.name || "A"))}&background=1e40af&color=fff`}
                      alt={(dbUser?.name) || "User"}
                      className="w-7 h-7 object-cover rounded-lg border border-white/[0.08]"
                    />
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute right-0 top-full mt-2 w-52 sm:w-56 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden z-50 ${theme === 'light' ? 'bg-white border border-slate-200 shadow-slate-200/60' : 'bg-[#111116] border border-white/[0.08]'}`}
                        >
                          {/* Header */}
                           <div className={`px-4 py-3 flex items-center gap-3 ${theme === 'light' ? 'border-b border-slate-100' : 'border-b border-white/[0.06]'}`}>
                            <img
                              src={(dbUser?.avatar) || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent((dbUser?.name || "A"))}&background=1e40af&color=fff`}
                              alt={(dbUser?.name) || "User"}
                              className="w-9 h-9 object-cover rounded-xl border border-white/[0.08]"
                            />
                            <div className="text-left overflow-hidden">
                               <p className={`text-[11px] font-bold truncate font-display ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{(dbUser?.name) || firebaseUser.displayName}</p>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-blue-400 bg-blue-500/10">
                                {dbUser?.role || "User"}
                              </span>
                            </div>
                          </div>
                          {/* Items */}
                          <div className="py-1.5">
                            <button
                              type="button"
                              onClick={() => { setActiveTab("profile"); setShowUserDropdown(false); }}
                               className={`w-full px-4 py-2.5 flex items-center gap-3 text-xs font-semibold hover:bg-blue-500/[0.08] hover:text-blue-600 transition-all cursor-pointer font-sans ${theme === 'light' ? 'text-slate-700' : 'text-slate-300 hover:text-blue-300'}`}
                            >
                              <User className="w-4 h-4 text-blue-400" />
                              <span>ព័ត៌មានគណនី (Profile)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveTab("settings"); setShowUserDropdown(false); }}
                               className={`w-full px-4 py-2.5 flex items-center gap-3 text-xs font-semibold hover:bg-violet-500/[0.08] hover:text-violet-600 transition-all cursor-pointer font-sans ${theme === 'light' ? 'text-slate-700' : 'text-slate-300 hover:text-violet-300'}`}
                            >
                              <Settings className="w-4 h-4 text-violet-400" />
                              <span>ការកំណត់ប្រព័ន្ធ (Settings)</span>
                            </button>
                            <div className={`mx-3 my-1 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/[0.05]'}`} />
                            <button
                              type="button"
                              onClick={() => { logoutFbAuth(); setShowUserDropdown(false); }}
                               className={`w-full px-4 py-2.5 flex items-center gap-3 text-xs font-semibold hover:bg-rose-500/[0.08] hover:text-rose-600 transition-all cursor-pointer font-sans ${theme === 'light' ? 'text-slate-700' : 'text-slate-300 hover:text-rose-400'}`}
                            >
                              <LogOut className="w-4 h-4 text-rose-400" />
                              <span>ចាកចេញ (Logout)</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* MOBILE MENU TOGGLE BUTTON (Visible on < xl screens) */}
              {activeTab === "workplan" && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  className={`xl:hidden p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    isMobileMenuOpen
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                      : theme === "light"
                      ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                      : "bg-[#16161a] border-white/[0.08] text-slate-300 hover:bg-white/10"
                  }`}
                  aria-label="Toggle Navigation Menu"
                  title="បើក/បិទ ម៉ឺនុយ"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}

            </div>
          </div>

          {/* MOBILE SCROLLABLE TAB STRIP (Visible on < xl screens when on workplan tab) */}
          {activeTab === "workplan" && (
            <div className="xl:hidden mt-2 p-[2px] rounded-2xl animate-gemini-border shadow-lg shadow-cyan-500/20 transition-all">
              <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth p-1.5 rounded-[14px] w-full py-1.5 pr-8 transition-all ${
                theme === 'light'
                  ? 'bg-[#f0f7ff]'
                  : 'bg-[#141d33]'
              }`}>
                <button
                  type="button"
                  onClick={() => { setWorkPlanTab("calendar"); setWorkPlanIsExportMode(false); }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    workPlanTab === "calendar" && !workPlanIsExportMode
                      ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-300 shadow-md shadow-sky-500/25"
                      : theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-blue-500/25 text-slate-200 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-sky-400" />
                  <span>ប្រតិទិនសប្តាហ៍</span>
                  <span className="text-[9px] px-1 py-0.1 rounded bg-sky-500/20 text-sky-300 font-mono">
                    {workPlanCounts.week}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setWorkPlanTab("month-calendar"); setWorkPlanIsExportMode(false); }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    workPlanTab === "month-calendar" && !workPlanIsExportMode
                      ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-300 shadow-md shadow-cyan-500/25"
                      : theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-cyan-500/25 text-slate-200 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>ប្រតិទិនខែ</span>
                  <span className="text-[9px] px-1 py-0.1 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {workPlanCounts.month}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setWorkPlanTab("datagrid"); setWorkPlanIsExportMode(false); }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    workPlanTab === "datagrid" && !workPlanIsExportMode
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-300 shadow-md shadow-emerald-500/25"
                      : theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-emerald-500/25 text-slate-200 hover:text-white'
                  }`}
                >
                  <Table className="w-3 h-3 text-emerald-400" />
                  <span>DataGrid</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setWorkPlanTab("manager"); setWorkPlanIsExportMode(false); }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    workPlanTab === "manager" && !workPlanIsExportMode
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-300 shadow-md shadow-violet-500/25"
                      : theme === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f172a] border-violet-500/25 text-slate-200 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3 text-violet-400" />
                  <span>Pages ({workPlanCounts.pages})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setWorkPlanTab("report"); setWorkPlanIsExportMode(true); }}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                    workPlanIsExportMode || workPlanTab === "report"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-amber-300 shadow-md shadow-orange-500/25"
                      : theme === 'light' ? 'bg-amber-500/15 border-amber-500/40 text-amber-900' : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:text-amber-200'
                  }`}
                >
                  <Printer className="w-3 h-3 text-amber-400" />
                  <span>🖨️ របាយការណ៍ Print</span>
                </button>
              </div>
            </div>
          )}

          {/* MOBILE EXPANDABLE MENU DRAWER (When Hamburger is toggled) */}
          <AnimatePresence>
            {isMobileMenuOpen && activeTab === "workplan" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`xl:hidden overflow-hidden border-t mt-2.5 pt-3 pb-3 space-y-3.5 ${
                  theme === 'light' ? 'border-slate-200 bg-slate-50/95 rounded-2xl p-3.5' : 'border-white/[0.08] bg-[#141419] rounded-2xl p-3.5 shadow-2xl'
                }`}
              >
                {/* 1. Main Navigation Tabs & Print Menu */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    ម៉ឺនុយទិដ្ឋភាព &amp; របាយការណ៍ (Views &amp; Print Reports)
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {/* Week Calendar */}
                    <button
                      type="button"
                      onClick={() => { setWorkPlanTab("calendar"); setWorkPlanIsExportMode(false); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        workPlanTab === "calendar" && !workPlanIsExportMode
                          ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-500/30 shadow-md shadow-sky-500/20"
                          : theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#1a1a20] border-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-400" />
                        <span>ប្រតិទិនសប្តាហ៍ (Weekly Calendar)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-sky-500/20 text-sky-300">
                        {workPlanCounts.week} Posts
                      </span>
                    </button>

                    {/* Month Calendar */}
                    <button
                      type="button"
                      onClick={() => { setWorkPlanTab("month-calendar"); setWorkPlanIsExportMode(false); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        workPlanTab === "month-calendar" && !workPlanIsExportMode
                          ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-500/30 shadow-md shadow-cyan-500/20"
                          : theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#1a1a20] border-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>ប្រតិទិនខែ (Monthly Calendar)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300">
                        {workPlanCounts.month} Posts
                      </span>
                    </button>

                    {/* DataGrid */}
                    <button
                      type="button"
                      onClick={() => { setWorkPlanTab("datagrid"); setWorkPlanIsExportMode(false); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        workPlanTab === "datagrid" && !workPlanIsExportMode
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-500/30 shadow-md shadow-emerald-500/20"
                          : theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#1a1a20] border-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-emerald-400" />
                        <span>តារាងទិន្នន័យ (DataGrid View)</span>
                      </div>
                    </button>

                    {/* Pages & Platforms */}
                    <button
                      type="button"
                      onClick={() => { setWorkPlanTab("manager"); setWorkPlanIsExportMode(false); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        workPlanTab === "manager" && !workPlanIsExportMode
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-500/30 shadow-md shadow-violet-500/20"
                          : theme === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-[#1a1a20] border-white/[0.06] text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-violet-400" />
                        <span>Pages &amp; Platforms</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-violet-500/20 text-violet-300">
                        {workPlanCounts.pages} Pages
                      </span>
                    </button>

                    {/* PROMINENT PRINT / EXPORT REPORT MENU TAB */}
                    <button
                      type="button"
                      onClick={() => { setWorkPlanTab("report"); setWorkPlanIsExportMode(true); setIsMobileMenuOpen(false); }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        workPlanIsExportMode || workPlanTab === "report"
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-amber-400/40 shadow-lg shadow-orange-500/30 font-black"
                          : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">🖨️ របាយការណ៍បោះពុម្ព (Export Report / Print)</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/30 shrink-0">
                        Print PDF
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Active Month Selection */}
                {workPlanMonths.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      ជ្រើសរើសខែផែនការ (Select Active Month)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                      {workPlanMonths.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setWorkPlanSelectedMonthId(m.id);
                            if (workPlanOnSelectMonthId) workPlanOnSelectMonthId(m.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between border transition-all ${
                            m.id === workPlanSelectedMonthId
                              ? "bg-blue-600/20 border-blue-500/40 text-blue-400 font-bold"
                              : theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#1a1a20] border-white/[0.06] text-slate-300'
                          }`}
                        >
                          <span className="truncate">{m.nameKh}</span>
                          {m.id === workPlanSelectedMonthId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Mobile Menu Action Launchers */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      if (workPlanOnOpenCreateMonth) workPlanOnOpenCreateMonth();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>បង្កើតខែបន្ទាប់</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (workPlanOnOpenNewPost) workPlanOnOpenNewPost();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ បន្ថែមផុសថ្មី</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className={`flex-1 w-full mx-auto space-y-3 print:px-0 print:py-0 print:mx-0 print:my-0 print:max-w-none print:w-full print:-mt-[40px] ${
        activeTab === "settings"
          ? "max-w-full px-0 py-0"
          : "max-w-[1850px] px-4 md:px-8 xl:px-12 py-3"
      }`}>
        
        {/* Sync loading status indicator */}
        {isSyncing && (
           <div className={`print-hide fixed bottom-6 right-6 z-50 p-3 rounded-xl text-xs text-indigo-400 flex items-center gap-2 shadow-2xl print:hidden ${theme === 'light' ? 'bg-white border border-slate-200 shadow-slate-200/60' : 'bg-slate-900 border border-slate-800'}`}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="font-sans">កំពុងធ្វើសមកាលកម្មទិន្នន័យ (Syncing Work Plan)...</span>
          </div>
        )}

        {/* WORKSPACE CONTENT */}
        <div className="space-y-3">
          {activeTab === "profile" ? (
            <UserProfile 
              user={roles.find(r => r.id === selectedProfileId) || dbUser}
              onUpdateProfile={handleUpdateProfile}
              onBack={() => {
                setActiveTab("workplan");
                setSelectedProfileId(null);
              }}
              isLoading={isSyncing}
            />
          ) : activeTab === "settings" ? (
            <SystemManagement currentUser={dbUser} onBack={() => setActiveTab("workplan")} />
          ) : (
            <WorkPlan 
              onRefreshStats={fetchAllData} 
              currentUser={dbUser}
              externalSelectedTab={workPlanTab}
              onTabChange={setWorkPlanTab}
              externalIsExportMode={workPlanIsExportMode}
              onExportModeChange={setWorkPlanIsExportMode}
              onCountsUpdate={handleCountsUpdate}
              externalSelectedMonthId={workPlanSelectedMonthId}
              onMonthIdChange={setWorkPlanSelectedMonthId}
              onMonthsSync={handleMonthsSync}
            />
          )}
        </div>
      </main>

      {/* 4. FOOTER */}
      <div className="print-hide print:hidden">
        <Footer />
      </div>

      {/* Account Profile modal dialog */}
      <AnimatePresence>
        {activeModal === "profile" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl text-left ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#111115] border border-white/[0.08]'}`}
            >
              <h3 className="text-sm font-bold font-display text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>គណនីរបស់អ្នក (Account Profile)</span>
              </h3>
              
              {fbUser ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <img 
                      src={fbUser.avatar} 
                      alt={fbUser.name} 
                      className="w-12 h-12 rounded-xl object-cover border border-blue-500/20"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{fbUser.name}</h4>
                      <p className="text-[10px] text-slate-400">{fbUser.email}</p>
                      <span className="inline-block mt-1 text-[8px] font-bold font-mono px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded">
                        Facebook Linked
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 block">User Access Token scope status</span>
                    <p className="text-[10px] text-emerald-400 font-mono bg-[#0a0a0c] p-2 rounded-lg border border-emerald-500/10">
                      ✅ pages_manage_posts<br />
                      ✅ pages_read_engagement<br />
                      ✅ publish_video<br />
                      ✅ publish_to_groups
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      handleFacebookLogout();
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ចាកចេញពីគណនី (Sign Out)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <User className="w-5 h-5 text-slate-450" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    បងមិនទាន់បានភ្ជាប់គណនី Facebook ជាមួយ MetaStream នៅឡើយទេ។ សូមភ្ជាប់គណនី ដើម្បីធ្វើការគ្រប់គ្រង និងផុសវីដេអូ។
                  </p>
                  <button 
                    onClick={() => {
                      handleFacebookLogin();
                      setActiveModal(null);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ភ្ជាប់គណនី (Connect Facebook)
                  </button>
                </div>
              )}
              
              <div className="border-t border-white/[0.04] pt-3.5 mt-5 flex justify-end">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 bg-[#16161a] hover:bg-[#1f1f23] text-slate-400 hover:text-white text-xs font-semibold rounded-lg cursor-pointer border border-white/[0.04]"
                >
                  បិទវិញ (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About App modal dialog */}
      <AnimatePresence>
        {activeModal === "about" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111115] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl text-left"
            >
              <h3 className="text-sm font-bold font-display text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>អំពីប្រព័ន្ធ (About MetaStream)</span>
              </h3>
              
              <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/15 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-display">MetaStream Studio</h4>
                    <p className="text-[10px] text-slate-500">Version 2.1 (Stability Release)</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  MetaStream គឺជាកម្មវិធីគ្រប់គ្រង ផលិត និងកំណត់កាលវិភាគវីដេអូស្វ័យប្រវត្តទៅកាន់ Facebook Page ដោយរួមបញ្ចូលជាមួយប្រព័ន្ធឆ្លើយតបសារ និងការទាក់ទាញ Follower សិប្បនិម្មិត។
                </p>

                <div className="p-3 bg-[#0a0a0c] border border-white/[0.04] rounded-xl space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Platform Core:</span>
                    <span className="text-blue-400 font-mono font-bold">React 18 + Vite</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Styling Engine:</span>
                    <span className="text-slate-300 font-mono">Tailwind CSS 4</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Active Webhook:</span>
                    <span className="text-emerald-400 font-mono">Ready & Listening</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/[0.04] pt-3.5 mt-5 flex justify-end">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 bg-[#16161a] hover:bg-[#1f1f23] text-slate-400 hover:text-white text-xs font-semibold rounded-lg cursor-pointer border border-white/[0.04]"
                >
                  យល់ព្រម (OK)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
