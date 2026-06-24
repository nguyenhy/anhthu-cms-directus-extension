export type HookEnvConfig = {
  resendApiToken: string;
  emailFrom: string;
  storeUrl: string;
  orderPathFormat: string;
};

type ParseResult =
  | { status: "success"; data: HookEnvConfig }
  | { status: "error"; errors: string[] };

export function parseHookEnvConfig(env: Record<string, any>): ParseResult {
  const errors: string[] = [];

  const resendApiToken = env["EMAIL_SMTP_PASSWORD"];
  const emailFrom = env["EMAIL_FROM"];
  const storeUrl = env["EXTENSION_FRONTSTORE_BUNDLE_ENDPOINT"];
  const orderPathFormat = env["EXTENSION_FRONTSTORE_BUNDLE_FORMAT_PATH_ORDER"];

  if (!resendApiToken) errors.push("EMAIL_SMTP_PASSWORD missing");
  if (!emailFrom) errors.push("EMAIL_FROM missing");
  if (!orderPathFormat) errors.push("FRONTSTORE_FORMAT_PATH_ORDER missing");

  if (!storeUrl) {
    errors.push("FRONTSTORE_URL missing");
  } else {
    try {
      new URL(storeUrl);
    } catch {
      errors.push("FRONTSTORE_URL invalid URL");
    }
  }

  if (errors.length > 0) {
    return { status: "error", errors };
  }

  return {
    status: "success",
    data: { resendApiToken, emailFrom, storeUrl, orderPathFormat },
  };
}
