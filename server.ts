import diagnostics_channel from "node:diagnostics_channel";
if (diagnostics_channel && !(diagnostics_channel as any).tracingChannel) {
  (diagnostics_channel as any).tracingChannel = () => ({
    hasSubscribers: false,
    subscribe: () => {},
    unsubscribe: () => {},
    tracePromise: async (fn: any) => fn(),
    traceSync: (fn: any) => fn(),
  });
}

import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { db, initDbSchema } from "./src/db/index.ts";
import { getBackupsDir, getDbPath } from "./src/utils/paths.ts";
import { 
  users, videoPosts, comments, autoReplyRules, pageSettings, 
  workPlanPages, workPlanPlatforms, workPlanItems, monthlyPlans, notifications 
} from "./src/db/schema.ts";
import { seedDatabase } from "./src/db/seed.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, and, desc, sql, or, isNull } from "drizzle-orm";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`[REQ_TIME] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Lazy-initialized Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key === "MOCK_KEY") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

app.post("/api/transcribe", requireAuth, async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Transcribe the following audio accurately in its original language. Only return the transcription without any other additions." },
            {
              inlineData: {
                data: audioData,
                mimeType: mimeType || "audio/webm",
              }
            }
          ]
        }
      ]
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: err.message || "Failed to transcribe audio" });
  }
});

// Global Mock Database
let mockPosts = [
  {
    id: "carousel_1",
    title: "ស្រឡាញ់បច្ចេកវិទ្យា និងអាជីវកម្ម? ទស្សនាវីដេអូខ្លីទាំង៣ នេះភ្លាម!",
    description: "ចំណេះដឹងថ្មីៗ ដើម្បីជោគជ័យក្នុងអាជីវកម្មឌីជីថល ឆ្នាំ២០២៦! អូសទៅឆ្វេង (swipe left) ដើម្បីមើលវីដេអូនីមួយៗ និងចុចមើលព័ត៌មានបន្ថែម!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
    tags: ["DigitalSkill", "BusinessCarousel", "TechKhmer"],
    status: "scheduled",
    scheduledTime: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours from now
    likesCount: 540,
    commentsCount: 16,
    sharesCount: 78,
    viewsCount: 3400,
    thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_1",
    category: "Video Carousel / ផ្សព្វផ្សាយ",
    createdAt: new Date().toISOString(),
    facebookPostId: undefined as string | undefined,
    facebookError: undefined as string | undefined,
    carouselSlides: [
      {
        id: "slide_1",
        title: "គន្លឹះទី១៖ ស្វែងយល់ពី AI Copilot",
        description: "បង្កើតមាតិការហ័សទ្វេដងជាមួយជំនួយការ AI",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Learn More"
      },
      {
        id: "slide_2",
        title: "គន្លឹះទី២៖ ទាក់ទាញអតិថិជនតាម FB",
        description: "បង្កើនការឆ្លើយតបដោយស្វ័យប្រវត្តិតាម Comments ភ្លាមៗ",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Send Message"
      },
      {
        id: "slide_3",
        title: "គន្លឹះទី៣៖ បង្កើនទំនុកចិត្តម៉ាកយីហោ",
        description: "របៀបរៀបចំ Brand Visual ស្អាតកម្រិតអាជីពស្តង់ដារ",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-podcast-with-a-professional-microphone-43026-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Shop Now"
      }
    ]
  },
  {
    id: "post_1",
    title: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
    description: "ចែករំលែកគន្លឹះសំខាន់ៗទាំង៥ ដើម្បីជួយឱ្យវីដេអូរបស់អ្នកទទួលបានការចាប់អារម្មណ៍ខ្ពស់នៅលើបណ្តាញសង្គម Facebook។ កុំភ្លេចចុច Like និង Follow ម្នាក់មួយផងណា!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
    tags: ["FacebookContent", "VideoMarketing", "KhmerCreator", "CreatorGuide"],
    status: "published",
    scheduledTime: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
    likesCount: 1240,
    commentsCount: 24,
    sharesCount: 145,
    viewsCount: 18500,
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_1",
    category: "ការអប់រំ / ចែករំលែកចំណេះដឹង",
    createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
    facebookPostId: undefined as string | undefined,
    facebookError: undefined as string | undefined
  },
  {
    id: "post_2",
    title: "ការបង្ហាញខ្លីៗពីរឿងជីវិតស្កាយឡាញ (Skyline Vlog)",
    description: "ដំណើរកម្សាន្តខ្លីចុងសប្តាហ៍នៅទីក្រុងភ្នំពេញ ទេសភាពនាពេលរាត្រីស្រស់ស្អាតប្លែកភ្នែកជាមួយអាកាសធាតុដ៏ល្អបំផុត!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
    tags: ["PhnomPenhNight", "VlogLife", "KhmerTourism", "Skyline"],
    status: "scheduled",
    scheduledTime: new Date(Date.now() + 3600000 * 2).toISOString(), // 2 hours from now
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_2",
    category: "វីឡុក / ដំណើរកម្សាន្ត",
    createdAt: new Date().toISOString(),
    facebookPostId: undefined as string | undefined,
    facebookError: undefined as string | undefined
  },
  {
    id: "post_3",
    title: "កិច្ចសម្ភាសន៍ពិសេសជាមួយសហគ្រិនស្រ្តីឆ្នើម ២០២៦",
    description: "ទស្សនាការចែករំលែកបទពិសោធន៍ដ៏មានតម្លៃពីរបៀបបង្កើតអាជីវកម្មខ្នាតតូចរហូតឈានដល់ការជោគជ័យ និងឧបសគ្គដែលត្រូវជម្នះ។",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-podcast-with-a-professional-microphone-43026-large.mp4",
    tags: ["BusinessCambodia", "WomenSME", "Inspiration", "KhmerInlay"],
    status: "draft",
    scheduledTime: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
    category: "សម្ភាសន៍ / ធុរកិច្ច",
    createdAt: new Date().toISOString(),
    facebookPostId: undefined as string | undefined,
    facebookError: undefined as string | undefined
  }
];

let mockComments = [
  {
    id: "comment_1",
    postId: "post_1",
    postTitle: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
    authorName: "សុខ ជា",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    text: "តើប្អូនអាចប្រាប់បន្ថែមពីកម្មវិធីកាត់តវីដេអូដែលល្អសម្រាប់ទូរស័ព្ទដៃបានទេ?",
    timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), // 3h ago
    isReplied: true,
    replyText: "បាទបង! សម្រាប់ទូរស័ព្ទដៃបងអាចប្រើ CapCut ឬ VN Video Editor បាទ ព្រោះវាឥតគិតថ្លៃ និងងាយស្រួលប្រើខ្លាំងមែនទែន!",
    isAutoReplied: false
  },
  {
    id: "comment_2",
    postId: "post_1",
    postTitle: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
    authorName: "ណារី រ័ត្ន",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    text: "តម្លៃសេវាកាត់តវីដេអូមួយគិតម៉េចដែរ?",
    timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), // 1h ago
    isReplied: false,
    isAutoReplied: false
  },
  {
    id: "comment_3",
    postId: "post_1",
    postTitle: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
    authorName: "ចាន់ ដារ៉ា",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    text: "វីដេអូមានប្រយោជន៏ខ្លាំងណាស់ អរគុណសម្រាប់ការចែករំលែក!",
    timestamp: new Date(Date.now() - 600 * 1000).toISOString(), // 10m ago
    isReplied: false,
    isAutoReplied: false
  }
];

let mockAutoReplyRules = [
  {
    id: "rule_1",
    name: "ស្វាគមន៍អតិថិជន / សួស្តី",
    triggerKeyword: "សួស្តី",
    condition: "contains",
    replyTemplate: "សួស្តីបាទ! អរគុណសម្រាប់ការទាក់ទងមកកាន់ទំព័ររបស់យើងខ្ញុំ។ តើយើងខ្ញុំអាចជួយអ្វីដល់បងបានខ្លះបាទ?",
    isActive: true,
    timesTriggered: 12
  },
  {
    id: "rule_2",
    name: "តំលៃ / តម្លៃសេវា",
    triggerKeyword: "តម្លៃ",
    condition: "contains",
    replyTemplate: "បាទបង! សម្រាប់តម្លៃកាត់តវីដេអូស្តីពីអាជីវកម្ម ឬការផ្សព្វផ្សាយផ្សេងៗ គឺចាប់ពី $១៥ ក្នុងមួយវីដេអូបាទ។ ក្រុមការងារយើងនឹងទាក់ទងទៅបងភ្លាមដើម្បីពិភាក្សាលម្អិត!",
    isActive: true,
    timesTriggered: 8
  },
  {
    id: "rule_3",
    name: "ថ្លែងអំណរគុណ",
    triggerKeyword: "អរគុណ",
    condition: "contains",
    replyTemplate: "អរគុណច្រើនបងសម្រាប់ការគាំទ្រ និងការបញ្ចេញមតិយោបល់! កុំភ្លេចជួយ Like និង Follow ទំព័រយើងខ្ញុំម្នាក់មួយផង ដើម្បីទទួលបានវីដេអូផ្តល់ចំណេះដឹងថ្មីៗបន្តទៀត។",
    isActive: true,
    timesTriggered: 35
  }
];



// Helper to simulate automatic responses on new comments
async function handleAutoResponseTrigger(comment: any, userId: number) {
  const [pageSetting] = await db.select().from(pageSettings).where(eq(pageSettings.userId, userId)).limit(1);
  if (!pageSetting?.isAutoResponderEnabled) return;

  const rules = await db.select().from(autoReplyRules).where(eq(autoReplyRules.userId, userId));
  
  const matchedRule = rules.find(rule => {
    if (!rule.isActive) return false;
    const lowerText = comment.text.toLowerCase();
    const lowerKeyword = rule.triggerKeyword.toLowerCase();
    
    if (rule.condition === "exact") return lowerText === lowerKeyword;
    if (rule.condition === "started_with") return lowerText.startsWith(lowerKeyword);
    return lowerText.includes(lowerKeyword);
  });

  if (matchedRule) {
    await db.update(autoReplyRules)
      .set({ timesTriggered: (matchedRule.timesTriggered || 0) + 1 })
      .where(eq(autoReplyRules.id, matchedRule.id));

    await db.update(comments)
      .set({
        isReplied: true,
        replyText: matchedRule.replyTemplate,
        isAutoReplied: true
      })
      .where(eq(comments.id, comment.id));

    // Push standard alert of auto response
    await db.insert(notifications).values({
      id: "notif_auto_" + Date.now(),
      userId,
      title: "ឆ្លើយតបសារស្វ័យប្រវត្តិជោគជ័យ",
      message: `ប្រព័ន្ធបានសរសេរទៅកាន់ '${comment.authorName}' ស្វ័យប្រវត្តិ: "${matchedRule.replyTemplate.substring(0, 32)}..."`,
      type: "auto_reply",
      createdAt: new Date().toISOString(),
      isRead: false
    });
  }
}


app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    res.json(dbUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const dbUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Be sure to allow password match via either passwordHash OR just allow any admin user if checking defaults
    if (!dbUser.length || dbUser[0].passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_12345";
    
    // Ensure picture in JWT is not too large to avoid localStorage quota issues
    const avatar = dbUser[0].avatar;
    const truncatedAvatar = (avatar && avatar.length > 5000) ? avatar.substring(0, 100) + "...truncated" : avatar;

    const customToken = jwt.sign(
      { 
        uid: dbUser[0].uid, 
        email: dbUser[0].email, 
        name: dbUser[0].name,
        picture: truncatedAvatar
      }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );
    res.json({ token: customToken, user: dbUser[0] });
  } catch (err: any) {
    console.error("DEBUG: Login route caught error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// REST API Endpoints

// --- FACEBOOK OAUTH INTEGRATION ENDPOINTS ---

// 1. Get Auth URL
app.get("/api/auth/facebook/url", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || "http://0.0.0.0:3000"}/auth/callback`;
    const state = dbUser.id.toString();
    
    if (!clientId || clientId === "YOUR_FACEBOOK_CLIENT_ID" || clientId === "") {
      // If not configured, redirect to high-fidelity simulated local consent sandbox
      return res.json({ url: `/auth/simulator-consent?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}` });
    }
    
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts&response_type=code&state=${state}`;
    res.json({ url: authUrl });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate auth url" });
  }
});

