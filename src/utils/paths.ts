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
