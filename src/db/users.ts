import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

const userCache = new Map<string, { user: any; timestamp: number }>();

export function clearUserCache() {
  userCache.clear();
}

export async function getOrCreateUser(uid: string, email: string, name?: string, avatar?: string) {
  const cacheKey = `${uid}_${email}`;
  const cached = userCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 60000)) {
    return cached.user;
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      userCache.set(cacheKey, { user: existing[0], timestamp: Date.now() });
      return existing[0];
    }

    const result = await db.insert(users)
      .values({
        uid,
        email,
        name,
        avatar,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name,
          avatar,
        },
      })
      .returning();

    const userObj = result[0];
    userCache.set(cacheKey, { user: userObj, timestamp: Date.now() });
    return userObj;
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Database error during user registration.");
  }
}
