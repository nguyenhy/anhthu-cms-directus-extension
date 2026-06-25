import { defineEndpoint } from "@directus/extensions-sdk";
import { getImagePresignedUrl } from "./lib/storage";
import { nanoid } from "nanoid";
import { randomBytes } from "node:crypto";

export default defineEndpoint(async (router, context) => {
  router.get("/", async (_req, res) => {
    return res.status(200).json({ status: "ok" });
  });
  router.get("/asset/", async (_req, res) => {
    const file = _req.query.file || "";
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
      context.logger.error(template);
    }

    if (!template) {
      context.logger.error("templates %s", template);
      return res.status(400).send();
    }

    context.logger.info(template);

    const orderSv = new ItemsService("order", {
      schema: schema,
      knex: context.database,
    });

    const slug = nanoid(64);
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // '260619'
    const randomPart = randomBytes(3).toString("hex").toUpperCase(); // 'F3B2'
    const orderId = `ORD-${datePart}-${randomPart}`;

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
});
