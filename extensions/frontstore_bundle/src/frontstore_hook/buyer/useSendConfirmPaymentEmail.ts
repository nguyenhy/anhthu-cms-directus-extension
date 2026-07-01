import { buildSlugUrl, buildUrl } from "../../lib/buildUrl";
import { type HookEnvConfig } from "../config";
import { nanoid } from "nanoid";
import {
  EmailConfirmPaymentHtmlVar,
  useParseEmailConfirmPayment,
} from "../email/emailConfirmPayment";
import { HookExtensionContext, EventContext } from "../types/hook";

import { formatMoney } from "../../lib/formatCurrency";
import { Liquid } from "liquidjs";
import { EmailIdentity } from "../email/esp";

export type ConfirmPaymentEmailCommand = {
  orderFulfillmentId: string;
};

type Deps = {
  services: HookExtensionContext["services"];
  logger: HookExtensionContext["logger"];
  config: HookEnvConfig;
  sendEmail: (
    to: EmailIdentity,
    vars: EmailConfirmPaymentHtmlVar,
  ) => Promise<unknown>;
};

type PreparedEmail = {
  to: EmailIdentity;
  variables: EmailConfirmPaymentHtmlVar;
  /** Set when subtotal-discount doesn't match what was actually paid. When
   * present, sendDirect skips sending and routes to manual review instead. */
  priceMismatch?: string;
};

type OrderFulfillmentRow = {
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
      product: { price: string; currency: string };
      category: { emoji: string; name: string; slug: string };
    };
    price_at_purchase: number | null;
    currency_at_purchase: string | null;
    discount_amount_at_purchase: string | null;
  };
  user_payment: { amount: string; currency: string };
};

const ORDER_FULFILLMENT_FIELDS = [
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

  "order.price_at_purchase",
  "order.currency_at_purchase",
  "order.discount_amount_at_purchase",

  "user_payment.amount",
  "user_payment.currency",
] as const;

export function useConfirmPaymentEmail(deps: Deps) {
  const { services, logger, config, sendEmail } = deps;
  const { brand, storeUrl, orderPathFormat, downloadPathFormat } = config;
  const liquid = new Liquid();
  const mail = useParseEmailConfirmPayment(liquid);

  async function prepare(
    cmd: ConfirmPaymentEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<PreparedEmail | null> {
    if (!ctx.schema) {
      logger.error(logId, ["[frontstore_hook] execute.schema"]);
      return null;
    }

    const matchSv = new services.ItemsService<OrderFulfillmentRow>(
      "order_fulfillment",
      {
        knex: ctx.database,
        schema: ctx.schema,
        accountability: ctx.accountability,
      },
    );

    const match = await matchSv.readOne(cmd.orderFulfillmentId, {
      fields: [...ORDER_FULFILLMENT_FIELDS],
    });
    if (!match) {
      logger.error([
        logId,
        "[frontstore_hook] order_fulfillment.not_found",
        cmd,
      ]);
      return null;
    }
    logger.info([logId, "[frontstore_hook] match", match]);

    // price/currency are always written together at order creation (and by
    // the backfill). A row with only one set is corrupt, not "partially
    // migrated" — fall back to fully-live rather than mixing the two.
    const hasSnapshot =
      match.order.price_at_purchase != null &&
      match.order.currency_at_purchase != null;

    let subtotal: number;
    let currency: string;
    let discount: number;

    if (hasSnapshot) {
      subtotal = match.order.price_at_purchase!;
      currency = match.order.currency_at_purchase!;
      discount = Number(match.order.discount_amount_at_purchase ?? 0);
    } else {
      // TODO: remove this branch (and hasSnapshot) once price_at_purchase
      // etc. are NOT NULL — only reachable for orders predating this
      // feature, until the backfill (scripts/backfill-order-snapshots.sql)
      // has run and the columns are locked down. See fetchOrderDetail.ts
      // and frontstore_api_endpoint/index.ts GET /order/:slug for the same
      // pattern — remove all three together.
      subtotal = +match.order.template.product.price;
      currency = match.order.template.product.currency;
      discount = 0;
    }

    const expectedTotal = subtotal - discount;
    const paidAmount = +match.user_payment.amount;

    // No DB constraint enforces this today. On mismatch we do not send —
    // sending is the buyer-facing signal that payment is officially
    // reconciled, and a wrong amount there is worse than a delay. Routed to
    // saveRecord() for manual review instead of silently dropped, so the
    // buyer isn't left without any record while support investigates.
    const priceMismatch =
      expectedTotal !== paidAmount || currency !== match.user_payment.currency
        ? `price_mismatch: expected ${expectedTotal} ${currency}, paid ${paidAmount} ${match.user_payment.currency}`
        : undefined;

    if (priceMismatch) {
      logger.error([logId, "[frontstore_hook]", priceMismatch, match.order.order_id]);
    }

    return {
      to: {
        email: match.order.buyer.email,
        name: match.order?.buyer?.name,
      },
      priceMismatch,
      variables: {
        YEAR: new Date().getFullYear().toString(),
        BRAND: brand,
        STORE_URL: buildUrl("/templates", storeUrl),
        SUPPORT_URL: buildUrl("/support", storeUrl),
        USER_EMAIL: match.order.buyer.email,
        ORDER_ID: match.order.order_id,
        ORDER_URL: buildSlugUrl(match.order.slug, storeUrl, orderPathFormat),
        SUBTOTAL: formatMoney(subtotal, currency),
        DISCOUNT: discount > 0 ? formatMoney(discount, currency) : "",
        TOTAL_PAID: formatMoney(paidAmount, match.user_payment.currency),
        DOWNLOAD_URL: buildSlugUrl(
          match.order.slug,
          storeUrl,
          downloadPathFormat,
        ),
      },
    };
  }

  async function sendDirect(
    cmd: ConfirmPaymentEmailCommand,
    ctx: EventContext,
    logId: string,
  ): Promise<void> {
    const data = await prepare(cmd, ctx, logId);
    if (!data) return;

    if (data.priceMismatch) {
      await saveRecord(ctx, data, logId, data.priceMismatch);
      return;
    }

    try {
      const result = await sendEmail(data.to, data.variables);
      logger.info([logId, "[frontstore_hook] sendDirect.success", result]);
    } catch (error) {
      logger.error([
        logId,
        "[frontstore_hook] sendDirect.error",
        String(error),
      ]);
      await saveRecord(ctx, data, logId, String(error));
    }
  }

  async function saveRecord(
    ctx: EventContext,
    data: PreparedEmail,
    logId: string,
    failureReason?: string,
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
        failure_reason: failureReason,
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
