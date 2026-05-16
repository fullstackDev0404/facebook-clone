const router = require('express').Router()

router.use('/auth', require('./auth'))

// Placeholder routes — will be filled in Day 4+
// router.use('/posts',         require('./posts'))
// router.use('/users',         require('./users'))
// router.use('/friends',       require('./friends'))
// router.use('/notifications', require('./notifications'))
// router.use('/messages',      require('./messages'))

module.exports = router
