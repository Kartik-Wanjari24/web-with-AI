import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { generateOtpEmailHtml } from '../utils/emailTemplate.js';

let transporter = null;
let initialized = false;

/**
 * Initializes and verifies the Gmail Nodemailer transporter
 */
function initTransporter() {
  if (initialized) return transporter;
  initialized = true;

  const { user, pass } = config.smtp;

  if (!user || !pass) {
    console.warn('\n======================================================');
    console.warn('⚠️  [Email Service] GMAIL CREDENTIALS NOT CONFIGURED');
    console.warn('   Missing EMAIL_USER or EMAIL_PASS in .env');
    console.warn('   OTPs will be printed to this console for local testing.');
    console.warn('   To send real emails to Gmail, add EMAIL_USER and EMAIL_PASS to .env');
    console.warn('======================================================\n');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user,
        pass // Gmail 16-character App Password
      }
    });

    // Verify SMTP connection in background
    transporter.verify((err) => {
      if (err) {
        console.error('\n❌ [Email Service] Gmail SMTP verification failed:');
        console.error(`   ${err.message}`);
        console.error('   Please check that EMAIL_USER and your 16-character EMAIL_PASS App Password are correct.\n');
      } else {
        console.log(`\n✅ [Email Service] Gmail SMTP connected successfully! Outgoing: ${user}\n`);
      }
    });

    return transporter;
  } catch (err) {
    console.error('❌ [Email Service] Failed to create Gmail transporter:', err.message);
    return null;
  }
}

/**
 * Send the OTP email to a real inbox
 */
export async function sendOtpEmail({ to, otp, expiryMinutes }) {
  const htmlContent = generateOtpEmailHtml({ otp, email: to, expiryMinutes });

  // Print highly visible formatted console box for convenience & local debug
  console.log('\n======================================================');
  console.log('              🛡️  ADAPTIVESHIELD SECURITY OTP          ');
  console.log('======================================================');
  console.log(` Recipient : ${to}`);
  console.log(` OTP Code  : \x1b[1m\x1b[36m${otp}\x1b[0m`);
  console.log(` Expires   : in ${expiryMinutes} minutes`);
  console.log('======================================================\n');

  const activeTransporter = initTransporter();

  // Graceful fallback if credentials missing
  if (!activeTransporter) {
    return {
      success: true,
      delivered: false,
      fallbackConsole: true,
      message: 'EMAIL_USER or EMAIL_PASS not set. OTP logged to server console.'
    };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: config.smtp.from,
      to,
      subject: `AdaptiveShield Security Code: ${otp}`,
      text: `Your AdaptiveShield verification code is: ${otp}. It expires in ${expiryMinutes} minutes.`,
      html: htmlContent
    });

    console.log(`📧 [Email Service] OTP successfully delivered to Gmail: ${to} (MessageID: ${info.messageId})`);

    return {
      success: true,
      delivered: true,
      messageId: info.messageId
    };
  } catch (err) {
    console.error(`❌ [Email Service] Error dispatching email to ${to}:`, err.message);
    // Return gracefully with error details so OTP flow continues locally if needed
    return {
      success: true,
      delivered: false,
      fallbackConsole: true,
      error: err.message,
      message: 'Delivery error encountered. OTP displayed in server terminal.'
    };
  }
}
