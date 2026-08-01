import { useState, useEffect, useRef, FormEvent } from "react";
import {
  Users, UserPlus, Trash2, Edit2, Shield, ShieldCheck,
  Save, X, RefreshCw, Database, Bell, CheckCircle2,
  AlertTriangle, Download, Upload, Server, Cpu, HardDrive, Activity,
  Eye, EyeOff, Search, BarChart2, Settings, Globe, FileText, Layers,
  Check, Send, Wifi, RotateCcw, Key, BellOff, Lock, ArrowLeft,
  Sliders, Grid, CheckSquare, Square, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchWithAuth } from "../lib/api.ts";
import { UserRole } from "../types";

/* ──────────────────────────────────────────────── */
interface Props { currentUser?: UserRole | null; onBack?: () => void; }

const ROLES = ["Admin", "Editor", "Moderator", "Analyst"] as const;
const ROLE_COLORS: Record<string, string> = {
  Admin:     "bg-rose-500/15 text-rose-300 border-rose-500/25",
  Editor:    "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Moderator: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Analyst:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
};

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
  category: "workplan" | "users" | "backup" | "pages";
}

export const PERMISSION_CATEGORIES = [
  { key: "workplan", label: "ផែនការការងារ (Work Plan)" },
  { key: "users",    label: "គ្រប់គ្រងអ្នកប្រើប្រាស់ (User & Role Management)" },
  { key: "backup",   label: "ការបម្រុងទុក (Backup & Database)" },
  { key: "pages",    label: "ទំព័រ & អូតូម៉ាត (Facebook & Auto-Reply)" },
] as const;

