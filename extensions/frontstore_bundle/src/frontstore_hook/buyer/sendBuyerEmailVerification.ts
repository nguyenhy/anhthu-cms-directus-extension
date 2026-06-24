import { EmailVerificationCodeVars } from "../email_verification_code";
import { isObject, isString } from "../utils/extract";
import { Resend } from "resend";

type EmailVerificationBuyerPayload = {
  verify_expires_at: Date;
  verify_code: string;
  email: string;
  duration: number;
};
type EmailVerificationOrderPayload = {
  order_id: string;
  order_url: string;
};
type Props = {
  resend: Resend;
  mailFrom: string;
  buyer: EmailVerificationBuyerPayload;
  order: EmailVerificationOrderPayload;
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
}):
  | { status: "success"; data: EmailVerificationBuyerPayload }
  | { status: "error"; msg: string } => {
  if (!isObject(payload)) {
    return { status: "error", msg: "payload_empty" };
  }

  const raw_verify_expires_at = payload.verify_expires_at;
  const raw_verify_code = payload.verify_code;
  const raw_email = payload.email;

  const verify_expires_at = isString(raw_verify_expires_at)
    ? raw_verify_expires_at
    : "";
  const verify_code = isString(raw_verify_code) ? raw_verify_code : "";
  const email = isString(raw_email) ? raw_email : "";

  if (!email) {
    return { status: "error", msg: "email.empty" };
  }

  if (!verify_expires_at) {
    return { status: "error", msg: "verify_expires_at.empty" };
  }

  if (!verify_code) {
    return { status: "error", msg: "verify_code.empty" };
  }

  const verifyExpiresDate = new Date(verify_expires_at);
  if (isNaN(verifyExpiresDate.valueOf())) {
    return { status: "error", msg: "verify_expires_at.NaN" };
  }

  const diffMs = verifyExpiresDate.valueOf() - Date.now();
  const diffMin = diffMs / (1000 * 60);
  const duration = Math.ceil(diffMin);
  if (!(duration > 0)) {
    return { status: "error", msg: "verify_expires_at.expired" };
  }

  return {
    status: "success",
    data: {
      verify_expires_at: verifyExpiresDate,
      verify_code: verify_code,
      email: email,
      duration: duration,
    },
  };
};

export const sendBuyerEmailVerification = async (
  props: Props,
): Promise<void> => {
  const { mailFrom, resend, buyer, order, logger, logId } = props;

  logger.info([
    logId,
    "[webhook.handler] sendBuyerEmailVerification.payload",
    buyer,
  ]);

  if (!mailFrom) {
    logger.error([
      logId,
      "[webhook.handler] sendBuyerEmailVerification.mail_from",
    ]);
    return;
  }

  const vars: EmailVerificationCodeVars = {
    BRAND: "Simpla",
    OTP_CODE: buyer.verify_code,
    OTP_EXPIRES_MINUTES: buyer.duration.toString(),
    USER_EMAIL: buyer.email,
    YEAR: new Date().getFullYear().toString(),
    ORDER_ID: order.order_id,
    ORDER_URL: order.order_url,
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
      to: [buyer.email],
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
