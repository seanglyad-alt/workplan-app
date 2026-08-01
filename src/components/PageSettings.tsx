/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, Users, Bell, Clock, UserPlus, Trash2, Shield, Mail, Save, Facebook,
  Edit2, Check, X, ShieldAlert, Key, ShieldCheck, ExternalLink, Sparkles, Database, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageSettings as PageSettingsType, UserRole } from "../types";
import BackupSettings from "./BackupSettings";

interface PageSettingsProps {
  settings: PageSettingsType | null;
  roles: UserRole[];
  currentUser?: UserRole | null;
  onSettingsSaved: (updated: Partial<PageSettingsType>) => Promise<void>;
  onRoleAdded: (role: Omit<UserRole, "id" | "avatar">) => Promise<void>;
  onRoleUpdated?: (roleId: string, role: Omit<UserRole, "id" | "avatar">) => Promise<void>;
  onRoleDeleted: (roleId: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
  isLoading: boolean;
  fbUser?: { id: string; name: string; avatar: string; email: string; token?: string; cookies?: string; appId?: string; appSecret?: string } | null;
  facebookPages?: any[];
  onFacebookLogin?: () => void;
  onFacebookLogout?: () => void;
  onSelectFacebookPage?: (pageId: string) => void;
  onFacebookImportToken?: (token: string, cookies?: string, appId?: string, appSecret?: string) => Promise<boolean>;
  fbLogs?: Array<{ timestamp: string; level: string; msg: string }>;
}

export default function PageSettings({
  settings,
  roles,
  currentUser,
  onSettingsSaved,
  onRoleAdded,
  onRoleUpdated,
  onRoleDeleted,
  onViewProfile,
  isLoading,
  fbUser,
  facebookPages = [],
  onFacebookLogin,
  onFacebookLogout,
  onSelectFacebookPage,
  onFacebookImportToken,
  fbLogs = []
}: PageSettingsProps) {
  // Page profile form fields
  const [pageName, setPageName] = useState(settings?.pageName || "");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "backup">("general");
  const [pageUsername, setPageUsername] = useState(settings?.pageUsername || "");
  const [category, setCategory] = useState(settings?.category || "");
  const [reportLogo, setReportLogo] = useState(settings?.reportLogo || "");
  const [companyName, setCompanyName] = useState(settings?.companyName || "");
  const [companySlogan, setCompanySlogan] = useState(settings?.companySlogan || "");
  const [isAutoResponderEnabled, setIsAutoResponderEnabled] = useState(settings?.isAutoResponderEnabled ?? true);

  // Raw Facebook configuration state handlers
  const [customToken, setCustomToken] = useState("");
  const [customCookies, setCustomCookies] = useState("");
  const [customAppId, setCustomAppId] = useState("");
  const [customAppSecret, setCustomAppSecret] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importError, setImportError] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Notification schedules
  const [notifyOnComment, setNotifyOnComment] = useState(settings?.notificationSchedules?.notifyOnComment ?? true);
  const [notifyOnReply, setNotifyOnReply] = useState(settings?.notificationSchedules?.notifyOnReply ?? true);
  const [notifyOnPostPublished, setNotifyOnPostPublished] = useState(settings?.notificationSchedules?.notifyOnPostPublished ?? true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(settings?.notificationSchedules?.notifyOnFailure ?? true);
  const [weeklyEmailReport, setWeeklyEmailReport] = useState(settings?.notificationSchedules?.weeklyEmailReport ?? true);
  const [quietHoursStart, setQuietHoursStart] = useState(settings?.notificationSchedules?.quietHoursStart || "22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState(settings?.notificationSchedules?.quietHoursEnd || "07:00");

  // Sync state if settings prop changes (e.g., after switching page inside header)
  React.useEffect(() => {
    if (settings) {
      setPageName(settings.pageName || "");
      setPageUsername(settings.pageUsername || "");
      setCategory(settings.category || "");
      setIsAutoResponderEnabled(settings.isAutoResponderEnabled ?? true);
      setNotifyOnComment(settings.notificationSchedules?.notifyOnComment ?? true);
      setNotifyOnReply(settings.notificationSchedules?.notifyOnReply ?? true);
      setNotifyOnPostPublished(settings.notificationSchedules?.notifyOnPostPublished ?? true);
      setNotifyOnFailure(settings.notificationSchedules?.notifyOnFailure ?? true);
      setWeeklyEmailReport(settings.notificationSchedules?.weeklyEmailReport ?? true);
      setQuietHoursStart(settings.notificationSchedules?.quietHoursStart || "22:00");
      setQuietHoursEnd(settings.notificationSchedules?.quietHoursEnd || "07:00");
      setReportLogo(settings.reportLogo || localStorage.getItem("reportLogo") || "");
      // For company info, prefer database values, fallback to localStorage
      setCompanyName(settings.companyName || localStorage.getItem("companyName") || "");
      setCompanySlogan(settings.companySlogan || localStorage.getItem("companySlogan") || "");
    }
  }, [settings]);

  // Load company info from localStorage on mount (highest priority on first load)
  React.useEffect(() => {
    const savedCompanyName = localStorage.getItem("companyName");
    const savedCompanySlogan = localStorage.getItem("companySlogan");
    const savedReportLogo = localStorage.getItem("reportLogo");
    
    // Only set if we don't have settings yet (first load)
    if (!settings) {
      if (savedCompanyName) setCompanyName(savedCompanyName);
      if (savedCompanySlogan) setCompanySlogan(savedCompanySlogan);
      if (savedReportLogo) setReportLogo(savedReportLogo);
    }
  }, []);

  // Save company info to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("companyName", companyName);
  }, [companyName]);

