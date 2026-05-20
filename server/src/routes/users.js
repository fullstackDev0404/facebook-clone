const router = require('express').Router()
const { getProfile, updateProfile } = require('../controllers/users')
const auth = require('../middleware/auth')
const uploadAvatar = require('../lib/uploadAvatar')

// PUT /api/users/profile — authenticated, multipart (avatar)
router.put('/profile', auth, uploadAvatar.single('avatar'), updateProfile)

// GET /api/users/:id
router.get('/:id', getProfile)

module.exports = router
