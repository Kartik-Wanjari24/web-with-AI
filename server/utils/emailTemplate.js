/**
 * Generates high-contrast, responsive cyber-styled HTML email for OTP
 */
export function generateOtpEmailHtml({ otp, email, expiryMinutes }) {
  const digits = otp.split('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdaptiveShield Security Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050811;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #050811;
      padding-bottom: 40px;
    }
    .main-table {
      background-color: #0b0f19;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-spacing: 0;
      border-radius: 16px;
      border: 1px solid #1e293b;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header-td {
      padding: 36px 40px 24px;
      background: linear-gradient(180deg, rgba(2, 132, 199, 0.15) 0%, rgba(11, 15, 25, 0) 100%);
      border-bottom: 1px solid #1e293b;
    }
    .content-td {
      padding: 32px 40px;
    }
    .otp-container {
      background-color: #050811;
      border: 1px solid #0284c7;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #38bdf8;
      display: inline-block;
    }
    .footer-td {
      padding: 24px 40px;
      background-color: #080c14;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      background-color: #0f2744;
      border: 1px solid #0284c7;
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" align="center">
      <!-- Header -->
      <tr>
        <td class="header-td">
          <table width="100%">
            <tr>
              <td>
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  🛡️ Adaptive<span style="color: #38bdf8;">Shield</span>
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                  Next-Gen Autonomous Packet Inspection Engine
                </div>
              </td>
              <td align="right">
                <span class="badge">SEC-AUTH</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td class="content-td">
          <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0;">
            One-Time Passcode (OTP)
          </h1>
          <p style="font-size: 14px; line-height: 22px; color: #cbd5e1; margin: 0 0 20px 0;">
            You requested sign-in access for <strong style="color: #ffffff;">${email}</strong> to the AdaptiveShield security console. Use the one-time passcode below to verify your session:
          </p>

          <!-- OTP Box -->
          <div class="otp-container">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px;">
              Verification Code
            </div>
            <div class="otp-digits">${otp}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
              Expires in <strong style="color: #f8fafc;">${expiryMinutes} minutes</strong>
            </div>
          </div>

          <!-- Security note -->
          <div style="background-color: #111827; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
            <p style="font-size: 12px; color: #fbbf24; margin: 0; font-weight: 600;">
              Security Notice
            </p>
            <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0; line-height: 18px;">
              Never share this code with anyone. AdaptiveShield personnel will never ask for your verification code. If you did not initiate this request, your account may be under reconnaissance.
            </p>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer-td">
          <div>AdaptiveShield Intrusion Prevention & Firewall Engine v5.2</div>
          <div style="margin-top: 6px;">Automated cryptographic authentication service.</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}
