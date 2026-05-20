const router = require('express').Router()
const auth = require('../middleware/auth')
const { getChatHistory, sendMessage } = require('../controllers/messages')

// POST /api/messages
router.post('/', auth, sendMessage)

// GET /api/messages/:userId
router.get('/:userId', auth, getChatHistory)

module.exports = router