// 2. Simulator consent page
app.get("/auth/simulator-consent", (req, res) => {
  const redirectUri = req.query.redirect_uri || "/auth/callback";
  const state = req.query.state || "fb_oauth_state";
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facebook Login - Sandbox</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body class="bg-[#0c0d14] text-slate-100 flex items-center justify-center min-h-screen p-4">
      <div class="bg-[#16161a] rounded-2xl shadow-2xl border border-white/[0.08] max-w-md w-full overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between text-white border-b border-white/[0.06]">
          <div class="flex items-center gap-2.5">
            <i class="fab fa-facebook text-2xl animate-pulse"></i>
            <span class="font-bold tracking-tight text-base font-sans">Log in with Facebook</span>
          </div>
          <span class="text-[9px] font-mono tracking-widest uppercase bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/20 text-blue-200">Sandbox</span>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
          <div class="flex items-start gap-3.5">
            <div class="p-3 bg-blue-500/10 text-blue-400 rounded-xl text-lg border border-blue-500/15">
              <i class="fas fa-plug"></i>
            </div>
            <div class="space-y-1">
              <h2 class="font-bold text-white text-sm font-sans flex items-center gap-1.5">
                MetaStream <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">APP ID: fb_97312</span>
              </h2>
              <p class="text-xs text-slate-400 font-sans leading-relaxed">Is requesting permission to authenticate and load pages linked to your profile in this private sandbox environment.</p>
            </div>
          </div>

          <!-- Permissions Checklist -->
          <div class="bg-[#0a0a0b] border border-white/[0.04] p-4.5 rounded-xl space-y-4">
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-blue-400 mt-0.5 text-xs"></i>
              <div>
                <p class="text-xs font-bold text-slate-200">Public profile details & Email</p>
                <p class="text-[10px] text-slate-500 leading-normal font-sans">Required to register your Facebook identifier name, email (seanglyad@gmail.com) and avatar picture.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-blue-400 mt-0.5 text-xs"></i>
              <div>
                <p class="text-xs font-bold text-slate-200 font-sans">Manage Page List & Page tokens</p>
                <p class="text-[10px] text-slate-500 leading-normal font-sans">Required to retrieve names, category niches, likes, and tokens of the Facebook pages you manage.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-blue-400 mt-0.5 text-xs"></i>
              <div>
                <p class="text-xs font-bold text-slate-200 font-sans">Publish Video Postings & Carousels</p>
                <p class="text-[10px] text-slate-500 leading-normal font-sans">Authorized to automate scheduled publishing directly on your selected timeline page.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 object-cover rounded-xl border border-white/[0.06]" />
            <div>
              <p class="text-xs font-bold text-white font-sans">សេងលី អាដ (Seangly Ad)</p>
              <p class="text-[10px] text-slate-500 font-sans">Ready to connect as facebook account</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3.5 pt-2">
            <button onclick="window.close()" class="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <a href="${redirectUri}?code=mock_fb_code&state=${state}" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer">
              <span>Continue as Seangly</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="bg-[#0b0c0f] border-t border-white/[0.04] px-6 py-4.5 text-[10px] text-slate-500 flex justify-between font-sans">
          <span>Safe Meta Sandbox Connection</span>
          <span class="font-mono text-[9px] text-slate-600">v19.0 API Compliant</span>
        </div>

      </div>
    </body>
    </html>
  `);
});

// 3. Callback URL Page
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  const redirectUri = `${process.env.APP_URL || "http://0.0.0.0:3000"}/auth/callback`;
  const userId = parseInt(state as string, 10);

  if (isNaN(userId)) {
    return res.status(400).send("Invalid OAuth state parameter.");
  }

  try {
    let importedUser: any = null;
    let importedPages: any[] = [];

    if (code === "mock_fb_code" || !process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID === "YOUR_FACEBOOK_CLIENT_ID") {
      // Set up mock connection user inside sandbox
      importedUser = {
        id: "fb_user_seangly",
        name: "Seangly Ad (សេងលី អាដ)",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        email: "seanglyad@gmail.com",
        token: "mock_user_token_abc123"
      };
      
      importedPages = [
        {
          id: "fb_page_2026",
          name: "ចំណេះដឹងបច្ចេកវិទ្យា & ឌីជីថល",
          username: "@digitaltechkh",
          category: "បច្ចេកវិទ្យា និងអាជីវកម្ម",
          avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
          followersCount: 54200,
          likesCount: 41200,
          accessToken: "mock_page_token_1"
        },
        {
          id: "fb_page_tech",
          name: "Tech Khmer News",
          username: "@techkhmernews",
          category: "ព័ត៌មានបច្ចេកវិទ្យា",
          avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
          followersCount: 12500,
          likesCount: 9800,
          accessToken: "mock_page_token_2"
        },
        {
          id: "fb_page_biz",
          name: "Business Idea Cambodia",
          username: "@bizideakh",
          category: "គំនិតអាជីវកម្ម",
          avatar: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          followersCount: 84000,
          likesCount: 72000,
          accessToken: "mock_page_token_3"
        },
        {
          id: "fb_page_internal",
          name: "Internal Agency",
          username: "@internalagency",
          category: "ទីភ្នាក់ងារផ្សព្វផ្សាយ",
          avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
          followersCount: 450,
          likesCount: 400,
          accessToken: "mock_page_token_4"
        }
      ];
    } else {
      // Real Facebook integration code block!
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json() as any;
      
      if (tokenData.error) {
        throw new Error(tokenData.error.message || "Failed to exchange code");
      }

      const userAccessToken = tokenData.access_token;

      // Fetch User details
      const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture,email&access_token=${userAccessToken}`);
      const userData = await userRes.json() as any;

      importedUser = {
        id: userData.id,
        name: userData.name,
        avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
        email: userData.email || `${userData.id}@facebook.com`,
        token: userAccessToken
      };

      // Fetch User's Pages
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${userAccessToken}`);
      const pagesData = await pagesRes.json() as any;

      if (pagesData.data && pagesData.data.length > 0) {
        importedPages = pagesData.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          username: p.username ? `@${p.username}` : `@page_${p.id}`,
          category: p.category || "បច្ចេកវិទ្យា និងអាជីវកម្ម",
          avatar: p.picture?.data?.url || `https://graph.facebook.com/v19.0/${p.id}/picture?type=large`,
          coverImage: p.cover?.source || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
          followersCount: p.fan_count || 5400,
          likesCount: p.talking_about_count || 4100,
          accessToken: p.access_token
        }));
      }
    }

    if (importedUser) {
      // Save settings to database
      const settingsValues = {
        facebookToken: importedUser.token,
        facebookUserId: importedUser.id,
        facebookUserName: importedUser.name,
        facebookUserAvatar: importedUser.avatar,
        facebookUserEmail: importedUser.email,
        facebookPages: importedPages,
        pageId: importedPages.length > 0 ? importedPages[0].id : null,
        pageName: importedPages.length > 0 ? importedPages[0].name : null,
        pageUsername: importedPages.length > 0 ? importedPages[0].username : null,
        category: importedPages.length > 0 ? importedPages[0].category : null,
        pageAvatar: importedPages.length > 0 ? importedPages[0].avatar : null,
        coverImage: importedPages.length > 0 ? importedPages[0].coverImage : null,
        followersCount: importedPages.length > 0 ? importedPages[0].followersCount : 0,
        likesCount: importedPages.length > 0 ? importedPages[0].likesCount : 0,
        pageAccessToken: importedPages.length > 0 ? importedPages[0].accessToken : null,
      };

      let page = await db.select().from(pageSettings).where(eq(pageSettings.userId, userId)).limit(1);
      if (page.length === 0) {
        await db.insert(pageSettings).values({
          userId: userId,
          ...settingsValues
        });
      } else {
        await db.update(pageSettings)
          .set(settingsValues)
          .where(eq(pageSettings.userId, userId));
      }

      await db.insert(notifications).values({
        id: "notif_fb_auth_" + Date.now(),
        userId: userId,
        title: "គណនី Facebook ស្វ័យប្រវត្តិបានភ្ជាប់",
        message: `គណនី '${importedUser.name}' ត្រូវបានភ្ជាប់ដោយជោគជ័យ។ បានផ្ទុកទំព័រចំនួន ${importedPages.length} សម្រាប់ជ្រើសរើស។`,
        type: "auto_reply",
        createdAt: new Date().toISOString(),
        isRead: false
      });
    }

  } catch (err: any) {
    console.error("Facebook Login Error: ", err);
  }

  // Send message to opener window and close popup
  res.send(`
    <html>
      <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
        <div class="text-center space-y-4 font-sans">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-xl border border-emerald-500/30 animate-pulse">
            ✓
          </div>
          <p class="text-sm font-semibold">Facebook Connection Authorized!</p>
          <p class="text-xs text-slate-400 font-sans">This window will close automatically...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'FB_AUTH_SUCCESS' }, '*');
            setTimeout(() => { window.close(); }, 1200);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// --- ADVANCED FB AUTO TOKEN/COOKIE GRAB & POST API ---
const fbDebugLogs: Array<{ timestamp: string; level: string; msg: string }> = [];
function addFbLog(level: string, msg: string) {
  fbDebugLogs.unshift({ timestamp: new Date().toISOString(), level, msg });
  if (fbDebugLogs.length > 30) fbDebugLogs.pop();
}

async function publishPostToFacebookGraph(post: any): Promise<{ success: boolean; id?: string; error?: string }> {
  // 1. Fetch user's pageSettings from the database
  const userSettingsList = await db.select().from(pageSettings).where(eq(pageSettings.userId, post.userId)).limit(1);
  const userSettings = userSettingsList[0];

  if (!userSettings || !userSettings.pageId) {
    addFbLog("WARN", "No active page selected during publish request. Operating fallback simulation.");
    return { success: true, id: "sim_fb_post_id" + Date.now() };
  }

  const token = userSettings.pageAccessToken || userSettings.facebookToken;

  if (!token || token.startsWith("mock_")) {
    addFbLog("INFO", `Simulated post publish for Page '${userSettings.pageName}' (${userSettings.pageId}) - No real token found.`);
    return { success: true, id: "fb_sim_post_id_" + Math.floor(Math.random() * 1000000) };
  }

  addFbLog("INFO", `Starting REAL post publish to Facebook Page ID: ${userSettings.pageId}`);
  try {
    let url = "";
    let payload: any = {};

    // Determine type: Video vs Feed post
    if (post.videoUrl && post.videoUrl.trim() !== "" && !post.carouselSlides) {
      url = `https://graph.facebook.com/v19.0/${userSettings.pageId}/videos`;
      payload = {
        description: post.description ? `${post.title}\n\n${post.description}` : post.title,
        title: post.title,
        file_url: post.videoUrl,
        access_token: token
      };
      addFbLog("INFO", `Attempting Video publish with url: ${post.videoUrl}`);
    } else {
      url = `https://graph.facebook.com/v19.0/${userSettings.pageId}/feed`;
      let messageText = `${post.title}`;
      if (post.description) messageText += `\n\n${post.description}`;
      if (post.tags && post.tags.length > 0) messageText += `\n\n${post.tags.map((t: string) => `#${t}`).join(" ")}`;
      
      payload = {
        message: messageText,
        access_token: token
      };
      
      // If there are carousel slides, add link if matching first one
      if (post.carouselSlides && post.carouselSlides.length > 0) {
        payload.link = post.carouselSlides[0].thumbnailUrl;
      }
      addFbLog("INFO", "Attempting Feed status text publish.");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;

    if (data.error) {
      const errMsg = data.error.message || JSON.stringify(data.error);
      addFbLog("ERROR", `Meta Graph API responded with error: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const createdId = data.id || data.post_id;
    addFbLog("SUCCESS", `Post successfully published on Facebook! Target ID: ${createdId}`);
    return { success: true, id: createdId };

  } catch (err: any) {
    const errorMsg = err.message || "Connection timeout reaching Meta Graph API";
    addFbLog("ERROR", `Failed connecting to Facebook: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// 4. GET FB Account status
app.get("/api/auth/facebook/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    
    // Select pageSettings for this user
    let page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    
    if (page.length > 0 && page[0].facebookUserId) {
      res.json({
        user: {
          id: page[0].facebookUserId,
          name: page[0].facebookUserName,
          avatar: page[0].facebookUserAvatar,
          email: page[0].facebookUserEmail,
          token: page[0].facebookToken,
          cookies: undefined,
        },
        pages: page[0].facebookPages || [],
        logs: fbDebugLogs
      });
    } else {
      res.json({
        user: null,
        pages: [],
        logs: fbDebugLogs
      });
    }
  } catch (err) {
    console.error("Facebook status error:", err);
    res.json({
      user: null,
      pages: [],
      logs: fbDebugLogs
    });
  }
});

// Import custom FB access token & cookies
app.post("/api/auth/facebook/import-token", requireAuth, async (req: AuthRequest, res) => {
  const { token, cookies, appId, appSecret } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Access token is required" });
  }

  const dbUser = await getOrCreateDbUser(req.user!);
  addFbLog("INFO", `Attempting token import for token: ${token.substring(0, 10)}...`);

  try {
    // 1. Fetch User details
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture.type(large),email&access_token=${token}`);
    const userData = await userRes.json() as any;

    if (userData.error) {
      addFbLog("ERROR", `Token validation failed: ${userData.error.message}`);
      return res.status(400).json({ error: userData.error.message || "Invalid FB access token" });
    }

    const importedFbUser = {
      id: userData.id,
      name: userData.name,
      avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
      email: userData.email || `${userData.id}@facebook.com`,
      token: token,
      cookies: cookies || undefined,
      appId: appId || undefined,
      appSecret: appSecret || undefined
    };

    addFbLog("SUCCESS", `Connected to User: ${userData.name} (${userData.id})`);

    // 2. Fetch User's Pages (Page accounts with page access tokens)
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${token}`);
    const pagesData = await pagesRes.json() as any;

    let importedPages: any[] = [];
    if (pagesData.data && pagesData.data.length > 0) {
      importedPages = pagesData.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        username: p.username ? `@${p.username}` : `@page_${p.id}`,
        category: p.category || "បច្ចេកវិទ្យា និងអាជីវកម្ម",
        avatar: p.picture?.data?.url || `https://graph.facebook.com/v19.0/${p.id}/picture?type=large`,
        coverImage: p.cover?.source || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
        followersCount: p.fan_count || 2100,
        likesCount: p.talking_about_count || 1500,
        accessToken: p.access_token
      }));

      addFbLog("SUCCESS", `Loaded ${importedPages.length} real managed pages.`);
    } else {
      addFbLog("WARN", "Authorized user has no managed pages. Operating fallbacks.");
    }

    // 3. Update the page settings in the database for the user!
    let page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    
    const settingsValues = {
      facebookToken: token,
      facebookUserId: importedFbUser.id,
      facebookUserName: importedFbUser.name,
      facebookUserAvatar: importedFbUser.avatar,
      facebookUserEmail: importedFbUser.email,
      facebookPages: importedPages,
      // Select the first page by default
      pageId: importedPages.length > 0 ? importedPages[0].id : null,
      pageName: importedPages.length > 0 ? importedPages[0].name : null,
      pageUsername: importedPages.length > 0 ? importedPages[0].username : null,
      category: importedPages.length > 0 ? importedPages[0].category : null,
      pageAvatar: importedPages.length > 0 ? importedPages[0].avatar : null,
      coverImage: importedPages.length > 0 ? importedPages[0].coverImage : null,
      followersCount: importedPages.length > 0 ? importedPages[0].followersCount : 0,
      likesCount: importedPages.length > 0 ? importedPages[0].likesCount : 0,
      pageAccessToken: importedPages.length > 0 ? importedPages[0].accessToken : null,
    };

    let savedSettings;
    if (page.length === 0) {
      const inserted = await db.insert(pageSettings).values({
        userId: dbUser.id,
        ...settingsValues
      }).returning();
      savedSettings = inserted[0];
    } else {
      const updated = await db.update(pageSettings)
        .set(settingsValues)
        .where(eq(pageSettings.userId, dbUser.id))
        .returning();
      savedSettings = updated[0];
    }

    // Push database notification
    await db.insert(notifications).values({
      id: "notif_fb_import_" + Date.now(),
      userId: dbUser.id,
      title: "គ្រាប់ចុចនិមិត្តសញ្ញា Facebook បានបញ្ចូល",
      message: `គណនី '${importedFbUser.name}' ត្រូវបានកំណត់ត្រាជោគជ័យ។ បានបញ្ចូលទំព័រចំនួន ${importedPages.length}។`,
      type: "auto_reply",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json({
      success: true,
      user: importedFbUser,
      pages: importedPages,
      pageSettings: savedSettings
    });

  } catch (err: any) {
    addFbLog("ERROR", `Import exception: ${err.message}`);
    res.status(500).json({ error: "Failed validating credentials with Facebook Graph APIs: " + err.message });
  }
});

