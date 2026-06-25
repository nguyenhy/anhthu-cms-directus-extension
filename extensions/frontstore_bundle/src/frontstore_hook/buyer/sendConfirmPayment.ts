import { ResendEmailConfirmPaymentVars } from "../email/ResendEmailConfirmPaymentVars";
import { isObject, isString } from "../utils/extract";
import { Resend } from "resend";

type Order = {
  order_id: string;
  order_url: string;
  subtotal: string;
  discount: string;
  total_paid: string;
  download_url: string;
};
type Store = {
  url: string;
  support_url: string;
};
type Props = {
  resend: Resend;
  mailFrom: string;
  mailTo: string;
  order: Order;
  store: Store;
  logId: string;
  logger: {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
};

export const parseConfirmPaymentPayload = (payload: {
  verify_expires_at: unknown;
  verify_code: unknown;
  email: unknown;
}):
  | {
      status: "success";
      email: string;
    }
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
    email,
  };
};

export const sendBuyerConfirmPayment = async (props: Props): Promise<void> => {
  const { mailFrom, mailTo, resend, store, order, logger, logId } = props;

  logger.info([logId, "[webhook.handler] payload"]);

  if (!mailFrom) {
    logger.error([logId, "[webhook.handler] mail_from"]);
    return;
  }

  const vars: ResendEmailConfirmPaymentVars = {
    YEAR: new Date().getFullYear().toString(),
    BRAND: "Simpla",
    STORE_URL: store.url,
    SUPPORT_URL: store.support_url,

    USER_EMAIL: mailTo,
    ORDER_ID: order.order_id,
    ORDER_URL: order.order_url,
    SUBTOTAL: order.subtotal,
    DISCOUNT: order.discount,
    TOTAL_PAID: order.total_paid,
    DOWNLOAD_URL: order.download_url,
  };

  try {
    const result = await resend.emails.send({
      from: mailFrom,
      to: [mailTo],
      template: {
        id: "simpla-payment-confirmation",
        variables: vars,
      },
    });
    const { data, error, headers } = result;
    if (error) {
      logger.error([logId, "failed", data, error, headers]);
    } else {
      logger.info([logId, "send", data, error, headers]);
    }
  } catch (error) {
    logger.error([logId, "send_error", String(error)]);
  }
};
