const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { recordSignup } = require('../lib/socket')

const signToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// ── Register ──────────────────────────────────────────────────────────────────
const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName:  z.string().min(1, 'Last name is required'),
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

        const hashed = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashed,
                dob: data.dob ? new Date(data.dob) : null,
            },
            select: { id: true, email: true, firstName: true, lastName: true, avatar: true }
        })

        const token = signToken(user.id)
        recordSignup().catch(() => {})
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
