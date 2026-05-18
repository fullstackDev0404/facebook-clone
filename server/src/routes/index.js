const router = require('express').Router()

router.use('/auth',          require('./auth'))
router.use('/posts',         require('./posts'))
router.use('/friends',       require('./friends'))
router.use('/notifications', require('./notifications'))

// router.use('/users',    require('./users'))
// router.use('/messages', require('./messages'))

module.exports = router
