<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=160&section=header&text=NeuroCode%20Execution%20Guide&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Local%20Development%20Environment%20Setup&descAlignY=62&descSize=16&descColor=D4AF37"/>
<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=16&duration=2800&pause=1000&color=00A676&center=true&vCenter=true&width=650&lines=Piston+API+%2B+FastAPI+Backend+%2B+Vite+Frontend;Windows+%2B+WSL2+%2B+Docker+Workflow" alt="Typing SVG"/>
</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=2" width="100%"/>

<div align="center">

## Overview

Running NeuroCode locally requires **four terminals**, each dedicated to a specific service.

[Terminal 1 Piston API (WSL2 + Docker)](#terminal-1) &nbsp;•&nbsp;
[Terminal 2 FastAPI Backend](#terminal-2) &nbsp;•&nbsp;
[Terminal 3 Vite Frontend](#terminal-3) &nbsp;•&nbsp;
[Terminal 4 Optional (Testing / Git / Logs)](#terminal-4) &nbsp;•&nbsp;
[Project Architecture](#project-architecture) &nbsp;•&nbsp;
[Important Notes](#important-notes) &nbsp;•&nbsp;
[Shutdown](#shutdown) &nbsp;•&nbsp;
[First Startup Checklist](#first-startup-checklist) &nbsp;•&nbsp;
[Deployment Architecture](#deployment-architecture) &nbsp;•&nbsp;
[References](#references)

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

<div align="center">

<a id="terminal-1"></a>
## Terminal 1 Starting Piston (WSL2)

</div>

### Step 1 Start Docker Desktop

**PowerShell (Windows):**

```powershell
docker desktop start
```

**Expected:**
> ✓ Starting Docker Desktop

> **Note:** Wait until Docker Desktop is fully started before proceeding.

### Step 2 Verify Docker Desktop

**PowerShell (Windows):**

```powershell
docker desktop status
```
**Expected:**
>Status : running

---

### Step 3 Open WSL

**PowerShell (Windows):**

```powershell
wsl
```

This launches the Bash environment all following commands in Terminal 1 run inside WSL.

---

### Step 4 Navigate to the Piston Directory

**Bash (WSL2):**

```bash
cd ~/piston
```

Verify:

```bash
pwd
```

**Expected:**
>/home/mibrahim/piston

---

## Step 5 Start Piston

```bash
docker compose up -d
```

**Expected:**
>Container piston_api Started

---

## Step 6 Verify Installed Runtimes

```bash
curl http://localhost:2000/api/v2/runtimes
```

Expected:

```json
[
  {
    "language": "python",
    "version": "3.12.0"
  },
  {
    "language": "javascript",
    "version": "20.11.1"
  },
  {
    "language": "c",
    "version": "10.2.0"
  }
]
```

If all runtimes appear, Piston is ready.
> **Only proceed to the Backend after this check passes.**

<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-2"></a>
## Terminal 2 Backend

</div>

**PowerShell (Windows):**

```powershell
cd backend
```

**Create the virtual environment (first-time setup only):**

```powershell
python -m venv venv
```

Activate the environment:

```powershell
venv\Scripts\activate
```

**Install dependencies (first-time setup, and any time `requirements.txt` changes):**

```powershell
pip install -r requirements.txt
```

Run the backend:

```powershell
uvicorn app.main:app --reload --port 8000
```

**Expected:**
>Application startup complete.

Backend URL:
```
http://localhost:8000
```

> **Note:** You only need to re-run `pip install -r requirements.txt` when dependencies change — not on every startup.

<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-3"></a>
## Terminal 3 Frontend

</div>

**PowerShell (Windows):**

```powershell
cd frontend
```

**Install dependencies (first-time setup, and any time `package.json` changes):**

```powershell
npm install
```

Run:

```powershell
npm run dev
```

**Expected:**
```
http://localhost:5173
```

> **Note:** You only need to re-run `npm install` when dependencies change — not on every startup.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-4"></a>
## Terminal 4 Optional (Testing / Git / Logs)

</div>

**Bash (WSL2):**

```bash
docker logs piston_api
```

```bash
docker ps
```

```bash
git status
```
<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>
 

<a id="project-architecture"></a>
## Project Architecture

</div>

```
VS Code
│
├── Frontend (Vite)
│      localhost:5173
│
├── Backend (FastAPI)
│      localhost:8000
│
└── Piston API (Docker + WSL2)
       localhost:2000
```
**Communication Flow**

```
Frontend
   │
   └──▶ Backend
           │
           ▼
        Piston API
           │
           ▼
        Python Runtime
```

<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="important-notes"></a>
## Important Notes

</div>

### 1. Docker First
Always start Docker Desktop before opening WSL.

### 2. Always Verify Piston
```bash
curl http://localhost:2000/api/v2/runtimes
```

### 3. Permanent Fix Applied
Previously, Piston's runtime list would occasionally return empty (`[]`) after a restart, requiring `docker-compose up -d --force-recreate api` as a workaround. This was traced to bind-mount timing behavior on container redeploy — the runtime directory wasn't always available before Piston initialized.

**This issue has been permanently resolved** by:
- Replacing the bind mount (`./data/piston/packages:/piston/packages`) with a **Docker named volume** (`piston_packages:/piston/packages`)
- Changing the restart policy from `restart: always` to `restart: unless-stopped`
- Migrating existing runtime packages into the new named volume

As a result, empty runtime output no longer occurs during normal startup. `--force-recreate` is no longer required or recommended as a routine step.

### 4. If Empty Output Still Occurs (Rare, Post-Fix)
This should not happen under normal conditions anymore, but if it does, follow these steps in order — do not jump straight to recreating the container:

**Step 1 — Restart the container**
```bash
docker restart piston_api
```
Wait 2–3 seconds.

**Step 2 — Verify again**
```bash
curl http://localhost:2000/api/v2/runtimes
```

**Step 3 — If still empty, recreate only the container**
```bash
docker rm -f piston_api
docker compose up -d
```

**Step 4 — Verify again**
```bash
curl http://localhost:2000/api/v2/runtimes
```

If the issue persists even after Step 3–4, treat it as a new/different problem — not the original bind-mount issue — and investigate separately (check Docker Desktop status, WSL resources, or volume integrity) rather than reapplying the old workaround.

### 5. Backend Environment Variable

`.env`:

```env
PISTON_API=http://localhost:2000/api/v2
```

No code changes are required — the backend already reads this URL from the environment configuration.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="shutdown"></a>
## Shutdown

**Backend / Frontend:**

```
Ctrl + C
```
(Run in both the Backend and Frontend terminals)

**Piston:**

```bash
docker-compose down
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="first-startup-checklist"></a>
## First Startup Checklist

- [ ] Docker Desktop Running
- [ ] WSL Opened
- [ ] `docker-compose up -d api`
- [ ] `curl http://localhost:2000/api/v2/runtimes`
- [ ] Backend venv created (`python -m venv venv`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend Running
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend Running

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="deployment-architecture"></a>

## Deployment Architecture

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

This section maps each of the three development terminals to its production equivalent — what changes, what stays the same, and why.

---

### Development (Current 3 Terminals)
 
<div align="center">
<pre>
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT (Your Machine)                  │
│                                                                 │
│  Terminal 1          Terminal 2          Terminal 3             │
│  ┌──────────┐        ┌──────────┐        ┌────────┐             │
│  │  Piston  │        │ Backend  │        │Frontend│             │
│  │  Docker  │◄──────►│ FastAPI  │◄──────►│  Vite  │             │
│  │  (WSL2)  │  HTTP  │ Uvicorn  │  HTTP  │  Dev   │             │
│  │          │        │ --reload │        │ Server │             │
│  └──────────┘        └──────────┘        └────────┘             │
│  :2000                :8000               :5173                │
└─────────────────────────────────────────────────────────────────┘

</pre>
</div>

All three processes run on `localhost`, communicating over plain HTTP on different ports. Each needs its own terminal because each is a separate, long-running, blocking process (different language runtime, different lifecycle) — not an architectural requirement, just a dev-workflow one.

---

<div align="center">

### Production (Target Deployment)

<div align="center">
<pre>
┌────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION                              │
│                                                                    │
│   Vercel                    Railway                                │
│  ┌──────────┐         ┌──────────────────┐                         │
│  │ Frontend │  HTTPS  │     Backend      │                         │
│  │ (static  │────────►│  FastAPI/Uvicorn │                         │
│  │  build)  │         │  (managed,always │                         │
│  │          │         │  on,auto-restart)│                         │
│  └──────────┘         └─────────┬────────┘                         │
│  CDN-served                     │ HTTP (internal)                  │
│  no server                      ▼                                  │
│                        ┌──────────────────┐                        │
│                        │      Piston      │      Railway (or       │
│                        │  Docker container│     dedicated Linux VM │
│                        │  (Linux-native,  │                        │
│                        │ no WSL2 involved)│                        │
│                        └──────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘
</pre>
</div>

---

### Terminal → Production Mapping

| Dev (Terminal)                          | Production Equivalent                                                                 |
|------------------------------------------|-----------------------------------------------------------------------------------------|
| **Terminal 3**  Vite dev server          | Gone entirely. `npm run build` → static HTML/CSS/JS, served by **Vercel** behind a CDN. No Node process running in production. |
| **Terminal 2**  `uvicorn --reload`       | Same Uvicorn command, minus `--reload`, run as a **Railway-managed process**. Railway restarts it automatically on crash. |
| **Terminal 1**  Piston (WSL2 Docker)     | Same Docker image, deployed as a container on **Railway** (or a dedicated small Linux VM) — not on a personal Windows/WSL2 machine. |

In production there are no terminals in the everyday sense — all three become background services managed by a hosting platform, which starts them, restarts them on crash, and exposes logs through a dashboard instead of a terminal window.

</div>

---

### Why Moving Piston Off WSL2 Matters

The empty-runtimes bug (`[]` from `/api/v2/runtimes`) was rooted in a **bind-mount + `restart: always` race condition specific to WSL2's boot sequence** — the mounted volume wasn't always ready before Piston's one-time runtime scan ran.

Deploying Piston to Railway (or a Linux VM) removes this entire class of problem — not because the code changes, but because the host stops being the Windows↔Linux bridge that caused the race in the first place. Linux-native hosting has no WSL2 boot cycle to race against.

The **named volume + `restart: unless-stopped` fix** (see Permanent Fix section) still applies and is carried into the production Docker Compose/config as-is it's not a dev-only fix, it's the correct config regardless of host.

---

### Environment Variable Switch (Dev → Prod)

Only URLs change the communication mechanism (HTTP) stays identical. This is why every service reads these as env vars instead of hardcoding `localhost`.

| Variable              | Development                          | Production                                  |
|------------------------|----------------------------------------|-----------------------------------------------|
| `VITE_BACKEND_URL`     | `http://localhost:8000`               | `https://your-app.up.railway.app`             |
| `PISTON_API`           | `http://localhost:2000/api/v2`        | Internal Railway service URL / private network address |

Switching environments is a **config change, not a code change**.

---

### Summary

- **Dev:** 3 terminals, all `localhost`, manually started/watched.
- **Prod:** 2 managed services (Backend, Piston) on Railway + 1 static site (Frontend) on Vercel CDN. No terminals, no manual restarts, dashboard-based logs.
- The Piston bind-mount race condition is a **Windows/WSL2-specific problem** it does not exist on Railway's Linux-native environment, independent of the permanent fix already applied.

<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="references"></a>
## References

</div>

- [Docker Mounted Folder Becomes Empty After Redeploy Oscar's Notebook](https://oscarchou.com/posts/troubleshoot/docker-compose-mount-empty-after-redeploy/)
- [Piston Configuration Documentation](https://piston.readthedocs.io/en/latest/configuration/)

<div align="center">
<sub>© 2026 AbstractMinds. All rights reserved.</sub>
<br/>
<sub>This execution guide is configured for the local development machine of <b>Muhammad Ibrahim</b> (Team Lead) paths, ports, and environment values may differ on other developers' machines.</sub>
</div>
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=2" width="90%"/>
</p>
<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=100&section=footer"/>
</div>
