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
        price_at_purchase: template.product?.price ?? null,
        currency_at_purchase: template.product?.currency?.code ?? null,
        template_name_at_purchase: template.name ?? null,
        discount_amount_at_purchase: 0,
        coupon_code_at_purchase: null,
      });
      context.logger.info(order);
      return res.status(200).json({
        slug: slug,
      });
    } catch (error) {
      context.logger.error(error);
      return res.status(500).json();
    }
  });

  type TemplateItem = {
    id: number;
    slug: string;
    name: string;
    tag_line: string | null;
    price_sub: string | null;
    delivery_note: string | null;
    compat_note: string | null;
    meta_list: unknown[] | null;
    category: { slug: string; name: string; emoji: string } | null;
    product: { price: number; currency: string } | null;
    galleries: Array<{
      directus_files_id: {
        filename_disk: string;
        width: number | null;
        height: number | null;
        type: string | null;
        description: string | null;
        key?: string | null;
        label?: string | null;
      };
    }>;
    desc: unknown[];
    early_offer: unknown | null;
  };

  router.get("/template/:slug", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const schema = await context.getSchema();
    const templateSv = new ItemsService<TemplateItem>("template", {
      schema,
      knex: context.database,
    });

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;

    let raw: TemplateItem | null = null;
    try {
      const items = await templateSv.readByQuery({
        ...(version ? { version } : {}),
        filter: { slug: { _eq: slug } },
        limit: 1,
        fields: [
          "id",
          "slug",
          "name",
          "tag_line",
          "price_sub",
          "delivery_note",
          "compat_note",
          "meta_list",

          "category.emoji",
          "category.name",
          "category.slug",

          "product.price",
          "product.currency",

          "galleries.directus_files_id.filename_disk",
          "galleries.directus_files_id.width",
          "galleries.directus_files_id.height",
          "galleries.directus_files_id.type",
          "galleries.directus_files_id.description",

          "desc.collection",
          "desc.item:template_desc_block_feature.section_title",
          "desc.item:template_desc_block_feature.title",
          "desc.item:template_desc_block_feature.desc",
          "desc.item:template_desc_block_feature.features",
          "desc.item:template_desc_block_card.section_title",
          "desc.item:template_desc_block_card.title",
          "desc.item:template_desc_block_card.note",
          "desc.item:template_desc_block_card.note_icon",
          "desc.item:template_desc_block_card.cards",
          "desc.item:template_desc_block_faq.section_title",
          "desc.item:template_desc_block_faq.title",
          "desc.item:template_desc_block_faq.faqs",

          "early_offer.section_title",
          "early_offer.title",
          "early_offer.desc",
          "early_offer.notes",
          "early_offer.coupon.type",
          "early_offer.coupon.amount",
          "early_offer.coupon.currency",
          "early_offer.coupon.cap_value",
          "early_offer.coupon.can_expired",
          "early_offer.coupon.expires_at",
        ],
      });
      raw = items?.[0] ?? null;
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();

    if (!raw.category || !raw.product) {
      context.logger.error(["template.missing_required", raw.id]);
      return res.status(500).send();
    }

    const galleryTabs = [];
    const STORAGE_S3_KEY = context.env.STORAGE_S3_KEY;
    const STORAGE_S3_SECRET = context.env.STORAGE_S3_SECRET;
    const STORAGE_S3_BUCKET = context.env.STORAGE_S3_BUCKET;
    const STORAGE_S3_REGION = context.env.STORAGE_S3_REGION;
    const STORAGE_S3_ENDPOINT = context.env.STORAGE_S3_ENDPOINT;

    for (const item of raw.galleries) {
      const file = item.directus_files_id;
      if (!file?.filename_disk) continue;

      let url = "";
      try {
        url =
          (await getImagePresignedUrl(file.filename_disk, {
            key: STORAGE_S3_KEY,
            secret: STORAGE_S3_SECRET,
            bucket: STORAGE_S3_BUCKET,
            region: STORAGE_S3_REGION,
            endpoint: STORAGE_S3_ENDPOINT,
          })) ?? "";
      } catch (error) {
        context.logger.error(error);
      }

      galleryTabs.push({
        url,
        width: file.width,
        height: file.height,
        type: file.type,
        key: file.key ?? null,
        label: file.label ?? null,
        ariaLabel: file.description ?? null,
      });
    }

    return res.json({
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      category: {
        slug: raw.category?.slug ?? null,
        name: raw.category?.name ?? null,
        emoji: raw.category?.emoji ?? null,
      },
      tagline: raw.tag_line ?? null,
      price: raw.product?.price ?? null,
      currency: raw.product?.currency ?? null,
      priceSub: raw.price_sub ?? null,
      deliveryNote: raw.delivery_note ?? null,
      compatNote: raw.compat_note ?? null,
      metaList: raw.meta_list ?? [],
      galleryTabs,
      description: raw.desc ?? [],
      earlyOffer: raw.early_offer ?? null,
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

    return res
      .setHeader(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'",
      )
      .send(item.html);
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

  type OrderItem = {
    id: number;
    slug: string;
    order_id: string;
    date_created: string;
    expired_after: number | null;
    buyer: {
      id: number;
      email: string;
      name: string | null;
      phone: string | null;
      date_created: string;
      verified_at: string | null;
      verify_expires_at: string | null;
      verify_resend_at: string | null;
      verify_code: string;
    } | null;
    template: {
      name: string;
      slug: string;
      thumbnail: {
        filename_disk: string;
        width: number | null;
        height: number | null;
        type: string | null;
        description: string | null;
      } | null;
      product: {
        price: number;
        currency: string;
        url: string;
      } | null;
      category: {
        slug: string;
        name: string;
        emoji: string;
      } | null;
    } | null;
    order_fulfillment: Array<{ date_created: string }>;
    price_at_purchase: number | null;
    currency_at_purchase: string | null;
    template_name_at_purchase: string | null;
    discount_amount_at_purchase: string | null;
    coupon_code_at_purchase: string | null;
  };

  type PaymentMethodItem = {
    name: string;
    type: string;
    logo: string | null;
    account_name: string;
    account_number: string;
    note: string | null;
  };

  const getOrderBySlug = async (
    slug: string,
    fields: string[],
    version?: string,
  ): Promise<OrderItem | null> => {
    const schema = await context.getSchema();
    const orderSv = new ItemsService<OrderItem>("order", {
      schema,
      knex: context.database,
    });
    const items = await orderSv.readByQuery({
      ...(version ? { version } : {}),
      filter: { slug: { _eq: slug } },
      limit: 1,
      fields,
    });
    return items?.[0] ?? null;
  };

  router.get("/order/:slug", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;

    let raw: OrderItem | null = null;
    try {
      raw = await getOrderBySlug(
        slug,
        [
          "id",
          "slug",
          "order_id",
          "date_created",
          "expired_after",

          "buyer.email",
          "buyer.name",
          "buyer.phone",
          "buyer.date_created",
          "buyer.verified_at",
          "buyer.verify_expires_at",
          "buyer.verify_resend_at",

          "template.thumbnail.filename_disk",
          "template.thumbnail.width",
          "template.thumbnail.height",
          "template.thumbnail.type",
          "template.thumbnail.description",
          "template.name",
          "template.slug",
          "template.product.price",
          "template.product.currency",
          "template.category.emoji",
          "template.category.name",
          "template.category.slug",

          "order_fulfillment.date_created",

          "price_at_purchase",
          "currency_at_purchase",
          "template_name_at_purchase",
          "discount_amount_at_purchase",
          "coupon_code_at_purchase",
        ],
        version,
      );
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();

    const dateCreated = new Date(raw.date_created);
    const deadlineAt = new Date(
      dateCreated.valueOf() + (raw.expired_after ?? 24) * 3600 * 1000,
    ).toISOString();

    // price/currency/template_name are always written together at order
    // creation (and by the backfill). A row with only some of them set is
    // corrupt, not "partially migrated" — treat it as no snapshot at all
    // rather than mixing snapshot and live values.
    // TODO: once these columns are NOT NULL, delete hasSnapshot and every
    // live-template fallback below. Same pattern in fetchOrderDetail.ts and
    // useSendConfirmPaymentEmail.ts — remove all three together.
    const hasSnapshot =
      raw.price_at_purchase != null &&
      raw.currency_at_purchase != null &&
      raw.template_name_at_purchase != null;

    let paymentMethods: PaymentMethodItem[] = [];
    if (raw.buyer) {
      try {
        const schema = await context.getSchema();
        const pmSv = new ItemsService<PaymentMethodItem>("payment_method", {
          schema,
          knex: context.database,
        });
        paymentMethods = await pmSv.readByQuery({
          ...(version ? { version } : {}),
          fields: [
            "name",
            "type",
            "logo",
            "account_name",
            "account_number",
            "note",
          ],
        });
      } catch (error) {
        context.logger.error(error);
      }
    }

    const thumbnail = raw.template?.thumbnail;

    return res.json({
      token: raw.slug,
      orderNumber: raw.order_id,
      createdAt: dateCreated.toISOString(),
      deadlineAt,
      buyer: raw.buyer
        ? {
            email: raw.buyer.email ?? "",
            name: raw.buyer.name ?? "",
            phone: raw.buyer.phone ?? "",
            verified_at: raw.buyer.verified_at ?? "",
            verify_expires_at: raw.buyer.verify_expires_at ?? "",
            verify_resend_at: raw.buyer.verify_resend_at ?? "",
            date_created: raw.buyer.date_created ?? "",
          }
        : null,
      templateName: hasSnapshot
        ? raw.template_name_at_purchase!
        : (raw.template?.name ?? ""),
      templateSlug: raw.template?.slug ?? "",
      thumbnail: thumbnail
        ? {
            disk: thumbnail.filename_disk,
            width: thumbnail.width,
            height: thumbnail.height,
            type: thumbnail.type,
            ariaLabel: thumbnail.description,
          }
        : null,
      category: raw.template?.category ?? null,
      currency: hasSnapshot
        ? raw.currency_at_purchase!
        : (raw.template?.product?.currency ?? null),
      subtotal: hasSnapshot
        ? raw.price_at_purchase!
        : (raw.template?.product?.price ?? 0),
      discount: hasSnapshot ? Number(raw.discount_amount_at_purchase ?? 0) : 0,
      total: hasSnapshot
        ? raw.price_at_purchase! - Number(raw.discount_amount_at_purchase ?? 0)
        : (raw.template?.product?.price ?? 0),
      // amount here is the resolved currency amount actually deducted, so
      // type is always "fixed" regardless of the coupon's original percent
      // vs fixed rule — cap is only meaningful pre-resolution, so omitted.
      coupon: raw.coupon_code_at_purchase
        ? {
            code: raw.coupon_code_at_purchase,
            type: "fixed" as const,
            amount: Number(raw.discount_amount_at_purchase ?? 0),
          }
        : null,
      user_paid_at: raw.order_fulfillment?.[0]?.date_created ?? null,
      paymentMethods: paymentMethods.map((pm) => ({
        name: pm.name,
        type: pm.type,
        logoDisk: pm.logo ?? null,
        accountName: pm.account_name,
        accountNumber: pm.account_number,
        note: pm.note ?? null,
      })),
    });
  });

  router.get("/order/:slug/download", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;

    let raw: OrderItem | null = null;
    try {
      raw = await getOrderBySlug(
        slug,
        ["template.product.url", "order_fulfillment.date_created"],
        version,
      );
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();

    return res.json({
      template: { product: { url: raw.template?.product?.url ?? null } },
      order_fulfillment: raw.order_fulfillment ?? [],
    });
  });

  router.get("/order/:slug/buyer", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;

    let raw: OrderItem | null = null;
    try {
      raw = await getOrderBySlug(
        slug,
        ["id", "slug", "buyer.id", "buyer.email", "buyer.name", "buyer.phone"],
        version,
      );
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();

    return res.json({
      id: raw.id,
      slug: raw.slug,
      buyer: raw.buyer
        ? {
            id: raw.buyer.id,
            email: raw.buyer.email ?? "",
            name: raw.buyer.name ?? "",
            phone: raw.buyer.phone ?? "",
          }
        : null,
    });
  });

  router.get("/order/:slug/verify-buyer", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;

    let raw: OrderItem | null = null;
    try {
      raw = await getOrderBySlug(
        slug,
        [
          "id",
          "slug",
          "buyer.id",
          "buyer.verify_code",
          "buyer.verified_at",
          "buyer.verify_expires_at",
          "buyer.verify_resend_at",
        ],
        version,
      );
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();

    return res.json({
      id: raw.id,
      slug: raw.slug,
      buyer: raw.buyer
        ? {
            id: raw.buyer.id,
            verify_code: raw.buyer.verify_code ?? "",
            verified_at: raw.buyer.verified_at ?? null,
            verify_expires_at: raw.buyer.verify_expires_at ?? null,
            verify_resend_at: raw.buyer.verify_resend_at ?? null,
          }
        : null,
    });
  });

  type BuyerItem = {
    id: number;
    verify_code: string;
    verify_expires_at: string | null;
    verify_resend_at: string | null;
    verified_at: string | null;
  };

  router.patch("/order/:slug/contact", async (req, res) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).send();

    const { email, name, phone } = req.body ?? {};
    if (!email || typeof email !== "string") return res.status(400).send();

    let raw: OrderItem | null = null;
    try {
      raw = await getOrderBySlug(slug, ["id", "buyer.id"]);
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    if (!raw) return res.status(404).send();
    if (raw.buyer) return res.status(201).json({});

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const schema = await context.getSchema();
    const orderSv = new ItemsService("order", {
      schema,
      knex: context.database,
    });

    try {
      await orderSv.updateOne(raw.id, {
        buyer: {
          email,
          name: name ?? null,
          phone: phone ?? null,
          verify_code: code,
          verify_expires_at: expiresAt,
        },
      });
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    return res.status(200).json({});
  });

  router.patch("/buyer/:id/resend", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send();

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const expiresAt = new Date(now.valueOf() + 15 * 60 * 1000).toISOString();

    const schema = await context.getSchema();
    const buyerSv = new ItemsService<BuyerItem>("buyer", {
      schema,
      knex: context.database,
    });

    try {
      await buyerSv.updateOne(id, {
        verify_code: code,
        verify_expires_at: expiresAt,
        verify_resend_at: now.toISOString(),
      });
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    return res.status(200).json({});
  });

  router.patch("/buyer/:id/verify", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send();

    const schema = await context.getSchema();
    const buyerSv = new ItemsService<BuyerItem>("buyer", {
      schema,
      knex: context.database,
    });

    try {
      await buyerSv.updateOne(id, {
        verified_at: new Date().toISOString(),
      });
    } catch (error) {
      context.logger.error(error);
      return res.status(500).send();
    }

    return res.status(200).json({});
  });

  router.use((_req, res) => {
    return res.status(404).send();
  });
});
