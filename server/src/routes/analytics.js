const router = require('express').Router()
const auth = require('../middleware/auth')
const {
    getOverview,
    getActivityTimeline,
    getPostAnalytics,
    getEngagementAnalytics,
} = require('../controllers/analytics')

// All analytics routes require authentication
router.get('/overview', auth, getOverview)
router.get('/activity', auth, getActivityTimeline)
router.get('/posts', auth, getPostAnalytics)
router.get('/engagement', auth, getEngagementAnalytics)

module.exports = router
