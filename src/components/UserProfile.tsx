/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, Mail, Shield, Calendar, Phone, Lock, Camera, Save, ArrowLeft, 
  CheckCircle2, XCircle, Eye, EyeOff, Trash2, UserPlus, Fingerprint, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "../types";

interface UserProfileProps {
  user: UserRole | null;
  onUpdateProfile: (userId: string, data: Partial<UserRole & { password?: string }>) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export default function UserProfile({ user, onUpdateProfile, onBack, isLoading }: UserProfileProps) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "Editor");
  const [sex, setSex] = useState(user?.sex || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [department, setDepartment] = useState(user?.department || "");
  
  // Password change state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "Editor");
      setSex(user.sex || "");
      setDob(user.dob || "");
      setPhoneNumber(user.phoneNumber || "");
      setAvatar(user.avatar || "");
      setDepartment(user.department || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      setPasswordError("លេខសម្ងាត់មិនត្រូវគ្នា! (Passwords do not match)");
      return;
    }

    setPasswordError("");
    setSavingStatus("saving");

    try {
      if (!user) return;
      await onUpdateProfile(user.id, {
        name,
        email,
        role,
        sex,
        dob,
        phoneNumber,
        avatar,
        department,
        ...(password ? { password } : {})
      });
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 3000);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("មានបញ្ហាក្នុងការរក្សាកំណត់ត្រា!");
      setSavingStatus("idle");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
      id="user-profile-view"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-slate-400 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white font-display">កំណត់ព័ត៌មានបុគ្គល (Profile Settings)</h2>
          <p className="text-xs text-slate-500 font-sans">គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន និងការសម្ងាត់របស់គណនី</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Avatar & Basic Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-[#16161a] border border-white/[0.06] rounded-3xl text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-4 border-white/[0.04] p-1.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-2xl mx-auto overflow-hidden">
                <img 
                  src={avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"} 
                  alt={name} 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <label 
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full border border-blue-400/20 cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-90"
                title="ដូររូបថត (Upload Profile Picture)"
              >
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white font-display">{name || "Staff Member"}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">{email}</p>
              <div className="mt-3 flex justify-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                  role === 'Editor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' :
                  role === 'Moderator' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' : 
                  'bg-slate-500/10 text-slate-400 border-slate-500/10'
                }`}>
                  {role}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.04] grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-sans">ភេទ (Sex)</span>
                <p className="text-xs text-white font-bold">{sex === 'male' ? 'ប្រុស' : sex === 'female' ? 'ស្រី' : 'មិនទាន់កំណត់'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-sans">ថ្ងៃខែឆ្នាំកំណើត</span>
                <p className="text-xs text-white font-bold">{dob || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#0a0a0b] border border-white/[0.04] rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>សិទ្ធិអនុញ្ញាត (Account Access)</span>
            </h4>
            <div className="space-y-2">
              {(user.permissions || []).map(pkey => {
                let label = "";
                if (pkey === "publish_posts") label = "📤 បង្ហោះនិងគ្រប់គ្រងមាតិកា";
                else if (pkey === "manage_settings") label = "⚙️ រៀបចំកំណត់ប្រព័ន្ធ";
                else if (pkey === "auto_replies") label = "💬 ឆ្លើយតបមតិស្វ័យប្រវត្ត";
                else if (pkey === "view_analytics") label = "📊 វិភាគស្ថិតិទិន្នន័យ";
                else if (pkey === "delete_content") label = "🗑️ លុបមតិយោបល់";
                else label = pkey;

                return (
                  <div key={pkey} className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{label}</span>
                  </div>
                );
              })}
              {(!user.permissions || user.permissions.length === 0) && (
                <p className="text-[10px] text-slate-600 italic">មិនទាន់មានសិទ្ធិកំណត់ជាពិសេសនៅឡើយ</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-[#16161a] border border-white/[0.06] rounded-3xl p-8 space-y-8 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-4">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white font-display">ព័ត៌មានមូលដ្ឋាន (General Information)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">ឈ្មោះពេញ (Full Name) *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">សារអេឡិចត្រូនិច (Email Address) *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">ភេទ (Gender)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSex("male")}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        sex === 'male' 
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' 
                          : 'bg-[#0a0a0b] border-white/[0.06] text-slate-500 hover:border-white/[0.1]'
                      }`}
                    >
                      ប្រុស (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex("female")}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        sex === 'female' 
                          ? 'bg-purple-600/10 border-purple-500/40 text-purple-400' 
                          : 'bg-[#0a0a0b] border-white/[0.06] text-slate-500 hover:border-white/[0.1]'
                      }`}
                    >
                      ស្រី (Female)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">លេខទូរស័ព្ទ (Phone Number)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="012 345 678"
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">តួនាទី (Role)</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={role}
                      disabled={user.role !== 'Admin'}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Analyst">Analyst</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">ផ្នែក/ដេប៉ាតឺម៉ង់ (Department)</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="ឧ. Operations"
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white font-display">សុវត្ថិភាពគណនី (Account Security)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">ផ្លាស់ប្តូរលេខសម្ងាត់ (New Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="ទុកចោលបើមិនចង់ផ្លាស់ប្តូរ"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-[#0a0a0b] border border-white/[0.06] rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 font-sans">បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm New Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="បញ្ជាក់លេខសម្ងាត់ថ្មី"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-[#0a0a0b] border rounded-xl text-white text-xs focus:ring-2 transition-all font-mono ${
                        confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-white/[0.06] focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {passwordError && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 animate-pulse">
                  <XCircle className="w-3.5 h-3.5" />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-sans">
                <Fingerprint className="w-4 h-4" />
                <span>គណនីនេះត្រូវបានការពារដោយការផ្ទៀងផ្ទាត់កម្រិតខ្ពស់</span>
              </div>
              <button
                type="submit"
                disabled={isLoading || savingStatus === "saving"}
                className={`flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-xl shadow-blue-600/10 transition-all cursor-pointer ${
                  savingStatus === "saving" ? "animate-pulse" : ""
                }`}
              >
                <Save className="w-4 h-4" />
                {savingStatus === "saving" 
                  ? "កំពុងរក្សាទុក..." 
                  : savingStatus === "saved" 
                    ? "រក្សាទុកដោយជោគជ័យ!" 
                    : "រក្សាទុកការកែប្រែ (Update Profile)"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
