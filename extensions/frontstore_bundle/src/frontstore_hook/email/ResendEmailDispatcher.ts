import { ResendSender } from "./ResendSender";
import { EmailVerificationHtmlVar } from "./emailVerification";
import { EmailConfirmPaymentHtmlVar } from "./emailConfirmPayment";
import { EmailIdentity } from "./esp";

type TemplateIds = {
  verification: string;
  confirmPayment: string;
};

export class ResendEmailDispatcher {
  constructor(
    private sender: ResendSender,
    private from: EmailIdentity,
    private templateIds: TemplateIds,
  ) {}

  async sendVerificationEmail(
    to: EmailIdentity,
    vars: EmailVerificationHtmlVar,
  ) {
    return this.sender.sendTemplate({
      from: this.from,
      to,
      templateId: this.templateIds.verification,
      variables: vars,
    });
  }

  async sendConfirmPaymentEmail(
    to: EmailIdentity,
    vars: EmailConfirmPaymentHtmlVar,
  ) {
    return this.sender.sendTemplate({
      from: this.from,
      to,
      templateId: this.templateIds.confirmPayment,
      variables: vars,
    });
  }
}
