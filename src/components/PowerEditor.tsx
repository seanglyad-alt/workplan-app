/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Video, FileText, Calendar, Tag, ShieldCheck, Sparkles, 
  HelpCircle, ThumbsUp, Heart, Share2, Upload, AlertCircle, Play, Pause, Save, CheckCircle2, UserCheck,
  MessageSquare, Globe, MoreHorizontal, X, Send, Eye
} from "lucide-react";
import { motion } from "motion/react";
import { VideoPost, AutoReplyRule, PostStatus } from "../types";
import { fetchWithAuth } from "../lib/api.ts";

interface PowerEditorProps {
  onPostCreated: (post: Omit<VideoPost, "id" | "likesCount" | "commentsCount" | "sharesCount" | "viewsCount" | "createdAt">) => Promise<void>;
  rules: AutoReplyRule[];
}

export default function PowerEditor({ onPostCreated, rules }: PowerEditorProps) {
  // Input form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("បច្ចេកវិទ្យា និងអាជីវកម្ម");
  const [tags, setTags] = useState<string[]>(["KhmerDigital", "VideoPost"]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [publishMode, setPublishMode] = useState<"instant" | "scheduled">("scheduled");
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 2);
    nextHour.setMinutes(0);
    return nextHour.toISOString().slice(0, 16);
  });

  // Video Drag and Drop upload states
  const [videoFile, setVideoFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"16_9" | "9_16" | "1_1" | "4_5">("16_9");
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation Feed Card States
  const [feedLiked, setFeedLiked] = useState(false);
  const [feedFollowed, setFeedFollowed] = useState(false);
  const [previewLikes, setPreviewLikes] = useState(148);

  // Interactive Live Comment Sandbox States
  const [simulatedComments, setSimulatedComments] = useState<any[]>([
    {
      id: "sim-1",
      authorName: "សុខ ជា (Sok Chea)",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      text: "វីដេអូនេះមានប្រយោជន៍ខ្លាំងណាស់បង! តើខ្ញុំអាចទទួលបានប្រព័ន្ធជំនួយនេះដោយរបៀបណា? ចង់បាន",
      timestamp: "2 mins ago",
      replies: []
    }
  ]);
  const [commentInputText, setCommentInputText] = useState("");
  const [isPageReplyLocallyTriggering, setIsPageReplyLocallyTriggering] = useState<string | null>(null);

  // AI loading and helper states
  const [aiTopic, setAiTopic] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTone, setAiTone] = useState("Professional and Inspiring");
  const [activeAITip, setActiveAITip] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedVideo(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedVideo(files[0]);
    }
  };

  const processSelectedVideo = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("សូមជ្រើសរើសប្រភេទឯកសារវីដេអូបង! (Please select a video file)");
      return;
    }
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const blobUrl = URL.createObjectURL(file);
    setVideoFile({
      name: file.name,
      size: `${sizeInMB} MB`,
      url: blobUrl
    });
    setIsPlaying(true);
  };

  // Add Tags
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Call Server-side AI generator endpoint
  const handleAiGeneration = async () => {
    if (!aiTopic.trim()) {
      alert("សូមបញ្ចូលប្រធានបទ ឬខ្លឹមសារសង្ខេបសម្រាប់ AI ជំនួយការថតចម្លង (Please enter a topic or video concept for AI assistant)");
      return;
    }
    setIsAiGenerating(true);
    try {
      const response = await fetchWithAuth("/api/gemini/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          concept: aiTopic,
          category,
          languageTone: aiTone
        })
      });
      const data = await response.json();
      if (response.ok) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        if (data.tags && Array.isArray(data.tags)) {
          setTags(data.tags);
        }
        if (data.recommendedPostTime) {
          setScheduledDateTime(new Date(data.recommendedPostTime).toISOString().slice(0, 16));
        }
        setActiveAITip("AI បានបង្កើតចំណងជើង និងទិន្នន័យសម្រាប់វីដេអូបងរួចរាល់ហើយ!");
      } else {
        alert("កំហុសក្នុងការបង្កើតទិន្នន័យ៖ " + (data.error || "មិនស្គាល់"));
      }
    } catch (err) {
      console.error(err);
      alert("មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ AI បានទេ");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Submit Form to save Scheduled/Published Post
  const [isPublishing, setIsPublishing] = useState(false);
  const [postSavedStatus, setPostSavedStatus] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("សូមបញ្ចូលចំណងជើងវីដេអូ! (Video title is required)");
      return;
    }

    setIsPublishing(true);
    try {
      await onPostCreated({
        title,
        description,
        videoUrl: videoFile?.url || "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
        tags,
        status: publishMode === "instant" ? PostStatus.PUBLISHED : PostStatus.SCHEDULED,
        scheduledTime: new Date(scheduledDateTime).toISOString(),
        thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
        autoReplyRuleId: selectedRuleId || undefined,
        category,
        aspectRatio
      });

      setPostSavedStatus(true);
      setTimeout(() => {
        setPostSavedStatus(false);
        // Clear fields
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setTags(["KhmerDigital", "VideoPost"]);
        setSelectedRuleId("");
        setAiTopic("");
      }, 3000);

    } catch (err) {
      console.error(err);
      alert("មានបញ្ហាក្នុងការបង្កើតកាលវិភាគវីដេអូ");
    } finally {
      setIsPublishing(false);
    }
  };

  // Feed simulation interactive elements
  const handleFeedLike = () => {
    if (feedLiked) {
      setPreviewLikes(prev => prev - 1);
    } else {
      setPreviewLikes(prev => prev + 1);
    }
    setFeedLiked(!feedLiked);
  };

  const handleAddSimulatedComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInputText.trim()) return;

    const newCommentId = `sim-user-${Date.now()}`;
    const userCommentText = commentInputText.trim();
    const newComment = {
      id: newCommentId,
      authorName: "បង (You)",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      text: userCommentText,
      timestamp: "Just now",
      replies: []
    };

    setSimulatedComments(prev => [...prev, newComment]);
    setCommentInputText("");

    // Simulate rule reply if there is an active connected rule
    const linkedRule = rules.find(r => r.id === selectedRuleId);
    if (linkedRule) {
      const keyword = linkedRule.triggerKeyword.trim().toLowerCase();
      const textLower = userCommentText.toLowerCase();
      
      let isMatched = false;
      if (linkedRule.condition === "exact") {
        isMatched = textLower === keyword;
      } else if (linkedRule.condition === "started_with") {
        isMatched = textLower.startsWith(keyword);
      } else { // "contains"
        isMatched = textLower.includes(keyword);
      }

      if (isMatched) {
        setIsPageReplyLocallyTriggering(newCommentId);
        setTimeout(() => {
          setSimulatedComments(prev => {
            return prev.map(c => {
              if (c.id === newCommentId) {
                return {
                  ...c,
                  replies: [
                    ...c.replies,
                    {
                      id: `sim-reply-${Date.now()}`,
                      authorName: "ចំណេះដឹងបច្ចេកវិទ្យា & ឌីជីថល (Page Owner)",
                      authorAvatar: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80",
                      text: linkedRule.replyTemplate,
                      timestamp: "Just now",
                      isPage: true
                    }
                  ]
                };
              }
              return c;
            });
          });
          setIsPageReplyLocallyTriggering(null);
        }, 1500); // 1.5 seconds typing simulator
      }
    }
  };

  return (
    <div className="space-y-8" id="power-editor-tab">
      
      {/* Top Banner Context info */}
      <div className="p-5 bg-[#16161a] border border-white/[0.06] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Power Editor ផុសវីដេអូ និងគ្រប់គ្រងកាលវិភាគ</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">ផ្ទុកវីដេអូ រៀបចំខ្លឹមសារផ្សាយ និងភ្ជាប់ប្រព័ន្ធឆ្លើយតបមតិយោបល់ស្វ័យប្រវត្តក្នុងពេលតែមួយ</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#0a0a0b] rounded-xl border border-white/[0.04] text-slate-300 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ប្រព័ន្ធសុវត្ថិភាពខ្ពស់ និងការការពារ API</span>
        </div>
      </div>

      {/* Main split double columns panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Video sandbox & Feed Post simulation markup */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#16161a] border border-white/[0.06] rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold font-display text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              <span>វីដេអូ និងការបង្ហាញគំរូ (Video Upload & Feed Preview)</span>
            </h3>

            {/* Drag & Drop Upload Block */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-blue-500 bg-blue-500/5" 
                  : "border-white/[0.08] hover:border-white/[0.15] bg-[#0a0a0b]/60"
              }`}
              id="drop-zone-container"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/*"
                className="hidden" 
              />
              {videoFile ? (
                <div className="space-y-3 w-full">
                  <div className="mx-auto w-10 h-10 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{videoFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{videoFile.size}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-[10px] text-blue-400 hover:underline font-mono"
                  >
                    ជ្រើសរើសវីដេអូផ្សេងទៀត (Select Another)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-blue-600/10 text-blue-400 flex items-center justify-center rounded-xl border border-blue-500/15">
                    <Upload className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold font-display text-slate-200">អូសនិងទម្លាក់វីដេអូត្រង់នេះ (Drag & Drop Video Here)</p>
                    <p className="text-[10px] text-slate-500 mt-1">ឬចុចទីនេះដើម្បីស្វែងរកឯកសារក្នុងម៉ាស៊ីន</p>
                  </div>
                  <span className="inline-block text-[9px] px-2 py-0.5 bg-[#0a0a0b] border border-white/[0.04] rounded font-mono text-slate-400">គាំទ្រ MP4, MOV, WebM</span>
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector Section (Always Visible) */}
            <div className="space-y-2 border-t border-white/[0.04] pt-4.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-sans font-bold text-slate-300">ជ្រើសរើសសមាមាត្រកញ្ចក់វីដេអូវែង / ខ្លី (Video Aspect Ratio)៖</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono font-bold px-2 py-0.5 rounded-md border border-blue-500/15">
                  {aspectRatio === "16_9" ? "16:9 Landscape" :
                   aspectRatio === "9_16" ? "9:16 Vertical Reels" :
                   aspectRatio === "1_1" ? "1:1 Square Post" :
                   "4:5 Portrait Feed"}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 p-1 bg-[#0a0a0b] rounded-xl border border-white/[0.05]">
                <button 
                  type="button"
                  onClick={() => setAspectRatio("16_9")}
                  className={`py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    aspectRatio === "16_9" 
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/15" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="w-5 h-3 border border-current rounded-[1.5px] opacity-80" />
                  <span>16:9 ផ្ដេក</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setAspectRatio("9_16")}
                  className={`py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    aspectRatio === "9_16" 
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/15" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="w-3 h-5 border border-current rounded-[1.5px] opacity-80" />
                  <span>9:16 បញ្ឈរ (Reels)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setAspectRatio("1_1")}
                  className={`py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    aspectRatio === "1_1" 
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/15" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="w-4 h-4 border border-current rounded-[1.5px] opacity-80" />
                  <span>1:1 ការ៉េ</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setAspectRatio("4_5")}
                  className={`py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    aspectRatio === "4_5" 
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/15" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="w-3.5 h-4 border border-current rounded-[1.5px] opacity-80" />
                  <span>4:5 បញ្ឈរខ្លី</span>
                </button>
              </div>
            </div>

            {/* Video Player Render with Dynamic Aspect Ratio */}
            {videoFile && (
              <div className="space-y-2 border-t border-white/[0.04] pt-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">វីដេអូដែលបានជ្រើសរើស (Selected Playback Preview)៖</span>
                </div>

                <div className={`relative bg-slate-950 rounded-xl overflow-hidden border border-white/[0.06] transition-all duration-300 ${
                  aspectRatio === "16_9" ? "aspect-video w-full" : 
                  aspectRatio === "9_16" ? "aspect-[9/16] max-h-[360px] mx-auto" : 
                  aspectRatio === "1_1" ? "aspect-square max-h-[300px] mx-auto" : 
                  "aspect-[4/5] max-h-[330px] mx-auto"
                }`}>
                  <video 
                    src={videoFile.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Facebook feed sandbox simulations */}
            <div className="border border-white/[0.06] bg-[#18191a] rounded-2xl p-4.5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2] animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-sans">គំរូទម្រង់ផុសលើហ្វេសប៊ុក (Live Facebook Feed Simulator)</span>
                </div>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-mono font-bold tracking-wide">Preview Fully Active</span>
              </div>

              {/* Feed simulation card detail structure */}
              <div className="bg-[#242526] border border-white/[0.06] rounded-xl p-4 space-y-3.5 shadow-md">
                
                {/* Header segment of FB post */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80" 
                      alt="Brand Page Avatar" 
                      className="w-10 h-10 rounded-full object-cover border border-white/[0.08]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display hover:underline cursor-pointer">
                        ចំណេះដឹងបច្ចេកវិទ្យា & ឌីជីថល (MetaStream Pro)
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1877f2] text-white text-[8px] font-bold select-none" title="Verified Page">✓</span>
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans mt-0.5 select-none">
                        <span>គ្រោងផុស (Scheduled)</span>
                        <span>•</span>
                        <Globe className="w-3 h-3 text-slate-400 inline" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Options dots */}
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-1 px-1.5 hover:bg-white/5 rounded-full text-slate-400 transition-colors" title="More Options">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1 px-1.5 hover:bg-white/5 rounded-full text-slate-400 transition-colors" title="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Caption / description segment - highlights hashtags automatically */}
                <div className="space-y-1">
                  {title && (
                    <h5 className="text-[13px] font-bold text-white tracking-tight font-display pr-2 line-clamp-2">
                      {title}
                    </h5>
                  )}
                  <p className="text-[12px] text-slate-200 whitespace-pre-wrap leading-relaxed font-sans mt-1">
                    {description ? (
                      description.split(/(\s+)/).map((part, index) => {
                        if (part.startsWith("#")) {
                          return <span key={index} className="text-[#385898] hover:underline cursor-pointer font-medium">{part}</span>;
                        }
                        return part;
                      })
                    ) : (
                      "សូមសរសេរខ្លឹមសាររៀបរាប់ ឬប្រើជំនួយការ AI ដើម្បីបង្កើត Caption ដ៏ទាក់ទាញត្រង់នេះ..."
                    )}
                  </p>
                </div>

                {/* Media frame with realistic player overlay */}
                <div className={`relative bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-white/[0.04] group transition-all duration-300 ${
                  aspectRatio === "16_9" ? "aspect-video w-full" : 
                  aspectRatio === "9_16" ? "aspect-[9/16] max-h-[380px] mx-auto" : 
                  aspectRatio === "1_1" ? "aspect-square max-h-[300px] mx-auto" : 
                  "aspect-[4/5] max-h-[340px] mx-auto"
                }`}>
                  {videoFile ? (
                    <div className="w-full h-full relative">
                      <video src={videoFile.url} className="w-full h-full object-cover" muted loop autoPlay />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="p-2.5 bg-black/60 rounded-full text-white"><Play className="w-5 h-5" /></span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center space-y-1">
                      <Video className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-[10px] font-sans font-semibold text-slate-400">មិនទាន់មានវីដេអូភ្ជាប់ (No Attached Video)</p>
                      <p className="text-[9px] text-slate-500 max-w-xs leading-normal">សូមផ្ទុកវីដេអូបងឡើងនៅផ្នែកខាងលើដើម្បីបង្ហាញក្នុង Preview</p>
                    </div>
                  )}
                </div>

                {/* Dynamic Call-to-action messenger wrapper if rules are attached */}
                {selectedRuleId && (
                  <div className="bg-[#1c1e21] border border-white/[0.05] rounded-lg p-3 flex items-center justify-between gap-3 select-none hover:bg-[#303031] transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-[#1877f2] font-mono tracking-wider font-semibold uppercase">M.ME/METASTREAM_CONSOLE</p>
                      <p className="text-[11px] font-bold text-white">ផ្ញើសារដើម្បីទាក់ទងមកយើងខ្ញុំ (Send us a message)</p>
                      <p className="text-[9.5px] text-slate-400 leading-none">ប្រព័ន្ធឆ្លើយតបស្វ័យប្រវត្តិ {rules.find(r => r.id === selectedRuleId)?.name} ត្រូវបានភ្ជាប់ជោគជ័យ!</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById("simulated-comment-input");
                        if (inputEl) {
                          inputEl.focus();
                          // Briefly focus and scroll
                          inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                      className="px-3 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm shrink-0 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                      <span>ផ្ញើសារ</span>
                    </button>
                  </div>
                )}

                {/* Overlapping Facebook Reaction Icons summary */}
                <div className="flex items-center justify-between py-1 border-b border-white/[0.04] text-[11px] text-slate-400 font-sans select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center -space-x-1">
                      {/* Thumbsup bubble */}
                      <span className="w-4 h-4 rounded-full bg-[#1877f2] flex items-center justify-center border border-[#242526] shadow">
                        <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                      </span>
                      {/* Heart bubble */}
                      <span className="w-4 h-4 rounded-full bg-[#f02849] flex items-center justify-center border border-[#242526] shadow">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </span>
                      {/* Sparkle star bubble */}
                      <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center border border-[#242526] shadow">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </span>
                    </div>
                    <span className="font-mono text-slate-300">
                      {feedLiked ? `You and ${previewLikes - 1} others` : `${previewLikes} Likes`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="hover:underline cursor-pointer">{simulatedComments.length + simulatedComments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)} Comments</span>
                    <span>•</span>
                    <span className="hover:underline cursor-pointer">4 Shares</span>
                  </div>
                </div>

                {/* Facebook Action Buttons panel */}
                <div className="grid grid-cols-3 gap-1 py-0.5 text-xs text-slate-300 border-b border-white/[0.04]">
                  <button 
                    type="button"
                    onClick={handleFeedLike}
                    id="preview-like-btn"
                    className={`flex items-center justify-center gap-1.5 py-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer ${
                      feedLiked 
                        ? "text-[#1877f2] font-bold" 
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${feedLiked ? "fill-[#1877f2] text-[#1877f2]" : ""}`} />
                    <span>Like</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      const inputEl = document.getElementById("simulated-comment-input");
                      if (inputEl) inputEl.focus();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer text-slate-300 hover:text-white"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Comment</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      alert("វីដេអូនេះត្រូវបានសាកល្បងចែករំលែកដោយជោគជ័យ! (Simulated post share completed!)");
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer text-slate-300 hover:text-white"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Simulated Comment Lists playground */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 select-none pb-1">
                    <span className="hover:underline font-bold cursor-pointer">Most Relevant (មតិយោបល់សំខាន់ៗ)</span>
                    <span className="text-[10px]">Simulation Streamer</span>
                  </div>

                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 customize-scrollbar">
                    {simulatedComments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-2.5 text-xs">
                          <img 
                            src={comment.authorAvatar} 
                            alt="avatar" 
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/[0.04]" 
                          />
                          <div className="space-y-1 flex-1">
                            <div className="bg-[#1c1e21] rounded-2xl px-3 py-2.5 max-w-[90%] inline-block">
                              <p className="font-bold text-white tracking-tight flex items-center gap-1 select-none">
                                {comment.authorName}
                                {comment.authorName.includes("You") || comment.authorName.includes("បង") ? (
                                  <span className="text-[8px] bg-[#1877f2]/20 text-[#1877f2] font-semibold px-1 rounded border border-[#1877f2]/10 ml-1">You</span>
                                ) : null}
                              </p>
                              <p className="text-slate-100 font-sans leading-normal whitespace-pre-wrap text-[11.5px] mt-0.5">{comment.text}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pl-2 select-none">
                              <span className="hover:underline cursor-pointer hover:text-white">Like</span>
                              <span 
                                onClick={() => {
                                  const inputEl = document.getElementById("simulated-comment-input");
                                  if (inputEl) inputEl.focus();
                                }}
                                className="hover:underline cursor-pointer hover:text-white"
                              >
                                Reply
                              </span>
                              <span>{comment.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nested Replies of comment block */}
                        {comment.replies && comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-2 pl-9 text-xs">
                            <img 
                              src={reply.authorAvatar} 
                              alt="page avatar" 
                              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" 
                            />
                            <div className="space-y-1 flex-1">
                              <div className="bg-[#1c1e21] border border-white/[0.04] rounded-2xl px-3 py-2 max-w-[90%] inline-block">
                                <p className="font-bold text-[#1877f2] tracking-tight flex items-center gap-1 text-[11px] select-none">
                                  {reply.authorName}
                                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#1877f2] text-white text-[7px] font-bold">✓</span>
                                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded-full border border-emerald-500/15 font-mono ml-1">AI Automated</span>
                                </p>
                                <p className="text-slate-200 font-sans leading-normal whitespace-pre-wrap text-[11.5px] mt-0.5">{reply.text}</p>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pl-2 select-none">
                                <span className="hover:underline cursor-pointer hover:text-white">Like</span>
                                <span>{reply.timestamp}</span>
                                <span className="text-[9px] text-[#10b981] font-bold flex items-center gap-0.5 font-mono">
                                  <span className="w-1 h-1 rounded-full bg-[#10b981] animate-pulse inline-block mr-1" />
                                  Auto-Responder Secure
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Typing state indicator inside replies */}
                        {isPageReplyLocallyTriggering === comment.id && (
                          <div className="flex items-start gap-2 pl-9 text-xs">
                            <div className="w-7 h-7 rounded-full bg-[#1c1e21] flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 border border-white/[0.04]">P</div>
                            <div className="bg-[#1c1e21] rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-sans italic">ប្រព័ន្ធកំពុងឆ្លើយតប... (Automation is replying...)</span>
                              <span className="flex gap-1 select-none">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-0" />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Comment Input block */}
                  <form onSubmit={handleAddSimulatedComment} className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04]">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" 
                      alt="Your Avatar" 
                      className="w-7 h-7 rounded-full object-cover shrink-0" 
                    />
                    <div className="relative flex-1">
                      <input 
                        id="simulated-comment-input"
                        type="text"
                        value={commentInputText}
                        onChange={(e) => setCommentInputText(e.target.value)}
                        placeholder={selectedRuleId && rules.find(r => r.id === selectedRuleId) 
                          ? `វាយពាក្យគន្លឹះ "${rules.find(r => r.id === selectedRuleId)?.triggerKeyword}" ដើម្បីសាកល្បង Auto Reply...` 
                          : "សរសេរមតិយោបល់របស់អ្នក..."}
                        className="w-full pl-3.5 pr-9 py-2 text-xs bg-[#1c1e21] border border-white/[0.06] rounded-full text-white placeholder-slate-500 focus:outline-none focus:border-[#1877f2] font-sans"
                      />
                      <button 
                        type="submit"
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-[#1877f2] cursor-pointer transition-colors p-1"
                        title="Submit Comment"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Details & Automation fields + AI Assistant panels */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Generator Helper Assistant block */}
          <div className="p-5 bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-display text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-400" />
                <span>ជំនួយការសរសេរប្រកបដោយចំណេះដឹង AI (Gemini AI Social Copilot)</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono">Server Secured</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              គ្រាន់តែវាយបញ្ចូលនូវប្រធានបទវីដេអូ ឬខ្លឹមសារសង្ខេបខាងក្រោម រួចចុចបង្កើត AI នឹងសរសេរចំណងជើង ទ្រង់ទ្រាយរៀបរាប់ Hashtags និងពេលវេលាផុសដ៏ល្អបំផុតជូនបងភ្លាមៗ៖
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-sans text-slate-400 mb-1">គោលការណ៍ / គំនិតវីដេអូ (Video Topic or Concept)</label>
                <input 
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ គន្លឹះ ៣យ៉ាងដើម្បីបង្កើតផុសឲ្យឆាប់ល្បី (3 tips for viral Facebook post)..."
                  className="w-full px-3 py-2 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans text-slate-400 mb-1">ទម្រង់ភាសា (Language Tone)</label>
                  <select 
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Professional and Inspiring">ផ្លូវការ និងការជម្រុញទឹកចិត្ត</option>
                    <option value="Exciting and Friendly">រំភើបរីករាយ និងស្និទ្ធស្នាល</option>
                    <option value="Educational and Detail">អប់រំ និងពន្យល់ក្បោះក្បាយ</option>
                    <option value="Promotional and Sales focused">ផ្សព្វផ្សាយលក់ និងទាក់ទាញខ្លាំង</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    type="button"
                    onClick={handleAiGeneration}
                    id="generate-metadata-ai"
                    disabled={isAiGenerating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-blue-500/20 cursor-pointer disabled:opacity-50 select-none transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAiGenerating ? "កំពុងវិភាគ..." : "សរសេរដោយ AI (Draft via AI)"}
                  </button>
                </div>
              </div>

              {activeAITip && (
                <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-blue-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{activeAITip}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details metadata config form panel */}
          <form onSubmit={handleSubmit} className="p-6 bg-[#16161a] border border-white/[0.06] rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold font-display text-white flex items-center gap-2 border-b border-white/[0.04] pb-3">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>ព័ត៌មានលម្អិតពីការបង្ហោះ (Video Post Details Configuration)</span>
            </h3>

            {/* Title field */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans text-slate-400 flex items-center justify-between">
                <span>ចំណងជើងវីដេអូសម្រាប់ការផុស (Video Post Title) *</span>
                <span className="text-[10px] text-slate-500 font-mono">{title.length}/80 តួ</span>
              </label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ឧទាហរណ៍៖ ចែករំលែកវិធីបង្កើតមាតិកាបច្ចេកវិទ្យាទាក់ទាញឆ្នាំ២០២៦"
                maxLength={80}
                className="w-full px-3 py-2.5 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Description field */}
            <div className="space-y-1">
              <label className="block text-[11px] font-sans text-slate-400">ខ្លឹមសារផ្សាយបន្ថែម (Post Description / Captions)</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="សរសេរខ្លឹមសាររៀបរាប់លម្អិត ឬសេចក្តីណែនាំដើម្បីទាក់ទាញអ្នកទស្សនាចុច Like / Follow..."
                className="w-full px-3 py-2.5 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-sans text-slate-400">ប្រភេទទម្រង់មាតិកា (Video Category)</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ការអប់រំ / ចែករំលែកចំណេះដឹង">ការអប់រំ / ចែករំលែកចំណេះដឹង</option>
                  <option value="បច្ចេកវិទ្យា និងអាជីវកម្ម">បច្ចេកវិទ្យា និងអាជីវកម្ម</option>
                  <option value="វីឡុក / ដំណើរកម្សាន្ត">វីឡុក / ដំណើរកម្សាន្ត</option>
                  <option value="កម្សាន្ត / លំហែកាយ">កម្សាន្ត / លំហែកាយ</option>
                  <option value="សម្ភាសន៍ / ធុរកិច្ច">សម្ភាសន៍ / ធុរកិច្ច</option>
                </select>
              </div>

              {/* Automation Rules Connection */}
              <div className="space-y-1">
                <label className="block text-[11px] font-sans text-slate-400 flex items-center gap-1">
                  <span>ភ្ជាប់ទៅកាន់ច្បាប់ឆ្លើយតប (Link Automation Rule)</span>
                  <HelpCircle className="w-3 h-3 text-slate-500" title="នៅពេលមានមតិយោបល់ ច្បាប់ដែលបានភ្ជាប់នេះនឹងវិភាគពាក្យគន្លឹះដើម្បីឆ្លើយតបក្នុងប៉ុន្មានវិនាទី" />
                </label>
                <select 
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#0a0a0b] border border-white/[0.04] rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- កុំទាន់ភ្ជាប់ (Disable Auto-responder) --</option>
                  {rules.map(rule => (
                    <option key={rule.id} value={rule.id}>{rule.name} (ពាក្យ៖ {rule.triggerKeyword})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags management */}
            <div className="space-y-2">
              <label className="block text-[11px] font-sans text-slate-400">ពាក្យគន្លឹះសម្គាល់ (Hashtags / Video Tags)</label>
              <div className="flex gap-2">
                <span className="flex items-center px-2 bg-[#0a0a0b] border border-white/[0.04] rounded-l-xl text-slate-500 text-xs font-mono">#</span>
                <input 
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="វាយពាក្យគន្លឹះ រួចចុច Enter"
                  className="w-full px-3 py-2 text-xs bg-[#0a0a0b] border-y border-r border-white/[0.04] rounded-r-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold rounded-xl text-slate-300 cursor-pointer"
                >
                  បន្ថែម
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20 font-sans"
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-400 hover:text-blue-200 ml-1.5 focus:outline-none font-bold text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduling & Publish options */}
            <div className="p-4 bg-[#0a0a0b] border border-white/[0.04] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>កាលវិភាគនៃការផ្សព្វផ្សាយ (Publishing & Schedule Setup)</span>
                </span>
                <div className="flex gap-1.5 bg-[#16161a] p-0.5 rounded-lg border border-white/[0.06]">
                  <button 
                    type="button"
                    onClick={() => setPublishMode("scheduled")}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${publishMode === "scheduled" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    កំណត់កាលវិភាគ
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPublishMode("instant")}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${publishMode === "instant" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    ផុសភ្លាមៗ
                  </button>
                </div>
              </div>

              {publishMode === "scheduled" ? (
                <div className="space-y-2">
                  <label className="block text-[11px] font-sans text-slate-400">កំណត់ថ្ងៃ និងម៉ោងគ្រោងបង្ហោះ (Scheduled Time) *</label>
                  <input 
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#16161a] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-sans">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>ប្រព័ន្ធនឹងរក្សាទុកវីដេអូនោះជាទម្រង់ ' scheduled' ហើយវីដេអូនោះនឹងផុសឡើងស្វ័យប្រវត្តិតាមការកំណត់។</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2 p-1.5 bg-[#16161a] rounded border border-white/[0.06] font-sans">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>វីដេអូនេះនឹងត្រូវបណ្តេញផ្សាយផ្ទាល់ទៅកាន់ Facebook ភ្លាមៗនៅពេលអ្នកចុចរក្សាទុក។</span>
                </div>
              )}
            </div>

            {/* Validation Feedback & Action submit button */}
            <div className="flex items-center gap-3 pt-3">
              <button 
                type="submit"
                id="save-publish-schedule-btn"
                disabled={isPublishing || postSavedStatus}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/10 border border-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all font-sans select-none"
              >
                <Save className="w-4 h-4" />
                {isPublishing 
                  ? "កំពុងទាក់ទង..." 
                  : postSavedStatus 
                    ? "រក្សាទុកជោគជ័យពេញលេញ!" 
                    : publishMode === "instant" 
                      ? "ផ្សព្វផ្សាយវីដេអូភ្លាមៗ (Publish Immediately)" 
                      : "កំណត់កាលវិភាគស្វ័យប្រវត្តិ (Confirm Schedule & Auto-Post)"}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
