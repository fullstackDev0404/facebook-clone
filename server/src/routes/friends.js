const router = require('express').Router()
const auth   = require('../middleware/auth')
const {
  sendRequest,
  respondToRequest,
  removeFriend,
  clearRejectedRequest,
  getPendingRequests,
  getFriends,
  getSuggestions,
} = require('../controllers/friends')

// POST   /api/friends/request           — send a friend request
router.post('/request', auth, sendRequest)

// PUT    /api/friends/request/:id       — accept or reject a request (primary)
router.put('/request/:id', auth, respondToRequest)

// PATCH  /api/friends/:id/respond       — accept or reject (alias, kept for compatibility)
router.patch('/:id/respond', auth, respondToRequest)

// GET    /api/friends/requests          — list pending received requests
router.get('/requests', auth, getPendingRequests)

// GET    /api/friends/suggestions       — list people you may know
router.get('/suggestions', auth, getSuggestions)

// GET    /api/friends                   — list accepted friends
router.get('/', auth, getFriends)

// DELETE /api/friends/:id               — unfriend or cancel request
router.delete('/:id', auth, removeFriend)

// DELETE /api/friends/rejected/:id      — clear a rejected request (Option 3)
router.delete('/rejected/:id', auth, clearRejectedRequest)

module.exports = router
