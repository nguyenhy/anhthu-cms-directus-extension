import { defineEndpoint } from "@directus/extensions-sdk";
import { getImagePresignedUrl } from "./lib/storage";

export default defineEndpoint(async (router, context) => {
  router.get("/", async (_req, res) => {
    return res.status(200).json({});
  });
  router.get("/asset/", async (_req, res) => {
    const file = _req.query.file || "";
    if (typeof file !== "string" || file !== file.trim()) {
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
});
