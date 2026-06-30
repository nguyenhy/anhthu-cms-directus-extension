import { EmailIdentity, stringToEmailIdentity } from "./email/esp";

export type HookEnvConfig = {
  resendApiToken: string;
  brevoApiToken: string;
  emailFrom: EmailIdentity;
  brand: string;
  storeUrl: string;
  orderPathFormat: string;
  downloadPathFormat: string;
};

type ParseResult =
  | { status: "success"; data: HookEnvConfig }
  | { status: "error"; errors: string[] };

const brevoApiTokenEnv = "EMAIL_BREVO_API_KEY";
const resendApiTokenEnv = "EMAIL_RESEND_API_KEY";
const emailFromEnv = "EMAIL_FROM";
const brandEnv = "EXTENSION_FRONTSTORE_BUNDLE_BRAND";
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

  const brevoApiToken = env[brevoApiTokenEnv];
  if (!brevoApiToken) {
    errors.push(`${brevoApiTokenEnv} missing`);
  }

  const rawEmailFrom = env[emailFromEnv];
  let emailFrom: EmailIdentity | null = null;

  if (!rawEmailFrom) {
    errors.push(`${emailFromEnv} missing`);
  } else {
    try {
      emailFrom = stringToEmailIdentity(String(rawEmailFrom));
    } catch {
      errors.push(`${emailFromEnv} invalid format`);
    }
  }

  const brand = env[brandEnv];
  if (!brand) {
    errors.push(`${brandEnv} missing`);
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
      new URL(String(storeUrl));
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
      resendApiToken: String(resendApiToken),
      brevoApiToken: String(brevoApiToken),
      emailFrom: emailFrom!,
      brand: String(brand),
      storeUrl: String(storeUrl),
      orderPathFormat: String(orderPathFormat),
      downloadPathFormat: String(downloadPathFormat),
    },
  };
}
