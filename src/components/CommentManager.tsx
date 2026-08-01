/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  MessageSquare, Sparkles, Send, ShieldCheck, CheckCircle2, ToggleLeft, ToggleRight, 
  PlusCircle, RefreshCw, AlertCircle, HelpCircle, User, BellRing, ArrowRight, Trash2, Heart, Edit
} from "lucide-react";
import { motion } from "motion/react";
import { Comment, AutoReplyRule } from "../types";
import { fetchWithAuth } from "../lib/api.ts";

interface CommentManagerProps {
  comments: Comment[];
  rules: AutoReplyRule[];
  notifications: any[];
  onReplySubmitted: (commentId: string, text: string, isAutoReplied?: boolean) => Promise<void>;
  onRuleAdded: (rule: Omit<AutoReplyRule, "id" | "timesTriggered">) => Promise<void>;
  onRuleToggle: (ruleId: string) => Promise<void>;
  onRuleEdited: (ruleId: string, updatedFields: Partial<AutoReplyRule>) => Promise<void>;
  onRuleDeleted: (ruleId: string) => Promise<void>;
  onSimulateActivity: () => void;
  isLoading: boolean;
}

export default function CommentManager({
  comments,
  rules,
  notifications,
  onReplySubmitted,
  onRuleAdded,
  onRuleToggle,
  onRuleEdited,
  onRuleDeleted,
  onSimulateActivity,
  isLoading
}: CommentManagerProps) {
  // Manual text reply control state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [manualReplyText, setManualReplyText] = useState("");
  const [isSuggestingAI, setIsSuggestingAI] = useState<string | null>(null);

  // New Rule Form control state
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [condition, setCondition] = useState<"contains" | "exact" | "started_with">("contains");
  const [replyTemplate, setReplyTemplate] = useState("");

  // Editing Rule states
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKeyword, setEditKeyword] = useState("");
  const [editCondition, setEditCondition] = useState<"contains" | "exact" | "started_with">("contains");
  const [editTemplate, setEditTemplate] = useState("");

  const handleStartEditRule = (rule: AutoReplyRule) => {
    setEditingRuleId(rule.id);
    setEditName(rule.name);
    setEditKeyword(rule.triggerKeyword);
    setEditCondition((rule.condition as any) || "contains");
    setEditTemplate(rule.replyTemplate);
  };

  const handleSaveEditRule = async (ruleId: string) => {
    if (!editKeyword.trim() || !editTemplate.trim()) {
      alert("សូមបំពេញពាក្យគន្លឹះ និងគំរូសារឆ្លើយតប");
      return;
    }
    await onRuleEdited(ruleId, {
      name: editName.trim() || `សារឆ្លើយតបពាក្យ៖ '${editKeyword.trim()}'`,
      triggerKeyword: editKeyword.trim(),
      condition: editCondition,
      replyTemplate: editTemplate.trim()
    });
    setEditingRuleId(null);
  };

  const handleManualReplySubmit = async (commentId: string) => {
    if (!manualReplyText.trim()) return;
    await onReplySubmitted(commentId, manualReplyText.trim(), false);
    setManualReplyText("");
    setActiveReplyId(null);
  };

  // Triggers server-side Gemini suggestion based on the follower comment
  const handleTriggerAISuggestion = async (comment: Comment) => {
    setIsSuggestingAI(comment.id);
    try {
      const response = await fetchWithAuth("/api/gemini/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentText: comment.text,
          authorName: comment.authorName,
          tone: comment.text.includes("តម្លៃ") || comment.text.includes("លុយ") ? "promotional" : "friendly"
        })
      });
      const data = await response.json();
      if (response.ok) {
        setManualReplyText(data.reply);
        setActiveReplyId(comment.id);
      } else {
        alert("មិនអាចបង្កើតការឆ្លើយតប AI បានទេ៖ " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("កំហុសក្នុងការតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ AI");
    } finally {
      setIsSuggestingAI(null);
    }
  };

  const handleAddNewRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerKeyword.trim() || !replyTemplate.trim()) {
      alert("សូមបំពេញពាក្យគន្លឹះ និងគំរូសារឆ្លើយតបអរគុណ! (Please fill trigger keyword and response template)");
      return;
    }
    await onRuleAdded({
      name: ruleName.trim() || `សារឆ្លើយតបពាក្យ៖ '${triggerKeyword.trim()}'`,
      triggerKeyword: triggerKeyword.trim(),
      condition,
      replyTemplate: replyTemplate.trim(),
      isActive: true
    });

    setRuleName("");
    setTriggerKeyword("");
    setReplyTemplate("");
    setIsCreatingRule(false);
  };

  return (
    <div className="space-y-8" id="comment-manager-tab">
      
      {/* 2x Columns split: Left is Comment Stream, Right is Auto Reply Rules and Webhook logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent comments & Manual + AI quick replier */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.04] pb-4">
              <div>
                <h3 className="text-base font-semibold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span>លំហូរមតិយោបល់ និងសកម្មភាព (Follower Comments Feed)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">មតិយោបល់ថ្មីៗពី Facebook Page ជាមួយការឆ្លើយតប AI រហ័សទាន់ចិត្ត</p>
              </div>
              <button 
                onClick={onSimulateActivity}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50 font-sans transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>បង្កើតសកម្មភាពគំរូ</span>
              </button>
            </div>

            <div className="space-y-4 divide-y divide-white/[0.04]">
              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-sans text-xs">
                  មិនទាន់មានមតិយោបល់ណាមួយនៅឡើយទេ...
                </div>
              ) : (
                comments.map((comment, index) => (
                  <div key={comment.id} className={`pt-4 first:pt-0 space-y-3.5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <img 
                          src={comment.authorAvatar} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-full border border-white/[0.06] shrink-0"
                        />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white font-display flex items-center gap-1">
                            {comment.authorName}
                            <span className="text-[9px] text-blue-400 px-1.5 py-0.2 bg-blue-500/10 border border-blue-500/20 rounded-md font-sans">អ្នកតាមដាន</span>
                          </h4>
                          <span className="block text-[9px] font-mono text-blue-400/70">លើវីដេអូ៖ {comment.postTitle}</span>
                          <p className="text-xs text-slate-200 pt-1 font-sans leading-relaxed">{comment.text}</p>
                          <span className="block text-[9px] text-slate-500 font-mono italic pt-0.5">
                            {new Date(comment.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} • ថ្ងៃទី {new Date(comment.timestamp).toLocaleDateString("kh-KH")}
                          </span>
                        </div>
                      </div>
                      
                      {!comment.isReplied && (
                        <button 
                          onClick={() => handleTriggerAISuggestion(comment)}
                          disabled={isSuggestingAI !== null}
                          id={`ai-suggest-${comment.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/35 hover:to-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {isSuggestingAI === comment.id ? "Gemini កំពុងសរសេរ..." : "ឆ្លើយតប AI"}
                        </button>
                      )}
                    </div>

                    {/* Display exist reply context */}
                    {comment.isReplied ? (
                      <div className="ml-10 p-3 bg-slate-50 dark:bg-[#0a0a0b] rounded-xl border border-slate-200/60 dark:border-white/[0.04] text-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1">
                          <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-full ${comment.isAutoReplied ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                            {comment.isAutoReplied ? "Auto Responder AI" : "Manual Agent Send"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-display">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>ការឆ្លើយតបពីទំព័រ (Page Team Reply)</span>
                        </div>
                        <p className="text-slate-300 pl-1 font-sans leading-relaxed">{comment.replyText}</p>
                      </div>
                    ) : (
                      // Handle quick inline response form
                      <div className="ml-10">
                        {activeReplyId === comment.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              rows={2}
                              value={manualReplyText}
                              onChange={(e) => setManualReplyText(e.target.value)}
                              placeholder="សរសេរសារឆ្លើយតបទៅកាន់គាត់នៅទីនេះ..."
                              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#0a0a0b] border border-slate-200/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setActiveReplyId(null);
                                  setManualReplyText("");
                                }}
                                className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleManualReplySubmit(comment.id)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>ផ្ញើចេញ</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveReplyId(comment.id);
                              setManualReplyText("");
                            }}
                            className="text-[10px] text-slate-500 hover:text-blue-450 underline font-sans flex items-center gap-1 cursor-pointer"
                          >
                            ឆ្លើយតបដោយដៃ (Manual Reply)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Repetitive message auto replier configuration (ច្បាប់ឆ្លើយតបសារដដែលៗ) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Auto Reply Rules Manager */}
          <div className="p-6 bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <div>
                <h3 className="text-sm font-semibold font-display text-white">ប្រព័ន្ធស្វ័យប្រវត្តឆ្លើយតបសារដដែលៗ (Auto Responders)</h3>
                <p className="text-[10px] text-slate-400 font-sans">គ្រប់គ្រងច្បាប់ឆ្លើយតបស្វ័យប្រវត្តទៅតាមពាក្យគន្លឹះ</p>
              </div>
              <button 
                onClick={() => setIsCreatingRule(!isCreatingRule)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 select-none focus:outline-none cursor-pointer font-sans"
              >
                <PlusCircle className="w-4 h-4" />
                <span>បង្កើតច្បាប់</span>
              </button>
            </div>

            {/* New rule create form inline mockup */}
            {isCreatingRule && (
              <form onSubmit={handleAddNewRule} className="p-4 bg-[#0a0a0b] border border-white/[0.06] rounded-xl space-y-3.5">
                <h4 className="text-xs font-bold text-white font-display">រៀបចំច្បាប់ថ្មី (Create Auto Reply Rule)</h4>
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-sans">ឈ្មោះច្បាប់សម្គាល់</label>
                  <input 
                    type="text"
                    required
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ ច្បាប់ស្វាគមន៍ / សួរទីតាំង"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-sans">ពាក្យគន្លឹះ (Trigger keyword)</label>
                    <input 
                      type="text"
                      required
                      value={triggerKeyword}
                      onChange={(e) => setTriggerKeyword(e.target.value)}
                      placeholder="ឧទាហរណ៍៖ តម្លៃ, តំលៃ"
                      className="w-full px-2.5 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-white placeholder-slate-650 focus:outline-none font-sans focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-sans">លក្ខខណ្ឌវិភាគ</label>
                    <select 
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                    >
                      <option value="contains font-sans">មានផ្ទុកពាក្យនេះ</option>
                      <option value="exact font-sans">ពាក្យនេះសុទ្ធសាធ</option>
                      <option value="started_with">ចាប់ផ្តើមដោយ</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-sans">គំរូសារឆ្លើយតបត្រឡប់ (Response Template)</label>
                  <textarea 
                    rows={2}
                    required
                    value={replyTemplate}
                    onChange={(e) => setReplyTemplate(e.target.value)}
                    placeholder="សរសេរសារដែលចង់ឱ្យប្រព័ន្ធសរសេរតបវិញស្វ័យប្រវត្ត..."
                    className="w-full px-2.5 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-white placeholder-slate-650 focus:outline-none font-sans focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingRule(false)}
                    className="px-2.5 py-1 text-slate-400 uppercase font-semibold hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-3.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                  >
                    រក្សាទុកច្បាប់ (Create Rule)
                  </button>
                </div>
              </form>
            )}

            {/* Existing Rule Stream list cards */}
            <div className="space-y-3">
              {rules.map(rule => {
                const isEditingThis = editingRuleId === rule.id;
                if (isEditingThis) {
                  return (
                    <form 
                      key={rule.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEditRule(rule.id);
                      }}
                      className="p-4 bg-[#0a0a0b] border border-blue-500/30 rounded-xl space-y-3 animate-fade-in text-left"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                        <h4 className="text-[11px] font-bold text-blue-400 font-display">កែសម្រួលច្បាប់ (Edit Auto Responder)</h4>
                        <span className="text-[9px] text-slate-500 font-mono">ID: {rule.id}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-sans">ឈ្មោះច្បាប់សម្គាល់</label>
                        <input 
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-sans">ពាក្យគន្លឹះ</label>
                          <input 
                            type="text"
                            required
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-blue-500 font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-400 font-sans">លក្ខខណ្ឌវិភាគ</label>
                          <select 
                            value={editCondition}
                            onChange={(e) => setEditCondition(e.target.value as any)}
                            className="w-full px-2 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                          >
                            <option value="contains">មានផ្ទុកពាក្យនេះ</option>
                            <option value="exact">ពាក្យនេះសុទ្ធសាធ</option>
                            <option value="started_with">ចាប់ផ្តើមដោយ</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-400 font-sans">គំរូសារឆ្លើយតប</label>
                        <textarea 
                          rows={2}
                          required
                          value={editTemplate}
                          onChange={(e) => setEditTemplate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#16161a] border border-white/[0.06] rounded-lg text-white focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>

                      <div className="flex justify-end gap-2 text-xs pt-1">
                        <button 
                          type="button"
                          onClick={() => setEditingRuleId(null)}
                          className="px-2.5 py-1 text-slate-400 uppercase font-semibold hover:text-slate-200 cursor-pointer text-[10px]"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                        >
                          រក្សាទុកការកែប្រែ (Save Changes)
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div key={rule.id} className="p-3.5 bg-slate-50 dark:bg-[#0a0a0b] border border-slate-200/60 dark:border-white/[0.04] rounded-xl flex items-start justify-between gap-3 group hover:border-slate-300/40 dark:hover:border-white/[0.1] transition-all duration-200">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? "bg-emerald-500" : "bg-slate-700"}`} />
                        <h4 className="text-xs font-bold text-white font-display">{rule.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans">
                        លក្ខខណ្ឌ៖ <span className="font-semibold text-slate-400">"{rule.triggerKeyword}"</span> ({rule.condition === "contains" ? "មានផ្ទុក" : "ស្មើនឹង"})
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic font-sans animate-pulse-slow">" {rule.replyTemplate} "</p>
                      <span className="block text-[9px] text-blue-400 font-mono">បានឆ្លើយតប៖ {rule.timesTriggered}  ដង</span>
                    </div>
                    <div className="flex flex-col items-end justify-between self-stretch gap-2.5 shrink-0">
                      <button 
                        onClick={() => onRuleToggle(rule.id)}
                        className="text-slate-400 hover:text-white shrink-0 cursor-pointer focus:outline-none"
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-600" />
                        )}
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          title="កែសម្រួលច្បាប់ (Edit Rule)"
                          onClick={() => handleStartEditRule(rule)}
                          className="p-1 cursor-pointer text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="លុបច្បាប់ (Delete Rule)"
                          onClick={async () => {
                            if (window.confirm(`តើបងពិតជាចង់លុបច្បាប់ស្វ័យប្រវត្ត "${rule.name}" នេះមែនទេ?`)) {
                              await onRuleDeleted(rule.id);
                            }
                          }}
                          className="p-1 cursor-pointer text-slate-450 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Webhook real-time notification Center logs */}
          <div className="p-6 bg-white dark:bg-[#16161a] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold font-display text-slate-900 dark:text-white flex items-center gap-1.5">
              <BellRing className="w-4.5 h-4.5 text-blue-400" />
              <span>កំណត់ត្រាព្រឹត្តិការណ៍សមកាលកម្ម (Real-time Event Webhook Logger)</span>
            </h3>

            <div className="space-y-2.5 max-h-56 overflow-y-auto font-sans">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-slate-50 dark:bg-[#0a0a0b] rounded-xl border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-2 text-xs">
                  <span className={`p-1 rounded-lg ${notif.type === 'comment' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'} shrink-0`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <h5 className="font-bold text-white text-[11px] font-display">{notif.title}</h5>
                    <p className="text-slate-400 text-[10px] font-sans leading-normal">{notif.message}</p>
                    <span className="block text-[8px] text-slate-600 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
