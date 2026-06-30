import { buildSlugUrl } from "../../lib/buildUrl";
import { type defineHook } from "@directus/extensions-sdk";
import { type HookEnvConfig } from "../config";
import { nanoid } from "nanoid";
import { isObject, isString } from "../utils/extract";
import {
  EmailVerificationHtmlVar,
  useParseEmailVerification,
} from "../email/emailVerification";

import { Liquid } from "liquidjs";

type HookConfig = Parameters<typeof defineHook>[0];
type RegisterFunctions = Parameters<HookConfig>[0];
type HookExtensionContext = Parameters<HookConfig>[1];
type ActionHandler = Parameters<RegisterFunctions["action"]>[1];
type EventContext = Parameters<ActionHandler>[1];

export type BuyerVerificationEmailCommand = {
  buyerId: string;
  email: string;
  verifyCode: unknown;
  verifyExpiresAt: unknown;
};

type Deps = {
  services: HookExtensionContext["services"];
  logger: HookExtensionContext["logger"];
  config: HookEnvConfig;
  sendEmail: (to: string, vars: EmailVerificationHtmlVar) => Promise<unknown>;
};

type PreparedEmail = {
  to: string;
  variables: EmailVerificationHtmlVar;
};

type VerificationCode = {
  verify_expires_at: Date;
  verify_code: string;
  duration: number;
};

const parseVerificationPayload = (payload: {
  verify_expires_at: unknown;
  verify_code: unknown;
  email: unknown;
}):
  | { status: "success"; code: VerificationCode; email: string }
  | { status: "error"; msg: string } => {
  if (!isObject(payload)) {
    return { status: "error", msg: "payload_empty" };
  }

  const verify_expires_at = isString(payload.verify_expires_at)
    ? payload.verify_expires_at
    : "";
  const verify_code = isString(payload.verify_code) ? payload.verify_code : "";
  const email = isString(payload.email) ? payload.email : "";

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

  const duration = Math.ceil(
    (verifyExpiresDate.valueOf() - Date.now()) / (1000 * 60),
  );
  if (!(duration > 0)) {
    return { status: "error", msg: "verify_expires_at.expired" };
  }

  return {
    status: "success",
    email,
    code: { verify_expires_at: verifyExpiresDate, verify_code, duration },
  };
};

export function useBuyerVerificationEmail(deps: Deps) {
  const { services, logger, config, sendEmail } = deps;
  const { brand, storeUrl, orderPathFormat } = config;
  const liquid = new Liquid();
  const mail = useParseEmailVerification(liquid);

  async function prepare(
    cmd: BuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<PreparedEmail | null> {
    const payload = parseVerificationPayload({
      verify_expires_at: cmd.verifyExpiresAt,
      verify_code: cmd.verifyCode,
      email: cmd.email,
    });

    if (payload.status === "error") {
      logger.error([logId, "[frontstore_hook] payload.invalid", payload.msg]);
      return null;
    }

    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return null;
    }

    const orderSv = new services.ItemsService<{
      id: string;
      slug: string;
      order_id: string;
      buyer: {
        email: string;
        name?: string;
      } | null;
    }>("order", {
      knex: ctx.database,
      schema: ctx.schema,
      accountability: ctx.accountability,
    });

    const orders = await orderSv.readByQuery({
      fields: ["id", "slug", "order_id", "buyer.email", "buyer.name"],
      filter: { buyer: { _eq: cmd.buyerId } },
      limit: 1,
    });

    const order = orders?.[0] || null;
    if (!order) {
      logger.error([logId, "[frontstore_hook] order.not_found", cmd.buyerId]);
      return null;
    }

    return {
      to: order.buyer
        ? order.buyer.name
          ? `${order.buyer.name} <${payload.email}>`
          : payload.email
        : payload.email,
      variables: {
        BRAND: brand,
        OTP_CODE: payload.code.verify_code,
        OTP_EXPIRES_MINUTES: payload.code.duration.toString(),
        USER_EMAIL: payload.email,
        YEAR: new Date().getFullYear().toString(),
        ORDER_ID: order.order_id,
        ORDER_URL: buildSlugUrl(order.slug, storeUrl, orderPathFormat),
      },
    };
  }

  async function sendDirect(
    cmd: BuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    const data = await prepare(cmd, ctx, logId);
    if (!data) return;

    try {
      const result = await sendEmail(data.to, data.variables);
      logger.info([logId, "[frontstore_hook] sendDirect.success", result]);
    } catch (error) {
      logger.error([
        logId,
        "[frontstore_hook] sendDirect.error",
        String(error),
      ]);
      await saveRecord(ctx, logId, data, String(error));
    }
  }

  async function saveRecord(
    ctx: EventContext,
    logId: string,
    data: PreparedEmail,
    reason?: string,
  ): Promise<void> {
    try {
      const parsed = await mail.parse({
        html: data.variables,
        subject: { ORDER_ID: data.variables.ORDER_ID },
        preview: {},
      });

      const sendingSv = new services.ItemsService("email_sending", {
        knex: ctx.database,
        schema: ctx.schema!,
        accountability: ctx.accountability,
      });
      const res = await sendingSv.createOne({
        slug: nanoid(64),
        to: data.to,
        subject: parsed.subject,
        preview: parsed.preview,
        html: parsed.html,
        reason,
      });
      logger.info([
        logId,
        "[frontstore_hook] saveRecord.success",
        res.toString(),
      ]);
    } catch (error) {
      logger.error([
        logId,
        "[frontstore_hook] saveRecord.error",
        String(error),
      ]);
    }
  }

  return { sendDirect };
}
