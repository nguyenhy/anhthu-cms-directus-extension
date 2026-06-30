import { Liquid } from "liquidjs";
import { useParseEmailTemplate } from "./emailParser";

export const emailVerificationHTML = () => {
  return `
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your {{BRAND}} verification code</title>
</head>

<body style="background-color: #f4f6f2; font-family: Inter, Helvetica, Arial, ui-sans-serif, sans-serif; font-size: 16px; color: #0e0f0c; -webkit-font-smoothing: antialiased; margin: 0; padding: 40px 16px;">

  <span style="display:none; max-height:0px; overflow:hidden;">Your {{BRAND}} verification code is {{OTP_CODE}} — expires in {{OTP_EXPIRES_MINUTES}} minutes.</span>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 0;">

        <!-- ── Header ── -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0e0f0c; border-top-left-radius: 40px; border-top-right-radius: 40px; border-collapse: separate;">
          <tr>
            <td style="padding: 28px 40px; text-align: left; vertical-align: middle;">
              <span style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 24px; color: #9fe870; letter-spacing: -0.02em; line-height: 1;">{{BRAND}}</span>
            </td>
            <td style="padding: 28px 40px; text-align: right; vertical-align: middle; font-size: 12px; color: #868685;">
              Security notification
            </td>
          </tr>
        </table>

        <!-- ── Body ── -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
          <tr>
            <td style="padding: 48px 40px;">

              <!-- Icon -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 32px auto;">
                <tr>
                  <td align="center" valign="middle" style="width: 72px; height: 72px; background-color: #9fe870; border-radius: 50%; font-size: 32px; line-height: 72px; text-align: center;">
                    🔑
                  </td>
                </tr>
              </table>

              <!-- Hero -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 40px;">
                    <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #868685; margin: 0 0 12px 0;">Email verification</p>
                    <h1 style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 40px; line-height: 0.9; color: #0e0f0c; margin: 0 0 16px 0;">Your code</h1>
                    <p style="font-size: 16px; line-height: 1.6; color: #868685; margin: 0 auto; max-width: 440px;">Enter this code to verify your email address. Don't share it with anyone.</p>
                  </td>
                </tr>
              </table>

              <!-- OTP block -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0 12px 0;">
                <tr>
                  <td style="background-color: #e8ebe6; border-radius: 30px; padding: 36px 24px; text-align: center; border: 1px solid rgba(14,15,12,0.12);">
                    <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #868685; margin: 0 0 20px 0;">One-time code</p>
                    <p style="font-family: ui-monospace, 'SF Mono', Menlo, monospace;font-size: 32px;font-weight: 700;color: #0e0f0c;">{{OTP_CODE}}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #868685; margin: 12px 0 0 0; text-align: center;">⏱ This code expires in <strong>{{OTP_EXPIRES_MINUTES}}</strong> minutes</p>

              <div class="order-context" style="margin-top: 28px; background: #ffffff; border-radius: 12px; padding: 20px 24px; border: 1px solid #E3E5E2;">
                <p class="order-context-label" style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #868685; margin: 0 0 10px 0;">This code is for your order</p>
                <p class="order-context-desc" style="font-size: 14px; color: #0e0f0c; line-height: 1.5; margin: 0 0 14px 0;">Use the code above to verify your email for order <strong style="font-weight: 600;">{{ORDER_ID}}</strong>. You can view your order at the link below.</p>
                <a href="{{ORDER_URL}}" class="order-url-btn" style="display: inline-block; background: #9fe870; color: #0e0f0c; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px; padding: 10px 22px; margin: 0 0 14px 0;">View order →</a>
                <p class="order-url-manual" style="font-size: 12px; color: #868685; margin: 0 0 6px 0;">Or copy this link and open it manually in your browser:</p>
                <span class="order-url-text" style="display: block; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12px; color: #0e0f0c; background: #f4f6f2; border: 1px solid #E3E5E2; border-radius: 8px; padding: 10px 14px; word-break: break-all; line-height: 1.5;">{{ORDER_URL}}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- ── Footer ── -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0e0f0c; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; border-collapse: separate;">
          <tr>
            <td style="padding: 32px 40px;">
              <div style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 20px; color: #9fe870; margin-bottom: 20px;">{{BRAND}}</div>

              <p style="font-size: 12px; color: #4a4a48; line-height: 1.6; margin: 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
                © {{YEAR}} {{BRAND}}. All rights reserved.<br>
                This is a transactional email — you received it because an account action was triggered for <a href="mailto:{{USER_EMAIL}}" style="color: #868685; text-decoration: underline;">{{USER_EMAIL}}</a>.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>

</html>
`;
};

export type EmailVerificationHtmlVar = {
  YEAR: string;
  USER_EMAIL: string;
  BRAND: string;

  ORDER_ID: string;
  ORDER_URL: string;

  OTP_CODE: string;
  OTP_EXPIRES_MINUTES: string;
};

export const emailVerificationSubject = () => {
  return "Verification code for Order {{ORDER_ID}}";
};

export type EmailVerificationSubjectVar = {
  ORDER_ID: string;
};

export const emailVerificationPreview = () => {
  return "Use this code to verify your email for your order.";
};

export type EmailVerificationPreviewVar = {};

export type EmailVerificationParsedVar = {
  html: string;
  subject: string;
  preview: string;
};

export const useParseEmailVerification = (liquid: Liquid) => {
  const html = emailVerificationHTML();
  const subject = emailVerificationSubject();
  const preview = emailVerificationPreview();

  return useParseEmailTemplate<
    EmailVerificationHtmlVar,
    EmailVerificationSubjectVar,
    EmailVerificationPreviewVar
  >(liquid, { html, subject, preview });
};
