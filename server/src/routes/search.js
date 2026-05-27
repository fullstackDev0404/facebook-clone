const router = require('express').Router()
const auth = require('../middleware/auth')
const { searchUsers, searchPosts, globalSearch } = require('../controllers/search')

// Search users (requires auth)
router.get('/users', auth, searchUsers)

// Search posts (optional auth - shows reaction type if authenticated)
router.get('/posts', searchPosts)

// Global search (optional auth)
router.get('/', globalSearch)

module.exports = router
