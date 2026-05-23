const router = require('express').Router()
const auth = require('../middleware/auth')
const { upload } = require('../lib/upload')
const { createPost, getFeed, likePost, unlikePost, getComments, createComment, updatePost, deletePost, getPostLikes } = require('../controllers/posts')

// Handle multer errors (file type / size) before they reach the global error handler
const handleUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next()

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File must be 50 MB or smaller' })
        }
        return res.status(400).json({ error: err.message || 'Only image or video files are allowed' })
    })
}

// GET /api/posts/feed — paginated feed (own posts + accepted friends)
router.get('/feed', auth, getFeed)

// POST /api/posts — create a post (text + optional image)
router.post('/', auth, handleUpload, createPost)

// PATCH /api/posts/:id — edit a post (author only)
router.patch('/:id', auth, updatePost)

// DELETE /api/posts/:id — delete a post (author only)
router.delete('/:id', auth, deletePost)

// POST /api/posts/:id/like — add or update reaction
router.post('/:id/like', auth, likePost)

// DELETE /api/posts/:id/like — remove reaction
router.delete('/:id/like', auth, unlikePost)

// GET /api/posts/:id/likes — return reaction breakdown by type
router.get('/:id/likes', auth, getPostLikes)

// GET /api/posts/:id/comments — fetch all comments for a post
router.get('/:id/comments', auth, getComments)

// POST /api/posts/:id/comments — create a comment or reply
router.post('/:id/comments', auth, createComment)

module.exports = router
