import { defineEndpoint } from "@directus/extensions-sdk";
import { getImagePresignedUrl } from "./lib/storage";
import { nanoid } from "nanoid";
import {
  getRawKey,
  isObject,
  isString,
} from "../frontstore_hook/utils/extract";
import { buildRecordId } from "../lib/buildRecordId";

export default defineEndpoint(async (router, context) => {
  const isAccountabilityGuarded = (req: unknown) => {
    const accountability =
      isObject(req) && "accountability" in req && isObject(req.accountability)
        ? req.accountability
        : null;

    const accountability_user =
      !!accountability &&
      isObject(accountability) &&
      isString(accountability.user)
        ? accountability.user
        : null;

    return !!accountability_user;
  };

  router.use((req, res, next) => {
    if (isAccountabilityGuarded(req)) {
      return next();
    }

    return res.status(401).send();
  });

  router.get("/", async (_req, res) => {
    return res.status(200).json({ status: "ok" });
  });
  router.get("/asset/", async (req, res) => {
    const file = req.query.file || "";
    if (typeof file !== "string" || file !== file.trim() || !file.trim()) {
      return res.status(400).send();
    }

    try {
      const STORAGE_S3_KEY = context.env.STORAGE_S3_KEY;
      const STORAGE_S3_SECRET = context.env.STORAGE_S3_SECRET;
      const STORAGE_S3_BUCKET = context.env.STORAGE_S3_BUCKET;
      const STORAGE_S3_REGION = context.env.STORAGE_S3_REGION;
      const STORAGE_S3_ENDPOINT = context.env.STORAGE_S3_ENDPOINT;
      const url = await getImagePresignedUrl(file, {
        key: STORAGE_S3_KEY,
        secret: STORAGE_S3_SECRET,
        bucket: STORAGE_S3_BUCKET,
        region: STORAGE_S3_REGION,
        endpoint: STORAGE_S3_ENDPOINT,
      });
      if (!url) {
        return res.status(400).send();
      }

      return res.json({ url });
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }
  });

  const { ItemsService } = context.services;
  router.post("/order/new", async (_req, res) => {
    const id = _req.body.id;
    if (!id) {
      return res.status(400).send();
    }

    const schema = await context.getSchema();
    const templateSv = new ItemsService("template", {
      schema: schema,
      knex: context.database,
    });

    let template = null;
    try {
      template = await templateSv.readOne(id, {
        fields: [
          "id",
          "slug",
          "name",

          "category.emoji",
          "category.name",
          "category.slug",

          "product.price",
          "product.currency.id",
          "product.currency.code",
        ],
      });
    } catch (error) {
      context.logger.error([String(error)]);
    }

    if (!template) {
      context.logger.error(["template not found"]);
      return res.status(400).send();
    }

    const orderSv = new ItemsService("order", {
      schema: schema,
      knex: context.database,
    });

    const slug = nanoid(64);
    const orderId = buildRecordId(`ORD`);

    try {
      const order = await orderSv.createOne({
        slug: slug,
        order_id: orderId,
        expired_after: 48,
        template: template.id,
        status: "pending",
        events: [
          {
            status: "pending",
            actor: "system",
          },
        ],
      });
      context.logger.info(order);
    } catch (error) {
      context.logger.error(error);
    }

    return res.status(200).json({
      slug: slug,
    });
  });

  router.get("/email_sending/:slug/preview", async (_req, res) => {
    const slug = _req.params.slug;
    if (!slug) {
      return res.status(404).send();
    }

    const schema = await context.getSchema();
    const templateSv = new ItemsService<{ html: string }>("email_sending", {
      schema: schema,
      knex: context.database,
    });
    const items = await templateSv.readByQuery({
      fields: ["html"],
      filter: {
        slug: {
          _eq: slug,
        },
      },
    });
    const item = items?.[0];
    if (!item) {
      return res.status(404).send();
    }

    return res.send(item.html);
  });

  router.post("/support_ticket/new", async (_req, res) => {
    const json = _req.body;
    const rawSubject = getRawKey(json, "subject");
    const rawEmail = getRawKey(json, "email");
    const rawName = getRawKey(json, "name");
    const rawMessage = getRawKey(json, "message");
    const subject = isString(rawSubject) ? rawSubject : "";
    const email = isString(rawEmail) ? rawEmail : "";
    const name = isString(rawName) ? rawName : "";
    const message = isString(rawMessage) ? rawMessage : "";

    if (!subject || !email) {
      context.logger.error(["json", json]);
      return res.status(400).send();
    }

    const schema = await context.getSchema();
    const service = new ItemsService("support_ticket", {
      schema: schema,
      knex: context.database,
    });

    const slug = nanoid(64);
    const ticket_id = buildRecordId("TIC");

    let item = null;
    try {
      item = await service.createOne({
        slug: slug,
        ticket_id: ticket_id,
        subject: subject,
        email: email,
        name: name,
        message: message,
      });
    } catch (error) {
      context.logger.error([String(error)]);
    }

    if (!item) {
      context.logger.error([item]);
      return res.status(500).send();
    }

    return res.status(200).json({
      slug: slug,
      ticket_id: ticket_id,
    });
  });

  router.use((req, res, next) => {
    return res.status(404).send();
  });
});
