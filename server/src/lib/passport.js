const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const prisma = require('./prisma')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true, username: true, avatar: true, bio: true, dob: true, gender: true }
    })
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value
      if (!email) {
        return done(new Error('No email found from Google profile'))
      }

      // Check if user exists by email
      let user = await prisma.user.findUnique({ where: { email } })

      if (user) {
        // User exists, return them
        const { password: _, ...safeUser } = user
        return done(null, safeUser)
      }

      // Create new user from Google profile
      const firstName = profile.name?.givenName || ''
      const lastName = profile.name?.familyName || ''
      const username = email.split('@')[0]
      
      // Generate unique username if taken
      let finalUsername = username
      let counter = 1
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}${counter}`
        counter++
      }

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          username: finalUsername,
          avatar: profile.photos?.[0]?.value || null,
          password: '', // No password for OAuth users
        },
        select: { id: true, email: true, firstName: true, lastName: true, username: true, avatar: true, bio: true, dob: true, gender: true }
      })

      done(null, user)
    } catch (err) {
      done(err, null)
    }
  }))
} else {
  console.warn('Google OAuth credentials not configured. Google login will not be available.')
}

module.exports = passport
