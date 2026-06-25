import { Resend } from "resend";
import { buildSlugUrl, buildUrl } from "../../lib/buildUrl";
import {
  parseConfirmPaymentPayload,
  sendBuyerConfirmPayment,
} from "./sendConfirmPayment";
import { type defineHook } from "@directus/extensions-sdk";
import { type HookEnvConfig } from "../config";
import { nanoid } from "nanoid";
import {
  EmailVerificationParsedVar,
  useParseEmailVerification,
} from "../email/emailVerification";
import { Liquid } from "liquidjs";
import { useParseEmailConfirmPayment } from "../email/emailConfirmPayment";
import { formatMoney } from "../../lib/formatCurrency";

type HookConfig = Parameters<typeof defineHook>[0];
type RegisterFunctions = Parameters<HookConfig>[0];
type HookExtensionContext = Parameters<HookConfig>[1];
type ActionHandler = Parameters<RegisterFunctions["action"]>[1];
type EventContext = Parameters<ActionHandler>[1];

export type SendBuyerVerificationEmailCommand = {
  orderFulfillmentId: string;
};

type Deps = {
  services: HookExtensionContext["services"];
  logger: HookExtensionContext["logger"];
  config: HookEnvConfig;
};

export function useSendConfirmPaymentEmail(deps: Deps) {
  const { services, logger, config } = deps;
  const { resendApiToken, emailFrom, storeUrl, orderPathFormat } = config;

  async function execute(
    cmd: SendBuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return;
    }
    const matchSv = new services.ItemsService<{
      match_type: string;
      order: {
        order_id: string;
        slug: string;
        buyer: {
          email: string;
          name: string;
          phone: string;
          date_created: string;
          verified_at: string;
          verify_expires_at: string;
          verify_resend_at: null;
        };
        template: {
          name: string;
          slug: string;
          product: {
            price: string;
            currency: string;
          };
          category: {
            emoji: string;
            name: string;
            slug: string;
          };
        };
      };
      user_payment: {
        amount: string;
        currency: string;
      };
    }>("order_fulfillment", {
      knex: ctx.database,
      schema: ctx.schema,
      accountability: ctx.accountability,
    });

    const match = await matchSv.readOne(cmd.orderFulfillmentId, {
      fields: [
        //
        "match_type",
        "order.order_id",
        "order.slug",
        "order.buyer.email",
        "order.buyer.name",
        "order.buyer.phone",
        "order.buyer.date_created",
        "order.buyer.verified_at",
        "order.buyer.verify_expires_at",
        "order.buyer.verify_resend_at",
        "order.template.name",
        "order.template.slug",
        "order.template.product.price",
        "order.template.product.currency",
        "order.template.category.emoji",
        "order.template.category.name",
        "order.template.category.slug",
        "user_payment.amount",
        "user_payment.currency",
      ],
    });
    if (!match) {
      logger.error([
        logId,
        "[frontstore_hook] order_fulfillment.not_found",
        cmd,
      ]);
      return;
    }
    logger.info([logId, "[frontstore_hook] match", match]);

    try {
      const resend = new Resend(resendApiToken);
      await sendBuyerConfirmPayment({
        resend,
        mailFrom: emailFrom,
        mailTo: match.order.buyer.email,
        order: {
          order_id: match.order.order_id,
          order_url: buildSlugUrl(match.order.slug, storeUrl, orderPathFormat),
          subtotal: formatMoney(
            +match.order.template.product.price,
            match.order.template.product.currency,
          ),
          discount: "",
          total_paid: formatMoney(
            +match.order.template.product.price,
            match.order.template.product.currency,
          ),
        },
        store: {
          url: buildUrl("/templates", storeUrl),
          support_url: buildUrl("/support", storeUrl),
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

export function useCreateConfirmPaymentEmailSending(deps: Deps) {
  const { services, logger, config } = deps;
  const { storeUrl, orderPathFormat } = config;
  const liquid = new Liquid();
  const mail = useParseEmailConfirmPayment(liquid);

  async function execute(
    cmd: SendBuyerVerificationEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return;
    }

    const matchSv = new services.ItemsService<{
      match_type: string;
      order: {
        order_id: string;
        slug: string;
        buyer: {
          email: string;
          name: string;
          phone: string;
          date_created: string;
          verified_at: string;
          verify_expires_at: string;
          verify_resend_at: null;
        };
        template: {
          name: string;
          slug: string;
          product: {
            price: string;
            currency: string;
          };
          category: {
            emoji: string;
            name: string;
            slug: string;
          };
        };
      };
      user_payment: {
        amount: string;
        currency: string;
      };
    }>("order_fulfillment", {
      knex: ctx.database,
      schema: ctx.schema,
      accountability: ctx.accountability,
    });

    const match = await matchSv.readOne(cmd.orderFulfillmentId, {
      fields: [
        //
        "match_type",
        "order.order_id",
        "order.slug",
        "order.buyer.email",
        "order.buyer.name",
        "order.buyer.phone",
        "order.buyer.date_created",
        "order.buyer.verified_at",
        "order.buyer.verify_expires_at",
        "order.buyer.verify_resend_at",
        "order.template.name",
        "order.template.slug",
        "order.template.product.price",
        "order.template.product.currency",
        "order.template.category.emoji",
        "order.template.category.name",
        "order.template.category.slug",
        "user_payment.amount",
        "user_payment.currency",
      ],
    });
    if (!match) {
      logger.error([
        logId,
        "[frontstore_hook] order_fulfillment.not_found",
        cmd,
      ]);
      return;
    }
    logger.info([logId, "[frontstore_hook] match", match]);
    let parsed: EmailVerificationParsedVar | null = null;

    try {
      parsed = await mail.parse({
        html: {
          YEAR: new Date().getFullYear().toString(),
          BRAND: "Simpla",
          STORE_URL: buildUrl("/templates", storeUrl),
          SUPPORT_URL: buildUrl("/support", storeUrl),

          USER_EMAIL: match.order.buyer.email,
          ORDER_ID: match.order.order_id,
          ORDER_URL: buildSlugUrl(match.order.slug, storeUrl, orderPathFormat),
          SUBTOTAL: formatMoney(
            +match.order.template.product.price,
            match.order.template.product.currency,
          ),
          DISCOUNT: "",
          TOTAL_PAID: formatMoney(
            +match.order.template.product.price,
            match.order.template.product.currency,
          ),
        },
        subject: {
          BRAND: "Simpla",
          ORDER_ID: match.order.order_id,
        },
        preview: {
          BRAND: "Simpla",
          ORDER_ID: match.order.order_id,
        },
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
        to: match.order.buyer.email,
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
