<!--
  Rewritten to be machine-independent: the previous version hardcoded one
  developer's Piston home-directory path and said it was configured for that
  developer's own machine. Every step below now works on any machine, with
  clearly labeled Windows vs. macOS/Linux variants where the commands differ.
-->

<div align="center">

# NeuroCode — Setup & Deployment Guide

**Run the full NeuroCode platform on your own machine: Piston code execution, FastAPI backend and Vite frontend.**

[Overview](#overview) •
[Prerequisites](#prerequisites) •
[1. Clone](#1-clone-the-repository) •
[2. Supabase](#2-set-up-supabase-database) •
[3. Firebase](#3-set-up-firebase-authentication) •
[4. Piston](#4-start-piston-code-execution) •
[5. Backend](#5-run-the-backend) •
[6. Frontend](#6-run-the-frontend) •
[7. First login](#7-first-login-and-admin-access) •
[Troubleshooting](#troubleshooting) •
[Shutdown](#shutdown) •
[Deployment](#deployment-architecture)

</div>

---

## Overview

A local NeuroCode setup runs **three services**, each in its own terminal:

| Terminal | Service | Default address | Role |
|---|---|---|---|
| 1 | **Piston** (Docker) | `http://localhost:2000` | Executes submitted code in sandboxed containers |
| 2 | **Backend** (FastAPI + Uvicorn) | `http://localhost:8000` | API, grading, AI generation, proctoring checks |
| 3 | **Frontend** (Vite + React) | `http://localhost:5173` | The web app you open in the browser |

It also uses three hosted services, each with a free tier: **Supabase** (PostgreSQL database),
**Firebase Authentication** (sign-in), and a **Google Gemini API key** (AI problem generation).

```
Browser ──▶ Frontend (Vite, :5173)
                │  Firebase sign-in, then API calls with a session token
                ▼
          Backend (FastAPI, :8000) ──▶ Supabase (PostgreSQL)
                │                 ──▶ Google Gemini (AI generation)
                │                 ──▶ ChromaDB (local embeddings folder)
                ▼
          Piston API (Docker, :2000) ──▶ Python / JavaScript / C++ runtimes
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Git | any recent | |
| Docker | Docker Desktop (Windows / macOS) or Docker Engine (Linux) | Piston runs as a privileged Linux container. On Windows, use Docker Desktop with the WSL 2 backend. |
| Python | 3.11 | The version the backend is developed and tested with |
| Node.js | 18 or newer | Required by Vite 5; also used by Piston's package CLI |
| Supabase account | free tier is fine | https://supabase.com |
| Firebase project | free tier is fine | https://console.firebase.google.com |
| Gemini API key | free tier is fine | https://aistudio.google.com/apikey |

> **Windows users:** the commands below are shown for **PowerShell** and for **macOS/Linux (bash/zsh)**
> where they differ. You can also run every Linux command inside a WSL 2 terminal.

---

## 1. Clone the repository

```bash
git clone https://github.com/mibrahim-O2/NueroCode-Official.git
cd NueroCode-Official
```

All paths below are relative to this repository folder unless stated otherwise.

---

## 2. Set up Supabase (database)

1. Create a new Supabase project.
2. Open **SQL Editor** and run every file in `database/schema/` **in numeric order**
   (`001_users.sql`, `002_roadmap_nodes.sql`, … up to the highest number). Each file is safe to run once.
   The later files include the explicit `service_role` grants the backend needs.
3. Open **Project Settings → API** and copy:
   - the **Project URL** → `SUPABASE_URL`
   - the **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never put it in the frontend)

---

## 3. Set up Firebase (authentication)

1. Create a Firebase project and open **Authentication → Sign-in method**.
2. Enable **Email/Password**, **Google**, and **GitHub** (GitHub needs an OAuth app; Firebase shows the callback URL to use).
3. Under **Authentication → Settings → Authorized domains**, make sure `localhost` is listed.
4. **Project settings → General → Your apps:** add a **Web app** and keep its config values
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) for the frontend.
5. **Project settings → Service accounts:** click **Generate new private key** and save the file as
   `backend/firebase-service-account.json`. This file is already in `.gitignore` — never commit it.

---

## 4. Start Piston (code execution)

**Terminal 1.** Piston is a separate open-source project. Clone it **anywhere outside this repository**
(your home folder is a good choice) and follow its README if anything below differs for your version:
https://github.com/engineer-man/piston

**1. Start Docker** (Docker Desktop on Windows/macOS; the Docker service on Linux) and confirm it's running:

```bash
docker info
```

**2. Clone and start the Piston API container:**

```bash
git clone https://github.com/engineer-man/piston.git
cd piston
docker compose up -d api
```

**3. Install the three language runtimes NeuroCode uses.** The versions must match
`LANGUAGE_CONFIG` in `backend/app/services/piston_service.py`:

```bash
cd cli
npm install
cd ..
node cli/index.js ppman install python=3.12.0
node cli/index.js ppman install node=20.11.1
node cli/index.js ppman install gcc=10.2.0
```

**4. Verify the runtimes are loaded:**

macOS / Linux:
```bash
curl http://localhost:2000/api/v2/runtimes
```

Windows (PowerShell):
```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

You should see entries for `python` 3.12.0, `javascript` 20.11.1 and `c++` 10.2.0.
**Only continue once this list is not empty.**

> **Recommended compose settings.** Store runtime packages in a Docker **named volume**
> (e.g. `piston_packages:/piston/packages`) rather than a bind mount, and use
> `restart: unless-stopped`. A bind mount can occasionally be empty when the container starts
> (especially on WSL 2), which makes the runtime list come back as `[]`.

---

## 5. Run the backend

**Terminal 2**, from the repository root:

**1. Create and activate a virtual environment**

macOS / Linux:
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
```

Windows (PowerShell):
```powershell
cd backend
py -3.11 -m venv venv
venv\Scripts\Activate.ps1
```

**2. Install dependencies** (first time, and whenever `requirements.txt` changes):

```bash
pip install -r requirements.txt
```

**3. Create your `.env`** from the template:

macOS / Linux:
```bash
cp .env.example .env
```

Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

Then fill it in:

| Variable | Required | What to set |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL from step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | service_role key from step 2 |
| `JWT_SECRET` | ✅ | A long random string (signs NeuroCode session tokens) |
| `GEMINI_API_KEY` | ✅ | Your Gemini API key |
| `GEMINI_MODEL` | ✅ | A Gemini model name available to your key |
| `ADMIN_EMAIL` | ✅ | **Your own** sign-in email — the account created with it becomes an admin |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✅ | `./firebase-service-account.json` (from step 3) |
| `PISTON_API` | ✅ | `http://localhost:2000/api/v2` |
| `FRONTEND_URL` | ✅ | `http://localhost:5173` (allowed CORS origin) |
| `PROVIDER_SWITCH_PASSCODE` | recommended | Replace the placeholder; admins enter it to switch Practice to OpenAI |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | optional | Only needed for the admin-only OpenAI option |
| `OWNER_EMAIL`, `DEMO_MODE_PASSCODE` | optional | Only needed for Demo Mode (see [docs/demo.md](demo.md)) |
| `CHROMA_DB_PATH` | optional | Local folder for embeddings (default `./chromadb`) |
| `INTEGRITY_PASS_THRESHOLD`, `ASSESSMENT_DURATION_SECONDS` | optional | Defaults: `60` and `2700` (45 min) |

At startup the backend logs a warning if `JWT_SECRET` or `PROVIDER_SWITCH_PASSCODE` still use their
placeholder values, or if the Demo Mode settings are unset.

**4. Start the server:**

```bash
uvicorn app.main:app --reload --port 8000
```

**5. Check it:** open http://localhost:8000/health — `supabase`, `chromadb` and `piston` should all
report `connected`.

---

## 6. Run the frontend

**Terminal 3**, from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env` from the template (`cp .env.example .env` on macOS/Linux,
`Copy-Item .env.example .env` in PowerShell) and fill in:

| Variable | What to set |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | The web-app config values from step 3 |
| `VITE_BACKEND_URL` | `http://localhost:8000` |
| `VITE_OWNER_EMAIL` | Optional, Demo Mode only |

Then start the dev server:

```bash
npm run dev
```

Open **http://localhost:5173**.

---

## 7. First login and admin access

1. Open http://localhost:5173/login and sign in (email, Google or GitHub).
2. The first sign-in creates your NeuroCode account. If its email matches `ADMIN_EMAIL`, it is an
   **admin**; everyone else starts as a **student**.
3. As an admin you can promote other accounts to **educator** or **admin** from the Administration page.

See [DOCUMENTATION.md](DOCUMENTATION.md) for a full walkthrough of every module.

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `/api/v2/runtimes` returns `[]` | Runtimes aren't installed or the packages volume wasn't ready. Run `docker restart piston_api`, check again, and re-run the `ppman install` commands if still empty. |
| "Code execution service has no runtimes loaded" | Same as above — Piston is up but empty. |
| "Code execution service unreachable" | Piston isn't running, or `PISTON_API` points to the wrong address. |
| Browser shows CORS errors | `FRONTEND_URL` in `backend/.env` must exactly match the frontend's address. |
| `permission denied for table …` from Supabase | A migration was skipped — re-run the `database/schema/` files in order. |
| "AI provider is temporarily rate-limited" / HTTP 429 | Your Gemini key hit its request quota. Wait, or use a key with a higher limit. |
| Sign-in works but the app shows no data | The backend isn't running, or `VITE_BACKEND_URL` is wrong. |

---

## Shutdown

- **Backend and frontend:** press `Ctrl + C` in each terminal.
- **Piston:** from your Piston folder, run `docker compose down`.

---

## Deployment architecture

In production the three terminals become managed services:

```
┌─────────────────────┐   HTTPS   ┌──────────────────────┐   HTTP (private)   ┌─────────────────────┐
│ Frontend            │ ────────▶ │ Backend              │ ─────────────────▶ │ Piston              │
│ static build (dist) │           │ FastAPI / Uvicorn    │                    │ Docker, Linux host  │
│ e.g. Netlify/Vercel │           │ container or Linux VM│                    │ (privileged)        │
└─────────────────────┘           └──────────────────────┘                    └─────────────────────┘
```

| Development | Production equivalent |
|---|---|
| `npm run dev` | `npm run build` produces static files in `frontend/dist/`, served by any static host. `frontend/netlify.toml` is included: set the Netlify **Base directory** to `frontend`, and it builds with `npm run build`, publishes `dist`, and rewrites every route to `index.html` so client-side routes work on refresh. |
| `uvicorn --reload` | The same command without `--reload`, run by a process manager or container platform that restarts it on failure. |
| Piston in local Docker | The same Piston image on a Linux host that allows privileged containers. Keep it on a private network reachable only by the backend. |

Only configuration changes between environments — never code:

| Variable | Development | Production |
|---|---|---|
| `VITE_BACKEND_URL` (frontend build) | `http://localhost:8000` | Your backend's public HTTPS URL |
| `VITE_FIREBASE_*` (frontend build) | Firebase web config | Same values; add your production domain to Firebase **Authorized domains** |
| `FRONTEND_URL` | `http://localhost:5173` | Your frontend's public URL (CORS origin) |
| `PISTON_API` | `http://localhost:2000/api/v2` | Piston's private network address |
| `JWT_SECRET` | any local string | A strong random secret |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./firebase-service-account.json` | Path to the secret file mounted on the host |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `ADMIN_EMAIL` | your values | same (store as secrets) |

> **Note on a public backend:** AI problem generation uses your Gemini key. A free-tier key has a low
> daily request limit, so a publicly reachable backend can exhaust it quickly. Use a key with an
> appropriate quota before exposing the backend to real traffic.

---

## References

- [Piston — GitHub repository and README](https://github.com/engineer-man/piston)
- [Piston configuration documentation](https://piston.readthedocs.io/en/latest/configuration/)
- [Supabase documentation](https://supabase.com/docs)
- [Firebase Authentication documentation](https://firebase.google.com/docs/auth)
- [Netlify file-based configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
