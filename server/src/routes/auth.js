const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { recordSignup } = require('../lib/socket')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')

const signToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// ── Register ──────────────────────────────────────────────────────────────────
const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName:  z.string().min(1, 'Last name is required'),
    username:  z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
    email:     z.string().email('Invalid email'),
    password:  z.string().min(6, 'Password must be at least 6 characters'),
    dob:       z.string().optional(),
    gender:    z.string().optional(),
})

router.post('/register', async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body)

        const existing = await prisma.user.findUnique({ where: { email: data.email } })
        if (existing) return res.status(409).json({ error: 'Email already in use' })

        // Check if username is already taken
        if (data.username) {
            const existingUsername = await prisma.user.findUnique({ where: { username: data.username } })
            if (existingUsername) return res.status(409).json({ error: 'Username already taken' })
        }

        const hashed = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashed,
                dob: data.dob ? new Date(data.dob) : null,
            },
            select: { id: true, email: true, firstName: true, lastName: true, username: true, avatar: true, bio: true, dob: true, gender: true }
        })

        const token = signToken(user.id)
        recordSignup().catch(() => {})
        
        // Log registration activity
        logActivity(user.id, ACTIVITY_TYPES.REGISTER, 'user', user.id, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }).catch(() => {})
        
        res.status(201).json({ token, user })
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message })
        }
        next(err)
    }
})

// ── Login ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
    email:    z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
})

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body)

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return res.status(401).json({ error: 'Invalid email or password' })

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

        const token = signToken(user.id)
        const { password: _, ...safeUser } = user

        // Log login activity
        logActivity(user.id, ACTIVITY_TYPES.LOGIN, 'user', user.id, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }).catch(() => {})

        res.json({ token, user: safeUser })
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message })
        }
        next(err)
    }
})

// ── Me (get current user) ─────────────────────────────────────────────────────
const authMiddleware = require('../middleware/auth')

router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user })
})

module.exports = router
