import { EmailVerificationHtmlVar } from "./emailVerification";
import { EmailConfirmPaymentHtmlVar } from "./emailConfirmPayment";
import { EmailIdentity } from "./esp";
import { BrevoSender } from "./BrevoSender";

type TemplateIds = {
  verification: number;
  confirmPayment: number;
};

export class BrevoEmailDispatcher {
  constructor(
    private sender: BrevoSender,
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
