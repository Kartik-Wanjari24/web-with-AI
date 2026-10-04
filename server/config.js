import dotenv from 'dotenv';
dotenv.config();

// Determine email user and pass (support EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS)
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production_998127',
  smtp: {
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'false' ? false : true, // Gmail port 465 is secure SSL
    user: emailUser,
    pass: emailPass,
    from: process.env.EMAIL_FROM || (emailUser ? `"AdaptiveShield Security" <${emailUser}>` : '"AdaptiveShield Security" <no-reply@adaptiveshield.local>')
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10)
  }
};
