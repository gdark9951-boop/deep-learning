import subprocess
import webbrowser
import os
import sys
import time
import shutil

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_path = os.path.join(project_root, "backend")
frontend_path = os.path.join(project_root, "frontend")
venv_python = os.path.join(project_root, ".venv", "Scripts", "python.exe")

# Auto-detect npm (works on any machine)
npm_path = shutil.which("npm") or r"C:\Program Files\nodejs\npm.cmd"

def kill_port(port):
    """Kill any process using the given port (Windows)."""
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                parts = line.strip().split()
                pid = parts[-1]
                if pid.isdigit():
                    subprocess.run(["taskkill", "/PID", pid, "/F"],
                                   capture_output=True)
                    print(f"  [!] Freed port {port} (killed PID {pid})")
    except Exception as e:
        print(f"  [!] Could not free port {port}: {e}")

print("=" * 50)
print("  Cyber IDS Platform - Starting Servers")
print("=" * 50)

# Free ports before starting
print("\nChecking ports...")
kill_port(8000)
kill_port(3000)
time.sleep(1)

# Start backend (FastAPI)
print("\n[1/2] Starting FastAPI backend on http://localhost:8000 ...")
backend_proc = subprocess.Popen(
    [venv_python, "-m", "uvicorn", "main:app",
     "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=backend_path,
)

time.sleep(3)

# Start frontend (Next.js)
print("[2/2] Starting Next.js frontend on http://localhost:3000 ...")
frontend_proc = subprocess.Popen(
    [npm_path, "run", "dev"],
    cwd=frontend_path,
)

time.sleep(5)

# Open browser
print("\n✓ Opening browser at http://localhost:3000\n")
webbrowser.open("http://localhost:3000")

print("Press Ctrl+C to stop both servers.\n")

# Monitor both servers
try:
    while True:
        if backend_proc.poll() is not None:
            print("[ERROR] Backend server stopped unexpectedly!")
            frontend_proc.terminate()
            sys.exit(1)
        if frontend_proc.poll() is not None:
            print("[ERROR] Frontend server stopped unexpectedly!")
            backend_proc.terminate()
            sys.exit(1)
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down servers...")
    backend_proc.terminate()
    frontend_proc.terminate()
    print("Done. Goodbye!")
    sys.exit(0)
