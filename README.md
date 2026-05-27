# VedaAI — AI Assessment Creator

An AI-powered question paper generator for Indian schools. Upload a PDF or describe your topic, pick question types and marks, and get a fully structured exam paper in seconds.

![VedaAI](https://img.shields.io/badge/VedaAI-Assessment%20Creator-FF5623?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)

---

## Features

- **AI Question Generation** — Generates structured question papers from a PDF upload or topic description using OpenAI GPT-4o-mini or Groq (free)
- **Multiple Question Types** — MCQ, Short, Long, True/False, Numerical, Diagram-based
- **PDF Export** — Download the generated paper as a properly formatted A4 PDF
- **My Library** — Save question papers + upload study materials (books, notes, PDFs, links)
- **AI Teacher's Toolkit** — Lesson Planner, Rubric Generator, Quiz Maker, Topic Summariser, Feedback Writer
- **Analytics** — Subject breakdown, question type stats, recent activity
- **My Groups** — Manage classes and student groups
- **Real-time Progress** — WebSocket-based live job progress during generation
- **Background Jobs** — BullMQ + Redis queue (graceful fallback to inline runner)
- **Auth** — Register/login with profile photo, school info, OpenAI/Groq key management
- **Responsive** — Works on desktop and mobile with a dark sidebar and bottom tab bar

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | State management (persisted) |
| React Hook Form + Zod | Form validation |
| Socket.IO Client | Real-time job progress |
| React Dropzone | File upload |
| html2pdf.js | PDF export |
| Lucide React | Icons |

### Backend
| Package | Purpose |
|---|---|
| Express + TypeScript | REST API |
| MongoDB + Mongoose | Primary database |
| Socket.IO | WebSocket real-time events |
| BullMQ + ioredis | Background job queue (optional) |
| OpenAI SDK | GPT-4o-mini question generation |
| Groq SDK | Free AI fallback (Llama 3) |
| Zod | Request validation |
| UUID | ID generation |

---

## Project Structure

```
ai-assessment-creator/
├── frontend/                   # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/             # Login, Register pages
│   │   └── (dashboard)/        # Protected dashboard pages
│   │       ├── home/           # Dashboard home
│   │       ├── assignments/    # Assignment list + create + output
│   │       ├── library/        # Saved papers + study materials
│   │       ├── toolkit/        # AI Teacher's Toolkit
│   │       ├── analytics/      # Usage analytics
│   │       ├── groups/         # Class groups
│   │       └── settings/       # Profile + API keys
│   ├── components/
│   │   ├── layout/             # Sidebar, TopBar
│   │   ├── ui/                 # Button, CounterInput, DifficultyBadge
│   │   ├── AuthGuard.tsx       # Route protection
│   │   └── CommandPalette.tsx  # ⌘K search
│   ├── store/
│   │   ├── assignmentStore.ts  # Assignments, library, groups
│   │   └── authStore.ts        # Auth state
│   └── lib/
│       ├── utils.ts            # Helpers
│       └── websocket.ts        # Socket.IO client
│
└── backend/                    # Express + TypeScript API
    └── src/
        ├── config/
        │   ├── database.ts     # MongoDB connection
        │   └── redis.ts        # Redis connection
        ├── models/
        │   ├── Assignment.ts   # Assignment + paper schema
        │   ├── User.ts         # User schema
        │   └── Job.ts          # Job schema
        ├── queue/
        │   └── generationQueue.ts  # BullMQ queue + worker
        ├── routes/
        │   ├── assignments.ts  # CRUD + regenerate
        │   ├── auth.ts         # Register, login, profile
        │   ├── jobs.ts         # Job status polling
        │   ├── toolkit.ts      # AI Toolkit generation
        │   └── settings.ts     # API key management
        └── services/
            ├── aiService.ts    # Question paper generation
            ├── freeAI.ts       # Groq free AI client
            └── jobRunner.ts    # Inline job runner (Redis fallback)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — for BullMQ job queue)
- OpenAI API key **or** Groq API key (both optional — works without any key)

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-assessment-creator

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
# backend/.env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379        # optional
OPENAI_API_KEY=sk-...                   # optional
GROQ_API_KEY=gsk_...                    # optional (free at console.groq.com)
FRONTEND_URL=http://localhost:3000
```

### 3. Configure frontend environment

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## AI Keys

The app works without any API key using a smart local fallback. For real AI-generated content:

| Key | Quality | Cost | Get it |
|---|---|---|---|
| OpenAI `sk-...` | Best (GPT-4o-mini) | Paid | [platform.openai.com](https://platform.openai.com/api-keys) |
| Groq `gsk_...` | Good (Llama 3) | **Free** | [console.groq.com](https://console.groq.com/keys) |
| None | Template-based | Free | Built-in |

Add your key in **Settings → OpenAI API Key** or **Settings → Groq API Key** after logging in.

---

## Job Queue Architecture

```
POST /api/assignments
  ↓
Save to MongoDB
  ↓
Redis available? ──Yes──→ BullMQ Queue → Worker (concurrency: 3)
  ↓ No                                        ↓
Inline runner ←──────────────────────────────┘
  ↓
AI Generation (OpenAI → Groq → Local fallback)
  ↓
Save result to MongoDB
  ↓
Socket.IO → Frontend (real-time progress)
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/api-key` | Save OpenAI key to DB |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Create + queue generation |
| POST | `/api/assignments/:id/regenerate` | Regenerate paper |
| DELETE | `/api/assignments/:id` | Delete assignment |
| GET | `/api/jobs/:jobId` | Poll job status |
| POST | `/api/toolkit/generate` | AI Toolkit generation |
| POST | `/api/settings/openai-key` | Update OpenAI key (runtime) |
| POST | `/api/settings/groq-key` | Update Groq key (runtime) |
| GET | `/health` | Service status |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open command palette |
| `Escape` | Close modals / palette |

---

## License

MIT
