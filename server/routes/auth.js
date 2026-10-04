import express from 'express';
import jwt from 'jsonwebtoken';
import { generateOtp, verifyOtp, clearOtp } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { findOrCreateUser, findUserByEmail } from '../db.js';
import { config } from '../config.js';

const router = express.Router();

// Strict email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/send-otp
 * Body: { email: string }
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Generate secure 6-digit OTP
    const otpResult = generateOtp(trimmedEmail);

    if (!otpResult.success) {
      return res.status(429).json({
        error: otpResult.message,
        remainingSeconds: otpResult.remainingSeconds
      });
    }

    // Send styled email via Nodemailer (Gmail SMTP or console fallback)
    const emailResult = await sendOtpEmail({
      to: trimmedEmail,
      otp: otpResult.otp,
      expiryMinutes: otpResult.expiresInMinutes
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${trimmedEmail}`,
      email: trimmedEmail,
      cooldownSeconds: otpResult.cooldownSeconds,
      expiresInMinutes: otpResult.expiresInMinutes,
      delivered: emailResult.delivered
    });
  } catch (err) {
    console.error('[Auth Route] send-otp error:', err);
    return res.status(500).json({ error: 'Internal server error processing OTP request.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email: string, otp: string }
 *
 * 1. Validates OTP and attempt counts.
 * 2. Checks if user exists in database; if not, creates new user record.
 * 3. Issues signed JWT session token embedding user DB id, email, and role.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(trimmedOtp)) {
      return res.status(400).json({ error: 'Verification code must be exactly 6 numeric digits.' });
    }

    const verification = verifyOtp(trimmedEmail, trimmedOtp);

    if (!verification.valid) {
      const statusCode = verification.locked ? 429 : 401;
      return res.status(statusCode).json({
        error: verification.reason,
        attemptsRemaining: verification.attemptsRemaining ?? null,
        locked: !!verification.locked,
        expired: !!verification.expired
      });
    }

    // ── DATABASE PERSISTENCE ────────────────────────────────────────────────
    // Look up or create user record in SQLite database
    const { isNewUser, user } = findOrCreateUser(trimmedEmail, 'SecOps Analyst');
    console.log(`[Database] User authenticated: ${user.email} (ID: ${user.id}, New User: ${isNewUser}, Logins: ${user.login_count})`);

    // Generate signed JWT user session token (valid for 24h)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created and authenticated successfully.' : 'Welcome back! Authentication successful.',
      isNewUser,
      token,
      user
    });
  } catch (err) {
    console.error('[Auth Route] verify-otp error:', err);
    return res.status(500).json({ error: 'Internal server error verifying OTP.' });
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns fresh user data directly from database
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  const { email } = req.body || {};
  if (email) {
    clearOtp(email);
  }
  return res.status(200).json({ success: true, message: 'Successfully logged out.' });
});

export default router;
