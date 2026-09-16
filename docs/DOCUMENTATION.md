<!--
  User and administrator documentation. Every behavior described here was
  checked against the code in backend/app and frontend/src at the time of
  writing; nothing is aspirational. Default numbers (durations, thresholds)
  are the values in backend/app/config/settings.py and can be changed per
  deployment through environment variables.
-->

# NeuroCode Documentation

## Contents

1. [What NeuroCode is](#1-what-neurocode-is)
2. [Student guide](#2-student-guide)
   - [Authentication](#21-authentication) · [Dashboard](#22-dashboard) · [Roadmap](#23-the-adaptive-roadmap) ·
     [Practice](#24-practice) · [Challenge Gate](#25-challenge-gate) · [Mock Interview](#26-mock-interview) ·
     [Assessment](#27-proctored-assessment) · [Credentials](#28-credentials) · [Peer Discussion](#29-peer-discussion) ·
     [Teacher Comments](#210-teacher-comments) · [Spaced Review](#211-spaced-review) · [Profile & Settings](#212-profile-and-settings)
3. [Educator guide](#3-educator-guide)
4. [Admin guide](#4-admin-guide)
5. [Roles at a glance](#5-roles-at-a-glance)
6. [See it in action](#6-see-it-in-action)

---

## 1. What NeuroCode is

NeuroCode is an AI-powered coding education platform that connects the whole learning path —
**learn, practice, prove, and certify** — in one system. Students follow an adaptive roadmap of data
structures and algorithms topics, practice on AI-generated problems whose solutions have been
**verified by actually running them**, get their own code executed and structurally analyzed, and
finally take a **proctored assessment** that issues a **publicly verifiable credential**.

Its core purpose is trust at every step:
- **Problems are trustworthy** — an AI-written problem is only shown after its reference solution
  runs correctly in a sandbox.
- **Grading is real** — submissions run in Python, JavaScript or C++ against real test cases.
- **Results are trustworthy** — assessments combine test results with four behavioral integrity
  signals, scored on the server.
- **Credentials are checkable** — anyone with the link or QR code can verify one, no account needed.

There are three roles: **student**, **educator** and **admin** (see [section 5](#5-roles-at-a-glance)).

---

## 2. Student guide

### 2.1 Authentication

Open **Get Started / Sign In** and choose one of:
- **Continue with Google**
- **Continue with GitHub**
- **Email and password** — create an account with your name, email and a password of at least
  6 characters, or sign in to an existing one.

Forgot your password? Choose **Forgot password?**, enter your email, and a reset link is sent to you.

Behind the scenes, Firebase verifies who you are, and NeuroCode exchanges that for its own session
(valid for 24 hours by default). Your first sign-in creates your NeuroCode account as a **student**.
Your role is re-checked on every request, so if an admin changes it, the change applies immediately.

### 2.2 Dashboard

Your home page after signing in shows:
- **XP, Streak, Level and Role** cards.
- **Activity & Daily Submissions** — a 12-month heatmap of every submission you made.
- **XP Progression** — your XP over time, built from the dates you completed roadmap topics.
- **Practice Solved by Topic** — how many practice problems you have fully passed per topic.
- A **Quick Review** banner when a topic is due for revisiting (see [Spaced Review](#211-spaced-review)).

### 2.3 The adaptive roadmap

The **Roadmap** is a path of ten topics:

| # | Topic | Difficulty | XP on completion |
|---|---|---|---|
| 1 | Arrays | Beginner | 50 |
| 2 | Strings | Beginner | 50 |
| 3 | Hash Maps | Beginner | 50 |
| 4 | Two Pointers | Intermediate | 100 |
| 5 | Sliding Window | Intermediate | 100 |
| 6 | Stacks & Queues | Intermediate | 100 |
| 7 | Recursion & Backtracking | Intermediate | 100 |
| 8 | Trees | Advanced | 150 |
| 9 | Graphs | Advanced | 150 |
| 10 | Dynamic Programming | Advanced | 150 |

- Only the first topic starts **unlocked**. Completing a topic unlocks the next one.
- Each topic offers **Practice** and **Take Challenge Gate**. A topic is completed by clearing its
  [Challenge Gate](#25-challenge-gate), or with the **Mark Complete** button in the topic panel.
- **Levels:** you gain a level for every 500 XP.
- **Streak:** grows when you complete topics on consecutive days, and resets after a gap.
- **Challenge Gate readiness bar:** counts your fully passing practice submissions toward a
  recommended foundation of 50. It is guidance only — it never blocks you.
- **Adaptive reordering:** when the code analyzer spots certain inefficiencies in your practice
  submissions (a membership check against a list inside a loop, or `.count()` inside a loop), it moves
  **Hash Maps** — the topic that fixes them — to right after your current topic, as long as you haven't
  started it yet. The analysis panel tells you when this happens.
- **Recommended next topic:** a banner that compares your recent struggles (failed submissions and
  detected inefficiencies) with the upcoming topics and suggests the closest match. With no struggle
  signal yet, it simply suggests continuing in order.
- The **Leaderboard** on this page ranks students by XP.

### 2.4 Practice

**Practice** gives you a fresh AI-generated problem for any topic and difficulty (easy, medium or hard).
Opening Practice from a roadmap topic pre-fills that topic.

**How problems are made trustworthy.** The AI writes the problem *and* a reference solution. Before
you ever see it, NeuroCode runs that reference solution in the sandbox against every test input and
uses the real outputs as the expected answers. A solution that crashes, or that gives the same output
for every input, is rejected and a new problem is generated (up to three attempts). Test cases are never
shown to you.

**AI providers.** Problems are generated with **Google Gemini** by default. The model menu also lists
**GPT** and **Claude**: for students, both open a subscription preview; admins can unlock GPT with a
passcode (see the [Admin guide](#4-admin-guide)).

**Solving.**
- Write your solution in **Python**, **JavaScript** or **C++** and choose **Submit Solution**.
  (C++ supports problems that return a number, string or boolean.)
- Your code runs in a sandbox against the problem's test cases. **Test Results** shows each case as
  passed or failed, with the expected and actual output for failures.
- **Code Analysis** shows the estimated time complexity (from a real parse tree via Tree-sitter),
  any detected inefficiencies (for Python), written feedback, and any roadmap reordering.

**After you fully pass a problem:**
- **Official Solution** — the verified reference solution, with a short explanation.
- **How others solved this** — the peer discussion thread (see [Peer Discussion](#29-peer-discussion)).

**The learning assistant (hint-only).** A chat widget is available while you practice. It looks up
your own most similar past submissions and uses them to give specific, 2–4 sentence hints — for
example pointing at the nested loop you used last time. It never gives full solutions:
- Requests like "give me the code", "full solution" or "just tell me the answer" are refused
  **before** the AI is even called, with an invitation to think through the next step instead.
- The AI itself is instructed to give only conceptual hints and guiding questions.

The assistant is available only in Practice — never in Mock Interview or Assessment.

### 2.5 Challenge Gate

Each roadmap topic has a **Topic Mastery Gate**:
- **10 AI-generated problems** — 4 easy, 4 medium and 2 hard — each verified by execution exactly
  like Practice problems. Generating the set can take a little while.
- **No AI assistance** of any kind.
- A **90-minute** on-screen timer.
- Move between questions with the numbered buttons; solved questions are marked with a check.
- Choose **Validate Question** to grade the current question in Python, JavaScript or C++.
- **Solving all 10 completes the topic**, awarding the same XP and unlocking the next topic.

Your gate progress is saved per topic, so you can leave and come back. A locked topic's gate can't be
opened until the earlier topics are complete.

### 2.6 Mock Interview

**Mock Interview** simulates a real technical interview:
- Choose a topic and difficulty, then **Start Interview**. An AI-generated interview question appears.
- It is **timed** (30 minutes by default) and **unassisted** — no hints and no chatbot.
- Write your answer in Python and submit. The time limit is enforced on the server (with a short grace
  period), so a late submission isn't graded.
- Results show your **time taken**, **tests passed**, and the detected **complexity**.

### 2.7 Proctored Assessment

Assessments certify mastery of a **topic cluster**:

| Cluster | Topics |
|---|---|
| Fundamentals | Arrays + Strings |
| Lookups & Efficiency | Hash Maps + Two Pointers |
| Windows & Structures | Sliding Window + Stacks & Queues |
| Recursive Thinking | Recursion & Backtracking + Trees |
| Advanced Structures | Graphs + Dynamic Programming |

- A cluster **unlocks** once both of its topics are completed on your roadmap.
- **Start Assessment** generates one comprehensive problem that combines both topics, verified by
  execution like every other generated problem.
- You have **45 minutes** by default, enforced on the server. Answers are written in **Python**.
- The camera panel, a live **integrity score** badge, and a live event feed are shown while you work.

**The four integrity signals**

| Signal | What triggers it | Penalty |
|---|---|---|
| **Tab switching** | Leaving the page (switching tabs or windows) | −5 |
| **Large paste** | Pasting 30 or more characters into the editor | −8 |
| **Camera alert** | The camera check finds no face or more than one face, or the camera is unavailable. Frames are checked on the server with OpenCV face detection. | −10 |
| **Unusual typing rhythm** | Keystroke timing that is both statistically abnormal (an Isolation Forest model) **and** unnaturally fast and uniform — the signature of scripted input. Ordinary fast typing is not flagged. | −6 |

**How scoring works**
- Every detected event is **saved on the server** as it happens.
- When you submit, the server **recomputes your integrity score from those saved events**:
  it starts at 100 and subtracts each penalty, with a minimum of 0. Any score sent by the browser is
  ignored — the live badge you see is only a preview.
- Your **assessment score** is the percentage of test cases your solution passes.
- You **pass** when your assessment score is **at least 70** *and* your integrity score is
  **at least 60** (the default threshold).
- An integrity score below the threshold marks the attempt as **flagged** for educator review.
- If you don't pass, NeuroCode identifies a **focus area** from the cluster and records it as your
  recommended next topic.

### 2.8 Credentials

Passing an assessment issues a credential automatically. Its tier depends on your assessment score:

| Tier | Assessment score |
|---|---|
| Platinum | 90 and above |
| Gold | 80 – 89 |
| Silver | 70 – 79 |

The **Credentials** page lists everything you have earned. **View Certificate** opens the certificate
with:
- a **QR code** that links to its public verification page,
- **Export PDF** — download the certificate,
- **Copy Verification Link**,
- **Share on LinkedIn** — opens LinkedIn's share window and copies a suggested caption to your clipboard.

**Verification.** Each credential has a unique link (`/verify/<id>`) that anyone can open without an
account. It shows the certificate — tier, topics, assessment and integrity scores, and your name — and
never shows your email or other account details. Visitors can download the PDF from there too.

### 2.9 Peer Discussion

After you fully pass a **practice** problem, **How others solved this** appears below it. Read other
students' comments on the same problem, and post your own approach or tip. Your code is never shared
automatically — only what you choose to type. Discussion is never available for assessments.

### 2.10 Teacher Comments

Educators can leave feedback on your submissions. Open **My Submissions**, then select a submission to
expand it and read its teacher comments.

### 2.11 Spaced Review

NeuroCode nudges you to revisit topics before they fade. A **Quick Review** banner appears on your
Dashboard when a topic was completed **at least 7 days ago** and you haven't practiced it in the last
7 days. **Review Now** opens Practice on that topic. You can turn the banner off in **Settings**.
There are no emails or push notifications — reminders are shown in the app only.

### 2.12 Profile and Settings

- **Profile:** edit your display name and avatar image URL. Your email comes from your sign-in
  provider and can't be changed here.
- **Settings:** choose light or dark appearance, and turn Quick Review reminders on or off.

---

## 3. Educator guide

Educators (and admins) have an **Educator Portal** in the sidebar.

**Cohort dashboard**
- Summary cards: number of **students**, total **integrity flags**, and **average topics completed**.
- **Student Progress** table: each student's XP, level, topics completed, and integrity flags, with
  badges naming the violation types behind any flags (for example "Tab Switching" or
  "Large Paste Detected").

**Skill-gap analytics**
- **Common Error Patterns** is a chart of the weak topics most often identified across students'
  assessment attempts.

**Leaderboard**
- **Class Leaderboard** shows the top students by XP.

**Reviewing flagged assessments**
- Select any student in **Student Progress** to open their **Student Timeline**:
  - roadmap progress for every topic,
  - every assessment with its score, integrity score, status and date — **flagged** attempts are
    highlighted and list their violation types,
  - their credentials,
  - their recent submissions.

**Commenting on submissions**
- In the timeline's **Recent Submissions**, choose **Comment** on a submission to read existing
  feedback and post your own. The student sees it under **My Submissions**.

---

## 4. Admin guide

Admins have everything educators have, plus an **Administration** page.

**User and role management**
- The **User Management** table lists every user with name, email, role and XP.
- Change a role with the dropdown: **student**, **educator** or **admin**.
- **Last-admin protection:** the server refuses to remove the admin role from the last remaining admin,
  whether the request comes from the page or directly from the API.

**The scoped reset system**
- For **student** accounts, the **Reset** menu offers six operations. Each one clears only the data its
  module owns:

| Reset | What it clears |
|---|---|
| Reset Dashboard | XP, level and streak |
| Reset Roadmap | Topic completion and unlock state (restarted from the first topic), and the recommended next topic |
| Reset Practice | Practice submissions and their feedback/analysis, the student's generated problems, submission embeddings, and weak/strong topic analytics |
| Reset Assessments | Assessment attempts, scores and integrity logs — attempts that back an issued credential are kept |
| Reset Credentials | Issued credentials, their verification links and badges |
| Reset Student (Full Reset) | All of the above in one operation |

- Every reset asks for confirmation and lets you add an optional reason.

**Credential oversight**
- **All Credentials** lists every issued credential with the student, tier, topics, score, and a
  **View** link to its public verification page.

**Audit logs**
- **Recent Admin Activity** records every role change and reset: date, admin, target user, action,
  and the reason given.

**AI provider switch**
- In Practice, admins can pick **GPT** from the model menu. The first time in a session, a passcode
  prompt appears; after that, problems are generated with OpenAI. Independently of that prompt, the
  server only accepts an OpenAI request from an account whose current role is admin.

**Demo Mode**
- A single owner account can switch on **Demo Mode**, a presenter mode with fixed, pre-verified content,
  from the Administration page. See [demo.md](demo.md) for details.

---

## 5. Roles at a glance

| Capability | Student | Educator | Admin |
|---|:---:|:---:|:---:|
| Roadmap, Practice, Challenge Gate, Mock Interview, Assessment, Credentials | ✅ | ✅ | ✅ |
| Educator Portal (cohort, analytics, timelines, comments) | — | ✅ | ✅ |
| Administration (roles, resets, credentials, audit log) | — | — | ✅ |
| Switch Practice generation to OpenAI | — | — | ✅ |

---

## 6. See it in action

- **Full platform walkthrough:** https://youtu.be/S7R6AE9nWps
- **Quick live demo:** https://youtu.be/LMY99wXn-QE

---

For running NeuroCode yourself, see [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md).
