const router = require('express').Router()
const auth = require('../middleware/auth')
const { createStory, getFeed, deleteStory } = require('../controllers/stories')
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// ── Multer for story image uploads ─────────────────────────────────────────────

const storyUploadDir = path.join(process.cwd(), 'uploads', 'stories')
if (!fs.existsSync(storyUploadDir)) {
    fs.mkdirSync(storyUploadDir, { recursive: true })
}

const storyStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storyUploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, `${unique}${path.extname(file.originalname)}`)
    },
})

const storyFileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }))
    }
}

const storyUpload = multer({
    storage: storyStorage,
    fileFilter: storyFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for story images
})

// Handle multer errors before the global error handler
const handleUpload = (req, res, next) => {
    storyUpload.single('image')(req, res, (err) => {
        if (!err) return next()
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image must be 10 MB or smaller' })
        }
        return res.status(400).json({ error: err.message || 'Only image files are allowed' })
    })
}

// GET /api/stories/feed — paginated stories feed (own + accepted friends, non-expired)
router.get('/feed', auth, getFeed)

// POST /api/stories — create a story (image only, expires in 24 h)
router.post('/', auth, handleUpload, createStory)

// DELETE /api/stories/:id — delete a story (author only)
router.delete('/:id', auth, deleteStory)

module.exports = router
