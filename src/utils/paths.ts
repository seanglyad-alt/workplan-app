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
    if (!fs.existsSync(renderDir)) {
      try { fs.mkdirSync(renderDir, { recursive: true }); } catch (e) {}
    }
    return renderDir;
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
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
}

export function getDbPath(): string {
  const dataDir = getAppDataDir();
  const targetDbPath = path.join(dataDir, "local.db");

  // Migration helper: If local.db does not exist in AppData, but exists in legacy locations (working dir or next to exe), copy it over!
  if (!fs.existsSync(targetDbPath)) {
    const legacyPaths = [
      path.resolve(process.cwd(), "local.db"),
      path.resolve(path.dirname(process.execPath), "local.db")
    ];

    for (const legacyPath of legacyPaths) {
      if (fs.existsSync(legacyPath) && legacyPath !== targetDbPath) {
        try {
          fs.copyFileSync(legacyPath, targetDbPath);
          console.log(`[Database Migration] Migrated legacy database from ${legacyPath} to safe AppData path: ${targetDbPath}`);
          break;
        } catch (e) {
          console.warn("[Database Migration] Failed migrating legacy db:", e);
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
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  return backupsDir;
}
