const logger = require('../lib/logger')

const errorHandler = (err, req, res, next) => {
    const meta = {
        reqId: req?.id,
        url: req?.originalUrl,
        method: req?.method,
        status: err.status || err.statusCode || 500,
    }

    if (process.env.NODE_ENV !== 'production') {
        logger.error({ ...meta, err }, err.stack)
    } else {
        logger.error({ ...meta, error: err.message })
    }

    // Prisma known errors
    if (err.code === 'P2002') {
        return res.status(409).json({ error: 'A record with that value already exists.' })
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found.' })
    }

    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal server error'

    res.status(status).json({ error: message })
}

module.exports = errorHandler
