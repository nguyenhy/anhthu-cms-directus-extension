import { Logger } from "../../lib/logger";

export interface BrevoIdentity {
  email: string;
  name?: string;
}

export interface BrevoSender {
  email?: string;
  id?: number;
  name?: string;
}

export interface BrevoAttachment {
  content?: string; // Base64 string
  name?: string; // Required if content is used
  url?: string; // Absolute URL
}

export interface BrevoMessageVersion {
  to: BrevoIdentity[];
  bcc?: BrevoIdentity[];
  cc?: BrevoIdentity[];
  htmlContent?: string;
  textContent?: string;
  subject?: string;
  replyTo?: BrevoIdentity;
  params?: Record<string, any>;
}

export interface BrevoEmailPayload {
  to?: BrevoIdentity[]; // Required if messageVersions omitted
  sender?: BrevoSender; // Required if templateId omitted
  subject?: string; // Required if templateId omitted
  htmlContent?: string; // Required if templateId omitted
  textContent?: string;
  templateId?: number;
  bcc?: BrevoIdentity[];
  cc?: BrevoIdentity[];
  replyTo?: BrevoIdentity;
  attachment?: BrevoAttachment[];
  headers?: Record<string, string>;
  params?: Record<string, any>;
  tags?: string[];
  batchId?: string; // UUIDv4
  scheduledAt?: string; // ISO Date-Time UTC
  messageVersions?: BrevoMessageVersion[];
}

export interface BrevoResponse201 {
  messageId?: string;
  messageIds?: string[];
}

export interface BrevoConfig {
  logger: () => Logger;
  apiKey: string;
  sandbox?: boolean;
}

export interface BrevoClient {
  /**
   * Reference: https://developers.brevo.com/reference/send-transac-email
   */
  sendTransactionalEmail(payload: BrevoEmailPayload): Promise<BrevoResponse201>;
}

/**
 * Sends an email using Brevo SMTP API v3
 * @throws Error if the network request fails or Brevo returns API errors
 */
export function useBrevoClient(config: BrevoConfig): BrevoClient {
  const url = new URL("/v3/smtp/email", "https://api.brevo.com").href;
  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": config.apiKey,
  };

  const sendTransactionalEmail: BrevoClient["sendTransactionalEmail"] = async (
    payload: BrevoEmailPayload,
  ) => {
    const logger = config.logger();
    try {
      // Inject sandbox header into payload headers if sandbox mode enabled
      const finalPayload = { ...payload };
      if (config.sandbox) {
        finalPayload.headers = {
          ...finalPayload.headers,
          "X-Sib-Sandbox": "drop",
        };
      }
      const req: RequestInit = {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(finalPayload),
      };
      logger.info([
        "[brevo] >>",
        req.method,
        url.toString(),
        req.headers,
        finalPayload,
      ]);
      const response = await fetch(url, req);
      logger.info(["[brevo] <<", response.status]);

      if (!response.ok) {
        let errorDetail = "Unknown Error";
        try {
          const text = await response.text();
          const json = text ? JSON.parse(text) : null;
          if (json?.message) {
            errorDetail = json.message;
          }
        } catch {
          errorDetail = response.statusText;
        }
        throw new Error(`Brevo API Error (${response.status}): ${errorDetail}`);
      }

      return response.json() as Promise<BrevoResponse201>;
    } catch (error) {
      logger.info(["[brevo] xx", String(error)]);
      throw error;
    }
  };

  return {
    sendTransactionalEmail,
  };
}
