require('dotenv').config()

const http = require('http')
const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const morgan  = require('morgan')
const rateLimit = require('express-rate-limit')
const passport = require('./lib/passport')

const errorHandler = require('./middleware/errorHandler')
const requestLogger = require('./middleware/requestLogger')
const prisma       = require('./lib/prisma')
const { initSocket } = require('./lib/socket')
const { ensureUploadDirs } = require('./lib/initUploads')

const app  = express()
const PORT = process.env.PORT || 5001
const logger = require('./lib/logger')

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
app.use(requestLogger)
// Use morgan with pino stream for structured HTTP logging
morgan.token('id', (req) => req.id || '-')
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : ':id :method :url :status :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Disabled for development
if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: 'Too many requests, please try again later.' }
    }))
}

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Passport initialization ────────────────────────────────────────────────────
app.use(passport.initialize())

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes, 404 and global error handler are registered after async startup

// ── Start server ──────────────────────────────────────────────────────────────
async function connectWithRetry(maxRetries = 5, initialDelay = 1000) {
    let attempt = 0
    let delay = initialDelay

    while (attempt < maxRetries) {
        try {
            await prisma.$connect()
            logger.info({ msg: 'Database connected' })
            return
        } catch (err) {
            attempt++
            if (attempt >= maxRetries) {
                throw err
            }
            logger.warn({ 
                msg: 'Database connection failed, retrying...', 
                attempt, 
                maxRetries, 
                delayMs: delay,
                error: err.message 
            })
            await new Promise(resolve => setTimeout(resolve, delay))
            delay = Math.min(delay * 2, 30000) // Exponential backoff, max 30s
        }
    }
}

async function start() {
    try {
        // Ensure upload directories exist before requiring routes (multer storages)
        await ensureUploadDirs()

        // Require routes after upload dirs are ready so multer storages can use them
        const routes = require('./routes')
        app.use('/api', routes)

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
        })

        // Global error handler
        app.use(errorHandler)

        await connectWithRetry(5, 1000)

        const server = http.createServer(app)
        const io = initSocket(server)
        let activePort = Number(PORT)

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const fallbackPort = activePort + 1
                logger.warn({ msg: 'Port in use, retrying', port: activePort, nextPort: fallbackPort })
                activePort = fallbackPort
                server.listen(activePort)
                return
            }
            logger.fatal({ msg: 'Server error', error: err.message })
            process.exit(1)
        })

        server.listen(activePort, () => {
            logger.info({ msg: 'Server listening', port: activePort, env: process.env.NODE_ENV || 'development', clients: io.engine.clientsCount })
        })
    } catch (err) {
        logger.fatal({ msg: 'Failed to connect to database after retries', error: err.message })
        process.exit(1)
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect()
    logger.info('Server shut down gracefully')
    process.exit(0)
})

start()
