import { createClient } from "@libsql/client";
const db = createClient({ url: "file:local.db" });
try {
  await db.execute(`ALTER TABLE page_settings ADD COLUMN footer_copyright_year TEXT`);
  console.log("✅ Added footer_copyright_year column");
} catch(e) {
  console.log("ℹ️ Column already exists or error:", String(e).split("\n")[0]);
}
db.close();