export const SYSTEM_PERMISSIONS: PermissionItem[] = [
  // WorkPlan
  { key: "workplan:view",   label: "មើលផែនការការងារ", description: "អាចមើល calendar, grid, statistics", category: "workplan" },
  { key: "workplan:create", label: "បង្កើតផែនការ",    description: "អាចបន្ថែម item ផែនការថ្មី", category: "workplan" },
  { key: "workplan:edit",   label: "កែប្រែផែនការ",    description: "អាចកែប្រែ item និង drag-and-drop", category: "workplan" },
  { key: "workplan:delete", label: "លុបផែនការ",      description: "អាចលុប item ផែនការចេញ", category: "workplan" },
  { key: "workplan:export", label: "នាំចេញ & បោះពុម្ព",  description: "អាច export PDF ឬ print report", category: "workplan" },

  // User Management
  { key: "users:view",      label: "មើលបញ្ជីអ្នកប្រើ", description: "អាចមើល user list និង role", category: "users" },
  { key: "users:create",    label: "បង្កើតអ្នកប្រើ",    description: "អាចបង្កើត account ថ្មី", category: "users" },
  { key: "users:edit_role", label: "កំណត់ Role & សិទ្ធិ", description: "អាចប្ដូរ Role និង assign permissions", category: "users" },
  { key: "users:delete",    label: "លុបអ្នកប្រើ",      description: "អាចលុប account ចេញពីប្រព័ន្ធ", category: "users" },

  // Backup & Restore
  { key: "backup:create",   label: "បង្កើត Backup",   description: "អាចបង្កើត database backup", category: "backup" },
  { key: "backup:restore",  label: "Restore Database",description: "អាច restore ទិន្នន័យពី backup", category: "backup" },
  { key: "backup:delete",   label: "លុប Backup",      description: "អាចលុប backup file", category: "backup" },

  // Pages & Comments
  { key: "pages:manage",    label: "គ្រប់គ្រងទំព័រ FB", description: "អាចភ្ជាប់ ឬប្ដូរ Facebook page", category: "pages" },
  { key: "comments:reply",  label: "ឆ្លើយតប Comment",  description: "អាចឆ្លើយតប និងកំណត់ Auto-Reply", category: "pages" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin:     SYSTEM_PERMISSIONS.map(p => p.key),
  Editor:    ["workplan:view", "workplan:create", "workplan:edit", "workplan:export", "comments:reply"],
  Moderator: ["workplan:view", "workplan:edit", "comments:reply", "users:view"],
  Analyst:   ["workplan:view", "workplan:export", "users:view"],
};

const TABS = [
  { key: "overview", label: "ទិដ្ឋភាពទូទៅ",     icon: BarChart2 },
  { key: "users",    label: "អ្នកប្រើប្រាស់",   icon: Users },
  { key: "matrix",   label: "តារាងសិទ្ធិ (Role Matrix)", icon: Grid },
  { key: "backup",   label: "ការបម្រុងទុក",      icon: Database },
  { key: "settings", label: "ការកំណត់ប្រព័ន្ធ", icon: Settings },
  { key: "notifs",   label: "ការជូនដំណឹង",       icon: Bell },
  { key: "sysinfo",  label: "ព័ត៌មានប្រព័ន្ធ",   icon: Server },
] as const;
type TabKey = typeof TABS[number]["key"];

interface BackupFile { filename: string; size: number; createdAt: string; }
interface Notif { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
interface PageSetting {
  pageName?: string; pageUsername?: string; category?: string;
  isAutoResponderEnabled?: boolean; backupSchedule?: string;
  isTelegramBackupEnabled?: boolean; telegramBotToken?: string; telegramChatId?: string;
  backupTime?: string; lastBackupTime?: string;
}

/* ──────────────────────────────────────────────── */
export default function SystemManagement({ currentUser, onBack }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [pageSetting, setPageSetting] = useState<PageSetting>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ ok: boolean; msg: string } | null>(null);

  // User form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [fName, setFName] = useState(""); const [fEmail, setFEmail] = useState("");
  const [fRole, setFRole] = useState<string>("Editor"); const [fDept, setFDept] = useState("");
  const [fPhone, setFPhone] = useState(""); const [fPwd, setFPwd] = useState("");
  const [fConfirmPwd, setFConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false); const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [searchUser, setSearchUser] = useState(""); const [filterRole, setFilterRole] = useState("All");

  // Permission Modal / Drawer state for specific user
  const [permUser, setPermUser] = useState<any | null>(null);
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Role Matrix state (Permissions preset per role)
  const [roleMatrix, setRoleMatrix] = useState<Record<string, string[]>>(DEFAULT_ROLE_PERMISSIONS);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Backup
  const [backupRunning, setBackupRunning] = useState(false);
  const [restoring, setRestoring] = useState("");
  const [telegramSending, setTelegramSending] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // System settings
  const [stPageName, setStPageName] = useState("");
  const [stCategory, setStCategory] = useState("");
  const [stAutoResp, setStAutoResp] = useState(false);
  const [stBackupSched, setStBackupSched] = useState("daily");
  const [stTelegramEnabled, setStTelegramEnabled] = useState(false);
  const [stTelegramToken, setStTelegramToken] = useState("");
  const [stTelegramChatId, setStTelegramChatId] = useState("");
  const [stBackupTime, setStBackupTime] = useState("03:00");
  const [savingSettings, setSavingSettings] = useState(false);
  const [showToken, setShowToken] = useState(false);

  /* helpers */
  const toast = (ok: boolean, msg: string) => { setAlert({ ok, msg }); setTimeout(() => setAlert(null), 3500); };
  const fmtBytes = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
  const fmtDate = (d: string) => d ? new Date(d).toLocaleString("km-KH", { dateStyle: "short", timeStyle: "short" }) : "—";

  /* ── Loaders ────────────────────────────────── */
  const loadUsers = async () => {
    setLoading(true);
    try {
      const r = await fetchWithAuth("/api/settings");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setUsers(Array.isArray(d.userRoles) ? d.userRoles : []);
      const ps: PageSetting = d.pageSettings || {};
      setPageSetting(ps);
      setStPageName(ps.pageName || "");
      setStCategory(ps.category || "");
      setStAutoResp(!!ps.isAutoResponderEnabled);
      setStBackupSched(ps.backupSchedule || "daily");
      setStTelegramEnabled(!!ps.isTelegramBackupEnabled);
      setStTelegramToken(ps.telegramBotToken || "");
      setStTelegramChatId(ps.telegramChatId || "");
      setStBackupTime(ps.backupTime || "03:00");
    } catch { toast(false, "មិនអាចទាញទិន្នន័យ!"); }
    finally { setLoading(false); }
  };

  const loadBackups = async () => {
    try {
      const r = await fetchWithAuth("/api/backup/list");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setBackups(Array.isArray(d) ? d : (d.backups || []));
    } catch { /* silent */ }
  };

  const loadNotifs = async () => {
    try {
      const r = await fetchWithAuth("/api/notifications");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setNotifs(Array.isArray(d) ? d : (d.notifications || []));
    } catch { /* silent */ }
  };

  useEffect(() => { loadUsers(); loadBackups(); loadNotifs(); }, []);

  /* ── User CRUD ──────────────────────────────── */
  const isSuperAdminUser = (u: any) => {
    if (!u) return false;
    const r = (u.role || "").toLowerCase();
    const n = (u.name || "").toLowerCase();
    const e = (u.email || "").toLowerCase();
    return (
      r === "super admin" ||
      n.includes("super admin") ||
      e === "admin@app.local" ||
      e === "seanglyad@gmail.com"
    );
  };

  const openCreate = () => {
    setEditing(null); setFName(""); setFEmail(""); setFRole("Editor");
    setFDept(""); setFPhone(""); setFPwd(""); setFConfirmPwd(""); setShowForm(true);
  };
  const openEdit = (u: any) => {
    if (isSuperAdminUser(u) && !isSuperAdminUser(currentUser)) {
      toast(false, "❌ គណនី Super Admin អាចកែប្រែបានតែដោយ Super Admin ផ្ទាល់ប៉ុណ្ណោះ!");
      return;
    }
    setEditing(u); setFName(u.name || ""); setFEmail(u.email || "");
    setFRole(u.role || "Editor"); setFDept(u.department || "");
    setFPhone(u.phoneNumber || ""); setFPwd(""); setFConfirmPwd(""); setShowForm(true);
  };
  const openAssignPerms = (u: any) => {
    if (isSuperAdminUser(u) && !isSuperAdminUser(currentUser)) {
      toast(false, "❌ គណនី Super Admin អាចកំណត់សិទ្ធិបានតែដោយ Super Admin ផ្ទាល់ប៉ុណ្ណោះ!");
      return;
    }
    setPermUser(u);
    if (isSuperAdminUser(u)) {
      setUserPerms(SYSTEM_PERMISSIONS.map(p => p.key));
    } else {
      const existing = Array.isArray(u.permissions) && u.permissions.length > 0
        ? u.permissions
        : (DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.Editor);
      setUserPerms(existing);
    }
  };

  const handleSavePerms = async () => {
    if (!permUser) return;
    setSavingPerms(true);
    try {
      const isSuper = isSuperAdminUser(permUser);
      const finalPerms = isSuper ? SYSTEM_PERMISSIONS.map(p => p.key) : userPerms;
      const r = await fetchWithAuth(`/api/settings/roles/${permUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: finalPerms })
      });
      if (!r.ok) throw new Error();
      toast(true, `✅ សិទ្ធិសម្រាប់ ${permUser.name} ត្រូវបានរក្សាទុក!`);
      setPermUser(null);
      loadUsers();
    } catch {
      toast(false, "❌ មិនអាចរក្សាទុកសិទ្ធិបានទេ!");
    } finally {
      setSavingPerms(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fEmail.trim()) return toast(false, "ត្រូវបញ្ចូលឈ្មោះ និងអ៊ីមែល!");
    if (!editing && !fPwd.trim()) return toast(false, "ត្រូវបញ្ចូលពាក្យសម្ងាត់!");
    if (fPwd && fPwd !== fConfirmPwd) return toast(false, "❌ ពាក្យសម្ងាត់មិនត្រូវគ្នា! សូមបញ្ចូលម្ដងទៀត។");
    if (fPwd && fPwd.length < 6) return toast(false, "❌ ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ!");

    setSaving(true);
    try {
      const isSuper = fRole === "Admin" || fName.toLowerCase().includes("super admin") || fEmail === "admin@app.local" || fEmail === "seanglyad@gmail.com";
      const payload: Record<string, any> = {
        name: fName, email: fEmail, role: fRole, department: fDept, phoneNumber: fPhone,
        permissions: isSuper 
          ? SYSTEM_PERMISSIONS.map(p => p.key)
          : (editing ? editing.permissions : (DEFAULT_ROLE_PERMISSIONS[fRole] || DEFAULT_ROLE_PERMISSIONS.Editor))
      };
      if (fPwd) payload.password = fPwd;
      const url = editing ? `/api/settings/roles/${editing.id}` : "/api/settings/roles";
      const r = await fetchWithAuth(url, { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed"); }
      toast(true, editing ? "✅ អ្នកប្រើត្រូវបានកែប្រែ!" : "✅ អ្នកប្រើថ្មីត្រូវបានបង្កើត!");
      setShowForm(false); loadUsers();
    } catch (err: any) { toast(false, "❌ " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: any) => {
    try {
      const r = await fetchWithAuth(`/api/settings/roles/${u.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast(true, `✅ ${u.name} ត្រូវបានលុប!`); setConfirmDel(null); loadUsers();
    } catch { toast(false, "❌ មិនអាចលុបអ្នកប្រើ!"); }
  };

  /* ── Toggle Matrix cell ──────────────────────── */
  const toggleMatrixCell = (role: string, permKey: string) => {
    setRoleMatrix(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permKey)
        ? current.filter(k => k !== permKey)
        : [...current, permKey];
      return { ...prev, [role]: updated };
    });
  };

  /* ── Backup actions ─────────────────────────── */
  const handleBackupNow = async () => {
    setBackupRunning(true);
    try {
      const r = await fetchWithAuth("/api/backup/now", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, `✅ Backup ជោគជ័យ! ${d.telegramSent ? "📨 បានផ្ញើ Telegram" : ""}`);
      loadBackups();
    } catch (err: any) { toast(false, "❌ " + (err.message || "Backup failed")); }
    finally { setBackupRunning(false); }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Restore database ពី ${filename}?\n⚠️ ទិន្នន័យបច្ចុប្បន្ននឹងត្រូវជំនួស!`)) return;
    setRestoring(filename);
    try {
      const r = await fetchWithAuth("/api/backup/restore", { method: "POST", body: JSON.stringify({ filename }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, "✅ Database ត្រូវបាន Restore! សូម Refresh ទំព័រ។");
    } catch (err: any) { toast(false, "❌ " + (err.message || "Restore failed")); }
    finally { setRestoring(""); }
  };

  const handleSendTelegram = async (filename: string) => {
    setTelegramSending(filename);
    try {
      const r = await fetchWithAuth(`/api/backup/${filename}/telegram`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, "✅ Backup ផ្ញើទៅ Telegram ជោគជ័យ!");
    } catch (err: any) { toast(false, "❌ " + (err.message || "Telegram send failed")); }
    finally { setTelegramSending(""); }
  };

  const handleUploadRestore = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res((fr.result as string).split(",")[1]);
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const r = await fetchWithAuth("/api/backup/upload-restore", {
        method: "POST",
        body: JSON.stringify({ fileData: base64, filename: file.name })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, "✅ Upload & Restore ជោគជ័យ! សូម Refresh ទំព័រ។");
      loadBackups();
    } catch (err: any) { toast(false, "❌ " + (err.message || "Upload failed")); }
    finally { setUploading(false); }
  };

  const handleTestTelegram = async () => {
    if (!stTelegramToken || !stTelegramChatId) return toast(false, "❌ បញ្ចូល Token & Chat ID ជាមុន!");
    setTestingTelegram(true);
    try {
      const r = await fetchWithAuth("/api/backup/test-telegram", {
        method: "POST",
        body: JSON.stringify({ token: stTelegramToken, chatId: stTelegramChatId })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, "✅ Telegram ប្រើការបានល្អ! សូមមើលសារ Telegram របស់អ្នក។");
    } catch (err: any) { toast(false, "❌ " + (err.message || "Test failed")); }
    finally { setTestingTelegram(false); }
  };

  /* ── System Settings save ───────────────────── */
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const r = await fetchWithAuth("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          pageName: stPageName, category: stCategory,
          isAutoResponderEnabled: stAutoResp, backupSchedule: stBackupSched,
          isTelegramBackupEnabled: stTelegramEnabled,
          telegramBotToken: stTelegramToken, telegramChatId: stTelegramChatId,
          backupTime: stBackupTime
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(true, "✅ ការកំណត់ប្រព័ន្ធត្រូវបានរក្សាទុក!");
      setPageSetting(d.pageSettings || pageSetting);
    } catch (err: any) { toast(false, "❌ " + (err.message || "Save failed")); }
    finally { setSavingSettings(false); }
  };

  /* ── Notifications ──────────────────────────── */
  const markAllRead = async () => {
    try {
      await fetchWithAuth("/api/notifications/read-all", { method: "POST" });
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      toast(true, "✅ ការជូនដំណឹងទាំងអស់ត្រូវបានអាន!");
    } catch { toast(false, "❌ បរាជ័យ!"); }
  };

  /* ── Computed ────────────────────────────────── */
  const filtered = users.filter(u =>
    (filterRole === "All" || u.role === filterRole) &&
    (!searchUser || u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
  );
  const unread = notifs.filter(n => !n.isRead).length;
  const stats = [
    { label: "អ្នកប្រើប្រាស់", val: users.length, icon: Users, grad: "from-blue-500 to-indigo-600", border: "border-blue-500/20 bg-blue-500/[0.06]" },
    { label: "Backup Files", val: backups.length, icon: Database, grad: "from-emerald-500 to-teal-600", border: "border-emerald-500/20 bg-emerald-500/[0.06]" },
    { label: "ការជូនដំណឹង", val: notifs.length, icon: Bell, grad: "from-violet-500 to-purple-600", border: "border-violet-500/20 bg-violet-500/[0.06]" },
    { label: "មិនទាន់អាន", val: unread, icon: BellOff, grad: "from-amber-500 to-orange-500", border: "border-amber-500/20 bg-amber-500/[0.06]" },
    { label: "Admin Users", val: users.filter(u => u.role === "Admin").length, icon: ShieldCheck, grad: "from-rose-500 to-pink-600", border: "border-rose-500/20 bg-rose-500/[0.06]" },
    { label: "Backup ចុងក្រោយ", val: pageSetting.lastBackupTime ? fmtDate(pageSetting.lastBackupTime) : "N/A", icon: HardDrive, grad: "from-cyan-500 to-sky-600", border: "border-cyan-500/20 bg-cyan-500/[0.06]" },
  ];

  /* ═══════════════════════════════════════════════ RENDER */
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-200 font-sans">

      {/* Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-bold shadow-2xl ${
              alert.ok ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-300" : "bg-rose-950/95 border-rose-500/30 text-rose-300"
            }`}>
            {alert.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {alert.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0f0f13]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button type="button" onClick={onBack}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer group">
                <ArrowLeft className="w-4 h-4 text-violet-400 group-hover:-translate-x-1 transition-transform" />
                <span>ត្រឡប់ទៅទំព័រដើម</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">ការគ្រប់គ្រងប្រព័ន្ធ</h1>
              <p className="text-[10px] text-slate-500">System Management Console · Work Plan App v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Online
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 py-5 flex gap-5">

        {/* Sidebar */}
        <aside className="w-56 shrink-0 space-y-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                  active ? "bg-violet-600/20 border border-violet-500/30 text-violet-300" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent"
                }`}>
                <Icon className={`w-4 h-4 ${active ? "text-violet-400" : "text-slate-500"}`} />
                {t.label}
                {t.key === "notifs" && unread > 0 && (
                  <span className="ml-auto bg-amber-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
                )}
              </button>
            );
          })}

          {onBack && (
            <div className="pt-4 border-t border-white/[0.06] mt-4">
              <button type="button" onClick={onBack}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer text-left">
                <ArrowLeft className="w-4 h-4 text-rose-400" />
                <span>ចាកចេញទៅទំព័រដើម</span>
              </button>
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>

              {/* ═══ OVERVIEW ══════════════════════════════════════════ */}
              {tab === "overview" && (
                <div className="space-y-5">
                  <h2 className="text-sm font-bold text-white">ទិដ្ឋភាពទូទៅ (System Overview)</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.div key={s.label} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          className={`p-5 rounded-2xl border ${s.border}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
                              <p className={`text-2xl font-extrabold mt-1.5 font-mono text-transparent bg-clip-text bg-gradient-to-r ${s.grad}`}>{s.val}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.grad}`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Role distribution */}
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-400" /> ការចែកចាយ Role
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {ROLES.map(role => {
                        const cnt = users.filter(u => u.role === role).length;
                        const pct = users.length ? Math.round((cnt / users.length) * 100) : 0;
                        const colors: Record<string, string> = { Admin: "bg-rose-500", Editor: "bg-blue-500", Moderator: "bg-amber-500", Analyst: "bg-emerald-500" };
                        return (
                          <div key={role} className="space-y-2 text-center">
                            <div className="w-full bg-[#1a1a20] rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-700 ${colors[role]}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-sm font-bold text-white">{cnt} <span className="text-xs text-slate-500 font-normal">នាក់</span></p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" /> សកម្មភាពរហ័ស
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "បង្កើតអ្នកប្រើ", icon: UserPlus, cls: "text-blue-400 bg-blue-500/10 border-blue-500/20", fn: () => { setTab("users"); setTimeout(openCreate, 300); } },
                        { label: "តារាងសិទ្ធិ (Matrix)", icon: Grid, cls: "text-violet-400 bg-violet-500/10 border-violet-500/20", fn: () => setTab("matrix") },
                        { label: "Backup ឥឡូវ", icon: Database, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", fn: handleBackupNow },
                        { label: "ការកំណត់", icon: Settings, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", fn: () => setTab("settings") },
                      ].map(a => { const Icon = a.icon; return (
                        <button key={a.label} type="button" onClick={a.fn}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${a.cls}`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-[11px] font-semibold">{a.label}</span>
                        </button>
                      ); })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ USER MANAGEMENT ════════════════════════════════════ */}
              {tab === "users" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">គ្រប់គ្រងអ្នកប្រើប្រាស់ (Users)</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">{users.length} គណនី · {users.filter(u => u.role === "Admin").length} Admin</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setTab("matrix")}
                        className="flex items-center gap-2 px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold rounded-xl hover:bg-violet-500/15 cursor-pointer transition-all">
                        <Grid className="w-3.5 h-3.5" /> តារាងសិទ្ធិ (Role Matrix)
                      </button>
                      <button type="button" onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer active:scale-95 transition-all">
                        <UserPlus className="w-3.5 h-3.5" /> បង្កើតថ្មី
                      </button>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type="text" placeholder="ស្វែងរកឈ្មោះ / Email..." value={searchUser} onChange={e => setSearchUser(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 w-52" />
                    </div>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                      className="px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer">
                      <option value="All">Role ទាំងអស់</option>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <button type="button" onClick={loadUsers}
                      className="p-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer">
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-[#16161a]">
                          {["អ្នកប្រើ", "Email", "Role", "សិទ្ធិ (Permissions)", "នាយកដ្ឋាន", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-600">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 opacity-40" /><p>Loading...</p>
                          </td></tr>
                        ) : filtered.length === 0 ? (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-600">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-20" /><p>គ្មានអ្នកប្រើ</p>
                          </td></tr>
                        ) : filtered.map((u, i) => {
                          const userPermList: string[] = Array.isArray(u.permissions) && u.permissions.length > 0
                            ? u.permissions
                            : (DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.Editor);
                          const isFullAccess = userPermList.length === SYSTEM_PERMISSIONS.length;

                          return (
                            <motion.tr key={u.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-all">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  {u.avatar
                                    ? <img src={u.avatar} className="w-7 h-7 rounded-lg border border-white/[0.08] object-cover" alt={u.name} />
                                    : <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">{u.name?.charAt(0)?.toUpperCase()}</div>
                                  }
                                  <span className="font-semibold text-slate-200">{u.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] || ROLE_COLORS.Editor}`}>{u.role}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                    isFullAccess
                                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                      : "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                  }`}>
                                    {isFullAccess ? "Full Access" : `${userPermList.length}/${SYSTEM_PERMISSIONS.length} សិទ្ធិ`}
                                  </span>
                                  {(!isSuperAdminUser(u) || isSuperAdminUser(currentUser)) && (
                                    <button type="button" onClick={() => openAssignPerms(u)}
                                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[10px] font-semibold border border-white/[0.06] flex items-center gap-1 cursor-pointer transition-all">
                                      <Sliders className="w-3 h-3 text-violet-400" />
                                      <span>កំណត់សិទ្ធិ</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-[11px]">{u.department || "—"}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  {(!isSuperAdminUser(u) || isSuperAdminUser(currentUser)) && (
                                    <button type="button" onClick={() => openEdit(u)}
                                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer" title="Edit Profile">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {!isSuperAdminUser(u) && (
                                    <button type="button" onClick={() => setConfirmDel(u)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer" title="Delete User">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 border-t border-white/[0.04] bg-[#16161a] text-[10px] text-slate-600 flex items-center justify-between">
                      <span>បង្ហាញ <span className="text-slate-400 font-bold">{filtered.length}</span> / {users.length} នាក់</span>
                      <span>{users.filter(u => u.role === "Admin").length} Admin · {users.filter(u => u.role === "Editor").length} Editor · {users.filter(u => u.role === "Moderator").length} Moderator · {users.filter(u => u.role === "Analyst").length} Analyst</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ROLE & PERMISSION MATRIX ═══════════════════════════ */}
              {tab === "matrix" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white">តារាងកំណត់សិទ្ធិ (Role & Permission Matrix)</h2>
                      <p className="text-xs text-slate-500 mt-0.5">កំណត់សិទ្ធិលំនាំដើម (Default Presets) តាមប្រភេទ Role នីមួយៗ</p>
                    </div>
                    <button type="button" onClick={() => toast(true, "✅ កំណត់ Role Matrix រក្សាទុកក្នុង Memory")}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all">
                      <Save className="w-3.5 h-3.5" /> រក្សាទុក Matrix
                    </button>
                  </div>

                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-[#16161a]">
                          <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-1/3">សិទ្ធិក្នុងប្រព័ន្ធ (Permission)</th>
                          {ROLES.map(r => (
                            <th key={r} className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider">
                              <span className={`px-2 py-0.5 rounded-lg border ${ROLE_COLORS[r]}`}>{r}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_CATEGORIES.map(cat => {
                          const catPerms = SYSTEM_PERMISSIONS.filter(p => p.category === cat.key);
                          return (
                            <>
                              <tr key={cat.key} className="bg-[#141418] border-b border-white/[0.04]">
                                <td colSpan={5} className="px-4 py-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                                  📌 {cat.label}
                                </td>
                              </tr>
                              {catPerms.map(p => (
                                <tr key={p.key} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-all">
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-slate-200 text-sm">{p.label}</p>
                                    <p className="text-xs text-slate-500 font-mono">{p.description} · <span className="text-slate-600">{p.key}</span></p>
                                  </td>
                                  {ROLES.map(r => {
                                    const isChecked = (roleMatrix[r] || []).includes(p.key);
                                    return (
                                      <td key={r} className="px-4 py-3 text-center">
                                        <button type="button" onClick={() => toggleMatrixCell(r, p.key)}
                                          className={`w-6 h-6 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                            isChecked
                                              ? "bg-violet-600 border-violet-500 text-white"
                                              : "bg-[#18181f] border-white/[0.08] text-slate-600 hover:border-slate-400"
                                          }`}>
                                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ═══ BACKUP ═════════════════════════════════════════════ */}
              {tab === "backup" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-white">ការបម្រុងទុក (Backup Management)</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pageSetting.lastBackupTime ? `Backup ចុងក្រោយ: ${fmtDate(pageSetting.lastBackupTime)}` : "មិនទាន់មាន Backup ណាមួយ"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input ref={uploadRef} type="file" accept=".db,.sql" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadRestore(f); e.target.value = ""; }} />
                      <button type="button" onClick={() => uploadRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold rounded-xl hover:bg-violet-500/15 transition-all cursor-pointer disabled:opacity-50">
                        <Upload className={`w-3.5 h-3.5 ${uploading ? "animate-pulse" : ""}`} />
                        {uploading ? "Uploading..." : "Upload & Restore"}
                      </button>
                      <button type="button" onClick={handleBackupNow} disabled={backupRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-50 active:scale-95 transition-all">
                        <Database className={`w-3.5 h-3.5 ${backupRunning ? "animate-spin" : ""}`} />
                        {backupRunning ? "Backup..." : "Backup ឥឡូវ"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] bg-[#16161a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">Backup Files ({backups.length})</span>
                      </div>
                      <button type="button" onClick={loadBackups} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {backups.length === 0 ? (
                      <div className="py-16 text-center text-slate-600">
                        <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">គ្មាន Backup ណាមួយ</p>
                        <p className="text-[11px] mt-1">ចុច "Backup ឥឡូវ" ដើម្បីបង្កើត backup ដំបូង</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.03]">
                        {backups.map((b, i) => (
                          <motion.div key={b.filename} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-200 font-mono">{b.filename}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{fmtBytes(b.size)} · {fmtDate(b.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a href={`/api/backup/download?file=${b.filename}`}
                                className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all" title="ទាញយក">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button type="button" onClick={() => handleSendTelegram(b.filename)}
                                disabled={telegramSending === b.filename}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer disabled:opacity-50" title="ផ្ញើ Telegram">
                                {telegramSending === b.filename ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              </button>
                              <button type="button" onClick={() => handleRestore(b.filename)}
                                disabled={restoring === b.filename}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50" title="Restore">
                                {restoring === b.filename ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              </button>
                              <button type="button" onClick={async () => {
                                if (!confirm("លុប backup file នេះ?")) return;
                                const r = await fetchWithAuth(`/api/backup/${b.filename}`, { method: "DELETE" });
                                if (r.ok) { toast(true, "✅ Backup ត្រូវបានលុប!"); loadBackups(); }
                                else toast(false, "❌ លុបបរាជ័យ!");
                              }}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer" title="លុប">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ SYSTEM SETTINGS ════════════════════════════════════ */}
              {tab === "settings" && (
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">ការកំណត់ប្រព័ន្ធ (System Settings)</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">កំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ Backup · Telegram · Auto-Responder</p>
                    </div>
                    <button type="submit" disabled={savingSettings}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer disabled:opacity-60 active:scale-95 transition-all">
                      <Save className={`w-3.5 h-3.5 ${savingSettings ? "animate-pulse" : ""}`} />
                      {savingSettings ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
                    </button>
                  </div>

                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" /> ការកំណត់ទូទៅ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">ឈ្មោះប្រព័ន្ធ</label>
                        <input value={stPageName} onChange={e => setStPageName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/40 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">ប្រភេទ / Category</label>
                        <input value={stCategory} onChange={e => setStCategory(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/40 transition-all" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-[#16161a] rounded-xl border border-white/[0.04]">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Auto-Responder</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">ឆ្លើយតបស្វ័យប្រវត្តទៅកាន់ Comment</p>
                      </div>
                      <button type="button" onClick={() => setStAutoResp(p => !p)}
                        className={`w-12 h-6 rounded-full transition-all cursor-pointer flex items-center px-1 ${stAutoResp ? "bg-emerald-500 justify-end" : "bg-[#2a2a30] justify-start"}`}>
                        <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" /> ការតំឡើង Backup
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">កាលវិភាគ Backup</label>
                        <select value={stBackupSched} onChange={e => setStBackupSched(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer">
                          <option value="hourly">រៀងរាល់ម៉ោង (Hourly)</option>
                          <option value="daily">រៀងរាល់ថ្ងៃ (Daily)</option>
                          <option value="weekly">រៀងរាល់សប្តាហ៍ (Weekly)</option>
                          <option value="monthly">រៀងរាល់ខែ (Monthly)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">ម៉ោង Backup</label>
                        <input type="time" value={stBackupTime} onChange={e => setStBackupTime(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/40" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-400" /> Telegram Backup
                      </h3>
                      <button type="button" onClick={() => setStTelegramEnabled(p => !p)}
                        className={`w-12 h-6 rounded-full transition-all cursor-pointer flex items-center px-1 ${stTelegramEnabled ? "bg-blue-500 justify-end" : "bg-[#2a2a30] justify-start"}`}>
                        <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                      </button>
                    </div>

                    <div className={`space-y-4 transition-all ${stTelegramEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Telegram Bot Token</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input type={showToken ? "text" : "password"} value={stTelegramToken} onChange={e => setStTelegramToken(e.target.value)}
                            placeholder="123456:ABC-DEF..."
                            className="w-full pl-9 pr-10 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500/40" />
                          <button type="button" onClick={() => setShowToken(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Chat ID</label>
                        <input value={stTelegramChatId} onChange={e => setStTelegramChatId(e.target.value)} placeholder="-100123456789"
                          className="w-full px-3 py-2.5 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500/40" />
                      </div>
                      <button type="button" onClick={handleTestTelegram} disabled={testingTelegram}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold rounded-xl hover:bg-blue-500/15 transition-all cursor-pointer disabled:opacity-50">
                        {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                        {testingTelegram ? "Testing..." : "Test Telegram Connection"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ═══ NOTIFICATIONS ══════════════════════════════════════ */}
              {tab === "notifs" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">ការជូនដំណឹង (Notifications)</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {unread > 0 ? <span className="text-amber-400 font-bold">{unread} មិនទាន់អាន</span> : "ទាំងអស់ត្រូវបានអានហើយ"}
                        {" · "}{notifs.length} សរុប
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={loadNotifs}
                        className="p-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      {unread > 0 && (
                        <button type="button" onClick={markAllRead}
                          className="flex items-center gap-2 px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold rounded-xl hover:bg-violet-500/15 cursor-pointer transition-all">
                          <Check className="w-3.5 h-3.5" /> អានទាំងអស់
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#111115] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {notifs.length === 0 ? (
                      <div className="py-16 text-center text-slate-600">
                        <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">គ្មានការជូនដំណឹង</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.03] max-h-[560px] overflow-y-auto">
                        {notifs.map((n, i) => {
                          const iconCls = n.type === "error" ? "bg-rose-500/15 text-rose-400" : n.type === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400";
                          return (
                            <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                              className={`px-5 py-4 flex items-start gap-4 ${!n.isRead ? "bg-blue-500/[0.025]" : "opacity-55"}`}>
                              <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
                                {n.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-200">{n.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-slate-600 mt-1 font-mono">{fmtDate(n.createdAt)}</p>
                              </div>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0 animate-pulse" />}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ SYSTEM INFO ════════════════════════════════════════ */}
              {tab === "sysinfo" && (
                <div className="space-y-5">
                  <h2 className="text-sm font-bold text-white">ព័ត៌មានប្រព័ន្ធ (System Information)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Tech Stack", icon: Layers, color: "text-sky-400", items: [
                        ["Frontend", "React 18 + TypeScript + Vite"],
                        ["Styling", "Tailwind CSS + Motion (Framer)"],
                        ["Backend", "Express.js + TSX"],
                        ["Database", "SQLite · Drizzle ORM"],
                        ["Auth", "Firebase Auth + Local JWT"],
                        ["AI", "Google Gemini 1.5 Flash"],
                      ]},
                      { title: "API Endpoints", icon: Globe, color: "text-violet-400", items: [
                        ["Users CRUD", "/api/settings/roles"],
                        ["Backup", "/api/backup/*"],
                        ["Work Plan", "/api/workplan/*"],
                        ["Notifications", "/api/notifications"],
                        ["Settings", "/api/settings"],
                        ["Facebook", "/api/auth/facebook/*"],
                      ]},
                      { title: "System Modules", icon: Cpu, color: "text-emerald-400", items: [
                        ["Work Plan Calendar", "Weekly + Monthly view"],
                        ["DataGrid", "Paginated + Search + Filter"],
                        ["System Dashboard", "KPI + Charts"],
                        ["System Management", "This page (fully functional)"],
                        ["Export/Print", "PDF ready reports"],
                        ["Backup Manager", "Auto + Manual + Telegram"],
                      ]},
                      { title: "Configuration", icon: Lock, color: "text-amber-400", items: [
                        ["Port", "3000"],
                        ["Database", "local.db (SQLite)"],
                        ["Backup Dir", "./backups/"],
                        ["Language", "ខ្មែរ + English"],
                        ["Timezone", "UTC+7 (Phnom Penh)"],
                        ["Version", "v2.0.0 Stable"],
                      ]},
                    ].map(card => { const Icon = card.icon; return (
                      <div key={card.title} className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5">
                        <h3 className={`text-xs font-bold mb-4 flex items-center gap-2 ${card.color}`}>
                          <Icon className="w-4 h-4" /> {card.title}
                        </h3>
                        <div className="space-y-2.5">
                          {card.items.map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs gap-4">
                              <span className="text-slate-500 shrink-0 font-medium">{k}</span>
                              <span className="text-slate-300 text-right font-mono text-[11px]">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ); })}
                  </div>
                  <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Work Plan Console · v2.0.0</p>
                      <p className="text-xs text-slate-500 mt-0.5">ប្រព័ន្ធគ្រប់គ្រងផែនការការងារ · React + Express + SQLite</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Stable
                    </span>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ═══ PERMISSION DRAWER / MODAL FOR SPECIFIC USER ══════════════════════ */}
      <AnimatePresence>
        {permUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPermUser(null)}>
            <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
              className="bg-[#111116] border border-white/[0.08] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] bg-[#16161a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>កំណត់សិទ្ធិប្រើប្រាស់ (User Permissions)</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase ${ROLE_COLORS[permUser.role]}`}>{permUser.role}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500">{permUser.name} ({permUser.email})</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPermUser(null)}
                  className="p-1.5 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white cursor-pointer transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Presets Bar */}
              <div className="px-6 py-2.5 bg-[#141419] border-b border-white/[0.04] flex items-center justify-between gap-2 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">សិទ្ធិជ្រើសរើស: <span className="text-violet-300 font-mono">{userPerms.length} / {SYSTEM_PERMISSIONS.length}</span></span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setUserPerms(SYSTEM_PERMISSIONS.map(p => p.key))}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-slate-300 font-semibold cursor-pointer">
                    គ្រប់សិទ្ធិ (Select All)
                  </button>
                  <button type="button" onClick={() => setUserPerms(DEFAULT_ROLE_PERMISSIONS[permUser.role] || DEFAULT_ROLE_PERMISSIONS.Editor)}
                    className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-[10px] text-violet-300 font-semibold border border-violet-500/20 cursor-pointer">
                    តាម Role ({permUser.role})
                  </button>
                  <button type="button" onClick={() => setUserPerms([])}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-300 font-semibold cursor-pointer">
                    លុបទាំងអស់
                  </button>
                </div>
              </div>

              {/* Permission List Categories */}
              <div className="p-6 overflow-y-auto space-y-5">
                {PERMISSION_CATEGORIES.map(cat => {
                  const catPerms = SYSTEM_PERMISSIONS.filter(p => p.category === cat.key);
                  return (
                    <div key={cat.key} className="space-y-2">
                      <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        {cat.label}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catPerms.map(p => {
                          const isLockedAdmin = isSuperAdminUser(permUser);
                          const isSelected = isLockedAdmin || userPerms.includes(p.key);
                          return (
                            <div key={p.key}
                              onClick={() => {
                                if (isLockedAdmin) return;
                                setUserPerms(prev => isSelected ? prev.filter(k => k !== p.key) : [...prev, p.key]);
                              }}
                              className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                isLockedAdmin 
                                  ? "cursor-not-allowed opacity-90 bg-violet-500/[0.04] border-violet-500/20 text-slate-200"
                                  : isSelected
                                    ? "bg-violet-500/[0.08] border-violet-500/30 text-slate-200 cursor-pointer"
                                    : "bg-[#16161b] border-white/[0.04] text-slate-400 hover:border-white/[0.1] cursor-pointer"
                              }`}>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 shrink-0 ${
                                isSelected ? "bg-violet-600 border-violet-500 text-white" : "border-white/20 bg-black/20"
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                                  <span>{p.label}</span>
                                  {isLockedAdmin && <span className="text-[9px] text-violet-400 font-normal ml-1">(Locked)</span>}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-white/[0.06] bg-[#16161a] flex gap-3 shrink-0">
                <button type="button" onClick={() => setPermUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-xs font-bold cursor-pointer hover:text-white transition-all">
                  បោះបង់
                </button>
                <button type="button" onClick={handleSavePerms} disabled={savingPerms}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all">
                  <Save className={`w-3.5 h-3.5 ${savingPerms ? "animate-pulse" : ""}`} />
                  {savingPerms ? "កំពុងរក្សាទុក..." : "រក្សាទុកសិទ្ធិ"}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ USER FORM MODAL ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
              className="bg-[#111116] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-white/[0.06] bg-[#16161a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{editing ? "កែប្រែអ្នកប្រើ" : "បង្កើតអ្នកប្រើថ្មី"}</p>
                    <p className="text-[10px] text-slate-500">{editing ? `Editing: ${editing.name}` : "New User Account"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white cursor-pointer transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { label: "ឈ្មោះ *", val: fName, set: setFName, type: "text", ph: "Full Name" },
                    { label: "Email *", val: fEmail, set: setFEmail, type: "email", ph: "user@example.com" },
                    { label: "នាយកដ្ឋាន", val: fDept, set: setFDept, type: "text", ph: "e.g. Marketing" },
                    { label: "ទូរស័ព្ទ", val: fPhone, set: setFPhone, type: "tel", ph: "+855 xx xxx xxx" },
                  ] as const).map(f => (
                    <div key={f.label}>
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{f.label}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                        className="w-full px-3 py-2 bg-[#16161a] border border-white/[0.06] rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Role</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setFRole(r)}
                        className={`py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${fRole === r ? ROLE_COLORS[r] : "border-white/[0.06] text-slate-600 hover:text-slate-300"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      {editing ? "ពាក្យសម្ងាត់ថ្មី" : "ពាក្យសម្ងាត់ *"}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type={showPwd ? "text" : "password"} value={fPwd} onChange={e => setFPwd(e.target.value)} placeholder="Min 6 characters"
                        className={`w-full pl-9 pr-9 py-2 bg-[#16161a] border rounded-xl text-xs text-slate-200 focus:outline-none transition-all ${
                          fPwd && fConfirmPwd ? (fPwd === fConfirmPwd ? "border-emerald-500/40" : "border-rose-500/40") : "border-white/[0.06]"
                        }`} />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                        {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {editing && <p className="text-[9px] text-slate-600 mt-1">ទុកទំនេរ = មិនប្ដូរ</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      បញ្ជាក់ម្ដងទៀត
                      {fPwd && fConfirmPwd && (fPwd === fConfirmPwd ? <span className="text-emerald-400 text-[9px] font-bold">✓ ត្រូវគ្នា</span> : <span className="text-rose-400 text-[9px] font-bold">✗ មិនត្រូវគ្នា</span>)}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input type={showConfirmPwd ? "text" : "password"} value={fConfirmPwd} onChange={e => setFConfirmPwd(e.target.value)} placeholder="Repeat password"
                        className={`w-full pl-9 pr-9 py-2 bg-[#16161a] border rounded-xl text-xs text-slate-200 focus:outline-none transition-all ${
                          fPwd && fConfirmPwd ? (fPwd === fConfirmPwd ? "border-emerald-500/40" : "border-rose-500/40") : "border-white/[0.06]"
                        }`} />
                      <button type="button" onClick={() => setShowConfirmPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                        {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-xs font-bold cursor-pointer hover:text-white transition-all">
                    បោះបង់
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all">
                    <Save className={`w-3.5 h-3.5 ${saving ? "animate-pulse" : ""}`} />
                    {saving ? "កំពុងរក្សាទុក..." : editing ? "រក្សាទុក" : "បង្កើត"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CONFIRM DELETE ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDel(null)}>
            <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
              className="bg-[#111116] border border-rose-500/20 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">លុបអ្នកប្រើ?</h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  តើអ្នកពិតជាចង់លុប <span className="text-white font-bold">{confirmDel.name}</span>?<br />
                  <span className="text-rose-400">⚠️ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ!</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-xs font-bold cursor-pointer hover:text-white transition-all">
                  បោះបង់
                </button>
                <button type="button" onClick={() => handleDelete(confirmDel)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all">
                  លុបចេញ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
