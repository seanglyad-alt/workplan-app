/**
 * restore_from_backup.cjs
 * 
 * Use this script to restore a backup from Render to your local.db and seed.db.
 * 
 * Usage:
 *   node restore_from_backup.cjs "C:\path\to\backup_2026-08-03_15-37.sql"
 * 
 * Or without argument to auto-find the latest backup in the backups folder.
 */

const path = require('path');
const fs   = require('fs');

const projectDir = path.resolve(__dirname);
const localDb    = path.join(projectDir, 'local.db');
const seedDb     = path.join(projectDir, 'seed.db');
const backupsDir = path.join(projectDir, 'backups');

async function main() {
  // ── 1. Find the backup file ────────────────────────────────────
  let backupFile = process.argv[2];

  if (!backupFile) {
    // Auto-find latest backup in backups/ folder
    if (!fs.existsSync(backupsDir)) {
      console.error('❌ No backups folder found. Pass backup file path as argument.');
      process.exit(1);
    }
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('backup_') && (f.endsWith('.sql') || f.endsWith('.db')))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.error('❌ No backup files found in backups/ folder.');
      console.log('  Download a backup from Render first:');
      console.log('  → Open app → Admin Panel → Backup & Restore → Download');
      process.exit(1);
    }

    backupFile = path.join(backupsDir, files[0].name);
    console.log(`ℹ️  Auto-selected latest backup: ${files[0].name}`);
  }

  // ── 2. Validate the backup file ───────────────────────────────
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup file not found:', backupFile);
    process.exit(1);
  }

  const stats = fs.statSync(backupFile);
  console.log(`\n📁 Backup file: ${path.basename(backupFile)}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Verify it's a valid SQLite binary
  const header = Buffer.alloc(15);
  const fd = fs.openSync(backupFile, 'r');
  fs.readSync(fd, header, 0, 15, 0);
  fs.closeSync(fd);
  const isSQLite = header.toString('utf8', 0, 15) === 'SQLite format 3';
  if (!isSQLite) {
    console.error('❌ File is not a valid SQLite database file!');
    process.exit(1);
  }

  // ── 3. Preview what's in the backup ────────────────────────────
  const { createClient } = require('./node_modules/@libsql/client');
  const previewDb = createClient({ url: 'file:' + backupFile });
  
  console.log('\n📊 Data inside backup:');
  try {
    const months = await previewDb.execute("SELECT id, name, status FROM monthly_plans ORDER BY id");
    const byMonth = await previewDb.execute("SELECT month, COUNT(*) as cnt FROM work_plan_items GROUP BY month ORDER BY month");
    const total   = await previewDb.execute("SELECT COUNT(*) as cnt FROM work_plan_items");
    months.rows.forEach(r => console.log(`  📅 ${r.id}: ${r.name} [${r.status}]`));
    byMonth.rows.forEach(r => console.log(`     └─ ${r.month}: ${r.cnt} items`));
    console.log(`  Total items: ${total.rows[0].cnt}`);
  } catch(e) {
    console.error('  Could not read backup contents:', e.message);
    process.exit(1);
  }
  if (typeof previewDb.close === 'function') previewDb.close();

  // ── 4. Safety backup of current local.db ──────────────────────
  if (fs.existsSync(localDb)) {
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const safetyName = `pre_restore_safety_${new Date().toISOString().replace(/[:.]/g,'-')}.sql`;
    const safetyPath = path.join(backupsDir, safetyName);
    fs.copyFileSync(localDb, safetyPath);
    console.log(`\n💾 Safety backup saved: ${safetyName}`);
  }

  // ── 5. Restore to local.db ────────────────────────────────────
  console.log('\n🔄 Restoring to local.db...');
  fs.copyFileSync(backupFile, localDb);
  console.log('  ✅ local.db updated!');

  // ── 6. Restore to seed.db ─────────────────────────────────────
  console.log('🔄 Updating seed.db...');
  fs.copyFileSync(backupFile, seedDb);
  console.log('  ✅ seed.db updated!');

  // ── 7. Verify ─────────────────────────────────────────────────
  const verifyDb = createClient({ url: 'file:' + localDb });
  const vMonths  = await verifyDb.execute("SELECT id, name, status FROM monthly_plans ORDER BY id");
  const vTotal   = await verifyDb.execute("SELECT COUNT(*) as cnt FROM work_plan_items");
  if (typeof verifyDb.close === 'function') verifyDb.close();

  console.log('\n✅ Restore complete!');
  console.log('   Months:', vMonths.rows.map(r => `${r.id}(${r.status})`).join(', '));
  console.log('   Total items:', vTotal.rows[0].cnt);
  console.log('\n👉 Restart the app (run.bat or .exe) to see the updated data.');

  process.exit(0);
}

main().catch(e => {
  console.error('\n❌ Restore failed:', e.message);
  process.exit(1);
});
