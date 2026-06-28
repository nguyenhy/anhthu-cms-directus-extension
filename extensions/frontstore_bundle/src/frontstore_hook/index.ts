import { defineHook } from "@directus/extensions-sdk";
import { randomUUID } from "node:crypto";
import { parseHookEnvConfig } from "./config";
import { useCreateBuyerVerificationEmailSending } from "./buyer/useSendBuyerVerificationEmail";
import { useCreateConfirmPaymentEmailSending } from "./buyer/useSendConfirmPaymentEmail";

export default defineHook((register, context) => {
  const { action } = register;
  const { logger, services } = context;

  const configResult = parseHookEnvConfig(context.env);
  if (configResult.status === "error") {
    logger.error([
      "[frontstore_hook] invalid env config, hook disabled",
      configResult.errors,
    ]);
    return;
  }

  const { execute: executeVerificationEmail } =
    useCreateBuyerVerificationEmailSending({
      services,
      logger,
      config: configResult.data,
    });

  const { execute: executeConfirmPaymentEmail } =
    useCreateConfirmPaymentEmailSending({
      services,
      logger,
      config: configResult.data,
    });

  action("items.create", async (meta, ctx) => {
    const logId = randomUUID();

    if (meta.collection === "buyer") {
      logger.info([logId, `[frontstore_hook] items.create`, meta.collection]);
      try {
        const id = meta.key;
        if (!id) {
          logger.error([logId, "meta.key"]);
          return;
        }

        await executeVerificationEmail(
          {
            buyerId: id,
            email: meta.payload.email,
            verifyCode: meta.payload.verify_code,
            verifyExpiresAt: meta.payload.verify_expires_at,
          },
          ctx,
          logId,
        );
      } catch (error) {
        logger.error([
          logId,
          "[frontstore_hook] items.create unhandled",
          String(error),
        ]);
      }
    } else if (meta.collection === "order_fulfillment") {
      logger.info([
        logId,
        `[frontstore_hook] items.create`,
        meta.collection,
        meta,
      ]);
      try {
        const id = meta.key;
        if (!id) {
          logger.error([logId, "meta.key"]);
          return;
        }

        await executeConfirmPaymentEmail(
          {
            orderFulfillmentId: id,
          },
          ctx,
          logId,
        );
      } catch (error) {
        logger.error([
          logId,
          "[frontstore_hook] items.create unhandled",
          String(error),
        ]);
      }
    }
  });

  action("items.update", async (meta, ctx) => {
    const logId = randomUUID();
    if (meta.collection === "buyer") {
      logger.info([logId, `[frontstore_hook] items.update`, meta.collection]);
      try {
        const id = meta.keys?.[0];
        if (!id) {
          logger.error([logId, "keys.id"]);
          return;
        }

        if (!ctx.schema) {
          logger.info([logId, "ctx.schema"]);
          return;
        }

        if (!meta.payload.verify_code || !meta.payload.verify_expires_at) {
          logger.info([
            logId,
            "verify_code",
            !!meta.payload.verify_code,
            "verify_expires_at",
            !!meta.payload.verify_expires_at,
          ]);
          return;
        }

        const buyerSv = new services.ItemsService<{ email: string }>("buyer", {
          knex: ctx.database,
          schema: ctx.schema,
          accountability: ctx.accountability,
        });
        const buyer = await buyerSv.readOne(id, { fields: ["email"] });
        if (!buyer) {
          logger.error([logId, "buyer.not_found", id]);
          return;
        }

        await executeVerificationEmail(
          {
            buyerId: id,
            email: buyer.email,
            verifyCode: meta.payload.verify_code,
            verifyExpiresAt: meta.payload.verify_expires_at,
          },
          ctx,
          logId,
        );
      } catch (error) {
        logger.error([logId, "error", String(error)]);
      }
    } else if (meta.collection === "order_fulfillment") {
      logger.info([
        logId,
        `[frontstore_hook] items.update`,
        meta.collection,
        meta,
      ]);
      try {
        const id = meta.keys?.[0];
        if (!id) {
          logger.error([logId, "meta.key"]);
          return;
        }

        await executeConfirmPaymentEmail(
          {
            orderFulfillmentId: id,
          },
          ctx,
          logId,
        );
      } catch (error) {
        logger.error([logId, "error", String(error)]);
      }
    }
  });
});