// 5. Select active Page
app.post("/api/auth/facebook/select-page", requireAuth, async (req: AuthRequest, res) => {
  const { pageId } = req.body;
  if (!pageId) return res.status(400).json({ error: "pageId is required" });

  try {
    const dbUser = await getOrCreateDbUser(req.user!);

    // Load page settings from database
    let page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    if (page.length === 0) return res.status(404).json({ error: "Page settings not found. Please connect Facebook first." });

    const pagesList = (page[0].facebookPages || []) as any[];
    const selected = pagesList.find(p => p.id === pageId);
    if (!selected) return res.status(404).json({ error: "Page not found in logged-in user profile list" });

    // Update pageSettings in the database
    const result = await db.update(pageSettings)
      .set({
        pageId: selected.id,
        pageName: selected.name,
        pageUsername: selected.username,
        category: selected.category,
        pageAvatar: selected.avatar,
        coverImage: selected.coverImage,
        followersCount: selected.followersCount,
        likesCount: selected.likesCount,
        pageAccessToken: selected.accessToken
      })
      .where(eq(pageSettings.userId, dbUser.id))
      .returning();

    // Add Notification in database
    await db.insert(notifications).values({
      id: "notif_select_page_" + Date.now(),
      userId: dbUser.id,
      title: "បានប្តូរទៅកាន់ទំព័រថ្មី",
      message: `ប្រព័ន្ធបានប្តូរទៅការគ្រប់គ្រងទំព័រ '${selected.name}' ដោយជោគជ័យ។`,
      type: "publish",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json({ success: true, pageSettings: result[0], selectedPage: selected });
  } catch (err: any) {
    console.error("Select page error:", err);
    res.status(500).json({ error: "Failed to select page" });
  }
});

// 6. Sign out / logout FB
app.post("/api/auth/facebook/logout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);

    await db.update(pageSettings)
      .set({
        facebookToken: null,
        facebookUserId: null,
        facebookUserName: null,
        facebookUserAvatar: null,
        facebookUserEmail: null,
        facebookPages: null,
        pageAccessToken: null
      })
      .where(eq(pageSettings.userId, dbUser.id));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Facebook logout error:", err);
    res.status(500).json({ error: "Failed to logout Facebook" });
  }
});

// Import custom FB access token & cookies
app.post("/api/auth/facebook/import-token", requireAuth, async (req: AuthRequest, res) => {
  const { token, cookies, appId, appSecret } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Access token is required" });
  }

  const dbUser = await getOrCreateDbUser(req.user!);

  addFbLog("INFO", `Attempting token import for token: ${token.substring(0, 10)}...`);

  try {
    // 1. Fetch User details
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture.type(large),email&access_token=${token}`);
    const userData = await userRes.json() as any;

    if (userData.error) {
      addFbLog("ERROR", `Token validation failed: ${userData.error.message}`);
      return res.status(400).json({ error: userData.error.message || "Invalid FB access token" });
    }

    const fbUser = {
      id: userData.id,
      name: userData.name,
      avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
      email: userData.email || `${userData.id}@facebook.com`,
      token: token,
      cookies: cookies || undefined,
      appId: appId || undefined,
      appSecret: appSecret || undefined
    };

    addFbLog("SUCCESS", `Connected to User: ${userData.name} (${userData.id})`);

    // 2. Fetch User's Pages (Page accounts with page access tokens)
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${token}`);
    const pagesData = await pagesRes.json() as any;

    let importedPages: any[] = [];
    let settingsUpdate: any = {
      facebookToken: fbUser.token,
      facebookUserId: fbUser.id,
      facebookUserName: fbUser.name,
      facebookUserAvatar: fbUser.avatar,
      facebookUserEmail: fbUser.email,
    };

    if (pagesData.data && pagesData.data.length > 0) {
      importedPages = pagesData.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        username: p.username ? `@${p.username}` : `@page_${p.id}`,
        category: p.category || "បច្ចេកវិទ្យា និងអាជីវកម្ម",
        avatar: p.picture?.data?.url || `https://graph.facebook.com/v19.0/${p.id}/picture?type=large`,
        coverImage: p.cover?.source || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
        followersCount: p.fan_count || 2100,
        likesCount: p.talking_about_count || 1500,
        accessToken: p.access_token
      }));

      addFbLog("SUCCESS", `Loaded ${importedPages.length} real managed pages.`);

      // Select first page
      const p0 = importedPages[0];
      settingsUpdate = {
        ...settingsUpdate,
        facebookPages: importedPages,
        pageId: p0.id,
        pageName: p0.name,
        pageUsername: p0.username,
        category: p0.category,
        pageAvatar: p0.avatar,
        coverImage: p0.coverImage,
        followersCount: p0.followersCount,
        likesCount: p0.likesCount,
        pageAccessToken: p0.accessToken
      };
    } else {
      addFbLog("WARN", "Authorized user has no managed pages. Operating fallbacks.");
    }

    await db.update(pageSettings).set(settingsUpdate).where(eq(pageSettings.userId, dbUser.id));

    // Push notification
    await db.insert(notifications).values({
      id: "notif_fb_import_" + Date.now(),
      userId: dbUser.id,
      title: "គ្រាប់ចុចនិមិត្តសញ្ញា Facebook បានបញ្ចូល",
      message: `គណនី '${fbUser.name}' ត្រូវបានកំណត់ត្រាជោគជ័យ។ បានបញ្ចូលទំព័រចំនួន ${importedPages.length}។`,
      type: "auto_reply",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    const [updatedSettings] = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);

    res.json({
      success: true,
      user: fbUser,
      pages: importedPages,
      pageSettings: updatedSettings
    });

  } catch (err: any) {
    addFbLog("ERROR", `Import exception: ${err.message}`);
    res.status(500).json({ error: "Failed validating credentials with Facebook Graph APIs: " + err.message });
  }
});

