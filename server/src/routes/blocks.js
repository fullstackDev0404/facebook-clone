const express = require('express')
const router = express.Router()
const blocksController = require('../controllers/blocks')
const auth = require('../middleware/auth')

// All block routes require authentication
router.use(auth)

/**
 * POST /api/blocks
 * Block a user
 */
router.post('/', blocksController.blockUser)

/**
 * DELETE /api/blocks/:blockedId
 * Unblock a user
 */
router.delete('/:blockedId', blocksController.unblockUser)

/**
 * GET /api/blocks
 * Get list of blocked users
 */
router.get('/', blocksController.getBlockedUsers)

/**
 * GET /api/blocks/check/:userId
 * Check if a user is blocked
 */
router.get('/check/:userId', blocksController.checkBlock)

/**
 * GET /api/blocks/blocked-by
 * Get users who have blocked the current user
 */
router.get('/blocked-by', blocksController.getBlockedBy)

module.exports = router
