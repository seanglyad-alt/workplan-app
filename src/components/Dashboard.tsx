/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  Eye, ThumbsUp, Share2, MessageSquare, TrendingUp, Users, Clock, 
  Sparkles, Award, Play, AlertCircle, RefreshCw, Heart, UserPlus, UserCheck
} from "lucide-react";
import { motion } from "motion/react";
import { AnalyticsData, PageSettings } from "../types";

interface DashboardProps {
  analytics: AnalyticsData | null;
  settings: PageSettings | null;
  onSimulateActivity: () => void;
  isLoading: boolean;
  onSettingsUpdate: (updated: Partial<PageSettings>) => void;
}

export default function Dashboard({ 
  analytics, 
  settings, 
  onSimulateActivity, 
  isLoading,
  onSettingsUpdate
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "retention" | "audience">("overview");
  const [likeCount, setLikeCount] = useState(settings?.likesCount || 41200);
  const [followerCount, setFollowerCount] = useState(settings?.followersCount || 54200);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (settings) {
      setLikeCount(settings.likesCount);
      setFollowerCount(settings.followersCount);
    }
  }, [settings]);

  if (!analytics || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="font-display">កំពុងទាញយកទិន្នន័យស្ថិតិ...</p>
      </div>
    );
  }

  // Handle direct Khmer interactive actions with "Like" and "Follow" buttons
  const handleLikePage = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
      onSettingsUpdate({ likesCount: likeCount - 1 });
    } else {
      setLikeCount(prev => prev + 1);
      onSettingsUpdate({ likesCount: likeCount + 1 });
    }
    setIsLiked(!isLiked);
  };

  const handleFollowPage = () => {
    if (isFollowed) {
      setFollowerCount(prev => prev - 1);
      onSettingsUpdate({ followersCount: followerCount - 1 });
    } else {
      setFollowerCount(prev => prev + 1);
      onSettingsUpdate({ followersCount: followerCount + 1 });
    }
    setIsFollowed(!isFollowed);
  };

  // Modern visual color palettes for recharts
  const COLORS = ["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  // Helper metric renderers
  const getMetricIcon = (metric: string) => {
    const name = metric.toLowerCase();
    if (name.includes("view") || name.includes("ទស្សនា")) return <Eye className="w-5 h-5 text-indigo-400" />;
    if (name.includes("engagement") || name.includes("អត្រា")) return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    if (name.includes("like")) return <ThumbsUp className="w-5 h-5 text-blue-400" />;
    return <Users className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="space-y-8" id="dashboard-tab">
      
      {/* 1. Header Hero with live Simulation Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl backdrop-blur-md shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono tracking-wider text-emerald-400 uppercase">ទិន្នន័យសមកាលកម្មផ្សាយផ្ទាល់ (Live Connected)</span>
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white">ផ្ទាំងគ្រប់គ្រងទិន្នន័យទូទៅ (Page Performance Dashboard)</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">តាមដានស្ថិតិទស្សនា ការចូលរួមរបស់ទស្សនិកជន និងការលូតលាស់នៃទំព័រដោយស្វ័យប្រវត្ត</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSimulateActivity}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md border border-blue-500/20 transition-all font-sans cursor-pointer disabled:opacity-50 w-full md:w-auto"
            id="simulate-activity-btn"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "កំពុងដំណើរការ..." : "សាកល្បងបង្កើតមតិយោបល់ថ្មី (Simulate Activity)"}
          </motion.button>
        </div>
      </div>

      {/* 2. Top-Level Metric Cards GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {analytics.engagementMetrics.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl hover:border-slate-300/80 dark:hover:border-white/[0.12] transition-all relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transition-all group-hover:bg-blue-500/10" />
            <div className="flex items-center justify-between">
              <span className="p-2.5 bg-slate-100 dark:bg-[#0a0a0b] rounded-xl border border-slate-200/70 dark:border-white/[0.04]">
                {getMetricIcon(item.metric)}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-mono font-medium text-emerald-400">
                +{item.change}%
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-sans text-slate-500 dark:text-slate-400 line-clamp-1">{item.metric}</h4>
              <p className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white mt-1">
                {typeof item.count === 'number' ? (item.count % 1 !== 0 ? `${item.count}%` : item.count.toLocaleString()) : item.count}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Interactive Social Live Widget & Action Target (Like/Follow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Standard interactive Page Card */}
        <div className="lg:col-span-4 p-6 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold font-display text-slate-900 dark:text-white">ទំព័រ Facebook របស់អ្នក</h3>
              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono">Sandbox</span>
            </div>
            
            <div className="relative mb-5 group">
              <img 
                src={settings.coverImage} 
                alt="Page Cover" 
                className="w-full h-28 object-cover rounded-xl opacity-75"
              />
              <div className="absolute -bottom-5 left-4 flex items-end">
                <img 
                  src={settings.pageAvatar} 
                  alt="Page Avatar" 
                  className="w-14 h-14 object-cover rounded-full border-[3px] border-[#16161a] shadow-xl"
                />
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white font-display flex items-center gap-1.5">
                {settings.pageName}
                <Award className="w-4 h-4 text-blue-400 fill-blue-400" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{settings.pageUsername} • {settings.category}</p>
              
              <div className="flex gap-4 mt-4 py-3 border-y border-slate-200/70 dark:border-white/[0.04]">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-sans">Likes</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{likeCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-sans">Followers</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{followerCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-[11px] text-slate-400 italic">
              * ចុចប៊ូតុងខាងក្រោមដើម្បីសាកល្បងចុច Like ឬ Follow ទំព័រនេះដើម្បីធ្វើឱ្យស្ថិតិខាងលើកើនឡើងភ្លាមៗ៖
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleLikePage}
                id="live-like-btn"
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isLiked 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "bg-slate-100 dark:bg-[#0f0f12] border border-slate-200/70 dark:border-white/[0.06] hover:dark:border-white/[0.12] text-slate-900 dark:text-[#d4d4d8]"
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-white" : ""}`} />
                {isLiked ? "Liked" : "Like Page"}
              </button>
              <button 
                onClick={handleFollowPage}
                id="live-follow-btn"
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isFollowed 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "bg-[#0f0f12] border-white/[0.06] hover:border-white/[0.12] text-[#d4d4d8]"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {isFollowed ? "Following" : "Follow Page"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Analytical Trend Charts with Switcher Tabs */}
        <div className="lg:col-span-8 p-6 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4 mb-4">
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900 dark:text-white">ស្ថិតិវិភាគការលូតលាស់ (Engagement Analytics)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">ជ្រើសរើសផ្ទាំងខាងក្រោមដើម្បីមើលលំនាំទិន្នន័យជាក់លាក់</p>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-[#0f0f12] rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === "overview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                ចំនួនទស្សនា
              </button>
              <button 
                onClick={() => setActiveTab("retention")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === "retention" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                រក្សាអ្នកទស្សនា
              </button>
              <button 
                onClick={() => setActiveTab("audience")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${activeTab === "audience" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                ទស្សនិកជន
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            {activeTab === "overview" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.viewsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F131E", borderColor: "#1E293B", borderRadius: "12px" }} />
                  <Area type="monotone" name="ចំនួនទស្សនា (Views)" dataKey="views" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" name="នាទីទស្សនាសរុប (Minutes)" dataKey="minutesWatched" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === "retention" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.retentionCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="seconds" name="រយៈពេលវីដេអូ (វិនាទី)" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F131E", borderColor: "#1E293B", borderRadius: "12px" }} />
                  <Area type="monotone" name="អត្រារក្សាអ្នកមើល (%)" dataKey="percent" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === "audience" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full pt-4">
                <div className="md:col-span-5 h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.audienceDemographics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.audienceDemographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.06)", borderRadius: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">សមាមាត្រអាយុទស្សនិកជន (Age Demographics)</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {analytics.audienceDemographics.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-[#0a0a0b] rounded-xl border border-white/[0.04]">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <div>
                          <span className="block text-[11px] font-sans text-slate-400">{entry.group}</span>
                          <span className="block text-xs font-bold font-mono text-white">{entry.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2.5 p-3 bg-slate-50/90 dark:bg-[#0a0a0b]/80 rounded-xl border border-slate-200/70 dark:border-white/[0.04] text-[11px] text-slate-700 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              {activeTab === "overview" && "ចំណាំ៖ ចំនួនទស្សនា និងនាទីទស្សនាកើនឡើងខ្ពស់បំផុតចន្លោះម៉ោង ១១:០០ ចុះត្រង់ពេលថ្ងៃត្រង់ និងម៉ោង ១៩:០០ ដល់ ២១:០០ យប់។"}
              {activeTab === "retention" && "ចំណាំ៖ អត្រារក្សាអ្នកមើលចុះទាបបំផុតនៅវិនាទីទី ១៥។ បង្កើន Hook ខ្លាំង ឬរូបភាព Thumbnail ឱ្យត្រូវនឹងខ្លឹមសារដើម្បីកាត់បន្ថយការអូសរំលង។"}
              {activeTab === "audience" && "ចំណាំ៖ ក្រុមអាយុចន្លោះពី ២៥-៣៤ ឆ្នាំ គឺជាអ្នកគាំទ្រសកម្មបំផុតនៅលើផុសរបស់អ្នក។"}
            </span>
          </div>

        </div>
      </div>

      {/* 4. Live Actionable Recommendations AI Bento Box */}
      <div className="p-6 bg-slate-50 dark:bg-gradient-to-br dark:from-[#1d2a3d]/20 dark:via-[#16161a] dark:to-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold font-display text-white">អនុសាសន៍បង្កើនប្រសិទ្ធភាពសម្រិតសម្រាំង (Actionable Growth Recommendations)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 bg-white dark:bg-[#0a0a0b]/60 border border-slate-200/70 dark:border-white/[0.04] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold font-mono">១</span>
              <h4 className="text-xs font-bold font-display text-slate-900 dark:text-white">ផុសក្នុងពេលវេលាមាស (Golden Hour Posting)</h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              យោងតាមទិន្នន័យទស្សនា ប្រព័ន្ធណែនាំឱ្យកំណត់កាលវិភាគផុសវីដេអូបន្ទាប់នៅម៉ោង <b>១១:៣០ ថ្ងៃត្រង់</b> ឬម៉ោង <b>៦:៣០ យប់</b> ដើម្បីទាញយក Reach ខ្ពស់បំផុត។
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#0a0a0b]/60 border border-slate-200/70 dark:border-white/[0.04] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold font-mono">២</span>
              <h4 className="text-xs font-bold font-display text-slate-900 dark:text-white">យុទ្ធសាស្ត្រ Hooks ក្នុងរង្វង់ ៥វិនាទី ដំបូង</h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              អត្រារក្សាអ្នកមើលនៅវិនាទីទី ១៥ មានការធ្លាក់ចុះខ្លាំង។ សាកល្បងបញ្ចូលចំណងជើងធំៗនៅចំកណ្តាលវីដេអូ ឬសួរសំណួរចាក់ដោតនៅវិនាទីដំបូងដើម្បីកុំឱ្យពួកគេអូសរំលង។
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#0a0a0b]/60 border border-slate-200/70 dark:border-white/[0.04] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold font-mono">៣</span>
              <h4 className="text-xs font-bold font-display text-slate-900 dark:text-white">ឆ្លើយតបមតិយោបល់ក្រោម ១០នាទី</h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              ការឆ្លើយតបមតិយោបល់របស់ទស្សនិកជនបានលឿន នឹងជួយជម្រុញឱ្យក្បួនដំណើរការ (Algorithm) របស់ Facebook ចាត់ទុកវីដេអូនោះជាការពិភាក្សាសកម្ម និងចែករំលែកវាទៅកាន់អ្នកថ្មីៗបន្ថែម។
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