// 5. Select active Page
app.post("/api/auth/facebook/select-page", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { pageId } = req.body;
    if (!pageId) return res.status(400).json({ error: "pageId is required" });

    const dbUser = await getOrCreateDbUser(req.user!);
    const [settings] = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    if (!settings) return res.status(404).json({ error: "Settings not found" });

    const fbPages = (settings.facebookPages || []) as any[];
    const selected = fbPages.find(p => p.id === pageId);
    if (!selected) return res.status(404).json({ error: "Page not found in logged-in user profile list" });

    // Update pageSettings
    await db.update(pageSettings)
      .set({
        pageId: selected.id,
        pageName: selected.name,
        pageUsername: selected.username,
        category: selected.category,
        pageAvatar: selected.avatar,
        coverImage: selected.coverImage,
        followersCount: selected.followersCount,
        likesCount: selected.likesCount,
        pageAccessToken: selected.accessToken
      })
      .where(eq(pageSettings.userId, dbUser.id));

    // Add Notification
    await db.insert(notifications).values({
      id: "notif_select_page_" + Date.now(),
      userId: dbUser.id,
      title: "បានប្តូរទៅកាន់ទំព័រថ្មី",
      message: `ប្រព័ន្ធបានប្តូរទៅការគ្រប់គ្រងទំព័រ '${selected.name}' ដោយជោគជ័យ។`,
      type: "publish",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    const [updatedSettings] = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);

    res.json({ success: true, pageSettings: updatedSettings, selectedPage: selected });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to select page: " + err.message });
  }
});

