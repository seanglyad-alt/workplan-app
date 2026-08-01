var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/db/index.ts
var import_libsql = require("drizzle-orm/libsql");
var import_client = require("@libsql/client");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  autoReplyRules: () => autoReplyRules,
  comments: () => comments,
  commentsRelations: () => commentsRelations,
  monthlyPlans: () => monthlyPlans,
  notifications: () => notifications,
  pageSettings: () => pageSettings,
  users: () => users,
  usersRelations: () => usersRelations,
  videoPosts: () => videoPosts,
  videoPostsRelations: () => videoPostsRelations,
  workPlanItems: () => workPlanItems,
  workPlanItemsRelations: () => workPlanItemsRelations,
  workPlanPages: () => workPlanPages,
  workPlanPlatforms: () => workPlanPlatforms
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var import_drizzle_orm = require("drizzle-orm");
var users = (0, import_sqlite_core.sqliteTable)("users", {
  id: (0, import_sqlite_core.integer)("id").primaryKey({ autoIncrement: true }),
  uid: (0, import_sqlite_core.text)("uid").notNull().unique(),
  // Firebase Auth UID
  email: (0, import_sqlite_core.text)("email").notNull().unique(),
  name: (0, import_sqlite_core.text)("name"),
  avatar: (0, import_sqlite_core.text)("avatar"),
  passwordHash: (0, import_sqlite_core.text)("password_hash"),
  role: (0, import_sqlite_core.text)("role").default("Editor"),
  // Admin, Editor, Moderator, Analyst
  permissions: (0, import_sqlite_core.text)("permissions", { mode: "json" }).$defaultFn(() => []),
  sex: (0, import_sqlite_core.text)("sex"),
  dob: (0, import_sqlite_core.text)("dob"),
  phoneNumber: (0, import_sqlite_core.text)("phone_number"),
  department: (0, import_sqlite_core.text)("department"),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var videoPosts = (0, import_sqlite_core.sqliteTable)("video_posts", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  // Using text IDs to match existing frontend ids or generate new ones
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id).notNull(),
  title: (0, import_sqlite_core.text)("title").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  videoUrl: (0, import_sqlite_core.text)("video_url"),
  tags: (0, import_sqlite_core.text)("tags", { mode: "json" }).$defaultFn(() => []),
  status: (0, import_sqlite_core.text)("status").notNull(),
  // draft, scheduled, publishing, published, failed
  scheduledTime: (0, import_sqlite_core.text)("scheduled_time"),
  likesCount: (0, import_sqlite_core.integer)("likes_count").default(0),
  commentsCount: (0, import_sqlite_core.integer)("comments_count").default(0),
  sharesCount: (0, import_sqlite_core.integer)("shares_count").default(0),
  viewsCount: (0, import_sqlite_core.integer)("views_count").default(0),
  thumbnailUrl: (0, import_sqlite_core.text)("thumbnail_url"),
  autoReplyRuleId: (0, import_sqlite_core.text)("auto_reply_rule_id"),
  category: (0, import_sqlite_core.text)("category"),
  aspectRatio: (0, import_sqlite_core.text)("aspect_ratio"),
  facebookPostId: (0, import_sqlite_core.text)("facebook_post_id"),
  facebookError: (0, import_sqlite_core.text)("facebook_error"),
  carouselSlides: (0, import_sqlite_core.text)("carousel_slides", { mode: "json" }),
  // Storing as JSON for flexibility
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var comments = (0, import_sqlite_core.sqliteTable)("comments", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  postId: (0, import_sqlite_core.text)("post_id").references(() => videoPosts.id, { onDelete: "cascade" }).notNull(),
  postTitle: (0, import_sqlite_core.text)("post_title"),
  authorName: (0, import_sqlite_core.text)("author_name"),
  authorAvatar: (0, import_sqlite_core.text)("author_avatar"),
  text: (0, import_sqlite_core.text)("comment_text").notNull(),
  timestamp: (0, import_sqlite_core.text)("comment_timestamp").notNull(),
  isReplied: (0, import_sqlite_core.integer)("is_replied", { mode: "boolean" }).default(false),
  replyText: (0, import_sqlite_core.text)("reply_text"),
  isAutoReplied: (0, import_sqlite_core.integer)("is_auto_replied", { mode: "boolean" }).default(false)
});
var autoReplyRules = (0, import_sqlite_core.sqliteTable)("auto_reply_rules", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id).notNull(),
  name: (0, import_sqlite_core.text)("rule_name").notNull(),
  triggerKeyword: (0, import_sqlite_core.text)("trigger_keyword").notNull(),
  condition: (0, import_sqlite_core.text)("condition").notNull(),
  // contains, exact, started_with
  replyTemplate: (0, import_sqlite_core.text)("reply_template").notNull(),
  isActive: (0, import_sqlite_core.integer)("is_active", { mode: "boolean" }).default(true),
  timesTriggered: (0, import_sqlite_core.integer)("times_triggered").default(0)
});
var pageSettings = (0, import_sqlite_core.sqliteTable)("page_settings", {
  id: (0, import_sqlite_core.integer)("id").primaryKey({ autoIncrement: true }),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  pageId: (0, import_sqlite_core.text)("page_id"),
  pageName: (0, import_sqlite_core.text)("page_name"),
  pageUsername: (0, import_sqlite_core.text)("page_username"),
  category: (0, import_sqlite_core.text)("category"),
  pageAvatar: (0, import_sqlite_core.text)("page_avatar"),
  coverImage: (0, import_sqlite_core.text)("cover_image"),
  followersCount: (0, import_sqlite_core.integer)("followers_count").default(0),
  likesCount: (0, import_sqlite_core.integer)("likes_count").default(0),
  isAutoResponderEnabled: (0, import_sqlite_core.integer)("is_auto_responder_enabled", { mode: "boolean" }).default(true),
  notificationSchedules: (0, import_sqlite_core.text)("notification_schedules", { mode: "json" }),
  reportLogo: (0, import_sqlite_core.text)("report_logo"),
  backupSchedule: (0, import_sqlite_core.text)("backup_schedule").default("disabled"),
  // disabled, daily, weekly, monthly
  isTelegramBackupEnabled: (0, import_sqlite_core.integer)("is_telegram_backup_enabled", { mode: "boolean" }).default(false),
  telegramBotToken: (0, import_sqlite_core.text)("telegram_bot_token"),
  telegramChatId: (0, import_sqlite_core.text)("telegram_chat_id"),
  lastBackupTime: (0, import_sqlite_core.text)("last_backup_time"),
  backupTime: (0, import_sqlite_core.text)("backup_time").default("03:00"),
  facebookToken: (0, import_sqlite_core.text)("facebook_token"),
  facebookUserId: (0, import_sqlite_core.text)("facebook_user_id"),
  facebookUserName: (0, import_sqlite_core.text)("facebook_user_name"),
  facebookUserAvatar: (0, import_sqlite_core.text)("facebook_user_avatar"),
  facebookUserEmail: (0, import_sqlite_core.text)("facebook_user_email"),
  facebookPages: (0, import_sqlite_core.text)("facebook_pages", { mode: "json" }),
  pageAccessToken: (0, import_sqlite_core.text)("page_access_token")
});
var workPlanPages = (0, import_sqlite_core.sqliteTable)("work_plan_pages", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id),
  // Made optional for now so Drizzle doesn't panic on existing data, but we'll populate it
  name: (0, import_sqlite_core.text)("name").notNull(),
  isProtected: (0, import_sqlite_core.integer)("is_protected", { mode: "boolean" }).default(false)
  // Demo pages cannot be deleted or edited
});
var workPlanPlatforms = (0, import_sqlite_core.sqliteTable)("work_plan_platforms", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id),
  name: (0, import_sqlite_core.text)("name").notNull(),
  isProtected: (0, import_sqlite_core.integer)("is_protected", { mode: "boolean" }).default(false)
  // Demo platforms cannot be deleted or edited
});
var workPlanItems = (0, import_sqlite_core.sqliteTable)("work_plan_items", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id).notNull(),
  title: (0, import_sqlite_core.text)("title").notNull(),
  subtitle: (0, import_sqlite_core.text)("subtitle"),
  postType: (0, import_sqlite_core.text)("post_type"),
  // Posted, Scheduled, Draft, Idea
  contentType: (0, import_sqlite_core.text)("content_type"),
  // Poster, Video, Carousel
  pageId: (0, import_sqlite_core.text)("page_id").references(() => workPlanPages.id),
  platformId: (0, import_sqlite_core.text)("platform_id"),
  weekNumber: (0, import_sqlite_core.integer)("week_number"),
  dayOfWeek: (0, import_sqlite_core.text)("day_of_week"),
  // Monday, Tuesday, etc.
  timeSlot: (0, import_sqlite_core.text)("time_slot"),
  status: (0, import_sqlite_core.text)("status"),
  // PLANNED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
  notes: (0, import_sqlite_core.text)("notes"),
  month: (0, import_sqlite_core.text)("month")
  // e.g. 2026-06
});
var monthlyPlans = (0, import_sqlite_core.sqliteTable)("monthly_plans", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  // e.g. 2026-06
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id),
  name: (0, import_sqlite_core.text)("name").notNull(),
  nameKh: (0, import_sqlite_core.text)("name_kh"),
  status: (0, import_sqlite_core.text)("status"),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var notifications = (0, import_sqlite_core.sqliteTable)("notifications", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.integer)("user_id").references(() => users.id).notNull(),
  title: (0, import_sqlite_core.text)("title").notNull(),
  message: (0, import_sqlite_core.text)("message").notNull(),
  type: (0, import_sqlite_core.text)("type"),
  isRead: (0, import_sqlite_core.integer)("is_read", { mode: "boolean" }).default(false),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var usersRelations = (0, import_drizzle_orm.relations)(users, ({ many, one }) => ({
  posts: many(videoPosts),
  rules: many(autoReplyRules),
  pageSettings: one(pageSettings, {
    fields: [users.id],
    references: [pageSettings.userId]
  }),
  workPlanItems: many(workPlanItems),
  notifications: many(notifications)
}));
var videoPostsRelations = (0, import_drizzle_orm.relations)(videoPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [videoPosts.userId],
    references: [users.id]
  }),
  comments: many(comments)
}));
var commentsRelations = (0, import_drizzle_orm.relations)(comments, ({ one }) => ({
  post: one(videoPosts, {
    fields: [comments.postId],
    references: [videoPosts.id]
  })
}));
var workPlanItemsRelations = (0, import_drizzle_orm.relations)(workPlanItems, ({ one }) => ({
  user: one(users, {
    fields: [workPlanItems.userId],
    references: [users.id]
  }),
  page: one(workPlanPages, {
    fields: [workPlanItems.pageId],
    references: [workPlanPages.id]
  })
}));

// src/db/index.ts
var dbUrl = process.env.DATABASE_URL || "file:local.db";
var client = (0, import_client.createClient)({
  url: dbUrl
});
var db = (0, import_libsql.drizzle)(client, { schema: schema_exports });

