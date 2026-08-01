/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Sparkles, Globe, 
  ThumbsUp, Heart, Share2, MessageSquare, Calendar, Play, Pause, 
  Save, AlertCircle, ExternalLink, FileText, CheckCircle2, Tag, 
  Video, RefreshCw, Layers, ArrowLeftRight, Upload, Image
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VideoPost, CarouselSlide, PostStatus } from "../types";
import { fetchWithAuth } from "../lib/api.ts";

interface VideoCarouselEditorProps {
  onPostCreated: (post: Omit<VideoPost, "id" | "likesCount" | "commentsCount" | "sharesCount" | "viewsCount" | "createdAt">) => Promise<void>;
}

// Preset gorgeous mock video streams with associated Unsplash preview graphics
const PRESET_VIDEOS = [
  {
    name: "AI & Tech Glow (Neon Terminal)",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    suggestedTitle: "ស្គាល់ AI Copilot ថ្មីនៅ?",
    suggestedDesc: "ជំនួយការការងារឌីជីថលឆ្លាតវៃបំផុត"
  },
  {
    name: "Phnom Penh Traffic & Night City Lights",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
    suggestedTitle: "យុទ្ធសាស្ត្រលក់កក្រើក FB",
    suggestedDesc: "ទាក់ទាញម៉ូយៗរាប់ម៉ឺននាក់យ៉ាងងាយ"
  },
  {
    name: "SME Podcast & Female Entrepreneur",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-podcast-with-a-professional-microphone-43026-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
    suggestedTitle: "គន្លឹះចាប់ផ្តើម SME ឆ្នាំនេះ",
    suggestedDesc: "លុបបំបាត់ការភ័យខ្លាចក្នុងការរកស៊ី"
  },
  {
    name: "Cozy Aesthetic Workspace & Tea Coffee",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-holding-a-warm-cup-of-tea-and-working-on-laptop-44889-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
    suggestedTitle: "បង្កើនស្មារតីធ្វើការងារ (Focus)",
    suggestedDesc: "រៀបចំពេលវេលា និងកន្លែងធ្វើការឱ្យស្អាត"
  },
  {
    name: "Cyberpunk Digital Binary Hacking Flow",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-with-futuristic-glasses-in-front-of-screens-43403-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80",
    suggestedTitle: "ប្រព័ន្ធការពារ Cybersecurity",
    suggestedDesc: "ការពារផេក និងអាខោនហ្វេសប៊ុករបស់អ្នក"
  }
];

const CTA_OPTIONS = [
  "Learn More",
  "Send Message",
  "Shop Now",
  "Like Page",
  "Follow",
  "Like and Follow",
  "Sign Up",
  "Book Now",
  "Apply Now",
  "Watch More"
];

const CATEGORIES = [
  "Video Carousel / ផ្សព្វផ្សាយ",
  "បច្ចេកវិទ្យា និងអាជីវកម្ម",
  "វគ្គសិក្សានិងការអប់រំ",
  "ការលក់និងប្រូម៉ូសិន",
  "ផលិតផលថ្មីៗ"
];

