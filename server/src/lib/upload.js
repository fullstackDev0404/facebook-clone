const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure upload directory exists (OS-native path — this is a filesystem path, not a URL)
const uploadDir = path.join(process.cwd(), 'uploads', 'posts')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, `${unique}${path.extname(file.originalname)}`)
    },
})

const fileFilter = (_req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    ]
    if (allowed.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(Object.assign(new Error('Only image or video files are allowed'), { status: 400 }))
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (covers videos)
})

// Build a URL-safe path (always forward slashes) — call this before storing in Prisma
function toUrlPath(osPath) {
    return osPath.replace(/\\/g, '/')
}

module.exports = { upload, toUrlPath }
