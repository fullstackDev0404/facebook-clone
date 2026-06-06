const router = require('express').Router()
const auth = require('../middleware/auth')
const validate = require('../middleware/zodValidate')
const { sendMessageSchema } = require('../validation/messages')
const { getChatHistory, sendMessage, markMessagesAsRead } = require('../controllers/messages')

// POST /api/messages
router.post('/', auth, validate({ body: sendMessageSchema }), sendMessage)

// GET /api/messages/:userId
router.get('/:userId', auth, getChatHistory)

// PUT /api/messages/:userId/read
router.put('/:userId/read', auth, markMessagesAsRead)

module.exports = router