// 1. Analytics Data Endpoint
app.get("/api/analytics", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const [settings] = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    const followersCount = settings?.followersCount || 54200;
    const scale = followersCount / 54200; // default state is 54200
    
    const viewsOverTime = [
      { date: "06-06", views: Math.round(12400 * scale), minutesWatched: Math.round(45000 * scale) },
      { date: "06-07", views: Math.round(15100 * scale), minutesWatched: Math.round(52000 * scale) },
      { date: "06-08", views: Math.round(14800 * scale), minutesWatched: Math.round(49000 * scale) },
      { date: "06-09", views: Math.round(19800 * scale), minutesWatched: Math.round(72000 * scale) },
      { date: "06-10", views: Math.round(22400 * scale), minutesWatched: Math.round(81000 * scale) },
      { date: "06-11", views: Math.round(24500 * scale), minutesWatched: Math.round(95000 * scale) },
      { date: "06-12", views: Math.round(28900 * scale), minutesWatched: Math.round(112000 * scale) }
    ];

    const retentionCurve = [
      { percent: 100, seconds: 0 },
      { percent: 85, seconds: 15 },
      { percent: 72, seconds: 30 },
      { percent: 60, seconds: 60 },
      { percent: 53, seconds: 120 },
      { percent: 45, seconds: 240 },
      { percent: 38, seconds: 300 }
    ];

    const audienceDemographics = [
      { group: "18-24 ឆ្នាំ", value: 35 },
      { group: "25-34 ឆ្នាំ", value: 48 },
      { group: "35-44 ឆ្នាំ", value: 12 },
      { group: "ផ្សេងៗ", value: 5 }
    ];

    const engagementMetrics = [
      { metric: "ចំនួនទស្សនាវីដេអូសរុប (Total Video Views)", count: Math.round(18500 * 3.4 * scale), change: 18.5 },
      { metric: "អត្រាចូលរួមជាមធ្យម (Avg Engagement Rate)", count: 12.4, change: 2.1 },
      { metric: "ចំនួន Like សរុប", count: Math.round(1240 * 2.8 * scale), change: 14.2 },
      { metric: "ចំនួន Follower កើនឡើង", count: Math.round(2450 * scale), change: 25.4 }
    ];

    const growthTrend = [
      { date: "06-06", followers: Math.round(51750 * scale), reach: Math.round(98000 * scale) },
      { date: "06-07", followers: Math.round(52100 * scale), reach: Math.round(110000 * scale) },
      { date: "06-08", followers: Math.round(52500 * scale), reach: Math.round(105000 * scale) },
      { date: "06-09", followers: Math.round(53100 * scale), reach: Math.round(135000 * scale) },
      { date: "06-10", followers: Math.round(53600 * scale), reach: Math.round(142000 * scale) },
      { date: "06-11", followers: Math.round(53950 * scale), reach: Math.round(158000 * scale) },
      { date: "06-12", followers: Math.round(followersCount), reach: Math.round(185000 * scale) }
    ];

    res.json({
      viewsOverTime,
      retentionCurve,
      audienceDemographics,
      engagementMetrics,
      growthTrend
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// 2. Video Posts Routing
app.get("/api/posts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const allPosts = await db.select().from(videoPosts).where(eq(videoPosts.userId, dbUser.id)).orderBy(desc(videoPosts.createdAt));
    res.json(allPosts);
  } catch (err) {
    console.error("Posts DB fetch failed, using mocks:", err);
    res.json([]);
  }
});

async function getOrCreateDbUser(reqUser: any) {
  const uid = reqUser.uid;
  const email = reqUser.email;
  
  if (!uid) {
    throw new Error("User UID is missing from auth token");
  }

  console.log("getOrCreateDbUser called for:", { uid, email });

  let dbUser;
  if (email) {
    dbUser = await db.select().from(users).where(or(eq(users.uid, uid), eq(users.email, email))).limit(1);
  } else {
    dbUser = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  }

  if (dbUser.length === 0) {
    dbUser = await db.insert(users).values({
      uid: uid,
      name: reqUser.name || reqUser.email?.split('@')[0] || "User",
      email: reqUser.email || `${uid}@app.local`,
      role: "Admin",
      avatar: reqUser.picture || `https://images.unsplash.com/photo-${15000000000+Math.floor(Math.random()*999999999)}?auto=format&fit=crop&w=150&h=150&q=80`,
      permissions: ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"],
      department: "Operations"
    }).returning();
  } else {
    // Forcefully make sure the target user or any newly matching user gets updated UID
    let toUpdate: Record<string, any> = {};
    if (dbUser[0].uid !== uid) {
      toUpdate.uid = uid;
    }
    
    // Always force super admin for that specific default user
    if (dbUser[0].email === "seanglyad@gmail.com" || dbUser[0].email === "admin@app.local") {
      toUpdate.role = "Admin";
      toUpdate.permissions = ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"];
    }

    if (Object.keys(toUpdate).length > 0) {
      dbUser = await db.update(users).set(toUpdate).where(eq(users.id, dbUser[0].id)).returning();
    }
  }
  return dbUser[0] as any;
}

app.post("/api/posts", requireAuth, async (req: AuthRequest, res) => {
  const { title, description, videoUrl, tags, status, scheduledTime, autoReplyRuleId, category, carouselSlides, aspectRatio } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const dbUser = await getOrCreateDbUser(req.user!);

    const customPost = {
      id: "post_" + Date.now(),
      userId: dbUser.id,
      title,
      description: description || "",
      videoUrl: videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: tags || [],
      status: status || "draft",
      scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date(Date.now() + 3600000 * 24).toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      thumbnailUrl: carouselSlides && carouselSlides[0] ? carouselSlides[0].thumbnailUrl : "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId,
      category: category || "ទូទៅ",
      aspectRatio: aspectRatio || "16_9",
      createdAt: new Date().toISOString(),
      carouselSlides: carouselSlides || undefined,
      facebookPostId: undefined as string | undefined,
      facebookError: undefined as string | undefined
    };

    // If status is "published", publish immediately to FB!
    if (customPost.status === "published") {
      const fbResult = await publishPostToFacebookGraph(customPost) as any;
      if (fbResult.success) {
        customPost.facebookPostId = fbResult.id;
      } else {
        customPost.facebookError = fbResult.error;
      }
    }

    const result = await db.insert(videoPosts).values(customPost).returning();
    const savedPost = result[0];

    // Notify of scheduling / posting activity
    await db.insert(notifications).values({
      id: "notif_" + Date.now(),
      userId: dbUser.id,
      title: savedPost.status === "scheduled" ? "កាលវិភាគវីដេអូបានកំណត់ទុក" : "វីដេអូបានផ្សព្វផ្សាយភ្លាមៗ",
      message: savedPost.facebookError 
        ? `វីដេអូបានបង្កើត ប៉ុន្តែមានបញ្ហាផ្ញើទៅ Facebook: ${savedPost.facebookError}`
        : `វីដេអូ '${savedPost.title}' ត្រូវបានបញ្ចូលទៅក្នុងប្រព័ន្ធដោយជោគជ័យ។` + (savedPost.facebookPostId ? ` (FB ID: ${savedPost.facebookPostId})` : ""),
      type: savedPost.facebookError ? "failure" : "publish",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// 3. Force Instant Publish Simulation Action
app.post("/api/posts/:id/publish", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    
    // Find post in database
    const postList = await db.select().from(videoPosts)
      .where(and(eq(videoPosts.id, req.params.id), eq(videoPosts.userId, dbUser.id)))
      .limit(1);
      
    if (postList.length === 0) return res.status(404).json({ error: "Post not found" });
    const post = postList[0];

    // Simulate stats boost on publishing
    const viewsCount = Math.floor(Math.random() * 500) + 120;
    const likesCount = Math.floor(Math.random() * 80) + 20;

    // Call FB Publish!
    const fbResult = await publishPostToFacebookGraph({ ...post, userId: dbUser.id }) as any;
    
    let facebookPostId = undefined;
    let facebookError = undefined;
    if (fbResult.success) {
      facebookPostId = fbResult.id;
    } else {
      facebookError = fbResult.error;
    }

    // Update in database
    const updatedResult = await db.update(videoPosts)
      .set({
        status: "published",
        viewsCount,
        likesCount,
        facebookPostId,
        facebookError
      })
      .where(eq(videoPosts.id, post.id))
      .returning();

    const updatedPost = updatedResult[0];

    // Push Live notification in DB
    await db.insert(notifications).values({
      id: "notif_publish_" + Date.now(),
      userId: dbUser.id,
      title: updatedPost.facebookError ? "ការផ្សព្វផ្សាយទៅ Facebook បរាជ័យ" : "វីដេអូបានផ្សព្វផ្សាយជោគជ័យ!",
      message: updatedPost.facebookError
        ? `បញ្ហា Facebook: ${updatedPost.facebookError}`
        : `វីដេអូ '${updatedPost.title}' ត្រូវបានបង្ហោះទៅកាន់ទំព័រ Facebook របស់អ្នកដោយស្វ័យប្រវត្តិនាពេលនេះ។` + (updatedPost.facebookPostId ? ` (ID: ${updatedPost.facebookPostId})` : ""),
      type: updatedPost.facebookError ? "failure" : "publish",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json(updatedPost);
  } catch (err: any) {
    console.error("Force publish failed:", err);
    res.status(500).json({ error: "Failed to publish post: " + err.message });
  }
});

app.delete("/api/posts/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    await db.delete(videoPosts).where(
      and(
        eq(videoPosts.id, req.params.id),
        eq(videoPosts.userId, dbUser.id)
      )
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Bulk actions API route for posts
app.post("/api/posts/bulk", requireAuth, async (req: AuthRequest, res) => {
  const { ids, action, data } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "ids array is required" });
  }

  try {
    const dbUser = await getOrCreateDbUser(req.user!);

    if (action === "delete") {
      for (const id of ids) {
        await db.delete(videoPosts).where(and(eq(videoPosts.id, id), eq(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Deleted successfully" });
    }

    if (action === "pause") {
      for (const id of ids) {
        await db.update(videoPosts).set({ status: "draft" }).where(and(eq(videoPosts.id, id), eq(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Paused successfully" });
    }

    if (action === "reschedule") {
      const { scheduledTime } = data || {};
      if (!scheduledTime) {
        return res.status(400).json({ error: "scheduledTime is required for reschedule" });
      }
      for (const id of ids) {
        await db.update(videoPosts)
          .set({ status: "scheduled", scheduledTime: new Date(scheduledTime).toISOString() })
          .where(and(eq(videoPosts.id, id), eq(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Rescheduled successfully" });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Bulk action failed:", err);
    res.status(500).json({ error: "Bulk action failed" });
  }
});

// 4. Comments Root Router
app.get("/api/comments", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const userComments = await db.select({
      id: comments.id,
      postId: comments.postId,
      postTitle: comments.postTitle,
      authorName: comments.authorName,
      authorAvatar: comments.authorAvatar,
      text: comments.text,
      timestamp: comments.timestamp,
      isReplied: comments.isReplied,
      replyText: comments.replyText,
      isAutoReplied: comments.isAutoReplied
    }).from(comments)
    .innerJoin(videoPosts, eq(comments.postId, videoPosts.id))
    .where(eq(videoPosts.userId, dbUser.id));
    res.json(userComments);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/comments", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { postId, postTitle, authorName, text } = req.body;
    if (!text || !postId) return res.status(400).json({ error: "Text and postId are required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const newComment = {
      id: "comment_" + Date.now(),
      postId,
      postTitle: postTitle || "ចំណងជើងមិនស្គាល់",
      authorName: authorName || "អ្នកគាំទ្រថ្មី",
      authorAvatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
      text,
      timestamp: new Date().toISOString(),
      isReplied: false,
      isAutoReplied: false
    };

    const inserted = await db.insert(comments).values(newComment).returning();

    // Notify admin of incoming comments
    await db.insert(notifications).values({
      id: "notif_comm_" + Date.now(),
      userId: dbUser.id,
      title: "មតិយោបល់ថ្មី (New Comment)",
      message: `អ្នកតាមដាន '${newComment.authorName}' បានបញ្ចេញមតិយោបល់លើវីដេអូរបស់អ្នក។`,
      type: "comment",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    await handleAutoResponseTrigger(inserted[0], dbUser.id);

    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Failed handling comment snippet via DB:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Reply to comment
app.post("/api/comments/:id/reply", requireAuth, async (req, res) => {
  try {
    const { replyText, isAutoReplied } = req.body;
    const result = await db.update(comments)
      .set({
        isReplied: true,
        replyText: replyText || "អរគុណច្រើនដែលបានផ្តល់មតិយោបល់ និងគាំទ្រ!",
        isAutoReplied: isAutoReplied || false
      })
      .where(eq(comments.id, req.params.id))
      .returning();
    
    if (!result.length) return res.status(404).json({ error: "Comment not found" });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to reply to comment" });
  }
});

// 5. Settings Routing
app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    let page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    
    if (page.length === 0) {
      const newPage = await db.insert(pageSettings).values({
        userId: dbUser.id,
        pageName: "យានដ្ឋាន SRV AutoRepair",
        pageUsername: "SRVAutoRepair",
        category: "សេវាកម្មជួសជុលរថយន្ត",
        isAutoResponderEnabled: true,
        notificationSchedules: {
          notifyOnComment: true,
          weeklyEmailReport: true,
          quietHoursStart: "22:00",
          quietHoursEnd: "07:00"
        }
      }).returning();
      page = [newPage[0]];
    }

    // In an isolated user environment, a user only sees themselves or users they've invited.
    // If Admin, show all users. If not, just self.
    const roles = dbUser.role === "Admin" 
      ? await db.select().from(users).orderBy(desc(users.createdAt))
      : await db.select().from(users).where(eq(users.id, dbUser.id));
    
    res.json({
      pageSettings: page[0],
      userRoles: roles
    });
  } catch (err) {
    console.error("Settings DB fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

  app.post("/api/settings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      pageName, pageUsername, category, isAutoResponderEnabled, notificationSchedules, reportLogo,
      backupSchedule, isTelegramBackupEnabled, telegramBotToken, telegramChatId, backupTime
    } = req.body;
    const dbUser = await getOrCreateDbUser(req.user!);

    const updateData: Record<string, any> = {};
    if (pageName !== undefined) updateData.pageName = pageName;
    if (pageUsername !== undefined) updateData.pageUsername = pageUsername;
    if (category !== undefined) updateData.category = category;
    if (isAutoResponderEnabled !== undefined) updateData.isAutoResponderEnabled = isAutoResponderEnabled;
    if (reportLogo !== undefined) updateData.reportLogo = reportLogo;
    if (notificationSchedules !== undefined) updateData.notificationSchedules = notificationSchedules;
    if (backupSchedule !== undefined) updateData.backupSchedule = backupSchedule;
    if (isTelegramBackupEnabled !== undefined) updateData.isTelegramBackupEnabled = isTelegramBackupEnabled;
    if (telegramBotToken !== undefined) updateData.telegramBotToken = telegramBotToken;
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
    if (backupTime !== undefined) updateData.backupTime = backupTime;

    const result = await db.update(pageSettings)
      .set(updateData)
      .where(eq(pageSettings.userId, dbUser.id)) // Primary user
      .returning();
    
    res.json({ success: true, pageSettings: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// User Roles Management Action
import { adminAuth } from "./src/lib/firebase-admin.ts";

function checkIsSuperAdmin(user: any): boolean {
  if (!user) return false;
  const role = user.role || "";
  const name = (user.name || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  return (
    role === "Super Admin" ||
    name.includes("super admin") ||
    email === "admin@app.local" ||
    email === "seanglyad@gmail.com"
  );
}

function checkIsAdmin(user: any): boolean {
  if (!user) return false;
  if (checkIsSuperAdmin(user)) return true;
  if (user.role === "Admin") {
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions.includes("users:edit_role") || user.permissions.includes("users:create") || user.permissions.includes("manage_settings");
    }
    return true;
  }
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes("users:edit_role") || perms.includes("users:create");
}

app.post("/api/settings/roles", requireAuth, async (req: AuthRequest, res) => {
  try {
    const requestingUser = await getOrCreateDbUser(req.user!);
    if (!checkIsAdmin(requestingUser)) {
      return res.status(403).json({ error: "Only Administrators can create new user accounts!" });
    }

    const { name, email, role, permissions, password, department } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    const isSuperAdmin = checkIsSuperAdmin({ role, name, email });

    const defaultFullPerms = [
      "publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics",
      "workplan:view", "workplan:create", "workplan:edit", "workplan:delete", "workplan:export",
      "users:view", "users:create", "users:edit_role", "users:delete",
      "backup:create", "backup:restore", "backup:delete",
      "pages:manage", "comments:reply"
    ];

    let finalPermissions = permissions || (role === "Admin" ? defaultFullPerms : []);
    if (isSuperAdmin) {
      finalPermissions = Array.from(new Set([...finalPermissions, ...defaultFullPerms]));
    }

    let uid = "external_" + Date.now();

    if (password) {
      try {
        const fbUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        uid = fbUser.uid;
      } catch (fbErr: any) {
        console.warn("Firebase user creation failed, continuing with local DB only:", fbErr.message);
      }
    }

    const newUser = await db.insert(users).values({
      uid,
      name,
      email,
      passwordHash: password,
      role: role || "Editor",
      avatar: `https://images.unsplash.com/photo-${15000000000+Math.floor(Math.random()*999999999)}?auto=format&fit=crop&w=150&h=150&q=80`,
      permissions: finalPermissions,
      sex: req.body.sex,
      dob: req.body.dob,
      phoneNumber: req.body.phoneNumber,
      department: department || undefined
    }).returning();

    res.status(201).json(newUser[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create role" });
  }
});

app.put("/api/settings/roles/:id", requireAuth, async (req: any, res) => {
  try {
    const requestingUser = await getOrCreateDbUser(req.user!);
    const userId = parseInt(req.params.id);

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userResult.length) return res.status(404).json({ error: "User role not found" });
    const existingUser = userResult[0];

    const isEditingSelf = requestingUser.id === existingUser.id;
    const isReqAdmin = checkIsAdmin(requestingUser);
    const isReqSuperAdmin = checkIsSuperAdmin(requestingUser);
    const isTargetSuperAdmin = checkIsSuperAdmin(existingUser);

    if (!isEditingSelf && !isReqAdmin) {
      return res.status(403).json({ error: "Only Administrators can edit other user accounts!" });
    }

    if (isTargetSuperAdmin && !isReqSuperAdmin) {
      return res.status(403).json({ error: "Only Super Admin can edit Super Admin accounts!" });
    }

    const { name, email, role, permissions, sex, dob, phoneNumber, avatar, password, department } = req.body;

    if ((role !== undefined || permissions !== undefined) && !isReqAdmin) {
      return res.status(403).json({ error: "You do not have permission to modify roles or permissions!" });
    }

    if (password && !existingUser.uid.startsWith("external_")) {
      try {
        await adminAuth.updateUser(existingUser.uid, { password });
      } catch (err) {
        console.error("Firebase pwd update failed:", err);
      }
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && isReqAdmin) updateData.role = role;
    if (sex !== undefined) updateData.sex = sex;
    if (dob !== undefined) updateData.dob = dob;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (password !== undefined) updateData.passwordHash = password;
    if (department !== undefined) updateData.department = department;

    if (isReqAdmin && permissions !== undefined) {
      if (isTargetSuperAdmin) {
        const defaultFullPerms = [
          "publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics",
          "workplan:view", "workplan:create", "workplan:edit", "workplan:delete", "workplan:export",
          "users:view", "users:create", "users:edit_role", "users:delete",
          "backup:create", "backup:restore", "backup:delete",
          "pages:manage", "comments:reply"
        ];
        updateData.permissions = defaultFullPerms;
      } else {
        updateData.permissions = permissions;
      }
    }

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Failed to update role:", err);
    res.status(500).json({ error: "Failed to update role: " + err.message });
  }
});

app.delete("/api/settings/roles/:id", requireAuth, async (req: any, res) => {
  try {
    const requestingUser = await getOrCreateDbUser(req.user!);
    if (!checkIsAdmin(requestingUser)) {
      return res.status(403).json({ error: "Only Administrators can delete user accounts!" });
    }

    const userId = parseInt(req.params.id);
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userResult.length > 0) {
      const targetUser = userResult[0];
      const isSuperAdmin = checkIsSuperAdmin(targetUser);

      if (isSuperAdmin) {
        return res.status(403).json({ error: "Super Admin account cannot be deleted!" });
      }

      const uid = targetUser.uid;
      try {
        if (!uid.startsWith("external_") && !uid.includes("role_user")) {
          await adminAuth.deleteUser(uid);
        }
      } catch (err) {
        console.warn("Could not delete from firebase:", err);
      }
    }
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete role" });
  }
});

// 6. Auto-Reply Rules Routing
app.get("/api/rules", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const allRules = await db.select().from(autoReplyRules).where(eq(autoReplyRules.userId, dbUser.id));
    res.json(allRules);
  } catch (err) {
    console.error("Rules DB fetch failed, using mocks:", err);
    res.json([]);
  }
});

app.post("/api/rules", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, triggerKeyword, condition, replyTemplate, isActive } = req.body;
    if (!triggerKeyword || !replyTemplate) return res.status(400).json({ error: "Trigger Keyword and Response Template are required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const newRule = {
      id: "rule_" + Date.now(),
      userId: dbUser.id,
      name: name || `ច្បាប់ឆ្លើយតប '${triggerKeyword}'`,
      triggerKeyword,
      condition: condition || "contains",
      replyTemplate,
      isActive: isActive !== false,
      timesTriggered: 0
    };

    const result = await db.insert(autoReplyRules).values(newRule).returning();
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create rule" });
  }
});

app.post("/api/rules/:id/toggle", requireAuth, async (req, res) => {
  try {
    const currentRule = await db.select().from(autoReplyRules).where(eq(autoReplyRules.id, req.params.id)).limit(1);
    if (!currentRule.length) return res.status(404).json({ error: "Rule not found" });

    const result = await db.update(autoReplyRules)
      .set({ isActive: !currentRule[0].isActive })
      .where(eq(autoReplyRules.id, req.params.id))
      .returning();
    
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle rule" });
  }
});

app.put("/api/rules/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.update(autoReplyRules)
      .set(req.body)
      .where(eq(autoReplyRules.id, req.params.id))
      .returning();
    
    if (!result.length) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true, rule: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update rule" });
  }
});

app.delete("/api/rules/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(autoReplyRules).where(eq(autoReplyRules.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete rule" });
  }
});

// 7. Core Alert Notifications Root Routing
app.get("/api/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const allNotifs = await db.select().from(notifications).where(eq(notifications.userId, dbUser.id)).orderBy(desc(notifications.createdAt));
    res.json(allNotifs);
  } catch (err) {
    console.error("Notifications DB fetch failed, using empty array:", err);
    res.json([]);
  }
});

app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await db.update(notifications).set({ isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Work Plan API Routes
app.get("/api/workplan", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const [rawItems, pages, platforms, months] = await Promise.all([
      db
        .select({
          id: workPlanItems.id,
          title: workPlanItems.title,
          subtitle: workPlanItems.subtitle,
          postType: workPlanItems.postType,
          contentType: workPlanItems.contentType,
          pageId: workPlanItems.pageId,
          platformId: workPlanItems.platformId,
          weekNumber: workPlanItems.weekNumber,
          dayOfWeek: workPlanItems.dayOfWeek,
          timeSlot: workPlanItems.timeSlot,
          status: workPlanItems.status,
          notes: workPlanItems.notes,
          month: workPlanItems.month,
          createdByName: users.name,
          createdByAvatar: users.avatar,
          createdByEmail: users.email,
        })
        .from(workPlanItems)
        .leftJoin(users, eq(workPlanItems.userId, users.id))
        .where(eq(workPlanItems.userId, dbUser.id)),
      db.select().from(workPlanPages).where(or(eq(workPlanPages.userId, dbUser.id), isNull(workPlanPages.userId))),
      db.select().from(workPlanPlatforms).where(or(eq(workPlanPlatforms.userId, dbUser.id), isNull(workPlanPlatforms.userId))),
      db.select().from(monthlyPlans).where(or(eq(monthlyPlans.userId, dbUser.id), isNull(monthlyPlans.userId)))
    ]);
    let finalRawItems = rawItems;

    // Auto-seed starter Work Plan items for new user profiles if they have 0 items
    if (finalRawItems.length === 0) {
      const defaultMonth = months[0]?.id || "2026-07";
      const starterSeed = [
        {
          id: "wp_item_init_1_" + dbUser.id + "_" + Date.now(),
          userId: dbUser.id,
          title: "រៀបចំផែនការមាតិកាវីដេអូប្រចាំសប្តាហ៍",
          subtitle: "រៀបចំទស្សនវិស័យមាតិកា និងគោលដៅប្រចាំខែ",
          postType: "REELS",
          contentType: "VIDEO",
          weekNumber: 1,
          dayOfWeek: "Monday",
          timeSlot: "09:00",
          status: "COMPLETED",
          notes: `ផែនការដំបូងសម្រាប់គណនី ${dbUser.name || dbUser.email}`,
          month: defaultMonth
        },
        {
          id: "wp_item_init_2_" + dbUser.id + "_" + Date.now(),
          userId: dbUser.id,
          title: "បង្ហោះវីដេអូផ្សព្វផ្សាយផលិតផល និងសេវាកម្ម",
          subtitle: "វីដេអូខ្លី 30 វិនាទី HD",
          postType: "POST",
          contentType: "CAROUSEL",
          weekNumber: 1,
          dayOfWeek: "Wednesday",
          timeSlot: "14:30",
          status: "IN_PROGRESS",
          notes: "ត្រៀមរៀបចំ Caption និង Hashtag",
          month: defaultMonth
        }
      ];
      await db.insert(workPlanItems).values(starterSeed);
      
      finalRawItems = await db
        .select({
          id: workPlanItems.id,
          title: workPlanItems.title,
          subtitle: workPlanItems.subtitle,
          postType: workPlanItems.postType,
          contentType: workPlanItems.contentType,
          pageId: workPlanItems.pageId,
          platformId: workPlanItems.platformId,
          weekNumber: workPlanItems.weekNumber,
          dayOfWeek: workPlanItems.dayOfWeek,
          timeSlot: workPlanItems.timeSlot,
          status: workPlanItems.status,
          notes: workPlanItems.notes,
          month: workPlanItems.month,
          createdByName: users.name,
          createdByAvatar: users.avatar,
          createdByEmail: users.email,
        })
        .from(workPlanItems)
        .leftJoin(users, eq(workPlanItems.userId, users.id))
        .where(eq(workPlanItems.userId, dbUser.id));
    }

    const items = finalRawItems.map(item => ({
      ...item,
      createdBy: item.createdByName
        ? { name: item.createdByName, avatar: item.createdByAvatar || "", email: item.createdByEmail || "" }
        : null,
    }));
    res.json({ items, pages, platforms, months });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch work plan data" });
  }
});


app.post("/api/workplan/items", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, subtitle, postType, contentType, pageId, platformId, weekNumber, dayOfWeek, timeSlot, status, notes, month } = req.body;
    
    console.log("POST /api/workplan/items payload:", req.body);
    
    if (!title) return res.status(400).json({ error: "Title is required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const newItem = {
      id: "wp_item_" + Date.now(),
      userId: dbUser.id,
      title,
      subtitle: subtitle || "",
      postType,
      contentType,
      pageId: pageId || null,
      platformId: platformId || null,
      weekNumber,
      dayOfWeek,
      timeSlot,
      status,
      notes,
      month: month || "2026-06"
    };

    const result = await db.insert(workPlanItems).values(newItem).returning();
    res.status(201).json(result[0]);
  } catch (err: any) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Failed to create work plan item: " + err.message });
  }
});

app.put("/api/workplan/items/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pageId === "") payload.pageId = null;
    if (payload.platformId === "") payload.platformId = null;

    const dbUser = await getOrCreateDbUser(req.user!);

    const result = await db.update(workPlanItems)
      .set(payload)
      .where(and(eq(workPlanItems.id, req.params.id), eq(workPlanItems.userId, dbUser.id)))
      .returning();
    
    if (!result.length) return res.status(404).json({ error: "Work plan item not found" });
    res.json({ success: true, item: result[0] });
  } catch (err: any) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update work plan item" });
  }
});

app.delete("/api/workplan/items/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    await db.delete(workPlanItems).where(and(eq(workPlanItems.id, req.params.id), eq(workPlanItems.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete work plan item" });
  }
});

