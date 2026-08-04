<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=160&section=header&text=NeuroCode%20Execution%20Guide&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Local%20Development%20Environment%20Setup&descAlignY=62&descSize=16&descColor=D4AF37"/>
<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=16&duration=2800&pause=1000&color=00A676&center=true&vCenter=true&width=650&lines=Piston+API+%2B+FastAPI+Backend+%2B+Vite+Frontend;Windows+%2B+WSL2+%2B+Docker+Workflow" alt="Typing SVG"/>
</div>
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=2" width="100%"/>

<div align="center">

## Overview

Running NeuroCode locally requires **five terminals**, each dedicated to a specific service.

| Terminal | Purpose | Jump To |
|---|---|:---:|
| Terminal 1 | Piston API (WSL2 + Docker) | [Go →](#terminal-1) |
| Terminal 2 | FastAPI Backend | [Go →](#terminal-2) |
| Terminal 3 | Realtime Server (Node.js + Socket.io) | [Go →](#terminal-3) |
| Terminal 4 | Vite Frontend | [Go →](#terminal-4) |
| Terminal 5 | Optional (Testing / Git / Logs) | [Go →](#terminal-5) |

</div>

<div align="center">

<a id="terminal-1"></a>
## Terminal 1 Starting Piston (WSL2)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

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

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

</div>

**PowerShell (Windows):**

```powershell
cd backend
```

Activate the environment:

```powershell
venv\Scripts\activate
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
<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-3"></a>
## Terminal 3 Realtime Server

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

</div>

**PowerShell (Windows):**

```powershell
cd realtime
```

Run:

```powershell
npm run dev
```

**Expected:**

```
> neurocode-realtime@0.1.0 dev
> nodemon server.js

[nodemon] 3.1.14
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server.js`
NeuroCode realtime server running on port 3001
```

Realtime Server URL:

```
http://localhost:3001
```
<div align="center">

[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-4"></a> 
## Terminal 4 Frontend

  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

</div>

**PowerShell (Windows):**

```powershell
cd frontend
```

Run:

```powershell
npm run dev
```

**Expected:**
```
http://localhost:5173
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<div align="center">


[⬆ Back to Overview](#overview)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<a id="terminal-5"></a>
## Terminal 5 Optional (Testing / Git / Logs)

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0d9488,50:eab308,100:0d9488&height=3" width="85%"/>
</p>

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

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

## Project Architecture

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
   ▼
Backend
   │
   ▼
Piston API
   │
   ▼
Python Runtime
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

## Important Notes

### 1. Docker First

Always start Docker Desktop before opening WSL.

### 2. Always Verify Piston

```bash
curl http://localhost:2000/api/v2/runtimes
```

### 3. Never Continue on Empty Output

If the output is:

```
[]
```

Run:

```bash
docker-compose up -d --force-recreate api
```

> **Known issue:** After a restart, Piston's runtime list sometimes returns empty and requires `--force-recreate` to resolve. This is not typical Piston behavior — it appears related to Docker bind-mount/container recreation behavior, a documented scenario where bind-mounted folders can appear empty after redeploy. Current recommendation: continue using this guide as the working workaround for now, and revisit permanently optimizing the Docker/Piston startup behavior after FYP submission, since it does not currently block development.

### 4. Backend Environment Variable

`.env`:

```env
PISTON_API=http://localhost:2000/api/v2
```

No code changes are required — the backend already reads this URL from the environment configuration.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

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

## First Startup Checklist

- [ ] Docker Desktop Running
- [ ] WSL Opened
- [ ] `docker-compose up -d api`
- [ ] `curl http://localhost:2000/api/v2/runtimes`
- [ ] Backend Running
- [ ] Frontend Running

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

## References

- [Docker Mounted Folder Becomes Empty After Redeploy — Oscar's Notebook](https://oscarchou.com/posts/troubleshoot/docker-compose-mount-empty-after-redeploy/)
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


