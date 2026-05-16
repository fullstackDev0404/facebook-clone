const router = require('express').Router()

router.use('/auth',  require('./auth'))
router.use('/posts', require('./posts'))

// Placeholder routes — will be filled in Day 4+
// router.use('/users',         require('./users'))
// router.use('/friends',       require('./friends'))
// router.use('/notifications', require('./notifications'))
// router.use('/messages',      require('./messages'))

module.exports = router
