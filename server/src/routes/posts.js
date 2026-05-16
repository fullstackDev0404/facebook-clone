const router = require('express').Router()
const auth = require('../middleware/auth')
const upload = require('../lib/upload')
const { createPost } = require('../controllers/posts')

// Handle multer errors (file type / size) before they reach the global error handler
const handleUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next()

        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image must be 5 MB or smaller' })
        }
        // fileFilter rejection or other multer error
        return res.status(400).json({ error: err.message || 'Only image files are allowed' })
    })
}

// POST /api/posts — create a post (text + optional image)
router.post('/', auth, handleUpload, createPost)

module.exports = router