// Months plans routes
app.post("/api/workplan/months", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, name, nameKh, status, copyFrom } = req.body;
    if (!id || !name) return res.status(400).json({ error: "Month ID and Name are required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const existing = await db.select().from(monthlyPlans).where(and(eq(monthlyPlans.id, id), eq(monthlyPlans.userId, dbUser.id))).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "ផែនការសម្រាប់ខែនេះមានរួចរាល់ហើយ!" });
    }

    const newMonth = {
      id,
      userId: dbUser.id,
      name,
      nameKh: nameKh || name,
      status: status || "IN_PROGRESS",
      createdAt: new Date().toISOString()
    };

    const result = await db.insert(monthlyPlans).values(newMonth).returning();

    // Copy template items from original month if requested
    if (copyFrom) {
      const sourceItems = await db.select().from(workPlanItems).where(eq(workPlanItems.month, copyFrom));
      if (sourceItems.length > 0) {
        const newItems = sourceItems.map((i, idx) => ({
          ...i,
          id: "wp_item_copy_" + Date.now() + "_" + idx + "_" + Math.floor(Math.random() * 1000),
          status: "PLANNED",
          notes: i.notes ? `[ចម្លងពី ${copyFrom}] ` + i.notes : `[ចម្លងពី ${copyFrom}]`,
          month: id
        }));
        await db.insert(workPlanItems).values(newItems);
      }
    }

    res.status(201).json({ success: true, month: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to create month plan" });
  }
});

app.put("/api/workplan/months/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const result = await db.update(monthlyPlans)
      .set(req.body)
      .where(and(eq(monthlyPlans.id, req.params.id), eq(monthlyPlans.userId, dbUser.id)))
      .returning();
    
    if (!result.length) return res.status(404).json({ error: "Month plan not found" });
    res.json({ success: true, plan: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update month plan" });
  }
});

app.delete("/api/workplan/months/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    // Delete cascading items first based on user ownership
    await db.delete(workPlanItems).where(and(eq(workPlanItems.month, req.params.id), eq(workPlanItems.userId, dbUser.id)));
    await db.delete(monthlyPlans).where(and(eq(monthlyPlans.id, req.params.id), eq(monthlyPlans.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete month plan" });
  }
});

app.post("/api/workplan/pages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Page name is required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const result = await db.insert(workPlanPages).values({
      id: "page_" + Date.now(),
      userId: dbUser.id,
      name
    }).returning();

    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create page" });
  }
});

app.delete("/api/workplan/pages/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const result = await db.delete(workPlanPages).where(and(eq(workPlanPages.id, req.params.id), eq(workPlanPages.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete page" });
  }
});

app.put("/api/workplan/pages/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const result = await db.update(workPlanPages).set(req.body).where(and(eq(workPlanPages.id, req.params.id), eq(workPlanPages.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Page not found" });
    res.json({ success: true, page: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update page" });
  }
});

app.post("/api/workplan/platforms", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Platform name is required" });

    const dbUser = await getOrCreateDbUser(req.user!);

    const result = await db.insert(workPlanPlatforms).values({
      id: "platform_" + Date.now(),
      userId: dbUser.id,
      name
    }).returning();

    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create platform" });
  }
});

app.put("/api/workplan/platforms/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const result = await db.update(workPlanPlatforms).set(req.body).where(and(eq(workPlanPlatforms.id, req.params.id), eq(workPlanPlatforms.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Platform not found" });
    res.json({ success: true, platform: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update platform" });
  }
});

app.delete("/api/workplan/platforms/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const result = await db.delete(workPlanPlatforms).where(and(eq(workPlanPlatforms.id, req.params.id), eq(workPlanPlatforms.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete platform" });
  }
});


