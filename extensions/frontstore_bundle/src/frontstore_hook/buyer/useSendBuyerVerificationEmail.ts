import { Resend } from "resend";
import { buildSlugUrl } from "../../lib/buildUrl";
import {
  parseEmailVerificationPayload,
  sendBuyerEmailVerification,
} from "./sendBuyerEmailVerification";
import { type defineHook } from "@directus/extensions-sdk";
import { type HookEnvConfig } from "../config";
import { nanoid } from "nanoid";
import {
  EmailVerificationParsedVar,
  useParseEmailVerification,
} from "../email/emailVerification";
import { Liquid } from "liquidjs";

type HookConfig = Parameters<typeof defineHook>[0];
type RegisterFunctions = Parameters<HookConfig>[0];
type HookExtensionContext = Parameters<HookConfig>[1];
type ActionHandler = Parameters<RegisterFunctions["action"]>[1];
type EventContext = Parameters<ActionHandler>[1];

export type SendBuyerVerificationEmailCommand = {
  buyerId: string;
  email: string;
  verifyCode: unknown;
  verifyExpiresAt: unknown;
};

type Deps = {
  services: HookExtensionContext["services"];
  logger: HookExtensionContext["logger"];
  config: HookEnvConfig;
};

export function useSendBuyerVerificationEmail(deps: Deps) {
  const { services, logger, config } = deps;
  const { resendApiToken, emailFrom, storeUrl, orderPathFormat } = config;

  async function execute(
    cmd: SendBuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    const payload = parseEmailVerificationPayload({
      verify_expires_at: cmd.verifyExpiresAt,
      verify_code: cmd.verifyCode,
      email: cmd.email,
    });

    if (payload.status === "error") {
      logger.error([logId, "[frontstore_hook] payload.invalid", payload.msg]);
      return;
    }

    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return;
    }

    const orderSv = new services.ItemsService<{
      id: string;
      slug: string;
      order_id: string;
    }>("order", {
      knex: ctx.database,
      schema: ctx.schema,
      accountability: ctx.accountability,
    });

    const orders = await orderSv.readByQuery({
      fields: ["id", "slug", "order_id"],
      filter: { buyer: { _eq: cmd.buyerId } },
      limit: 1,
    });

    const order = orders?.[0] || null;
    if (!order) {
      logger.error([logId, "[frontstore_hook] order.not_found", cmd.buyerId]);
      return;
    }

    try {
      const resend = new Resend(resendApiToken);
      await sendBuyerEmailVerification({
        resend,
        mailFrom: emailFrom,
        mailTo: payload.email,
        code: payload.code,
        order: {
          order_id: order.order_id,
          order_url: buildSlugUrl(order.slug, storeUrl, orderPathFormat),
        },
        logId,
        logger,
      });
      logger.info([logId, "[frontstore_hook] success"]);
    } catch (error) {
      logger.error([logId, "[frontstore_hook] error", String(error)]);
    }
  }

  return { execute };
}

export function useCreateBuyerVerificationEmailSending(deps: Deps) {
  const { services, logger, config } = deps;
  const { storeUrl, orderPathFormat } = config;
  const liquid = new Liquid();
  const mail = useParseEmailVerification(liquid);

  async function execute(
    cmd: SendBuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    const payload = parseEmailVerificationPayload({
      verify_expires_at: cmd.verifyExpiresAt,
      verify_code: cmd.verifyCode,
      email: cmd.email,
    });

    if (payload.status === "error") {
      logger.error([logId, "[frontstore_hook] payload.invalid", payload.msg]);
      return;
    }

    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return;
    }

    const orderSv = new services.ItemsService<{
      id: string;
      slug: string;
      order_id: string;
    }>("order", {
      knex: ctx.database,
      schema: ctx.schema,
      accountability: ctx.accountability,
    });

    const orders = await orderSv.readByQuery({
      fields: ["id", "slug", "order_id"],
      filter: { buyer: { _eq: cmd.buyerId } },
      limit: 1,
    });

    const order = orders?.[0] || null;
    if (!order) {
      logger.error([logId, "[frontstore_hook] order.not_found", cmd.buyerId]);
      return;
    }

    const order_url = buildSlugUrl(order.slug, storeUrl, orderPathFormat);
    let parsed: EmailVerificationParsedVar | null = null;

    try {
      parsed = await mail.parse({
        html: {
          YEAR: new Date().getFullYear().toString(),
          USER_EMAIL: payload.email,
          BRAND: "Simpla",
          ORDER_ID: order.order_id,
          ORDER_URL: order_url,
          OTP_CODE: payload.code.verify_code,
          OTP_EXPIRES_MINUTES: payload.code.duration.toString(),
        },
        subject: {
          ORDER_ID: order.order_id,
        },
        preview: {},
      });
    } catch (error) {
      logger.error([logId, "[frontstore_hook] parse.error", String(error)]);
      return;
    }

    try {
      const sendingSv = new services.ItemsService("email_sending", {
        knex: ctx.database,
        schema: ctx.schema,
        accountability: ctx.accountability,
      });
      const slug = nanoid(64);
      const res = await sendingSv.createOne({
        slug: slug,
        to: payload.email,
        subject: parsed.subject,
        preview: parsed.preview,
        html: parsed.html,
      });
      logger.info([logId, "[frontstore_hook] success", res.toString()]);
    } catch (error) {
      logger.error([logId, "[frontstore_hook] error", String(error)]);
    }
  }

  return { execute };
}
