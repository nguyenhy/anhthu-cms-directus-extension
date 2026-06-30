import { CreateEmailResponse, Resend } from "resend";
import { EmailSender, RawEmailMsg, TemplateEmailMsg } from "./esp";

export class ResendSender implements EmailSender<
  CreateEmailResponse,
  CreateEmailResponse
> {
  private resend: Resend;

  constructor(apiToken: string) {
    this.resend = new Resend(apiToken);
  }

  async sendRaw(msg: RawEmailMsg) {
    const result = await this.resend.emails.send({
      from: msg.from,
      to: [msg.to],
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
      from: msg.from,
      to: [msg.to],
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
