import React, { useState, useEffect } from "react";
import { 
  Database, Shield, RefreshCw, Send, Trash2, Download, UploadCloud, 
  CheckCircle, AlertCircle, Eye, EyeOff, Save, Calendar, Play
} from "lucide-react";
import { PageSettings as PageSettingsType } from "../types";
import { fetchWithAuth } from "../lib/api.ts";

interface BackupSettingsProps {
  settings: PageSettingsType | null;
  onSettingsSaved: (updated: Partial<PageSettingsType>) => Promise<void>;
  isLoading: boolean;
}

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

export default function BackupSettings({ settings, onSettingsSaved, isLoading }: BackupSettingsProps) {
  // Config states
  const [backupSchedule, setBackupSchedule] = useState(settings?.backupSchedule || "disabled");
  const [backupTime, setBackupTime] = useState(settings?.backupTime || "03:00");
  const [isTelegramBackupEnabled, setIsTelegramBackupEnabled] = useState(settings?.isTelegramBackupEnabled ?? false);
  const [telegramBotToken, setTelegramBotToken] = useState(settings?.telegramBotToken || "");
  const [telegramChatId, setTelegramChatId] = useState(settings?.telegramChatId || "");
  const [showBotToken, setShowBotToken] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState(settings?.lastBackupTime || null);

  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [telegramTestStatus, setTelegramTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [telegramTestError, setTelegramTestError] = useState("");

  // Backups list states
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [actionFile, setActionFile] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"restore" | "delete" | "telegram" | "upload" | null>(null);

  // Sync settings prop when updated from parent
  useEffect(() => {
    if (settings) {
      setBackupSchedule(settings.backupSchedule || "disabled");
      setBackupTime(settings.backupTime || "03:00");
      setIsTelegramBackupEnabled(settings.isTelegramBackupEnabled ?? false);
      setTelegramBotToken(settings.telegramBotToken || "");
      setTelegramChatId(settings.telegramChatId || "");
      setLastBackupTime(settings.lastBackupTime || null);
    }
  }, [settings]);

  // Fetch local backups list
  const fetchBackupsList = async () => {
    setIsLoadingBackups(true);
    try {
      const res = await fetchWithAuth("/api/backup/list");
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error("Failed to load backups list:", err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackupsList();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSettingsSaved({
        backupSchedule,
        backupTime,
        isTelegramBackupEnabled,
        telegramBotToken,
        telegramChatId,
      });
      alert("បានរក្សាទុកការកំណត់ទិន្នន័យបម្រុងដោយជោគជ័យ! (Backup settings saved successfully)");
    } catch (err) {
      console.error(err);
      alert("បរាជ័យក្នុងការរក្សាទុក! (Failed to save backup configurations)");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Backup Now
  const handleBackupNow = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetchWithAuth("/api/backup/now", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        let msg = "បានបង្កើតទិន្នន័យបម្រុងជោគជ័យ! (Database backup created successfully)";
        if (data.telegramSent) {
          msg += "\n✅ ផ្ញើទៅកាន់ Telegram រួចរាល់! (Sent to Telegram!)";
        } else if (data.telegramError) {
          msg += `\n⚠️ Telegram Error: ${data.telegramError}`;
        }
        alert(msg);
        fetchBackupsList();
        if (data.filename) {
          // Update last backup timestamp
          setLastBackupTime(new Date().toISOString());
        }
      } else {
        alert(`បរាជ័យ៖ ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`មានបញ្ហា៖ ${err.message || "Failed to trigger backup"}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Test Telegram Connection
  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      alert("សូមបញ្ចូល Bot Token និង Chat ID ជាមុនសិន! (Please enter Bot Token and Chat ID first)");
      return;
    }
    setIsTestingTelegram(true);
    setTelegramTestStatus("idle");
    setTelegramTestError("");
    try {
      const res = await fetchWithAuth("/api/backup/test-telegram", {
        method: "POST",
        body: JSON.stringify({ token: telegramBotToken, chatId: telegramChatId })
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramTestStatus("success");
      } else {
        setTelegramTestStatus("error");
        setTelegramTestError(data.error || "Failed testing Telegram connection");
      }
    } catch (err: any) {
      setTelegramTestStatus("error");
      setTelegramTestError(err.message || "Network error");
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Restore Local Backup
  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`⚠️ ព្រមាន៖ តើបងពិតជាចង់ស្ដារទិន្នន័យពីហ្វាយ ${filename} នេះមែនទេ? ទិន្នន័យបច្ចុប្បន្នទាំងអស់នឹងត្រូវជំនួសដោយទិន្នន័យចាស់វិញ! (Warning: Are you sure you want to restore? Current data will be replaced!)`)) {
      return;
    }
    setActionFile(filename);
    setActionType("restore");
    try {
      const res = await fetchWithAuth("/api/backup/restore", {
        method: "POST",
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (res.ok) {
        alert("🎉 បានស្ដារទិន្នន័យជោគជ័យ! ទំព័រនឹងផ្ទុកឡើងវិញ។ (Database restored successfully! Reloading page...)");
        window.location.reload();
      } else {
        alert(`បរាជ័យ៖ ${data.error || "Restore failed"}`);
      }
    } catch (err: any) {
      alert(`មានបញ្ហា៖ ${err.message}`);
    } finally {
      setActionFile(null);
      setActionType(null);
    }
  };

  // Send Specific File to Telegram
  const handleSendFileToTelegram = async (filename: string) => {
    setActionFile(filename);
    setActionType("telegram");
    try {
      const res = await fetchWithAuth(`/api/backup/${filename}/telegram`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ បានផ្ញើហ្វាយ ${filename} ទៅកាន់ Telegram រួចរាល់! (File sent to Telegram successfully!)`);
      } else {
        alert(`បរាជ័យ៖ ${data.error || "Failed sending to Telegram"}`);
      }
    } catch (err: any) {
      alert(`មានបញ្ហា៖ ${err.message}`);
    } finally {
      setActionFile(null);
      setActionType(null);
    }
  };

  // Delete Backup File
  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`តើបងចង់លុបហ្វាយ ${filename} នេះមែនទេ? (Are you sure you want to delete this backup file?)`)) {
      return;
    }
    setActionFile(filename);
    setActionType("delete");
    try {
      const res = await fetchWithAuth(`/api/backup/${filename}`, { method: "DELETE" });
      if (res.ok) {
        fetchBackupsList();
      } else {
        const data = await res.json();
        alert(`លុបមិនបានសម្រេច៖ ${data.error || "Failed deleting file"}`);
      }
    } catch (err: any) {
      alert(`មានបញ្ហា៖ ${err.message}`);
    } finally {
      setActionFile(null);
      setActionType(null);
    }
  };

  // Upload Local File and Restore
  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".sql")) {
      alert("សូមជ្រើសរើសតែហ្វាយ SQLite backup database (.sql) តែប៉ុណ្ណោះ! (Please upload .sql files only)");
      return;
    }

    if (!confirm(`⚠️ ព្រមាន៖ តើបងចង់ស្ដារទិន្នន័យពីហ្វាយផ្ទាល់ខ្លួន "${file.name}" នេះមែនទេ? ទិន្នន័យបច្ចុប្បន្នទាំងអស់នឹងត្រូវជំនួសដោយទិន្នន័យថ្មីនេះ! (Warning: Restore from uploaded file? Current data will be replaced!)`)) {
      return;
    }

    setActionType("upload");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetchWithAuth("/api/backup/upload-restore", {
          method: "POST",
          body: JSON.stringify({
            fileData: base64,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert("🎉 ស្ដារទិន្នន័យពីហ្វាយដែលបានបង្ហោះជោគជ័យ! ទំព័រនឹងផ្ទុកឡើងវិញ។ (Database restored from upload successfully! Reloading...)");
          window.location.reload();
        } else {
          alert(`បរាជ័យ៖ ${data.error || "Failed restoring from upload"}`);
        }
      } catch (err: any) {
        alert(`មានបញ្ហា៖ ${err.message}`);
      } finally {
        setActionType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to format bytes to KB/MB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* LEFT COLUMN: Config and Action triggers */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Scheduler Settings Card */}
        <form onSubmit={handleSaveSettings} className="p-6 bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-6 shadow-md">
          <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-4">
            <span className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/15 inline-flex items-center justify-center">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold font-display text-white">កំណត់ទិន្នន័យបម្រុងស្វ័យប្រវត្ត (Backup Schedules)</h3>
              <p className="text-[10px] text-slate-500">កំណត់ពេលវេលាចម្លងទិន្នន័យបម្រុងទុកជាប្រចាំ</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Last Backup Info */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-sans">កាលបរិច្ឆេទចម្លងចុងក្រោយ៖</span>
              <span className="font-mono text-white text-[11px]">
                {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "មិនទាន់មានទិន្នន័យ (No backups yet)"}
              </span>
            </div>

            {/* Schedule picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 block">កាលវិភាគចម្លងទុក (Auto Backup Frequency)</label>
              <select
                value={backupSchedule}
                onChange={(e) => setBackupSchedule(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="disabled">🚫 មិនប្រើប្រាស់ (Disabled)</option>
                <option value="daily">📅 រៀងរាល់ថ្ងៃ (Daily Backup)</option>
                <option value="weekly">📅 រៀងរាល់សប្តាហ៍ (Weekly Backup)</option>
                <option value="monthly">📅 រៀងរាល់ខែ (Monthly Backup)</option>
              </select>
            </div>

            {backupSchedule !== "disabled" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 block">ម៉ោងចម្លងទុកស្វ័យប្រវត្ត (Auto Backup Time)</label>
                <input
                  type="time"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                />
              </div>
            )}

            {/* Telegram Toggle Box */}
            <div className="p-4 bg-gradient-to-br from-[#12141c] to-[#0f1115] border border-white/[0.04] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200">ផ្ញើទៅកាន់ Telegram (Telegram Channel Backup)</h4>
                  <p className="text-[9.5px] text-slate-500">ផ្ញើហ្វាយបម្រុងទុក .db ទៅ Telegram Group/Channel</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isTelegramBackupEnabled}
                    onChange={(e) => setIsTelegramBackupEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {isTelegramBackupEnabled && (
                <div className="space-y-3 pt-2 border-t border-white/[0.03] text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Telegram Bot Token</label>
                    <div className="relative">
                      <input
                        type={showBotToken ? "text" : "password"}
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        placeholder="e.g. 123456789:ABCDefgh..."
                        className="w-full pl-3 pr-9 py-2 bg-black border border-white/[0.08] rounded-lg text-white font-mono text-[10px] focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showBotToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Telegram Chat ID (Channel/Group)</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. -100123456789 or 987654321"
                      className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-lg text-white font-mono text-[10px] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={isTestingTelegram || !telegramBotToken || !telegramChatId}
                      onClick={handleTestTelegram}
                      className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isTestingTelegram ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span>តេស្តសាកល្បង (Test Connection)</span>
                    </button>

                    {telegramTestStatus === "success" && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-sans">
                        <CheckCircle className="w-3 h-3" />
                        ជោគជ័យ!
                      </span>
                    )}
                    {telegramTestStatus === "error" && (
                      <span 
                        className="text-[10px] text-red-400 font-bold flex items-center gap-1 font-sans cursor-help"
                        title={telegramTestError}
                      >
                        <AlertCircle className="w-3 h-3" />
                        បរាជ័យ (Failed)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-white/[0.04] pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all border border-blue-500/15"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកការកំណត់ (Save Configuration)"}
            </button>
          </div>
        </form>

        {/* Manual operations card */}
        <div className="p-6 bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-6 shadow-md">
          <div className="flex items-center gap-2.5 border-b border-white/[0.04] pb-4">
            <span className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/15 inline-flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold font-display text-white">ប្រតិបត្តិការបម្រុងទុក (System Backup Operations)</h3>
              <p className="text-[10px] text-slate-500">បង្កើត ឬស្ដារទិន្នន័យបម្រុងទុកដោយដៃ</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Backup Now Button */}
            <button
              type="button"
              disabled={isCreatingBackup}
              onClick={handleBackupNow}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
            >
              {isCreatingBackup ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current shrink-0" />
              )}
              <span>ចម្លងទិន្នន័យបម្រុងទុកភ្លាមៗ (Backup Now)</span>
            </button>

            {/* Custom file restore upload */}
            <div className="border-t border-white/[0.04] pt-4 text-left">
              <label className="block text-[11px] font-bold text-slate-300 mb-2 font-sans">ស្ដារពីហ្វាយផ្ទាល់ខ្លួន (Upload Local File to Restore)</label>
              <div className="relative group flex items-center justify-center border border-dashed border-white/[0.1] hover:border-blue-500/40 rounded-xl p-4 bg-[#0a0a0b]/80 hover:bg-[#0f0f12] transition-all cursor-pointer text-center">
                <input
                  type="file"
                  accept=".sql"
                  onChange={handleFileUploadRestore}
                  disabled={actionType === "upload"}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-1.5 flex flex-col items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <div className="text-[10px] text-slate-400">
                    {actionType === "upload" ? (
                      <span className="flex items-center gap-1 text-blue-400 font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        កំពុងស្ដារ...
                      </span>
                    ) : (
                      <span>អូស ឬ ចុចដើម្បីស្វែងរកហ្វាយ `.sql` (Click to browse file)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Browse local backups table */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 bg-[#16161a] border border-white/[0.06] rounded-2xl shadow-md min-h-[400px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold font-display text-white">ស្វែងរកទិន្នន័យបម្រុងទុក (Browse Local Backups)</h3>
              </div>
              <button
                type="button"
                disabled={isLoadingBackups}
                onClick={fetchBackupsList}
                className="p-1.5 hover:bg-white/[0.04] text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Refresh Backups List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? "animate-spin text-blue-400" : ""}`} />
              </button>
            </div>

            {/* Backups List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left divide-y divide-white/[0.04] font-sans">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                    <th className="py-3 px-3">ឈ្មោះហ្វាយ (File Name)</th>
                    <th className="py-3 px-3">ទំហំ (Size)</th>
                    <th className="py-3 px-3">កាលបរិច្ឆេទបង្កើត (Date Created)</th>
                    <th className="py-3 px-3 text-right">សកម្មភាព (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {backups.length > 0 ? (
                    backups.map((backup) => {
                      const isCurrentAction = actionFile === backup.filename;
                      return (
                        <tr key={backup.filename} className="hover:bg-white/[0.01] text-slate-300">
                          <td className="py-3 px-3 font-mono text-[10.5px] truncate max-w-[180px] font-bold text-white" title={backup.filename}>
                            {backup.filename}
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] whitespace-nowrap">
                            {formatBytes(backup.size)}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[10px]">
                            {new Date(backup.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Send to Telegram */}
                              <button
                                type="button"
                                disabled={isCurrentAction && actionType === "telegram"}
                                onClick={() => handleSendFileToTelegram(backup.filename)}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                                title="ផ្ញើទៅកាន់ Telegram (Send to Telegram)"
                              >
                                {isCurrentAction && actionType === "telegram" ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Download File */}
                              <button
                                type="button"
                                onClick={() => {
                                  const token = sessionStorage.getItem("app_token") || "";
                                  const url = `/api/backup/download?file=${encodeURIComponent(backup.filename)}&token=${encodeURIComponent(token)}`;
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = backup.filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all inline-block"
                                title="ទាញយក (Download)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Restore Backup */}
                              <button
                                type="button"
                                disabled={isCurrentAction && actionType === "restore"}
                                onClick={() => handleRestoreBackup(backup.filename)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                                title="ស្ដារទិន្នន័យ (Restore Backup)"
                              >
                                {isCurrentAction && actionType === "restore" ? (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    ...
                                  </span>
                                ) : (
                                  <span>Restore</span>
                                )}
                              </button>

                              {/* Delete File */}
                              <button
                                type="button"
                                disabled={isCurrentAction && actionType === "delete"}
                                onClick={() => handleDeleteBackup(backup.filename)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                                title="លុបចោល (Delete)"
                              >
                                {isCurrentAction && actionType === "delete" ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        {isLoadingBackups ? (
                          <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            កំពុងស្វែងរក...
                          </span>
                        ) : (
                          <span>មិនទាន់មានហ្វាយបម្រុងទុកចម្លងឡើយ (No local backups created yet)</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer info */}
          <div className="pt-4 border-t border-white/[0.04] text-[10.5px] text-slate-500 leading-normal flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              **សំគាល់៖** ហ្វាយបម្រុងទុក SQLite `.sql` ទាំងអស់ត្រូវបានរក្សាទុកក្នុងថត `backups/` នៅក្នុងថតគម្រោងរបស់អ្នក។ អ្នកអាចចម្លង ឬ បម្រុងទុកហ្វាយនេះទៅកាន់ទីតាំងផ្សេងទៀត ដើម្បីសុវត្ថិភាពទិន្នន័យ។
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
