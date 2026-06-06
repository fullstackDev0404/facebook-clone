const router = require('express').Router()
const auth = require('../middleware/auth')
const { updateComment, deleteComment, likeComment, unlikeComment } = require('../controllers/comments')

// PATCH /api/comments/:id — edit a comment (author only)
router.patch('/:id', auth, updateComment)

// DELETE /api/comments/:id — delete a comment (author only)
router.delete('/:id', auth, deleteComment)

// POST /api/comments/:id/like — add or update reaction
router.post('/:id/like', auth, likeComment)

// DELETE /api/comments/:id/like — remove reaction
router.delete('/:id/like', auth, unlikeComment)

module.exports = router
