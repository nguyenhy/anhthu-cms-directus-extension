import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getImagePresignedUrl = async (
  filepath: string,
  storage: {
    key: string;
    secret: string;
    bucket: string;
    region: string;
    endpoint: string;
  },
) => {
  if (
    !storage.key ||
    !storage.secret ||
    !storage.bucket ||
    !storage.region ||
    !storage.endpoint
  ) {
    return null;
  }
  let endpoint = storage.endpoint;

  try {
    endpoint = new URL(endpoint).toString();
  } catch (error) {
    try {
      endpoint = new URL(`https://${endpoint}`).toString();
    } catch (error) {
      throw error;
    }
  }

  const S3 = new S3Client({
    region: storage.region, // Required by SDK but not used by R2
    // Provide your Cloudflare account ID
    endpoint: endpoint,
    // Retrieve your S3 API credentials for your R2 bucket via API tokens (see: https://developers.cloudflare.com/r2/api/tokens)
    credentials: {
      accessKeyId: storage.key,
      secretAccessKey: storage.secret,
    },
  });

  // Generate presigned URL for reading (GET)
  const getUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({ Bucket: storage.bucket, Key: filepath }),
    { expiresIn: 3600 },
  );

  return getUrl;
};
