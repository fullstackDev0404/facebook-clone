const { z } = require('zod')

const createPostSchema = z.object({
  content: z.string().min(1).optional(),
  feeling: z.string().min(1).optional(),
  // taggedIds can be an array when sent as JSON (client may send stringified JSON)
  taggedIds: z.union([z.string(), z.array(z.string())]).optional(),
})

const updatePostSchema = z.object({
  content: z.string().min(1),
})

module.exports = { createPostSchema, updatePostSchema }
