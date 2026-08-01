import os
import shutil
import subprocess
import sys

def main():
    print("==================================================")
    print("Starting Facebook Video Scheduler & Analytics App")
    print("==================================================")
    
    # Get current working directory
    cwd = os.path.dirname(os.path.abspath(__file__))
    os.chdir(cwd)
    
    # 1. Setup .env file
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            print("[INFO] Creating .env file from .env.example...")
            shutil.copy(".env.example", ".env")
        else:
            print("[WARN] .env.example not found. Creating a blank .env file...")
            with open(".env", "w") as f:
                f.write("# Environment variables\n")
    
    # 2. Check for node_modules
    if not os.path.isdir("node_modules"):
        print("[INFO] node_modules not found. Installing dependencies...")
        try:
            subprocess.run("npm install", shell=True, check=True)
            print("[SUCCESS] Dependencies installed successfully.")
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Failed to install dependencies: {e}", file=sys.stderr)
            sys.exit(1)
            
    # 3. Start development server
    print("[INFO] Launching development server...")
    try:
        # Run tsx directly via node to bypass ampersand path bugs on Windows
        cmd = ["node", "node_modules/tsx/dist/cli.mjs", "server.ts"]
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping server...")
    except Exception as e:
        print(f"[ERROR] An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
