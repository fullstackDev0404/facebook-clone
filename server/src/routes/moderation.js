const express = require('express')
const router = express.Router()
const moderationController = require('../controllers/moderation')
const auth = require('../middleware/auth')

// All moderation routes require authentication
router.use(auth)

/**
 * POST /api/reports
 * Create a content report
 */
router.post('/reports', moderationController.createReport)

/**
 * GET /api/reports
 * Get all reports (admin only - add admin middleware later)
 */
router.get('/reports', moderationController.getReports)

/**
 * GET /api/reports/:id
 * Get a specific report
 */
router.get('/reports/:id', moderationController.getReport)

/**
 * PATCH /api/reports/:id
 * Update report status (admin only)
 */
router.patch('/reports/:id', moderationController.updateReport)

/**
 * POST /api/moderation/actions
 * Create a moderation action (admin only)
 */
router.post('/moderation/actions', moderationController.createModerationAction)

/**
 * GET /api/moderation/stats
 * Get moderation statistics (admin only)
 */
router.get('/moderation/stats', moderationController.getModerationStats)

/**
 * POST /api/moderation/analyze
 * Analyze content for moderation
 */
router.post('/moderation/analyze', moderationController.analyzeText)

module.exports = router
