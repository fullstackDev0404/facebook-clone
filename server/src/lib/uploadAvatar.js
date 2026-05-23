const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Ensure avatar upload directory exists (OS-native path — filesystem only)
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars')
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
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }))
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
})

// Build a URL-safe path (always forward slashes) — call this before storing in Prisma
function toUrlPath(osPath) {
    return osPath.replace(/\\/g, '/')
}

module.exports = { upload, toUrlPath }
