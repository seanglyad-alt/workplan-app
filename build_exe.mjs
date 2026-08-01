import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("==========================================");
console.log(" Building Standalone Executable for App ");
console.log("==========================================");

try {
  // Step 1: Vite Build
  console.log("\n[1/3] Building frontend with Vite...");
  execSync("node node_modules/vite/bin/vite.js build", { stdio: "inherit" });

  // Step 2: esbuild
  console.log("\n[2/3] Bundling backend with esbuild...");
  if (!fs.existsSync("build")) fs.mkdirSync("build");
  execSync("node node_modules/esbuild/bin/esbuild server.ts --bundle --platform=node --format=cjs --outfile=build/server.cjs --external:pg-native --external:better-sqlite3 --external:@libsql/client --external:vite --define:process.env.NODE_ENV=\\\"production\\\" --tree-shaking=true", { stdio: "inherit" });

  // Step 3: Configure package.json for pkg temporarily or just pass it via CLI
  console.log("\n[3/3] Packaging into .exe with pkg...");
  
  // Create a minimal package.json in the build directory for pkg to pick up the assets
  const pkgConfig = {
    "name": "facebook-app",
    "main": "server.cjs",
    "bin": "server.cjs",
    "pkg": {
      "assets": [
        "../dist/**/*"
      ]
    }
  };
  fs.writeFileSync("build/package.json", JSON.stringify(pkgConfig, null, 2));

  execSync("npx pkg build/package.json -t node18-win-x64 -o release/facebook-app.exe", { stdio: "inherit" });

  console.log("\n[SUCCESS] Standalone executable created at release/facebook-app.exe!");
} catch (error) {
  console.error("\n[ERROR] Build failed!");
  process.exit(1);
}
