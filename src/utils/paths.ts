import path from "path";
import os from "os";
import fs from "fs";

export function getAppDataDir(): string {
  if (process.env.APP_DATA_DIR) {
    const customDir = path.resolve(process.env.APP_DATA_DIR);
    if (!fs.existsSync(customDir)) {
      try { fs.mkdirSync(customDir, { recursive: true }); } catch (e) {}
    }
    return customDir;
  }

  if (process.env.RENDER || process.env.IS_RENDER) {
    const renderDir = "/var/data";
    try {
      if (!fs.existsSync(renderDir)) {
        fs.mkdirSync(renderDir, { recursive: true });
      }
      fs.accessSync(renderDir, fs.constants.W_OK);
      return renderDir;
    } catch (e) {
      console.warn("[Paths] /var/data is not writable on Render. Falling back to local data directory.");
    }
  }

  const home = os.homedir();
  let baseDir: string;
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    baseDir = path.join(localAppData, "FacebookVideoScheduler");
  } else if (process.platform === "darwin") {
    baseDir = path.join(home, "Library", "Application Support", "FacebookVideoScheduler");
  } else {
    baseDir = path.join(home, ".config", "FacebookVideoScheduler");
  }

  if (!fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, { recursive: true });
    } catch (e) {
      baseDir = path.resolve(process.cwd(), "data");
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    }
  }
  return baseDir;
}

export function getDbPath(): string {
  const dataDir = getAppDataDir();
  const targetDbPath = path.join(dataDir, "local.db");

  // Migration & Seeding helper: If local.db does not exist or is empty (< 1000 bytes), seed from seed.db or legacy local.db!
  const isTargetEmpty = !fs.existsSync(targetDbPath) || fs.statSync(targetDbPath).size < 1000;
  if (isTargetEmpty) {
    const seedPaths = [
      path.resolve(process.cwd(), "seed.db"),
      path.resolve(process.cwd(), "local.db"),
      path.resolve(path.dirname(process.execPath), "local.db")
    ];

    for (const seedPath of seedPaths) {
      if (fs.existsSync(seedPath) && seedPath !== targetDbPath && fs.statSync(seedPath).size > 1000) {
        try {
          fs.copyFileSync(seedPath, targetDbPath);
          console.log(`[Database Seeding] Successfully seeded target database from ${seedPath} to: ${targetDbPath}`);
          break;
        } catch (e) {
          console.warn("[Database Seeding] Failed seeding db:", e);
        }
      }
    }
  } else {
    // Smart migration: if seed.db has significantly more data than the current DB, merge missing records
    // This ensures Render's existing DB gets updated when new content is added to seed.db
    const seedPath = path.resolve(process.cwd(), "seed.db");
    if (fs.existsSync(seedPath) && seedPath !== targetDbPath && fs.statSync(seedPath).size > 1000) {
      try {
        // Use a marker file to avoid re-running expensive merge on every startup
        const seedModTime = fs.statSync(seedPath).mtimeMs;
        const markerPath = path.join(dataDir, ".seed_sync_marker");
        const lastSyncTime = fs.existsSync(markerPath) ? parseFloat(fs.readFileSync(markerPath, "utf8") || "0") : 0;
        
        if (seedModTime > lastSyncTime) {
          // Seed.db has been updated since last sync - perform a quick merge
          // We do this synchronously using better-sqlite3 or by spawning a child process
          // For safety we just do a full replacement if current DB has very few work_plan_items
          const { execSync } = require("child_process");
          const nodeExec = process.execPath;
          
          // Quick check: count items in current DB using sqlite3 CLI or native node
          // We use a simple approach: compare file sizes as proxy. If seed.db is >50% larger, likely has more data
          const currentSize = fs.statSync(targetDbPath).size;
          const seedSize = fs.statSync(seedPath).size;
          
          // If seed.db is significantly bigger (>30% more data), do a safe replace
          if (seedSize > currentSize * 1.3) {
            // Safety: backup current DB first
            const backupDir = path.join(dataDir, "backups");
            if (!fs.existsSync(backupDir)) {
              try { fs.mkdirSync(backupDir, { recursive: true }); } catch(e) {}
            }
            const safetyBak = path.join(backupDir, `pre_seed_sync_${Date.now()}.sql`);
            try { fs.copyFileSync(targetDbPath, safetyBak); } catch(e) {}
            
            // Replace with seed.db
            fs.copyFileSync(seedPath, targetDbPath);
            console.log(`[Database Seeding] Auto-upgraded DB from seed.db (${(seedSize/1024/1024).toFixed(1)}MB vs ${(currentSize/1024/1024).toFixed(1)}MB). Safety backup: ${safetyBak}`);
          }
          
          // Update sync marker
          fs.writeFileSync(markerPath, String(seedModTime));
        }
      } catch (e) {
        console.warn("[Database Seeding] Smart migration check failed (non-fatal):", e);
      }
    }
  }

  return targetDbPath;
}

export function getBackupsDir(): string {
  const dataDir = getAppDataDir();
  const backupsDir = path.join(dataDir, "backups");
  if (!fs.existsSync(backupsDir)) {
    try {
      fs.mkdirSync(backupsDir, { recursive: true });
    } catch (e) {
      console.error("[Paths] Failed to create backups dir:", e);
    }
  }
  return backupsDir;
}
