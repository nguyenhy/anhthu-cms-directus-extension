import { Liquid, RenderOptions } from "liquidjs";
import { useParseEmailTemplate } from "./emailParser";

export const emailConfirmPaymentHTML = () => {
  return `
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your order is ready — {{BRAND}}</title>
</head>

<body style="background-color: #f4f6f2; font-family: Inter, Helvetica, Arial, ui-sans-serif, sans-serif; font-size: 16px; color: #0e0f0c; -webkit-font-smoothing: antialiased; margin: 0; padding: 40px 16px;">

  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all;">Your digital products are ready to download. Order {{ORDER_ID}} — access your files now.</div>

  <div style="max-width: 600px; margin: 0 auto;">

    <div style="background-color: #0e0f0c; border-radius: 40px 40px 0 0; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between;">
      <a href="{{STORE_URL}}" style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 24px; color: #9fe870; letter-spacing: -0.02em; line-height: 1; text-decoration: none;">{{BRAND}}</a>
      <span style="background-color: rgba(159,232,112,0.15); color: #9fe870; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; border: 1px solid rgba(159,232,112,0.3);">Payment confirmed</span>
    </div>

    <div style="background-color: #ffffff; padding: 48px 40px;">

      <div style="margin-bottom: 36px;">
        <p style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #868685; margin: 0 0 12px 0;">Digital delivery</p>
        <h1 style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 40px; line-height: 0.9; color: #0e0f0c; margin: 0 0 16px 0;">Your files are ready.</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #868685; margin: 0; max-width: 480px;">Payment confirmed. Download your products below — links are available any time from your order page.</p>
      </div>

      <div style="background-color: #e8ebe6; border-radius: 16px; padding: 20px 24px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div style="font-size: 13px; color: #868685;">
          Order ID
          <strong style="display: block; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 15px; font-weight: 600; color: #0e0f0c; margin-top: 2px; letter-spacing: 0.02em;">{{ORDER_ID}}</strong>
        </div>
        <div>
          <a href="{{ORDER_URL}}" style="display: inline-flex; align-items: center; gap: 6px; background-color: #9fe870; color: #163300; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 9999px; text-decoration: none; white-space: nowrap;">View order →</a>
        </div>
      </div>

      <div style="height: 1px; background-color: rgba(14,15,12,0.12); margin: 32px 0;"></div>

      <p style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 20px; line-height: 1; color: #0e0f0c; margin: 0 0 16px 0;">Order summary</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <tr>
          <td style="padding: 13px 0; border-bottom: 1px solid rgba(14,15,12,0.12); font-size: 15px; color: #868685;">Subtotal</td>
          <td style="padding: 13px 0; border-bottom: 1px solid rgba(14,15,12,0.12); font-size: 15px; text-align: right; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 600; color: #0e0f0c;">{{SUBTOTAL}}</td>
        </tr>
        <tr>
          <td style="padding: 13px 0; border-bottom: 1px solid rgba(14,15,12,0.12); font-size: 15px; color: #054d28;">Coupon / Discount</td>
          <td style="padding: 13px 0; border-bottom: 1px solid rgba(14,15,12,0.12); font-size: 15px; text-align: right; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 600; color: #054d28;">−{{DISCOUNT}}</td>
        </tr>
        <tr>
          <td style="padding: 16px 0 13px 0; font-size: 17px; font-weight: 700; color: #0e0f0c;">Total paid</td>
          <td style="padding: 16px 0 13px 0; font-size: 17px; text-align: right; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 700; color: #0e0f0c;">{{TOTAL_PAID}}</td>
        </tr>
      </table>

      <div style="height: 1px; background-color: rgba(14,15,12,0.12); margin: 32px 0;"></div>

      <div style="background-color: #e8ebe6; border-radius: 16px; padding: 28px; text-align: center; margin: 8px 0 32px;">
        <p style="font-size: 14px; color: #868685; margin: 0 0 16px 0;">Your files are ready. Visit your download page to access all purchased products.</p>
        <a href="{{DOWNLOAD_URL}}" style="display: inline-block; background-color: #9fe870; color: #163300; font-size: 16px; font-weight: 600; line-height: 1; padding: 14px 28px; border-radius: 9999px; text-decoration: none; letter-spacing: -0.02em;">Download my products →</a>
        <div style="margin-top: 16px; font-size: 12px; color: #868685; line-height: 1.6;">
          Or copy this link to open manually:
          <span style="display: block; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12px; color: #0e0f0c; background-color: #e8ebe6; border: 1px solid rgba(14,15,12,0.12); border-radius: 8px; padding: 10px 14px; word-break: break-all; margin-top: 6px;">{{DOWNLOAD_URL}}</span>
        </div>
      </div>

      <div style="background-color: rgba(159,232,112,0.12); border: 1px solid rgba(159,232,112,0.4); border-radius: 16px; padding: 16px 20px; margin-bottom: 32px; font-size: 13px; line-height: 1.55; color: #0e0f0c;">
        <strong style="color: #163300;">Keep this email.</strong> Your download links are permanent and tied to this order. If you have trouble accessing your files, reply to this email or visit your order page.
      </div>

    </div>

    <div style="background-color: #0e0f0c; border-radius: 0 0 40px 40px; padding: 32px 40px; text-align: center;">
      <a href="{{STORE_URL}}" style="font-family: 'Wise Sans', Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 900; font-size: 18px; color: #9fe870; letter-spacing: -0.02em; text-decoration: none; display: block; margin-bottom: 16px;">{{BRAND}}</a>
      <div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
        <a href="{{ORDER_URL}}" style="font-size: 12px; color: #868685; text-decoration: none;">My order</a>
        <a href="{{SUPPORT_URL}}" style="font-size: 12px; color: #868685; text-decoration: none;">Support</a>
      </div>
      <p style="font-size: 11px; color: #868685; line-height: 1.7; margin: 0;">
        © {{YEAR}} {{BRAND}}. All rights reserved.<br>
        This is a transactional email for <a href="mailto:{{USER_EMAIL}}" style="color: #868685; text-decoration: underline;">{{USER_EMAIL}}</a> because you placed an order at <a href="{{STORE_URL}}" style="color: #868685; text-decoration: underline;">{{STORE_URL}}</a> or an account action was triggered.
      </p>
    </div>

  </div>
</body>
</html>
`;
};

export type EmailConfirmPaymentHtmlVar = {
  YEAR: string;
  BRAND: string;
  STORE_URL: string;
  SUPPORT_URL: string;

  USER_EMAIL: string;
  ORDER_ID: string;
  ORDER_URL: string;
  SUBTOTAL: string;
  DISCOUNT: string;
  TOTAL_PAID: string;
  DOWNLOAD_URL: string;
};

export const emailConfirmPaymentSubject = () => {
  return "Your downloads are ready for order {{ORDER_ID}}";
};

export type EmailConfirmPaymentSubjectVar = {
  ORDER_ID: string;
};

export const emailConfirmPaymentPreview = () => {
  return "Access your digital products now. Your files are ready to download.";
};

export type EmailConfirmPaymentPreviewVar = {};

export type EmailConfirmPaymentParsedVar = {
  html: string;
  subject: string;
  preview: string;
};

export const useParseEmailConfirmPayment = (liquid: Liquid) => {
  const html = emailConfirmPaymentHTML();
  const subject = emailConfirmPaymentSubject();
  const preview = emailConfirmPaymentPreview();

  return useParseEmailTemplate<
    EmailConfirmPaymentHtmlVar,
    EmailConfirmPaymentSubjectVar,
    EmailConfirmPaymentPreviewVar
  >(liquid, { html, subject, preview });
};
