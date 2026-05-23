const router = require('express').Router()
const auth = require('../middleware/auth')
const validate = require('../middleware/zodValidate')
const { sendMessageSchema } = require('../validation/messages')
const { getChatHistory, sendMessage } = require('../controllers/messages')

// POST /api/messages
router.post('/', auth, validate({ body: sendMessageSchema }), sendMessage)

// GET /api/messages/:userId
router.get('/:userId', auth, getChatHistory)

module.exports = router
