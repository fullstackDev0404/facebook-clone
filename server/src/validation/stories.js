const { z } = require('zod')

const createStorySchema = z.object({
  text: z.string().min(1).optional(),
  backgroundColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/).optional(),
})

module.exports = { createStorySchema }
