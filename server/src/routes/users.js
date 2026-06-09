const router = require('express').Router()
const { getProfile, updateProfile } = require('../controllers/users')
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Create upload directories if they don't exist
const ensureUploadDirs = () => {
  const dirs = ['uploads', 'uploads/avatars', 'uploads/covers']
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
    }
  })
}
ensureUploadDirs()

// Multer configuration for profile uploads (avatar or coverPhoto)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, path.join(process.cwd(), 'uploads', 'avatars'))
    } else if (file.fieldname === 'coverPhoto') {
      cb(null, path.join(process.cwd(), 'uploads', 'covers'))
    } else {
      cb(new Error('Invalid field name'), false)
    }
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Only image files are allowed'), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// PUT /api/users/profile — authenticated, multipart (avatar or coverPhoto)
router.put('/profile', auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), updateProfile)

// GET /api/users/:id
router.get('/:id', getProfile)

module.exports = router
