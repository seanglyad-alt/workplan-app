/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  PUBLISHING = "publishing",
  PUBLISHED = "published",
  FAILED = "failed",
}

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  linkUrl: string;
  ctaText: string;
}

export interface VideoPost {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // url or base64 or placeholder
  tags: string[];
  status: PostStatus;
  scheduledTime: string; // ISO string
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  thumbnailUrl: string;
  autoReplyRuleId?: string;
  category: string;
  aspectRatio?: string;
  createdAt: string;
  carouselSlides?: CarouselSlide[];
  facebookPostId?: string;
  facebookError?: string;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  isReplied: boolean;
  replyText?: string;
  isAutoReplied?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Moderator" | "Analyst";
  avatar: string;
  permissions?: string[];
  sex?: string;
  dob?: string;
  phoneNumber?: string;
  department?: string;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  triggerKeyword: string;
  condition: "contains" | "exact" | "started_with";
  replyTemplate: string;
  isActive: boolean;
  timesTriggered: number;
}

export interface AnalyticsData {
  viewsOverTime: { date: string; views: number; minutesWatched: number }[];
  retentionCurve: { percent: number; seconds: number }[];
  audienceDemographics: { group: string; value: number }[];
  engagementMetrics: { metric: string; count: number; change: number }[];
  growthTrend: { date: string; followers: number; reach: number }[];
}

export interface PageSettings {
  pageId: string;
  pageName: string;
  pageUsername: string;
  category: string;
  pageAvatar: string;
  coverImage: string;
  followersCount: number;
  likesCount: number;
  isAutoResponderEnabled: boolean;
  notificationSchedules: {
    notifyOnComment: boolean;
    notifyOnReply: boolean;
    notifyOnPostPublished: boolean;
    notifyOnFailure: boolean;
    weeklyEmailReport: boolean;
    quietHoursStart: string; // HH:MM
    quietHoursEnd: string; // HH:MM
  };
  reportLogo?: string;
  companyName?: string;
  companySlogan?: string;
  backupSchedule?: string;
  isTelegramBackupEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  lastBackupTime?: string | null;
  backupTime?: string;
  developerName?: string;
  developerTelegramLink?: string;
  footerAppName?: string;
  footerCopyrightText?: string;
  footerBadge1?: string;
  footerBadge2?: string;
  footerShowClock?: boolean;
  footerShowDate?: boolean;
  footerIsSticky?: boolean;
}

export interface WorkPlanItem {
  id: string;
  title: string;
  subtitle?: string;
  postType: "Posted" | "Scheduled" | "Draft" | "Idea";
  contentType: "Poster" | "Video" | "Carousel";
  pageId: string;
  platformId: string;
  weekNumber: number;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlot: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  notes?: string;
  month?: string; // e.g. "June 2026" or "2026-06"
  createdBy?: { name: string; avatar: string; email: string } | null;
}

export interface WorkPlanPage {
  id: string;
  name: string;
  isProtected?: boolean; // Demo pages cannot be deleted or edited
}

export interface WorkPlanPlatform {
  id: string;
  name: string;
  isProtected?: boolean; // Demo platforms cannot be deleted or edited
}

export interface WorkPlanMonth {
  id: string;
  name: string;
  nameKh: string;
  status: "COMPLETED" | "IN_PROGRESS";
}

