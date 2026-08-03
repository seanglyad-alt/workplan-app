import { useState, useEffect, FormEvent } from "react";
import { 
  Calendar, Clock, Plus, Trash2, Edit2, Download, Printer, CheckCircle2,
  AlertTriangle, Eye, Layers, Video, Image, FileText, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  TrendingUp, User, Globe, HelpCircle, Save, MessageSquare, RefreshCw, X, ArrowLeftRight,
  PlusCircle, Table, ShieldCheck, MoreVertical, Star, Search, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MicButton } from "./MicButton";
import { WorkPlanItem, WorkPlanPage, WorkPlanPlatform, UserRole } from "../types";
import { fetchWithAuth } from "../lib/api.ts";
import SystemDashboard from "./SystemDashboard";

export interface WorkPlanProps {
  onRefreshStats?: () => void;
  currentUser?: UserRole | null;
  externalSelectedTab?: "dashboard" | "calendar" | "month-calendar" | "datagrid" | "manager" | "report";
  onTabChange?: (tab: "dashboard" | "calendar" | "month-calendar" | "datagrid" | "manager" | "report") => void;
  externalIsExportMode?: boolean;
  onExportModeChange?: (isExport: boolean) => void;
  onCountsUpdate?: (counts: { week: number; month: number; pages: number }) => void;
  externalSelectedMonthId?: string;
  onMonthIdChange?: (id: string) => void;
  onMonthsSync?: (data: { months: { id: string; name: string; nameKh: string; status: "COMPLETED" | "IN_PROGRESS" }[]; selectedMonthId: string; onSelectMonthId: (id: string) => void; onOpenNewPost: () => void; onOpenCreateMonth: () => void }) => void;
}

