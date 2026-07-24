<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=160&section=header&text=NeuroCode%20Execution%20Guide&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=40&desc=Local%20Development%20Environment%20Setup&descAlignY=62&descSize=16&descColor=D4AF37"/>
<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=16&duration=2800&pause=1000&color=00A676&center=true&vCenter=true&width=650&lines=Piston+API+%2B+FastAPI+Backend+%2B+Vite+Frontend;Windows+%2B+WSL2+%2B+Docker+Workflow" alt="Typing SVG"/>
</div>
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,30:00A676,70:D4AF37,100:1a1a1a&height=2" width="100%"/>

## Overview

Running NeuroCode locally requires **four terminals**, each dedicated to a specific service.

<div align="center">

| Terminal | Purpose | Shell |
|:---:|---|:---:|
| **Terminal 1** | Piston API (WSL2 + Docker) | PowerShell → Bash |
| **Terminal 2** | FastAPI Backend | PowerShell |
| **Terminal 3** | Vite Frontend | PowerShell |
| **Terminal 4** | Optional — Testing / Git / Logs | Bash |

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

<div align="center">
  
## Terminal 1 Starting Piston (WSL2)

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>

</div>

### Step 1 — Verify Docker Desktop

**PowerShell (Windows):**

```powershell
docker desktop status
```

**Expected:**
```
Status : running
```

If Docker Desktop is not running:

```powershell
docker desktop start
```

> **Note:** Wait until Docker Desktop is fully started before proceeding.

---
### Step 2 — Open WSL

**PowerShell (Windows):**

```powershell
wsl
```

This launches the Bash environment — all following commands in Terminal 1 run inside WSL.

---

### Step 3 — Navigate to the Piston Directory

**Bash (WSL2):**

```bash
cd ~/piston
```

Verify:

```bash
pwd
```

**Expected:**
```text
/home/mibrahim/piston
```

---

### Step 4 — Start the Piston Container

**Bash (WSL2):**

```bash
docker-compose up -d api
```

**Expected:**
```
Container piston_api Running
```

---

### Step 5 — Verify the Runtime

**Bash (WSL2):**

```bash
curl http://localhost:2000/api/v2/runtimes
```
**If the output is:**

```json
[
  {
    "language": "python",
    "version": "3.12.0"
  }
]
```

Everything is OK — proceed to the Backend.

**If the output is:**

```json
[]
```

Run:

```bash
docker-compose up -d --force-recreate api
```

Wait a few seconds, then verify again:

```bash
curl http://localhost:2000/api/v2/runtimes
```

Expected:

```json
[
  {
    "language": "python",
    "version": "3.12.0"
  }
]
```

> **Only proceed to the Backend after this check passes.**

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:1a1a1a,50:2ea44f,100:1a1a1a&height=2" width="100%"/>
