const pino = require('pino')

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const logger = pino({
  level,
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
})

module.exports = logger