// Mock Simulation to produce live random activity
app.post("/api/simulate/activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);

    // Fetch user's posts from database
    let userPosts = await db.select().from(videoPosts).where(eq(videoPosts.userId, dbUser.id));

    // If no posts, seed one default post
    if (userPosts.length === 0) {
      const defaultPost = {
        id: "post_sim_" + Date.now(),
        userId: dbUser.id,
        title: "វីដេអូមេរៀនខ្លី៖ គន្លឹះដោះស្រាយបញ្ហាកូដ",
        description: "ការណែនាំខ្លីៗពីការសរសេរកូដឱ្យមានប្រសិទ្ធភាពខ្ពស់ និងរហ័សទ្វេដង។",
        status: "published",
        createdAt: new Date().toISOString()
      } as any;
      const result = await db.insert(videoPosts).values(defaultPost).returning();
      userPosts = [result[0] as any];
    }

    const randomPost = userPosts[Math.floor(Math.random() * userPosts.length)];

    const simulatedComments = [
      "សួស្តីប្អូន តើមានវគ្គសិក្សាកាត់តវីដេអូសម្រាប់អ្នកចាប់ផ្តើមដំបូងអត់?",
      "ចាប់អារម្មណ៍ខ្លាំងណាស់ តើវីដេអូនេះប្រើកាមេរ៉ាប្រភេទណាដែរ?",
      "ចង់សួរតម្លៃសេវាហ្វេសប៊ុកផុស និងស្កេតស៊ុលវីដេអូមួយខែប៉ុន្មាន?",
      "Like និង Follow រួចរាល់ហើយបង! បង្កើតមាតិកាល្អៗបន្ថែមទៀតណា!",
      "តើអាចជួយពន្យល់ពីវិធីដោះស្រាយបញ្ហា Reached Limit ផុសវីដេអូបានទេ?"
    ];
    const simulatedAuthors = [
      { name: "ចាន់ សំភ័ស្ស", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
      { name: "គឹម លាង", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
      { name: "ផាន់ណិត សេង", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }
    ];

    const randomText = simulatedComments[Math.floor(Math.random() * simulatedComments.length)];
    const randomAuthor = simulatedAuthors[Math.floor(Math.random() * simulatedAuthors.length)];

    const newComment = {
      id: "comment_" + Date.now(),
      postId: randomPost.id,
      postTitle: randomPost.title,
      authorName: randomAuthor.name,
      authorAvatar: randomAuthor.avatar,
      text: randomText,
      timestamp: new Date().toISOString(),
      isReplied: false,
      isAutoReplied: false
    } as any;

    // Insert comment in DB
    const insertedComment = await db.insert(comments).values(newComment).returning();

    // Trigger rule check asynchronously
    await handleAutoResponseTrigger(insertedComment[0], dbUser.id);

    // Fetch the updated comment so that auto-reply fields are included if matched
    const updatedCommentList = await db.select().from(comments).where(eq(comments.id, newComment.id)).limit(1);
    const commentToSend = updatedCommentList[0] || insertedComment[0];

    // General Notification in DB
    await db.insert(notifications).values({
      id: "notif_comm_" + Date.now(),
      userId: dbUser.id,
      title: "មតិយោបល់ថ្មី (New Comment)",
      message: `អ្នកប្រើប្រាស់ '${commentToSend.authorName}' បានបញ្ចេញមតិ៖ "${commentToSend.text.substring(0, 40)}..."`,
      type: "comment",
      createdAt: new Date().toISOString(),
      isRead: false
    });

    res.json({ success: true, activity: commentToSend });
  } catch (err: any) {
    console.error("Activity simulation error:", err);
    res.status(500).json({ error: "Failed to simulate activity: " + err.message });
  }
});

// --- SYSTEM BACKUP & RESTORE ROUTING ---

function getBackupFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `backup_${year}-${month}-${day}_${hours}-${minutes}.sql`;
}

function formatTelegramCaption(filename: string, filePath: string, sizeInBytes?: number) {
  let dateStr = "";
  let timeStr = "";
  let sizeStr = "Unknown";

  try {
    let size = sizeInBytes;
    if (size === undefined) {
      const stats = fs.statSync(filePath);
      size = stats.size;
    }
    const sizeInMB = size / (1024 * 1024);
    sizeStr = `${sizeInMB.toFixed(1)} MB`;
    
    const match = filename.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})/);
    if (match) {
      dateStr = match[1];
      timeStr = `${match[2]}:${match[3]}`;
    } else {
      const now = new Date();
      dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  } catch (err: any) {
    console.error("[formatTelegramCaption] Error reading stats for " + filePath + ":", err.message);
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  return [
    `⬇️ System Backup`,
    ``,
    `🗄️ Database: local.db`,
    `📄 File: ${filename}`,
    `📅 Date: ${dateStr} ${timeStr}`,
    `📦 Size: ${sizeStr}`,
    ``,
    `Backup file saved on server. Download from Admin Panel → Backup & Restore.`
  ].join("\n");
}

// 1. Get List of backups
app.get("/api/backup/list", requireAuth, async (req, res) => {
  try {
    const backupsDir = getBackupsDir();
    const files = fs.readdirSync(backupsDir);
    const list = files
      .filter(f => f.startsWith("backup_") && f.endsWith(".sql"))
      .map(f => {
        const filePath = path.join(backupsDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime.toISOString()
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list backups" });
  }
});

// 2. Trigger backup now
app.post("/api/backup/now", requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user!);
    const page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);
    
    const backupsDir = getBackupsDir();

    const filename = getBackupFilename();
    const destPath = path.join(backupsDir, filename);
    
    // Copy active database
    fs.copyFileSync("local.db", destPath);
    
    let telegramSent = false;
    let telegramError = null;

    if (page.length && page[0].isTelegramBackupEnabled && page[0].telegramBotToken && page[0].telegramChatId) {
      try {
        const token = page[0].telegramBotToken;
        const chatId = page[0].telegramChatId;
        
        const fileBuffer = fs.readFileSync(destPath);
        const fileBlob = new Blob([fileBuffer], { type: "application/x-sqlite3" });
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("document", fileBlob, filename);
        formData.append("caption", formatTelegramCaption(filename, destPath, fileBuffer.length));

        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
          method: "POST",
          body: formData
        });
        const tgData = await telegramRes.json();
        if (tgData.ok) {
          telegramSent = true;
        } else {
          telegramError = tgData.description || "Failed to send to Telegram";
        }
      } catch (tgErr: any) {
        console.error("Telegram backup failed:", tgErr);
        telegramError = tgErr.message;
      }
    }

    // Update last backup time
    if (page.length) {
      await db.update(pageSettings)
        .set({ lastBackupTime: new Date().toISOString() })
        .where(eq(pageSettings.id, page[0].id));
    }

    res.json({
      success: true,
      filename,
      telegramSent,
      telegramError
    });
  } catch (err: any) {
    console.error("Backup failed:", err);
    res.status(500).json({ error: err.message || "Failed to create backup" });
  }
});

// 3. Restore backup
app.post("/api/backup/restore", requireAuth, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "Filename is required" });

    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath) || !filename.startsWith("backup_") || !filename.endsWith(".sql")) {
      return res.status(400).json({ error: "Invalid backup file" });
    }

    fs.copyFileSync(filePath, getDbPath());
    res.json({ success: true, message: "Database restored successfully" });
    setTimeout(() => {
      console.log("[Backup Restore] Restarting server to refresh database handles...");
      process.exit(0);
    }, 1000);
  } catch (err: any) {
    console.error("Restore failed:", err);
    res.status(500).json({ error: err.message || "Failed to restore backup" });
  }
});

// 4. Upload & Restore backup
app.post("/api/backup/upload-restore", requireAuth, async (req, res) => {
  try {
    const { fileData, filename } = req.body;
    if (!fileData) return res.status(400).json({ error: "File data is required" });

    const buffer = Buffer.from(fileData, 'base64');
    const backupsDir = getBackupsDir();
    
    const safeFilename = filename || `backup_uploaded_${Date.now()}.sql`;
    const backupPath = path.join(backupsDir, safeFilename);
    fs.writeFileSync(backupPath, buffer);

    fs.copyFileSync(backupPath, getDbPath());
    res.json({ success: true, message: "Database restored from uploaded file successfully" });
    setTimeout(() => {
      console.log("[Backup Restore] Restarting server to refresh database handles...");
      process.exit(0);
    }, 1000);
  } catch (err: any) {
    console.error("Upload restore failed:", err);
    res.status(500).json({ error: err.message || "Failed to restore from uploaded file" });
  }
});

// 4.5. Send specific backup file to Telegram
app.post("/api/backup/:filename/telegram", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { filename } = req.params;
    const dbUser = await getOrCreateDbUser(req.user!);
    const page = await db.select().from(pageSettings).where(eq(pageSettings.userId, dbUser.id)).limit(1);

    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath) || !filename.startsWith("backup_") || !filename.endsWith(".sql")) {
      return res.status(400).json({ error: "Invalid backup file" });
    }

    if (!page.length || !page[0].telegramBotToken || !page[0].telegramChatId) {
      return res.status(400).json({ error: "Telegram is not configured. Please save your Telegram settings first." });
    }

    const token = page[0].telegramBotToken;
    const chatId = page[0].telegramChatId;
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "application/x-sqlite3" });
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("document", fileBlob, filename);
    formData.append("caption", formatTelegramCaption(filename, filePath, fileBuffer.length));

    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData
    });
    const tgData = await telegramRes.json();
    if (tgData.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: tgData.description || "Failed to send to Telegram" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send to Telegram" });
  }
});

// 5. Test Telegram bot settings
app.post("/api/backup/test-telegram", requireAuth, async (req, res) => {
  try {
    const { token, chatId } = req.body;
    if (!token || !chatId) return res.status(400).json({ error: "Bot token and Chat ID are required" });

    const testMsg = `🔔 *MetaStream Telegram Test Notification*\n\nYour Telegram configuration is active and working correctly!\nTimestamp: ${new Date().toLocaleString()}`;
    
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMsg,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: data.description || "Telegram Bot Error" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Connection failed" });
  }
});

// 6. Delete backup
app.delete("/api/backup/:filename", requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath) || !filename.startsWith("backup_") || (!filename.endsWith(".db") && !filename.endsWith(".sql"))) {
      return res.status(400).json({ error: "Invalid backup file" });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete backup file" });
  }
});

// 7. Download backup
app.get("/api/backup/download", requireAuth, async (req, res) => {
  try {
    const { file } = req.query;
    if (!file || typeof file !== "string") return res.status(400).send("File query param is required");

    const backupsDir = getBackupsDir();
    const filePath = path.join(backupsDir, file);

    if (!fs.existsSync(filePath) || !file.startsWith("backup_") || (!file.endsWith(".db") && !file.endsWith(".sql"))) {
      return res.status(400).send("Invalid backup file");
    }

    res.download(filePath, file);
  } catch (err: any) {
    res.status(500).send("Failed to download file");
  }
});

