import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.ts';
import { getDbPath } from '../utils/paths.ts';

const dbFilePath = getDbPath();
const dbUrl = process.env.DATABASE_URL || `file:${dbFilePath}`;

export const client = createClient({
  url: dbUrl,
});

export const db = drizzle(client, { schema });

export async function initDbSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE, name TEXT, avatar TEXT, password_hash TEXT, role TEXT DEFAULT 'Editor', permissions TEXT, sex TEXT, dob TEXT, phone_number TEXT, department TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS video_posts (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, description TEXT, video_url TEXT, tags TEXT, status TEXT NOT NULL, scheduled_time TEXT, likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, shares_count INTEGER DEFAULT 0, views_count INTEGER DEFAULT 0, thumbnail_url TEXT, auto_reply_rule_id TEXT, category TEXT, aspect_ratio TEXT, facebook_post_id TEXT, facebook_error TEXT, carousel_slides TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES video_posts(id) ON DELETE CASCADE, post_title TEXT, author_name TEXT, author_avatar TEXT, comment_text TEXT NOT NULL, comment_timestamp TEXT NOT NULL, is_replied INTEGER DEFAULT 0, reply_text TEXT, is_auto_replied INTEGER DEFAULT 0);`,
    `CREATE TABLE IF NOT EXISTS auto_reply_rules (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), rule_name TEXT NOT NULL, trigger_keyword TEXT NOT NULL, condition TEXT NOT NULL, reply_template TEXT NOT NULL, is_active INTEGER DEFAULT 1, times_triggered INTEGER DEFAULT 0);`,
    `CREATE TABLE IF NOT EXISTS page_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, page_id TEXT, page_name TEXT, page_username TEXT, category TEXT, page_avatar TEXT, cover_image TEXT, followers_count INTEGER DEFAULT 0, likes_count INTEGER DEFAULT 0, is_auto_responder_enabled INTEGER DEFAULT 1, notification_schedules TEXT, report_logo TEXT, backup_schedule TEXT DEFAULT 'disabled', is_telegram_backup_enabled INTEGER DEFAULT 0, telegram_bot_token TEXT, telegram_chat_id TEXT, last_backup_time TEXT, backup_time TEXT DEFAULT '03:00', facebook_token TEXT, facebook_user_id TEXT, facebook_user_name TEXT, facebook_user_avatar TEXT, facebook_user_email TEXT, facebook_pages TEXT, page_access_token TEXT);`,
    `CREATE TABLE IF NOT EXISTS work_plan_pages (id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), name TEXT NOT NULL, is_protected INTEGER DEFAULT 0);`,
    `CREATE TABLE IF NOT EXISTS work_plan_platforms (id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), name TEXT NOT NULL, is_protected INTEGER DEFAULT 0);`,
    `CREATE TABLE IF NOT EXISTS work_plan_items (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, subtitle TEXT, post_type TEXT, content_type TEXT, page_id TEXT REFERENCES work_plan_pages(id), platform_id TEXT, week_number INTEGER, day_of_week TEXT, time_slot TEXT, status TEXT, notes TEXT, month TEXT);`,
    `CREATE TABLE IF NOT EXISTS monthly_plans (id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), name TEXT NOT NULL, name_kh TEXT, status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`,
    `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, message TEXT NOT NULL, type TEXT, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`
  ];

  for (const sqlStr of statements) {
    try {
      await client.execute(sqlStr);
    } catch (e) {
      console.warn("Table init warning:", e);
    }
  }
}

