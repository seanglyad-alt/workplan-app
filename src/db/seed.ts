import { db } from "./index.ts";
import { 
  users, videoPosts, comments, autoReplyRules, pageSettings, 
  workPlanPages, workPlanPlatforms, workPlanItems, monthlyPlans, notifications 
} from "./schema.ts";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Checking if database needs seeding...");
  
  const userCount = await db.select().from(users);
  if (userCount.length > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Seeding database with initial mock data...");

  // 1. Seed Users (Note: These would normally come from Firebase Auth, but we seed them for consistency)
  const seededUsers = await db.insert(users).values([
    { uid: "role_user_1", name: "សេងលី អាដ", email: "seanglyad@gmail.com", role: "Admin", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80", permissions: ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"], department: "Operations" },
    { uid: "role_user_2", name: "លីដា សុខ", email: "lida.sokh@fbmanager.kh", role: "Editor", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", permissions: ["publish_posts", "view_analytics"], department: "Operations" },
    { uid: "role_user_3", name: "វិបុល ហូរ", email: "vibol.hor@fbmanager.kh", role: "Moderator", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", permissions: ["auto_replies", "delete_content"], department: "Operations" }
  ]).returning();

  const primaryUser = seededUsers[0];

  // 2. Seed Posts
  await db.insert(videoPosts).values([
    {
      id: "carousel_1",
      userId: primaryUser.id,
      title: "ស្រឡាញ់បច្ចេកវិទ្យា និងអាជីវកម្ម? ទស្សនាវីដេអូខ្លីទាំង៣ នេះភ្លាម!",
      description: "ចំណេះដឹងថ្មីៗ ដើម្បីជោគជ័យក្នុងអាជីវកម្មឌីជីថល ឆ្នាំ២០២៦! អូសទៅឆ្វេង (swipe left) ដើម្បីមើលវីដេអូនីមួយៗ និងចុចមើលព័ត៌មានបន្ថែម!",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: ["DigitalSkill", "BusinessCarousel", "TechKhmer"],
      status: "scheduled",
      scheduledTime: new Date(Date.now() + 3600000 * 5).toISOString(),
      likesCount: 540,
      commentsCount: 16,
      sharesCount: 78,
      viewsCount: 3400,
      thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId: "rule_1",
      category: "Video Carousel / ផ្សព្វផ្សាយ",
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
      userId: primaryUser.id,
      title: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
      description: "ចែករំលែកគន្លឹះសំខាន់ៗទាំង៥ ដើម្បីជួយឱ្យវីដេអូរបស់អ្នកទទួលបានការចាប់អារម្មណ៍ខ្ពស់នៅលើបណ្តាញសង្គម Facebook។ កុំភ្លេចចុច Like និង Follow ម្នាក់មួយផងណា!",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: ["FacebookContent", "VideoMarketing", "KhmerCreator", "CreatorGuide"],
      status: "published",
      scheduledTime: new Date(Date.now() - 3600000 * 24).toISOString(),
      likesCount: 1240,
      commentsCount: 24,
      sharesCount: 145,
      viewsCount: 18500,
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId: "rule_1",
      category: "ការអប់រំ / ចែករំលែកចំណេះដឹង"
    }
  ]);

  // 3. Seed Comments
  await db.insert(comments).values([
    {
      id: "comment_1",
      postId: "post_1",
      postTitle: "របៀបបង្កើតមាតិកាវីដេអូទាក់ទាញខ្លាំងសម្រាប់ឆ្នាំ២០២៦",
      authorName: "សុខ ជា",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      text: "តើប្អូនអាចប្រាប់បន្ថែមពីកម្មវិធីកាត់តវីដេអូដែលល្អសម្រាប់ទូរស័ព្ទដៃបានទេ?",
      timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      isReplied: true,
      replyText: "បាទបង! សម្រាប់ទូរស័ព្ទដៃបងអាចប្រើ CapCut ឬ VN Video Editor បាទ ព្រោះវាឥតគិតថ្លៃ និងងាយស្រួលប្រើខ្លាំងមែនទែន!",
      isAutoReplied: false
    }
  ]);

  // 4. Seed Rules
  await db.insert(autoReplyRules).values([
    {
      id: "rule_1",
      userId: primaryUser.id,
      name: "ស្វាគមន៍អតិថិជន / សួស្តី",
      triggerKeyword: "សួស្តី",
      condition: "contains",
      replyTemplate: "សួស្តីបាទ! អរគុណសម្រាប់ការទាក់ទងមកកាន់ទំព័ររបស់យើងខ្ញុំ។ តើយើងខ្ញុំអាចជួយអ្វីដល់បងបានខ្លះបាទ?",
      isActive: true,
      timesTriggered: 12
    }
  ]);

  // 5. Seed Work Plan Data
  await db.insert(workPlanPlatforms).values([
    { id: "platform_1", name: "Facebook" },
    { id: "platform_2", name: "Instagram" },
    { id: "platform_3", name: "YouTube" },
    { id: "platform_4", name: "TikTok" }
  ]);

  await db.insert(monthlyPlans).values([
    { id: "2026-06", name: "June 2026", nameKh: "មិថុនា ២០២៦", status: "COMPLETED" },
    { id: "2026-07", name: "July 2026", nameKh: "កក្កដា ២០២៦", status: "IN_PROGRESS" }
  ]);

  // 6. Seed Page Settings
  await db.insert(pageSettings).values({
    userId: primaryUser.id,
    pageId: "fb_page_2026",
    pageName: "ចំណេះដឹងបច្ចេកវិទ្យា & ឌីជីថល",
    pageUsername: "@digitaltechkh",
    category: "បច្ចេកវិទ្យា និងអាជីវកម្ម",
    pageAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    followersCount: 54200,
    likesCount: 41200,
    isAutoResponderEnabled: true,
    notificationSchedules: {
      notifyOnComment: true,
      notifyOnReply: true,
      notifyOnPostPublished: true,
      notifyOnFailure: true,
      weeklyEmailReport: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00"
    }
  });

  console.log("Seeding completed successfully.");
}
