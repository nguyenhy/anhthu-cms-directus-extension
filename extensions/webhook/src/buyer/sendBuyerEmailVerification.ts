import { EmailVerificationCodeVars } from "../email_verification_code";
import { isObject, isString } from "../utils/extract";
import { Resend } from "resend";

type EmailVerificationPayload = {
  verify_expires_at: Date;
  verify_code: string;
  email: string;
};
type Props = {
  resend: Resend;
  mailFrom: string;
  payload: EmailVerificationPayload;
  logId: string;
  logger: {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
};

export const parseEmailVerificationPayload = (payload: {
  verify_expires_at: unknown;
  verify_code: unknown;
  email: unknown;
}): EmailVerificationPayload | null => {
  if (!isObject(payload)) {
    return null;
  }

  const raw_verify_expires_at = payload.verify_expires_at;
  const raw_verify_code = payload.verify_code;
  const raw_email = payload.email;

  const verify_expires_at = isString(raw_verify_expires_at)
    ? raw_verify_expires_at
    : "";
  const verify_code = isString(raw_verify_code) ? raw_verify_code : "";
  const email = isString(raw_email) ? raw_email : "";

  if (!email || !verify_expires_at || !verify_code) {
    return null;
  }

  const verifyExpiresDate = new Date(verify_expires_at);
  if (isNaN(verifyExpiresDate.valueOf())) {
    return null;
  }

  return {
    verify_expires_at: verifyExpiresDate,
    verify_code: verify_code,
    email: email,
  };
};

export const sendBuyerEmailVerification = async (
  props: Props,
): Promise<void> => {
  const { mailFrom, resend, payload, logger, logId } = props;

  logger.info([
    logId,
    "[webhook.handler] sendBuyerEmailVerification.payload",
    payload,
  ]);

  if (!mailFrom) {
    logger.error([
      logId,
      "[webhook.handler] sendBuyerEmailVerification.mail_from",
    ]);
    return;
  }

  const diffMs = payload.verify_expires_at.valueOf() - Date.now();
  const diffMin = diffMs / (1000 * 60);
  const duration = Math.ceil(diffMin);
  if (!(duration > 0)) {
    logger.error([
      logId,
      "[webhook.handler] sendBuyerEmailVerification.expired",
      diffMs,
      duration,
      payload,
    ]);
    return;
  }

  const vars: EmailVerificationCodeVars = {
    BRAND: "Simpla",
    OTP_CODE: payload.verify_code,
    OTP_EXPIRES_MINUTES: `${duration}`,
    USER_EMAIL: payload.email,
    YEAR: new Date().getFullYear().toString(),
  };

  logger.info([
    logId,
    "[webhook.handler] sendBuyerEmailVerification.vars",
    vars,
    mailFrom,
  ]);

  try {
    const result = await resend.emails.send({
      from: mailFrom,
      to: [payload.email],
      template: {
        id: "simpla-user-email-verification",
        variables: vars,
      },
    });
    const { data, error, headers } = result;
    if (error) {
      logger.error([
        logId,
        "[webhook.handler] sendBuyerEmailVerification.send_failed",
        data,
        error,
        headers,
      ]);
    } else {
      logger.info([
        logId,
        "[webhook.handler] sendBuyerEmailVerification.send",
        data,
        error,
        headers,
      ]);
    }
  } catch (error) {
    logger.error([
      logId,
      "[webhook.handler] sendBuyerEmailVerification.send_error",
      String(error),
    ]);
  }
};
