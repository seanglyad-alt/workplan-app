import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// 1. Users table (linked to Firebase Auth UID)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  passwordHash: text("password_hash"),
  role: text("role").default("Editor"), // Admin, Editor, Moderator, Analyst
  permissions: text("permissions", { mode: "json" }).$defaultFn(() => []),
  sex: text("sex"),
  dob: text("dob"),
  phoneNumber: text("phone_number"),
  department: text("department"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 2. Video Posts
export const videoPosts = sqliteTable("video_posts", {
  id: text("id").primaryKey(), // Using text IDs to match existing frontend ids or generate new ones
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  tags: text("tags", { mode: "json" }).$defaultFn(() => []),
  status: text("status").notNull(), // draft, scheduled, publishing, published, failed
  scheduledTime: text("scheduled_time"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  viewsCount: integer("views_count").default(0),
  thumbnailUrl: text("thumbnail_url"),
  autoReplyRuleId: text("auto_reply_rule_id"),
  category: text("category"),
  aspectRatio: text("aspect_ratio"),
  facebookPostId: text("facebook_post_id"),
  facebookError: text("facebook_error"),
  carouselSlides: text("carousel_slides", { mode: "json" }), // Storing as JSON for flexibility
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 3. Comments
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").references(() => videoPosts.id, { onDelete: "cascade" }).notNull(),
  postTitle: text("post_title"),
  authorName: text("author_name"),
  authorAvatar: text("author_avatar"),
  text: text("comment_text").notNull(),
  timestamp: text("comment_timestamp").notNull(),
  isReplied: integer("is_replied", { mode: "boolean" }).default(false),
  replyText: text("reply_text"),
  isAutoReplied: integer("is_auto_replied", { mode: "boolean" }).default(false),
});

// 4. Auto Reply Rules
export const autoReplyRules = sqliteTable("auto_reply_rules", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("rule_name").notNull(),
  triggerKeyword: text("trigger_keyword").notNull(),
  condition: text("condition").notNull(), // contains, exact, started_with
  replyTemplate: text("reply_template").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  timesTriggered: integer("times_triggered").default(0),
});

// 5. Page Settings
export const pageSettings = sqliteTable("page_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  pageId: text("page_id"),
  pageName: text("page_name"),
  pageUsername: text("page_username"),
  category: text("category"),
  pageAvatar: text("page_avatar"),
  coverImage: text("cover_image"),
  followersCount: integer("followers_count").default(0),
  likesCount: integer("likes_count").default(0),
  isAutoResponderEnabled: integer("is_auto_responder_enabled", { mode: "boolean" }).default(true),
  notificationSchedules: text("notification_schedules", { mode: "json" }),
  reportLogo: text("report_logo"),
  backupSchedule: text("backup_schedule").default("disabled"), // disabled, daily, weekly, monthly
  isTelegramBackupEnabled: integer("is_telegram_backup_enabled", { mode: "boolean" }).default(false),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  lastBackupTime: text("last_backup_time"),
  backupTime: text("backup_time").default("03:00"),
  developerName: text("developer_name"),
  developerTelegramLink: text("developer_telegram_link"),
  footerAppName: text("footer_app_name"),
  footerCopyrightYear: text("footer_copyright_year"),
  footerCopyrightText: text("footer_copyright_text"),
  footerBadge1: text("footer_badge1"),
  footerBadge2: text("footer_badge2"),
  footerShowClock: integer("footer_show_clock", { mode: "boolean" }).default(true),
  footerShowDate: integer("footer_show_date", { mode: "boolean" }).default(true),
  footerIsSticky: integer("footer_is_sticky", { mode: "boolean" }).default(false),
  facebookToken: text("facebook_token"),
  facebookUserId: text("facebook_user_id"),
  facebookUserName: text("facebook_user_name"),
  facebookUserAvatar: text("facebook_user_avatar"),
  facebookUserEmail: text("facebook_user_email"),
  facebookPages: text("facebook_pages", { mode: "json" }),
  pageAccessToken: text("page_access_token"),
});

// 6. Work Plan Pages
export const workPlanPages = sqliteTable("work_plan_pages", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Made optional for now so Drizzle doesn't panic on existing data, but we'll populate it
  name: text("name").notNull(),
  isProtected: integer("is_protected", { mode: "boolean" }).default(false), // Demo pages cannot be deleted or edited
});

// 7. Work Plan Platforms
export const workPlanPlatforms = sqliteTable("work_plan_platforms", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  isProtected: integer("is_protected", { mode: "boolean" }).default(false), // Demo platforms cannot be deleted or edited
});

// 8. Work Plan Items
export const workPlanItems = sqliteTable("work_plan_items", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  postType: text("post_type"), // Posted, Scheduled, Draft, Idea
  contentType: text("content_type"), // Poster, Video, Carousel
  pageId: text("page_id").references(() => workPlanPages.id),
  platformId: text("platform_id"),
  weekNumber: integer("week_number"),
  dayOfWeek: text("day_of_week"), // Monday, Tuesday, etc.
  timeSlot: text("time_slot"),
  status: text("status"), // PLANNED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
  notes: text("notes"),
  month: text("month"), // e.g. 2026-06
});

// 9. Monthly Plans
export const monthlyPlans = sqliteTable("monthly_plans", {
  id: text("id").primaryKey(), // e.g. 2026-06
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  nameKh: text("name_kh"),
  status: text("status"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 10. Notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(videoPosts),
  rules: many(autoReplyRules),
  pageSettings: one(pageSettings, {
    fields: [users.id],
    references: [pageSettings.userId],
  }),
  workPlanItems: many(workPlanItems),
  notifications: many(notifications),
}));

export const videoPostsRelations = relations(videoPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [videoPosts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(videoPosts, {
    fields: [comments.postId],
    references: [videoPosts.id],
  }),
}));

export const workPlanItemsRelations = relations(workPlanItems, ({ one }) => ({
  user: one(users, {
    fields: [workPlanItems.userId],
    references: [users.id],
  }),
  page: one(workPlanPages, {
    fields: [workPlanItems.pageId],
    references: [workPlanPages.id],
  }),
}));
