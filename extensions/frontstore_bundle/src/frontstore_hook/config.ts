export type HookEnvConfig = {
  resendApiToken: string;
  emailFrom: string;
  storeUrl: string;
  orderPathFormat: string;
  downloadPathFormat: string;
};

type ParseResult =
  | { status: "success"; data: HookEnvConfig }
  | { status: "error"; errors: string[] };

const resendApiTokenEnv = "EMAIL_SMTP_PASSWORD";
const emailFromEnv = "EMAIL_FROM";
const orderPathFormatEnv = "EXTENSION_FRONTSTORE_BUNDLE_FORMAT_PATH_ORDER";
const downloadPathFormatEnv =
  "EXTENSION_FRONTSTORE_BUNDLE_FORMAT_PATH_DOWNLOAD";
const storeUrlEnv = "EXTENSION_FRONTSTORE_BUNDLE_ENDPOINT";

export function parseHookEnvConfig(env: Record<string, any>): ParseResult {
  const errors: string[] = [];

  const resendApiToken = env[resendApiTokenEnv];
  if (!resendApiToken) {
    errors.push(`${resendApiTokenEnv} missing`);
  }

  const emailFrom = env[emailFromEnv];
  if (!emailFrom) {
    errors.push(`${emailFromEnv} missing`);
  }

  const orderPathFormat = env[orderPathFormatEnv];
  if (!orderPathFormat) {
    errors.push(`${orderPathFormatEnv} missing`);
  }

  const downloadPathFormat = env[downloadPathFormatEnv];
  if (!downloadPathFormat) {
    errors.push(`${downloadPathFormatEnv} missing`);
  }

  const storeUrl = env[storeUrlEnv];
  if (!storeUrl) {
    errors.push(`${storeUrlEnv} missing`);
  } else {
    try {
      new URL(storeUrl);
    } catch {
      errors.push(`${storeUrl} invalid URL`);
    }
  }

  if (errors.length > 0) {
    return { status: "error", errors };
  }

  return {
    status: "success",
    data: {
      resendApiToken,
      emailFrom,
      storeUrl,
      orderPathFormat,
      downloadPathFormat,
    },
  };
}
