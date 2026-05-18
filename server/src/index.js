require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const morgan  = require('morgan')
const rateLimit = require('express-rate-limit')

const routes       = require('./routes')
const errorHandler = require('./middleware/errorHandler')
const prisma       = require('./lib/prisma')

const app  = express()
const PORT = process.env.PORT || 5001

// ── CORS — must be first, before helmet, so OPTIONS preflight is handled ──────
const ALLOWED_ORIGINS = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://192.168.2.52:3000',
]

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
        callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
}))
app.options('*', cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
        callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
}))

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests, please try again later.' }
}))

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes)

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────────────────────────
async function start() {
    try {
        await prisma.$connect()
        console.log('✅ Database connected')

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`)
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
        })
    } catch (err) {
        console.error('❌ Failed to connect to database:', err.message)
        process.exit(1)
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect()
    console.log('\n👋 Server shut down gracefully')
    process.exit(0)
})

start()