export default function WorkPlan({ 
  onRefreshStats, 
  currentUser,
  externalSelectedTab,
  onTabChange,
  externalIsExportMode,
  onExportModeChange,
  onCountsUpdate,
  externalSelectedMonthId,
  onMonthIdChange,
  onMonthsSync
}: WorkPlanProps) {
  // Main Data States
  const [items, setItems] = useState<WorkPlanItem[]>([]);
  const [pages, setPages] = useState<WorkPlanPage[]>([]);
  const [platforms, setPlatforms] = useState<WorkPlanPlatform[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Controlled / Internal Tab & Export Mode States
  const [internalSelectedTab, setInternalSelectedTab] = useState<"dashboard" | "calendar" | "month-calendar" | "datagrid" | "manager" | "report">("calendar");
  const selectedTab = externalSelectedTab !== undefined ? externalSelectedTab : internalSelectedTab;
  const setSelectedTab = (tab: "dashboard" | "calendar" | "month-calendar" | "datagrid" | "manager" | "report") => {
    setInternalSelectedTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [internalIsExportMode, setInternalIsExportMode] = useState<boolean>(false);
  const isExportMode = externalIsExportMode !== undefined ? externalIsExportMode : internalIsExportMode;
  const setIsExportMode = (isExport: boolean) => {
    setInternalIsExportMode(isExport);
    if (onExportModeChange) onExportModeChange(isExport);
  };

  // Month-specific Persistence & Table States
  const [months, setMonths] = useState<{ id: string; name: string; nameKh: string; status: "COMPLETED" | "IN_PROGRESS"; createdAt: string }[]>([]);
  const [internalSelectedMonthId, setInternalSelectedMonthId] = useState<string>(() => {
    const d = new Date();
    const yy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${yy}-${mm}`;
  });
  const selectedMonthId = externalSelectedMonthId !== undefined ? externalSelectedMonthId : internalSelectedMonthId;
  const setSelectedMonthId = (id: string) => {
    setInternalSelectedMonthId(id);
    if (onMonthIdChange) onMonthIdChange(id);
  };
  const [activeMasterView, setActiveMasterView] = useState<"calendar" | "registry">("calendar");
  const [showCreateMonthModal, setShowCreateMonthModal] = useState(false);
  const [newMonthId, setNewMonthId] = useState("2026-08");
  const [newMonthName, setNewMonthName] = useState("August 2026");
  const [newMonthNameKh, setNewMonthNameKh] = useState("សីហា ២០២៦");
  const [newMonthCopyFrom, setNewMonthCopyFrom] = useState("2026-07");

  // Selected state filter
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Form inputs
  const [formTitle, setFormTitle] = useState("");
  const [formSubType, setFormSubType] = useState("");
  const [formPostType, setFormPostType] = useState<"Posted" | "Scheduled" | "Draft" | "Idea">("Scheduled");
  const [formContentType, setFormContentType] = useState<"Poster" | "Video" | "Carousel">("Video");
  const [formPageId, setFormPageId] = useState("");
  const [formPlatformId, setFormPlatformId] = useState("");
  const [formDay, setFormDay] = useState<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">("Monday");
  const [formTimeSlot, setFormTimeSlot] = useState("09:00 AM");
  const [formStatus, setFormStatus] = useState<"PLANNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED">("PLANNED");
  const [formNotes, setFormNotes] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showPostFormModal, setShowPostFormModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState("");
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editingPlatformName, setEditingPlatformName] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Manager settings & dynamic print comments
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState("");
  const [managerComments, setManagerComments] = useState("");
  const [generationDate, setGenerationDate] = useState("31 May 2026");
  const [companyName, setCompanyName] = useState("YOUR COMPANY");
  const [companySlogan, setCompanySlogan] = useState("Your Company Slogan Here");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyInfoSavingStatus, setCompanyInfoSavingStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Show inline setup options
  const [showPageManager, setShowPageManager] = useState(false);
  const [showPlatformManager, setShowPlatformManager] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPlatformName, setNewPlatformName] = useState("");

  // Edit / Details active modal
  const [viewingDetailItem, setViewingDetailItem] = useState<WorkPlanItem | null>(null);
  const [exportOption, setExportOption] = useState<"week" | "month_weeks" | "month_calendar">("week");

  // DataGrid specific states
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters change to avoid out-of-bound paging empty states
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWeek, selectedMonthId, searchTerm]);

  // Sync employee and department with logged in user details
  useEffect(() => {
    if (currentUser) {
      setEmployee(currentUser.name || "System User");
      setDepartment(currentUser.department || "Operations");
    }
  }, [currentUser]);

  // Load company info from localStorage on mount
  useEffect(() => {
    const savedCompanyName = localStorage.getItem("companyName");
    const savedCompanySlogan = localStorage.getItem("companySlogan");
    const savedCompanyLogoUrl = localStorage.getItem("companyLogoUrl");
    
    if (savedCompanyName) setCompanyName(savedCompanyName);
    if (savedCompanySlogan) setCompanySlogan(savedCompanySlogan);
    if (savedCompanyLogoUrl) setCompanyLogoUrl(savedCompanyLogoUrl);
  }, []);

  // Auto-save company name to localStorage
  useEffect(() => {
    if (companyName && companyName !== "YOUR COMPANY") {
      localStorage.setItem("companyName", companyName);
    }
  }, [companyName]);

  // Auto-save company slogan to localStorage
  useEffect(() => {
    if (companySlogan && companySlogan !== "Your Company Slogan Here") {
      localStorage.setItem("companySlogan", companySlogan);
    }
  }, [companySlogan]);

  // Auto-save company logo URL to localStorage
  useEffect(() => {
    if (companyLogoUrl) {
      localStorage.setItem("companyLogoUrl", companyLogoUrl);
    }
  }, [companyLogoUrl]);

  // Load form defaults (especially formPageId, formPlatformId, formDay, formTimeSlot, formStatus) from localStorage on mount
  useEffect(() => {
    const savedFormPageId = localStorage.getItem("formPageId");
    const savedFormPlatformId = localStorage.getItem("formPlatformId");
    const savedFormPostType = localStorage.getItem("formPostType");
    const savedFormContentType = localStorage.getItem("formContentType");
    const savedFormDay = localStorage.getItem("formDay");
    const savedFormTimeSlot = localStorage.getItem("formTimeSlot");
    const savedFormStatus = localStorage.getItem("formStatus");
    
    if (savedFormPageId) setFormPageId(savedFormPageId);
    if (savedFormPlatformId) setFormPlatformId(savedFormPlatformId);
    if (savedFormPostType) setFormPostType(savedFormPostType as "Posted" | "Scheduled" | "Draft" | "Idea");
    if (savedFormContentType) setFormContentType(savedFormContentType as "Poster" | "Video" | "Carousel");
    if (savedFormDay) setFormDay(savedFormDay);
    if (savedFormTimeSlot) setFormTimeSlot(savedFormTimeSlot);
    if (savedFormStatus) setFormStatus(savedFormStatus as "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED");
  }, []);

  // Auto-save form defaults to localStorage
  useEffect(() => {
    if (formPageId) {
      localStorage.setItem("formPageId", formPageId);
    }
  }, [formPageId]);

  useEffect(() => {
    if (formPlatformId) {
      localStorage.setItem("formPlatformId", formPlatformId);
    }
  }, [formPlatformId]);

  useEffect(() => {
    localStorage.setItem("formPostType", formPostType);
  }, [formPostType]);

  useEffect(() => {
    localStorage.setItem("formContentType", formContentType);
  }, [formContentType]);

  // Auto-save Day to localStorage
  useEffect(() => {
    if (formDay) {
      localStorage.setItem("formDay", formDay);
    }
  }, [formDay]);

  // Auto-save Time Slot to localStorage
  useEffect(() => {
    if (formTimeSlot) {
      localStorage.setItem("formTimeSlot", formTimeSlot);
    }
  }, [formTimeSlot]);

  // Auto-save Status to localStorage
  useEffect(() => {
    if (formStatus) {
      localStorage.setItem("formStatus", formStatus);
    }
  }, [formStatus]);

  // Reset form fields when opening Add New Post modal for a NEW item (not editing)
  useEffect(() => {
    if (showPostFormModal && !editingItemId) {
      // For new item, don't clear - keep previously selected defaults from localStorage
      // Just make sure formTitle is empty
      if (formTitle) setFormTitle("");
    }
  }, [showPostFormModal, editingItemId]);

  // Time Slots defined by the spec & standard corporate layout image
  const timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM"
  ];

  const khmerNumber = (num: string | number) => {
    const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
    return String(num).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);
  };

  const getPlatformNames = (platformIdStr: string) => {
    if (!platformIdStr) return "N/A";
    const ids = platformIdStr.split(",");
    const names = ids.map(id => {
      const found = platforms.find(p => p.id === id);
      return found ? found.name : id;
    });
    return names.filter(Boolean).join(", ");
  };

  const getDaysInMonth = (monthId: string) => {
    const parts = monthId.split("-");
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1], 10) || 7;
    return new Date(year, month, 0).getDate();
  };

  const getWeeksForMonth = (monthId: string) => {
    const parts = monthId.split("-");
    const year = parseInt(parts[0], 10) || 2026;
    const monthNum = parseInt(parts[1], 10) || 7;

    const firstOfMonth = new Date(year, monthNum - 1, 1);
    const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
    const firstWeekStart = new Date(firstOfMonth);
    firstWeekStart.setDate(firstOfMonth.getDate() + (firstWeekday === 0 ? -6 : 1 - firstWeekday));

    const lastOfMonth = new Date(year, monthNum - 1, getDaysInMonth(monthId));
    const lastWeekday = lastOfMonth.getDay();
    const lastWeekEnd = new Date(lastOfMonth);
    lastWeekEnd.setDate(lastOfMonth.getDate() + (lastWeekday === 0 ? 0 : 7 - lastWeekday));

    const totalDays = Math.ceil((lastWeekEnd.getTime() - firstWeekStart.getTime() + 1) / (1000 * 60 * 60 * 24));
    const weekCount = Math.ceil(totalDays / 7);
    return Array.from({ length: weekCount }, (_, idx) => idx + 1);
  };

  const formatDate = (date: Date) => {
    const pad = (num: number) => num < 10 ? `0${num}` : `${num}`;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const formatDateKh = (date: Date) => {
    const monthsKhNames = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
    const pad = (num: number) => num < 10 ? `0${num}` : `${num}`;
    return `${khmerNumber(pad(date.getDate()))} ${monthsKhNames[date.getMonth()]} ${khmerNumber(date.getFullYear())}`;
  };

  const getWeekRangeLabel = (wk: number, monthId: string = selectedMonthId) => {
    const parts = monthId.split("-");
    const year = parseInt(parts[0], 10) || 2026;
    const monthNum = parseInt(parts[1], 10) || 7;
    const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const firstOfMonth = new Date(year, monthNum - 1, 1);
    const firstWeekday = firstOfMonth.getDay();
    const firstWeekStart = new Date(firstOfMonth);
    firstWeekStart.setDate(firstOfMonth.getDate() + (firstWeekday === 0 ? -6 : 1 - firstWeekday));

    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + (wk - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const dates: string[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      dates.push(formatDate(day));
    }

    const pad = (num: number) => num < 10 ? `0${num}` : `${num}`;
    const monthShort = (idx: number) => monthNamesEn[idx].slice(0, 3);
    const range = `${pad(weekStart.getDate())} ${monthNamesEn[weekStart.getMonth()]} ${weekStart.getFullYear()} - ${pad(weekEnd.getDate())} ${monthNamesEn[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
    const rangeShort = `${pad(weekStart.getDate())} ${monthShort(weekStart.getMonth())} - ${pad(weekEnd.getDate())} ${monthShort(weekEnd.getMonth())}`;
    const rangeKh = `${formatDateKh(weekStart)} - ${formatDateKh(weekEnd)}`;

    return { range, rangeShort, rangeKh, dates, startDay: weekStart.getDate(), endDay: weekEnd.getDate() };
  };

  const daysOfWeek = [
    { key: "Monday", kh: "ច័ន្ទ (Mon)" },
    { key: "Tuesday", kh: "អង្គារ (Tue)" },
    { key: "Wednesday", kh: "ពុធ (Wed)" },
    { key: "Thursday", kh: "ព្រហស្បតិ៍ (Thu)" },
    { key: "Friday", kh: "សុក្រ (Fri)" },
    { key: "Saturday", kh: "សៅរ៍ (Sat)" },
    { key: "Sunday", kh: "អាទិត្យ (Sun)" }
  ];

  // Helper to retrieve color by item status
  const getStatusColor = (status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED", isLight = false) => {
    switch (status) {
      case "COMPLETED":
        return isLight 
          ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", badgeBg: "bg-emerald-100", label: "COMPLETED" }
          : { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", badgeBg: "bg-emerald-950/40", label: "ស្ថាបនាជោគជ័យ" };
      case "IN_PROGRESS":
        return isLight 
          ? { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", badgeBg: "bg-amber-100", label: "IN PROGRESS" }
          : { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", badgeBg: "bg-amber-950/40", label: "កំពុងអនុវត្ត" };
      case "PLANNED":
        return isLight 
          ? { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", badgeBg: "bg-blue-100", label: "PLANNED" }
          : { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", badgeBg: "bg-blue-950/40", label: "រៀបចំទុក" };
      case "OVERDUE":
        return isLight 
          ? { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", badgeBg: "bg-rose-100", label: "OVERDUE" }
          : { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", badgeBg: "bg-rose-955/40", label: "ហួសកំណត់" };
      case "CANCELLED":
        return isLight 
          ? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-300", badgeBg: "bg-slate-200", label: "CANCELLED" }
          : { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", badgeBg: "bg-[#111115]", label: "លុបចោល" };
    }
  };

  // Helper for platform distinct colors
  const getPlatformStyle = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("facebook") || n.includes("fb")) {
      return { bg: "bg-blue-600/30", text: "text-blue-300", border: "border-blue-400/40", badge: "bg-blue-500/25 text-blue-200 border-blue-400/40" };
    } else if (n.includes("telegram") || n.includes("tg")) {
      return { bg: "bg-sky-500/30", text: "text-sky-300", border: "border-sky-400/40", badge: "bg-sky-500/25 text-sky-200 border-sky-400/40" };
    } else if (n.includes("youtube") || n.includes("yt")) {
      return { bg: "bg-red-600/30", text: "text-red-300", border: "border-red-400/40", badge: "bg-red-500/25 text-red-200 border-red-400/40" };
    } else if (n.includes("tiktok") || n.includes("tt")) {
      return { bg: "bg-pink-600/30", text: "text-pink-300", border: "border-pink-400/40", badge: "bg-pink-500/25 text-pink-200 border-pink-400/40" };
    } else if (n.includes("instagram") || n.includes("ig")) {
      return { bg: "bg-fuchsia-600/30", text: "text-fuchsia-300", border: "border-fuchsia-400/40", badge: "bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/40" };
    } else if (n.includes("web") || n.includes("site")) {
      return { bg: "bg-emerald-600/30", text: "text-emerald-300", border: "border-emerald-400/40", badge: "bg-emerald-500/25 text-emerald-200 border-emerald-400/40" };
    }
    return { bg: "bg-indigo-600/30", text: "text-indigo-300", border: "border-indigo-400/40", badge: "bg-indigo-500/25 text-indigo-200 border-indigo-400/40" };
  };

  // Helper for content type styles & icons
  const getContentTypeStyle = (contentType: string) => {
    const ct = (contentType || "").toLowerCase();
    if (ct === "video") {
      return { bg: "bg-purple-500/25", text: "text-purple-300", border: "border-purple-400/40", icon: "🎥", label: "VIDEO" };
    } else if (ct === "poster" || ct === "image") {
      return { bg: "bg-amber-500/25", text: "text-amber-300", border: "border-amber-400/40", icon: "🖼️", label: "POSTER" };
    } else if (ct === "carousel") {
      return { bg: "bg-cyan-500/25", text: "text-cyan-300", border: "border-cyan-400/40", icon: "📁", label: "CAROUSEL" };
    }
    return { bg: "bg-slate-500/25", text: "text-slate-300", border: "border-slate-400/40", icon: "📄", label: (contentType || "OTHER").toUpperCase() };
  };

  // Helper for post type styles
  const getPostTypeStyle = (postType: string) => {
    const pt = (postType || "").toLowerCase();
    if (pt === "posted" || pt === "completed") {
      return { bg: "bg-emerald-500/25", text: "text-emerald-300", border: "border-emerald-400/40" };
    } else if (pt === "scheduled") {
      return { bg: "bg-blue-500/25", text: "text-blue-300", border: "border-blue-400/40" };
    } else if (pt === "draft") {
      return { bg: "bg-amber-500/25", text: "text-amber-300", border: "border-amber-400/40" };
    } else if (pt === "idea") {
      return { bg: "bg-fuchsia-500/25", text: "text-fuchsia-300", border: "border-fuchsia-400/40" };
    }
    return { bg: "bg-slate-500/25", text: "text-slate-300", border: "border-slate-400/40" };
  };

  // Fetch Work Plan elements from API
  const fetchWorkPlanData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/workplan");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("សម័យប្រជុំ (Session) ត្រូវបានផ្លាស់ប្តូរ! សូមចាកចេញ (Log out) ហើយចូលប្រើប្រាស់ម្តងទៀត។");
        }
        throw new Error("មិនអាចទាញទិន្នន័យពីម៉ាស៊ីនបម្រើបានទេ!");
      }
      const data = await res.json();
      setItems(data.items || []);
      setPages(data.pages || []);
      setPlatforms(data.platforms || []);
      setMonths(data.months || []);
      
      // Set initial values for selectors
      if (data.pages && data.pages.length > 0) setFormPageId(data.pages[0].id);
      if (data.platforms && data.platforms.length > 0) setFormPlatformId(data.platforms[0].id);

      // Select active month: prioritize month with items on initial load only
      if (data.months && data.months.length > 0) {
        const monthWithMostItems = data.months.reduce((best: any, m: any) => {
          const count = (data.items || []).filter((i: any) => i.month === m.id || (!i.month && m.id === "2026-06")).length;
          return count > (best.count || 0) ? { id: m.id, count } : best;
        }, { id: "", count: 0 });

        const targetMonthId = monthWithMostItems.id && monthWithMostItems.count > 0 
          ? monthWithMostItems.id 
          : (data.months.find((m: any) => m.status === "IN_PROGRESS")?.id || data.months[0].id);

        setSelectedMonthId(targetMonthId);

        const targetMonthItems = (data.items || []).filter((i: any) => i.month === targetMonthId || (!i.month && targetMonthId === "2026-06"));
        const firstWeekWithItems = targetMonthItems.find((i: any) => i.weekNumber !== undefined)?.weekNumber;
        if (firstWeekWithItems && firstWeekWithItems >= 1 && firstWeekWithItems <= 5) {
          setSelectedWeek(firstWeekWithItems);
        }
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Monthly operations
  const handleToggleMonthStatus = async (monthId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      const res = await fetchWithAuth(`/api/workplan/months/${monthId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("កែប្រែស្ថានភាពខែមិនបានសម្រេចឡើយ!");
      setMonths(prev => prev.map(m => m.id === monthId ? { ...m, status: nextStatus } : m));
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const handleCreateMonthPlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMonthId.trim() || !newMonthName.trim() || !newMonthNameKh.trim()) {
      setAlertMsg("សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!");
      return;
    }
    try {
      const res = await fetchWithAuth("/api/workplan/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newMonthId,
          name: newMonthName,
          nameKh: newMonthNameKh,
          status: "IN_PROGRESS",
          copyFrom: newMonthCopyFrom || undefined
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "មិនអាចបង្កើតផែនការខែថ្មីបានទេ!");
      }
      setShowCreateMonthModal(false);
      setSelectedMonthId(newMonthId);
      setActiveMasterView("calendar");
      setAlertMsg(`បានបង្កើតផែនការខែថ្មី "${newMonthNameKh}" ដោយជោគជ័យ!`);
      fetchWorkPlanData();
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const handleDeleteMonthPlan = async (monthId: string, monthNameKh: string) => {
    setConfirmDialog({
      message: `តើបងពិតជាចង់លុបផែនការការងារប្រចាំខែ "${monthNameKh}" ព្រមទាំងរាល់កិច្ចការទាំងអស់របស់ខែនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ថយក្រោយវិញបានឡើយ!`,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/workplan/months/${monthId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("មិនអាចលុបបានឡើយ!");
          
          const remainingBytes = months.filter(m => m.id !== monthId);
          setMonths(remainingBytes);
          setItems(prev => prev.filter(i => i.month !== monthId));
          if (selectedMonthId === monthId) {
            if (remainingBytes.length > 0) {
              setSelectedMonthId(remainingBytes[0].id);
            } else {
              setSelectedMonthId("");
            }
          }
          setAlertMsg("បានលុបខែ និងកិច្ចការដែលពាក់ព័ន្ធទាំងអស់ដោយជោគជ័យ!");
        } catch (err: any) {
          setAlertMsg(err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleExportMonthToCSV = (monthId: string, monthName: string) => {
    const monthTasks = items.filter(i => i.month === monthId);
    if (monthTasks.length === 0) {
      setAlertMsg("មិនមានកិច្ចការសកម្មសម្រាប់នាំចេញទេ!");
      return;
    }
    
    const headers = ["ID", "Title", "Subtitle/Page", "Post Type", "Content Type", "Week Number", "Day", "Time Slot", "Status", "Notes"];
    
    const csvRows = [
      headers.join(","),
      ...monthTasks.map(i => [
        i.id,
        `"${(i.title || "").replace(/"/g, '""')}"`,
        `"${(i.subtitle || "").replace(/"/g, '""')}"`,
        i.postType,
        i.contentType,
        i.weekNumber,
        i.dayOfWeek,
        i.timeSlot,
        i.status,
        `"${(i.notes || "").replace(/"/g, '""')}"`
      ].join(","))
    ];
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WorkPlan_${monthName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    fetchWorkPlanData();
  }, []);

  useEffect(() => {
    const list = getWeeksForMonth(selectedMonthId);
    const monthItems = items.filter(i => i.month === selectedMonthId || (!i.month && selectedMonthId === "2026-06"));
    const weeksWithItems = monthItems.map(i => i.weekNumber).filter(w => w !== undefined && w >= 1 && w <= 5);

    if (weeksWithItems.length > 0 && !weeksWithItems.includes(selectedWeek)) {
      setSelectedWeek(weeksWithItems[0]);
    } else if (!list.includes(selectedWeek)) {
      setSelectedWeek(list[0] || 1);
    }
  }, [selectedMonthId, items]);

  // Post Item Management API Actions
  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setAlertMsg("សូមបញ្ចូលចំណងជើងផែនការផុស!");
      return;
    }

    const payload = {
      title: formTitle,
      subtitle: formSubType || pages.find(p => p.id === formPageId)?.name || "ផ្សេងៗ",
      postType: formPostType,
      contentType: formContentType,
      pageId: formPageId,
      platformId: formPlatformId,
      weekNumber: selectedWeek,
      dayOfWeek: formDay,
      timeSlot: formTimeSlot,
      status: formStatus,
      notes: formNotes,
      month: selectedMonthId
    };

    try {
      if (editingItemId) {
        // PUT Edit Item
        const res = await fetchWithAuth(`/api/workplan/items/${editingItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("កែប្រែព័ត៌មានមិនជោគជ័យឡើយ!");
        const data = await res.json();
        setItems(prev => prev.map(item => item.id === editingItemId ? data.item : item));
        setEditingItemId(null);
      } else {
        // POST New Item
        const res = await fetchWithAuth("/api/workplan/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || "បង្កើតព័ត៌មានមិនជោគជ័យឡើយ!");
        }
        const newItem = await res.json();
        setItems(prev => [...prev, newItem]);
      }

      // Reset Form fields
      setFormTitle("");
      setFormSubType("");
      setFormNotes("");
      setShowPostFormModal(false);
      if (onRefreshStats) onRefreshStats();
      setAlertMsg("រក្សាទុកជោគជ័យ!");
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const handleEditItemInitiate = (item: WorkPlanItem) => {
    setEditingItemId(item.id);
    setFormTitle(item.title);
    setFormSubType(item.subtitle || "");
    setFormPostType(item.postType);
    setFormContentType(item.contentType);
    setFormPageId(item.pageId);
    setFormPlatformId(item.platformId);
    setFormDay(item.dayOfWeek);
    setFormTimeSlot(item.timeSlot);
    setFormStatus(item.status);
    setFormNotes(item.notes || "");
    setShowPostFormModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    setConfirmDialog({
      message: "តើបងពិតជាចង់លុបផែនការការងារនេះមែនទេ?",
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/workplan/items/${itemId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("មិនអាចលុបបានឡើយ!");
          setItems(prev => prev.filter(i => i.id !== itemId));
          setSelectedItem(null);
          if (onRefreshStats) onRefreshStats();
        } catch (err: any) {
          setAlertMsg(err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  // Page CRUD Actions
  const handleAddPage = async () => {
    if (!newPageName.trim()) return;
    try {
      const res = await fetchWithAuth("/api/workplan/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPageName })
      });
      if (!res.ok) throw new Error("មិនអាចបន្ថែមបាន!");
      const newPg = await res.json();
      setPages(prev => [...prev, newPg]);
      setFormPageId(newPg.id);
      setNewPageName("");
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const handleDeletePage = async (id: string) => {
    const page = pages.find(p => p.id === id);
    const pageName = page?.name || "មិនស្គាល់";
    
    // Check if page is protected (demo page)
    if (page?.isProtected) {
      setAlertMsg("⛔ មិនអាចលុបបាន! " + pageName + " ជាទំព័របង្ហាញ (Demo Page)");
      return;
    }
    
    setConfirmDialog({
      message: `តើបងពិតជាចង់លុប "${pageName}" មែនទេ?`,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/workplan/pages/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("មិនអាចលុបបាន!");
          setPages(prev => prev.filter(p => p.id !== id));
          if (formPageId === id && pages.length > 1) {
            setFormPageId(pages.find(p => p.id !== id)?.id || "");
          }
          setAlertMsg(`លុប "${pageName}" ជោគជ័យ!`);
        } catch (err: any) {
          setAlertMsg(err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveEditPage = async (id: string) => {
    if (!editingPageName || editingPageName.trim() === "") return;
    
    const page = pages.find(p => p.id === id);
    // Check if page is protected (demo page)
    if (page?.isProtected) {
      setAlertMsg("⛔ មិនអាចកែប្រែបាន! " + page.name + " ជាទំព័របង្ហាញ (Demo Page)");
      setEditingPageId(null);
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/workplan/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingPageName })
      });
      if (!res.ok) throw new Error("មិនអាចកែប្រែបាន!");
      const updated = await res.json();
      setPages(prev => prev.map(p => p.id === id ? updated.page : p));
      setEditingPageId(null);
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  // Platform CRUD Actions
  const handleAddPlatform = async () => {
    if (!newPlatformName.trim()) return;
    try {
      const res = await fetchWithAuth("/api/workplan/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlatformName })
      });
      if (!res.ok) throw new Error("មិនអាចបន្ថែមបាន!");
      const newPl = await res.json();
      setPlatforms(prev => [...prev, newPl]);
      setFormPlatformId(newPl.id);
      setNewPlatformName("");
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    const platformName = platform?.name || "មិនស្គាល់";
    
    // Check if platform is protected (demo platform)
    if (platform?.isProtected) {
      setAlertMsg("⛔ មិនអាចលុបបាន! " + platformName + " ជាលេចបង្ហាញ (Demo Platform)");
      return;
    }
    
    setConfirmDialog({
      message: `តើបងពិតជាចង់លុប "${platformName}" មែនទេ?`,
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`/api/workplan/platforms/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("មិនអាចលុបបាន!");
          setPlatforms(prev => prev.filter(p => p.id !== id));
          if (formPlatformId === id && platforms.length > 1) {
            setFormPlatformId(platforms.find(p => p.id !== id)?.id || "");
          }
          setAlertMsg(`លុប "${platformName}" ជោគជ័យ!`);
        } catch (err: any) {
          setAlertMsg(err.message);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveEditPlatform = async (id: string) => {
    if (!editingPlatformName || editingPlatformName.trim() === "") return;
    
    const platform = platforms.find(p => p.id === id);
    // Check if platform is protected (demo platform)
    if (platform?.isProtected) {
      setAlertMsg("⛔ មិនអាចកែប្រែបាន! " + platform.name + " ជាលេចបង្ហាញ (Demo Platform)");
      setEditingPlatformId(null);
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/workplan/platforms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingPlatformName })
      });
      if (!res.ok) throw new Error("មិនអាចកែប្រែបាន!");
      const updated = await res.json();
      setPlatforms(prev => prev.map(p => p.id === id ? updated.platform : p));
      setEditingPlatformId(null);
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  // Interactive quick calendar slot setter
  const handleDropItem = async (itemId: string, newDay: string, newTime: string) => {
    const itemToUpdate = items.find(i => i.id === itemId);
    if (!itemToUpdate) return;
    if (itemToUpdate.dayOfWeek === newDay && itemToUpdate.timeSlot === newTime) return;

    // Optimistic UI update
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, dayOfWeek: newDay, timeSlot: newTime }
        : item
    ));

    try {
      const payload = { ...itemToUpdate, dayOfWeek: newDay, timeSlot: newTime };
      const res = await fetchWithAuth(`/api/workplan/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("មិនអាចរំកិលបានទេ!");
    } catch (err: any) {
      setAlertMsg(err.message);
      // Revert upon failure
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, dayOfWeek: itemToUpdate.dayOfWeek, timeSlot: itemToUpdate.timeSlot }
          : item
      ));
    }
  };

  const handleQuickSlotClick = (dayKey: any, time: string) => {
    setEditingItemId(null);
    setFormTitle("");
    setFormSubType("");
    setFormNotes("");
    setFormDay(dayKey);
    setFormTimeSlot(time);
    setFormStatus("PLANNED");
    setShowPostFormModal(true);
  };

  // Statistics Computations based on selected month and week
  const monthItems = items.filter(i => i.month === selectedMonthId || (!i.month && selectedMonthId === "2026-06"));
  const weekItems = monthItems.filter(i => i.weekNumber === selectedWeek);
  const selectedWeekRange = getWeekRangeLabel(selectedWeek);

  // Modal action handlers for Topbar sync
  const handleOpenNewPostModal = () => {
    setEditingItemId(null);
    setFormTitle("");
    setFormSubType("");
    setFormNotes("");
    setFormDay("Monday");
    setFormStatus("PLANNED");
    setShowPostFormModal(true);
  };

  const handleOpenCreateMonthModal = () => {
    if (months.length > 0) {
      const sorted = [...months].sort((a,b) => a.id.localeCompare(b.id));
      const lastId = sorted[sorted.length - 1].id;
      const parts = lastId.split("-");
      const yy = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      let nmm = mm + 1;
      let nyy = yy;
      if (nmm > 12) { nmm = 1; nyy += 1; }
      const nmmStr = nmm < 10 ? `0${nmm}` : `${nmm}`;
      const customMonthId = `${nyy}-${nmmStr}`;
      setNewMonthId(customMonthId);

      const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthNamesKh = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
      setNewMonthName(`${monthNamesEn[nmm-1]} ${nyy}`);
      setNewMonthNameKh(`${monthNamesKh[nmm-1]} ${nyy}`);
      setNewMonthCopyFrom(lastId);
    }
    setShowCreateMonthModal(true);
  };

  // Sync item and page counts up to Topbar in App.tsx
  useEffect(() => {
    if (onCountsUpdate) {
      onCountsUpdate({
        week: weekItems.length,
        month: monthItems.length,
        pages: pages.length
      });
    }
  }, [weekItems.length, monthItems.length, pages.length]);

  // Sync months data & action modal triggers up to App.tsx Topbar
  useEffect(() => {
    if (onMonthsSync) {
      onMonthsSync({
        months,
        selectedMonthId,
        onSelectMonthId: setSelectedMonthId,
        onOpenNewPost: handleOpenNewPostModal,
        onOpenCreateMonth: handleOpenCreateMonthModal
      });
    }
  }, [months, selectedMonthId]);
  
  const totalTasks = weekItems.length;
  const completedTasks = weekItems.filter(i => i.status === "COMPLETED").length;
  const pendingTasks = weekItems.filter(i => i.status === "PLANNED" || i.status === "IN_PROGRESS").length;
  const overdueTasks = weekItems.filter(i => i.status === "OVERDUE").length;
  const totalMeetings = weekItems.filter(i => i.title.toLowerCase().includes("meet") || i.title.toLowerCase().includes("brief")).length + 4; // bias default
  const customerVisits = weekItems.filter(i => i.subtitle && i.subtitle !== "Internal").length;
  
  // mock completion rate calculation
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0.0";
  const mockWorkingHours = (completedTasks * 1.5 + pendingTasks * 1.0).toFixed(1) + "h";

  // Handle save company info to database
  const handleSaveCompanyInfo = async () => {
    setCompanyInfoSavingStatus("saving");
    try {
      const response = await fetchWithAuth("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companySlogan,
          reportLogo: companyLogoUrl,
        }),
      });
      
      if (response.ok) {
        setCompanyInfoSavingStatus("saved");
        setTimeout(() => setCompanyInfoSavingStatus("idle"), 3000);
      } else {
        alert("មានបញ្ហាក្នុងការរក្សាព័ត៌មាន!");
        setCompanyInfoSavingStatus("idle");
      }
    } catch (err) {
      console.error(err);
      alert("មានបញ្ហាក្នុងការរក្សាព័ត៌មាន!");
      setCompanyInfoSavingStatus("idle");
    }
  };

  // Generate dynamic filename based on export option and month
  const generateExportFilename = () => {
    // selectedMonthId format: YYYY-MM
    const [year, month] = selectedMonthId.split("-");
    const monthNames: { [key: string]: string } = {
      "01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
      "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December"
    };
    const monthName = monthNames[month] || month;

    let optionName = "Report";
    let filename = "";

    switch (exportOption) {
      case "week":
        // Example: WorkPlan_Report_WeekOnly_Week1_2026-06.pdf
        optionName = `WeekOnly`;
        filename = `WorkPlan_Report_${optionName}_Week${selectedWeek}_${year}-${month}.pdf`;
        break;
      case "month_weeks":
        // Example: WorkPlan_Report_FullWeeks_June_2026-06.pdf
        optionName = `FullWeeks`;
        filename = `WorkPlan_Report_${optionName}_${monthName}_${year}-${month}.pdf`;
        break;
      case "month_calendar":
        // Example: WorkPlan_Report_MonthCalendar_July_2026-07.pdf
        optionName = `MonthCalendar`;
        filename = `WorkPlan_Report_${optionName}_${monthName}_${year}-${month}.pdf`;
        break;
      default:
        filename = `WorkPlan_Report_${year}-${month}.pdf`;
    }

    return filename;
  };

  // Print/Export dynamic action page formatting trigger with dynamic filename
  const triggerPrintWindow = () => {
    const originalTitle = document.title;
    const exportFilename = generateExportFilename();
    document.title = exportFilename;
    
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  return (
    <div className="space-y-3">
      


      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-[#111115] border border-white/[0.06] rounded-2xl text-slate-400">
          <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
          <span className="text-xs font-sans">កំពុងទាញយកទិន្នន័យផែនការ...</span>
        </div>
      )}

      {selectedTab === "dashboard" && (
        <SystemDashboard 
          currentUser={currentUser} 
          onNavigateTab={(t) => setSelectedTab(t as any)} 
          onOpenNewPost={handleOpenNewPostModal} 
        />
      )}

      {error && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/15 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={fetchWorkPlanData} className="underline font-bold ml-2">Reload</button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {isExportMode ? (
            <div className="space-y-6 text-left">
              
              {/* Custom style to handle printing adjustments and page-breaks */}
              <style>{`
                @media print {
                  /* Set document size and landscape margin */
                  @page {
                    size: A4 landscape;
                    margin: 0;
                  }
                  
                  /* Clean white base with support for custom Khmer fonts */
                  html, body {
                    background-color: #ffffff !important;
                    color: #111827 !important;
                    font-family: "Inter", "Kantumruy Pro", -apple-system, sans-serif !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    ${exportOption !== "month_weeks" ? `
                      height: 100% !important;
                      overflow: hidden !important;
                    ` : ""}
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }

                  /* Collapse parent containers during printing to prevent overflow */
                  #root, main, main > div, .space-y-12, .space-y-6, .text-left {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    min-height: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                  }

                  /* Hide preview control bars and dashboard components */
                  .no-print, .no-print * {
                    display: none !important;
                    height: 0 !important;
                    width: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }

                  /* Expose elements only visible in PDF */
                  .only-print {
                    display: block !important;
                  }
                  
                  .only-print-inline {
                    display: inline-block !important;
                  }

                  #printable-area-plan {
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    background: #ffffff !important;
                    color: #111827 !important;
                  }

                  #printable-area-plan .print-wrapper-card,
                  #printable-area-plan .print-month-calendar {
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 !important;
                    height: 98vh !important; /* Slightly less than 100vh to prevent browser rounding errors causing blank pages */
                    max-height: 98vh !important;
                    box-sizing: border-box !important;
                    padding: 4mm 6mm 12mm 6mm !important;
                    min-height: 0 !important;
                    overflow: hidden !important;
                    page-break-inside: avoid !important;
                    margin: 0 !important;
                  }

                  /* Explicit page breaks for wrapping blocks with strict A4 single page height */
                  .print-week-wrapper {
                    page-break-after: always !important;
                    break-after: page !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    max-height: 185mm !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding-bottom: 4px !important;
                  }
                  .print-week-wrapper:last-child {
                    page-break-after: auto !important;
                    break-after: auto !important;
                  }

                  .print-wrapper-card,
                  .print-month-weeks {
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    height: 100% !important;
                  }

                  .print-bottom-row {
                    margin-top: 6px !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-before: avoid !important;
                    break-before: avoid !important;
                  }

                  .print-footer-legend {
                    padding-top: 4px !important;
                    margin-top: 4px !important;
                    padding-bottom: 4px !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-before: avoid !important;
                    break-before: avoid !important;
                  }

                  /* Crisp page breaks for multi-page workplans */
                  .page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                    display: block !important;
                    clear: both !important;
                    height: 0 !important;
                  }

                  /* Absolute tabular structural alignment */
                  table {
                    page-break-inside: avoid !important;
                    width: 100% !important;
                    height: 100% !important;
                    flex: 1 !important;
                    border-collapse: collapse !important;
                  }

                  tr {
                    page-break-inside: avoid !important;
                    page-break-after: auto !important;
                  }

                  td, th {
                    word-break: break-word !important;
                  }

                  /* Force background graphics details (color cells, labels, statuses) */
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }

                  /* Custom Print Optimization Overrides */
                  
                  /* Header styling */
                  #printable-area-plan h2 {
                    font-size: 13.5px !important;
                    line-height: 1.15 !important;
                  }
                  #printable-area-plan h1 {
                    font-size: 17px !important;
                    line-height: 1.15 !important;
                  }
                  #printable-area-plan p {
                    font-size: 8px !important;
                  }
                  
                  /* Metadata row container override */
                  #printable-area-plan .print-metadata-row {
                    padding: 3px 8px !important;
                    gap: 6px !important;
                    margin-bottom: 4px !important;
                  }
                  #printable-area-plan .print-metadata-row span {
                    font-size: 7.5px !important;
                    margin-bottom: 1px !important;
                  }
                  #printable-area-plan .print-metadata-row div {
                    font-size: 8.5px !important;
                  }

                  /* Table cells sizing and content overrides */
                  #printable-area-plan th {
                    padding: 3px 5px !important;
                    font-size: 8.5px !important;
                  }
                  .print-week-only td.print-time-cell {
                    min-height: 28px !important;
                    padding: 1.5px 2.5px !important;
                  }
                  .print-month-weeks td.print-time-cell {
                    min-height: 28px !important;
                    padding: 1.5px 2.5px !important;
                  }
                  .print-month-calendar.weeks-5 td {
                    min-height: 26px !important;
                    padding: 1.5px !important;
                  }
                  .print-month-calendar.weeks-6 td {
                    min-height: 24px !important;
                    padding: 1.5px !important;
                  }
                  
                  /* Ensure overflowing cell content doesn't break table height */
                  #printable-area-plan td {
                    overflow: hidden !important;
                  }
                  .print-month-calendar th {
                    padding: 3px 5px !important;
                    font-size: 8.5px !important;
                  }
                  #printable-area-plan td.font-mono {
                    padding: 2.5px !important;
                    font-size: 8.5px !important;
                  }
                  
                  /* No Schedule / Lunch Break cells */
                  #printable-area-plan .print-no-schedule {
                    padding: 1px !important;
                    margin: 0 !important;
                  }
                  #printable-area-plan .print-no-schedule span {
                    font-size: 7.5px !important;
                  }
                  #printable-area-plan .print-no-schedule svg {
                    width: 8.5px !important;
                    height: 8.5px !important;
                    margin-top: 1px !important;
                  }
                  #printable-area-plan .print-lunch-break {
                    padding-top: 2px !important;
                    padding-bottom: 2px !important;
                    font-size: 8px !important;
                  }
                  
                  /* Item card container inside td */
                  #printable-area-plan td .print-item-card {
                    padding: 1.5px 2.5px !important;
                    border-radius: 3px !important;
                    margin-bottom: 1.5px !important;
                  }
                  #printable-area-plan td .print-item-card .font-bold.text-\\[11px\\] {
                    font-size: 8px !important;
                    line-height: 1.1 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                  }
                  #printable-area-plan td .print-item-card .text-\\[9\\.5px\\] {
                    display: none !important;
                  }
                  #printable-area-plan td .print-item-card .text-\\[8px\\] {
                    font-size: 6px !important;
                    padding-top: 0.5px !important;
                  }
                  
                  /* Widget boxes in bottom layout */
                  #printable-area-plan .print-performance-box {
                    padding: 4px 8px !important;
                    border-radius: 6px !important;
                  }
                  #printable-area-plan .print-performance-box span {
                    font-size: 7.5px !important;
                  }
                  #printable-area-plan .print-performance-box .text-xl {
                    font-size: 13px !important;
                  }
                  #printable-area-plan .print-performance-summary {
                    padding: 4px 8px !important;
                    border-radius: 6px !important;
                  }
                  
                  /* Manager comments and signature card overrides */
                  #printable-area-plan .print-comments-box {
                    min-height: 48px !important;
                    font-size: 8.5px !important;
                    padding: 4px 6px !important;
                  }
                  #printable-area-plan .print-signature-box {
                    height: 70px !important;
                    padding: 4px 6px !important;
                  }
                  #printable-area-plan .print-signature-box span {
                    font-size: 7.5px !important;
                  }
                  #printable-area-plan .print-signature-box .print-sig-line {
                    height: 11px !important;
                  }
                  #printable-area-plan .print-signature-box div[class*="h-8"] {
                    height: 11px !important;
                    font-size: 9px !important;
                  }
                  #printable-area-plan .print-signature-box div[class*="h-6"] {
                    height: 9px !important;
                    font-size: 7.5px !important;
                  }
                  
                  /* Footer legend */
                  #printable-area-plan .print-footer-legend {
                    padding-top: 4px !important;
                    margin-top: 4px !important;
                    font-size: 8px !important;
                    position: relative !important;
                    background: transparent !important;
                    padding-bottom: 2px !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-before: avoid !important;
                    break-before: avoid !important;
                  }
                }
                
                .emoji-font {
                  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif;
                }
              `}</style>
            
              {/* Alert Notification regarding print-optimized view */}
              <div className="print-hide no-print p-5 bg-[#111115] border border-white/[0.06] rounded-2xl space-y-4 text-xs text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <strong className="block text-white text-sm">របៀបមើលរបាយការណ៍បោះពុម្ព (Print Optimization Ready)</strong>
                      <span className="text-slate-400">ព័ត៌មានខាងក្រោមប្តូរស្តាយទៅជាផ្ទៃស ងាយស្រួលព្រីនចេញជាក្រដាស A4 Landscape។</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerPrintWindow}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow shadow-blue-600/25"
                    >
                      <Printer className="w-4 h-4" />
                      <span>ព្រីនចេញជា PDF / ក្រដាស (Print)</span>
                    </button>
                    <button
                      onClick={() => setIsExportMode(false)}
                      className="px-3 py-2 bg-white/[0.05] hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-white/[0.06] rounded-xl transition-all"
                    >
                      ចាកចេញ (Exit)
                    </button>
                  </div>
                </div>

                {/* Company Setup Panel */}
                <div className="border-t border-white/[0.04] pt-4">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-2.5">កំណត់ព័ត៌មានក្រុមហ៊ុន (Company Info Setup):</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">ឈ្មោះក្រុមហ៊ុន (Company Name)</label>
                      <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        placeholder="YOUR COMPANY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">ពាក្យស្លោក (Company Slogan)</label>
                      <input 
                        type="text" 
                        value={companySlogan}
                        onChange={(e) => setCompanySlogan(e.target.value)}
                        className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        placeholder="Your Company Slogan Here"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                        <span>រូបសញ្ញា (Logo URL ឬ Upload)</span>
                        {companyLogoUrl && (
                          <button onClick={() => setCompanyLogoUrl("")} className="text-red-400 hover:text-red-300 text-[9px]">
                            លុប (Clear)
                          </button>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={companyLogoUrl}
                          onChange={(e) => setCompanyLogoUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans text-[11px]"
                          placeholder="https://example.com/logo.png"
                        />
                        <label className="flex-shrink-0 px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer text-xs flex items-center justify-center font-bold">
                          Upload
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  if (typeof e.target?.result === 'string') {
                                    setCompanyLogoUrl(e.target.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleSaveCompanyInfo}
                    className={`w-full mt-3 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      companyInfoSavingStatus === "saved" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : companyInfoSavingStatus === "saving"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-blue-500 hover:bg-blue-600 active:scale-95 text-white border border-blue-600"
                    }`}
                  >
                    {companyInfoSavingStatus === "saving" ? "កំពុងរក្សាទុក..." : companyInfoSavingStatus === "saved" ? "✓ រក្សាទុកបានល្អ" : "💾 រក្សាទុកព័ត៌មាន (Save Info)"}
                  </button>
                </div>
 
                {/* 3 Choice Option Selection Panel */}
                <div className="border-t border-white/[0.04] pt-4">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block mb-2.5">ជម្រើសនៃការបោះពុម្ព (Choose Export Layout Standard):</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        key: "week",
                        title: "1. នាំចេញតែសប្តាហ៍បច្ចុប្បន្ន",
                        subtitle: "Export Selected Week Only",
                        desc: `បោះពុម្ពសន្លឹកផែនការសប្តាហ៍ ${selectedWeekRange.rangeShort} (១ ទំព័រ A4 Landscape)`
                      },
                      {
                        key: "month_weeks",
                        title: "2. នាំចេញគ្រប់សប្តាហ៍ក្នុងខែរួមគ្នា",
                        subtitle: "Export Full Weeks Combined",
                        desc: "បោះពុម្ពគ្រប់ " + getWeeksForMonth(selectedMonthId).length + " សប្តាហ៍ក្នុងខែនេះ (១ សប្តាហ៍ក្នុង ១ ទំព័រ A4 ក្នុងហ្វាល់តែមួយ)"
                      },
                      {
                        key: "month_calendar",
                        title: "3. នាំចេញប្រតិទិនប្រចាំខែទម្រង់ពេញ",
                        subtitle: "Full 1-Month Layout Calendar",
                        desc: "ការតុបតែងប្រតិទិនប្រចាំខែពេញលេញ (១ ទំព័រ A4 Landscape ស្អាតប្លែក)"
                      }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setExportOption(opt.key as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          exportOption === opt.key
                            ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-sm shadow-indigo-500/5"
                            : "bg-[#16161a] border-white/[0.04] text-slate-400 hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="radio"
                            checked={exportOption === opt.key}
                            onChange={() => {}}
                            className="text-blue-500 bg-black border-slate-600 focus:ring-blue-500 focus:ring-offset-black"
                          />
                          <strong className="text-white text-xs">{opt.title}</strong>
                        </div>
                        <span className="text-[10px] text-blue-400 block font-medium font-sans">{opt.subtitle}</span>
                        <p className="text-[10.5px] text-slate-400 mt-1 leading-normal font-sans">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
 
              {/* REPORT CARD WRAPPER - This part is white styled to resemble the provided image perfectly! */}
              <div id="printable-area-plan" className="font-sans text-slate-900">
                
                {/* OPTION 1: SELECTED WEEK ONLY */}
                {exportOption === "week" && (
                  <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-2xl font-sans print-wrapper-card print-week-only flex flex-col justify-between space-y-6 print:space-y-2 print:border-none print:shadow-none print:p-0 print:m-0 print:pb-4">
                    
                    {/* Header Panel */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b-2 border-slate-200 print:flex-row print:justify-between print:items-center print:pb-3">
                      <div className="flex items-center gap-3">
                        {companyLogoUrl ? (
                          <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl bg-slate-100/50">
                            <img src={companyLogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-blue-400" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">{companyName || "YOUR COMPANY"}</h2>
                          {companySlogan && <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">{companySlogan}</p>}
                        </div>
                      </div>
                      
                      <div className="text-center lg:text-right print:text-right">
                        <h1 className="text-3xl font-black text-blue-955 tracking-tight font-display mb-1 uppercase">
                          Weekly Work Plan Report <span className="text-blue-600 text-2xl font-black">({selectedWeekRange.rangeShort})</span>
                        </h1>
                        <div className="inline-block px-3 py-1 bg-blue-100 border border-blue-200 rounded font-bold text-slate-800 text-xs font-mono print:px-2 print:py-0.5 print:text-[10px]">
                          Week: {getWeekRangeLabel(selectedWeek).range}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Summary Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs print:grid-cols-4 print:gap-2 print:p-2.5 print:rounded-lg print-metadata-row">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Department:</span>
                        <div className="font-bold text-slate-900">{department}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Employee:</span>
                        <div className="font-bold text-slate-900">{employee}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Generated Date:</span>
                        <div className="font-bold text-slate-900">{generationDate}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Generated By:</span>
                        <div className="font-bold text-slate-900">System Administrator</div>
                      </div>
                    </div>

                    {/* THE MAIN CALENDAR GRID */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto print:border-none print:rounded-none">
                      <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                        
                        {/* Header Columns */}
                        <thead>
                          <tr className="bg-[#0b2545] text-white text-[11px] font-bold uppercase border-b-2 border-slate-200">
                            <th className="p-3 border border-slate-200/20 text-center w-[120px] print:p-1.5 print:text-[9.5px]">TIME / DAY</th>
                            {daysOfWeek.map((day, dIdx) => (
                              <th key={day.key} className="p-3 border border-slate-200/20 text-center text-xs print:p-1.5 print:text-[9.5px] print-table-header">
                                <span className="block">{day.kh.split(" ")[0]}</span>
                                <span className="text-[10px] opacity-75 font-mono">{getWeekRangeLabel(selectedWeek).dates[dIdx] || "00/00/0000"}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        {/* Table Body Timings */}
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {timeSlots.map((time) => (
                            <tr key={time} className="hover:bg-slate-50/50">
                              
                              {/* Time Column indicator */}
                              <td className="p-3 text-center border-r border-slate-200 bg-slate-50 font-bold text-slate-800 font-mono text-[11px] print:p-1.5 print:text-[9.5px]">
                                {time}
                              </td>

                              {/* Day Columns */}
                              {daysOfWeek.map((day) => {
                                const cells = weekItems.filter(item => item.dayOfWeek === day.key && item.timeSlot === time);
                                return (
                                  <td key={day.key} className="p-2 border-r border-slate-150 align-top h-[110px] min-h-[110px] relative print:h-auto print:min-h-[48px] print:p-1 print-time-cell">
                                    {cells.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {cells.map((cell) => {
                                          const statusStyles = getStatusColor(cell.status, true);
                                          const contentIcon = cell.contentType === "Video" ? "🎥" : cell.contentType === "Carousel" ? "📁" : "🖼️";
                                          return (
                                            <div 
                                              key={cell.id} 
                                              className={`p-2 rounded border-l-[3.5px] ${statusStyles.bg} ${statusStyles.border} text-slate-800 flex flex-col justify-between h-full space-y-1 shadow-sm print:p-1 print:space-y-0.5 print-item-card`}
                                            >
                                              <div>
                                                <div className="font-bold text-[11px] text-slate-900 leading-tight block line-clamp-2 print:text-[9.5px] print:leading-tight">
                                                  <span className="mr-0.5 inline-block emoji-font">{contentIcon}</span>
                                                  {cell.title}
                                                </div>
                                                {cell.subtitle && (
                                                  <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5 print:text-[8px] print:mt-0">
                                                    {cell.subtitle}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="pt-1 flex items-center justify-between text-[8px] font-bold print:pt-0.5 print:text-[7px]">
                                                <span className="text-indigo-600 font-mono scale-95 origin-left tracking-wide">
                                                  {cell.contentType.toUpperCase()} / {cell.postType.toUpperCase()}
                                                </span>
                                                <span className={`px-1.5 py-0.2 rounded uppercase ${statusStyles.badgeBg} ${statusStyles.text}`}>
                                                  {statusStyles.label}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      time === "01:00 PM" ? (
                                        <div className="text-center py-4 text-slate-400 font-medium text-[10px] tracking-wide print:py-1 print:text-[9px] print-lunch-break">
                                          Lunch Break
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-slate-350 select-none opacity-40 print:p-1 print-no-schedule">
                                          <span className="text-[9px] font-sans font-medium text-slate-400 print:text-[8px]">No Schedule</span>
                                          <CheckCircle2 className="w-4 h-4 mt-1.5 text-slate-350 print:w-3 print:h-3 print:mt-0.5" />
                                        </div>
                                      )
                                    )}
                                  </td>
                                );
                              })}

                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>

                    {/* Bottom Report Elements: Summary, Comments, Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100 mt-6 print:grid-cols-3 print:gap-4 print:pt-2.5 print:mt-2.5 print-bottom-row">
                      
                      {/* WEEKLY SUMMARY WIDGETS */}
                      <div className="lg:col-span-1 space-y-4 text-left">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                          WEEKLY PERFORMANCE
                        </h3>
                        <div className="grid grid-cols-2 gap-3 print:gap-2">
                          <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                            <span className="text-blue-700 text-[10px] uppercase font-bold print:text-[8.5px]">Completion Rate</span>
                            <div className="text-xl font-black text-blue-955 font-display print:text-base">
                              {completionRate}%
                            </div>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                            <span className="text-emerald-700 text-[10px] uppercase font-bold print:text-[8.5px]">Total Done</span>
                            <div className="text-xl font-black text-emerald-955 font-display print:text-base">{completedTasks}</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 print:p-2.5 print:rounded-lg print:space-y-1 print-performance-summary">
                           <div className="flex justify-between text-xs">
                             <span className="text-slate-500 font-medium">Week Plan:</span>
                             <span className="font-bold text-slate-900">{getWeekRangeLabel(selectedWeek).range}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-slate-500 font-medium">Report Type:</span>
                             <span className="font-bold text-slate-900 uppercase">WEEKLY SINGLE</span>
                           </div>
                        </div>
                      </div>

                      {/* MANAGER COMMENTS AREA */}
                      <div className="lg:col-span-1 space-y-4 text-left">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                          MANAGER COMMENTS
                        </h3>
                        <div className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 p-4 border border-slate-200 rounded-xl min-h-[120px] print:p-2.5 print:min-h-[75px] print:text-[9.5px] print-comments-box">
                          {managerComments}
                        </div>
                      </div>

                      {/* SIGNATURE BLOCK */}
                      <div className="lg:col-span-1 space-y-4 text-left">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                          SIGNATURES
                        </h3>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6 flex flex-col justify-between h-[165px] print:p-2.5 print:space-y-3 print:h-[110px] print-signature-box">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">Approved by Manager:</span>
                            <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center select-none pb-1 print:h-6 print:pb-0.5 print-sig-line">
                              <span className="font-serif text-sm italic text-blue-800 tracking-wider"></span>
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 font-bold block mb-1">Date:</span>
                              <div className="h-6 border-b border-dashed border-slate-300 font-mono text-[10px] text-center print:h-5 print-sig-line">
                                {generationDate}
                              </div>
                            </div>
                            <div className="flex-1 ml-4 text-center">
                              <span className="text-[10px] text-slate-400 font-bold block mb-1">Official Seal:</span>
                              <div className="h-6 flex items-center justify-center opacity-20">
                                <CheckCircle2 className="w-5 h-5 mx-auto" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Legend */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 print:pt-1 print:text-[9px] print-footer-legend">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">Legend:</span>
                        <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Planned</span>
                        <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress</span>
                        <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                        <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue</span>
                        <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Cancelled</span>
                      </div>
                      <div className="font-medium">
                        Note: Weekly Document system authorized.
                      </div>
                    </div>

                  </div>
                )}

                {/* OPTION 2: ALL WEEKS IN MONTH COMBINED */}
                {exportOption === "month_weeks" && (() => {
                  const weeksForMonth = getWeeksForMonth(selectedMonthId);
                  return (
                    <div className="space-y-6 print:space-y-0">
                      {weeksForMonth.map((wkNum, index) => {
                        const currentWeekItems = monthItems.filter(i => i.weekNumber === wkNum);
                        const wkTotalTasks = currentWeekItems.length;
                        const wkCompletedTasks = currentWeekItems.filter(i => i.status === "COMPLETED").length;
                        const wkCompletionRate = wkTotalTasks > 0 ? ((wkCompletedTasks / wkTotalTasks) * 100).toFixed(1) : "0.0";
                        const wkRangeLabel = getWeekRangeLabel(wkNum);

                        return (
                          <div key={wkNum} className="space-y-6 print:space-y-0 print:m-0 print:p-0 print:pb-3 print-week-wrapper">
                            <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-lg font-sans print-wrapper-card print-month-weeks flex flex-col justify-between space-y-6 print:space-y-2 print:border-none print:shadow-none print:p-0 print:m-0 print:pb-4">
                              
                              {/* Header Panel */}
                              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b-2 border-slate-200 print:flex-row print:justify-between print:items-center print:pb-3">
                                <div className="flex items-center gap-3">
                                  {companyLogoUrl ? (
                                    <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl bg-slate-100/50">
                                      <img src={companyLogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                      <TrendingUp className="w-8 h-8 text-blue-400" />
                                    </div>
                                  )}
                                  <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">{companyName || "YOUR COMPANY"}</h2>
                                    {companySlogan && <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">{companySlogan}</p>}
                                  </div>
                                </div>
                                
                                <div className="text-center lg:text-right print:text-right">
                                  <h1 className="text-3xl font-black text-blue-955 tracking-tight font-display mb-1">
                                    WEEKLY WORK PLAN REPORT <span className="text-blue-600">({wkRangeLabel.rangeShort})</span>
                                  </h1>
                                  <div className="inline-block px-3 py-1 bg-blue-100 border border-blue-200 rounded font-bold text-slate-800 text-xs font-mono print:px-2 print:py-0.5 print:text-[10px]">
                                    Week: {wkRangeLabel.range}
                                  </div>
                                </div>
                              </div>
                              
                              {/* CALENDAR BLOCK - DYNAMIC HEIGHT MIDDLE */}
                              <div className="border border-slate-200 rounded-xl overflow-x-auto print:border-none print:rounded-none">
                                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                                  <thead>
                                    <tr className="bg-[#0b2545] text-white text-[11px] font-bold uppercase border-b-2 border-slate-200">
                                      <th className="p-3 border border-slate-200/20 text-center w-[120px] print:p-1.5 print:text-[9.5px]">TIME / DAY</th>
                                      {daysOfWeek.map((day, dIdx) => (
                                        <th key={day.key} className="p-3 border border-slate-200/20 text-center text-xs print:p-1.5 print:text-[9.5px] print-table-header">
                                          <span className="block">{day.kh.split(" ")[0]}</span>
                                          <span className="text-[10px] opacity-75 font-mono">{wkRangeLabel.dates[dIdx] || "00/00/0000"}</span>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs">
                                    {timeSlots.map((time) => (
                                      <tr key={time} className="hover:bg-slate-50/50">
                                        <td className="p-3 text-center border-r border-slate-200 bg-slate-50 font-bold text-slate-800 font-mono text-[11px] print:p-1.5 print:text-[9.5px]">
                                          {time}
                                        </td>
                                        {daysOfWeek.map((day) => {
                                          const cells = currentWeekItems.filter(item => item.dayOfWeek === day.key && item.timeSlot === time);
                                          return (
                                            <td key={day.key} className="p-2 border-r border-slate-150 align-top min-h-[50px] relative print:h-auto print:min-h-[36px] print:p-1 print-time-cell">
                                              {cells.length > 0 ? (
                                                <div className="space-y-1.5 font-sans">
                                                  {cells.map((cell) => {
                                                    const statusStyles = getStatusColor(cell.status, true);
                                                    const contentIcon = cell.contentType === "Video" ? "🎥" : cell.contentType === "Carousel" ? "📁" : "🖼️";
                                                    return (
                                                      <div 
                                                        key={cell.id} 
                                                        className={`p-2 rounded border-l-[3.5px] ${statusStyles.bg} ${statusStyles.border} text-slate-800 flex flex-col justify-between h-full space-y-1 shadow-sm print:p-1 print:space-y-0.5 print-item-card`}
                                                      >
                                                        <div>
                                                          <div className="font-bold text-[11px] text-slate-900 leading-tight block line-clamp-2 print:text-[9.5px] print:leading-tight">
                                                            <span className="mr-0.5 inline-block emoji-font">{contentIcon}</span>
                                                            {cell.title}
                                                          </div>
                                                          {cell.subtitle && (
                                                            <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5 print:text-[8px] print:mt-0">
                                                              {cell.subtitle}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="pt-1 flex items-center justify-between text-[8px] font-bold print:pt-0.5 print:text-[7px]">
                                                          <span className="text-indigo-600 font-mono scale-95 origin-left tracking-wide">
                                                            {cell.contentType.toUpperCase()} / {cell.postType.toUpperCase()}
                                                          </span>
                                                          <span className={`px-1.5 py-0.2 rounded uppercase ${statusStyles.badgeBg} ${statusStyles.text}`}>
                                                            {statusStyles.label}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                time === "01:00 PM" ? (
                                                  <div className="text-center py-3 text-slate-400 font-medium text-[10px] tracking-wide print:py-1 print:text-[9px] print-lunch-break">
                                                    Lunch Break
                                                  </div>
                                                ) : (
                                                  <div className="flex flex-col items-center justify-center p-3 text-slate-350 select-none opacity-40 print:p-1 print-no-schedule">
                                                    <span className="text-[9px] font-sans font-medium text-slate-400 font-khmer print:text-[8px]">No Schedule</span>
                                                    <CheckCircle2 className="w-4 h-4 mt-1 text-slate-350 print:w-3 print:h-3 print:mt-0.5" />
                                                  </div>
                                                )
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Dynamics Bottom Stats */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-left font-sans print:grid-cols-3 print:gap-4 print:pt-2.5 print:mt-2.5 print-bottom-row">
                                
                                {/* WEEKLY SUMMARY WIDGETS */}
                                <div className="lg:col-span-1 space-y-4">
                                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                                    WEEKLY PERFORMANCE
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 print:gap-2">
                                    <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                                      <span className="text-blue-700 text-[10px] uppercase font-bold print:text-[8.5px]">Completion Rate</span>
                                      <div className="text-xl font-black text-blue-955 font-display print:text-base">
                                        {wkCompletionRate}%
                                      </div>
                                    </div>
                                    <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                                      <span className="text-emerald-700 text-[10px] uppercase font-bold print:text-[8.5px]">Total Done</span>
                                      <div className="text-xl font-black text-emerald-955 font-display print:text-base">{wkCompletedTasks}</div>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 print:p-2.5 print:rounded-lg print:space-y-1 print-performance-summary">
                                     <div className="flex justify-between text-xs">
                                       <span className="text-slate-500 font-medium">Week Plan:</span>
                                       <span className="font-bold text-slate-900">{wkRangeLabel.range}</span>
                                     </div>
                                     <div className="flex justify-between text-xs">
                                       <span className="text-slate-500 font-medium">Report Type:</span>
                                       <span className="font-bold text-slate-900 uppercase">WEEKLY GLOBAL</span>
                                     </div>
                                  </div>
                                </div>

                                {/* MANAGER COMMENTS AREA */}
                                <div className="lg:col-span-1 space-y-4">
                                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                                    MANAGER COMMENTS
                                  </h3>
                                  <div className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 p-4 border border-slate-200 rounded-xl min-h-[120px] print:p-2.5 print:min-h-[75px] print:text-[9.5px] print-comments-box">
                                    {managerComments}
                                  </div>
                                </div>

                                {/* SIGNATURE BLOCK */}
                                <div className="lg:col-span-1 space-y-4">
                                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                                    SIGNATURES
                                  </h3>
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6 flex flex-col justify-between h-[165px] print:p-2.5 print:space-y-3 print:h-[110px] print-signature-box">
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Approved by Manager:</span>
                                      <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center select-none pb-1 print:h-6 print:pb-0.5 print-sig-line">
                                        <span className="font-serif text-sm italic text-blue-800 tracking-wider"></span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <div className="flex-1">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Date:</span>
                                        <div className="h-6 border-b border-dashed border-slate-300 font-mono text-[10px] text-center print:h-5 print-sig-line">
                                          {generationDate}
                                        </div>
                                      </div>
                                      <div className="flex-1 ml-4 text-center">
                                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Official Seal:</span>
                                        <div className="h-6 flex items-center justify-center opacity-20">
                                          <CheckCircle2 className="w-5 h-5 mx-auto" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Legend */}
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2 print:pt-1 print:text-[9px] print-footer-legend">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold">Legend:</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Planned</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Cancelled</span>
                                </div>
                                <div className="font-medium">
                                  Note: Page X of Y • Document system authorized.
                                </div>
                              </div>
                            </div>

                            {/* Strict 100vh bounding box handles page split automatically, removed empty page break */}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* OPTION 3: EXPORT FULL 1-MONTH COMPREHENSIVE LANDSCAPE CALENDAR */}
                {exportOption === "month_calendar" && (() => {
                  const weeks = getWeeksForMonth(selectedMonthId);
                  const monthLabelParts = selectedMonthId.split("-");
                  const yearVal = monthLabelParts[0] || "2026";
                  const monthNum = parseInt(monthLabelParts[1] || "07", 10);
                  const monthsKhNames = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
                  const monthNameKh = monthsKhNames[monthNum - 1] || "កក្កដា";
                  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                  const monthNameEn = monthNamesEn[monthNum - 1] || "July";

                  // Month total items and status calculations
                  const mTotal = monthItems.length;
                  const mCompleted = monthItems.filter(i => i.status === "COMPLETED").length;
                  const mPending = monthItems.filter(i => i.status === "PLANNED" || i.status === "IN_PROGRESS").length;
                  const mOverdue = monthItems.filter(i => i.status === "OVERDUE").length;

                   const weeksCountClass = weeks.length === 6 ? "weeks-6" : "weeks-5";
                   return (
                     <div className={`bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-1.5 text-left print-month-calendar ${weeksCountClass}`}>
                      
                      {/* Logo and Monthly Title Banner */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b-2 border-slate-200 print:flex-row print:justify-between print:items-center print:pb-2 print:mb-2">
                        <div className="flex items-center gap-3">
                          {companyLogoUrl ? (
                            <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl bg-slate-100/50">
                              <img src={companyLogoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-8 h-8 text-blue-400" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">{companyName || "YOUR COMPANY"}</h2>
                            {companySlogan && <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">{companySlogan}</p>}
                          </div>
                        </div>
                        
                        <div className="text-center lg:text-right print:text-right">
                          <h1 className="text-3xl font-black text-blue-900 tracking-tight font-display mb-1">
                            MONTHLY PLANNER CALENDAR
                          </h1>
                          <div className="inline-flex gap-2 items-center px-4 py-1 bg-blue-100 border border-blue-200 rounded-lg font-bold text-slate-800 text-xs">
                            <span className="font-sans text-xs">{monthNameKh} {khmerNumber(yearVal)}</span>
                            <span className="text-slate-400">|</span>
                            <span className="font-mono text-[11px]">{monthNameEn} {yearVal}</span>
                          </div>
                        </div>
                      </div>

                      {/* Comprehensive A4 Landscape Calendar Grid */}
                      <div className="border border-slate-200 rounded-xl overflow-x-auto print:border-none print:rounded-none">
                        <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                          <thead>
                            <tr className="bg-[#0b2545] text-white text-[11px] font-bold uppercase border-b-2 border-slate-200">
                              <th className="p-3 border border-slate-200/20 text-center w-[85px]">WKEY</th>
                              {daysOfWeek.map((day) => (
                                <th key={day.key} className="p-3 border border-slate-200/20 text-center text-xs">
                                  {day.kh.split(" ")[0]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                            {weeks.map((wkNum) => {
                              const wkRange = getWeekRangeLabel(wkNum);
                              return (
                                <tr key={wkNum} className="hover:bg-slate-50/50">
                                  <td className="p-3 text-center border-r border-slate-200 bg-slate-50 font-bold text-slate-800 font-mono text-xs">
                                    Week {wkNum}
                                  </td>
                                  {daysOfWeek.map((day, dIdx) => {
                                    const rawDate = wkRange.dates[dIdx] || "";
                                    const dateNumber = rawDate.split("/")[0] || "";
                                    const cellItems = monthItems.filter(item => item.weekNumber === wkNum && item.dayOfWeek === day.key);
                                    
                                    return (
                                      <td key={day.key} className="p-2 border-r border-slate-200 align-top h-[140px] min-h-[140px] relative hover:bg-slate-50/40">
                                        
                                        {/* Date labeling */}
                                        <div className="flex justify-between items-center mb-1.5 border-b border-slate-100 pb-1">
                                          <span className="text-[9px] text-slate-400 font-mono font-medium">{rawDate}</span>
                                          {dateNumber && (
                                            <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                                              {dateNumber}
                                            </span>
                                          )}
                                        </div>

                                        {/* Content schedules list */}
                                        <div className="space-y-1.5 max-h-[105px] overflow-y-hidden">
                                          {cellItems.map((cell) => {
                                            const colors = getStatusColor(cell.status, true);
                                            const contentIcon = cell.contentType === "Video" ? "🎥" : cell.contentType === "Carousel" ? "📁" : "🖼️";
                                            return (
                                              <div 
                                                key={cell.id}
                                                className={`p-1.5 rounded text-[9.5px] leading-tight font-sans border-l-[3px] ${colors.bg} ${colors.border} ${colors.text} flex flex-col justify-between truncate`}
                                                title={cell.title}
                                              >
                                                <div className="font-bold text-slate-900 truncate">
                                                  <span className="mr-0.5 inline-block emoji-font">{contentIcon}</span>
                                                  {cell.title}
                                                </div>
                                                <div className="flex justify-between items-center text-[7.5px] font-bold mt-0.5 opacity-90 font-mono">
                                                  <span>{cell.timeSlot}</span>
                                                  <span className="uppercase scale-90">{cell.postType}</span>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {cellItems.length === 0 && (
                                            <div className="h-full flex items-center justify-center pt-5 opacity-20">
                                              <div className="text-[9px] text-slate-400 font-sans italic">No events</div>
                                            </div>
                                          )}
                                        </div>

                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Legend Row */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-4 print:pt-2.5 print:text-[9px] print-footer-legend">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">Legend:</span>
                          <span className="inline-flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Planned</span>
                          <span className="inline-flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress</span>
                          <span className="inline-flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed</span>
                          <span className="inline-flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue</span>
                          <span className="inline-flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cancelled</span>
                        </div>
                        <div>
                          Note: Full month comprehensive layout authorized for system export.
                        </div>
                      </div>

                      {/* Summary, Comments and Signatures */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100 print:grid-cols-3 print:gap-4 print:pt-2.5 print:mt-2.5 print-bottom-row">
                        {/* STATS SUMMARY */}
                        <div className="lg:col-span-1 space-y-4 text-left">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                            MONTHLY PERFORMANCE
                          </h3>
                          <div className="grid grid-cols-2 gap-3 print:gap-2">
                            <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                              <span className="text-blue-700 text-[10px] uppercase font-bold print:text-[8.5px]">Completion Rate</span>
                              <div className="text-xl font-black text-blue-955 font-display print:text-base">
                                {mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0}%
                              </div>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg print:p-2 print:rounded-md print-performance-box">
                              <span className="text-emerald-700 text-[10px] uppercase font-bold print:text-[8.5px]">Total Done</span>
                              <div className="text-xl font-black text-emerald-955 font-display print:text-base">{mCompleted}</div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 print:p-2.5 print:rounded-lg print:space-y-1 print-performance-summary">
                             <div className="flex justify-between text-xs">
                               <span className="text-slate-500 font-medium">Month Plan:</span>
                               <span className="font-bold text-slate-900">{selectedMonthId}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                               <span className="text-slate-500 font-medium">Report Type:</span>
                               <span className="font-bold text-slate-900 uppercase">Monthly Global</span>
                             </div>
                          </div>
                        </div>

                        {/* COMMENTS */}
                        <div className="lg:col-span-1 space-y-4 text-left">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                            MANAGER COMMENTS
                          </h3>
                          <div className="print:hidden space-y-2">
                            <textarea
                              value={managerComments}
                              onChange={(e) => setManagerComments(e.target.value)}
                              className="w-full p-3 text-xs text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 h-[120px]"
                              placeholder="បញ្ចូលមតិសម្រាប់របាយការណ៍ខែ..."
                            />
                          </div>
                          <div className="hidden print:block text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 p-4 border border-slate-200 rounded-xl min-h-[120px] print:p-2.5 print:min-h-[60px] print-comments-box">
                            {managerComments}
                          </div>
                        </div>

                        {/* SIGNATURES */}
                        <div className="lg:col-span-1 space-y-4 text-left">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 font-display">
                            SIGNATURES
                          </h3>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6 flex flex-col justify-between h-[165px] print:p-1.5 print:space-y-2 print:h-[70px] print-signature-box">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block mb-1">Approved by Manager:</span>
                              <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center select-none pb-1 print:h-6 print:pb-0.5 print-sig-line">
                                <span className="font-serif text-sm italic text-blue-800 tracking-wider"></span>
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-400 font-bold block mb-1">Date:</span>
                                <div className="h-6 border-b border-dashed border-slate-300 font-mono text-[10px] text-center print:h-5 print-sig-line">
                                  {generationDate}
                                </div>
                              </div>
                              <div className="flex-1 ml-4 text-center">
                                <span className="text-[10px] text-slate-400 font-bold block mb-1">Official Seal:</span>
                                <div className="h-6 flex items-center justify-center opacity-20">
                                  <CheckCircle2 className="w-5 h-5 mx-auto" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>
 
            </div>
          ) : (
            
            /* STANDARD APP VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT CONTROL BOARD: Add/Edit Post Form + Pages/Platforms Manager (Col 5) - HIDDEN since moved to Modal/Popup */}
              <div className="hidden">
                
                {/* PLAN WRITING ENGINE CARD */}
                <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-5">
                  <div className="border-b border-white/[0.04] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-blue-400" />
                        <span>{editingItemId ? "កែសម្រួលផែនការការងារ" : "បន្ថែមការផុសថ្មី (Insert Post)"}</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">បញ្ចូលការផ្សព្វផ្សាយក្នុងប្រតិទិនស្ដង់ដារ</p>
                    </div>
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(null);
                          setFormTitle("");
                          setFormSubType("");
                          setFormNotes("");
                        }}
                        className="p-1 text-slate-400 hover:text-white bg-white/[0.05] rounded-lg text-[10px]"
                      >
                        លុបចោល
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveItem} className="space-y-4">
                    
                    {/* Item Title Input */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center">
                        <label htmlFor="form-plan-title" className="text-[11px] font-semibold text-slate-400 block font-sans">
                          ចំណងជើងផុស / Activity Title *
                        </label>
                        <MicButton onTranscribed={(t) => setFormTitle(prev => prev ? `${prev} ${t}` : t)} />
                      </div>
                      <input
                        id="form-plan-title"
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="ឧ. វិធីសាស្ត្រលក់អនឡាញថ្មី..."
                        className="w-full px-3.5 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 transition-all font-sans"
                      />
                    </div>

                    {/* Content category details */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                        ក្រុមហ៊ុន / ស្ថាប័ន / Subtitle
                      </label>
                      <input
                        type="text"
                        value={formSubType}
                        onChange={(e) => setFormSubType(e.target.value)}
                        placeholder="ឧ. ABC Company, Internal, ផ្សេងៗ"
                        className="w-full px-3.5 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 transition-all font-sans"
                      />
                    </div>

                    {/* Dual option row: Post Type & Content Type */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans">ប្រភេទផុស (Post Type)</label>
                        <select
                          value={formPostType}
                          onChange={(e) => setFormPostType(e.target.value as any)}
                          className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          <option value="Posted">Posted (បានផុស)</option>
                          <option value="Scheduled">Scheduled (កាលវិភាគ)</option>
                          <option value="Draft">Draft (ព្រាងទុក)</option>
                          <option value="Idea">Idea (គំនិតថ្មី)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans">ប្រភេទឯកសារ (Content)</label>
                        <select
                          value={formContentType}
                          onChange={(e) => setFormContentType(e.target.value as any)}
                          className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          <option value="Video">Video (វីដេអូ)</option>
                          <option value="Poster">Poster (រូបភាព)</option>
                          <option value="Carousel">Carousel (ស្លាយ)</option>
                        </select>
                      </div>
                    </div>

                    {/* PAGE SELECTION WITH CRUD TOGGLE INLINE */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans">ផុសទៅកាន់ទំព័រ (Post to Page)</label>
                        <button
                          type="button"
                          onClick={() => setShowPageManager(!showPageManager)}
                          className="text-[10px] text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                        >
                          ⚙️ {showPageManager ? "បិទ" : "លុប/បន្ថែមឈ្មោះ Page"}
                        </button>
                      </div>

                      {showPageManager ? (
                        <div className="p-3 bg-[#0a0a0c] border border-white/[0.06] rounded-xl space-y-2 mb-2">
                          <span className="text-[9.5px] text-slate-400 font-bold block">គ្រប់គ្រងឈ្មោះ Facebook Pages</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newPageName}
                              onChange={(e) => setNewPageName(e.target.value)}
                              placeholder="បញ្ចូលឈ្មោះទំព័រថ្មី..."
                              className="flex-1 px-2.5 py-1 text-[11px] bg-[#16161a] border border-white/[0.08] rounded-lg text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddPage}
                              className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg"
                            >
                              បន្ថែម
                            </button>
                          </div>
                          
                          <div className="max-h-24 overflow-y-auto divide-y divide-white/[0.03] pt-1 pr-2">
                            {pages.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-1 text-[11px] group">
                                {editingPageId === p.id ? (
                                  <div className="flex w-full gap-1 items-center">
                                    <input autoFocus value={editingPageName} onChange={e => setEditingPageName(e.target.value)} className="flex-1 bg-[#1a1a20] border border-white/10 px-1.5 py-1 rounded text-[10px] text-white" />
                                    <button type="button" onClick={() => handleSaveEditPage(p.id)} className="text-green-400 p-1"><Save className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => setEditingPageId(null)} className="text-slate-400 p-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-slate-300 truncate pr-2">{p.name}</span>
                                    <div className="flex gap-1 items-center">
                                      {p.isProtected ? (
                                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.08em] font-semibold">Protected</span>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setEditingPageId(p.id); setEditingPageName(p.name); }}
                                            className="text-amber-400 hover:text-amber-300 cursor-pointer p-1 rounded-sm hover:bg-amber-500/10 transition-colors shrink-0 z-10 relative"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleDeletePage(p.id); }}
                                            className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded-sm hover:bg-rose-500/10 transition-colors shrink-0 z-10 relative"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <select
                        value={formPageId}
                        onChange={(e) => setFormPageId(e.target.value)}
                        className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                      >
                        {pages.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* PLATFORM SELECTION WITH CRUD TOGGLE INLINE */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans">ប្រព័ន្ធផ្សារភ្ជាប់ (Post to Platform)</label>
                        <button
                          type="button"
                          onClick={() => setShowPlatformManager(!showPlatformManager)}
                          className="text-[10px] text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                        >
                          ⚙️ {showPlatformManager ? "បិទ" : "លុប/បន្ថែមឈ្មោះ Platform"}
                        </button>
                      </div>

                      {showPlatformManager ? (
                        <div className="p-3 bg-[#0a0a0c] border border-white/[0.06] rounded-xl space-y-2 mb-2">
                          <span className="text-[9.5px] text-slate-400 font-bold block">គ្រប់គ្រងប្រព័ន្ធផ្សព្វផ្សាយ Platforms</span>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newPlatformName}
                              onChange={(e) => setNewPlatformName(e.target.value)}
                              placeholder="បញ្ចូលឈ្មោះប្រព័ន្ធ..."
                              className="flex-1 px-2.5 py-1 text-[11px] bg-[#16161a] border border-white/[0.08] rounded-lg text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddPlatform}
                              className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg"
                            >
                              បន្ថែម
                            </button>
                          </div>
                          
                          <div className="max-h-24 overflow-y-auto divide-y divide-white/[0.03] pt-1 pr-2">
                            {platforms.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-1 text-[11px] group">
                                {editingPlatformId === p.id ? (
                                  <div className="flex w-full gap-1 items-center">
                                    <input autoFocus value={editingPlatformName} onChange={e => setEditingPlatformName(e.target.value)} className="flex-1 bg-[#1a1a20] border border-white/10 px-1.5 py-1 rounded text-[10px] text-white" />
                                    <button type="button" onClick={() => handleSaveEditPlatform(p.id)} className="text-green-400 p-1"><Save className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => setEditingPlatformId(null)} className="text-slate-400 p-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-slate-300 truncate pr-2">{p.name}</span>
                                    <div className="flex gap-1 items-center">
                                      {p.isProtected ? (
                                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.08em] font-semibold">Protected</span>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setEditingPlatformId(p.id); setEditingPlatformName(p.name); }}
                                            className="text-amber-400 hover:text-amber-300 cursor-pointer p-1 rounded-sm hover:bg-amber-500/10 transition-colors shrink-0 z-10 relative"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleDeletePlatform(p.id); }}
                                            className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded-sm hover:bg-rose-500/10 transition-colors shrink-0 z-10 relative"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <select
                        value={formPlatformId}
                        onChange={(e) => setFormPlatformId(e.target.value)}
                        className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                      >
                        {platforms.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dual option row: Day & Time slot */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans font-medium">ថ្ងៃក្នុងសប្តាហ៍</label>
                        <select
                          value={formDay}
                          onChange={(e) => setFormDay(e.target.value as any)}
                          className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          {daysOfWeek.map(d => (
                            <option key={d.key} value={d.key}>{d.kh}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans font-medium">ចន្លោះម៉ោង (Time Slot)</label>
                        <select
                          value={formTimeSlot}
                          onChange={(e) => setFormTimeSlot(e.target.value)}
                          className="w-full px-2 py-2 text-[#00ebff] font-bold text-xs bg-[#16161a] border border-white/[0.06] rounded-xl focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          {timeSlots.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Task state selection */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-semibold text-slate-400 block font-sans">ស្ថានភាពអនុវត្តការងារ (Status Legend)</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-2 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                      >
                        <option value="PLANNED">🔵 PLANNED (គ្រោងទុក)</option>
                        <option value="IN_PROGRESS">🟡 IN PROGRESS (កំពុងធ្វើ)</option>
                        <option value="COMPLETED">🟢 COMPLETED (រួចរាល់)</option>
                        <option value="OVERDUE">🔴 OVERDUE (ហួសកំណត់)</option>
                        <option value="CANCELLED">⚪ CANCELLED (លុបចោល)</option>
                      </select>
                    </div>

                    {/* Interactive notes field */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-slate-400 block font-sans">កំណត់សម្គាល់ (Notes / Detail)</label>
                        <div className="flex gap-2 items-center">
                          <MicButton onTranscribed={(t) => setFormNotes(prev => prev ? `${prev}\n${t}` : t)} />
                          <span className="text-[9px] text-slate-600 font-mono">Optional</span>
                        </div>
                      </div>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="ព័ត៌មានបន្ថែមស្តីពីការរៀបចំ ឬថវិការចុះផ្សាយ..."
                        className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 h-20 transition-all font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-550/5 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingItemId ? "រក្សាការកែប្រែ (Save Changes)" : "បញ្ចូលទៅកាន់កាលវិភាគ (Add Plan Item)"}</span>
                    </button>

                  </form>
                </div>

                {/* DIRECT QUICK LIST CONTROLLER OF POSTS */}
                <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4 shadow-sm text-left">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-3">
                    រោលការងារសប្តាហ៍ {selectedWeekRange.rangeShort} ({weekItems.length} គម្រោង)
                  </h4>
                  {weekItems.length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-sans py-2">មិនទាន់មានគម្រោងផែនការការងារនៅឡើយទេ។</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {weekItems.map(item => {
                        const colStyles = getStatusColor(item.status);
                        return (
                          <div 
                            key={item.id}
                            className="p-2.5 bg-[#16161a] border border-white/[0.04] rounded-xl flex items-center justify-between gap-3 hover:border-white/[0.08]"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] px-1.5 py-0.2 bg-white/[0.04] text-slate-400 rounded block font-mono w-fit mb-1">
                                {item.timeSlot} - {item.dayOfWeek.substring(0,3)}
                              </span>
                              <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditItemInitiate(item)}
                                className="p-1 hover:bg-white/[0.06] text-blue-400 rounded-lg"
                                title="កែសម្រួល"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 hover:bg-red-950/20 text-red-400 rounded-lg"
                                title="លុប"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT MAIN CALENDAR GRID & WEEK PLAN CHOOSER (Col 12 - Full Width!) */}
              <div className="lg:col-span-12 space-y-2.5">
                
                {/* 1. WEEK SELECTION TAB CONTROLLERS & VIEW TOGGLES */}
                <div className="sticky top-[64px] z-30 backdrop-blur-md bg-[#111115]/95 print-hide print:hidden flex flex-col lg:flex-row justify-between items-center p-2.5 border border-white/[0.08] rounded-2xl gap-2.5 shadow-xl max-w-full overflow-hidden">
                  {/* Week Buttons - Dynamic Auto-Resize */}
                  <div className="flex items-center gap-1 sm:gap-1.5 font-sans w-full lg:flex-1 min-w-0">
                    {getWeeksForMonth(selectedMonthId).map((wk) => {
                      const wkRangeLabel = getWeekRangeLabel(wk, selectedMonthId);
                      const weekColors: Record<number, { active: string; inactive: string; icon: string }> = {
                        1: { active: "bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/10", inactive: "bg-[#16161a] border-sky-500/10 text-slate-400 hover:text-sky-300 hover:bg-sky-500/[0.06] hover:border-sky-500/20", icon: "text-sky-400" },
                        2: { active: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10", inactive: "bg-[#16161a] border-cyan-500/10 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/[0.06] hover:border-cyan-500/20", icon: "text-cyan-400" },
                        3: { active: "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-md shadow-violet-500/10", inactive: "bg-[#16161a] border-violet-500/10 text-slate-400 hover:text-violet-300 hover:bg-violet-500/[0.06] hover:border-violet-500/20", icon: "text-violet-400" },
                        4: { active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10", inactive: "bg-[#16161a] border-emerald-500/10 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/[0.06] hover:border-emerald-500/20", icon: "text-emerald-400" },
                        5: { active: "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10", inactive: "bg-[#16161a] border-amber-500/10 text-slate-400 hover:text-amber-300 hover:bg-amber-500/[0.06] hover:border-amber-500/20", icon: "text-amber-400" },
                        6: { active: "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/10", inactive: "bg-[#16161a] border-rose-500/10 text-slate-400 hover:text-rose-300 hover:bg-rose-500/[0.06] hover:border-rose-500/20", icon: "text-rose-400" },
                      };
                      const color = weekColors[wk] || weekColors[1];
                      const isActive = selectedWeek === wk;
                      return (
                        <button
                          key={wk}
                          type="button"
                          onClick={() => setSelectedWeek(wk)}
                          className={`flex-1 min-w-0 text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl font-bold font-sans border transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${isActive ? color.active : color.inactive}`}
                          title={wkRangeLabel.range}
                        >
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${isActive ? "" : color.icon}`} />
                          <span className="truncate">សប្តាហ៍ទី {wk}: {wkRangeLabel.rangeShort}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* View Modes Toggle - Fits perfectly without overflow */}
                  <div className="flex items-center gap-1 bg-[#16161a] p-1 border border-white/[0.06] rounded-xl w-full lg:w-auto shrink-0 justify-between lg:justify-end overflow-hidden max-w-full">
                    {[
                      { key: "calendar", label: "មើលប្រតិទិន (Standard View)", short: "Standard" },
                      { key: "month-calendar", label: "ប្រតិទិនប្រចាំខែ (Monthly View)", short: "Monthly" },
                      { key: "list", label: "មើលបញ្ជី (List View)", short: "List" },
                      { key: "datagrid", label: "មើលតារាងទិន្នន័យ (Grid View)", short: "Grid" }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedTab(tab.key as any)}
                        className={`flex-1 lg:flex-none text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-sans font-bold text-center whitespace-nowrap ${
                          selectedTab === tab.key
                            ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-sm"
                            : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span className="hidden xl:inline">{tab.label}</span>
                        <span className="xl:hidden">{tab.short}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. DATE SUBHEADER METADATA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-left gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-sans">
                      {selectedTab === "month-calendar" 
                        ? `ផែនការការងារប្រចាំខែ ${months.find(m => m.id === selectedMonthId)?.nameKh || selectedMonthId}`
                        : `គម្រោងការងារសប្តាហ៍ ${selectedWeekRange.rangeShort} (Week ${selectedWeekRange.rangeShort} Plan Schedule)`
                      }
                    </h3>
                    <p className="text-xs text-white font-bold font-mono mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {selectedTab === "month-calendar"
                          ? `រៀបចំផែនការសម្រាប់ពេញមួយខែ (${monthItems.length} Posts)`
                          : getWeekRangeLabel(selectedWeek).range
                        }
                      </span>
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-[#111115] px-3 py-1.5 border border-white/[0.06] rounded-xl font-sans font-semibold">
                    សរុបសកម្មភាព៖ <span className="text-white font-bold font-mono">
                      {selectedTab === "month-calendar" ? monthItems.length : weekItems.length} Posts
                    </span>
                  </div>
                </div>

                {/* 3. CALENDAR INTERACTIVE INTERFAECE GRID */}
                {selectedTab === "calendar" && (
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-inner overflow-x-auto">
                    <div className="min-w-[800px] space-y-4">
                      
                      {/* Grid header headings */}
                      <div className="grid grid-cols-[110px_repeat(7,_1fr)] gap-2 text-center pb-2.5 border-b border-white/[0.06]">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center font-sans">
                          TIME SLOT
                        </div>
                        {daysOfWeek.map((day, dIdx) => {
                          const fullDate = getWeekRangeLabel(selectedWeek).dates[dIdx] || "00/00/0000";
                          const parts = fullDate.split("/");
                          const dayNum = parts[0] || "";
                          const monthYear = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";

                          return (
                            <div key={day.key} className="space-y-0.5 font-sans p-1 text-center select-none">
                              <span className="text-sm font-black text-white block tracking-wide">
                                {day.kh.split(" ")[0]}
                              </span>
                              <div className="text-sm font-black font-mono inline-flex items-center justify-center tracking-tight">
                                <span className="text-amber-300 font-black text-base drop-shadow-[0_0_6px_rgba(252,211,77,0.4)]">{dayNum}</span>
                                <span className="text-white font-bold text-xs">{monthYear}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Main Data Flow Rows */}
                      <div className="space-y-2">
                        {timeSlots.map((time) => (
                          <div key={time} className="grid grid-cols-[110px_repeat(7,_1fr)] gap-2 min-h-[90px]">
                            
                            {/* Left column identifier */}
                            <div className="bg-[#16161a] border border-white/[0.04] rounded-xl text-[10px] font-mono font-bold text-slate-400 flex flex-col items-center justify-center gap-1 p-2 select-none">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{time}</span>
                            </div>

                            {/* Inner Day Grid Boxes */}
                            {daysOfWeek.map((day) => {
                              const cellItems = weekItems.filter(i => i.dayOfWeek === day.key && i.timeSlot === time);
                              
                              return (
                                <div 
                                  key={day.key}
                                  onClick={() => handleQuickSlotClick(day.key as any, time)}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                  }}
                                  onDragEnter={(e) => {
                                    e.currentTarget.classList.add("bg-white/[0.05]");
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove("bg-white/[0.05]");
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("bg-white/[0.05]");
                                    const itemId = e.dataTransfer.getData("itemId");
                                    if (itemId) {
                                      handleDropItem(itemId, day.key, time);
                                    }
                                  }}
                                  className={`bg-[#1a1a20]/20 border border-white/[0.03] hover:border-blue-500/25 hover:bg-blue-500/[0.02] rounded-xl p-1.5 transition-all cursor-pointer flex flex-col justify-between align-top gap-1 ${
                                    cellItems.length > 0 ? "bg-white/[0.02]" : "items-center justify-center group"
                                  }`}
                                  title="ចុចត្រង់នេះដើម្បីបញ្ចូលផែនការរហ័ស"
                                >
                                  {cellItems.length > 0 ? (
                                    <div className="space-y-1 w-full h-full text-left">
                                      {cellItems.map(item => {
                                        const colStyles = getStatusColor(item.status);
                                        const targetPage = pages.find(p => p.id === item.pageId);
                                        const pageName = targetPage?.name || item.subtitle;
                                        const cStyle = getContentTypeStyle(item.contentType);
                                        const pTypeStyle = getPostTypeStyle(item.postType);

                                        return (
                                          <div 
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData("itemId", item.id);
                                              e.dataTransfer.effectAllowed = "move";
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewingDetailItem(item);
                                            }}
                                            className={`p-1.5 text-[9px] leading-tight rounded-lg border-[1.5px] cursor-grab active:cursor-grabbing ${colStyles.bg} ${colStyles.border} ${colStyles.text} block hover:scale-[1.02] transition-transform`}
                                          >
                                            <span className="font-extrabold line-clamp-2 block leading-none">{item.title}</span>
                                            
                                            {pageName && (
                                              <span className="text-[8px] text-cyan-300 font-semibold truncate block mt-0.5">{pageName}</span>
                                            )}

                                            <div className="flex justify-between items-center text-[7.5px] mt-1 font-mono uppercase tracking-tight">
                                              <span className={cStyle.text}>{item.contentType}</span>
                                              <span className={pTypeStyle.text}>{item.postType}</span>
                                            </div>

                                            {item.platformId && (
                                              <div className="mt-1 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-1">
                                                {item.platformId.split(",").map(pId => {
                                                  const plat = platforms.find(pf => pf.id === pId);
                                                  const pName = plat ? plat.name : pId;
                                                  const pStyle = getPlatformStyle(pName);
                                                  return (
                                                    <span 
                                                      key={pId} 
                                                      className={`text-[7.5px] font-sans font-black ${pStyle.text}`} 
                                                      title={pName}
                                                    >
                                                      {pName}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-[8.5px] text-slate-650 opacity-40 flex flex-col items-center justify-center h-full group-hover:opacity-100 transition-opacity">
                                      <span className="text-[8px] font-sans group-hover:text-blue-400 font-semibold">+ Add</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
                
                {selectedTab === "month-calendar" && (
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-6 shadow-2xl overflow-x-auto">
                    <div className="min-w-[1000px] space-y-4">
                      <div className="grid grid-cols-7 gap-3 mb-2 text-center border-b border-white/[0.04] pb-4">
                        {daysOfWeek.map(day => (
                          <div key={day.key} className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {day.kh.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-4">
                        {getWeeksForMonth(selectedMonthId).map((wk) => (
                          <div key={wk} className="grid grid-cols-7 gap-3">
                            {daysOfWeek.map((day, dIdx) => {
                              const rangeData = getWeekRangeLabel(wk, selectedMonthId);
                              const dateStr = rangeData.dates[dIdx] || "";
                              const dayDate = dateStr.split("/")[0] || "";
                              const cellItems = monthItems.filter(i => i.weekNumber === wk && i.dayOfWeek === day.key);
                              
                              return (
                                <div 
                                  key={day.key}
                                  onClick={() => {
                                      setSelectedWeek(wk);
                                      handleQuickSlotClick(day.key as any, "09:00 AM");
                                  }}
                                  className={`bg-[#1a1a20]/40 border border-white/[0.05] hover:border-blue-500/40 rounded-2xl p-3 min-h-[160px] flex flex-col gap-2.5 transition-all cursor-pointer relative group ${
                                    cellItems.length > 0 ? " ring-1 ring-white/[0.03]" : ""
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className={`text-base font-black font-mono transition-colors ${
                                      cellItems.length > 0 ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"
                                    }`}>
                                      {dayDate}
                                    </span>
                                    {cellItems.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <div className="flex -space-x-1">
                                          {cellItems.slice(0, 3).map((item, idx) => (
                                            <div key={item.id} className={`w-3 h-3 rounded-full border border-[#111115] ${getStatusColor(item.status).bg}`} />
                                          ))}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 ml-1">
                                          {cellItems.length}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[110px] pr-0.5 custom-scrollbar">
                                    {cellItems.map(item => {
                                      const styles = getStatusColor(item.status);
                                      return (
                                        <div 
                                          key={item.id}
                                          draggable
                                          onDragStart={(e) => {
                                            e.stopPropagation();
                                            e.dataTransfer.setData("itemId", item.id);
                                            e.dataTransfer.effectAllowed = "move";
                                          }}
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setViewingDetailItem(item);
                                          }}
                                          className={`group/task p-2 rounded-xl border border-white/[0.04] text-[10px] leading-tight ${styles.bg} ${styles.text} hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-black/20`}
                                        >
                                          <div className="font-bold line-clamp-2 mb-1 group-hover/task:underline">{item.title}</div>
                                          <div className="flex justify-between items-center opacity-75 font-mono text-[8px] border-t border-white/[0.04] pt-1 mt-1">
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-2.5 h-2.5" />
                                              {item.timeSlot}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {cellItems.length === 0 && (
                                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-4 h-4 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === "list" && (
                  /* LIST MODE AS DATAGRID */
                  <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
                    {/* Reuse the same DataGrid structure for List view as requested */}
                    <div className="bg-[#16161a] border-b border-white/[0.06] flex items-center justify-between px-4 h-12 shrink-0">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400 font-sans">
                          <span className="text-white font-bold uppercase tracking-tight">Post List Registry</span>
                          <div className="h-4 w-px bg-white/[0.06]" />
                          <button className="hover:text-blue-400 cursor-pointer">File</button>
                          <button className="hover:text-blue-400 cursor-pointer">Edit</button>
                        </div>
                      </div>
                      
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search in list..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-8 bg-[#0c0c0e] border border-white/[0.06] rounded-md pl-9 pr-3 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full border-collapse text-[11px] text-slate-300 font-sans table-fixed">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#16161a] border-b border-white/[0.08] text-slate-400 font-bold">
                            <th className="w-12 py-3 px-2 text-center border-r border-white/[0.04]"></th>
                            <th className="py-3 px-4 border-r border-white/[0.04] text-left">Post Information</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04]">Status</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04]">Category</th>
                            <th className="w-40 py-3 px-4 border-r border-white/[0.04]">Schedule</th>
                            <th className="w-20 py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {(searchTerm 
                            ? weekItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()))
                            : weekItems
                          ).slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => {
                            const statusStyle = getStatusColor(item.status);
                            return (
                              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group h-14">
                                <td className="py-2 px-2 text-center border-r border-white/[0.04] text-slate-600 font-mono">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className="py-2 px-4 border-r border-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                        {item.contentType === "Video" ? (
                                            <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Video className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
                                                <Image className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-white line-clamp-1">{item.title}</div>
                                            <div className="text-[10px] text-slate-500 line-clamp-1">{item.subtitle}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2 px-4 border-r border-white/[0.04]">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text} border-current/[0.1]`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {statusStyle.label}
                                    </span>
                                </td>
                                <td className="py-2 px-4 border-r border-white/[0.04]">
                                    <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-[10px] font-medium text-slate-400">
                                        {item.contentType}
                                    </span>
                                </td>
                                <td className="py-2 px-4 border-r border-white/[0.04]">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold">{item.dayOfWeek}</span>
                                        <span className="text-slate-500 font-mono text-[10px]">{item.timeSlot}</span>
                                    </div>
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <button 
                                        onClick={() => handleEditItemInitiate(item)}
                                        className="p-1.5 hover:bg-white/[0.06] rounded text-slate-500 hover:text-white transition-all cursor-pointer"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="bg-[#16161a] border-t border-white/[0.08] px-4 h-12 shrink-0 flex items-center justify-between">
                        <div className="text-[10px] text-slate-500">
                            Showing page {currentPage} of {Math.ceil(weekItems.length / pageSize) || 1}
                        </div>
                        <div className="flex gap-1">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={currentPage >= Math.ceil(weekItems.length / pageSize)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                            >
                                Next page
                            </button>
                        </div>
                    </div>
                  </div>
                )}

                {selectedTab === "datagrid" && (
                  /* PROFESSIONAL DATA GRID MODE */
                  <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
                    
                    {/* 1. TOP MENU BAR (File, Edit, View) + SEARCH */}
                    <div className="bg-[#16161a] border-b border-white/[0.06] flex items-center justify-between px-4 h-14 shrink-0">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs text-blue-100 font-medium font-sans">{getWeekRangeLabel(selectedWeek).range}</span>
                          </div>
                          <div className="text-xs font-mono text-slate-400 bg-[#0c0c0e] px-3 py-1.5 rounded border border-white/[0.04]">
                            Total Posts: <span className="text-white font-bold">{weekItems.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Type to search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-8 bg-[#0c0c0e] border border-white/[0.06] rounded-md pl-9 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* 2. MAIN TABLE CONTAINER */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full border-collapse text-xs text-slate-300 font-sans table-fixed">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#16161a] border-b border-white/[0.08] text-slate-400 font-bold">
                            <th className="w-12 py-3 px-2 text-center border-r border-white/[0.04]">#</th>
                            <th className="w-12 py-3 px-2 text-center border-r border-white/[0.04]">Pin</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04]">ថ្ងៃក្នុងសប្តាហ៍</th>
                            <th className="w-48 py-3 px-4 border-r border-white/[0.04]">ចំណងជើងផុស / Activity Title</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04]">ប្រភេទឯកសារ (Content)</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04]">ប្រភេទផុស (Post Type)</th>
                            <th className="w-40 py-3 px-4 border-r border-white/[0.04]">ផុសទៅកាន់ទំព័រ (Post to Page)</th>
                            <th className="w-32 py-3 px-4 border-r border-white/[0.04] text-center">ចន្លោះម៉ោង (Time Slot)</th>
                            <th className="w-28 py-3 px-4 border-r border-white/[0.04] text-center">Post by</th>
                            <th className="w-20 py-3 px-4 text-center">Actions</th>
                          </tr>
                          {/* Search/Filter Sub-header like the screenshot */}
                          <tr className="bg-[#111115] border-b border-white/[0.04]">
                            <td className="border-r border-white/[0.04]"></td>
                            <td className="border-r border-white/[0.04]"></td>
                            <td className="p-1 border-r border-white/[0.04]">
                              <select className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 text-xs text-slate-400 focus:outline-none">
                                <option>All</option>
                              </select>
                            </td>
                            <td className="p-1 border-r border-white/[0.04] relative">
                                <input type="text" className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 pr-5 text-xs text-slate-400 focus:outline-none" />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-600" />
                            </td>
                            <td className="p-1 border-r border-white/[0.04]">
                              <select className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 text-xs text-slate-400 focus:outline-none">
                                <option>All</option>
                              </select>
                            </td>
                            <td className="p-1 border-r border-white/[0.04]">
                              <select className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 text-xs text-slate-400 focus:outline-none">
                                <option>All</option>
                              </select>
                            </td>
                            <td className="p-1 border-r border-white/[0.04] relative">
                                <input type="text" className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 pr-5 text-xs text-slate-400 focus:outline-none" />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-600" />
                            </td>
                            <td className="p-1 border-r border-white/[0.04] relative">
                                <input type="text" className="w-full h-7 bg-[#0c0c0e] border border-white/[0.06] rounded px-1 pr-5 text-xs text-slate-400 focus:outline-none" />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-600" />
                            </td>
                            <td className="p-1 border-r border-white/[0.04]"></td>
                            <td></td>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {(() => {
                            const paginatedItems = (searchTerm 
                              ? weekItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()))
                              : weekItems
                            ).slice((currentPage - 1) * pageSize, currentPage * pageSize);

                            const contentCounts = Object.entries(
                              paginatedItems.reduce((acc, item) => {
                                const type = item.contentType || "Unknown";
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([type, count]) => `${count}${type}s`).join(", ");

                            return (
                              <>
                                {paginatedItems.map((item, idx) => {
                                  const targetPage = pages.find(p => p.id === item.pageId);
                                  
                                  return (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group h-12">
                                      <td className="py-2 px-2 text-center border-r border-white/[0.04] text-slate-500 font-mono text-xs">{(currentPage - 1) * pageSize + idx + 1}</td>
                                      <td className="py-2 px-2 text-center border-r border-white/[0.04]">
                                          <button className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer">
                                              <Star className="w-3.5 h-3.5" />
                                          </button>
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04] text-slate-400 text-center font-mono leading-tight">
                                          {(() => {
                                             const dayObj = daysOfWeek.find(d => d.key === item.dayOfWeek);
                                             const dIdx = daysOfWeek.findIndex(d => d.key === item.dayOfWeek);
                                             const dayDate = dIdx >= 0 ? getWeekRangeLabel(item.weekNumber || selectedWeek).dates[dIdx] : "";
                                             return (
                                               <>
                                                 <span className="block font-sans font-bold text-slate-300 text-xs">{dayObj?.kh.split(" ")[0] || item.dayOfWeek}</span>
                                                 {dayDate && <span className="text-[10px] opacity-75">{dayDate}</span>}
                                               </>
                                             );
                                          })()}
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04] text-slate-300 truncate max-w-[180px] text-xs" title={item.title}>
                                          {item.title}
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04] text-slate-400 font-mono text-xs truncate max-w-[120px]">
                                          {item.contentType}
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04]">
                                          <div className="flex items-center gap-2 text-xs">
                                              <div className={`w-1.5 h-1.5 rounded-full ${
                                                  item.postType === 'Posted' ? 'bg-emerald-500' :
                                                  item.postType === 'Scheduled' ? 'bg-blue-400' :
                                                  'bg-amber-400'
                                              }`} />
                                              <span className={
                                                   item.postType === 'Posted' ? 'text-emerald-500 font-medium' :
                                                   item.postType === 'Scheduled' ? 'text-blue-400 font-medium' :
                                                   'text-amber-400 font-medium'
                                              }>
                                                  {item.postType}
                                              </span>
                                          </div>
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04] text-slate-300 font-medium truncate max-w-[120px]">
                                          {targetPage?.name || item.subtitle || "N/A"}
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04] text-slate-400 text-center font-mono">
                                          {item.timeSlot}
                                      </td>
                                      <td className="py-2 px-4 border-r border-white/[0.04]">
                                          {item.createdBy ? (
                                            <div className="flex items-center gap-2" title={`${item.createdBy.name} (${item.createdBy.email})`}>
                                              {item.createdBy.avatar ? (
                                                <img
                                                  src={item.createdBy.avatar}
                                                  className="w-6 h-6 rounded-full border border-blue-500/30 object-cover shrink-0"
                                                  alt={item.createdBy.name}
                                                />
                                              ) : (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
                                                  <span className="text-[8px] font-bold text-white">
                                                    {item.createdBy.name?.charAt(0)?.toUpperCase() || "?"}
                                                  </span>
                                                </div>
                                              )}
                                              <span className="text-[10px] text-slate-300 font-sans font-semibold truncate max-w-[80px]">
                                                {item.createdBy.name?.split(" ")[0]}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <div className="w-6 h-6 rounded-full bg-slate-700/50 border border-white/10 flex items-center justify-center">
                                                <User className="w-3 h-3 text-slate-500" />
                                              </div>
                                              <span className="text-[10px] text-slate-600 font-sans">Unknown</span>
                                            </div>
                                          )}
                                      </td>
                                      <td className="py-2 px-4 text-center">
                                          <button 
                                              onClick={() => handleEditItemInitiate(item)}
                                              className="p-1 hover:bg-white/[0.06] rounded text-slate-500 hover:text-white transition-all cursor-pointer"
                                          >
                                              <MoreVertical className="w-4 h-4" />
                                          </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                
                                {/* TOTALS ROW like the screenshot */}
                                <tr className="bg-[#111115] border-y-2 border-white/[0.08] font-bold text-white h-12">
                                  <td className="py-2 px-2 text-center border-r border-white/[0.04] uppercase text-[10px]">Total</td>
                                  <td className="border-r border-white/[0.04]"></td>
                                  <td className="border-r border-white/[0.04]"></td>
                                  <td className="py-2 px-4 border-r border-white/[0.04] text-blue-400"></td>
                                  <td className="py-2 px-4 border-r border-white/[0.04] text-blue-400">{contentCounts}</td>
                                  <td className="py-2 px-4 border-r border-white/[0.04] text-blue-400">{paginatedItems.length} Posts</td>
                                  <td className="border-r border-white/[0.04]"></td>
                                  <td className="border-r border-white/[0.04]"></td>
                                  <td className="border-r border-white/[0.04]"></td>
                                  <td></td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* 3. PAGINATION FOOTER */}
                    {(() => {
                      const filteredItems = searchTerm 
                        ? weekItems.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()))
                        : weekItems;
                      const totalItems = filteredItems.length;
                      const totalPages = Math.ceil(totalItems / pageSize) || 1;
                      const startRecord = totalItems === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
                      const endRecord = Math.min(currentPage * pageSize, totalItems);

                      return (
                        <div className="bg-[#16161a] border-t border-white/[0.08] px-4 h-12 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5">
                                    <button 
                                      type="button"
                                      disabled={currentPage === 1}
                                      onClick={() => setCurrentPage(1)}
                                      className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                      title="ទំព័រដំបូង (First Page)"
                                    >
                                      <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                      type="button"
                                      disabled={currentPage === 1}
                                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                      className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                      title="ទំព័រមុន (Previous Page)"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="flex items-center gap-1 mx-2">
                                        <input 
                                          type="text" 
                                          value={currentPage} 
                                          readOnly 
                                          className="w-8 h-6 bg-[#0c0c0e] border border-white/[0.1] rounded text-center text-[10px] text-white" 
                                        />
                                        <span className="text-slate-500 text-[10px]">/ {totalPages}</span>
                                    </div>

                                    <button 
                                      type="button"
                                      disabled={currentPage >= totalPages}
                                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                      className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                      title="ទំព័របន្ទាប់ (Next Page)"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button 
                                      type="button"
                                      disabled={currentPage >= totalPages}
                                      onClick={() => setCurrentPage(totalPages)}
                                      className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                      title="ទំព័រចុងក្រោយ (Last Page)"
                                    >
                                      <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-[10px] text-slate-500">
                                    Records from {startRecord} to {endRecord} of {totalItems}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <select 
                                    value={pageSize}
                                    onChange={(e) => {
                                      setPageSize(Number(e.target.value));
                                      setCurrentPage(1);
                                    }}
                                    className="bg-[#0c0c0e] border border-white/[0.1] rounded h-6 px-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                >
                                    <option value={10}>10 rows per page</option>
                                    <option value={20}>20 rows per page</option>
                                    <option value={50}>50 rows per page</option>
                                </select>
                            </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedTab === "manager" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {/* Facebook Pages Management Panel */}
                    <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span>គ្រប់គ្រងទំព័រ Facebook Pages</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">បន្ថែម កែប្រែ ឬលុបទំព័រសម្រាប់រៀបចំផែនការ</p>
                        </div>
                        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-mono font-bold text-blue-400">
                          {pages.length} Pages
                        </span>
                      </div>

                      {/* Add New Page Form */}
                      <div className="flex gap-2 font-sans">
                        <input
                          type="text"
                          value={newPageName}
                          onChange={(e) => setNewPageName(e.target.value)}
                          placeholder="បញ្ចូលឈ្មោះទំព័រថ្មី (ឧ. Angkor Tech Page)..."
                          className="flex-1 px-3 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                        />
                        <button
                          onClick={handleAddPage}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-sans"
                        >
                          <Plus className="w-4 h-4" />
                          <span>បន្ថែម</span>
                        </button>
                      </div>

                      {/* Pages List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {pages.map(page => (
                          <div key={page.id} className="p-3 bg-[#16161a] border border-white/[0.04] rounded-xl flex items-center justify-between gap-3 font-sans">
                            {editingPageId === page.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingPageName}
                                  onChange={(e) => setEditingPageName(e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-[#111115] border border-blue-500 rounded-lg text-white"
                                />
                                <button
                                  onClick={() => handleSaveEditPage(page.id)}
                                  className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPageId(null)}
                                  className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs font-mono">
                                    {page.name.substring(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{page.name}</span>
                                    {page.isProtected && (
                                      <span className="text-[9px] text-amber-400 font-mono">Demo Page (Protected)</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingPageId(page.id);
                                      setEditingPageName(page.name);
                                    }}
                                    className="p-1.5 hover:bg-white/[0.06] text-blue-400 rounded-lg"
                                    title="កែឈ្មោះ"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePage(page.id)}
                                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                                    title="លុបទំព័រ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Platforms Management Panel */}
                    <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-purple-400" />
                            <span>គ្រប់គ្រងផ្លេតហ្វម Social Platforms</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">បន្ថែម កែប្រែ ឬលុបផ្លេតហ្វមសង្គម</p>
                        </div>
                        <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-mono font-bold text-purple-400">
                          {platforms.length} Platforms
                        </span>
                      </div>

                      {/* Add New Platform Form */}
                      <div className="flex gap-2 font-sans">
                        <input
                          type="text"
                          value={newPlatformName}
                          onChange={(e) => setNewPlatformName(e.target.value)}
                          placeholder="បញ្ចូលឈ្មោះផ្លេតហ្វមថ្មី (ឧ. Threads, Pinterest)..."
                          className="flex-1 px-3 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-sans"
                        />
                        <button
                          onClick={handleAddPlatform}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-sans"
                        >
                          <Plus className="w-4 h-4" />
                          <span>បន្ថែម</span>
                        </button>
                      </div>

                      {/* Platforms List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {platforms.map(platform => (
                          <div key={platform.id} className="p-3 bg-[#16161a] border border-white/[0.04] rounded-xl flex items-center justify-between gap-3 font-sans">
                            {editingPlatformId === platform.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingPlatformName}
                                  onChange={(e) => setEditingPlatformName(e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-[#111115] border border-purple-500 rounded-lg text-white"
                                />
                                <button
                                  onClick={() => handleSaveEditPlatform(platform.id)}
                                  className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPlatformId(null)}
                                  className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs font-mono">
                                    {platform.name.substring(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{platform.name}</span>
                                    {platform.isProtected && (
                                      <span className="text-[9px] text-amber-400 font-mono">Demo Platform (Protected)</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingPlatformId(platform.id);
                                      setEditingPlatformName(platform.name);
                                    }}
                                    className="p-1.5 hover:bg-white/[0.06] text-purple-400 rounded-lg"
                                    title="កែឈ្មោះ"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlatform(platform.id)}
                                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                                    title="លុបផ្លេតហ្វម"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WEEKLY SUMMARY STATS BOTTOM BAR & ACTIVE WEEK POSTS QUICK LIST */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* WEEKLY SUMMARY CARD */}
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-sm text-left space-y-4">
                    <div className="border-b border-white/[0.04] pb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                        ស្ថានភាពសង្ខេបប្រចាំសប្តាហ៍ {selectedWeekRange.rangeShort} (Weekly Summary Status)
                      </h3>
                      <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9.5px] font-bold text-emerald-400 font-mono">
                        Completion: {completionRate}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 font-medium font-sans">ចំនួនផែនការការងារ</span>
                        <strong className="text-xl font-black text-white font-mono mt-1">{totalTasks}</strong>
                      </div>
                      <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 font-medium font-sans">គម្រោងធ្វើជោគជ័យ</span>
                        <strong className="text-xl font-black text-emerald-400 font-mono mt-1">{completedTasks}</strong>
                      </div>
                      <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 font-medium font-sans">កំពុងរៀបចំ/អនុវត្ត</span>
                        <strong className="text-xl font-black text-amber-400 font-mono mt-1">{pendingTasks}</strong>
                      </div>
                      <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 font-medium font-sans">ម៉ោងការងារប្រហាក់ប្រហែល</span>
                        <strong className="text-xl font-black text-blue-400 font-mono mt-1">{mockWorkingHours}</strong>
                      </div>
                    </div>
                  </div>

                  {/* WEEKLY ACTIVITY QUICK LIST CARD */}
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
                    <div>
                      <div className="border-b border-white/[0.04] pb-2 flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                          គម្រោងផ្សាយប្រចាំសប្តាហ៍ {selectedWeekRange.rangeShort} ({weekItems.length} គម្រោង)
                        </h4>
                        <button
                          onClick={() => {
                            setEditingItemId(null);
                            setFormTitle("");
                            setFormSubType("");
                            setFormNotes("");
                            setFormDay("Monday");
                            setFormStatus("PLANNED");
                            setShowPostFormModal(true);
                          }}
                          className="text-[10px] text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>បន្ថែមគម្រោងការងារ</span>
                        </button>
                      </div>
                      
                      {weekItems.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-white/[0.04] rounded-xl text-slate-500 font-sans my-4">
                          <p className="text-[11px]">មិនទាន់មានគម្រោងផែនការការងារនៅក្នុងសប្តាហ៍នេះទេ!</p>
                        </div>
                      ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                          {weekItems.map(item => {
                            const targetPage = pages.find(p => p.id === item.pageId);
                            const pageName = targetPage?.name || item.subtitle;
                            const cStyle = getContentTypeStyle(item.contentType);
                            const pTypeStyle = getPostTypeStyle(item.postType);

                            return (
                              <div 
                                key={item.id}
                                className="p-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl flex items-center justify-between gap-3 hover:border-white/[0.12] transition-colors"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.2 bg-white/[0.06] text-slate-300 rounded font-mono">
                                      {item.timeSlot} - {item.dayOfWeek.substring(0,3)}
                                    </span>
                                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-bold ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
                                      {cStyle.icon} {cStyle.label}
                                    </span>
                                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-bold ${pTypeStyle.bg} ${pTypeStyle.text} ${pTypeStyle.border}`}>
                                      {item.postType}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 min-w-0">
                                    {pageName && (
                                      <span className="text-[10px] text-cyan-300 font-semibold truncate flex items-center gap-1">
                                        📄 {pageName}
                                      </span>
                                    )}
                                    {item.platformId && (
                                      <div className="flex flex-wrap gap-1">
                                        {item.platformId.split(",").map(pId => {
                                          const plat = platforms.find(pf => pf.id === pId);
                                          const pName = plat ? plat.name : pId;
                                          const pStyle = getPlatformStyle(pName);
                                          return (
                                            <span key={pId} className={`text-[8.5px] font-sans font-bold px-1.5 py-0.2 rounded-md border ${pStyle.badge}`} title={pName}>
                                              {pName}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleEditItemInitiate(item)}
                                    className="p-1 hover:bg-white/[0.06] text-blue-400 rounded-lg cursor-pointer"
                                    title="កែសម្រួល"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1 hover:bg-red-950/20 text-red-400 rounded-lg cursor-pointer"
                                    title="លុប"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {activeMasterView === "registry" && (
            /* MONTHLY PLAN REGISTRY - DATA TABLE VIEW */
            <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-6 shadow-xl text-left space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Table className="w-5 h-5 text-blue-400" />
                    <span>តារាងផែនការការងារប្រចាំខែ (Monthly Work Plans Registry)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">រាល់បញ្ជីផែនការខែដែលបានរៀបចំ និងរក្សាទុករួចរាល់។ បងអាចមើលលម្អិត, ប្តូរស្ថានភាព, បោះពុម្ព, និងនាំចេញជា CSV។</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 text-xs font-bold font-sans">
                      <th className="py-3 px-4">ខែផែនការ (Month Year)</th>
                      <th className="py-3 px-4 text-center">ស្ថានភាពអនុវត្ត (Status)</th>
                      <th className="py-3 px-4 text-center">ចំនួនគម្រោងសរុប (Total Items)</th>
                      <th className="py-3 px-4 text-center">បានអនុវត្តរួច (Completed)</th>
                      <th className="py-3 px-4 text-center">ភាគរយជោគជ័យ (Progress)</th>
                      <th className="py-3 px-4">កាលបរិច្ឆេទបង្កើត (Created At)</th>
                      <th className="py-3 px-4 text-right">សកម្មភាព (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-xs font-sans">
                    {months.map(m => {
                      const monthItemsList = items.filter(i => i.month === m.id || (!i.month && m.id === "2026-06"));
                      const totalM = monthItemsList.length;
                      const completedM = monthItemsList.filter(i => i.status === "COMPLETED").length;
                      const progressM = totalM > 0 ? Math.round((completedM / totalM) * 100) : 0;
                      
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm">{m.nameKh}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{m.name} | ID: {m.id}</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span 
                              onClick={() => handleToggleMonthStatus(m.id, m.status)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer select-none border inline-flex items-center gap-1.5 transition-all ${
                                m.status === "COMPLETED"
                                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20"
                              }`}
                              title="ចុចទីនេះដើម្បីប្តូរស្ថានភាពអនុវត្ត"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${m.status === "COMPLETED" ? "bg-emerald-400" : "bg-blue-400"}`} />
                              <span>{m.status === "COMPLETED" ? "🟢 ធ្វើរួចរាល់ (COMPLETED)" : "🔵 កំពុងអនុវត្ត (IN PROGRESS)"}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-white">{totalM}</td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">{completedM}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 justify-center max-w-[120px] mx-auto">
                              <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden border border-white/[0.03]">
                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressM}%` }} />
                              </div>
                              <span className="font-mono font-bold text-slate-300 min-w-[28px] text-right">{progressM}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono">
                            {new Date(m.createdAt || "2026-06-01").toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-4 px-4 text-right col-span-1">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMonthId(m.id);
                                  setActiveMasterView("calendar");
                                }}
                                className="px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/20 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                title="ចុចមើលលម្អិតប្រតិទិន"
                              >
                                View (មើល)
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMonthId(m.id);
                                  setIsExportMode(true);
                                  setActiveMasterView("calendar");
                                }}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                title="មើលប្លង់បោះពុម្ពផែនការខែនេះ"
                              >
                                Print (បោះពុម្ព)
                              </button>
                              <button
                                onClick={() => handleExportMonthToCSV(m.id, m.nameKh)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                title="នាំចេញទៅជា Excel/CSV"
                              >
                                CSV (នាំចេញ)
                              </button>
                              <button
                                onClick={() => handleDeleteMonthPlan(m.id, m.nameKh)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-605 hover:text-white text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer"
                                title="លុបខែនេះ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. CREATE NEXT MONTH DIALOG MODAL */}
      <AnimatePresence>
        {showCreateMonthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowCreateMonthModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111115] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-400" />
                  <span>បង្កើតផែនការការងារខែថ្មី (Create Month Plan)</span>
                </h3>
                <button 
                  onClick={() => setShowCreateMonthModal(false)}
                  className="p-1 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMonthPlan} className="space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">លេខសម្គាល់ខែ (Month Identifier - YYYY-MM) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. 2026-08"
                    value={newMonthId}
                    onChange={(e) => {
                      setNewMonthId(e.target.value);
                      const mParts = e.target.value.split("-");
                      if (mParts.length === 2) {
                        const yy = parseInt(mParts[0], 10);
                        const mm = parseInt(mParts[1], 10);
                        if (!isNaN(yy) && !isNaN(mm) && mm >= 1 && mm <= 12) {
                          const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                          const monthNamesKh = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
                          setNewMonthName(`${monthNamesEn[mm-1]} ${yy}`);
                          setNewMonthNameKh(`${monthNamesKh[mm-1]} ${yy}`);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block font-sans">ឈ្មោះខែ (English Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. August 2026"
                      value={newMonthName}
                      onChange={(e) => setNewMonthName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block font-sans">ឈ្មោះខែជាភាសាខ្មែរ (Khmer Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. សីហា ២០២៦"
                      value={newMonthNameKh}
                      onChange={(e) => setNewMonthNameKh(e.target.value)}
                      className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">ចម្លងគំរូកាលវិភាគពីខែ (Copy schedule template from):</label>
                  <select
                    value={newMonthCopyFrom}
                    onChange={(e) => setNewMonthCopyFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 font-sans"
                  >
                    <option value="">-- កុំចម្លង (Start Fresh empty) --</option>
                    {months.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nameKh} ({m.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9.5px] text-slate-500 leading-normal font-sans">ការជ្រើសរើសចម្លងនឹងនាំចូលរាល់សកម្មភាពផែនការផ្សាយទាំងអស់ពីខែមុន មករៀបចំជាជំហានដំបូងក្នុងខែថ្មីដោយស្វ័យប្រវត្ត។</p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/[0.04]">
                  <button
                    type="submit"
                    className="flex-1 py-1.8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer text-center font-sans"
                  >
                    បង្កើតផែនការខែថ្មី
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateMonthModal(false)}
                    className="px-4 py-1.8 bg-[#16161a] hover:bg-white/[0.05] border border-white/[0.06] text-slate-400 rounded-xl font-sans"
                  >
                    បដិសេធ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK VIEW ITEM DETAILS BACKDROP DIALOG MODAL */}
      <AnimatePresence>
        {viewingDetailItem && (() => {
          const cStyle = getStatusColor(viewingDetailItem.status);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setViewingDetailItem(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[#111115] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl text-left"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${cStyle.bg} ${cStyle.text}`}>
                    {cStyle.label}
                  </span>
                  
                  <button 
                    onClick={() => setViewingDetailItem(null)}
                    className="p-1 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{viewingDetailItem.title}</h3>
                    <p className="text-xs text-slate-500 font-sans mt-1">Subtitle/Page: <strong>{viewingDetailItem.subtitle || "ផ្សេងៗ"}</strong></p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] py-1 border-y border-white/[0.04]">
                    <div>
                      <span className="text-slate-500 block">ថ្ងៃអនុវត្ត (Day):</span>
                      <strong className="text-slate-200">{viewingDetailItem.dayOfWeek}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ចន្លោះម៉ោង (Time):</span>
                      <strong className="text-slate-200">{viewingDetailItem.timeSlot}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">ប្រភេទមាតិកា (File):</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${getContentTypeStyle(viewingDetailItem.contentType).bg} ${getContentTypeStyle(viewingDetailItem.contentType).text} ${getContentTypeStyle(viewingDetailItem.contentType).border}`}>
                        {getContentTypeStyle(viewingDetailItem.contentType).icon} {viewingDetailItem.contentType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">ប្រភេទផុស (Type):</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${getPostTypeStyle(viewingDetailItem.postType).bg} ${getPostTypeStyle(viewingDetailItem.postType).text} ${getPostTypeStyle(viewingDetailItem.postType).border}`}>
                        {viewingDetailItem.postType}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-white/[0.04] pt-2">
                      <span className="text-slate-500 block mb-1">ប្រព័ន្ធផ្សារភ្ជាប់ (Platforms):</span>
                      <div className="flex flex-wrap gap-1">
                        {viewingDetailItem.platformId ? viewingDetailItem.platformId.split(",").map(pId => {
                          const plat = platforms.find(pf => pf.id === pId);
                          const pName = plat ? plat.name : pId;
                          const pStyle = getPlatformStyle(pName);
                          return (
                            <span key={pId} className={`px-2 py-0.5 rounded-md border text-xs font-bold ${pStyle.badge}`}>
                              {pName}
                            </span>
                          );
                        }) : <span className="text-slate-500 text-xs">N/A</span>}
                      </div>
                    </div>
                  </div>

                  {viewingDetailItem.notes && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block font-semibold uppercase">កំណត់សម្គាល់បន្ថែម៖</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#16161a] p-3 rounded-xl border border-white/[0.04]">
                        {viewingDetailItem.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleEditItemInitiate(viewingDetailItem);
                        setViewingDetailItem(null);
                      }}
                      className="flex-1 py-1.8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                    >
                      កែប្រែព័ត៌មាន (Edit Plan)
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteItem(viewingDetailItem.id);
                        setViewingDetailItem(null);
                      }}
                      className="px-2.5 py-1.8 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-colors cursor-pointer"
                      title="លុបចោល"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ADD / EDIT PLAN POST DIALOG MODAL */}
      <AnimatePresence>
        {showPostFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPostFormModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#111115] border border-white/[0.08] rounded-2xl p-6 max-w-5xl w-[95%] md:w-[960px] relative z-10 shadow-2xl text-left space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-blue-400" />
                  <span>{editingItemId ? "កែសម្រួលផែនការការងារ (Edit Plan)" : "បន្ថែមការផុសថ្មី (Add New Post)"}</span>
                </h3>
                <button 
                  onClick={() => setShowPostFormModal(false)}
                  className="p-1.5 hover:bg-white/[0.05] rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto space-y-4 text-sm font-sans pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Basic Info */}
                  <div className="space-y-4">
                    {/* Item Title Input */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center">
                        <label htmlFor="form-plan-title-modal" className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">
                          ចំណងជើងផុស / Activity Title *
                        </label>
                        <MicButton onTranscribed={(t) => setFormTitle(prev => prev ? `${prev} ${t}` : t)} />
                      </div>
                      <input
                        id="form-plan-title-modal"
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="ឧ. វិធីសាស្ត្រលក់អនឡាញថ្មី..."
                        className="w-full px-4 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 transition-all font-sans"
                      />
                    </div>

                    {/* Content category details */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">
                        ក្រុមហ៊ុន / ស្ថាប័ន / Subtitle
                      </label>
                      <input
                        type="text"
                        value={formSubType}
                        onChange={(e) => setFormSubType(e.target.value)}
                        placeholder="ឧ. ABC Company, Internal, ផ្សេងៗ"
                        className="w-full px-4 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 transition-all font-sans"
                      />
                    </div>

                    {/* Dual option row: Post Type & Content Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ប្រភេទផុស (Post Type)</label>
                        <select
                          value={formPostType}
                          onChange={(e) => setFormPostType(e.target.value as any)}
                          className="w-full px-3 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          <option value="Posted">Posted (បានផុស)</option>
                          <option value="Scheduled">Scheduled (កាលវិភាគ)</option>
                          <option value="Draft">Draft (ព្រាងទុក)</option>
                          <option value="Idea">Idea (គំនិតថ្មី)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ប្រភេទឯកសារ (Content)</label>
                        <select
                          value={formContentType}
                          onChange={(e) => setFormContentType(e.target.value as any)}
                          className="w-full px-3 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          <option value="Video">Video (វីដេអូ)</option>
                          <option value="Poster">Poster (រូបភាព)</option>
                          <option value="Carousel">Carousel (ស្លាយ)</option>
                        </select>
                      </div>
                    </div>
                    {/* PLATFORM SELECTION WITH CRUD TOGGLE INLINE - MULTI SELECT! */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ប្រព័ន្ធផ្សារភ្ជាប់ (Platform)</label>
                        <button
                          type="button"
                          onClick={() => setShowPlatformManager(!showPlatformManager)}
                          className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer font-sans"
                        >
                          ⚙️ {showPlatformManager ? "បិទ" : "បន្ថែម"}
                        </button>
                      </div>

                      {showPlatformManager ? (
                        <div className="p-2.5 bg-[#0a0a0c] border border-white/[0.06] rounded-xl space-y-2 mb-1 font-sans">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newPlatformName}
                              onChange={(e) => setNewPlatformName(e.target.value)}
                              placeholder="ឈ្មោះ Platform..."
                              className="flex-1 px-3 py-1.5 text-xs bg-[#1a1a20] border border-white/[0.08] rounded-lg text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddPlatform}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              បន្ថែម
                            </button>
                          </div>
                          <div className="max-h-28 overflow-y-auto divide-y divide-white/[0.03] pt-1 pr-1">
                            {platforms.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-1 text-xs group">
                                {editingPlatformId === p.id ? (
                                  <div className="flex w-full gap-1 items-center">
                                    <input
                                      autoFocus
                                      value={editingPlatformName}
                                      onChange={e => setEditingPlatformName(e.target.value)}
                                      className="flex-1 bg-[#1a1a20] border border-white/10 px-2 py-1 rounded text-xs text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditPlatform(p.id)}
                                      className="text-green-400 p-1 cursor-pointer"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPlatformId(null)}
                                      className="text-slate-400 p-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-slate-300 truncate pr-2">{p.name}</span>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setEditingPlatformId(p.id); setEditingPlatformName(p.name); }}
                                        className="text-amber-400 hover:text-amber-300 cursor-pointer p-1 rounded hover:bg-amber-500/10 transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); handleDeletePlatform(p.id); }}
                                        className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Multi-platform selectable pills */}
                      <div className="bg-[#16161a] border border-white/[0.06] rounded-xl p-2.5 space-y-1.5 font-sans">
                        {platforms.length === 0 ? (
                          <span className="text-xs text-slate-650 italic block">មិនទាន់មាន Platform ទេ</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {platforms.map(p => {
                              const selectedList = formPlatformId ? formPlatformId.split(",") : [];
                              const isSelected = selectedList.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    let newList;
                                    if (isSelected) {
                                      newList = selectedList.filter(id => id !== p.id);
                                    } else {
                                      newList = [...selectedList, p.id];
                                    }
                                    setFormPlatformId(newList.join(","));
                                  }}
                                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-500/20 border-blue-500/50 text-[#00ebff]"
                                      : "bg-white/[0.02] border-white/[0.04] text-slate-400 hover:border-white/[0.08]"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#00ebff]" : "bg-slate-500"}`} />
                                  <span>{p.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Location & Schedule */}
                  <div className="space-y-4">
                    {/* PAGE SELECTION WITH CRUD TOGGLE INLINE */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ផុសទៅកាន់ទំព័រ (Facebook Page)</label>
                        <button
                          type="button"
                          onClick={() => setShowPageManager(!showPageManager)}
                          className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer font-sans"
                        >
                          ⚙️ {showPageManager ? "បិទ" : "បន្ថែម"}
                        </button>
                      </div>

                      {showPageManager ? (
                        <div className="p-2.5 bg-[#0a0a0c] border border-white/[0.06] rounded-xl space-y-2 mb-1 font-sans">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newPageName}
                              onChange={(e) => setNewPageName(e.target.value)}
                              placeholder="ឈ្មោះ Page ថ្មី..."
                              className="flex-1 px-3 py-1.5 text-xs bg-[#16161a] border border-white/[0.08] rounded-lg text-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddPage}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              បន្ថែម
                            </button>
                          </div>
                          <div className="max-h-28 overflow-y-auto divide-y divide-white/[0.03] pt-1 pr-1">
                            {pages.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-1 text-xs group">
                                {editingPageId === p.id ? (
                                  <div className="flex w-full gap-1 items-center">
                                    <input
                                      autoFocus
                                      value={editingPageName}
                                      onChange={e => setEditingPageName(e.target.value)}
                                      className="flex-1 bg-[#1a1a20] border border-white/10 px-2 py-1 rounded text-xs text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditPage(p.id)}
                                      className="text-green-400 p-1 cursor-pointer"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPageId(null)}
                                      className="text-slate-400 p-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-slate-300 truncate pr-2">{p.name}</span>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setEditingPageId(p.id); setEditingPageName(p.name); }}
                                        className="text-amber-400 hover:text-amber-300 cursor-pointer p-1 rounded hover:bg-amber-500/10 transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); handleDeletePage(p.id); }}
                                        className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <select
                        value={formPageId}
                        onChange={(e) => setFormPageId(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                      >
                        <option value="">-- ជ្រើសរើសទំព័រ Page --</option>
                        {pages.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dual option row: Day & Time slot */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ថ្ងៃក្នុងសប្តាហ៍</label>
                        <select
                          value={formDay}
                          onChange={(e) => setFormDay(e.target.value as any)}
                          className="w-full px-3 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          {daysOfWeek.map((d, idx) => {
                            const rangeData = getWeekRangeLabel(selectedWeek, selectedMonthId);
                            const dateStr = rangeData.dates[idx] || "";
                            const dateNum = dateStr.split("/")[0] || "";
                            return (
                              <option key={d.key} value={d.key}>
                                {d.kh} {dateNum ? `(${dateNum})` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ចន្លោះម៉ោង (Time Slot)</label>
                        <select
                          value={formTimeSlot}
                          onChange={(e) => setFormTimeSlot(e.target.value)}
                          className="w-full px-3 py-2.5 text-[#00ebff] font-bold text-sm bg-[#16161a] border border-white/[0.06] rounded-xl focus:outline-none focus:border-blue-500 transition-all font-sans"
                        >
                          {timeSlots.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Task state selection */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">ស្ថានភាពការងារ (Status)</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                      >
                        <option value="PLANNED">🔵 PLANNED (គ្រោងទុក)</option>
                        <option value="IN_PROGRESS">🟡 IN PROGRESS (កំពុងធ្វើ)</option>
                        <option value="COMPLETED">🟢 COMPLETED (រួចរាល់)</option>
                        <option value="OVERDUE">🔴 OVERDUE (ហួសកំណត់)</option>
                        <option value="CANCELLED">⚪ CANCELLED (លុបចោល)</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left pt-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-350 block font-sans uppercase tracking-wider">កំណត់សម្គាល់ (Notes)</label>
                        <MicButton onTranscribed={(t) => setFormNotes(prev => prev ? `${prev}\n${t}` : t)} />
                      </div>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="ព័ត៌មានបន្ថែម..."
                        className="w-full px-4 py-2.5 text-sm bg-[#16161a] border border-white/[0.06] rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-blue-500 h-28 transition-all font-sans resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-3 border-t border-white/[0.04] mt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-550/15 transition-all cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingItemId ? "រក្សារទុក (Save Updates)" : "រក្សារទុកផុសថ្មី (Save Post)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPostFormModal(false)}
                    className="px-8 py-3 bg-[#16161a] hover:bg-white/[0.05] border border-white/[0.06] text-slate-400 text-sm rounded-xl font-sans cursor-pointer"
                  >
                    បិទ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans max-h-screen overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-gradient-to-b from-[#1d1e28] via-[#161720] to-[#111218] border border-rose-500/30 w-full max-w-sm rounded-[24px] shadow-2xl shadow-rose-950/40 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                  </div>
                </div>
                <h3 className="text-white text-center font-black text-xl mb-2 tracking-wide font-sans">បញ្ជាក់ការលុប</h3>
                <p className="text-slate-100 text-sm font-medium text-center mb-6 leading-relaxed font-sans">
                  {confirmDialog.message}
                </p>
                <div className="flex gap-3 w-full font-sans">
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-100 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    បិទ
                  </button>
                  <button
                    type="button"
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    លុប
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertMsg && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans max-h-screen overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-gradient-to-b from-[#1a2234] via-[#141b2a] to-[#0f1420] border border-blue-500/30 w-full max-w-sm rounded-[24px] shadow-2xl shadow-blue-950/40 overflow-hidden"
            >
              <div className="p-6 text-center">
                <h3 className="text-white text-center font-black text-xl mb-2 tracking-wide font-sans">សារប្រាប់ (Notification)</h3>
                <p className="text-slate-100 text-sm font-medium text-center mb-6 leading-relaxed font-sans">
                  {alertMsg}
                </p>
                <div className="flex w-full font-sans">
                  <button
                    type="button"
                    onClick={() => setAlertMsg(null)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                  >
                    យល់ព្រម
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
