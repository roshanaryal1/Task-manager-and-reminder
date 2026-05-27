# TaskFlow — Task Manager & Reminder App

A modern full-stack task management application with real-time reminders, analytics, and a beautiful UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Charts | Recharts |
| Notifications | Web Push API + Browser Notifications |
| DevOps | Docker + Docker Compose |

## Features

- **Authentication** — Signup/login, JWT sessions, remember me
- **Task Management** — Create, edit, delete, prioritize (Low/Medium/High/Urgent), categorize, tag, set due dates, recurring tasks
- **Reminder System** — Set reminders with popup modal + sound alert + browser notification when due
- **Dashboard** — Analytics with charts: weekly progress, priority breakdown, productivity score
- **Kanban Board** — Drag-and-drop between To Do / In Progress / Done / Cancelled
- **Calendar View** — Monthly calendar with task due dates
- **Pomodoro Timer** — 25/5 minute focus sessions with audio bell
- **Dark/Light Mode** — Persisted theme toggle
- **Responsive** — Mobile-friendly layout

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone & install
```bash
git clone https://github.com/roshanaryal1/Task-manager-and-reminder.git
cd Task-manager-and-reminder
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Set up environment
```bash
cp .env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET
```

### 3. Start PostgreSQL (Docker)
```bash
docker compose up postgres -d
```

### 4. Run migrations & start backend
```bash
cd backend
npx prisma migrate dev --name init
npm run dev
```

### 5. Start frontend
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173**

## Docker (full stack)
```bash
docker compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/reminders` | List reminders |
| POST | `/api/reminders` | Create reminder |
| POST | `/api/reminders/:id/snooze` | Snooze reminder |
| POST | `/api/reminders/:id/dismiss` | Dismiss reminder |
| GET | `/api/analytics/stats` | Dashboard stats |
| GET | `/api/analytics/weekly` | Weekly progress |

## Project Structure

```
taskmanager/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Route pages
│       ├── stores/      # Zustand state
│       └── services/    # API layer
├── backend/           # Express + Prisma
│   └── src/
│       ├── controllers/ # Route handlers
│       ├── routes/      # Express routes
│       ├── middleware/  # Auth, error handling
│       └── services/   # Business logic
├── prisma/            # Database schema
└── docker/            # Dockerfiles
```
