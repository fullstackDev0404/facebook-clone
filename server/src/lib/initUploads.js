const path = require('path')
const fs = require('fs').promises

async function ensureUploadDirs() {
  const base = path.join(process.cwd(), 'uploads')
  const dirs = [
    base,
    path.join(base, 'posts'),
    path.join(base, 'avatars'),
    path.join(base, 'stories'),
  ]

  for (const d of dirs) {
    try {
      await fs.mkdir(d, { recursive: true })
    } catch (err) {
      // If creation fails, throw to surface during startup
      throw new Error(`Failed to ensure upload directory ${d}: ${err.message}`)
    }
  }
}

module.exports = { ensureUploadDirs }
