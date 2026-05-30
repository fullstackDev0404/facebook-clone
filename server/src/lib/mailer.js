const nodemailer = require('nodemailer')

// Create transporter — uses SMTP env vars (Gmail, Outlook, or any SMTP)
const createTransporter = () => {
  // If using Gmail: set EMAIL_SERVICE=gmail, EMAIL_USER, EMAIL_PASS
  // If using SMTP:  set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }

  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

const FROM = process.env.EMAIL_FROM || `"Facebook Clone" <${process.env.EMAIL_USER}>`

/**
 * Send email verification link
 */
const sendVerificationEmail = async (to, firstName, token) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
  const verifyUrl = `${clientUrl}/auth/verify-email?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Verify your Facebook Clone email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0f2f5;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="color:#1877f2;font-size:28px;font-weight:bold;">facebook</span>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;">
          <h2 style="color:#1c1e21;margin:0 0 8px;">Hi ${firstName},</h2>
          <p style="color:#65676b;margin:0 0 24px;">Please verify your email address to complete your registration.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#1877f2;color:white;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;">
            Verify Email
          </a>
          <p style="color:#8a8d91;font-size:12px;margin:24px 0 0;">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
          <p style="color:#8a8d91;font-size:11px;margin:8px 0 0;word-break:break-all;">
            Or copy this link: ${verifyUrl}
          </p>
        </div>
      </div>
    `,
  })
}

/**
 * Send password reset email (for future use)
 */
const sendPasswordResetEmail = async (to, firstName, token) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
  const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset your Facebook Clone password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f0f2f5;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="color:#1877f2;font-size:28px;font-weight:bold;">facebook</span>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;">
          <h2 style="color:#1c1e21;margin:0 0 8px;">Hi ${firstName},</h2>
          <p style="color:#65676b;margin:0 0 24px;">Click the button below to reset your password.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1877f2;color:white;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:16px;">
            Reset Password
          </a>
          <p style="color:#8a8d91;font-size:12px;margin:24px 0 0;">
            This link expires in 1 hour. If you didn't request a password reset, ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail }
