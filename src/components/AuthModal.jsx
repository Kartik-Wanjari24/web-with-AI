import React, { useState, useEffect, useRef } from 'react';
import { Shield, Mail, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { sendOtp, verifyOtp } = useAuth();

  // Step 1: 'EMAIL', Step 2: 'OTP', Step 3: 'SUCCESS'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 6 refs for OTP digits
  const inputRefs = useRef([]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccessMsg('');
      setCooldown(0);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first OTP input upon step change
  useEffect(() => {
    if (step === 'OTP' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step 1 Submit: Send OTP
  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid operator email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await sendOtp(email.trim());
      setStep('OTP');
      setCooldown(res.cooldownSeconds || 60);
      if (res.previewUrl) {
        setPreviewUrl(res.previewUrl);
      }
      setSuccessMsg(`Security code sent to ${email.trim()}`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Individual Digit Inputs
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, ''); // numbers only
    if (!cleaned) {
      // User deleted character
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    const digit = cleaned.slice(-1); // Take latest digit
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setError('');

    // Advance focus to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are entered, auto-verify
    if (nextOtp.every((d) => d !== '')) {
      handleVerify(nextOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current is already empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle Paste (e.g. user copies full 6 digits)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const nextOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        nextOtp[i] = digits[i] || '';
      }
      setOtp(nextOtp);
      setError('');

      const targetFocusIndex = Math.min(digits.length, 5);
      inputRefs.current[targetFocusIndex]?.focus();

      if (digits.length === 6) {
        handleVerify(digits);
      }
    }
  };

  // Step 2 Submit: Verify OTP
  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp(email.trim(), code);
      setStep('SUCCESS');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(email.trim());
      setCooldown(res.cooldownSeconds || 60);
      setOtp(['', '', '', '', '', '']);
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      setSuccessMsg('New security code dispatched.');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03060c]/85 backdrop-blur-md animate-packet-slide">
      <div
        className="relative w-full max-w-md bg-[#0b0f19] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Brand & Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-display">
                Operator Sign In
              </h2>
              <p className="text-xs text-slate-400">
                Email One-Time Passcode (OTP) Authentication
              </p>
            </div>
          </div>

          {/* Inline Error Notice */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs leading-relaxed animate-packet-slide">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Inline Success Notice */}
          {successMsg && !error && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-sky-950/70 border border-sky-500/40 text-sky-200 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Dev Mode Ethereal Preview Banner */}
          {previewUrl && step === 'OTP' && (
            <div className="p-3 mb-5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs">
              <span className="text-blue-300 font-semibold">Dev Preview: </span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 underline font-medium hover:text-white"
              >
                Open mock email in Ethereal inbox ↗
              </a>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Authorized Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@security.org"
                    className="w-full pl-10 pr-4 py-3 bg-[#060a12] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  A 6-digit numeric verification code will be dispatched to this address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-display mt-6"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-DIGIT OTP ENTRY */}
          {step === 'OTP' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Enter 6-Digit Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setError('');
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Sent to <span className="text-white font-medium">{email}</span>
                </p>

                {/* 6 Auto-advancing Input Boxes */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-[#060a12] border transition-all ${
                        digit
                          ? 'border-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'border-slate-700 text-slate-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                      }`}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={loading || otp.some((d) => !d)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 hover:from-blue-500 hover:to-sky-500 active:from-blue-700 active:to-sky-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-display"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Passcode...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authenticate Session</span>
                  </>
                )}
              </button>

              {/* Resend Cooldown Section */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className={`font-semibold cursor-pointer ${
                    cooldown > 0
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-sky-400 hover:text-sky-300'
                  }`}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-gentle-pulse">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Access Granted
              </h3>
              <p className="text-xs text-slate-300">
                Cryptographic session established for <span className="text-white font-semibold">{email}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
