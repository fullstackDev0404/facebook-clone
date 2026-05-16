# Facebook Clone — Backend

Express + Prisma + PostgreSQL

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET
```

### 3. Create the PostgreSQL database
```sql
CREATE DATABASE facebook_clone;
```

### 4. Run migrations
```bash
npm run db:migrate
```

### 5. Generate Prisma client
```bash
npm run db:generate
```

### 6. Seed the database (optional)
```bash
npm run db:seed
```

### 7. Start the server
```bash
npm run dev
```

Server runs on http://localhost:5000

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| GET | /health | No | Health check |

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma   # DB schema
│   └── seed.js         # Seed data
└── src/
    ├── index.js        # Entry point
    ├── lib/
    │   └── prisma.js   # Prisma client singleton
    ├── middleware/
    │   ├── auth.js     # JWT middleware
    │   └── errorHandler.js
    └── routes/
        ├── index.js    # Route aggregator
        └── auth.js     # Auth routes
```
