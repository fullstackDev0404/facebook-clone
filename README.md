# Facebook Clone

A full-stack Facebook clone built with **Next.js**, **Express**, **Prisma**, and **PostgreSQL**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |

---

## Project Structure

```
facebook-clone/
├── client/          # Next.js frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── component/   # Shared components (Feed, Header, Sidebars…)
│   │   ├── components/  # shadcn/ui primitives
│   │   ├── context/     # AuthContext
│   │   └── lib/         # API client, utils, validation
│   └── .env.local       # NEXT_PUBLIC_API_URL
└── server/          # Express backend
    ├── prisma/
    │   ├── schema.prisma   # DB schema
    │   └── seed.js         # Seed data
    └── src/
        ├── index.js            # Entry point
        ├── lib/
        │   ├── prisma.js       # Prisma client singleton
        │   └── upload.js       # Multer config
        ├── middleware/
        │   ├── auth.js         # JWT middleware
        │   └── errorHandler.js
        ├── controllers/
        │   └── posts.js        # Post handlers
        └── routes/
            ├── index.js        # Route aggregator
            ├── auth.js         # Auth routes
            └── posts.js        # Posts routes
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

---

### 1. Clone & install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 2. Configure environment

**Server** — create `server/.env` from the example:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/facebook_clone"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
PORT=5000
```

**Client** — create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 3. Set up the database

```sql
-- In psql or your PostgreSQL client
CREATE DATABASE facebook_clone;
```

```bash
cd server
npm run db:migrate    # Run Prisma migrations
npm run db:generate   # Generate Prisma client
npm run db:seed       # (Optional) Seed sample data
```

---

### 4. Start both servers

**Backend** (runs on http://localhost:5000):

```bash
cd server
npm run dev
```

**Frontend** (runs on http://localhost:3000):

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts/feed` | Yes | Paginated feed (own + friends) |
| POST | `/api/posts` | Yes | Create post (text + image upload) |
| POST | `/api/posts/:id/like` | Yes | Like / react to a post |
| DELETE | `/api/posts/:id/like` | Yes | Remove reaction |
| GET | `/api/posts/:id/comments` | Yes | Get comments for a post |
| POST | `/api/posts/:id/comments` | Yes | Add a comment or reply |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Server health check |

---

## Features Implemented

### Day 1–2 — Layout & Auth UI
- [x] 3-column homepage layout (Header, Left Sidebar, Feed, Right Sidebar)
- [x] Login page with form validation
- [x] Sign Up page with form validation
- [x] Forgot Password page
- [x] Auth context + protected routes

### Day 3 — Backend Auth
- [x] `POST /auth/register` — bcrypt password hashing
- [x] `POST /auth/login` — JWT token issuance
- [x] Auth middleware — JWT verification on protected routes

### Day 4 — Posts & Feed
- [x] `POST /posts` — create post with text + image (multer)
- [x] `GET /posts/feed` — paginated feed (own posts + accepted friends)
- [x] `POST /posts/:id/like` / `DELETE /posts/:id/like` — reactions
- [x] `POST /posts/:id/comments` / `GET /posts/:id/comments` — comments
- [x] Stories row (horizontal scroll)
- [x] Create Post box — connected to real API
- [x] Post card with Like, Comment, Share — connected to real API
- [x] Infinite scroll feed with loading skeletons

---

## Scripts

### Server

```bash
npm run dev          # Start with nodemon (hot reload)
npm run start        # Production start
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed the database
```

### Client

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Deployment

**Backend** — deploy to [Railway](https://railway.app) or [Render](https://render.com) (PostgreSQL included).

**Frontend** — deploy to [Vercel](https://vercel.com). Set `NEXT_PUBLIC_API_URL` to your live backend URL in the Vercel environment variables.
