const router = require('express').Router()

router.use('/auth',          require('./auth'))
router.use('/posts',         require('./posts'))
router.use('/friends',       require('./friends'))
router.use('/notifications', require('./notifications'))
router.use('/users',         require('./users'))
router.use('/messages',      require('./messages'))
router.use('/stories',       require('./stories'))
router.use('/search',         require('./search'))
router.use('/analytics',     require('./analytics'))
router.use('/moderation',    require('./moderation'))
router.use('/blocks',        require('./blocks'))

module.exports = router