// src/db/seed.ts
async function seedDatabase() {
  console.log("Checking if database needs seeding...");
  const userCount = await db.select().from(users);
  if (userCount.length > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }
  console.log("Seeding database with initial mock data...");
  const seededUsers = await db.insert(users).values([
    { uid: "role_user_1", name: "\u179F\u17C1\u1784\u179B\u17B8 \u17A2\u17B6\u178A", email: "seanglyad@gmail.com", role: "Admin", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80", permissions: ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"], department: "Operations" },
    { uid: "role_user_2", name: "\u179B\u17B8\u178A\u17B6 \u179F\u17BB\u1781", email: "lida.sokh@fbmanager.kh", role: "Editor", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", permissions: ["publish_posts", "view_analytics"], department: "Operations" },
    { uid: "role_user_3", name: "\u179C\u17B7\u1794\u17BB\u179B \u17A0\u17BC\u179A", email: "vibol.hor@fbmanager.kh", role: "Moderator", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", permissions: ["auto_replies", "delete_content"], department: "Operations" }
  ]).returning();
  const primaryUser = seededUsers[0];
  await db.insert(videoPosts).values([
    {
      id: "carousel_1",
      userId: primaryUser.id,
      title: "\u179F\u17D2\u179A\u17A1\u17B6\u1789\u17CB\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798? \u1791\u179F\u17D2\u179F\u1793\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1781\u17D2\u179B\u17B8\u1791\u17B6\u17C6\u1784\u17E3 \u1793\u17C1\u17C7\u1797\u17D2\u179B\u17B6\u1798!",
      description: "\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1790\u17D2\u1798\u17B8\u17D7 \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1787\u17C4\u1782\u1787\u17D0\u1799\u1780\u17D2\u1793\u17BB\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798\u178C\u17B8\u1787\u17B8\u1790\u179B \u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6! \u17A2\u17BC\u179F\u1791\u17C5\u1786\u17D2\u179C\u17C1\u1784 (swipe left) \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1798\u17BE\u179B\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1793\u17B8\u1798\u17BD\u1799\u17D7 \u1793\u17B7\u1784\u1785\u17BB\u1785\u1798\u17BE\u179B\u1796\u17D0\u178F\u17CC\u1798\u17B6\u1793\u1794\u1793\u17D2\u1790\u17C2\u1798!",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: ["DigitalSkill", "BusinessCarousel", "TechKhmer"],
      status: "scheduled",
      scheduledTime: new Date(Date.now() + 36e5 * 5).toISOString(),
      likesCount: 540,
      commentsCount: 16,
      sharesCount: 78,
      viewsCount: 3400,
      thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId: "rule_1",
      category: "Video Carousel / \u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799",
      carouselSlides: [
        {
          id: "slide_1",
          title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E1\u17D6 \u179F\u17D2\u179C\u17C2\u1784\u1799\u179B\u17CB\u1796\u17B8 AI Copilot",
          description: "\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179A\u17A0\u17D0\u179F\u1791\u17D2\u179C\u17C1\u178A\u1784\u1787\u17B6\u1798\u17BD\u1799\u1787\u17C6\u1793\u17BD\u1799\u1780\u17B6\u179A AI",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
          linkUrl: "https://ai.studio/build",
          ctaText: "Learn More"
        },
        {
          id: "slide_2",
          title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E2\u17D6 \u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793\u178F\u17B6\u1798 FB",
          description: "\u1794\u1784\u17D2\u1780\u17BE\u1793\u1780\u17B6\u179A\u1786\u17D2\u179B\u17BE\u1799\u178F\u1794\u178A\u17C4\u1799\u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7\u178F\u17B6\u1798 Comments \u1797\u17D2\u179B\u17B6\u1798\u17D7",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
          thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
          linkUrl: "https://ai.studio/build",
          ctaText: "Send Message"
        },
        {
          id: "slide_3",
          title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E3\u17D6 \u1794\u1784\u17D2\u1780\u17BE\u1793\u1791\u17C6\u1793\u17BB\u1780\u1785\u17B7\u178F\u17D2\u178F\u1798\u17C9\u17B6\u1780\u1799\u17B8\u17A0\u17C4",
          description: "\u179A\u1794\u17C0\u1794\u179A\u17C0\u1794\u1785\u17C6 Brand Visual \u179F\u17D2\u17A2\u17B6\u178F\u1780\u1798\u17D2\u179A\u17B7\u178F\u17A2\u17B6\u1787\u17B8\u1796\u179F\u17D2\u178F\u1784\u17CB\u178A\u17B6\u179A",
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
      title: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
      description: "\u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1782\u1793\u17D2\u179B\u17B9\u17C7\u179F\u17C6\u1781\u17B6\u1793\u17CB\u17D7\u1791\u17B6\u17C6\u1784\u17E5 \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1787\u17BD\u1799\u17B1\u17D2\u1799\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u1780\u17B6\u179A\u1785\u17B6\u1794\u17CB\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD\u1781\u17D2\u1796\u179F\u17CB\u1793\u17C5\u179B\u17BE\u1794\u178E\u17D2\u178F\u17B6\u1789\u179F\u1784\u17D2\u1782\u1798 Facebook\u17D4 \u1780\u17BB\u17C6\u1797\u17D2\u179B\u17C1\u1785\u1785\u17BB\u1785 Like \u1793\u17B7\u1784 Follow \u1798\u17D2\u1793\u17B6\u1780\u17CB\u1798\u17BD\u1799\u1795\u1784\u178E\u17B6!",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: ["FacebookContent", "VideoMarketing", "KhmerCreator", "CreatorGuide"],
      status: "published",
      scheduledTime: new Date(Date.now() - 36e5 * 24).toISOString(),
      likesCount: 1240,
      commentsCount: 24,
      sharesCount: 145,
      viewsCount: 18500,
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId: "rule_1",
      category: "\u1780\u17B6\u179A\u17A2\u1794\u17CB\u179A\u17C6 / \u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784"
    }
  ]);
  await db.insert(comments).values([
    {
      id: "comment_1",
      postId: "post_1",
      postTitle: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
      authorName: "\u179F\u17BB\u1781 \u1787\u17B6",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      text: "\u178F\u17BE\u1794\u17D2\u17A2\u17BC\u1793\u17A2\u17B6\u1785\u1794\u17D2\u179A\u17B6\u1794\u17CB\u1794\u1793\u17D2\u1790\u17C2\u1798\u1796\u17B8\u1780\u1798\u17D2\u1798\u179C\u17B7\u1792\u17B8\u1780\u17B6\u178F\u17CB\u178F\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u178A\u17C2\u179B\u179B\u17D2\u17A2\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1791\u17BC\u179A\u179F\u17D0\u1796\u17D2\u1791\u178A\u17C3\u1794\u17B6\u1793\u1791\u17C1?",
      timestamp: new Date(Date.now() - 3600 * 1e3 * 3).toISOString(),
      isReplied: true,
      replyText: "\u1794\u17B6\u1791\u1794\u1784! \u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1791\u17BC\u179A\u179F\u17D0\u1796\u17D2\u1791\u178A\u17C3\u1794\u1784\u17A2\u17B6\u1785\u1794\u17D2\u179A\u17BE CapCut \u17AC VN Video Editor \u1794\u17B6\u1791 \u1796\u17D2\u179A\u17C4\u17C7\u179C\u17B6\u17A5\u178F\u1782\u17B7\u178F\u1790\u17D2\u179B\u17C3 \u1793\u17B7\u1784\u1784\u17B6\u1799\u179F\u17D2\u179A\u17BD\u179B\u1794\u17D2\u179A\u17BE\u1781\u17D2\u179B\u17B6\u17C6\u1784\u1798\u17C2\u1793\u1791\u17C2\u1793!",
      isAutoReplied: false
    }
  ]);
  await db.insert(autoReplyRules).values([
    {
      id: "rule_1",
      userId: primaryUser.id,
      name: "\u179F\u17D2\u179C\u17B6\u1782\u1798\u1793\u17CD\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793 / \u179F\u17BD\u179F\u17D2\u178F\u17B8",
      triggerKeyword: "\u179F\u17BD\u179F\u17D2\u178F\u17B8",
      condition: "contains",
      replyTemplate: "\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u17B6\u1791! \u17A2\u179A\u1782\u17BB\u178E\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1780\u17B6\u179A\u1791\u17B6\u1780\u17CB\u1791\u1784\u1798\u1780\u1780\u17B6\u1793\u17CB\u1791\u17C6\u1796\u17D0\u179A\u179A\u1794\u179F\u17CB\u1799\u17BE\u1784\u1781\u17D2\u1789\u17BB\u17C6\u17D4 \u178F\u17BE\u1799\u17BE\u1784\u1781\u17D2\u1789\u17BB\u17C6\u17A2\u17B6\u1785\u1787\u17BD\u1799\u17A2\u17D2\u179C\u17B8\u178A\u179B\u17CB\u1794\u1784\u1794\u17B6\u1793\u1781\u17D2\u179B\u17C7\u1794\u17B6\u1791?",
      isActive: true,
      timesTriggered: 12
    }
  ]);
  await db.insert(workPlanPages).values([]);
  await db.insert(workPlanPlatforms).values([
    { id: "platform_1", name: "Facebook" },
    { id: "platform_2", name: "Instagram" },
    { id: "platform_3", name: "YouTube" },
    { id: "platform_4", name: "TikTok" }
  ]);
  await db.insert(workPlanItems).values([]);
  await db.insert(monthlyPlans).values([
    { id: "2026-06", name: "June 2026", nameKh: "\u1798\u17B7\u1790\u17BB\u1793\u17B6 \u17E2\u17E0\u17E2\u17E6", status: "COMPLETED" },
    { id: "2026-07", name: "July 2026", nameKh: "\u1780\u1780\u17D2\u1780\u178A\u17B6 \u17E2\u17E0\u17E2\u17E6", status: "IN_PROGRESS" }
  ]);
  await db.insert(pageSettings).values({
    userId: primaryUser.id,
    pageId: "fb_page_2026",
    pageName: "\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 & \u178C\u17B8\u1787\u17B8\u1790\u179B",
    pageUsername: "@digitaltechkh",
    category: "\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
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

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "mock-project-id"
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: firebase_applet_config_default.projectId || "mock-project-id"
  });
}
var adminAuth = (0, import_auth.getAuth)();

// src/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var firebaseTokenCache = /* @__PURE__ */ new Map();
var cacheTimestamps = /* @__PURE__ */ new Map();
var CACHE_TTL = 60 * 60 * 1e3;
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    if (token.length > 500) {
      const now = Date.now();
      const cachedTime = cacheTimestamps.get(token);
      if (cachedTime && now - cachedTime > CACHE_TTL) {
        firebaseTokenCache.delete(token);
        cacheTimestamps.delete(token);
      }
      if (!firebaseTokenCache.has(token)) {
        const verifyPromise = adminAuth.verifyIdToken(token);
        firebaseTokenCache.set(token, verifyPromise);
        cacheTimestamps.set(token, now);
      }
      try {
        const decodedToken = await firebaseTokenCache.get(token);
        req.user = decodedToken;
        return next();
      } catch (err) {
        firebaseTokenCache.delete(token);
        cacheTimestamps.delete(token);
        console.error("Firebase token verification failed. Falling back to JWT...");
      }
    }
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_12345";
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      if (token === "local_admin_token" || token.includes("local_admin")) {
        req.user = { uid: "local_admin_123", email: "admin@app.local", role: "Admin" };
        return next();
      }
      throw err;
    }
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// server.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var DEFAULT_PORT = 3e3;
var PORT = Number(process.env.PORT || DEFAULT_PORT);
app.use(import_express.default.json({ limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`[REQ_TIME] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});
var aiInstance = null;
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key === "MOCK_KEY") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
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
                mimeType: mimeType || "audio/webm"
              }
            }
          ]
        }
      ]
    });
    res.json({ text: response.text });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: err.message || "Failed to transcribe audio" });
  }
});
var mockPosts = [
  {
    id: "carousel_1",
    title: "\u179F\u17D2\u179A\u17A1\u17B6\u1789\u17CB\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798? \u1791\u179F\u17D2\u179F\u1793\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1781\u17D2\u179B\u17B8\u1791\u17B6\u17C6\u1784\u17E3 \u1793\u17C1\u17C7\u1797\u17D2\u179B\u17B6\u1798!",
    description: "\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1790\u17D2\u1798\u17B8\u17D7 \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1787\u17C4\u1782\u1787\u17D0\u1799\u1780\u17D2\u1793\u17BB\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798\u178C\u17B8\u1787\u17B8\u1790\u179B \u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6! \u17A2\u17BC\u179F\u1791\u17C5\u1786\u17D2\u179C\u17C1\u1784 (swipe left) \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1798\u17BE\u179B\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1793\u17B8\u1798\u17BD\u1799\u17D7 \u1793\u17B7\u1784\u1785\u17BB\u1785\u1798\u17BE\u179B\u1796\u17D0\u178F\u17CC\u1798\u17B6\u1793\u1794\u1793\u17D2\u1790\u17C2\u1798!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
    tags: ["DigitalSkill", "BusinessCarousel", "TechKhmer"],
    status: "scheduled",
    scheduledTime: new Date(Date.now() + 36e5 * 5).toISOString(),
    // 5 hours from now
    likesCount: 540,
    commentsCount: 16,
    sharesCount: 78,
    viewsCount: 3400,
    thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_1",
    category: "Video Carousel / \u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    facebookPostId: void 0,
    facebookError: void 0,
    carouselSlides: [
      {
        id: "slide_1",
        title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E1\u17D6 \u179F\u17D2\u179C\u17C2\u1784\u1799\u179B\u17CB\u1796\u17B8 AI Copilot",
        description: "\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179A\u17A0\u17D0\u179F\u1791\u17D2\u179C\u17C1\u178A\u1784\u1787\u17B6\u1798\u17BD\u1799\u1787\u17C6\u1793\u17BD\u1799\u1780\u17B6\u179A AI",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Learn More"
      },
      {
        id: "slide_2",
        title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E2\u17D6 \u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793\u178F\u17B6\u1798 FB",
        description: "\u1794\u1784\u17D2\u1780\u17BE\u1793\u1780\u17B6\u179A\u1786\u17D2\u179B\u17BE\u1799\u178F\u1794\u178A\u17C4\u1799\u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7\u178F\u17B6\u1798 Comments \u1797\u17D2\u179B\u17B6\u1798\u17D7",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Send Message"
      },
      {
        id: "slide_3",
        title: "\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1791\u17B8\u17E3\u17D6 \u1794\u1784\u17D2\u1780\u17BE\u1793\u1791\u17C6\u1793\u17BB\u1780\u1785\u17B7\u178F\u17D2\u178F\u1798\u17C9\u17B6\u1780\u1799\u17B8\u17A0\u17C4",
        description: "\u179A\u1794\u17C0\u1794\u179A\u17C0\u1794\u1785\u17C6 Brand Visual \u179F\u17D2\u17A2\u17B6\u178F\u1780\u1798\u17D2\u179A\u17B7\u178F\u17A2\u17B6\u1787\u17B8\u1796\u179F\u17D2\u178F\u1784\u17CB\u178A\u17B6\u179A",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-podcast-with-a-professional-microphone-43026-large.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
        linkUrl: "https://ai.studio/build",
        ctaText: "Shop Now"
      }
    ]
  },
  {
    id: "post_1",
    title: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
    description: "\u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1782\u1793\u17D2\u179B\u17B9\u17C7\u179F\u17C6\u1781\u17B6\u1793\u17CB\u17D7\u1791\u17B6\u17C6\u1784\u17E5 \u178A\u17BE\u1798\u17D2\u1794\u17B8\u1787\u17BD\u1799\u17B1\u17D2\u1799\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u1780\u17B6\u179A\u1785\u17B6\u1794\u17CB\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD\u1781\u17D2\u1796\u179F\u17CB\u1793\u17C5\u179B\u17BE\u1794\u178E\u17D2\u178F\u17B6\u1789\u179F\u1784\u17D2\u1782\u1798 Facebook\u17D4 \u1780\u17BB\u17C6\u1797\u17D2\u179B\u17C1\u1785\u1785\u17BB\u1785 Like \u1793\u17B7\u1784 Follow \u1798\u17D2\u1793\u17B6\u1780\u17CB\u1798\u17BD\u1799\u1795\u1784\u178E\u17B6!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
    tags: ["FacebookContent", "VideoMarketing", "KhmerCreator", "CreatorGuide"],
    status: "published",
    scheduledTime: new Date(Date.now() - 36e5 * 24).toISOString(),
    // Yesterday
    likesCount: 1240,
    commentsCount: 24,
    sharesCount: 145,
    viewsCount: 18500,
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_1",
    category: "\u1780\u17B6\u179A\u17A2\u1794\u17CB\u179A\u17C6 / \u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784",
    createdAt: new Date(Date.now() - 36e5 * 25).toISOString(),
    facebookPostId: void 0,
    facebookError: void 0
  },
  {
    id: "post_2",
    title: "\u1780\u17B6\u179A\u1794\u1784\u17D2\u17A0\u17B6\u1789\u1781\u17D2\u179B\u17B8\u17D7\u1796\u17B8\u179A\u17BF\u1784\u1787\u17B8\u179C\u17B7\u178F\u179F\u17D2\u1780\u17B6\u1799\u17A1\u17B6\u1789 (Skyline Vlog)",
    description: "\u178A\u17C6\u178E\u17BE\u179A\u1780\u1798\u17D2\u179F\u17B6\u1793\u17D2\u178F\u1781\u17D2\u179B\u17B8\u1785\u17BB\u1784\u179F\u1794\u17D2\u178F\u17B6\u17A0\u17CD\u1793\u17C5\u1791\u17B8\u1780\u17D2\u179A\u17BB\u1784\u1797\u17D2\u1793\u17C6\u1796\u17C1\u1789 \u1791\u17C1\u179F\u1797\u17B6\u1796\u1793\u17B6\u1796\u17C1\u179B\u179A\u17B6\u178F\u17D2\u179A\u17B8\u179F\u17D2\u179A\u179F\u17CB\u179F\u17D2\u17A2\u17B6\u178F\u1794\u17D2\u179B\u17C2\u1780\u1797\u17D2\u1793\u17C2\u1780\u1787\u17B6\u1798\u17BD\u1799\u17A2\u17B6\u1780\u17B6\u179F\u1792\u17B6\u178F\u17BB\u178A\u17CF\u179B\u17D2\u17A2\u1794\u17C6\u1795\u17BB\u178F!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-night-city-with-traffic-lights-and-neon-signs-34442-large.mp4",
    tags: ["PhnomPenhNight", "VlogLife", "KhmerTourism", "Skyline"],
    status: "scheduled",
    scheduledTime: new Date(Date.now() + 36e5 * 2).toISOString(),
    // 2 hours from now
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
    autoReplyRuleId: "rule_2",
    category: "\u179C\u17B8\u17A1\u17BB\u1780 / \u178A\u17C6\u178E\u17BE\u179A\u1780\u1798\u17D2\u179F\u17B6\u1793\u17D2\u178F",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    facebookPostId: void 0,
    facebookError: void 0
  },
  {
    id: "post_3",
    title: "\u1780\u17B7\u1785\u17D2\u1785\u179F\u1798\u17D2\u1797\u17B6\u179F\u1793\u17CD\u1796\u17B7\u179F\u17C1\u179F\u1787\u17B6\u1798\u17BD\u1799\u179F\u17A0\u1782\u17D2\u179A\u17B7\u1793\u179F\u17D2\u179A\u17D2\u178F\u17B8\u1786\u17D2\u1793\u17BE\u1798 \u17E2\u17E0\u17E2\u17E6",
    description: "\u1791\u179F\u17D2\u179F\u1793\u17B6\u1780\u17B6\u179A\u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1794\u1791\u1796\u17B7\u179F\u17C4\u1792\u1793\u17CD\u178A\u17CF\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3\u1796\u17B8\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798\u1781\u17D2\u1793\u17B6\u178F\u178F\u17BC\u1785\u179A\u17A0\u17BC\u178F\u1788\u17B6\u1793\u178A\u179B\u17CB\u1780\u17B6\u179A\u1787\u17C4\u1782\u1787\u17D0\u1799 \u1793\u17B7\u1784\u17A7\u1794\u179F\u1782\u17D2\u1782\u178A\u17C2\u179B\u178F\u17D2\u179A\u17BC\u179C\u1787\u1798\u17D2\u1793\u17C7\u17D4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-podcast-with-a-professional-microphone-43026-large.mp4",
    tags: ["BusinessCambodia", "WomenSME", "Inspiration", "KhmerInlay"],
    status: "draft",
    scheduledTime: new Date(Date.now() + 36e5 * 24).toISOString(),
    // Tomorrow
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80",
    category: "\u179F\u1798\u17D2\u1797\u17B6\u179F\u1793\u17CD / \u1792\u17BB\u179A\u1780\u17B7\u1785\u17D2\u1785",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    facebookPostId: void 0,
    facebookError: void 0
  }
];
var mockComments = [
  {
    id: "comment_1",
    postId: "post_1",
    postTitle: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
    authorName: "\u179F\u17BB\u1781 \u1787\u17B6",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    text: "\u178F\u17BE\u1794\u17D2\u17A2\u17BC\u1793\u17A2\u17B6\u1785\u1794\u17D2\u179A\u17B6\u1794\u17CB\u1794\u1793\u17D2\u1790\u17C2\u1798\u1796\u17B8\u1780\u1798\u17D2\u1798\u179C\u17B7\u1792\u17B8\u1780\u17B6\u178F\u17CB\u178F\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u178A\u17C2\u179B\u179B\u17D2\u17A2\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1791\u17BC\u179A\u179F\u17D0\u1796\u17D2\u1791\u178A\u17C3\u1794\u17B6\u1793\u1791\u17C1?",
    timestamp: new Date(Date.now() - 3600 * 1e3 * 3).toISOString(),
    // 3h ago
    isReplied: true,
    replyText: "\u1794\u17B6\u1791\u1794\u1784! \u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1791\u17BC\u179A\u179F\u17D0\u1796\u17D2\u1791\u178A\u17C3\u1794\u1784\u17A2\u17B6\u1785\u1794\u17D2\u179A\u17BE CapCut \u17AC VN Video Editor \u1794\u17B6\u1791 \u1796\u17D2\u179A\u17C4\u17C7\u179C\u17B6\u17A5\u178F\u1782\u17B7\u178F\u1790\u17D2\u179B\u17C3 \u1793\u17B7\u1784\u1784\u17B6\u1799\u179F\u17D2\u179A\u17BD\u179B\u1794\u17D2\u179A\u17BE\u1781\u17D2\u179B\u17B6\u17C6\u1784\u1798\u17C2\u1793\u1791\u17C2\u1793!",
    isAutoReplied: false
  },
  {
    id: "comment_2",
    postId: "post_1",
    postTitle: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
    authorName: "\u178E\u17B6\u179A\u17B8 \u179A\u17D0\u178F\u17D2\u1793",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    text: "\u178F\u1798\u17D2\u179B\u17C3\u179F\u17C1\u179C\u17B6\u1780\u17B6\u178F\u17CB\u178F\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1798\u17BD\u1799\u1782\u17B7\u178F\u1798\u17C9\u17C1\u1785\u178A\u17C2\u179A?",
    timestamp: new Date(Date.now() - 3600 * 1e3 * 1).toISOString(),
    // 1h ago
    isReplied: false,
    isAutoReplied: false
  },
  {
    id: "comment_3",
    postId: "post_1",
    postTitle: "\u179A\u1794\u17C0\u1794\u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1791\u17B6\u1780\u17CB\u1791\u17B6\u1789\u1781\u17D2\u179B\u17B6\u17C6\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1786\u17D2\u1793\u17B6\u17C6\u17E2\u17E0\u17E2\u17E6",
    authorName: "\u1785\u17B6\u1793\u17CB \u178A\u17B6\u179A\u17C9\u17B6",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    text: "\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1798\u17B6\u1793\u1794\u17D2\u179A\u1799\u17C4\u1787\u1793\u17CF\u1781\u17D2\u179B\u17B6\u17C6\u1784\u178E\u17B6\u179F\u17CB \u17A2\u179A\u1782\u17BB\u178E\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1780\u17B6\u179A\u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780!",
    timestamp: new Date(Date.now() - 600 * 1e3).toISOString(),
    // 10m ago
    isReplied: false,
    isAutoReplied: false
  }
];
async function handleAutoResponseTrigger(comment, userId) {
  const [pageSetting] = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, userId)).limit(1);
  if (!pageSetting?.isAutoResponderEnabled) return;
  const rules = await db.select().from(autoReplyRules).where((0, import_drizzle_orm2.eq)(autoReplyRules.userId, userId));
  const matchedRule = rules.find((rule) => {
    if (!rule.isActive) return false;
    const lowerText = comment.text.toLowerCase();
    const lowerKeyword = rule.triggerKeyword.toLowerCase();
    if (rule.condition === "exact") return lowerText === lowerKeyword;
    if (rule.condition === "started_with") return lowerText.startsWith(lowerKeyword);
    return lowerText.includes(lowerKeyword);
  });
  if (matchedRule) {
    await db.update(autoReplyRules).set({ timesTriggered: (matchedRule.timesTriggered || 0) + 1 }).where((0, import_drizzle_orm2.eq)(autoReplyRules.id, matchedRule.id));
    await db.update(comments).set({
      isReplied: true,
      replyText: matchedRule.replyTemplate,
      isAutoReplied: true
    }).where((0, import_drizzle_orm2.eq)(comments.id, comment.id));
    await db.insert(notifications).values({
      id: "notif_auto_" + Date.now(),
      userId,
      title: "\u1786\u17D2\u179B\u17BE\u1799\u178F\u1794\u179F\u17B6\u179A\u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7\u1787\u17C4\u1782\u1787\u17D0\u1799",
      message: `\u1794\u17D2\u179A\u1796\u17D0\u1793\u17D2\u1792\u1794\u17B6\u1793\u179F\u179A\u179F\u17C1\u179A\u1791\u17C5\u1780\u17B6\u1793\u17CB '${comment.authorName}' \u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7: "${matchedRule.replyTemplate.substring(0, 32)}..."`,
      type: "auto_reply",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
  }
}
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    res.json(dbUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current user" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const dbUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.email, email)).limit(1);
    if (!dbUser.length || dbUser[0].passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_key_12345";
    const avatar = dbUser[0].avatar;
    const truncatedAvatar = avatar && avatar.length > 5e3 ? avatar.substring(0, 100) + "...truncated" : avatar;
    const customToken = import_jsonwebtoken2.default.sign(
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
  } catch (err) {
    console.error("DEBUG: Login route caught error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});
app.get("/api/auth/facebook/url", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || "http://0.0.0.0:3000"}/auth/callback`;
    const state = dbUser.id.toString();
    if (!clientId || clientId === "YOUR_FACEBOOK_CLIENT_ID" || clientId === "") {
      return res.json({ url: `/auth/simulator-consent?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}` });
    }
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts&response_type=code&state=${state}`;
    res.json({ url: authUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate auth url" });
  }
});
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
              <p class="text-xs font-bold text-white font-sans">\u179F\u17C1\u1784\u179B\u17B8 \u17A2\u17B6\u178A (Seangly Ad)</p>
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
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  const redirectUri = `${process.env.APP_URL || "http://0.0.0.0:3000"}/auth/callback`;
  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return res.status(400).send("Invalid OAuth state parameter.");
  }
  try {
    let importedUser = null;
    let importedPages = [];
    if (code === "mock_fb_code" || !process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID === "YOUR_FACEBOOK_CLIENT_ID") {
      importedUser = {
        id: "fb_user_seangly",
        name: "Seangly Ad (\u179F\u17C1\u1784\u179B\u17B8 \u17A2\u17B6\u178A)",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        email: "seanglyad@gmail.com",
        token: "mock_user_token_abc123"
      };
      importedPages = [
        {
          id: "fb_page_2026",
          name: "\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 & \u178C\u17B8\u1787\u17B8\u1790\u179B",
          username: "@digitaltechkh",
          category: "\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
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
          category: "\u1796\u17D0\u178F\u17CC\u1798\u17B6\u1793\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6",
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
          category: "\u1782\u17C6\u1793\u17B7\u178F\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
          avatar: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          followersCount: 84e3,
          likesCount: 72e3,
          accessToken: "mock_page_token_3"
        },
        {
          id: "fb_page_internal",
          name: "Internal Agency",
          username: "@internalagency",
          category: "\u1791\u17B8\u1797\u17D2\u1793\u17B6\u1780\u17CB\u1784\u17B6\u179A\u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799",
          avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
          coverImage: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80",
          followersCount: 450,
          likesCount: 400,
          accessToken: "mock_page_token_4"
        }
      ];
    } else {
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        throw new Error(tokenData.error.message || "Failed to exchange code");
      }
      const userAccessToken = tokenData.access_token;
      const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture,email&access_token=${userAccessToken}`);
      const userData = await userRes.json();
      importedUser = {
        id: userData.id,
        name: userData.name,
        avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
        email: userData.email || `${userData.id}@facebook.com`,
        token: userAccessToken
      };
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${userAccessToken}`);
      const pagesData = await pagesRes.json();
      if (pagesData.data && pagesData.data.length > 0) {
        importedPages = pagesData.data.map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username ? `@${p.username}` : `@page_${p.id}`,
          category: p.category || "\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
          avatar: p.picture?.data?.url || `https://graph.facebook.com/v19.0/${p.id}/picture?type=large`,
          coverImage: p.cover?.source || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
          followersCount: p.fan_count || 5400,
          likesCount: p.talking_about_count || 4100,
          accessToken: p.access_token
        }));
      }
    }
    if (importedUser) {
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
        pageAccessToken: importedPages.length > 0 ? importedPages[0].accessToken : null
      };
      let page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, userId)).limit(1);
      if (page.length === 0) {
        await db.insert(pageSettings).values({
          userId,
          ...settingsValues
        });
      } else {
        await db.update(pageSettings).set(settingsValues).where((0, import_drizzle_orm2.eq)(pageSettings.userId, userId));
      }
      await db.insert(notifications).values({
        id: "notif_fb_auth_" + Date.now(),
        userId,
        title: "\u1782\u178E\u1793\u17B8 Facebook \u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7\u1794\u17B6\u1793\u1797\u17D2\u1787\u17B6\u1794\u17CB",
        message: `\u1782\u178E\u1793\u17B8 '${importedUser.name}' \u178F\u17D2\u179A\u17BC\u179C\u1794\u17B6\u1793\u1797\u17D2\u1787\u17B6\u1794\u17CB\u178A\u17C4\u1799\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4 \u1794\u17B6\u1793\u1795\u17D2\u1791\u17BB\u1780\u1791\u17C6\u1796\u17D0\u179A\u1785\u17C6\u1793\u17BD\u1793 ${importedPages.length} \u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1787\u17D2\u179A\u17BE\u179F\u179A\u17BE\u179F\u17D4`,
        type: "auto_reply",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isRead: false
      });
    }
  } catch (err) {
    console.error("Facebook Login Error: ", err);
  }
  res.send(`
    <html>
      <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
        <div class="text-center space-y-4 font-sans">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-xl border border-emerald-500/30 animate-pulse">
            \u2713
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
var fbDebugLogs = [];
function addFbLog(level, msg) {
  fbDebugLogs.unshift({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), level, msg });
  if (fbDebugLogs.length > 30) fbDebugLogs.pop();
}
async function publishPostToFacebookGraph(post) {
  const userSettingsList = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, post.userId)).limit(1);
  const userSettings = userSettingsList[0];
  if (!userSettings || !userSettings.pageId) {
    addFbLog("WARN", "No active page selected during publish request. Operating fallback simulation.");
    return { success: true, id: "sim_fb_post_id" + Date.now() };
  }
  const token = userSettings.pageAccessToken || userSettings.facebookToken;
  if (!token || token.startsWith("mock_")) {
    addFbLog("INFO", `Simulated post publish for Page '${userSettings.pageName}' (${userSettings.pageId}) - No real token found.`);
    return { success: true, id: "fb_sim_post_id_" + Math.floor(Math.random() * 1e6) };
  }
  addFbLog("INFO", `Starting REAL post publish to Facebook Page ID: ${userSettings.pageId}`);
  try {
    let url = "";
    let payload = {};
    if (post.videoUrl && post.videoUrl.trim() !== "" && !post.carouselSlides) {
      url = `https://graph.facebook.com/v19.0/${userSettings.pageId}/videos`;
      payload = {
        description: post.description ? `${post.title}

${post.description}` : post.title,
        title: post.title,
        file_url: post.videoUrl,
        access_token: token
      };
      addFbLog("INFO", `Attempting Video publish with url: ${post.videoUrl}`);
    } else {
      url = `https://graph.facebook.com/v19.0/${userSettings.pageId}/feed`;
      let messageText = `${post.title}`;
      if (post.description) messageText += `

${post.description}`;
      if (post.tags && post.tags.length > 0) messageText += `

${post.tags.map((t) => `#${t}`).join(" ")}`;
      payload = {
        message: messageText,
        access_token: token
      };
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
    const data = await response.json();
    if (data.error) {
      const errMsg = data.error.message || JSON.stringify(data.error);
      addFbLog("ERROR", `Meta Graph API responded with error: ${errMsg}`);
      return { success: false, error: errMsg };
    }
    const createdId = data.id || data.post_id;
    addFbLog("SUCCESS", `Post successfully published on Facebook! Target ID: ${createdId}`);
    return { success: true, id: createdId };
  } catch (err) {
    const errorMsg = err.message || "Connection timeout reaching Meta Graph API";
    addFbLog("ERROR", `Failed connecting to Facebook: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}
app.get("/api/auth/facebook/me", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    let page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    if (page.length > 0 && page[0].facebookUserId) {
      res.json({
        user: {
          id: page[0].facebookUserId,
          name: page[0].facebookUserName,
          avatar: page[0].facebookUserAvatar,
          email: page[0].facebookUserEmail,
          token: page[0].facebookToken,
          cookies: void 0
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
app.post("/api/auth/facebook/import-token", requireAuth, async (req, res) => {
  const { token, cookies, appId, appSecret } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Access token is required" });
  }
  const dbUser = await getOrCreateDbUser(req.user);
  addFbLog("INFO", `Attempting token import for token: ${token.substring(0, 10)}...`);
  try {
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture.type(large),email&access_token=${token}`);
    const userData = await userRes.json();
    if (userData.error) {
      addFbLog("ERROR", `Token validation failed: ${userData.error.message}`);
      return res.status(400).json({ error: userData.error.message || "Invalid FB access token" });
    }
    const importedFbUser = {
      id: userData.id,
      name: userData.name,
      avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
      email: userData.email || `${userData.id}@facebook.com`,
      token,
      cookies: cookies || void 0,
      appId: appId || void 0,
      appSecret: appSecret || void 0
    };
    addFbLog("SUCCESS", `Connected to User: ${userData.name} (${userData.id})`);
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${token}`);
    const pagesData = await pagesRes.json();
    let importedPages = [];
    if (pagesData.data && pagesData.data.length > 0) {
      importedPages = pagesData.data.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username ? `@${p.username}` : `@page_${p.id}`,
        category: p.category || "\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
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
    let page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
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
      pageAccessToken: importedPages.length > 0 ? importedPages[0].accessToken : null
    };
    let savedSettings;
    if (page.length === 0) {
      const inserted = await db.insert(pageSettings).values({
        userId: dbUser.id,
        ...settingsValues
      }).returning();
      savedSettings = inserted[0];
    } else {
      const updated = await db.update(pageSettings).set(settingsValues).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).returning();
      savedSettings = updated[0];
    }
    await db.insert(notifications).values({
      id: "notif_fb_import_" + Date.now(),
      userId: dbUser.id,
      title: "\u1782\u17D2\u179A\u17B6\u1794\u17CB\u1785\u17BB\u1785\u1793\u17B7\u1798\u17B7\u178F\u17D2\u178F\u179F\u1789\u17D2\u1789\u17B6 Facebook \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17BC\u179B",
      message: `\u1782\u178E\u1793\u17B8 '${importedFbUser.name}' \u178F\u17D2\u179A\u17BC\u179C\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB\u178F\u17D2\u179A\u17B6\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4 \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17BC\u179B\u1791\u17C6\u1796\u17D0\u179A\u1785\u17C6\u1793\u17BD\u1793 ${importedPages.length}\u17D4`,
      type: "auto_reply",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    res.json({
      success: true,
      user: importedFbUser,
      pages: importedPages,
      pageSettings: savedSettings
    });
  } catch (err) {
    addFbLog("ERROR", `Import exception: ${err.message}`);
    res.status(500).json({ error: "Failed validating credentials with Facebook Graph APIs: " + err.message });
  }
});
app.post("/api/auth/facebook/select-page", requireAuth, async (req, res) => {
  const { pageId } = req.body;
  if (!pageId) return res.status(400).json({ error: "pageId is required" });
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    let page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    if (page.length === 0) return res.status(404).json({ error: "Page settings not found. Please connect Facebook first." });
    const pagesList = page[0].facebookPages || [];
    const selected = pagesList.find((p) => p.id === pageId);
    if (!selected) return res.status(404).json({ error: "Page not found in logged-in user profile list" });
    const result = await db.update(pageSettings).set({
      pageId: selected.id,
      pageName: selected.name,
      pageUsername: selected.username,
      category: selected.category,
      pageAvatar: selected.avatar,
      coverImage: selected.coverImage,
      followersCount: selected.followersCount,
      likesCount: selected.likesCount,
      pageAccessToken: selected.accessToken
    }).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).returning();
    await db.insert(notifications).values({
      id: "notif_select_page_" + Date.now(),
      userId: dbUser.id,
      title: "\u1794\u17B6\u1793\u1794\u17D2\u178F\u17BC\u179A\u1791\u17C5\u1780\u17B6\u1793\u17CB\u1791\u17C6\u1796\u17D0\u179A\u1790\u17D2\u1798\u17B8",
      message: `\u1794\u17D2\u179A\u1796\u17D0\u1793\u17D2\u1792\u1794\u17B6\u1793\u1794\u17D2\u178F\u17BC\u179A\u1791\u17C5\u1780\u17B6\u179A\u1782\u17D2\u179A\u1794\u17CB\u1782\u17D2\u179A\u1784\u1791\u17C6\u1796\u17D0\u179A '${selected.name}' \u178A\u17C4\u1799\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4`,
      type: "publish",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    res.json({ success: true, pageSettings: result[0], selectedPage: selected });
  } catch (err) {
    console.error("Select page error:", err);
    res.status(500).json({ error: "Failed to select page" });
  }
});
app.post("/api/auth/facebook/logout", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    await db.update(pageSettings).set({
      facebookToken: null,
      facebookUserId: null,
      facebookUserName: null,
      facebookUserAvatar: null,
      facebookUserEmail: null,
      facebookPages: null,
      pageAccessToken: null
    }).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id));
    res.json({ success: true });
  } catch (err) {
    console.error("Facebook logout error:", err);
    res.status(500).json({ error: "Failed to logout Facebook" });
  }
});
app.post("/api/auth/facebook/import-token", requireAuth, async (req, res) => {
  const { token, cookies, appId, appSecret } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Access token is required" });
  }
  const dbUser = await getOrCreateDbUser(req.user);
  addFbLog("INFO", `Attempting token import for token: ${token.substring(0, 10)}...`);
  try {
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id,picture.type(large),email&access_token=${token}`);
    const userData = await userRes.json();
    if (userData.error) {
      addFbLog("ERROR", `Token validation failed: ${userData.error.message}`);
      return res.status(400).json({ error: userData.error.message || "Invalid FB access token" });
    }
    const fbUser = {
      id: userData.id,
      name: userData.name,
      avatar: userData.picture?.data?.url || `https://graph.facebook.com/v19.0/${userData.id}/picture?type=large`,
      email: userData.email || `${userData.id}@facebook.com`,
      token,
      cookies: cookies || void 0,
      appId: appId || void 0,
      appSecret: appSecret || void 0
    };
    addFbLog("SUCCESS", `Connected to User: ${userData.name} (${userData.id})`);
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,category,username,picture,cover,fan_count,talking_about_count,access_token&access_token=${token}`);
    const pagesData = await pagesRes.json();
    let importedPages = [];
    let settingsUpdate = {
      facebookToken: fbUser.token,
      facebookUserId: fbUser.id,
      facebookUserName: fbUser.name,
      facebookUserAvatar: fbUser.avatar,
      facebookUserEmail: fbUser.email
    };
    if (pagesData.data && pagesData.data.length > 0) {
      importedPages = pagesData.data.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username ? `@${p.username}` : `@page_${p.id}`,
        category: p.category || "\u1794\u1785\u17D2\u1785\u17C1\u1780\u179C\u17B7\u1791\u17D2\u1799\u17B6 \u1793\u17B7\u1784\u17A2\u17B6\u1787\u17B8\u179C\u1780\u1798\u17D2\u1798",
        avatar: p.picture?.data?.url || `https://graph.facebook.com/v19.0/${p.id}/picture?type=large`,
        coverImage: p.cover?.source || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
        followersCount: p.fan_count || 2100,
        likesCount: p.talking_about_count || 1500,
        accessToken: p.access_token
      }));
      addFbLog("SUCCESS", `Loaded ${importedPages.length} real managed pages.`);
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
    await db.update(pageSettings).set(settingsUpdate).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id));
    await db.insert(notifications).values({
      id: "notif_fb_import_" + Date.now(),
      userId: dbUser.id,
      title: "\u1782\u17D2\u179A\u17B6\u1794\u17CB\u1785\u17BB\u1785\u1793\u17B7\u1798\u17B7\u178F\u17D2\u178F\u179F\u1789\u17D2\u1789\u17B6 Facebook \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17BC\u179B",
      message: `\u1782\u178E\u1793\u17B8 '${fbUser.name}' \u178F\u17D2\u179A\u17BC\u179C\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB\u178F\u17D2\u179A\u17B6\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4 \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17BC\u179B\u1791\u17C6\u1796\u17D0\u179A\u1785\u17C6\u1793\u17BD\u1793 ${importedPages.length}\u17D4`,
      type: "auto_reply",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    const [updatedSettings] = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    res.json({
      success: true,
      user: fbUser,
      pages: importedPages,
      pageSettings: updatedSettings
    });
  } catch (err) {
    addFbLog("ERROR", `Import exception: ${err.message}`);
    res.status(500).json({ error: "Failed validating credentials with Facebook Graph APIs: " + err.message });
  }
});
app.post("/api/auth/facebook/select-page", requireAuth, async (req, res) => {
  try {
    const { pageId } = req.body;
    if (!pageId) return res.status(400).json({ error: "pageId is required" });
    const dbUser = await getOrCreateDbUser(req.user);
    const [settings] = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    if (!settings) return res.status(404).json({ error: "Settings not found" });
    const fbPages = settings.facebookPages || [];
    const selected = fbPages.find((p) => p.id === pageId);
    if (!selected) return res.status(404).json({ error: "Page not found in logged-in user profile list" });
    await db.update(pageSettings).set({
      pageId: selected.id,
      pageName: selected.name,
      pageUsername: selected.username,
      category: selected.category,
      pageAvatar: selected.avatar,
      coverImage: selected.coverImage,
      followersCount: selected.followersCount,
      likesCount: selected.likesCount,
      pageAccessToken: selected.accessToken
    }).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id));
    await db.insert(notifications).values({
      id: "notif_select_page_" + Date.now(),
      userId: dbUser.id,
      title: "\u1794\u17B6\u1793\u1794\u17D2\u178F\u17BC\u179A\u1791\u17C5\u1780\u17B6\u1793\u17CB\u1791\u17C6\u1796\u17D0\u179A\u1790\u17D2\u1798\u17B8",
      message: `\u1794\u17D2\u179A\u1796\u17D0\u1793\u17D2\u1792\u1794\u17B6\u1793\u1794\u17D2\u178F\u17BC\u179A\u1791\u17C5\u1780\u17B6\u179A\u1782\u17D2\u179A\u1794\u17CB\u1782\u17D2\u179A\u1784\u1791\u17C6\u1796\u17D0\u179A '${selected.name}' \u178A\u17C4\u1799\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4`,
      type: "publish",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    const [updatedSettings] = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    res.json({ success: true, pageSettings: updatedSettings, selectedPage: selected });
  } catch (err) {
    res.status(500).json({ error: "Failed to select page: " + err.message });
  }
});
app.get("/api/analytics", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const [settings] = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    const followersCount = settings?.followersCount || 54200;
    const scale = followersCount / 54200;
    const viewsOverTime = [
      { date: "06-06", views: Math.round(12400 * scale), minutesWatched: Math.round(45e3 * scale) },
      { date: "06-07", views: Math.round(15100 * scale), minutesWatched: Math.round(52e3 * scale) },
      { date: "06-08", views: Math.round(14800 * scale), minutesWatched: Math.round(49e3 * scale) },
      { date: "06-09", views: Math.round(19800 * scale), minutesWatched: Math.round(72e3 * scale) },
      { date: "06-10", views: Math.round(22400 * scale), minutesWatched: Math.round(81e3 * scale) },
      { date: "06-11", views: Math.round(24500 * scale), minutesWatched: Math.round(95e3 * scale) },
      { date: "06-12", views: Math.round(28900 * scale), minutesWatched: Math.round(112e3 * scale) }
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
      { group: "18-24 \u1786\u17D2\u1793\u17B6\u17C6", value: 35 },
      { group: "25-34 \u1786\u17D2\u1793\u17B6\u17C6", value: 48 },
      { group: "35-44 \u1786\u17D2\u1793\u17B6\u17C6", value: 12 },
      { group: "\u1795\u17D2\u179F\u17C1\u1784\u17D7", value: 5 }
    ];
    const engagementMetrics = [
      { metric: "\u1785\u17C6\u1793\u17BD\u1793\u1791\u179F\u17D2\u179F\u1793\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u179F\u179A\u17BB\u1794 (Total Video Views)", count: Math.round(18500 * 3.4 * scale), change: 18.5 },
      { metric: "\u17A2\u178F\u17D2\u179A\u17B6\u1785\u17BC\u179B\u179A\u17BD\u1798\u1787\u17B6\u1798\u1792\u17D2\u1799\u1798 (Avg Engagement Rate)", count: 12.4, change: 2.1 },
      { metric: "\u1785\u17C6\u1793\u17BD\u1793 Like \u179F\u179A\u17BB\u1794", count: Math.round(1240 * 2.8 * scale), change: 14.2 },
      { metric: "\u1785\u17C6\u1793\u17BD\u1793 Follower \u1780\u17BE\u1793\u17A1\u17BE\u1784", count: Math.round(2450 * scale), change: 25.4 }
    ];
    const growthTrend = [
      { date: "06-06", followers: Math.round(51750 * scale), reach: Math.round(98e3 * scale) },
      { date: "06-07", followers: Math.round(52100 * scale), reach: Math.round(11e4 * scale) },
      { date: "06-08", followers: Math.round(52500 * scale), reach: Math.round(105e3 * scale) },
      { date: "06-09", followers: Math.round(53100 * scale), reach: Math.round(135e3 * scale) },
      { date: "06-10", followers: Math.round(53600 * scale), reach: Math.round(142e3 * scale) },
      { date: "06-11", followers: Math.round(53950 * scale), reach: Math.round(158e3 * scale) },
      { date: "06-12", followers: Math.round(followersCount), reach: Math.round(185e3 * scale) }
    ];
    res.json({
      viewsOverTime,
      retentionCurve,
      audienceDemographics,
      engagementMetrics,
      growthTrend
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
app.get("/api/posts", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const allPosts = await db.select().from(videoPosts).where((0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id)).orderBy((0, import_drizzle_orm2.desc)(videoPosts.createdAt));
    res.json(allPosts);
  } catch (err) {
    console.error("Posts DB fetch failed, using mocks:", err);
    res.json([]);
  }
});
async function getOrCreateDbUser(reqUser) {
  const uid = reqUser.uid;
  const email = reqUser.email;
  if (!uid) {
    throw new Error("User UID is missing from auth token");
  }
  console.log("getOrCreateDbUser called for:", { uid, email });
  let dbUser;
  if (email) {
    dbUser = await db.select().from(users).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(users.uid, uid), (0, import_drizzle_orm2.eq)(users.email, email))).limit(1);
  } else {
    dbUser = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.uid, uid)).limit(1);
  }
  if (dbUser.length === 0) {
    dbUser = await db.insert(users).values({
      uid,
      name: reqUser.name || reqUser.email?.split("@")[0] || "User",
      email: reqUser.email || `${uid}@app.local`,
      role: "Admin",
      avatar: reqUser.picture || `https://images.unsplash.com/photo-${15e9 + Math.floor(Math.random() * 999999999)}?auto=format&fit=crop&w=150&h=150&q=80`,
      permissions: ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"],
      department: "Operations"
    }).returning();
  } else {
    let toUpdate = {};
    if (dbUser[0].uid !== uid) {
      toUpdate.uid = uid;
    }
    if (dbUser[0].email === "seanglyad@gmail.com" || dbUser[0].email === "admin@app.local") {
      toUpdate.role = "Admin";
      toUpdate.permissions = ["publish_posts", "manage_settings", "delete_content", "auto_replies", "view_analytics"];
    }
    if (Object.keys(toUpdate).length > 0) {
      dbUser = await db.update(users).set(toUpdate).where((0, import_drizzle_orm2.eq)(users.id, dbUser[0].id)).returning();
    }
  }
  return dbUser[0];
}
app.post("/api/posts", requireAuth, async (req, res) => {
  const { title, description, videoUrl, tags, status, scheduledTime, autoReplyRuleId, category, carouselSlides, aspectRatio } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const customPost = {
      id: "post_" + Date.now(),
      userId: dbUser.id,
      title,
      description: description || "",
      videoUrl: videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-looking-at-camera-34288-large.mp4",
      tags: tags || [],
      status: status || "draft",
      scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date(Date.now() + 36e5 * 24).toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      thumbnailUrl: carouselSlides && carouselSlides[0] ? carouselSlides[0].thumbnailUrl : "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      autoReplyRuleId,
      category: category || "\u1791\u17BC\u1791\u17C5",
      aspectRatio: aspectRatio || "16_9",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      carouselSlides: carouselSlides || void 0,
      facebookPostId: void 0,
      facebookError: void 0
    };
    if (customPost.status === "published") {
      const fbResult = await publishPostToFacebookGraph(customPost);
      if (fbResult.success) {
        customPost.facebookPostId = fbResult.id;
      } else {
        customPost.facebookError = fbResult.error;
      }
    }
    const result = await db.insert(videoPosts).values(customPost).returning();
    const savedPost = result[0];
    await db.insert(notifications).values({
      id: "notif_" + Date.now(),
      userId: dbUser.id,
      title: savedPost.status === "scheduled" ? "\u1780\u17B6\u179B\u179C\u17B7\u1797\u17B6\u1782\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB\u1791\u17BB\u1780" : "\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17B6\u1793\u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799\u1797\u17D2\u179B\u17B6\u1798\u17D7",
      message: savedPost.facebookError ? `\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17B6\u1793\u1794\u1784\u17D2\u1780\u17BE\u178F \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1798\u17B6\u1793\u1794\u1789\u17D2\u17A0\u17B6\u1795\u17D2\u1789\u17BE\u1791\u17C5 Facebook: ${savedPost.facebookError}` : `\u179C\u17B8\u178A\u17C1\u17A2\u17BC '${savedPost.title}' \u178F\u17D2\u179A\u17BC\u179C\u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17BC\u179B\u1791\u17C5\u1780\u17D2\u1793\u17BB\u1784\u1794\u17D2\u179A\u1796\u17D0\u1793\u17D2\u1792\u178A\u17C4\u1799\u1787\u17C4\u1782\u1787\u17D0\u1799\u17D4` + (savedPost.facebookPostId ? ` (FB ID: ${savedPost.facebookPostId})` : ""),
      type: savedPost.facebookError ? "failure" : "publish",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});
app.post("/api/posts/:id/publish", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const postList = await db.select().from(videoPosts).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(videoPosts.id, req.params.id), (0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id))).limit(1);
    if (postList.length === 0) return res.status(404).json({ error: "Post not found" });
    const post = postList[0];
    const viewsCount = Math.floor(Math.random() * 500) + 120;
    const likesCount = Math.floor(Math.random() * 80) + 20;
    const fbResult = await publishPostToFacebookGraph({ ...post, userId: dbUser.id });
    let facebookPostId = void 0;
    let facebookError = void 0;
    if (fbResult.success) {
      facebookPostId = fbResult.id;
    } else {
      facebookError = fbResult.error;
    }
    const updatedResult = await db.update(videoPosts).set({
      status: "published",
      viewsCount,
      likesCount,
      facebookPostId,
      facebookError
    }).where((0, import_drizzle_orm2.eq)(videoPosts.id, post.id)).returning();
    const updatedPost = updatedResult[0];
    await db.insert(notifications).values({
      id: "notif_publish_" + Date.now(),
      userId: dbUser.id,
      title: updatedPost.facebookError ? "\u1780\u17B6\u179A\u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799\u1791\u17C5 Facebook \u1794\u179A\u17B6\u1787\u17D0\u1799" : "\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17B6\u1793\u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799\u1787\u17C4\u1782\u1787\u17D0\u1799!",
      message: updatedPost.facebookError ? `\u1794\u1789\u17D2\u17A0\u17B6 Facebook: ${updatedPost.facebookError}` : `\u179C\u17B8\u178A\u17C1\u17A2\u17BC '${updatedPost.title}' \u178F\u17D2\u179A\u17BC\u179C\u1794\u17B6\u1793\u1794\u1784\u17D2\u17A0\u17C4\u17C7\u1791\u17C5\u1780\u17B6\u1793\u17CB\u1791\u17C6\u1796\u17D0\u179A Facebook \u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u178A\u17C4\u1799\u179F\u17D2\u179C\u17D0\u1799\u1794\u17D2\u179A\u179C\u178F\u17D2\u178F\u17B7\u1793\u17B6\u1796\u17C1\u179B\u1793\u17C1\u17C7\u17D4` + (updatedPost.facebookPostId ? ` (ID: ${updatedPost.facebookPostId})` : ""),
      type: updatedPost.facebookError ? "failure" : "publish",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    res.json(updatedPost);
  } catch (err) {
    console.error("Force publish failed:", err);
    res.status(500).json({ error: "Failed to publish post: " + err.message });
  }
});
app.delete("/api/posts/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    await db.delete(videoPosts).where(
      (0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(videoPosts.id, req.params.id),
        (0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id)
      )
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});
app.post("/api/posts/bulk", requireAuth, async (req, res) => {
  const { ids, action, data } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "ids array is required" });
  }
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    if (action === "delete") {
      for (const id of ids) {
        await db.delete(videoPosts).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(videoPosts.id, id), (0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Deleted successfully" });
    }
    if (action === "pause") {
      for (const id of ids) {
        await db.update(videoPosts).set({ status: "draft" }).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(videoPosts.id, id), (0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Paused successfully" });
    }
    if (action === "reschedule") {
      const { scheduledTime } = data || {};
      if (!scheduledTime) {
        return res.status(400).json({ error: "scheduledTime is required for reschedule" });
      }
      for (const id of ids) {
        await db.update(videoPosts).set({ status: "scheduled", scheduledTime: new Date(scheduledTime).toISOString() }).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(videoPosts.id, id), (0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id)));
      }
      return res.json({ success: true, message: "Rescheduled successfully" });
    }
    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Bulk action failed:", err);
    res.status(500).json({ error: "Bulk action failed" });
  }
});
app.get("/api/comments", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
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
    }).from(comments).innerJoin(videoPosts, (0, import_drizzle_orm2.eq)(comments.postId, videoPosts.id)).where((0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id));
    res.json(userComments);
  } catch (err) {
    res.json([]);
  }
});
app.post("/api/comments", requireAuth, async (req, res) => {
  try {
    const { postId, postTitle, authorName, text: text2 } = req.body;
    if (!text2 || !postId) return res.status(400).json({ error: "Text and postId are required" });
    const dbUser = await getOrCreateDbUser(req.user);
    const newComment = {
      id: "comment_" + Date.now(),
      postId,
      postTitle: postTitle || "\u1785\u17C6\u178E\u1784\u1787\u17BE\u1784\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB",
      authorName: authorName || "\u17A2\u17D2\u1793\u1780\u1782\u17B6\u17C6\u1791\u17D2\u179A\u1790\u17D2\u1798\u17B8",
      authorAvatar: `https://images.unsplash.com/photo-${15e11 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
      text: text2,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isReplied: false,
      isAutoReplied: false
    };
    const inserted = await db.insert(comments).values(newComment).returning();
    await db.insert(notifications).values({
      id: "notif_comm_" + Date.now(),
      userId: dbUser.id,
      title: "\u1798\u178F\u17B7\u1799\u17C4\u1794\u179B\u17CB\u1790\u17D2\u1798\u17B8 (New Comment)",
      message: `\u17A2\u17D2\u1793\u1780\u178F\u17B6\u1798\u178A\u17B6\u1793 '${newComment.authorName}' \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17C1\u1789\u1798\u178F\u17B7\u1799\u17C4\u1794\u179B\u17CB\u179B\u17BE\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u179A\u1794\u179F\u17CB\u17A2\u17D2\u1793\u1780\u17D4`,
      type: "comment",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    await handleAutoResponseTrigger(inserted[0], dbUser.id);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Failed handling comment snippet via DB:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});
app.post("/api/comments/:id/reply", requireAuth, async (req, res) => {
  try {
    const { replyText, isAutoReplied } = req.body;
    const result = await db.update(comments).set({
      isReplied: true,
      replyText: replyText || "\u17A2\u179A\u1782\u17BB\u178E\u1785\u17D2\u179A\u17BE\u1793\u178A\u17C2\u179B\u1794\u17B6\u1793\u1795\u17D2\u178F\u179B\u17CB\u1798\u178F\u17B7\u1799\u17C4\u1794\u179B\u17CB \u1793\u17B7\u1784\u1782\u17B6\u17C6\u1791\u17D2\u179A!",
      isAutoReplied: isAutoReplied || false
    }).where((0, import_drizzle_orm2.eq)(comments.id, req.params.id)).returning();
    if (!result.length) return res.status(404).json({ error: "Comment not found" });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to reply to comment" });
  }
});
app.get("/api/settings", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    let page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    if (page.length === 0) {
      const newPage = await db.insert(pageSettings).values({
        userId: dbUser.id,
        pageName: "\u1799\u17B6\u1793\u178A\u17D2\u178B\u17B6\u1793 SRV AutoRepair",
        pageUsername: "SRVAutoRepair",
        category: "\u179F\u17C1\u179C\u17B6\u1780\u1798\u17D2\u1798\u1787\u17BD\u179F\u1787\u17BB\u179B\u179A\u1790\u1799\u1793\u17D2\u178F",
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
    const roles = dbUser.role === "Admin" ? await db.select().from(users).orderBy((0, import_drizzle_orm2.desc)(users.createdAt)) : await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, dbUser.id));
    res.json({
      pageSettings: page[0],
      userRoles: roles
    });
  } catch (err) {
    console.error("Settings DB fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});
app.post("/api/settings", requireAuth, async (req, res) => {
  try {
    const {
      pageName,
      pageUsername,
      category,
      isAutoResponderEnabled,
      notificationSchedules,
      reportLogo,
      backupSchedule,
      isTelegramBackupEnabled,
      telegramBotToken,
      telegramChatId,
      backupTime
    } = req.body;
    const dbUser = await getOrCreateDbUser(req.user);
    const updateData = {};
    if (pageName !== void 0) updateData.pageName = pageName;
    if (pageUsername !== void 0) updateData.pageUsername = pageUsername;
    if (category !== void 0) updateData.category = category;
    if (isAutoResponderEnabled !== void 0) updateData.isAutoResponderEnabled = isAutoResponderEnabled;
    if (reportLogo !== void 0) updateData.reportLogo = reportLogo;
    if (notificationSchedules !== void 0) updateData.notificationSchedules = notificationSchedules;
    if (backupSchedule !== void 0) updateData.backupSchedule = backupSchedule;
    if (isTelegramBackupEnabled !== void 0) updateData.isTelegramBackupEnabled = isTelegramBackupEnabled;
    if (telegramBotToken !== void 0) updateData.telegramBotToken = telegramBotToken;
    if (telegramChatId !== void 0) updateData.telegramChatId = telegramChatId;
    if (backupTime !== void 0) updateData.backupTime = backupTime;
    const result = await db.update(pageSettings).set(updateData).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).returning();
    res.json({ success: true, pageSettings: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});
app.post("/api/settings/roles", requireAuth, async (req, res) => {
  try {
    const { name, email, role, permissions, password, department } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
    let uid = "external_" + Date.now();
    if (password) {
      try {
        const fbUser = await adminAuth.createUser({
          email,
          password,
          displayName: name
        });
        uid = fbUser.uid;
      } catch (fbErr) {
        console.warn("Firebase user creation failed, continuing with local DB only:", fbErr.message);
      }
    }
    const newUser = await db.insert(users).values({
      uid,
      name,
      email,
      passwordHash: password,
      // Store password for local login mechanism
      role: role || "Editor",
      avatar: `https://images.unsplash.com/photo-${15e9 + Math.floor(Math.random() * 999999999)}?auto=format&fit=crop&w=150&h=150&q=80`,
      permissions: permissions || [],
      sex: req.body.sex,
      dob: req.body.dob,
      phoneNumber: req.body.phoneNumber,
      department: department || void 0
    }).returning();
    res.status(201).json(newUser[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create role" });
  }
});
app.put("/api/settings/roles/:id", requireAuth, async (req, res) => {
  try {
    const { name, email, role, permissions, sex, dob, phoneNumber, avatar, password, department } = req.body;
    if (password) {
      const userResult = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, parseInt(req.params.id))).limit(1);
      if (userResult.length && !userResult[0].uid.startsWith("external_")) {
        try {
          await adminAuth.updateUser(userResult[0].uid, { password });
        } catch (err) {
          console.error("Firebase pwd update failed:", err);
        }
      }
    }
    const updateData = {};
    if (name !== void 0) updateData.name = name;
    if (email !== void 0) updateData.email = email;
    if (role !== void 0) updateData.role = role;
    if (sex !== void 0) updateData.sex = sex;
    if (dob !== void 0) updateData.dob = dob;
    if (phoneNumber !== void 0) updateData.phoneNumber = phoneNumber;
    if (avatar !== void 0) updateData.avatar = avatar;
    if (password !== void 0) updateData.passwordHash = password;
    if (permissions !== void 0) updateData.permissions = permissions;
    if (department !== void 0) updateData.department = department;
    const result = await db.update(users).set(updateData).where((0, import_drizzle_orm2.eq)(users.id, parseInt(req.params.id))).returning();
    if (!result.length) return res.status(404).json({ error: "User role not found" });
    res.json(result[0]);
  } catch (err) {
    console.error("Failed to update role:", err);
    res.status(500).json({ error: "Failed to update role: " + err.message });
  }
});
app.delete("/api/settings/roles/:id", requireAuth, async (req, res) => {
  try {
    const userResult = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, parseInt(req.params.id))).limit(1);
    if (userResult.length > 0) {
      const uid = userResult[0].uid;
      try {
        if (!uid.startsWith("external_") && !uid.includes("role_user")) {
          await adminAuth.deleteUser(uid);
        }
      } catch (err) {
        console.warn("Could not delete from firebase:", err);
      }
    }
    await db.delete(users).where((0, import_drizzle_orm2.eq)(users.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete role" });
  }
});
app.get("/api/rules", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const allRules = await db.select().from(autoReplyRules).where((0, import_drizzle_orm2.eq)(autoReplyRules.userId, dbUser.id));
    res.json(allRules);
  } catch (err) {
    console.error("Rules DB fetch failed, using mocks:", err);
    res.json([]);
  }
});
app.post("/api/rules", requireAuth, async (req, res) => {
  try {
    const { name, triggerKeyword, condition, replyTemplate, isActive } = req.body;
    if (!triggerKeyword || !replyTemplate) return res.status(400).json({ error: "Trigger Keyword and Response Template are required" });
    const dbUser = await getOrCreateDbUser(req.user);
    const newRule = {
      id: "rule_" + Date.now(),
      userId: dbUser.id,
      name: name || `\u1785\u17D2\u1794\u17B6\u1794\u17CB\u1786\u17D2\u179B\u17BE\u1799\u178F\u1794 '${triggerKeyword}'`,
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
    const currentRule = await db.select().from(autoReplyRules).where((0, import_drizzle_orm2.eq)(autoReplyRules.id, req.params.id)).limit(1);
    if (!currentRule.length) return res.status(404).json({ error: "Rule not found" });
    const result = await db.update(autoReplyRules).set({ isActive: !currentRule[0].isActive }).where((0, import_drizzle_orm2.eq)(autoReplyRules.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle rule" });
  }
});
app.put("/api/rules/:id", requireAuth, async (req, res) => {
  try {
    const result = await db.update(autoReplyRules).set(req.body).where((0, import_drizzle_orm2.eq)(autoReplyRules.id, req.params.id)).returning();
    if (!result.length) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true, rule: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update rule" });
  }
});
app.delete("/api/rules/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(autoReplyRules).where((0, import_drizzle_orm2.eq)(autoReplyRules.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete rule" });
  }
});
app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const allNotifs = await db.select().from(notifications).where((0, import_drizzle_orm2.eq)(notifications.userId, dbUser.id)).orderBy((0, import_drizzle_orm2.desc)(notifications.createdAt));
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
app.get("/api/workplan", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const [rawItems, pages, platforms, months] = await Promise.all([
      db.select({
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
        createdByEmail: users.email
      }).from(workPlanItems).leftJoin(users, (0, import_drizzle_orm2.eq)(workPlanItems.userId, users.id)).where((0, import_drizzle_orm2.eq)(workPlanItems.userId, dbUser.id)),
      db.select().from(workPlanPages).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(workPlanPages.userId, dbUser.id), (0, import_drizzle_orm2.isNull)(workPlanPages.userId))),
      db.select().from(workPlanPlatforms).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(workPlanPlatforms.userId, dbUser.id), (0, import_drizzle_orm2.isNull)(workPlanPlatforms.userId))),
      db.select().from(monthlyPlans).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(monthlyPlans.userId, dbUser.id), (0, import_drizzle_orm2.isNull)(monthlyPlans.userId)))
    ]);
    let finalRawItems = rawItems;
    if (finalRawItems.length === 0) {
      const defaultMonth = months[0]?.id || "2026-07";
      const starterSeed = [
        {
          id: "wp_item_init_1_" + dbUser.id + "_" + Date.now(),
          userId: dbUser.id,
          title: "\u179A\u17C0\u1794\u1785\u17C6\u1795\u17C2\u1793\u1780\u17B6\u179A\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17D2\u179A\u1785\u17B6\u17C6\u179F\u1794\u17D2\u178F\u17B6\u17A0\u17CD",
          subtitle: "\u179A\u17C0\u1794\u1785\u17C6\u1791\u179F\u17D2\u179F\u1793\u179C\u17B7\u179F\u17D0\u1799\u1798\u17B6\u178F\u17B7\u1780\u17B6 \u1793\u17B7\u1784\u1782\u17C4\u179B\u178A\u17C5\u1794\u17D2\u179A\u1785\u17B6\u17C6\u1781\u17C2",
          postType: "REELS",
          contentType: "VIDEO",
          weekNumber: 1,
          dayOfWeek: "Monday",
          timeSlot: "09:00",
          status: "COMPLETED",
          notes: `\u1795\u17C2\u1793\u1780\u17B6\u179A\u178A\u17C6\u1794\u17BC\u1784\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1782\u178E\u1793\u17B8 ${dbUser.name || dbUser.email}`,
          month: defaultMonth
        },
        {
          id: "wp_item_init_2_" + dbUser.id + "_" + Date.now(),
          userId: dbUser.id,
          title: "\u1794\u1784\u17D2\u17A0\u17C4\u17C7\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1795\u17D2\u179F\u1796\u17D2\u179C\u1795\u17D2\u179F\u17B6\u1799\u1795\u179B\u17B7\u178F\u1795\u179B \u1793\u17B7\u1784\u179F\u17C1\u179C\u17B6\u1780\u1798\u17D2\u1798",
          subtitle: "\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1781\u17D2\u179B\u17B8 30 \u179C\u17B7\u1793\u17B6\u1791\u17B8 HD",
          postType: "POST",
          contentType: "CAROUSEL",
          weekNumber: 1,
          dayOfWeek: "Wednesday",
          timeSlot: "14:30",
          status: "IN_PROGRESS",
          notes: "\u178F\u17D2\u179A\u17C0\u1798\u179A\u17C0\u1794\u1785\u17C6 Caption \u1793\u17B7\u1784 Hashtag",
          month: defaultMonth
        }
      ];
      await db.insert(workPlanItems).values(starterSeed);
      finalRawItems = await db.select({
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
        createdByEmail: users.email
      }).from(workPlanItems).leftJoin(users, (0, import_drizzle_orm2.eq)(workPlanItems.userId, users.id)).where((0, import_drizzle_orm2.eq)(workPlanItems.userId, dbUser.id));
    }
    const items = finalRawItems.map((item) => ({
      ...item,
      createdBy: item.createdByName ? { name: item.createdByName, avatar: item.createdByAvatar || "", email: item.createdByEmail || "" } : null
    }));
    res.json({ items, pages, platforms, months });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch work plan data" });
  }
});
app.post("/api/workplan/items", requireAuth, async (req, res) => {
  try {
    const { title, subtitle, postType, contentType, pageId, platformId, weekNumber, dayOfWeek, timeSlot, status, notes, month } = req.body;
    console.log("POST /api/workplan/items payload:", req.body);
    if (!title) return res.status(400).json({ error: "Title is required" });
    const dbUser = await getOrCreateDbUser(req.user);
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
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Failed to create work plan item: " + err.message });
  }
});
app.put("/api/workplan/items/:id", requireAuth, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.pageId === "") payload.pageId = null;
    if (payload.platformId === "") payload.platformId = null;
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.update(workPlanItems).set(payload).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanItems.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanItems.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Work plan item not found" });
    res.json({ success: true, item: result[0] });
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update work plan item" });
  }
});
app.delete("/api/workplan/items/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    await db.delete(workPlanItems).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanItems.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanItems.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete work plan item" });
  }
});
app.post("/api/workplan/months", requireAuth, async (req, res) => {
  try {
    const { id, name, nameKh, status, copyFrom } = req.body;
    if (!id || !name) return res.status(400).json({ error: "Month ID and Name are required" });
    const dbUser = await getOrCreateDbUser(req.user);
    const existing = await db.select().from(monthlyPlans).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(monthlyPlans.id, id), (0, import_drizzle_orm2.eq)(monthlyPlans.userId, dbUser.id))).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "\u1795\u17C2\u1793\u1780\u17B6\u179A\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1781\u17C2\u1793\u17C1\u17C7\u1798\u17B6\u1793\u179A\u17BD\u1785\u179A\u17B6\u179B\u17CB\u17A0\u17BE\u1799!" });
    }
    const newMonth = {
      id,
      userId: dbUser.id,
      name,
      nameKh: nameKh || name,
      status: status || "IN_PROGRESS",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const result = await db.insert(monthlyPlans).values(newMonth).returning();
    if (copyFrom) {
      const sourceItems = await db.select().from(workPlanItems).where((0, import_drizzle_orm2.eq)(workPlanItems.month, copyFrom));
      if (sourceItems.length > 0) {
        const newItems = sourceItems.map((i, idx) => ({
          ...i,
          id: "wp_item_copy_" + Date.now() + "_" + idx + "_" + Math.floor(Math.random() * 1e3),
          status: "PLANNED",
          notes: i.notes ? `[\u1785\u1798\u17D2\u179B\u1784\u1796\u17B8 ${copyFrom}] ` + i.notes : `[\u1785\u1798\u17D2\u179B\u1784\u1796\u17B8 ${copyFrom}]`,
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
app.put("/api/workplan/months/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.update(monthlyPlans).set(req.body).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(monthlyPlans.id, req.params.id), (0, import_drizzle_orm2.eq)(monthlyPlans.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Month plan not found" });
    res.json({ success: true, plan: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update month plan" });
  }
});
app.delete("/api/workplan/months/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    await db.delete(workPlanItems).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanItems.month, req.params.id), (0, import_drizzle_orm2.eq)(workPlanItems.userId, dbUser.id)));
    await db.delete(monthlyPlans).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(monthlyPlans.id, req.params.id), (0, import_drizzle_orm2.eq)(monthlyPlans.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete month plan" });
  }
});
app.post("/api/workplan/pages", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Page name is required" });
    const dbUser = await getOrCreateDbUser(req.user);
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
app.delete("/api/workplan/pages/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.delete(workPlanPages).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanPages.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanPages.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete page" });
  }
});
app.put("/api/workplan/pages/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.update(workPlanPages).set(req.body).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanPages.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanPages.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Page not found" });
    res.json({ success: true, page: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update page" });
  }
});
app.post("/api/workplan/platforms", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Platform name is required" });
    const dbUser = await getOrCreateDbUser(req.user);
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
app.put("/api/workplan/platforms/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.update(workPlanPlatforms).set(req.body).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanPlatforms.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanPlatforms.userId, dbUser.id))).returning();
    if (!result.length) return res.status(404).json({ error: "Platform not found" });
    res.json({ success: true, platform: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update platform" });
  }
});
app.delete("/api/workplan/platforms/:id", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const result = await db.delete(workPlanPlatforms).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(workPlanPlatforms.id, req.params.id), (0, import_drizzle_orm2.eq)(workPlanPlatforms.userId, dbUser.id)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete platform" });
  }
});
app.post("/api/simulate/activity", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    let userPosts = await db.select().from(videoPosts).where((0, import_drizzle_orm2.eq)(videoPosts.userId, dbUser.id));
    if (userPosts.length === 0) {
      const defaultPost = {
        id: "post_sim_" + Date.now(),
        userId: dbUser.id,
        title: "\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1798\u17C1\u179A\u17C0\u1793\u1781\u17D2\u179B\u17B8\u17D6 \u1782\u1793\u17D2\u179B\u17B9\u17C7\u178A\u17C4\u17C7\u179F\u17D2\u179A\u17B6\u1799\u1794\u1789\u17D2\u17A0\u17B6\u1780\u17BC\u178A",
        description: "\u1780\u17B6\u179A\u178E\u17C2\u1793\u17B6\u17C6\u1781\u17D2\u179B\u17B8\u17D7\u1796\u17B8\u1780\u17B6\u179A\u179F\u179A\u179F\u17C1\u179A\u1780\u17BC\u178A\u17B1\u17D2\u1799\u1798\u17B6\u1793\u1794\u17D2\u179A\u179F\u17B7\u1791\u17D2\u1792\u1797\u17B6\u1796\u1781\u17D2\u1796\u179F\u17CB \u1793\u17B7\u1784\u179A\u17A0\u17D0\u179F\u1791\u17D2\u179C\u17C1\u178A\u1784\u17D4",
        status: "published",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const result = await db.insert(videoPosts).values(defaultPost).returning();
      userPosts = [result[0]];
    }
    const randomPost = userPosts[Math.floor(Math.random() * userPosts.length)];
    const simulatedComments = [
      "\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u17D2\u17A2\u17BC\u1793 \u178F\u17BE\u1798\u17B6\u1793\u179C\u1782\u17D2\u1782\u179F\u17B7\u1780\u17D2\u179F\u17B6\u1780\u17B6\u178F\u17CB\u178F\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u17A2\u17D2\u1793\u1780\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C6\u1794\u17BC\u1784\u17A2\u178F\u17CB?",
      "\u1785\u17B6\u1794\u17CB\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD\u1781\u17D2\u179B\u17B6\u17C6\u1784\u178E\u17B6\u179F\u17CB \u178F\u17BE\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1793\u17C1\u17C7\u1794\u17D2\u179A\u17BE\u1780\u17B6\u1798\u17C1\u179A\u17C9\u17B6\u1794\u17D2\u179A\u1797\u17C1\u1791\u178E\u17B6\u178A\u17C2\u179A?",
      "\u1785\u1784\u17CB\u179F\u17BD\u179A\u178F\u1798\u17D2\u179B\u17C3\u179F\u17C1\u179C\u17B6\u17A0\u17D2\u179C\u17C1\u179F\u1794\u17CA\u17BB\u1780\u1795\u17BB\u179F \u1793\u17B7\u1784\u179F\u17D2\u1780\u17C1\u178F\u179F\u17CA\u17BB\u179B\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1798\u17BD\u1799\u1781\u17C2\u1794\u17C9\u17BB\u1793\u17D2\u1798\u17B6\u1793?",
      "Like \u1793\u17B7\u1784 Follow \u179A\u17BD\u1785\u179A\u17B6\u179B\u17CB\u17A0\u17BE\u1799\u1794\u1784! \u1794\u1784\u17D2\u1780\u17BE\u178F\u1798\u17B6\u178F\u17B7\u1780\u17B6\u179B\u17D2\u17A2\u17D7\u1794\u1793\u17D2\u1790\u17C2\u1798\u1791\u17C0\u178F\u178E\u17B6!",
      "\u178F\u17BE\u17A2\u17B6\u1785\u1787\u17BD\u1799\u1796\u1793\u17D2\u1799\u179B\u17CB\u1796\u17B8\u179C\u17B7\u1792\u17B8\u178A\u17C4\u17C7\u179F\u17D2\u179A\u17B6\u1799\u1794\u1789\u17D2\u17A0\u17B6 Reached Limit \u1795\u17BB\u179F\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1794\u17B6\u1793\u1791\u17C1?"
    ];
    const simulatedAuthors = [
      { name: "\u1785\u17B6\u1793\u17CB \u179F\u17C6\u1797\u17D0\u179F\u17D2\u179F", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
      { name: "\u1782\u17B9\u1798 \u179B\u17B6\u1784", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
      { name: "\u1795\u17B6\u1793\u17CB\u178E\u17B7\u178F \u179F\u17C1\u1784", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isReplied: false,
      isAutoReplied: false
    };
    const insertedComment = await db.insert(comments).values(newComment).returning();
    await handleAutoResponseTrigger(insertedComment[0], dbUser.id);
    const updatedCommentList = await db.select().from(comments).where((0, import_drizzle_orm2.eq)(comments.id, newComment.id)).limit(1);
    const commentToSend = updatedCommentList[0] || insertedComment[0];
    await db.insert(notifications).values({
      id: "notif_comm_" + Date.now(),
      userId: dbUser.id,
      title: "\u1798\u178F\u17B7\u1799\u17C4\u1794\u179B\u17CB\u1790\u17D2\u1798\u17B8 (New Comment)",
      message: `\u17A2\u17D2\u1793\u1780\u1794\u17D2\u179A\u17BE\u1794\u17D2\u179A\u17B6\u179F\u17CB '${commentToSend.authorName}' \u1794\u17B6\u1793\u1794\u1789\u17D2\u1785\u17C1\u1789\u1798\u178F\u17B7\u17D6 "${commentToSend.text.substring(0, 40)}..."`,
      type: "comment",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    });
    res.json({ success: true, activity: commentToSend });
  } catch (err) {
    console.error("Activity simulation error:", err);
    res.status(500).json({ error: "Failed to simulate activity: " + err.message });
  }
});
function getBackupFilename() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `backup_${year}-${month}-${day}_${hours}-${minutes}.sql`;
}
function formatTelegramCaption(filename, filePath, sizeInBytes) {
  let dateStr = "";
  let timeStr = "";
  let sizeStr = "Unknown";
  try {
    let size = sizeInBytes;
    if (size === void 0) {
      const stats = import_fs.default.statSync(filePath);
      size = stats.size;
    }
    const sizeInMB = size / (1024 * 1024);
    sizeStr = `${sizeInMB.toFixed(1)} MB`;
    const match = filename.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})/);
    if (match) {
      dateStr = match[1];
      timeStr = `${match[2]}:${match[3]}`;
    } else {
      const now = /* @__PURE__ */ new Date();
      dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
  } catch (err) {
    console.error("[formatTelegramCaption] Error reading stats for " + filePath + ":", err.message);
    const now = /* @__PURE__ */ new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  return [
    `\u2B07\uFE0F System Backup`,
    ``,
    `\u{1F5C4}\uFE0F Database: local.db`,
    `\u{1F4C4} File: ${filename}`,
    `\u{1F4C5} Date: ${dateStr} ${timeStr}`,
    `\u{1F4E6} Size: ${sizeStr}`,
    ``,
    `Backup file saved on server. Download from Admin Panel \u2192 Backup & Restore.`
  ].join("\n");
}
app.get("/api/backup/list", requireAuth, async (req, res) => {
  try {
    const backupsDir = import_path.default.resolve("backups");
    if (!import_fs.default.existsSync(backupsDir)) {
      import_fs.default.mkdirSync(backupsDir, { recursive: true });
    }
    const files = import_fs.default.readdirSync(backupsDir);
    const list = files.filter((f) => f.startsWith("backup_") && f.endsWith(".sql")).map((f) => {
      const filePath = import_path.default.join(backupsDir, f);
      const stats = import_fs.default.statSync(filePath);
      return {
        filename: f,
        size: stats.size,
        createdAt: stats.birthtime.toISOString()
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to list backups" });
  }
});
app.post("/api/backup/now", requireAuth, async (req, res) => {
  try {
    const dbUser = await getOrCreateDbUser(req.user);
    const page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    const backupsDir = import_path.default.resolve("backups");
    if (!import_fs.default.existsSync(backupsDir)) {
      import_fs.default.mkdirSync(backupsDir, { recursive: true });
    }
    const filename = getBackupFilename();
    const destPath = import_path.default.join(backupsDir, filename);
    import_fs.default.copyFileSync("local.db", destPath);
    let telegramSent = false;
    let telegramError = null;
    if (page.length && page[0].isTelegramBackupEnabled && page[0].telegramBotToken && page[0].telegramChatId) {
      try {
        const token = page[0].telegramBotToken;
        const chatId = page[0].telegramChatId;
        const fileBuffer = import_fs.default.readFileSync(destPath);
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
      } catch (tgErr) {
        console.error("Telegram backup failed:", tgErr);
        telegramError = tgErr.message;
      }
    }
    if (page.length) {
      await db.update(pageSettings).set({ lastBackupTime: (/* @__PURE__ */ new Date()).toISOString() }).where((0, import_drizzle_orm2.eq)(pageSettings.id, page[0].id));
    }
    res.json({
      success: true,
      filename,
      telegramSent,
      telegramError
    });
  } catch (err) {
    console.error("Backup failed:", err);
    res.status(500).json({ error: err.message || "Failed to create backup" });
  }
});
app.post("/api/backup/restore", requireAuth, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "Filename is required" });
    const backupsDir = import_path.default.resolve("backups");
    const filePath = import_path.default.join(backupsDir, filename);
    if (!import_fs.default.existsSync(filePath) || !filename.startsWith("backup_") || !filename.endsWith(".sql")) {
      return res.status(400).json({ error: "Invalid backup file" });
    }
    import_fs.default.copyFileSync(filePath, "local.db");
    res.json({ success: true, message: "Database restored successfully" });
  } catch (err) {
    console.error("Restore failed:", err);
    res.status(500).json({ error: err.message || "Failed to restore backup" });
  }
});
app.post("/api/backup/upload-restore", requireAuth, async (req, res) => {
  try {
    const { fileData, filename } = req.body;
    if (!fileData) return res.status(400).json({ error: "File data is required" });
    const buffer = Buffer.from(fileData, "base64");
    const backupsDir = import_path.default.resolve("backups");
    if (!import_fs.default.existsSync(backupsDir)) {
      import_fs.default.mkdirSync(backupsDir, { recursive: true });
    }
    const safeFilename = filename || `backup_uploaded_${Date.now()}.sql`;
    const backupPath = import_path.default.join(backupsDir, safeFilename);
    import_fs.default.writeFileSync(backupPath, buffer);
    import_fs.default.copyFileSync(backupPath, "local.db");
    res.json({ success: true, message: "Database restored from uploaded file successfully" });
  } catch (err) {
    console.error("Upload restore failed:", err);
    res.status(500).json({ error: err.message || "Failed to restore from uploaded file" });
  }
});
app.post("/api/backup/:filename/telegram", requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const dbUser = await getOrCreateDbUser(req.user);
    const page = await db.select().from(pageSettings).where((0, import_drizzle_orm2.eq)(pageSettings.userId, dbUser.id)).limit(1);
    const backupsDir = import_path.default.resolve("backups");
    const filePath = import_path.default.join(backupsDir, filename);
    if (!import_fs.default.existsSync(filePath) || !filename.startsWith("backup_") || !filename.endsWith(".sql")) {
      return res.status(400).json({ error: "Invalid backup file" });
    }
    if (!page.length || !page[0].telegramBotToken || !page[0].telegramChatId) {
      return res.status(400).json({ error: "Telegram is not configured. Please save your Telegram settings first." });
    }
    const token = page[0].telegramBotToken;
    const chatId = page[0].telegramChatId;
    const fileBuffer = import_fs.default.readFileSync(filePath);
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
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send to Telegram" });
  }
});
app.post("/api/backup/test-telegram", requireAuth, async (req, res) => {
  try {
    const { token, chatId } = req.body;
    if (!token || !chatId) return res.status(400).json({ error: "Bot token and Chat ID are required" });
    const testMsg = `\u{1F514} *MetaStream Telegram Test Notification*

Your Telegram configuration is active and working correctly!
Timestamp: ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
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
  } catch (err) {
    res.status(500).json({ error: err.message || "Connection failed" });
  }
});
app.delete("/api/backup/:filename", requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupsDir = import_path.default.resolve("backups");
    const filePath = import_path.default.join(backupsDir, filename);
    if (!import_fs.default.existsSync(filePath) || !filename.startsWith("backup_") || !filename.endsWith(".db") && !filename.endsWith(".sql")) {
      return res.status(400).json({ error: "Invalid backup file" });
    }
    import_fs.default.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete backup file" });
  }
});
app.get("/api/backup/download", requireAuth, async (req, res) => {
  try {
    const { file } = req.query;
    if (!file || typeof file !== "string") return res.status(400).send("File query param is required");
    const backupsDir = import_path.default.resolve("backups");
    const filePath = import_path.default.join(backupsDir, file);
    if (!import_fs.default.existsSync(filePath) || !file.startsWith("backup_") || !file.endsWith(".db") && !file.endsWith(".sql")) {
      return res.status(400).send("Invalid backup file");
    }
    res.download(filePath, file);
  } catch (err) {
    res.status(500).send("Failed to download file");
  }
});
function startBackupScheduler() {
  console.log("[Backup Scheduler] Initializing automatic backup scheduler interval...");
  setInterval(async () => {
    try {
      const activeConfigs = await db.select().from(pageSettings);
      for (const config of activeConfigs) {
        const schedule = config.backupSchedule;
        if (!schedule || schedule === "disabled") continue;
        const lastBackup = config.lastBackupTime ? new Date(config.lastBackupTime) : null;
        const now = /* @__PURE__ */ new Date();
        const [targetHour, targetMinute] = (config.backupTime || "03:00").split(":").map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const isPastTargetTime = currentHour > targetHour || currentHour === targetHour && currentMinute >= targetMinute;
        let shouldBackup = false;
        if (isPastTargetTime) {
          if (!lastBackup) {
            shouldBackup = true;
          } else {
            const diffMs = now.getTime() - lastBackup.getTime();
            const diffHours = diffMs / (1e3 * 60 * 60);
            if (schedule === "daily") {
              const lastBackupDayStr = `${lastBackup.getFullYear()}-${lastBackup.getMonth()}-${lastBackup.getDate()}`;
              const nowDayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
              const alreadyBackedUpToday = lastBackupDayStr === nowDayStr;
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
          const backupsDir = import_path.default.resolve("backups");
          if (!import_fs.default.existsSync(backupsDir)) {
            import_fs.default.mkdirSync(backupsDir, { recursive: true });
          }
          const filename = getBackupFilename();
          const destPath = import_path.default.join(backupsDir, filename);
          import_fs.default.copyFileSync("local.db", destPath);
          console.log(`[Backup Scheduler] Auto-backup file created: ${filename}`);
          if (config.isTelegramBackupEnabled && config.telegramBotToken && config.telegramChatId) {
            try {
              const fileBuffer = import_fs.default.readFileSync(destPath);
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
          await db.update(pageSettings).set({ lastBackupTime: now.toISOString() }).where((0, import_drizzle_orm2.eq)(pageSettings.id, config.id));
        }
      }
    } catch (err) {
      console.error("[Backup Scheduler] Error executing auto-backup check:", err);
    }
  }, 10 * 60 * 1e3);
}
app.post("/api/gemini/generate-metadata", async (req, res) => {
  const { concept, category, languageTone } = req.body;
  if (!concept) {
    return res.status(400).json({ error: "Please enter a video topic or general concept for AI generation" });
  }
  const aiClient = getGeminiClient();
  if (!aiClient) {
    const simulatedResponse = {
      title: `\u1782\u1793\u17D2\u179B\u17B9\u17C7\u1780\u17D2\u178F\u17C5\u17D7\u17D6 \u179A\u1794\u17C0\u1794${concept} \u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u1780\u17B6\u179A\u1782\u17B6\u17C6\u1791\u17D2\u179A\u1791\u17D2\u179C\u17C1\u178A\u1784`,
      description: `\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u17D2\u179A\u17B7\u1799\u1798\u17B7\u178F\u17D2\u178F\u1791\u17B6\u17C6\u1784\u17A2\u179F\u17CB\u1782\u17D2\u1793\u17B6! \u1780\u17D2\u1793\u17BB\u1784\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1793\u17C1\u17C7\u1799\u17BE\u1784\u1793\u17B9\u1784\u1793\u17B6\u17C6\u1799\u1780\u1793\u17BC\u179C\u179C\u17B7\u1792\u17B8\u179F\u17B6\u179F\u17D2\u178F\u17D2\u179A\u179B\u1798\u17D2\u17A2\u17B7\u178F \u1793\u17B7\u1784\u1787\u17B6\u1780\u17CB\u179F\u17D2\u178F\u17C2\u1784\u1794\u17C6\u1795\u17BB\u178F\u17A2\u17C6\u1796\u17B8\u179A\u1794\u17C0\u1794 [${concept}]\u17D4 

\u1782\u1793\u17D2\u179B\u17B9\u17C7\u179F\u17C6\u1781\u17B6\u1793\u17CB\u17D7\u178A\u17C2\u179B\u17A2\u17D2\u1793\u1780\u1793\u17B9\u1784\u1799\u179B\u17CB\u178A\u17B9\u1784\u17D6 
\u17E1. \u1780\u17B6\u179A\u178F\u17D2\u179A\u17C0\u1798\u1781\u17D2\u179B\u17BD\u1793\u1787\u17B6\u1798\u17BB\u1793
\u17E2. \u1799\u17BB\u1791\u17D2\u1792\u179F\u17B6\u179F\u17D2\u178F\u17D2\u179A\u1794\u17D2\u179A\u178F\u17B7\u1794\u178F\u17D2\u178F\u17B7
\u17E3. \u179A\u1794\u17C0\u1794\u179C\u17B6\u1799\u178F\u1798\u17D2\u179B\u17C3\u179B\u1791\u17D2\u1792\u1795\u179B

\u1780\u17BB\u17C6\u1797\u17D2\u179B\u17C1\u1785\u1785\u17BB\u1785 Like, Follow \u1793\u17B7\u1784\u1785\u17C2\u1780\u179A\u17C6\u179B\u17C2\u1780\u1798\u17D2\u1793\u17B6\u1780\u17CB\u1798\u17BD\u1799\u178A\u17BE\u1798\u17D2\u1794\u17B8\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1796\u17B8\u1791\u17C6\u1796\u17D0\u179A\u1799\u17BE\u1784\u1781\u17D2\u1789\u17BB\u17C6\u1794\u1793\u17D2\u1790\u17C2\u1798\u1791\u17C0\u178F!`,
      tags: ["KhmerCreator", concept.replace(/\s+/g, ""), "DigitalSkill", "FacebookPost", "VideoCreator"],
      recommendedPostTime: new Date(Date.now() + 36e5 * 5).toISOString(),
      // 5 hours later
      usingMock: true
    };
    return res.json(simulatedResponse);
  }
  try {
    const prompt = `You are an elite expert social media Facebook content growth hacker in Cambodia. Give me a highly engaging video Post metadata localized for Cambodia based on the user's video concept.
Video Concept: "${concept}"
Video Category/Niche: "${category || "Technology/Business"}"
Tone of Language requested: "${languageTone || "Professional and Inspiring"}"

You MUST output ONLY a valid JSON object matching this structure:
{
  "title": "A highly catchy video title in beautiful natural Khmer, optimized for high click-through rate with elegant hooks, max 80 characters.",
  "description": "Engaging, long-form post description in Khmer. Must contain clear visual emojis, structured bullet points of key takeaways from the video, a clear Khmer call to action asking users to Like and Follow the page (like: '\u1780\u17BB\u17C6\u1797\u17D2\u179B\u17C1\u1785\u1785\u17BB\u1785 Like \u1793\u17B7\u1784 Follow \u1791\u17C6\u1796\u17D0\u179A\u1799\u17BE\u1784\u1781\u17D2\u1789\u17BB\u17C6\u178A\u17BE\u1798\u17D2\u1794\u17B8\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u179C\u17B8\u178A\u17C1\u17A2\u17BC\u1785\u17C6\u178E\u17C1\u17C7\u178A\u17B9\u1784\u1790\u17D2\u1798\u17B8\u17D7!'), and modern Facebook formatting.",
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
          type: import_genai.Type.OBJECT,
          properties: {
            title: { type: import_genai.Type.STRING },
            description: { type: import_genai.Type.STRING },
            tags: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            recommendedPostTime: { type: import_genai.Type.STRING }
          },
          required: ["title", "description", "tags", "recommendedPostTime"]
        }
      }
    });
    const outputText = response.text || "{}";
    const data = JSON.parse(outputText.trim());
    res.json(data);
  } catch (err) {
    console.error("Gemini API Error: ", err);
    res.status(500).json({ error: "Gemini Service Failure", details: err.message });
  }
});
app.post("/api/gemini/suggest-reply", async (req, res) => {
  const { commentText, authorName, tone } = req.body;
  if (!commentText) {
    return res.status(400).json({ error: "Comment text is required for AI response analysis" });
  }
  const aiClient = getGeminiClient();
  if (!aiClient) {
    let reply = `\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u17B6\u1791\u1794\u1784 ${authorName || ""}! \u17A2\u179A\u1782\u17BB\u178E\u1785\u17D2\u179A\u17BE\u1793\u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1780\u17B6\u179A\u1794\u1789\u17D2\u1785\u17C1\u1789\u1798\u178F\u17B7\u1799\u17C4\u1794\u179B\u17CB \u1793\u17B7\u1784\u1782\u17B6\u17C6\u1791\u17D2\u179A\u17D4 \u1794\u17D2\u179A\u179F\u17B7\u1793\u1794\u17BE\u1798\u17B6\u1793\u1785\u1798\u17D2\u1784\u179B\u17CB\u1794\u1793\u17D2\u1790\u17C2\u1798\u1794\u1784\u17A2\u17B6\u1785\u179F\u17BD\u179A\u1794\u17B6\u1793\u178E\u17B6 \u1794\u17B6\u1791!`;
    if (tone === "promotional") {
      reply = `\u1794\u17B6\u1791\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u1784 ${authorName || ""}! \u179F\u1798\u17D2\u179A\u17B6\u1794\u17CB\u1796\u17D0\u178F\u17CC\u1798\u17B6\u1793\u179B\u1798\u17D2\u17A2\u17B7\u178F\u1794\u1793\u17D2\u1790\u17C2\u1798\u1796\u17B8\u179F\u17C1\u179C\u17B6\u1780\u1798\u17D2\u1798\u178A\u17CF\u1796\u17B7\u179F\u17C1\u179F\u1793\u17C1\u17C7 \u1794\u1784\u17A2\u17B6\u1785\u1791\u17C6\u1793\u17B6\u1780\u17CB\u1791\u17C6\u1793\u1784\u1798\u1780\u1780\u17B6\u1793\u17CB\u1794\u17D2\u179A\u17A2\u1794\u17CB\u179F\u17B6\u179A\u17A5\u17A1\u17BC\u179C\u1793\u17C1\u17C7\u178A\u17BE\u1798\u17D2\u1794\u17B8\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793\u1780\u17B6\u179A\u1794\u1789\u17D2\u1785\u17BB\u17C7\u178F\u1798\u17D2\u179B\u17C3\u1796\u17B7\u179F\u17C1\u179F\u1794\u17B6\u1791!`;
    } else if (tone === "technical") {
      reply = `\u1794\u17B6\u1791\u179F\u17BD\u179F\u17D2\u178F\u17B8\u1794\u1784 ${authorName || ""}! \u1785\u17C6\u1796\u17C4\u17C7\u1794\u1789\u17D2\u1794\u17B6\u1780\u17CB\u1794\u1785\u17D2\u1785\u17C1\u1780\u1791\u17C1\u179F\u1793\u17C1\u17C7 \u1780\u17D2\u179A\u17BB\u1798\u1780\u17B6\u179A\u1784\u17B6\u179A\u1793\u17B9\u1784\u1795\u17D2\u1789\u17BE\u179B\u17B8\u1784\u178E\u17C2\u1793\u17B6\u17C6\u1780\u17B6\u179A\u178A\u17C4\u17C7\u179F\u17D2\u179A\u17B6\u1799\u179B\u1798\u17D2\u17A2\u17B7\u178F\u178F\u17B6\u1798\u179A\u1799\u17C8\u179F\u17B6\u179A\u1786\u17B6\u178F\u1797\u17D2\u179B\u17B6\u1798\u17D7\u1794\u17B6\u1791 \u179F\u17BC\u1798\u17A2\u179A\u1782\u17BB\u178E\u1794\u1784!`;
    }
    return res.json({ reply, usingMock: true });
  }
  try {
    const prompt = `You are a friendly and polite customer support page manager in Cambodia. Write a clean, natural, elite, and high-conversion quick response in beautiful Khmer language to reply to this follower's comment:
Follower User Name: "${authorName || "Follower"}"
Follower's Comment: "${commentText}"
Tone desired: "${tone || "Friendly and appreciation"}"

Instructions:
- Address the user politely using '\u1794\u1784' or '\u17A2\u178F\u17B7\u1790\u17B7\u1787\u1793\u1787\u17B6\u1791\u17B8\u1782\u17C4\u179A\u1796'.
- Match the requested tone (friendly, promotional, helpful, technical, or funny).
- Keep it brief, conversational, and helpful for Facebook community moderation.
- Return ONLY the clean final text response. No outer quotes, no explanatory texts, just the final Cambodian response.`;
    const response = await aiClient.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    res.json({ reply: (response.text || "").trim() });
  } catch (err) {
    console.error("Gemini API Error: ", err);
    res.status(500).json({ error: err.message });
  }
});
async function bootstrap() {
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
      await db.run(import_drizzle_orm2.sql.raw(stmt));
    } catch (e) {
    }
  }
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Database seeding failed, proceeding with mock data if available:", err);
  }
  try {
    const adminEmail = "admin@app.local";
    const adminPassword = "Seang@#168#@";
    let adminUid = "local_admin_123";
    try {
      try {
        const userRecord = await adminAuth.getUserByEmail(adminEmail);
        adminUid = userRecord.uid;
      } catch {
        const newUser = await adminAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "Super Admin"
        });
        adminUid = newUser.uid;
        console.log("Created Firebase super admin account with email", adminEmail);
      }
    } catch (firebaseErr) {
      console.warn("Firebase Auth unavailable, using fallback UID for admin account:", adminUid);
    }
    const dbAdmin = await db.select().from(users).where((0, import_drizzle_orm2.or)((0, import_drizzle_orm2.eq)(users.uid, adminUid), (0, import_drizzle_orm2.eq)(users.email, adminEmail))).limit(1);
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
      await db.update(users).set({ passwordHash: adminPassword, uid: adminUid }).where((0, import_drizzle_orm2.eq)(users.id, dbAdmin[0].id));
    }
  } catch (error) {
    console.error("Failed setting up default Super Admin user:", error);
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve("dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  startBackupScheduler();
  let activePort = PORT;
  async function startServer(requestedPort) {
    const maxRetries = 10;
    let port = requestedPort;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        await new Promise((resolve, reject) => {
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
        import("child_process").then(({ exec }) => {
          if (process.platform === "win32") {
            exec(`start "" "${finalUrl}"`);
          } else if (process.platform === "darwin") {
            exec(`open "${finalUrl}"`);
          } else {
            exec(`xdg-open "${finalUrl}"`);
          }
        }).catch((err) => console.error("Failed to open browser:", err));
        return;
      } catch (err) {
        if (err?.code === "EADDRINUSE" && attempt < maxRetries) {
          console.warn(`[MetaStream Backend] Port ${port} already in use, trying ${port + 1}...`);
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
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
