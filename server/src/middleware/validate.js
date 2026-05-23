// Lightweight request validation helpers
const parsePagination = (query, { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || defaultPage)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit))
  const skip  = (page - 1) * limit
  return { page, limit, skip }
}

const safeParseJsonArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch (e) {
    return []
  }
}

module.exports = { parsePagination, safeParseJsonArray }
