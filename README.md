# Facebook Clone

A full-stack Facebook clone built with **Next.js**, **Express**, **Prisma**, and **PostgreSQL**.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: JavaScript (ES6+)
- **Authentication**: JWT (jsonwebtoken), bcryptjs, Passport.js
- **OAuth Providers**: Google OAuth 2.0, Microsoft OAuth 2.0
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Morgan, Pino
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS
- **Validation**: Zod
- **Real-time**: Socket.io

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migration**: Prisma Migrate

### Development Tools
- **Package Manager**: npm
- **Hot Reload**: nodemon (server), Next.js dev server (client)
- **Database GUI**: Prisma Studio

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

# Email Configuration (for email verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="Facebook Clone <your-email@gmail.com>"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:5001/api/auth/microsoft/callback
```

**Client** — create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### OAuth Setup (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add `http://localhost:5001/api/auth/google/callback` to Authorized redirect URIs
4. Add `http://localhost:3000` to Authorized JavaScript origins
5. Copy Client ID and Client Secret to `.env`

**Microsoft OAuth:**
1. Go to [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Add `http://localhost:5001/api/auth/microsoft/callback` to Redirect URIs
4. Copy Application (client) ID and Client secret to `.env`

**Email Verification:**
- For Gmail: Create an [app-specific password](https://support.google.com/accounts/answer/185833)
- For other providers: Use SMTP settings (EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE)

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
| POST | `/api/auth/register` | No | Register new user (sends verification email) |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/verify-email?token=xxx` | No | Verify email address |
| POST | `/api/auth/resend-verification` | Yes | Resend verification email |
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |
| GET | `/api/auth/microsoft` | No | Initiate Microsoft OAuth |
| GET | `/api/auth/microsoft/callback` | No | Microsoft OAuth callback |

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
