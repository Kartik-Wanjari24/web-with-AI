import crypto from 'crypto';
import { config } from '../config.js';

/**
 * In-memory OTP Cache: Map<email, { hashedOtp, expiresAt, attempts, lastSentAt }>
 */
const otpStore = new Map();

// Periodic garbage collection sweep every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60 * 1000);

/**
 * Hashes an OTP with HMAC or SHA-256 for secure in-memory comparison
 */
function hashOtp(otp, email) {
  return crypto.createHmac('sha256', config.jwtSecret).update(`${email}:${otp}`).digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 * Enforces resend cooldown and resets attempt counters.
 */
export function generateOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Enforce resend cooldown
  if (existing && now - existing.lastSentAt < config.otp.resendCooldownSeconds * 1000) {
    const remainingSeconds = Math.ceil((config.otp.resendCooldownSeconds * 1000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      cooldown: true,
      remainingSeconds,
      message: `Please wait ${remainingSeconds}s before requesting a new code.`
    };
  }

  // Generate 6-digit code between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(otp, normalizedEmail);
  const expiresAt = now + config.otp.expiryMinutes * 60 * 1000;

  otpStore.set(normalizedEmail, {
    hashedOtp,
    expiresAt,
    attempts: 0,
    lastSentAt: now
  });

  return {
    success: true,
    otp,
    expiresInMinutes: config.otp.expiryMinutes,
    cooldownSeconds: config.otp.resendCooldownSeconds
  };
}

/**
 * Verify a submitted OTP with attempt tracking and constant-time comparison
 */
export function verifyOtp(email, submittedOtp) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (!record) {
    return {
      valid: false,
      reason: 'No pending verification code found. Please request a new one.'
    };
  }

  // Check expiration
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      expired: true,
      reason: 'Verification code has expired. Please request a new one.'
    };
  }

  // Check brute force attempts
  if (record.attempts >= config.otp.maxAttempts) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      locked: true,
      reason: 'Maximum verification attempts exceeded. For your security, this code has been invalidated. Please request a new code.'
    };
  }

  // Increment attempts
  record.attempts += 1;

  // Hash submitted OTP and perform constant-time comparison
  const submittedHash = hashOtp(submittedOtp.trim(), normalizedEmail);
  const hashBuffer = Buffer.from(record.hashedOtp, 'utf8');
  const submittedBuffer = Buffer.from(submittedHash, 'utf8');

  const isMatch = hashBuffer.length === submittedBuffer.length && crypto.timingSafeEqual(hashBuffer, submittedBuffer);

  if (!isMatch) {
    const remainingAttempts = config.otp.maxAttempts - record.attempts;
    if (remainingAttempts <= 0) {
      otpStore.delete(normalizedEmail);
      return {
        valid: false,
        locked: true,
        reason: 'Incorrect code. Maximum attempts exceeded. Please request a new code.'
      };
    }
    return {
      valid: false,
      attemptsRemaining: remainingAttempts,
      reason: `Incorrect code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
    };
  }

  // Successful verification: delete code to prevent replay attacks
  otpStore.delete(normalizedEmail);
  return {
    valid: true
  };
}

/**
 * Clear pending OTP (e.g. for logout or email change)
 */
export function clearOtp(email) {
  otpStore.delete(email.trim().toLowerCase());
}
