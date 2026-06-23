import { defineHook } from "@directus/extensions-sdk";
import { Resend } from "resend";
import {
  parseEmailVerificationPayload,
  sendBuyerEmailVerification,
} from "./buyer/sendBuyerEmailVerification";
import { randomUUID } from "node:crypto";

export default defineHook((register, context) => {
  const { filter, action } = register;
  const { logger, services, database } = context;
  const EMAIL_SMTP_PASSWORD = context.env["EMAIL_SMTP_PASSWORD"];
  const EMAIL_FROM = context.env["EMAIL_FROM"];

  filter("items.create", (payload, meta, context) => {
    logger.error(["[webhook.filter] items.create", meta.collection]);
  });

  action("items.create", async (meta, context) => {
    const logId = randomUUID();
    logger.info([logId, "[webhook.action] items.create", meta.collection]);

    if (meta.collection === "buyer") {
      try {
        const payload = parseEmailVerificationPayload({
          verify_expires_at: meta.payload.verify_expires_at,
          verify_code: meta.payload.verify_code,
          email: meta.payload.email,
        });
        if (!payload) {
          logger.error([logId, "[webhook.action] payload", meta.payload]);
          return;
        }

        const resend = new Resend(EMAIL_SMTP_PASSWORD);
        await sendBuyerEmailVerification({
          resend,
          mailFrom: EMAIL_FROM,
          payload: payload,
          logId,
          logger: logger,
        });
        logger.error([logId, "[webhook.action] success"]);
      } catch (error) {
        logger.error([logId, "[webhook.action] error", String(error)]);
      }
    }
  });

  action("items.update", async (meta, context) => {
    const logId = randomUUID();
    logger.info([logId, "[webhook.action] items.update >>", meta.collection]);

    if (meta.collection === "buyer") {
      logger.info([logId, "[webhook.action]", meta]);

      if (meta.payload.verify_code && meta.payload.verify_expires_at) {
        const id = meta.keys[0];
        if (!id) {
          logger.error([logId, "[webhook.action] resend.buyer_id"]);
          return;
        }

        if (!context.schema) {
          logger.error([logId, "[webhook.action] schema"]);
          return;
        }

        const buyerSv = new services.ItemsService<{ email: string }>("buyer", {
          knex: context.database,
          schema: context.schema,
          accountability: context.accountability,
        });
        const buyer = await buyerSv.readOne(id, {
          fields: ["email"],
        });

        const payload = parseEmailVerificationPayload({
          verify_expires_at: meta.payload.verify_expires_at,
          verify_code: meta.payload.verify_code,
          email: buyer.email,
        });

        if (!payload) {
          logger.error([
            logId,
            "[webhook.action] payload",
            meta.payload,
            buyer.email,
          ]);
          return;
        }

        try {
          const resend = new Resend(EMAIL_SMTP_PASSWORD);
          await sendBuyerEmailVerification({
            resend,
            mailFrom: EMAIL_FROM,
            payload: payload,
            logId,
            logger: logger,
          });
          logger.error([logId, "[webhook.action] success"]);
        } catch (error) {
          logger.error([logId, "[webhook.action] error", String(error)]);
        }
      }
    }
  });
});
