const { ZodError } = require('zod')

/**
 * Accepts an object with optional `body`, `params`, `query` Zod schemas.
 * Example: validate({ body: schemaBody, params: schemaParams })
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body)
    if (schemas.params) req.params = schemas.params.parse(req.params)
    if (schemas.query) req.query = schemas.query.parse(req.query)
    return next()
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      return res.status(400).json({ error: 'Invalid request', details })
    }
    return next(err)
  }
}

module.exports = validate