// 8. Automated Backup Scheduler Background Service
function startBackupScheduler() {
  console.log("[Backup Scheduler] Initializing automatic backup scheduler interval...");
  
  setInterval(async () => {
    try {
      const activeConfigs = await db.select().from(pageSettings);
      
      for (const config of activeConfigs) {
        const schedule = config.backupSchedule;
        if (!schedule || schedule === "disabled") continue;

        const lastBackup = config.lastBackupTime ? new Date(config.lastBackupTime) : null;
        const now = new Date();
        
        // Parse backup time (format HH:MM, default to 03:00)
        const [targetHour, targetMinute] = (config.backupTime || "03:00").split(":").map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const isPastTargetTime = (currentHour > targetHour) || (currentHour === targetHour && currentMinute >= targetMinute);
        
        let shouldBackup = false;
        if (isPastTargetTime) {
          if (!lastBackup) {
            shouldBackup = true;
          } else {
            const diffMs = now.getTime() - lastBackup.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (schedule === "daily") {
              const lastBackupDayStr = `${lastBackup.getFullYear()}-${lastBackup.getMonth()}-${lastBackup.getDate()}`;
              const nowDayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
              const alreadyBackedUpToday = (lastBackupDayStr === nowDayStr);
              if (!alreadyBackedUpToday) {
                shouldBackup = true;
              }
            } else if (schedule === "weekly" && diffHours >= 164) {
              shouldBackup = true;
            } else if (schedule === "monthly" && diffHours >= 24 * 28) {
              shouldBackup = true;
            }
          }
        }

        if (shouldBackup) {
          console.log(`[Backup Scheduler] Triggering automatic ${schedule} backup for page settings ID ${config.id}...`);
          
          const backupsDir = getBackupsDir();

          const filename = getBackupFilename();
          const destPath = path.join(backupsDir, filename);

          // Copy active database
          fs.copyFileSync("local.db", destPath);
          
          console.log(`[Backup Scheduler] Auto-backup file created: ${filename}`);

          if (config.isTelegramBackupEnabled && config.telegramBotToken && config.telegramChatId) {
            try {
              const fileBuffer = fs.readFileSync(destPath);
              const fileBlob = new Blob([fileBuffer], { type: "application/x-sqlite3" });
              const formData = new FormData();
              formData.append("chat_id", config.telegramChatId);
              formData.append("document", fileBlob, filename);
              formData.append("caption", formatTelegramCaption(filename, destPath, fileBuffer.length));

              await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendDocument`, {
                method: "POST",
                body: formData
              });
              console.log("[Backup Scheduler] Telegram auto-backup push completed.");
            } catch (tgErr) {
              console.error("[Backup Scheduler] Telegram push failed:", tgErr);
            }
          }

          await db.update(pageSettings)
            .set({ lastBackupTime: now.toISOString() })
            .where(eq(pageSettings.id, config.id));
        }
      }
    } catch (err) {
      console.error("[Backup Scheduler] Error executing auto-backup check:", err);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
}


// 8. Server-Side AI Metadata Generator via Gemini API
app.post("/api/gemini/generate-metadata", async (req, res) => {
  const { concept, category, languageTone } = req.body;
  if (!concept) {
    return res.status(400).json({ error: "Please enter a video topic or general concept for AI generation" });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    // Elegant simulated response in Khmer if API key is missing
    const simulatedResponse = {
      title: `គន្លឹះក្តៅៗ៖ របៀប${concept} ទទួលបានការគាំទ្រទ្វេដង`,
      description: `សួស្តីប្រិយមិត្តទាំងអស់គ្នា! ក្នុងវីដេអូនេះយើងនឹងនាំយកនូវវិធីសាស្ត្រលម្អិត និងជាក់ស្តែងបំផុតអំពីរបៀប [${concept}]។ \n\nគន្លឹះសំខាន់ៗដែលអ្នកនឹងយល់ដឹង៖ \n១. ការត្រៀមខ្លួនជាមុន\n២. យុទ្ធសាស្ត្រប្រតិបត្តិ\n៣. របៀបវាយតម្លៃលទ្ធផល\n\nកុំភ្លេចចុច Like, Follow និងចែករំលែកម្នាក់មួយដើម្បីទទួលបានចំណេះដឹងពីទំព័រយើងខ្ញុំបន្ថែមទៀត!`,
      tags: ["KhmerCreator", concept.replace(/\s+/g, ""), "DigitalSkill", "FacebookPost", "VideoCreator"],
      recommendedPostTime: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours later
      usingMock: true
    };
    return res.json(simulatedResponse);
  }

  try {
    const prompt = `You are an elite expert social media Facebook content growth hacker in Cambodia. Give me a highly engaging video Post metadata localized for Cambodia based on the user's video concept.
Video Concept: "${concept}"
Video Category/Niche: "${category || 'Technology/Business'}"
Tone of Language requested: "${languageTone || 'Professional and Inspiring'}"

You MUST output ONLY a valid JSON object matching this structure:
{
  "title": "A highly catchy video title in beautiful natural Khmer, optimized for high click-through rate with elegant hooks, max 80 characters.",
  "description": "Engaging, long-form post description in Khmer. Must contain clear visual emojis, structured bullet points of key takeaways from the video, a clear Khmer call to action asking users to Like and Follow the page (like: 'កុំភ្លេចចុច Like និង Follow ទំព័រយើងខ្ញុំដើម្បីទទួលបានវីដេអូចំណេះដឹងថ្មីៗ!'), and modern Facebook formatting.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "recommendedPostTime": "An ISO timestamp scheduled during high engagement hours in Cambodia (either around 11:30 AM or 6:30 PM Phnom Penh time) within tomorrow"
}

Provide ONLY the raw JSON block without markdown formatting or backticks around it.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedPostTime: { type: Type.STRING }
          },
          required: ["title", "description", "tags", "recommendedPostTime"]
        }
      }
    });

    const outputText = response.text || "{}";
    const data = JSON.parse(outputText.trim());
    res.json(data);
  } catch (err: any) {
    console.error("Gemini API Error: ", err);
    res.status(500).json({ error: "Gemini Service Failure", details: err.message });
  }
});

// 9. Server-Side AI Reply / Message response suggestions
app.post("/api/gemini/suggest-reply", async (req, res) => {
  const { commentText, authorName, tone } = req.body;
  if (!commentText) {
    return res.status(400).json({ error: "Comment text is required for AI response analysis" });
  }

  const aiClient = getGeminiClient();
  if (!aiClient) {
    // Beautiful default AI suggested fallback in Khmer
    let reply = `សួស្តីបាទបង ${authorName || ''}! អរគុណច្រើនសម្រាប់ការបញ្ចេញមតិយោបល់ និងគាំទ្រ។ ប្រសិនបើមានចម្ងល់បន្ថែមបងអាចសួរបានណា បាទ!`;
    if (tone === "promotional") {
      reply = `បាទសួស្តីបង ${authorName || ''}! សម្រាប់ព័ត៌មានលម្អិតបន្ថែមពីសេវាកម្មដ៏ពិសេសនេះ បងអាចទំនាក់ទំនងមកកាន់ប្រអប់សារឥឡូវនេះដើម្បីទទួលបានការបញ្ចុះតម្លៃពិសេសបាទ!`;
    } else if (tone === "technical") {
      reply = `បាទសួស្តីបង ${authorName || ''}! ចំពោះបញ្បាក់បច្ចេកទេសនេះ ក្រុមការងារនឹងផ្ញើលីងណែនាំការដោះស្រាយលម្អិតតាមរយៈសារឆាតភ្លាមៗបាទ សូមអរគុណបង!`;
    }
    return res.json({ reply, usingMock: true });
  }

  try {
    const prompt = `You are a friendly and polite customer support page manager in Cambodia. Write a clean, natural, elite, and high-conversion quick response in beautiful Khmer language to reply to this follower's comment:
Follower User Name: "${authorName || 'Follower'}"
Follower's Comment: "${commentText}"
Tone desired: "${tone || 'Friendly and appreciation'}"

Instructions:
- Address the user politely using 'បង' or 'អតិថិជនជាទីគោរព'.
- Match the requested tone (friendly, promotional, helpful, technical, or funny).
- Keep it brief, conversational, and helpful for Facebook community moderation.
- Return ONLY the clean final text response. No outer quotes, no explanatory texts, just the final Cambodian response.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    res.json({ reply: (response.text || "").trim() });
  } catch (err: any) {
    console.error("Gemini API Error: ", err);
    res.status(500).json({ error: err.message });
  }
});


async function bootstrap() {
  // Ensure DB schema migrations (add missing columns if any)
  const migrations = [
    `ALTER TABLE work_plan_pages ADD COLUMN is_protected INTEGER DEFAULT 0`,
    `ALTER TABLE work_plan_platforms ADD COLUMN is_protected INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    `ALTER TABLE users ADD COLUMN permissions TEXT`,
    `ALTER TABLE users ADD COLUMN sex TEXT`,
    `ALTER TABLE users ADD COLUMN dob TEXT`,
    `ALTER TABLE users ADD COLUMN phone_number TEXT`,
    `ALTER TABLE users ADD COLUMN department TEXT`,
    `ALTER TABLE monthly_plans ADD COLUMN name_kh TEXT`,
    `ALTER TABLE monthly_plans ADD COLUMN user_id INTEGER`,
    `ALTER TABLE work_plan_pages ADD COLUMN user_id INTEGER`,
    `ALTER TABLE work_plan_platforms ADD COLUMN user_id INTEGER`
  ];
  for (const stmt of migrations) {
    try {
      await db.run(sql.raw(stmt));
    } catch (e) {}
  }

  // Auto-init schema tables if missing
  try {
    await initDbSchema();
  } catch (err) {
    console.warn("initDbSchema warning:", err);
  }

  // Seed database with mock data if empty
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Database seeding failed, proceeding with mock data if available:", err);
  }

  // Create default Super Admin
  try {
    const adminEmail = "admin@app.local"; 
    const adminPassword = "Seang@#168#@";
    let adminUid = "local_admin_123"; // default fallback
    try {
      try {
        const userRecord = await adminAuth.getUserByEmail(adminEmail);
        adminUid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "Super Admin",
        });
        adminUid = newUser.uid;
        console.log("Created Firebase super admin account with email", adminEmail);
      }
    } catch (firebaseErr: any) {
      console.warn("Firebase Auth unavailable, using fallback UID for admin account:", adminUid);
    }
    
    // Ensure in DB
    const dbAdmin = await db.select().from(users).where(or(eq(users.uid, adminUid), eq(users.email, adminEmail))).limit(1);
    if (dbAdmin.length === 0) {
      await db.insert(users).values({
        uid: adminUid,
        email: adminEmail,
        name: "Super Admin",
        role: "Admin",
        passwordHash: adminPassword,
        permissions: ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"]
      });
    } else {
      await db.update(users).set({ passwordHash: adminPassword, uid: adminUid }).where(eq(users.id, dbAdmin[0].id));
    }
  } catch (error) {
    console.error("Failed setting up default Super Admin user:", error);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const isPkgPath = Boolean((process as any).pkg);
    const baseAppPath = isPkgPath ? path.dirname(process.execPath) : process.cwd();
    const snapshotDistPath = path.resolve(__dirname, "../dist");
    const snapshotDistPathSelf = path.resolve(__dirname, "dist");
    const localDistPath = path.resolve(baseAppPath, "dist");
    
    let distPath = localDistPath;
    if (fs.existsSync(snapshotDistPath)) {
      distPath = snapshotDistPath;
    } else if (fs.existsSync(snapshotDistPathSelf)) {
      distPath = snapshotDistPathSelf;
    }
    console.log(`[MetaStream Backend] Serving static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start automated backup scheduler background loop
  startBackupScheduler();

  let activePort = PORT;

  async function startServer(requestedPort: number) {
    const maxRetries = 50;
    let port = requestedPort;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        await new Promise<void>((resolve, reject) => {
          const server = app.listen(port, "0.0.0.0", () => {
            activePort = port;
            console.log(`[MetaStream Backend] Server running at http://0.0.0.0:${port}`);
            resolve();
          });
          server.on("error", reject);
        });

        const finalUrl = `http://localhost:${port}`;
        process.env.APP_URL = finalUrl;
        console.log(`[MetaStream Backend] Open your browser at ${finalUrl}`);

        try {
          if (process.platform === "win32") {
            exec(`start "" "${finalUrl}"`, (err: any) => {
              if (err) {
                exec(`explorer "${finalUrl}"`, (err2: any) => {
                  if (err2) {
                    const edgePaths = [
                      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
                    ];
                    for (const ep of edgePaths) {
                      if (fs.existsSync(ep)) {
                        exec(`"${ep}" "${finalUrl}"`);
                        break;
                      }
                    }
                  }
                });
              }
            });
          } else if (process.platform === "darwin") {
            exec(`open "${finalUrl}"`);
          } else {
            exec(`xdg-open "${finalUrl}"`);
          }
        } catch (err) {
          console.error("Failed to open browser:", err);
        }
        return;
      } catch (err: any) {
        if (err?.code === "EADDRINUSE") {
          console.warn(`[MetaStream Backend] Port ${port} is in use by another application. Trying next port ${port + 1}...`);
          port += 1;
          continue;
        }
        throw err;
      }
    }
  }

  await startServer(PORT);
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap server: ", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
