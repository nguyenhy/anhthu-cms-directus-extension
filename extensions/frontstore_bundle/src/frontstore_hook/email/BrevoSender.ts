import { Logger } from "../../lib/logger";
import { HookExtensionContext } from "../types/hook";
import { BrevoClient, useBrevoClient } from "./BrevoClient";
import { EmailIdentity, toEmailIdentity } from "./esp";

export interface RawEmailMsg {
  from: EmailIdentity;
  to: EmailIdentity;
  subject: string;
  html: string;
  preview?: string;
}

export interface TemplateEmailMsg {
  from: EmailIdentity;
  to: EmailIdentity;
  templateId: number;
  variables: Record<string, string>;
}

export class BrevoSender {
  brevo: BrevoClient;
  constructor(apiToken: string, logger: () => Logger) {
    this.brevo = useBrevoClient({
      logger: logger,
      apiKey: apiToken,
    });
  }

  async sendRaw(msg: RawEmailMsg) {
    const result = await this.brevo.sendTransactionalEmail({
      sender: toEmailIdentity({
        email: msg.from.email,
        name: msg.from.name,
      }),
      to: [
        toEmailIdentity({
          email: msg.to.email,
          name: msg.to.name,
        }),
      ],
      subject: msg.subject,
      htmlContent: msg.html,
    });

    return result;
  }

  async sendTemplate(msg: TemplateEmailMsg) {
    const result = await this.brevo.sendTransactionalEmail({
      sender: toEmailIdentity({
        email: msg.from.email,
        name: msg.from.name,
      }),
      to: [
        toEmailIdentity({
          email: msg.to.email,
          name: msg.to.name,
        }),
      ],
      templateId: msg.templateId,
      params: msg.variables,
    });

    return result;
  }
}
