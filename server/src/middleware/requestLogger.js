const crypto = require('crypto')
const logger = require('../lib/logger')

const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()
  req.id = requestId
  req.log = logger.child({ reqId: requestId, method: req.method, url: req.originalUrl || req.url })
  res.setHeader('x-request-id', requestId)
  next()
}

module.exports = requestLogger