  React.useEffect(() => {
    localStorage.setItem("companySlogan", companySlogan);
  }, [companySlogan]);

  React.useEffect(() => {
    if (reportLogo) localStorage.setItem("reportLogo", reportLogo);
  }, [reportLogo]);

  // User Management System (Modal Control states)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editRoleId, setEditRoleId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"Admin" | "Editor" | "Moderator" | "Analyst">("Editor");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formDepartment, setFormDepartment] = useState("");

  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus("saving");
    try {
      await onSettingsSaved({
        pageName,
        pageUsername,
        category,
        reportLogo,
        companyName,
        companySlogan,
        isAutoResponderEnabled,
        notificationSchedules: {
          notifyOnComment,
          notifyOnReply,
          notifyOnPostPublished,
          notifyOnFailure,
          weeklyEmailReport,
          quietHoursStart,
          quietHoursEnd
        }
      });
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      alert("មានបញ្ហាក្នុងការរក្សាកំណត់ត្រា!");
    }
  };

  // Helper to identify Super Admin accounts / roles
  const isSuperAdminRole = (r?: { role?: string; email?: string; name?: string } | null) => {
    if (!r) return false;
    const roleName = (r.role || "").toLowerCase();
    const nameStr = (r.name || "").toLowerCase();
    const emailStr = (r.email || "").toLowerCase();
    return (
      roleName === "admin" ||
      roleName === "super admin" ||
      nameStr.includes("super admin") ||
      emailStr === "seanglyad@gmail.com" ||
      emailStr === "admin@app.local"
    );
  };

  const ALL_ADMIN_PERMISSIONS = ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"];

  const openAddModal = () => {
    setModalMode("add");
    setEditRoleId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("Editor");
    setFormPermissions(["publish_posts", "view_analytics"]); // standard Editor setup
    setFormDepartment("");
    setIsModalOpen(true);
  };

  const openEditModal = (roleUser: UserRole) => {
    if (isSuperAdminRole(roleUser) && !isSuperAdminRole(currentUser)) {
      alert("គណនី Super Admin អាចកែប្រែបានតែដោយ Super Admin ផ្ទាល់ប៉ុណ្ណោះ! (Only Super Admin can edit Super Admin account)");
      return;
    }
    setModalMode("edit");
    setEditRoleId(roleUser.id);
    setFormName(roleUser.name);
    setFormEmail(roleUser.email);
    setFormPassword("");
    setFormRole(roleUser.role);
    setFormDepartment(roleUser.department || "");
    
    if (isSuperAdminRole(roleUser) || roleUser.role === "Admin") {
      setFormPermissions(ALL_ADMIN_PERMISSIONS);
    } else if (roleUser.permissions && roleUser.permissions.length > 0) {
      setFormPermissions(roleUser.permissions);
    } else {
      // Default fallback according to roles
      if (roleUser.role === "Editor") {
        setFormPermissions(["publish_posts", "view_analytics"]);
      } else if (roleUser.role === "Moderator") {
        setFormPermissions(["auto_replies", "delete_content"]);
      } else {
        setFormPermissions(["view_analytics"]);
      }
    }
    setIsModalOpen(true);
  };

  const handleRoleSelectChange = (roleVal: "Admin" | "Editor" | "Moderator" | "Analyst") => {
    setFormRole(roleVal);
    if (roleVal === "Admin") {
      setFormPermissions(ALL_ADMIN_PERMISSIONS);
    } else if (roleVal === "Editor") {
      setFormPermissions(["publish_posts", "view_analytics"]);
    } else if (roleVal === "Moderator") {
      setFormPermissions(["auto_replies", "delete_content"]);
    } else {
      setFormPermissions(["view_analytics"]);
    }
  };

  const togglePermission = (permKey: string) => {
    if (formRole === "Admin" || isSuperAdminRole({ role: formRole, email: formEmail, name: formName })) {
      return; // Cannot uncheck permissions for Super Admin / Admin
    }
    if (formPermissions.includes(permKey)) {
      setFormPermissions(formPermissions.filter(p => p !== permKey));
    } else {
      setFormPermissions([...formPermissions, permKey]);
    }
  };

  const handleModalSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert("សូមបំពេញឈ្មោះ និងសារអេឡិចត្រូនិច! (Please enter name and email)");
      return;
    }

    try {
      if (modalMode === "add") {
        await onRoleAdded({
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          permissions: formPermissions,
          department: formDepartment.trim(),
          // include password for API payload
          ...(formPassword.trim() ? { password: formPassword.trim() } : {})
        } as any);
      } else {
        if (onRoleUpdated && editRoleId) {
          await onRoleUpdated(editRoleId, {
            name: formName.trim(),
            email: formEmail.trim(),
            role: formRole,
            permissions: formPermissions,
            department: formDepartment.trim(),
            // Only send password if editing user provided one
            ...(formPassword.trim() ? { password: formPassword.trim() } : {})
          } as any);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("មានកំហុសក្នុងការរក្សាទុកគណនី (Error saving user account)");
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-8" id="page-settings-tab">
      
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-0.5">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all relative border-b-2 -mb-[2px] cursor-pointer ${
            activeSubTab === "general"
              ? "text-blue-500 border-blue-500 font-bold"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ការកំណត់ទូទៅ និងបុគ្គលិក (General & Staff Settings)</span>
        </button>
        <button
          onClick={() => setActiveSubTab("backup")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all relative border-b-2 -mb-[2px] cursor-pointer ${
            activeSubTab === "backup"
              ? "text-blue-500 border-blue-500 font-bold"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ការចម្លងទិន្នន័យបម្រុងទុក (System Backup)</span>
        </button>
      </div>

      {activeSubTab === "general" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COMPONENT: Page Profile metadata & Notification schedules */}
        <div className="lg:col-span-7 space-y-6">

          {/* Facebook Connection Integration Panel */}
          <div className="p-6 bg-white dark:bg-gradient-to-br dark:from-[#12141c] dark:to-[#16161a] border border-[#1877f2]/20 rounded-2xl space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1877f2]/5 rounded-full filter blur-xl"></div>
            
            <div className="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
              <span className="p-2 bg-[#1877f2]/10 text-[#1877f2] rounded-xl border border-[#1877f2]/15 shadow-sm inline-flex items-center justify-center">
                <Facebook className="w-5 h-5 fill-current" />
              </span>
              <div>
                <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white">ការភ្ជាប់គណនី និងទំព័រហ្វេសប៊ុក (Facebook Account Integration)</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">ភ្ជាប់គណនីដើម្បីជ្រើសរើសទំព័រគ្រប់គ្រងនិងបង្ហោះវីដេអូ</p>
              </div>
            </div>

            {fbUser ? (
              <div className="space-y-4">
                {/* Active user status card */}
                <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={fbUser.avatar} 
                      alt={fbUser.name} 
                      className="w-12 h-12 object-cover rounded-xl border border-[#1877f2]/30 shadow"
                    />
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#1877f2] bg-[#1877f2]/10 px-2 py-0.5 rounded-full border border-[#1877f2]/15">
                        Connected
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display mt-1">{fbUser.name}</h4>
                      <p className="text-xs text-slate-400 font-sans font-mono">{fbUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onFacebookLogout}
                    className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Logout Account
                  </button>
                </div>

                {/* Pages selection container */}
                {facebookPages && facebookPages.length > 0 ? (
                  <div className="space-y-3 font-sans">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <span>ទំព័របានគ្រប់គ្រងរបស់បង ({facebookPages.length} Pages Available):</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {facebookPages.map((page) => {
                        const isActive = settings?.pageId === page.id;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => onSelectFacebookPage?.(page.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 relative ${
                              isActive 
                                ? "bg-blue-600/10 border-blue-500/40 shadow-sm" 
                                : "bg-slate-50 dark:bg-[#0a0a0b]/80 border border-slate-200/60 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-[#0f0f12] hover:border-white/[0.08]"
                            }`}
                          >
                            <img 
                              src={page.avatar} 
                              alt={page.name} 
                              className="w-9 h-9 object-cover rounded-lg border border-white/[0.06]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{page.name}</p>
                              <p className="text-[10px] text-slate-500 truncate font-mono">{page.username}</p>
                              <div className="flex items-center gap-1.5 mt-1 font-sans">
                                <span className="text-[9px] text-blue-400 font-mono font-bold">
                                  {page.followersCount.toLocaleString()} followers
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-[#0a0a0b] rounded-xl text-center text-xs text-slate-500 dark:text-slate-300 border border-white/[0.04]">
                    No managed Facebook Pages found for this profile.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-[#0a0a0b] rounded-xl border border-white/[0.04] space-y-4 text-center font-sans animate-fade-in">
                <div className="max-w-xs mx-auto space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">ភ្ជាប់គណនី Facebook របស់បង</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    សូមភ្ជាប់គណនីរបស់បងដើម្បីទាញទិន្នន័យទំព័រហ្វេសប៊ុក (Facebook Pages) និងគ្រប់គ្រងការបង្ហោះវីដេអូ ឬ Carousel ស្វ័យប្រវត្តិ។
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onFacebookLogin}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#1877f2]/10 cursor-pointer"
                  >
                    <Facebook className="w-4 h-4 fill-current shrink-0" />
                    <span>Connect Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/[0.06] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{showTokenInput ? "លាក់" : "បញ្ចូលគ្រាប់ចុចនិមិត្តសញ្ញា (Import Token)"}</span>
                  </button>
                </div>

                {showTokenInput && (
                  <div className="mt-5 text-left border-t border-white/[0.04] pt-5 space-y-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[10px] tracking-wide text-amber-400 font-medium">
                        ⚠️ **ការណែនាំពីរបៀបយកគ្រាប់ចុចនិមិត្តសញ្ញា (Access Token & Cookies)**: ប្រើប្រាស់ **FB Token Extractor Addon** ឬ **Meta Graph API Explorer** ដើម្បីទទួលបាន Token និង Cookies គណនី Facebook សម្រាប់បង្ហោះវីដេអូ។
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Facebook Access Token *
                        </label>
                        <input
                          type="text"
                          value={customToken}
                          onChange={(e) => setCustomToken(e.target.value)}
                          placeholder="EAA..."
                          className="w-full px-3 py-2 bg-white dark:bg-black border border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-mono text-[11px] h-9 focus:outline-none focus:border-[#1877f2]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Cookies (ជាលក្ខណៈ JSON ឬ Raw text) (ស្រេចចិត្ត)
                        </label>
                        <textarea
                          value={customCookies}
                          onChange={(e) => setCustomCookies(e.target.value)}
                          placeholder='[{"domain":".facebook.com","name":"c_user",...}]'
                          className="w-full px-3 py-2 bg-white dark:bg-black border border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-mono text-[10px] h-16 focus:outline-none focus:border-[#1877f2] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Meta App ID (ស្រេចចិត្ត)
                          </label>
                          <input
                            type="text"
                            value={customAppId}
                            onChange={(e) => setCustomAppId(e.target.value)}
                            placeholder="fb_app_..."
                            className="w-full px-3 py-2 bg-white dark:bg-black border border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-mono text-[11px] h-9 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Meta App Secret (ស្រេចចិត្ត)
                          </label>
                          <input
                            type="password"
                            value={customAppSecret}
                            onChange={(e) => setCustomAppSecret(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-white dark:bg-black border border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-mono text-[11px] h-9 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1.5">
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={async () => {
                          if (!customToken.trim()) {
                            alert("សូមបញ្ចូល Token គណនីមុនចុចបញ្ជាក់! (Token is required)");
                            return;
                          }
                          setIsImporting(true);
                          setImportStatus("idle");
                          const success = await onFacebookImportToken?.(customToken, customCookies, customAppId, customAppSecret);
                          setIsImporting(false);
                          if (success) {
                            setImportStatus("success");
                            setCustomToken("");
                            setCustomCookies("");
                            setCustomAppId("");
                            setCustomAppSecret("");
                          } else {
                            setImportStatus("error");
                          }
                        }}
                        className="px-4 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] active:scale-95 disabled:opacity-50 disabled:scale-100 text-white font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {isImporting ? "កំពុងត្រួតពិនិត្យ..." : "រក្សាទុក និងផ្ទៀងផ្ទាត់ (Verify & Save)"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Real-time Meta Graph API Activity Event Logging */}
            <div className="border-t border-white/[0.04] pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>សកម្មភាព និងកំណត់ហេតុ (Facebook Meta Graph API Logs)</span>
                </h4>
                <span className="text-[9px] font-mono tracking-wider font-bold text-slate-500 uppercase">Live monitoring</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#07080c] rounded-xl border border-white/[0.03] p-3 text-[10px] font-mono h-28 overflow-y-auto space-y-2 scrollbar-thin">
                {fbLogs && fbLogs.length > 0 ? (
                  fbLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-1.5 leading-normal">
                      <span className="text-[8px] text-slate-500 whitespace-nowrap pt-0.5">[{log.timestamp.substring(11, 19)}]</span>
                      <span className={`px-1 rounded text-[8px] uppercase font-bold shrink-0 ${
                        log.level === "ERROR" ? "bg-red-500/10 text-red-400 border border-red-500/15" :
                        log.level === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                        log.level === "WARN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                      }`}>{log.level}</span>
                      <span className="text-slate-300 select-all">{log.msg}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    មិនមានសកម្មភាពថ្មី ឬការស្នើសុំ API នាពេលថ្មីៗនេះទេ (No API traffic recorded)
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSaveSettings} className="p-6 bg-slate-50 dark:bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold font-display text-slate-900 dark:text-white">កំណត់រចនាសម្ព័ន្ធទំព័រ (Facebook Page Custom Configuration)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono text-right">Settings Secure</span>
            </div>

            {/* Profile fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">ឈ្មោះទំព័រ Facebook Page Name *</label>
                <input 
                  type="text"
                  required
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#0a0a0b] border border-slate-200/60 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ចំណុចសម្គាល់ទំព័រ Username (@...)</label>
                  <input 
                    type="text"
                    required
                    value={pageUsername}
                    onChange={(e) => setPageUsername(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ប្រភេទអាជីវកម្ម Niche / Category</label>
                  <input 
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* PDF Report Branding Section */}
              <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">កំណត់ត្រា និងរបាយការណ៍ (Report Branding)</h4>
                </div>

                {/* Company Info Setup Section */}
                <div className="space-y-3 pt-2 border-t border-blue-500/20">
                  <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">កំណត់ព័ត៌មានក្រុមហ៊ុន (Company Info Setup):</h5>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ឈ្មោះក្រុមហ៊ុន (Company Name)</label>
                    <input 
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="YOUR COMPANY"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-400 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">ឃ្លាលក្ខណ៍វិស័យក្រុមហ៊ុន (Company Slogan)</label>
                    <input 
                      type="text"
                      value={companySlogan}
                      onChange={(e) => setCompanySlogan(e.target.value)}
                      placeholder="Your Company Slogan Here"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-400 font-sans"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={async () => {
                      setSavingStatus("saving");
                      try {
                        await onSettingsSaved({
                          pageName,
                          pageUsername,
                          category,
                          reportLogo,
                          companyName,
                          companySlogan,
                          isAutoResponderEnabled,
                          notificationSchedules: {
                            notifyOnComment,
                            notifyOnReply,
                            notifyOnPostPublished,
                            notifyOnFailure,
                            weeklyEmailReport,
                            quietHoursStart,
                            quietHoursEnd
                          }
                        });
                        setSavingStatus("saved");
                        setTimeout(() => setSavingStatus("idle"), 3000);
                      } catch (err) {
                        console.error(err);
                        alert("មានបញ្ហាក្នុងការរក្សាព័ត៌មាន!");
                        setSavingStatus("idle");
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                      savingStatus === "saved" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : savingStatus === "saving"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-blue-500 hover:bg-blue-600 active:scale-95 text-white border border-blue-600"
                    }`}
                  >
                    {savingStatus === "saving" ? "កំពុងរក្សាទុក..." : savingStatus === "saved" ? "✓ រក្សាទុកបានល្អ" : "💾 រក្សាទុកព័ត៌មាន (Save Info)"}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center overflow-hidden group relative">
                    {reportLogo ? (
                      <img src={reportLogo} alt="Report Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-1">
                        <span className="text-[8px] text-white font-black leading-tight">{companyName || "YOUR COMPANY"}</span>
                        <span className="text-[5px] text-slate-500 font-bold leading-tight">{companySlogan || "Slogan Here"}</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Edit2 className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setReportLogo(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">រូបសញ្ញាក្រុមហ៊ុន សម្រាប់របាយការណ៍ PDF (Report Logo)</label>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight">រូបភាពនេះនឹងបង្ហាញនៅលើក្បាលទំព័រនៃរបាយការណ៍ PDF របស់ក្រុមហ៊ុនបង។</p>
                    {reportLogo && (
                      <button 
                        onClick={() => setReportLogo("")}
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-bold underline underline-offset-2 mt-1 cursor-pointer"
                      >
                        លុបរូបសញ្ញាចេញ (Remove Logo)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto responder toggle */}
            <div className="p-4 bg-white dark:bg-[#0a0a0b] border border-white/[0.04] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">ដំណើរការប្រព័ន្ធឆ្លើយតបស្វ័យប្រវត្ត (Auto Responder Status)</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 font-sans">បើកដំណើរការច្បាប់តាមពាក្យគន្លឹះដើម្បីឆ្លើយតបភ្លាមៗដោយគ្មានការពន្យារពេល</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAutoResponderEnabled}
                  onChange={(e) => setIsAutoResponderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Advanced Notification Schedules */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold font-display text-slate-900 dark:text-white flex items-center gap-1.5 border-t border-white/[0.04] pt-4">
                <Bell className="w-4 h-4 text-blue-400" />
                <span>ការកំណត់ការជូនដំណឹងកាលវិភាគ (Advanced Notification Schedules)</span>
              </h4>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#0a0a0b] rounded-xl border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <span className="block text-xs text-slate-900 dark:text-slate-200">ជូនដំណឹងភ្លាមៗនៅពេលមានមតិយោបល់ថ្មី (Active Comment Notice)</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans">Notify admin webhook logs once comment trigger arrives</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifyOnComment}
                    onChange={(e) => setNotifyOnComment(e.target.checked)}
                    className="rounded border-white/[0.06] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#0a0a0b] rounded-xl border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <span className="block text-xs text-slate-900 dark:text-slate-200">ជូនដំណឹងពេលប្រព័ន្ធឆ្លើយតបស្វ័យប្រវត្តិជោគជ័យ (Auto-responder Action alerts)</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans">Notify once automatic repetitve match completes</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifyOnReply}
                    onChange={(e) => setNotifyOnReply(e.target.checked)}
                    className="rounded border-white/[0.06] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#0a0a0b] rounded-xl border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <span className="block text-xs text-slate-900 dark:text-slate-200">ជូនដំណឹងពេលវីដេអូបានផុសជោគជ័យ (Post Publication Alert)</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans">Notify upon scheduled publication execution</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifyOnPostPublished}
                    onChange={(e) => setNotifyOnPostPublished(e.target.checked)}
                    className="rounded border-white/[0.06] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#0a0a0b] rounded-xl border border-white/[0.04]">
                  <div className="space-y-0.5">
                    <span className="block text-xs text-slate-900 dark:text-slate-200">ផ្ញើរបាយការណ៍សង្ខេបប្រចាំសប្តាហ៍តាមអ៊ីមែល (Weekly Email Summary Report)</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans">Receive actionable insights and viewer metrics once a week</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={weeklyEmailReport}
                    onChange={(e) => setWeeklyEmailReport(e.target.checked)}
                    className="rounded border-white/[0.06] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quiet hours configuration */}
            <div className="space-y-3.5 border-t border-white/[0.04] pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">កំណត់ម៉ោងមិនរំខាន (Quiet Notifications Period)</h4>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-sans">ក្នុងអំឡុងពេលដែលបានកំណត់នេះ ប្រព័ន្ធនឹងផ្អាកការលោត Notification Alerts មកទូរស័ព្ទដៃរបស់បងជាបណ្តោះអាសន្ន៖</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-sans">ចាប់ផ្តើមពីម៉ោង (Start Hour)</label>
                  <input 
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#0a0a0b] border border-slate-200/60 dark:border-white/[0.06] rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-sans">រហូតដល់ម៉ោង (End Hour)</label>
                  <input 
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#0a0a0b] border border-slate-200/60 dark:border-white/[0.06] rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Action saved status */}
            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                id="save-settings-btn"
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md border border-blue-500/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                {savingStatus === "saving" 
                  ? "កំពុងរក្សាទុក..." 
                  : savingStatus === "saved"
                    ? "រក្សាទុកជាការស្រេច!"
                    : "រក្សាទុកការកែប្រែទាំងអស់ (Save Settings)"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COMPONENT: Advanced Notification Schedules (Expanded version) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-5 shadow-sm h-full">
            <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">សុវត្ថិភាពទិន្នន័យ (Data Privacy & Archival)</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Backup & Versioning</h4>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">រក្សាទុកទិន្នន័យបង្ហោះនិងមតិយោបល់របស់អ្នកទៅក្នុង Cloud Archive រៀងរាល់ ២៤ ម៉ោងម្តងដើម្បីសុវត្ថិភាព។</p>
                <button className="text-[10px] text-blue-400 font-bold hover:underline cursor-pointer">Configure scheduled backup -{">"}</button>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-display">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>រចនាសម្ព័ន្ធកំណត់សិទ្ធិ៖</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-sans pl-1 text-[10px]">
                  <li><b>Admin</b> – មានសិទ្ធិគ្រប់គ្រងផុស កំណត់ប្រព័ន្ធឆ្លើយតប និងលុប/បន្ថែមគណនី</li>
                  <li><b>Editor</b> – មានសិទ្ធិកំណត់កាលវិភាគវីដេអូ និងផុសមាតិកា។</li>
                  <li><b>Moderator</b> – មានសិទ្ធិសរសេរឆ្លើយតបមតិយោបល់ និងគ្រប់គ្រងច្បាប់ឆ្លើយតប។</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM COMPONENT: User roles management block (manage user roles & accounts) */}
      <div className="p-8 bg-white dark:bg-[#16161a] border border-white/[0.06] rounded-3xl space-y-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <h3 className="text-xl font-black font-display text-slate-900 dark:text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-400" />
              <span>គ្រប់គ្រងសិទ្ធិរបស់បុគ្គលិក (User Accounts & Staff Management)</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-1">ចែករំលែកនិងគ្រប់គ្រងការអនុញ្ញាតលម្អិតរបស់ក្រុមការងារក្នុងប្រព័ន្ធ</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>បន្ថែមបុគ្គលិកថ្មី</span>
          </button>
        </div>

        {/* List user roles - Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map(role => {
            const activePerms = role.permissions || (
              role.role === "Admin" ? ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"] :
              role.role === "Editor" ? ["publish_posts", "view_analytics"] :
              role.role === "Moderator" ? ["auto_replies", "delete_content"] : ["view_analytics"]
            );

            return (
              <div key={role.id} className="p-5 bg-white dark:bg-[#0a0a0b] rounded-2xl border border-white/[0.04] space-y-4 transition-all hover:border-blue-500/20 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={role.avatar} 
                      alt={role.name} 
                      className="w-12 h-12 object-cover rounded-2xl border border-white/[0.06] shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
                        {role.name}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                          role.role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                          role.role === 'Editor' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                          role.role === 'Moderator' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 
                          'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                        }`}>
                          {role.role}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{role.email}</p>
                      {role.department && (
                        <p className="text-[10px] text-blue-400 font-sans mt-0.5">
                          ផ្នែក/Dept: {role.department}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                  {/* Permissions count or chip summary */}
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-600 font-sans whitespace-nowrap">សិទ្ធិ:</span>
                    <div className="flex -space-x-1.5">
                      {activePerms.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center" />
                      ))}
                      {activePerms.length > 3 && (
                        <div className="w-4 h-4 rounded-full bg-slate-800 border border-white/[0.05] flex items-center justify-center text-[8px] text-slate-400">
                          +{activePerms.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(!isSuperAdminRole(role) || isSuperAdminRole(currentUser)) && (
                      <button 
                        onClick={() => onViewProfile(role.id)}
                        className="p-2 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white rounded-xl border border-white/[0.06] transition-all cursor-pointer"
                        title="មើលគណនី (View Profile)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    {(!isSuperAdminRole(role) || isSuperAdminRole(currentUser)) && (
                      <button 
                        onClick={() => openEditModal(role)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/20 transition-all cursor-pointer"
                        title="កែសម្រួល (Edit Profile)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {!isSuperAdminRole(role) && (
                      <button 
                        onClick={() => onRoleDeleted(role.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all cursor-pointer"
                        title="លុបចោល (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      ) : (
        <BackupSettings
          settings={settings}
          onSettingsSaved={onSettingsSaved}
          isLoading={isLoading}
        />
      )}

      {/* RENDER DYNAMIC USER AND ROLE ASSIGNMENT MODAL FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#111115] border border-slate-200/70 dark:border-white/[0.08] rounded-2xl p-6 max-w-lg w-full relative z-10 shadow-2xl text-left space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span>{modalMode === "add" ? "បន្ថែមសិទ្ធិបុគ្គលិកថ្មី (Add User Account)" : "កែប្រែការកំណត់សិទ្ធិបុគ្គលិក (Configure Permissions)"}</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/[0.04] text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleModalSaveSubmit} className="space-y-4 text-xs font-sans">
                {/* Full name input */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                    ឈ្មោះពេញរបស់បុគ្គលិក (Employee Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ឧ. សុខ ពិសិដ្ឋ"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#16161a] border border-slate-200/60 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all font-sans"
                  />
                </div>

                {/* Email address */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                    សារអេឡិចត្រូនិច (Email Address) *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === "edit" && isSuperAdminRole({ role: formRole, email: formEmail, name: formName })}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. vibol@company.kh"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-mono disabled:opacity-50"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                    ពាក្យសម្ងាត់ប្រព័ន្ធ (System Password) {modalMode === "add" ? "*" : "(Optional to change)"}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "add"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={modalMode === "add" ? "Enter secure password..." : "Leave blank to keep unchanged"}
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                  {modalMode === "add" && <p className="text-[10px] text-slate-500">គណនីនេះត្រូវបានប្រើដើម្បី Login ក្នុងប្រព័ន្ធ MetaStream</p>}
                </div>

                {/* Department field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                    ផ្នែក/ដេប៉ាតឺម៉ង់ (Department)
                  </label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Operations"
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#16161a] border border-slate-200/60 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all font-sans"
                  />
                </div>

                {/* Base Role drop selector */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                    កម្រិតសិទ្ធិជាមូលដ្ឋាន (Global Role Level)
                  </label>
                  <select
                    value={formRole}
                    disabled={modalMode === "edit" && isSuperAdminRole({ role: formRole, email: formEmail, name: formName })}
                    onChange={(e) => handleRoleSelectChange(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16161a] border border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                  >
                    <option value="Admin">Admin (គ្រប់គ្រងពេញលេញ - Full Admin Access)</option>
                    <option value="Editor">Editor (កែសម្រួល និង បង្ហោះវីដេអូ - Content Creator)</option>
                    <option value="Moderator">Moderator (ឆ្លើយតបមតិ និង គ្រប់គ្រងច្បាប់ - Community Host)</option>
                    <option value="Analyst">Analyst (មើលរបាយការណ៍ និងស្ថិតិ - Auditor)</option>
                  </select>
                </div>

                {/* Dedicated checkable permission lists */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-400 block font-sans">
                      ការអនុញ្ញាតជាក់លាក់របស់ក្រុមការងារ (Fine-grained Team Permissions Assignment)
                    </label>
                    {(formRole === "Admin" || isSuperAdminRole({ role: formRole, email: formEmail, name: formName })) && (
                      <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        🔒 Full Permissions (Locked)
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-[#16161a] text-xs divide-y divide-slate-200/80 dark:divide-white/[0.03] rounded-xl border border-slate-200/70 dark:border-white/[0.06] max-h-56 overflow-y-auto">
                    {[
                      { key: "publish_posts", name: "📤 បង្ហោះនិងគ្រប់គ្រងមាតិកា", desc: "កែសម្រួល កំណត់កាលវិភាគ និងបង្ហោះមាតិកាទំព័រ" },
                      { key: "manage_settings", name: "⚙️ រៀបចំការកំណត់ប្រព័ន្ធ", desc: "កែសម្រួលគណនីហ្វេសប៊ុក និងកំណត់កម្រងច្បាប់" },
                      { key: "auto_replies", name: "💬 កំណត់ច្បាប់ឆ្លើយតបស្វ័យប្រវត្ត", desc: "ឆ្លើយតបមតិនិងសារអេឡិចត្រូនិច" },
                      { key: "view_analytics", name: "📊 វិភាគរបាយការណ៍ស្ថិតិទិន្នន័យ", desc: "វិភាគយុទ្ធសាស្ត្រការផ្សាយ និងយោបល់ទូទៅ" },
                      { key: "delete_content", name: "🗑️ លុបមតិយោបល់ និងមាតិកា", desc: "លុបវីដេអូរលក ឬសម្រាំងមតិអវិជ្ជមាន" }
                    ].map(perm => {
                      const isLockedAdmin = formRole === "Admin" || isSuperAdminRole({ role: formRole, email: formEmail, name: formName });
                      const isChecked = isLockedAdmin || formPermissions.includes(perm.key);
                      return (
                        <div 
                          key={perm.key} 
                          onClick={() => {
                            if (isLockedAdmin) return;
                            togglePermission(perm.key);
                          }}
                          className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                            isLockedAdmin ? "cursor-not-allowed opacity-90 bg-blue-500/[0.02]" : ""
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isChecked 
                                ? "bg-blue-600 border-blue-500 text-white" 
                                : "border-white/[0.1] bg-white/[0.01]"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div>
                            <span className="block text-slate-200 font-bold text-[11.5px]">{perm.name}</span>
                            <span className="block text-slate-500 text-[10px] font-sans mt-0.5">{perm.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl text-slate-300 font-semibold"
                  >
                    ចាកចេញ (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all border border-blue-500/15"
                  >
                    {modalMode === "add" ? "បន្ថែមគណនី (Add Staff)" : "រក្សាទុក (Save Permissions)"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
