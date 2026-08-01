import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log(" Building Standalone Executable for App ");
console.log("==========================================");

function makeExeGuiSilent(exePath) {
  console.log("\n[4/5] Patching PE Header to run silently without CMD window...");
  const buffer = fs.readFileSync(exePath);
  
  const peOffset = buffer.readUInt32LE(0x3C);
  if (buffer.readUInt32LE(peOffset) !== 0x00004550) {
    throw new Error("Invalid PE header");
  }
  
  const optionalHeaderOffset = peOffset + 24;
  const magic = buffer.readUInt16LE(optionalHeaderOffset);
  
  let subsystemOffset;
  if (magic === 0x020B || magic === 0x010B) {
    subsystemOffset = optionalHeaderOffset + 68;
  } else {
    throw new Error("Unknown PE magic: 0x" + magic.toString(16));
  }
  
  const currentSubsystem = buffer.readUInt16LE(subsystemOffset);
  console.log(`[INFO] Current PE Subsystem: ${currentSubsystem} (${currentSubsystem === 3 ? "Console/CUI" : "GUI"})`);
  
  if (currentSubsystem === 3) {
    buffer.writeUInt16LE(2, subsystemOffset);
    fs.writeFileSync(exePath, buffer);
    console.log(`[SUCCESS] Patched PE Subsystem to 2 (IMAGE_SUBSYSTEM_WINDOWS_GUI).`);
  } else {
    console.log(`[INFO] Executable is already set to GUI mode.`);
  }
}

function createIcoFile(pngPath, icoPath) {
  const pngBuf = fs.readFileSync(pngPath);
  const icoHeader = Buffer.from([0, 0, 1, 0, 1, 0]);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0);
  entry.writeUInt8(0, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12);
  const icoBuf = Buffer.concat([icoHeader, entry, pngBuf]);
  fs.writeFileSync(icoPath, icoBuf);
}

function createDesktopShortcut(releaseDir) {
  console.log("\n[5/5] Creating Windows Shortcut with Icon...");
  const exePath = path.resolve(releaseDir, "Facebook-Scheduler.exe");
  const icoPath = path.resolve(releaseDir, "icon.ico");
  const lnkPath = path.resolve(releaseDir, "Facebook Video Scheduler.lnk");
  
  const psScript = `
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut("${lnkPath.replace(/\\/g, "\\\\")}")
$sc.TargetPath = "${exePath.replace(/\\/g, "\\\\")}"
$sc.WorkingDirectory = "${releaseDir.replace(/\\/g, "\\\\")}"
$sc.IconLocation = "${icoPath.replace(/\\/g, "\\\\")}"
$sc.Save()
`;
  const psFile = path.resolve(releaseDir, "create_shortcut.ps1");
  fs.writeFileSync(psFile, psScript);
  try {
    execFileSync("powershell", ["-ExecutionPolicy", "Bypass", "-File", psFile], { stdio: "inherit" });
    fs.unlinkSync(psFile);
    console.log(`[SUCCESS] Created Windows Desktop Shortcut with custom icon at:\n${lnkPath}`);
  } catch (e) {
    console.warn("Could not create shortcut:", e.message);
  }
}

async function runBuild() {
  try {
    const nodeBin = process.execPath;
    const viteBin = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");
    const pkgBin = path.join(__dirname, "node_modules", "pkg", "lib-es5", "bin.js");
    const sourceIcon = path.join(__dirname, "release", "icon.png");

    // Copy icon to public dir for favicon
    const publicDir = path.join(__dirname, "public");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (fs.existsSync(sourceIcon)) {
      fs.copyFileSync(sourceIcon, path.join(publicDir, "icon.png"));
      fs.copyFileSync(sourceIcon, path.join(publicDir, "favicon.ico"));
    }

    // Step 1: Vite Build
    console.log("\n[1/5] Building frontend with Vite...");
    execFileSync(nodeBin, [viteBin, "build"], { stdio: "inherit", cwd: __dirname });

    // Step 2: esbuild
    console.log("\n[2/5] Bundling backend with esbuild...");
    const buildDir = path.join(__dirname, "build");
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

    const serverTs = path.join(__dirname, "server.ts");
    const serverCjs = path.join(buildDir, "server.cjs");
    const shimPath = path.join(__dirname, "src", "shims", "diagnostics_channel.js");

    await esbuild.build({
      entryPoints: [serverTs],
      bundle: true,
      platform: "node",
      target: "node18",
      format: "cjs",
      outfile: serverCjs,
      external: [
        "pg-native",
        "better-sqlite3",
        "vite",
        "@libsql/win32-x64-msvc"
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      plugins: [
        {
          name: "diagnostics-channel-shim",
          setup(build) {
            build.onResolve({ filter: /^node:diagnostics_channel$|^diagnostics_channel$/ }, args => {
              return { path: shimPath };
            });
          }
        }
      ],
      treeShaking: true
    });

    // Step 3: Packaging into .exe with pkg
    console.log("\n[3/5] Packaging into .exe with pkg...");
    const releaseDir = path.join(__dirname, "release");
    if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true });

    const pkgConfig = {
      "name": "facebook-app",
      "main": "server.cjs",
      "bin": "server.cjs",
      "pkg": {
        "assets": [
          "../dist/**/*",
          "../node_modules/@libsql/**/*",
          "../node_modules/libsql/**/*"
        ]
      }
    };
    const pkgJsonPath = path.join(buildDir, "package.json");
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgConfig, null, 2));

    const outputExe = path.join(releaseDir, "facebook-app.exe");
    const schedulerExe = path.join(releaseDir, "Facebook-Scheduler.exe");

    execFileSync(nodeBin, [
      pkgBin,
      pkgJsonPath,
      "-t", "node18-win-x64",
      "-o", outputExe
    ], { stdio: "inherit", cwd: __dirname });

    // Patch PE header to GUI mode for silent execution
    makeExeGuiSilent(outputExe);

    // Create named executable
    fs.copyFileSync(outputExe, schedulerExe);

    // Step 5: Create Icon & Windows Shortcut
    if (fs.existsSync(sourceIcon)) {
      const icoPath = path.join(releaseDir, "icon.ico");
      createIcoFile(sourceIcon, icoPath);
      createDesktopShortcut(releaseDir);
    }

    console.log("\n==========================================");
    console.log("[SUCCESS] Silent standalone application ready at:");
    console.log(schedulerExe);
    console.log("==========================================");
  } catch (error) {
    console.error("\n[ERROR] Build failed!", error);
    process.exit(1);
  }
}

runBuild();
