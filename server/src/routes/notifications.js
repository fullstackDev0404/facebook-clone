const router = require('express').Router()
const auth   = require('../middleware/auth')
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notifications')

// GET    /api/notifications              — list notifications (paginated)
router.get('/', auth, getNotifications)

// PUT    /api/notifications/read-all     — mark all as read (must be before /:id)
router.put('/read-all', auth, markAllRead)

// PUT    /api/notifications/:id/read     — mark one as read
router.put('/:id/read', auth, markRead)

// DELETE /api/notifications/:id          — delete one
router.delete('/:id', auth, deleteNotification)

module.exports = router
