import { CreateEmailResponse, Resend } from "resend";
import { EmailIdentity, emailIdentityToString } from "./esp";

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
  templateId: string;
  variables: Record<string, string>;
}

export class ResendSender {
  private resend: Resend;

  constructor(apiToken: string) {
    this.resend = new Resend(apiToken);
  }

  async sendRaw(msg: RawEmailMsg): Promise<CreateEmailResponse> {
    const result = await this.resend.emails.send({
      from: emailIdentityToString(msg.from),
      to: [emailIdentityToString(msg.to)],
      subject: msg.subject,
      html: msg.html,
    });
    if (result.error) {
      throw new Error(
        `ResendSender.sendRaw failed: ${JSON.stringify(result.error)}`,
      );
    }

    return result;
  }

  async sendTemplate(msg: TemplateEmailMsg): Promise<CreateEmailResponse> {
    const result = await this.resend.emails.send({
      from: emailIdentityToString(msg.from),
      to: [emailIdentityToString(msg.to)],
      template: {
        id: msg.templateId,
        variables: msg.variables,
      },
    });
    if (result.error) {
      throw new Error(
        `ResendSender.sendTemplate failed: ${JSON.stringify(result.error)}`,
      );
    }

    return result;
  }
}
