/**
 * Content Moderation Service
 * Provides profanity filtering, spam detection, and content analysis
 */

// Common profanity words list (can be expanded)
const PROFANITY_WORDS = new Set([
  // Strong profanity
  'fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'bastard', 'crap',
  'dick', 'piss', 'whore', 'slut', 'cock', 'pussy', 'fag', 'nigga',
  'nigger', 'retard', 'idiot', 'stupid', 'dumbass',
  // Variations and common misspellings
  'fuk', 'sh1t', 'b1tch', 'd4mn', 'h3ll', 'azz', 'a55', 'f4g',
  // Add more as needed
])

// Suspicious patterns for spam detection
const SPAM_PATTERNS = [
  /(?:^|\s)(?:buy|sell|cheap|free|discount|offer|deal|win|prize|cash|money|click|visit)(?:\s|$)/gi,
  /(?:http|https|www\.|\.com|\.net|\.org|\.io)/gi,
  /(\w)\1{4,}/g, // Repeated characters (e.g., "aaaaa")
  /[A-Z]{5,}/g, // Excessive caps
  /\d{10,}/g, // Long numbers (phone numbers, etc.)
]

const MAX_LINKS = 3
const MAX_CAPS_RATIO = 0.7 // 70% caps
const MIN_WORD_LENGTH = 2

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} - True if profanity detected
 */
const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false
  
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
  return words.some(word => PROFANITY_WORDS.has(word))
}

/**
 * Get list of profanity words found in text
 * @param {string} text - Text to check
 * @returns {string[]} - Array of profanity words found
 */
const getProfanityWords = (text) => {
  if (!text || typeof text !== 'string') return []
  
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
  return words.filter(word => PROFANITY_WORDS.has(word))
}

/**
 * Censor profanity in text
 * @param {string} text - Text to censor
 * @param {string} replacement - Replacement character (default: *)
 * @returns {string} - Censored text
 */
const censorProfanity = (text, replacement = '*') => {
  if (!text || typeof text !== 'string') return text
  
  const profanityWords = getProfanityWords(text)
  let censoredText = text
  
  profanityWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    censoredText = censoredText.replace(regex, replacement.repeat(word.length))
  })
  
  return censoredText
}

/**
 * Check if text appears to be spam
 * @param {string} text - Text to check
 * @returns {object} - Spam detection result
 */
const detectSpam = (text) => {
  if (!text || typeof text !== 'string') {
    return { isSpam: false, reasons: [] }
  }

  const reasons = []
  
  // Check for spam patterns
  SPAM_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      reasons.push('Contains suspicious patterns')
    }
  })
  
  // Check for excessive links
  const linkCount = (text.match(/https?:\/\/|www\./gi) || []).length
  if (linkCount > MAX_LINKS) {
    reasons.push('Too many links')
  }
  
  // Check for excessive caps
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 0) {
    const capsCount = (text.match(/[A-Z]/g) || []).length
    const capsRatio = capsCount / letters.length
    if (capsRatio > MAX_CAPS_RATIO) {
      reasons.push('Excessive capitalization')
    }
  }
  
  // Check for repeated characters
  if (/\w{1}\1{5,}/.test(text)) {
    reasons.push('Repeated characters')
  }
  
  // Check for very short or very long text
  const words = text.trim().split(/\s+/).filter(w => w.length >= MIN_WORD_LENGTH)
  if (words.length === 0) {
    reasons.push('No meaningful content')
  }
  
  return {
    isSpam: reasons.length > 0,
    reasons,
    score: reasons.length
  }
}

/**
 * Analyze content for moderation
 * @param {string} text - Text to analyze
 * @returns {object} - Analysis result
 */
const analyzeContent = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      safe: true,
      profanityDetected: false,
      spamDetected: false,
      profanityWords: [],
      spamReasons: [],
      censoredText: text,
      shouldFlag: false
    }
  }

  const profanityWords = getProfanityWords(text)
  const spamResult = detectSpam(text)
  const censoredText = censorProfanity(text)
  
  const shouldFlag = profanityWords.length > 0 || spamResult.isSpam
  
  return {
    safe: !shouldFlag,
    profanityDetected: profanityWords.length > 0,
    spamDetected: spamResult.isSpam,
    profanityWords,
    spamReasons: spamResult.reasons,
    censoredText,
    shouldFlag,
    spamScore: spamResult.score
  }
}

/**
 * Moderate content - returns censored version and flags if needed
 * @param {string} text - Text to moderate
 * @param {object} options - Moderation options
 * @returns {object} - Moderation result
 */
const moderateContent = (text, options = {}) => {
  const {
    autoCensor = true,
    autoFlag = true,
    blockProfanity = false
  } = options
  
  const analysis = analyzeContent(text)
  
  let result = {
    ...analysis,
    approved: true,
    action: null
  }
  
  // Determine action based on options
  if (blockProfanity && analysis.profanityDetected) {
    result.approved = false
    result.action = 'blocked'
  } else if (autoFlag && analysis.shouldFlag) {
    result.action = 'flagged'
  }
  
  return result
}

module.exports = {
  containsProfanity,
  getProfanityWords,
  censorProfanity,
  detectSpam,
  analyzeContent,
  moderateContent,
  PROFANITY_WORDS
}
