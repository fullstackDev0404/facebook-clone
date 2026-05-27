const { z } = require('zod')

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  type: z.enum(['all', 'users', 'posts']).optional(),
})

module.exports = { searchQuerySchema }
