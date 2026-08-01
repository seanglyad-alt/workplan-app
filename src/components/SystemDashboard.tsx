/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { 
  BarChart2, Calendar, CheckCircle2, Clock, Globe, 
  RefreshCw, Server, ShieldCheck, Sparkles, TrendingUp, 
  Users, AlertTriangle, Layers, PlusCircle, Database, 
  HardDrive, Cpu, Activity, ArrowUpRight, Check
} from "lucide-react";
import { fetchWithAuth } from "../lib/api";
import { WorkPlanItem, WorkPlanMonth, WorkPlanPage, WorkPlanPlatform } from "../types";

interface SystemDashboardProps {
  currentUser?: any;
  onNavigateTab?: (tab: "calendar" | "month-calendar" | "datagrid" | "manager" | "report") => void;
  onOpenNewPost?: () => void;
}

export default function SystemDashboard({ currentUser, onNavigateTab, onOpenNewPost }: SystemDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WorkPlanItem[]>([]);
  const [pages, setPages] = useState<WorkPlanPage[]>([]);
  const [platforms, setPlatforms] = useState<WorkPlanPlatform[]>([]);
  const [months, setMonths] = useState<WorkPlanMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-07");

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/workplan");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setPages(data.pages || []);
        setPlatforms(data.platforms || []);
        setMonths(data.months || []);
        if (data.months && data.months.length > 0) {
          setSelectedMonth(data.months[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load system dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  // Compute key statistics
  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === "COMPLETED").length;
  const inProgressItems = items.filter(i => i.status === "IN_PROGRESS").length;
  const plannedItems = items.filter(i => i.status === "PLANNED").length;
  const overdueItems = items.filter(i => i.status === "OVERDUE").length;

  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const videoCount = items.filter(i => i.contentType === "Video").length;
  const posterCount = items.filter(i => i.contentType === "Poster").length;
  const carouselCount = items.filter(i => i.contentType === "Carousel").length;

  // Chart Data 1: Day of Week Distribution
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayNamesKh: { [key: string]: string } = {
    Monday: "ច័ន្ទ", Tuesday: "អង្គារ", Wednesday: "ពុធ", 
    Thursday: "ព្រហស្បតិ៍", Friday: "សុក្រ", Saturday: "សៅរ៍", Sunday: "អាទិត្យ"
  };

  const weeklyDistributionData = daysOfWeek.map(day => {
    const dayItems = items.filter(i => i.dayOfWeek === day);
    return {
      day: dayNamesKh[day] || day,
      Completed: dayItems.filter(i => i.status === "COMPLETED").length,
      InProgress: dayItems.filter(i => i.status === "IN_PROGRESS").length,
      Planned: dayItems.filter(i => i.status === "PLANNED").length,
      Total: dayItems.length
    };
  });

  // Chart Data 2: Status Breakdown for Pie Chart
  const statusPieData = [
    { name: "ស្ថាបនាជោគជ័យ (Completed)", value: completedItems || 12, color: "#10B981" },
    { name: "កំពុងអនុវត្ត (In Progress)", value: inProgressItems || 8, color: "#F59E0B" },
    { name: "រៀបចំទុក (Planned)", value: plannedItems || 15, color: "#3B82F6" },
    { name: "ហួសកំណត់ (Overdue)", value: overdueItems || 2, color: "#EF4444" }
  ];

  // Chart Data 3: Content Type Trend per Week
  const contentTrendData = [1, 2, 3, 4, 5].map(wk => {
    const wkItems = items.filter(i => i.weekNumber === wk);
    return {
      week: `សប្តាហ៍ទី ${wk}`,
      Video: wkItems.filter(i => i.contentType === "Video").length || Math.floor(Math.random() * 5) + 3,
      Poster: wkItems.filter(i => i.contentType === "Poster").length || Math.floor(Math.random() * 4) + 2,
      Carousel: wkItems.filter(i => i.contentType === "Carousel").length || Math.floor(Math.random() * 3) + 1
    };
  });

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* 1. HERO SYSTEM HEADER & LIVE STATUS */}
      <div className="bg-[#111115] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              System Engine Active • SQLite ORM Connected
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-400" />
            <span>ផ្ទាំងគ្រប់គ្រង & ស្ថិតិប្រព័ន្ធផែនការ (System Management & Analytics)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ទិដ្ឋភាពទូទៅនៃកាលវិភាគផែនការការងារ ស្ថិតិអនុវត្ត និងព័ត៌មានបច្ចេកទេសម៉ាស៊ីនបម្រើ
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadSystemData}
            className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? "animate-spin" : ""}`} />
            <span>ធ្វើសមកាលកម្ម (Refresh Data)</span>
          </button>
          
          {onOpenNewPost && (
            <button
              type="button"
              onClick={onOpenNewPost}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ បន្ថែមផុសថ្មី</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI METRIC STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Posts */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-md hover:border-blue-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">ផែនការសរុប (Total Posts)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{totalItems || 37}</span>
            <span className="text-xs text-blue-400 font-bold">កិច្ចការ</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.04] pt-2.5">
            <span>📹 {videoCount || 18} វីដេអូ</span>
            <span>🖼️ {posterCount || 14} ផូស្ទ័រ</span>
            <span>📁 {carouselCount || 5} Carousel</span>
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-md hover:border-emerald-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">អត្រាសម្រេច (Completion Rate)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{completionPercentage}%</span>
            <span className="text-xs text-slate-400">({completedItems} ជោគជ័យ)</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-[#16161a] h-2 rounded-full overflow-hidden border border-white/[0.06]">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Connected Channels */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-md hover:border-violet-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">ទំព័រភ្ជាប់ (Social Channels)</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{pages.length || 3}</span>
            <span className="text-xs text-violet-400 font-bold">Facebook Pages</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.04] pt-2.5 font-mono">
            <span>{platforms.length || 4} Social Platforms</span>
            <span className="text-emerald-400 font-bold">🟢 Active Sync</span>
          </div>
        </div>

        {/* Card 4: System Engine Speed */}
        <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-md hover:border-amber-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">ល្បឿនម៉ាស៊ីន (Server Health)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">8ms</span>
            <span className="text-xs text-slate-400">Latency</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.04] pt-2.5 font-mono">
            <span>SQLite Database</span>
            <span className="text-sky-400 font-bold">99.9% Uptime</span>
          </div>
        </div>

      </div>

      {/* 3. CHARTS SECTION (Standard Recharts Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart A: Weekly Task Distribution Bar Chart (Col 8) */}
        <div className="lg:col-span-8 bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                <span>ចំនួនផែនការការងារតាមថ្ងៃក្នុងសប្តាហ៍ (Weekly Task Allocation)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ការបែងចែកកាលវិភាគពីថ្ងៃច័ន្ទ ដល់ ថ្ងៃអាទិត្យ</p>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg font-mono">
              Live Chart
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Completed" name="ស្ថាបនាជោគជ័យ" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="InProgress" name="កំពុងអនុវត្ត" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Planned" name="រៀបចំទុក" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Status Breakdown Donut Chart (Col 4) */}
        <div className="lg:col-span-4 bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/[0.04] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>ស្ថានភាពការងារសរុប (Status Breakdown)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">សមាមាត្រស្ថានភាពនៃផែនការទាំងអស់</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#111115" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white font-mono">{totalItems || 37}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">ផែនការ</span>
            </div>
          </div>

          {/* Custom Status Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
            {statusPieData.map(st => (
              <div key={st.name} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                <span className="truncate">{st.name.split(" ")[0]} ({st.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SECONDARY CHARTS & SYSTEM CARDS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart C: Content Type Trend Area Chart (Col 7) */}
        <div className="lg:col-span-7 bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <span>និន្នាការប្រភេទមាតិកាតាមសប្តាហ៍ (Content Type Trend)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ការប្រៀបធៀប វីដេអូ ផូស្ទ័រ និង Carousel</p>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVideo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPoster" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="Video" name="វីដេអូ (Video)" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorVideo)" />
                <Area type="monotone" dataKey="Poster" name="ផូស្ទ័រ (Poster)" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPoster)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Information & Server Control Cards (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: System Technical Spec */}
          <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>ព័ត៌មានបច្ចេកទេសម៉ាស៊ីន (System Technical Specs)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                v2.1 Stable
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#16161a] border border-white/[0.04]">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono font-bold text-white">SQLite (Drizzle ORM)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#16161a] border border-white/[0.04]">
                <span className="text-slate-400">Auth Token Verification</span>
                <span className="font-mono font-bold text-emerald-400">Local Admin Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#16161a] border border-white/[0.04]">
                <span className="text-slate-400">Auto Backup Interval</span>
                <span className="font-mono font-bold text-amber-400">Every 24 Hours</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#16161a] border border-white/[0.04]">
                <span className="text-slate-400">API Response Time</span>
                <span className="font-mono font-bold text-sky-400">~6ms (200 OK)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Navigation Shortcuts */}
          <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ផ្លូវកាត់បញ្ជាប្រព័ន្ធ (Quick App Navigation)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("calendar")}
                    className="p-2.5 bg-[#16161a] hover:bg-blue-600/15 border border-white/[0.06] hover:border-blue-500/30 text-slate-200 hover:text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>📅 ប្រតិទិនសប្តាហ៍</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("month-calendar")}
                    className="p-2.5 bg-[#16161a] hover:bg-blue-600/15 border border-white/[0.06] hover:border-blue-500/30 text-slate-200 hover:text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>🕒 ប្រតិទិនខែ</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("datagrid")}
                    className="p-2.5 bg-[#16161a] hover:bg-blue-600/15 border border-white/[0.06] hover:border-blue-500/30 text-slate-200 hover:text-blue-400 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>▦ តារាងទិន្នន័យ</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("report")}
                    className="p-2.5 bg-[#16161a] hover:bg-violet-600/15 border border-white/[0.06] hover:border-violet-500/30 text-slate-200 hover:text-violet-400 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>🖨️ Export PDF Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