export default function VideoCarouselEditor({ onPostCreated }: VideoCarouselEditorProps) {
  // Post-level states
  const [title, setTitle] = useState("យុទ្ធនាការពិសេស៖ វគ្គខ្លីៗស្តីពីវិថីឆ្ពោះទៅកាន់ជោគជ័យឌីជីថល");
  const [description, setDescription] = useState("💡 ចង់អភិវឌ្ឍខ្លួនឱ្យលឿន និងទាញយកប្រយោជន៍ពីបច្ចេកវិទ្យាទំនើបមែនទេ? \n\nខាងក្រោមនេះជាវីដេអូណែនាំខ្លីៗទាំង៣ ដែលនឹងជួយឱ្យអ្នកផ្លាស់ប្តូរទម្លាប់ការងារ និងការលក់អនឡាញឱ្យកាន់តែជោគជ័យនៅក្នុងឆ្នាំ២០២៦ នេះ! \n👉 អូសទៅឆ្វេង (swipe left) ដើម្បីមើលគន្លឹះនីមួយៗ និងចុចសាកសួរព័ត៌មានបន្ថែមឥតគិតថ្លៃ!");
  const [category, setCategory] = useState("Video Carousel / ផ្សព្វផ្សាយ");
  const [publishMode, setPublishMode] = useState<"instant" | "scheduled">("scheduled");
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 4);
    nextHour.setMinutes(0);
    return nextHour.toISOString().slice(0, 16);
  });
  const [tags, setTags] = useState<string[]>(["CarouselMarketing", "DigitalTips", "BizSuccess"]);
  const [currentTag, setCurrentTag] = useState("");

  // Slides configuration state (Defaulted beautifully)
  const [slides, setSlides] = useState<CarouselSlide[]>([
    {
      id: "slide_init_1",
      title: "គន្លឹះទី១៖ ស្វែងយល់ពី AI Copilot",
      description: "ជំនួយការការងារឌីជីថលឆ្លាតវៃបំផុត",
      videoUrl: PRESET_VIDEOS[0].videoUrl,
      thumbnailUrl: PRESET_VIDEOS[0].thumbnailUrl,
      linkUrl: "https://ai.studio/build",
      ctaText: "Learn More"
    },
    {
      id: "slide_init_2",
      title: "គន្លឹះទី២៖ ទាក់ទាញអតិថិជនតាម FB",
      description: "បង្កើនការឆ្លើយតបដោយស្វ័យប្រវត្តិតាម Comments",
      videoUrl: PRESET_VIDEOS[1].videoUrl,
      thumbnailUrl: PRESET_VIDEOS[1].thumbnailUrl,
      linkUrl: "https://ai.studio/build",
      ctaText: "Send Message"
    },
    {
      id: "slide_init_3",
      title: "គន្លឹះទី៣៖ បង្កើនទំនុកចិត្តម៉ាកយីហោ",
      description: "របៀបរៀបចំ Brand Visual ស្អាតកម្រិតអាជីពស្តង់ដារ",
      videoUrl: PRESET_VIDEOS[2].videoUrl,
      thumbnailUrl: PRESET_VIDEOS[2].thumbnailUrl,
      linkUrl: "https://ai.studio/build",
      ctaText: "Shop Now"
    }
  ]);

  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "4:5">("1:1");

  // Gemini AI variables
  const [aiConceptText, setAiConceptText] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiLanguageTone, setAiLanguageTone] = useState("Professional and Inspiring");

  // Interaction Simulators
  const [previewLikesCount, setPreviewLikesCount] = useState(258);
  const [previewLikedState, setPreviewLikedState] = useState(false);
  const [previewCommentsCount, setPreviewCommentsCount] = useState(32);
  const [activePlaybackSlideId, setActivePlaybackSlideId] = useState<string | null>(null);

  // Swipe view simulation state
  const carouselDeckRef = useRef<HTMLDivElement>(null);
  const [currentSwipeOffset, setCurrentSwipeOffset] = useState(0);

  const handleScrollCarousel = (dir: "left" | "right") => {
    if (carouselDeckRef.current) {
      const cardWidth = 240 + 16; // card width + gap
      const newIdx = dir === "left" && activeSlideIdx > 0 
        ? activeSlideIdx - 1 
        : dir === "right" && activeSlideIdx < slides.length - 1 
          ? activeSlideIdx + 1 
          : activeSlideIdx;
      
      setActiveSlideIdx(newIdx);
      carouselDeckRef.current.scrollTo({
        left: newIdx * cardWidth,
        behavior: "smooth"
      });
    }
  };

  const handleUpdateActiveSlide = (fields: Partial<CarouselSlide>) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx === activeSlideIdx) {
        return { ...slide, ...fields };
      }
      return slide;
    }));
  };

  const handleAddSlideItem = () => {
    if (slides.length >= 10) {
      alert("ទម្រង់ Video Carousel របស់ Facebook គាំទ្រត្រឹម ១០ ស្លាយប៉ុណ្ណោះបាទ! (Facebook Carousel supports up to 10 slides max)");
      return;
    }
    const randomPreset = PRESET_VIDEOS[slides.length % PRESET_VIDEOS.length];
    const newSlide: CarouselSlide = {
      id: "slide_custom_" + Date.now(),
      title: `${randomPreset.suggestedTitle} (កាតទី ${slides.length + 1})`,
      description: randomPreset.suggestedDesc,
      videoUrl: randomPreset.videoUrl,
      thumbnailUrl: randomPreset.thumbnailUrl,
      linkUrl: "https://ai.studio/build",
      ctaText: "Learn More"
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);

    // Scroll after render
    setTimeout(() => {
      if (carouselDeckRef.current) {
        const cardWidth = 240 + 16;
        carouselDeckRef.current.scrollTo({
          left: slides.length * cardWidth,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  const handleDeleteSlideItem = (indexToDelete: number) => {
    if (slides.length <= 2) {
      alert("Facebook Video Carousel ត្រូវតែមានយ៉ាងហោចណាស់ ២ ស្លាយឡើងទៅបាទ! (You must have at least 2 slides for a Carousel)");
      return;
    }
    const updated = slides.filter((_, idx) => idx !== indexToDelete);
    setSlides(updated);
    setActiveSlideIdx(Math.max(0, indexToDelete - 1));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTriggerSaveCarousel = async () => {
    if (!title.trim()) {
      alert("សូមបំពេញចំណងជើងយុទ្ធនាការ / Post Title របស់បង! (Post Title is required)");
      return;
    }

    const payload = {
      title,
      description,
      videoUrl: slides[0]?.videoUrl || "",
      tags,
      status: publishMode === "instant" ? PostStatus.PUBLISHED : PostStatus.SCHEDULED,
      scheduledTime: publishMode === "instant" ? new Date().toISOString() : new Date(scheduledDateTime).toISOString(),
      category,
      thumbnailUrl: slides[0]?.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      carouselSlides: slides,
      aspectRatio
    };

    try {
      await onPostCreated(payload);
      alert("🎉 ជោគជ័យ! Video Carousel របស់បងត្រូវបានចុះបញ្ជី និងកំណត់កាលវិភាគរួចរាល់ហើយ!");
      // Reset or redirect back can be handled by app container
    } catch (err) {
      alert("មិនអាចបង្កើត Carousel ផុសបានទេ សូមព្យាយាមម្តងទៀត!");
    }
  };

  // Dynamic Server-Side Gemini API Carousel Generator
  const handleAiCarouselGeneration = async () => {
    if (!aiConceptText.trim()) {
      alert("សូមបញ្ជាក់ពីគំនិត ឬប្រធានបទយុទ្ធនាការដែលបងចង់ឱ្យ AI រៀបចំ! (Please enter a theme/concept)");
      return;
    }

    setIsAiGenerating(true);
    try {
      // Standard AI request
      const response = await fetchWithAuth("/api/gemini/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: `CREATE A 3-SLIDE VIDEO CAROUSEL IN KHMER. Theme: ${aiConceptText}`,
          category,
          languageTone: aiLanguageTone
        })
      });
      const data = await response.json();

      if (response.ok) {
        setTitle(`យុទ្ធនាការ៖ គន្លឹះពិសេសអំពី "${aiConceptText}"`);
        setDescription(data.description || `💡 ស្វែងយល់បន្ថែមពី "${aiConceptText}" តាមរយៈ Video Carousel ពិសេសខាងក្រោម!`);
        if (data.tags) {
          setTags(data.tags);
        }

        // Generate customized slide texts matching the topic!
        const slideTopics = [
          {
            title: `១. ផ្តើមជាមួយ ${aiConceptText}`,
            desc: "របៀបចាប់ផ្តើមដំបូងបង្អស់ឱ្យមានប្រសិទ្ធភាពខ្ពស់"
          },
          {
            title: "២. តិចនិកប្រតិបត្តិផ្ទាល់",
            desc: "ទម្លាប់ ឬជំហានអនុវត្តដ៏ត្រឹមត្រូវរាល់ថ្ងៃ"
          },
          {
            title: "៣. សម្រេចលទ្ធផលជាផ្លែផ្កា",
            desc: "វាស់វែងភាពរីកចម្រើន និងបង្កើនប្រាក់ចំណូល"
          }
        ];

        const generatedSlides = slides.map((slide, idx) => {
          const matchingPreset = PRESET_VIDEOS[idx % PRESET_VIDEOS.length];
          const topic = slideTopics[idx] || { title: `កាតទី ${idx + 1}៖ គន្លឹះ ${aiConceptText}`, desc: "ចំណេះដឹងទូទៅ" };
          return {
            ...slide,
            title: topic.title,
            description: topic.desc,
            videoUrl: matchingPreset.videoUrl,
            thumbnailUrl: matchingPreset.thumbnailUrl
          };
        });

        setSlides(generatedSlides);
        alert("✨ AI បានបង្កើត និងរៀបចំ Caption រួមទាំងកាត Carousel ស្លាយទាំងឡាយដោយជោគជ័យ សមស្របតាមទិសដៅរបស់អ្នក!");
      } else {
        alert("កំហុសក្នុងការគណនាដោយ AI ៖ " + (data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("កំហុសបណ្តាញតភ្ជាប់ក្នុងការបង្កើតទិន្នន័យដោយ AI!");
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="video-carousel-tab">
      
      {/* LEFT COLUMN: Input Control Panel & Slide Management (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Main Title Badge */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.04] p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">ហ្វេសប៊ុក Video Carousel Studio</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">បង្កើត ផ្សព្វផ្សាយ និងសាកល្បង Video Carousel Posts ដែលមានប្រសិទ្ធភាពទាក់ទាញខ្លាំង</p>
            </div>
          </div>
        </div>

        {/* AI Generator Helper Box */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-[#0F1424] border border-blue-200/50 dark:border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide font-sans"> Gemini AI Carousel Configurator (ជំនួយការឆ្លាតវៃ)</h3>
            </div>
            <span className="text-[10px] bg-cyan-400/10 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-400/20">Powered by 3.5</span>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              សូមបញ្ចូលប្រធានបទយុទ្ធនាការ ឬរឿងដែលចង់និយាយ (ឧទាហរណ៍៖ "វគ្គសិក្សាកាត់ត", "លក់អនឡាញ")។ AI នឹងរៀបចំសរសេរ Caption & កែសម្រួលចំណងជើងកាតទាំង ៣ ដោយស្វ័យប្រវត្តក្នុងរូបមន្ត Khmer Copywriting!
            </p>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={aiConceptText}
                onChange={(e) => setAiConceptText(e.target.value)}
                placeholder="ឧទាហរណ៍៖ គន្លឹះដោះស្រាយបំណុល ឬ ស្ទើរជំនាញឌីជីថល..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAiCarouselGeneration}
                disabled={isAiGenerating}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50 select-none cursor-pointer"
              >
                {isAiGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                )}
                <span>AI បង្កើត</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[10.5px]">
              <span className="text-slate-500">Tone ភាសា៖</span>
              <div className="flex gap-1.5">
                {["Professional and Inspiring", "Friendly & Playful", "Promotional High Hook"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiLanguageTone(t)}
                    className={`px-2 py-0.5 rounded text-[9.5px] border transition-colors ${
                      aiLanguageTone === t 
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                        : "bg-transparent text-slate-500 border-white/[0.04] hover:text-slate-400"
                    }`}
                  >
                    {t === "Professional and Inspiring" ? "បែបអាជីព" : t === "Friendly & Playful" ? "ស្និទ្ធស្នាល" : "ទាក់ម៉ូយលក់"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CAMPAIGN METADATA PANEL */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-200/70 dark:border-white/[0.04] pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>ព័ត៌មានយុទ្ធនាការរួម (Campaign Description & General)</span>
            </h3>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block font-display">ចំណងជើងយុទ្ធនាការផុស (Campaign Campaign Title)</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ដាក់ចំណងជើងយុទ្ធនាការផ្ទុះការចាប់អារម្មណ៍..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans"
              />
            </div>

            {/* Description Caption */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block font-display">ការរៀបរាប់មាតិកា (Facebook Post Primary Caption)</label>
                <span className="text-[10px] text-slate-500 font-mono">{description.length} chars</span>
              </div>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="សរសេរ Caption, Hashtags ឬការណែនាំបន្ថែមនៅទីនេះ..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans leading-relaxed"
              />
            </div>

            {/* Grid options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block font-display">ប្រភេទការផ្សព្វផ្សាយ (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-sans"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tag System */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block font-display">ស្លាកយុទ្ធនាការ (Hashtags)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">#</span>
                    <input 
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      placeholder="បន្ថែម Tag..."
                      className="w-full pl-6 pr-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300/70 dark:border-white/[0.04] text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    +
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tg, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/15 rounded-full"
                      >
                        <span>#{tg}</span>
                        <button type="button" onClick={() => handleRemoveTag(tg)} className="text-blue-500 hover:text-red-400 font-bold ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* SLIDE CARD CONFIGURATOR */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.04] pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                <span>គ្រប់គ្រងស្លាយកាត (Carousel Cards configuration)</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">បងអាចបន្ថែម ប្តូរលំដាប់ កែប្រែសមាមាត្រ ឬកម្ពស់កាតនីមួយៗបាន (សរុប៖ {slides.length} កាត)</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Aspect Ratio option selector */}
              <div className="flex flex-col items-start md:items-end gap-1">
                <span className="text-[9.5px] text-slate-400 font-medium font-sans">កម្រិតសមាមាត្រ (Option Ratio)</span>
                <div className="flex gap-1 bg-white dark:bg-slate-950 p-0.5 border border-slate-300/70 dark:border-white/[0.06] rounded-lg">
                  {[
                    { value: "1:1", label: "1:1 (Square)" },
                    { value: "16:9", label: "16:9 (Landscape)" },
                    { value: "4:5", label: "4:5 (Portrait)" }
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setAspectRatio(ratio.value as any)}
                      className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-sans font-semibold ${
                        aspectRatio === ratio.value 
                          ? "bg-blue-600 text-white font-bold" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSlideItem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md transition-all cursor-pointer h-fit self-end"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>បន្ថែមស្លាយ (Add Slide)</span>
              </button>
            </div>
          </div>

          {/* Sliding horizontal select list for active slide configuration */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 customize-scrollbar">
            {slides.map((sld, idx) => (
              <button
                key={sld.id}
                type="button"
                onClick={() => setActiveSlideIdx(idx)}
                className={`flex items-center gap-2.5 p-2 px-3.5 rounded-xl border text-xs font-sans shrink-0 transition-all cursor-pointer ${
                  activeSlideIdx === idx 
                    ? "bg-blue-600/15 text-blue-400 border-blue-500/40 font-bold shadow-sm" 
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300/70 dark:border-white/[0.04] hover:border-slate-400 dark:hover:border-white/[0.12] hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs text-slate-900 dark:text-white flex items-center justify-center font-mono">
                  {idx + 1}
                </div>
                <span>{sld.title.substring(0, 14)}...</span>
                <Trash2 
                  className="w-3.5 h-3.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSlideItem(idx);
                  }}
                />
              </button>
            ))}
          </div>

          {/* Active slide fields editing block */}
          {slides[activeSlideIdx] && (
            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.04] rounded-xl.5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.02] pb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">កំពុងកែសម្រួល៖ ស្លាយកាតទី {activeSlideIdx + 1}</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-full font-mono">{slides[activeSlideIdx].ctaText} Connected</span>
              </div>

              {/* Title & Description of slide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block font-display">ចំណងជើងស្លាយកាត (Card Title)</label>
                  <input 
                    type="text"
                    value={slides[activeSlideIdx].title}
                    onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block font-display">ការរៀបរាប់សង្ខេប (Card Subtitle)</label>
                  <input 
                    type="text"
                    value={slides[activeSlideIdx].description}
                    onChange={(e) => handleUpdateActiveSlide({ description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Action Button CTA selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block font-display">ប៊ូតុងអំពាវនាវ (Call to Action Button)</label>
                  <select 
                    value={slides[activeSlideIdx].ctaText}
                    onChange={(e) => handleUpdateActiveSlide({ ctaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {CTA_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block font-display font-mono">លីងភ្ជាប់គោលដៅ (CTA/Destination Link)</label>
                  <input 
                    type="text"
                    value={slides[activeSlideIdx].linkUrl}
                    onChange={(e) => handleUpdateActiveSlide({ linkUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Video source selections */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 block font-display">ជ្រើសរើសវីដេអូគំរូនៃទីលានរបស់អ្នក (Video Stream Asset Asset)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_VIDEOS.map((pst, pidx) => (
                    <button
                      key={pidx}
                      type="button"
                      onClick={() => {
                        handleUpdateActiveSlide({
                          videoUrl: pst.videoUrl,
                          thumbnailUrl: pst.thumbnailUrl
                        });
                      }}
                      className={`p-2 rounded-xl text-left border flex flex-col justify-between h-20 relative overflow-hidden transition-all group cursor-pointer ${
                        slides[activeSlideIdx].videoUrl === pst.videoUrl 
                          ? "border-blue-500 bg-blue-500/5" 
                          : "border-slate-300/70 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-900"
                      }`}
                    >
                      <img 
                        src={pst.thumbnailUrl} 
                        alt="pres" 
                        className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity" 
                      />
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white font-sans relative z-10 line-clamp-2 leading-tight">{pst.name}</span>
                      <span className="text-[8.5px] text-slate-500 relative z-10 font-mono mt-auto truncate max-w-[90%]">{pst.videoUrl.split('/').pop()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input path & local file loaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                {/* Load local Video File */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[11px] font-bold text-blue-400 block font-sans">📥 ផ្ទុកវីដេអូ (Load Slide Video)</span>
                  <p className="text-[9px] text-slate-500">ជ្រើសរើសវីដេអូពីទូរស័ព្ទ ឬកុំព្យូទ័រ</p>
                  <label className="flex items-center justify-center gap-2 w-full px-2.5 py-1.5 border border-dashed border-blue-500/30 hover:border-blue-500/60 bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl cursor-pointer text-xs text-slate-900 dark:text-slate-300 transition-colors">
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px]">ជ្រើសរើសវីដេអូ (.mp4, .mov...)</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          handleUpdateActiveSlide({ videoUrl: url });
                          alert("បងបានផ្ទុកវីដេអូស្លាយជោគជ័យ! បងអាចចុចប៊ូតុងលេង (Play) ដើម្បីទស្សនាក្នុង Preview បាន។");
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Load local Image File */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[11px] font-bold text-blue-400 block font-sans">🖼️ ផ្ទុករូបតំណាង (Load Slide Image)</span>
                  <p className="text-[9px] text-slate-500 font-sans">ជ្រើសរើសរូបថតគម្រប ឬរូបតំណាងគំរូ</p>
                  <label className="flex items-center justify-center gap-2 w-full px-2.5 py-1.5 border border-dashed border-blue-500/30 hover:border-blue-500/60 bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl cursor-pointer text-xs text-slate-900 dark:text-slate-300 transition-colors">
                    <Image className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px]">ជ្រើសរើសរូបភាព (.jpg, .png...)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          handleUpdateActiveSlide({ thumbnailUrl: url });
                          alert("បងបានផ្ទុករូបភាពគម្របស្លាយជោគជ័យ!");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-slate-400 block font-mono">Custom Video URL Link</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-500"><Video className="w-3.5 h-3.5" /></span>
                    <input 
                      type="text"
                      value={slides[activeSlideIdx].videoUrl}
                      onChange={(e) => handleUpdateActiveSlide({ videoUrl: e.target.value })}
                      placeholder="លីងវីដេអូ MP4..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-slate-400 block font-mono">Custom Thumbnail / Image URL Link</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-500"><Image className="w-3.5 h-3.5" /></span>
                    <input 
                      type="text"
                      value={slides[activeSlideIdx].thumbnailUrl}
                      onChange={(e) => handleUpdateActiveSlide({ thumbnailUrl: e.target.value })}
                      placeholder="លីងរូបភាព JPG/PNG..."
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* CALENDAR PUBLISH CONFIG AND CTA TRIGGER SAVE */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Mode selection button deck */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block font-display">របៀបផ្សព្វផ្សាយ (Publishing Mode)</label>
              <div className="flex gap-1 bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPublishMode("instant")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                    publishMode === "instant" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ផ្សាយភ្លាមៗ (Publish Now)
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode("scheduled")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                    publishMode === "scheduled" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  កាលវិភាគទុក (Schedule Post)
                </button>
              </div>
            </div>

            {/* Date Picker showing only if scheduled */}
            {publishMode === "scheduled" && (
              <div className="space-y-1 flex-1 sm:max-w-xs">
                <label className="text-xs font-semibold text-slate-300 block font-display">កាលបរិច្ឆេទ & ម៉ោងផ្សាយ</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500"><Calendar className="w-4 h-4" /></span>
                  <input 
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300/70 dark:border-white/[0.06] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>
            )}

          </div>

          <button
            type="button"
            onClick={handleTriggerSaveCarousel}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 cursor-pointer select-none mt-2 transition-all"
          >
            <Save className="w-4 h-4 text-white" />
            <span>
              {publishMode === "instant" 
                ? "ផ្សព្វផ្សាយ Carousel នេះជាសាធារណៈឥឡូវនេះ (Publish Carousel Post Live)" 
                : "បញ្ជូនតាមកាលវិភាគកាលកំណត់ទុក (Schedule Carousel Post Campaign)"
              }
            </span>
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Live Facebook Feed Swipeable Carousel Simulation (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Banner header title */}
<div className="border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-slate-950 rounded-2xl p-4.5 space-y-4 shadow-xl">
          
          {/* Header post verified indicator */}
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/[0.04] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2] animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">Live Facebook Post Carousel Preview (ជំនួយសមកាលកម្ម)</span>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded bg-[#1877f2]/10 text-[#1877f2] text-[8px] font-mono font-bold">Simulator Connected</span>
          </div>

          {/* Facebook Post Mock Container */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.06] rounded-xl p-4 space-y-3.5 shadow-md">
            
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80" 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full object-cover border border-white/[0.1]"
                />
                <div>
                  <h4 className="text-[12px] font-bold text-white flex items-center gap-1 font-display">
                    ចំណេះដឹងបច្ចេកវិទ្យា & ឌីជីថល (MetaStream Pro)
                    <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#1877f2] text-white text-[7px] font-bold select-none">✓</span>
                  </h4>
                  <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-sans mt-0.5 select-none">
                    <span className="text-[#1877f2]">Sponsored</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-slate-400 inline" />
                  </div>
                </div>
              </div>
            </div>

            {/* Caption segment resolving hashtags */}
            <p className="text-[11.5px] text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {description ? (
                description.split(/(\s+)/).map((part, index) => {
                  if (part.startsWith("#")) {
                    return <span key={index} className="text-[#385898] hover:underline cursor-pointer font-medium font-sans">{part}</span>;
                  }
                  return part;
                })
              ) : (
                "សរសេរខ្លឹមសារ Caption នៃយុទ្ធនាការផុសរបស់អ្នក..."
              )}
            </p>

            {/* SWIPE DECK SIMULATOR */}
            <div className="relative">
              
              {/* Slides wrapper with custom scroll */}
              <div 
                ref={carouselDeckRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none snap-mandatory pr-6"
                style={{ scrollbarWidth: "none" }}
              >
                {slides.map((sld, sidx) => (
                  <div 
                    key={sld.id}
                    className="w-[245px] bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.04] rounded-2xl overflow-hidden shadow-lg shrink-0 snap-center transition-all duration-300 relative group flex flex-col justify-between"
                  >
                    
                    {/* Media segment inside card */}
                    <div className={`relative w-full bg-slate-200 dark:bg-slate-950 flex items-center justify-center transition-all duration-300 ${
                      aspectRatio === "16:9" 
                        ? "aspect-video" 
                        : aspectRatio === "4:5" 
                          ? "aspect-[4/5]" 
                          : "aspect-square"
                    }`}>
                      
                      {activePlaybackSlideId === sld.id ? (
                        <video 
                          key={sld.videoUrl}
                          src={sld.videoUrl} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          loop 
                          muted 
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <img 
                            src={sld.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80"} 
                            alt="preview" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-slate-950/20 dark:bg-black/20 flex items-center justify-center" />
                        </div>
                      )}

                      {/* Play action overlay button */}
                      <button 
                        type="button"
                        onClick={() => {
                          if (activePlaybackSlideId === sld.id) {
                            setActivePlaybackSlideId(null);
                          } else {
                            setActivePlaybackSlideId(sld.id);
                          }
                        }}
                        className="absolute bottom-2.5 right-2.5 p-1.5 bg-slate-950/70 hover:bg-slate-950/90 dark:bg-white/10 dark:hover:bg-white/15 rounded-full text-white backdrop-blur border border-white/[0.08] transition-all shadow-sm cursor-pointer"
                        title={activePlaybackSlideId === sld.id ? "Pause" : "Play video slide"}
                      >
                        {activePlaybackSlideId === sld.id ? (
                          <Pause className="w-3.5 h-3.5 fill-white text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                        )}
                      </button>

                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-950/60 dark:bg-white/10 rounded font-mono text-[8px] text-slate-300 dark:text-slate-200 tracking-wide select-none">
                        កាត {sidx + 1}/{slides.length}
                      </span>
                    </div>

                    {/* Bottom CTA block */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2 border-t border-slate-200/70 dark:border-white/[0.04] min-h-[58px]">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider font-mono uppercase truncate">{sld.linkUrl.replace("https://", "").replace("www.", "")}</p>
                        <h5 className="text-[11px] font-bold text-slate-900 dark:text-white font-display truncate leading-tight">{sld.title || "មិនទាន់មានចំណងជើង..."}</h5>
                        <p className="text-[9.5px] text-slate-600 dark:text-slate-400 font-sans truncate leading-none">{sld.description || "ការពិពណ៌នាស្លាយកាត..."}</p>
                      </div>
                      
                      <a 
                        href={sld.linkUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`px-2.5 py-1.5 text-white text-[9.5px] font-bold rounded font-sans uppercase tracking-tight shrink-0 select-none flex items-center gap-1 transition-all ${
                          sld.ctaText === "Like Page" || sld.ctaText === "Follow" || sld.ctaText === "Like and Follow"
                            ? "bg-[#1877f2] hover:bg-[#166fe5] shadow-sm"
                            : "bg-[#4e4f50] hover:bg-[#5c5d5e]"
                        }`}
                      >
                        {sld.ctaText === "Like Page" || sld.ctaText === "Like and Follow" ? (
                          <ThumbsUp className="w-2.5 h-2.5 fill-white text-white" />
                        ) : sld.ctaText === "Follow" ? (
                          <Heart className="w-2.5 h-2.5 fill-white text-white" />
                        ) : null}
                        <span>{sld.ctaText || "Learn More"}</span>
                        {sld.ctaText !== "Like Page" && sld.ctaText !== "Follow" && sld.ctaText !== "Like and Follow" && (
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </a>
                    </div>

                  </div>
                ))}

                {/* Final End card mockup in Carousel */}
                <div className="w-[180px] bg-slate-100/80 dark:bg-slate-950/40 border border-dashed border-slate-200/70 dark:border-white/[0.08] rounded-2xl overflow-hidden shrink-0 snap-center flex flex-col items-center justify-center text-center p-4 space-y-2 select-none min-h-[295px]">
                  <Layers className="w-8 h-8 text-slate-500 dark:text-slate-300 animate-pulse" />
                  <h5 className="text-[11px] font-bold text-slate-900 dark:text-white font-display">មើលបន្ថែម</h5>
                  <p className="text-[9.5px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">ចូលមើលគណនីផេកផ្លូវការរបស់យើងខ្ញុំ ដើម្បីទស្សនាយុទ្ធនាការផ្សេងៗទៀត</p>
                  <a 
                    href="https://ai.studio/build" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-blue-400 underline font-mono select-none"
                  >
                    ai.studio/build
                  </a>
                </div>

              </div>

              {/* Precise positioning indicator controls */}
              {activeSlideIdx > 0 && (
                <button 
                  type="button"
                  onClick={() => handleScrollCarousel("left")}
                  className="absolute left-2 top-[35%] -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/90 dark:bg-white/10 dark:hover:bg-white/20 rounded-full border border-white/[0.08] text-white transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {activeSlideIdx < slides.length - 1 && (
                <button 
                  type="button"
                  onClick={() => handleScrollCarousel("right")}
                  className="absolute right-2 top-[35%] -translate-y-1/2 p-1.5 bg-slate-950/60 hover:bg-slate-950/90 dark:bg-white/10 dark:hover:bg-white/20 rounded-full border border-white/[0.08] text-white transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1 select-none">
              {slides.map((_, dotIdx) => (
                <span 
                  key={dotIdx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlideIdx === dotIdx ? "w-4 bg-blue-500" : "w-1.5 bg-slate-500"
                  }`} 
                />
              ))}
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full border border-dashed border-white/20" title="End Card indicator" />
            </div>

            {/* Overlapping Likes Count bubble */}
            <div className="flex items-center justify-between py-1 border-b border-white/[0.04] text-[10px] text-slate-400 font-sans select-none">
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1877f2] flex items-center justify-center border border-[#242526] shadow">
                    <ThumbsUp className="w-2 h-2 text-white fill-white" />
                  </span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f02849] flex items-center justify-center border border-[#242526] shadow">
                    <Heart className="w-2 h-2 text-white fill-white" />
                  </span>
                </div>
                <span className="font-mono text-slate-300">
                  {previewLikedState ? `You and ${previewLikesCount - 1} others` : `${previewLikesCount} Likes`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="hover:underline cursor-pointer">{previewCommentsCount} Comments</span>
                <span>•</span>
                <span className="hover:underline cursor-pointer">18 Shares</span>
              </div>
            </div>

            {/* Facebook Action Buttons segment */}
            <div className="grid grid-cols-3 gap-1 py-0.5 text-xs text-slate-300 border-b border-white/[0.04]">
              <button 
                type="button"
                onClick={() => {
                  setPreviewLikedState(!previewLikedState);
                  setPreviewLikesCount(prev => previewLikedState ? prev - 1 : prev + 1);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 hover:bg-white/5 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer ${
                  previewLikedState ? "text-[#1877f2] font-bold" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${previewLikedState ? "fill-[#1877f2] text-[#1877f2]" : ""}`} />
                <span>Like</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setPreviewCommentsCount(prev => prev + 1);
                  alert("វាយតម្លៃមតិយោបល់៖ ប្រព័ន្ធបានកត់ត្រាយោបល់គំរូ! (Simulated comment response counts updated!)");
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white/5 rounded-lg transition-all cursor-pointer text-slate-300 hover:text-white"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  alert("យុទ្ធនាការ Carousel ត្រូវបានចែករំលែកជា គំរូសាកល្បងដោយជោគជ័យ! (Simulated Carousel share completed!)");
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-white/5 rounded-lg transition-all cursor-pointer text-slate-300 hover:text-white"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

          </div>

          {/* Guidelines notes */}
          <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-white/[0.04] rounded-xl flex items-start gap-2 text-[10px] text-slate-700 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-normal">
              <span className="font-bold text-slate-900 dark:text-slate-300 block">របៀបបញ្ជា Interactive Carousel៖</span>
              <p>អូស ឬចុចលើសញ្ញាព្រួញ <kbd className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1 rounded">‹</kbd> និង <kbd className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1 rounded">›</kbd> ដើម្បីធ្វើការស្កូលមើលស្លាយនីមួយៗ។ ចុចលើប៊ូតុង <span className="p-0.5 rounded bg-slate-100 dark:bg-slate-950 max-h-min inline-block"><Play className="w-2.5 h-2.5 inline" /></span> ដើម្បីដំណើរការលេងវីដេអូរៀងៗខ្លួន។</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
