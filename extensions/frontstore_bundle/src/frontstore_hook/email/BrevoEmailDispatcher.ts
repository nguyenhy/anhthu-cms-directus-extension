import { EmailVerificationHtmlVar } from "./emailVerification";
import { EmailConfirmPaymentHtmlVar } from "./emailConfirmPayment";
import { EmailIdentity } from "./esp";
import { BrevoSender } from "./BrevoSender";

export class BrevoEmailDispatcher {
  constructor(
    private sender: BrevoSender,
    private from: EmailIdentity,
  ) {}

  async sendVerificationEmail(
    to: EmailIdentity,
    vars: EmailVerificationHtmlVar,
  ) {
    return this.sender.sendTemplate({
      from: this.from,
      to,
      templateId: 1,
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
      templateId: 3,
      variables: vars,
    });
  }
}
