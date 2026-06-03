const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { logActivity, ACTIVITY_TYPES } = require('../lib/activityLogger')
const passport = require('../lib/passport')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/mailer')

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

        // Check if email already exists in users or pending registrations
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
        if (existingUser) return res.status(409).json({ error: 'Email already in use' })

        const existingPending = await prisma.pendingRegistration.findUnique({ where: { email: data.email } })
        if (existingPending) {
            // Email already pending - resend verification email and redirect
            sendVerificationEmail(data.email, data.firstName, existingPending.emailVerificationToken).catch(() => {})
            
            return res.status(200).json({ 
                message: 'Email already pending verification. A new verification email has been sent.', 
                emailVerificationSent: true,
                email: data.email
            })
        }

        // Check if username is already taken
        if (data.username) {
            const existingUsername = await prisma.user.findUnique({ where: { username: data.username } })
            if (existingUsername) return res.status(409).json({ error: 'Username already taken' })
        }

        const hashed = await bcrypt.hash(data.password, 10)

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex')
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store in pending registrations instead of users
        await prisma.pendingRegistration.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashed,
                firstName: data.firstName,
                lastName: data.lastName,
                dob: data.dob ? new Date(data.dob) : null,
                gender: data.gender,
                emailVerificationToken,
                emailVerificationExpires,
            },
        })

        // Send verification email (non-blocking — don't fail registration if email fails)
        sendVerificationEmail(data.email, data.firstName, emailVerificationToken).catch(() => {})

        res.status(201).json({ 
            message: 'Registration successful. Please verify your email to complete registration.', 
            emailVerificationSent: true,
            email: data.email
        })
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

// ── Refresh Token ─────────────────────────────────────────────────────────────
router.post('/refresh', authMiddleware, (req, res) => {
    try {
        const token = signToken(req.user.id)
        res.json({ token })
    } catch (err) {
        next(err)
    }
})

// ── Email Verification ────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res, next) => {
    try {
        const { token: verificationToken } = req.query
        if (!verificationToken) return res.status(400).json({ error: 'Verification token is required' })

        const pending = await prisma.pendingRegistration.findFirst({
            where: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: { gt: new Date() },
            },
        })

        if (!pending) return res.status(400).json({ error: 'Invalid or expired verification token' })

        // Check if email or username already taken (in case of race condition)
        const existingUser = await prisma.user.findUnique({ where: { email: pending.email } })
        if (existingUser) {
            await prisma.pendingRegistration.delete({ where: { id: pending.id } })
            return res.status(409).json({ error: 'Email already registered' })
        }

        if (pending.username) {
            const existingUsername = await prisma.user.findUnique({ where: { username: pending.username } })
            if (existingUsername) {
                await prisma.pendingRegistration.delete({ where: { id: pending.id } })
                return res.status(409).json({ error: 'Username already taken' })
            }
        }

        // Create the user from pending registration
        const user = await prisma.user.create({
            data: {
                email: pending.email,
                username: pending.username,
                password: pending.password,
                firstName: pending.firstName,
                lastName: pending.lastName,
                dob: pending.dob,
                gender: pending.gender,
                emailVerified: true,
            },
            select: { id: true, email: true, firstName: true, lastName: true, username: true, avatar: true, bio: true, dob: true, gender: true }
        })

        // Delete the pending registration
        await prisma.pendingRegistration.delete({ where: { id: pending.id } })

        // Log registration activity
        logActivity(user.id, ACTIVITY_TYPES.REGISTER, 'user', user.id, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }).catch(() => {})

        res.json({ message: 'Email verified successfully' })
    } catch (err) {
        next(err)
    }
})

// ── Resend Verification Email ─────────────────────────────────────────────────
router.post('/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const pending = await prisma.pendingRegistration.findUnique({ where: { email } })
        if (!pending) return res.status(404).json({ error: 'No pending registration found for this email' })

        const emailVerificationToken = crypto.randomBytes(32).toString('hex')
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await prisma.pendingRegistration.update({
            where: { id: pending.id },
            data: { emailVerificationToken, emailVerificationExpires },
        })

        await sendVerificationEmail(pending.email, pending.firstName, emailVerificationToken)

        res.json({ message: 'Verification email sent' })
    } catch (err) {
        next(err)
    }
})

// ── Forgot Password ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' })
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetExpires },
        })

        await sendPasswordResetEmail(user.email, user.firstName, resetToken).catch(() => {})

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' })
    } catch (err) {
        next(err)
    }
})

// ── Reset Password ───────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, password } = req.body
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' })

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpires: { gt: new Date() },
            },
        })

        if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' })

        const hashed = await bcrypt.hash(password, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                resetToken: null,
                resetExpires: null,
            },
        })

        res.json({ message: 'Password reset successfully' })
    } catch (err) {
        next(err)
    }
})

// ── Google OAuth ───────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

    router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
        try {
            const token = signToken(req.user.id)
            
            // Log login activity
            logActivity(req.user.id, ACTIVITY_TYPES.LOGIN, 'user', req.user.id, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                method: 'google_oauth',
            }).catch(() => {})

            // Redirect to client with token
            const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`
            res.redirect(redirectUrl)
        } catch (err) {
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`)
        }
    })
} else {
    // Return 501 for Google auth routes if not configured
    router.get('/google', (req, res) => {
        res.status(501).json({ error: 'Google OAuth is not configured' })
    })
    router.get('/google/callback', (req, res) => {
        res.status(501).json({ error: 'Google OAuth is not configured' })
    })
}

// ── Microsoft OAuth ────────────────────────────────────────────────────────────
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }))

    router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), async (req, res) => {
        try {
            const token = signToken(req.user.id)
            
            // Log login activity
            logActivity(req.user.id, ACTIVITY_TYPES.LOGIN, 'user', req.user.id, {
                ip: req.ip,
                userAgent: req.get('user-agent'),
                method: 'microsoft_oauth',
            }).catch(() => {})

            // Redirect to client with token
            const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`
            res.redirect(redirectUrl)
        } catch (err) {
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=auth_failed`)
        }
    })
} else {
    // Return 501 for Microsoft auth routes if not configured
    router.get('/microsoft', (req, res) => {
        res.status(501).json({ error: 'Microsoft OAuth is not configured' })
    })
    router.get('/microsoft/callback', (req, res) => {
        res.status(501).json({ error: 'Microsoft OAuth is not configured' })
    })
}

module.exports = router
