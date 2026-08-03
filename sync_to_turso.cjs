/**
 * sync_local_to_turso.cjs
 * 
 * Syncs all data from local.db → Turso cloud database.
 * Run this any time you update local and want Turso to get the latest.
 * 
 * Render (online) reads from Turso → always up to date!
 */
const path = require('path');
const projectDir = 'f:\\05-USRV Group\\Work Plan\u200b App\\facebook-video-scheduler-&-analytics';
const { createClient } = require(path.join(projectDir, 'node_modules', '@libsql', 'client'));
const fs = require('fs');

const tursoUrl   = 'libsql://workplan-db-seanglyad-alt.aws-ap-south-1.turso.io';
const tursoToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU3NDE5NjgsImlkIjoiMDE5ZmM2ODMtZDIwMS03ZjQ3LTkxZDktMzIzYzNmMDIwODFlIiwia2lkIjoiV2dFeEZIMktadnhSdW5OUm1UUkNOdHBlNGhsRE1XS0xfV1NMSmtibDlSMCIsInJpZCI6ImI4ZmZhMmUyLTEyOTYtNDZjMC04YmQ0LTQ2MzFmNWI4Yjk2NiJ9.dmlo6FM9MFACffgEhupCQPIInmr9-1Gm1LzYwiytqunO4R_ePeXnZmOyKqJ3BaF6Jxp0YI9zphI3zB6jhxSfCQ';
const localDbPath = path.join(projectDir, 'local.db');

async function sync() {
  const localDb = createClient({ url: 'file:' + localDbPath });
  const tursoDb = createClient({ url: tursoUrl, authToken: tursoToken });

  console.log('=== Syncing local.db → Turso ===\n');

  await tursoDb.execute("PRAGMA foreign_keys = OFF;");

  const tables = [
    { name: 'users',               cols: ['id','uid','email','name','avatar','password_hash','role','permissions','sex','dob','phone_number','department','created_at'] },
    { name: 'work_plan_pages',     cols: ['id','user_id','name','is_protected'] },
    { name: 'work_plan_platforms', cols: ['id','user_id','name','is_protected'] },
    { name: 'monthly_plans',       cols: ['id','user_id','name','name_kh','status','created_at'] },
    { name: 'work_plan_items',     cols: ['id','user_id','title','subtitle','post_type','content_type','page_id','platform_id','week_number','day_of_week','time_slot','status','notes','month'] },
    { name: 'page_settings',       cols: ['id','user_id','page_id','page_name','is_telegram_backup_enabled','telegram_bot_token','telegram_chat_id','backup_schedule','backup_time','last_backup_time'] },
  ];

  for (const t of tables) {
    const rows = await localDb.execute(`SELECT * FROM ${t.name}`);
    let added = 0, updated = 0;
    for (const row of rows.rows) {
      const vals = t.cols.map(c => row[c] !== undefined ? row[c] : null);
      const placeholders = t.cols.map(() => '?').join(', ');
      try {
        await tursoDb.execute({
          sql: `INSERT OR REPLACE INTO ${t.name} (${t.cols.join(', ')}) VALUES (${placeholders})`,
          args: vals
        });
        added++;
      } catch(e) {
        console.warn(`  ⚠️  ${t.name} row failed:`, e.message.substring(0,80));
      }
    }
    console.log(`  ✅ ${t.name}: synced ${added} rows`);
  }

  await tursoDb.execute("PRAGMA foreign_keys = ON;");

  // Final verify
  const total = await tursoDb.execute("SELECT COUNT(*) as cnt FROM work_plan_items");
  const byMonth = await tursoDb.execute("SELECT month, COUNT(*) as cnt FROM work_plan_items GROUP BY month ORDER BY month");
  console.log('\n=== Turso final state ===');
  byMonth.rows.forEach(r => console.log(`  ${r.month}: ${r.cnt} items`));
  console.log(`  Total: ${total.rows[0].cnt} items`);
  console.log('\n✅ Sync complete! Render will now read from Turso.');

  if (typeof localDb.close === 'function') localDb.close();
  if (typeof tursoDb.close === 'function') tursoDb.close();
  process.exit(0);
}

sync().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
