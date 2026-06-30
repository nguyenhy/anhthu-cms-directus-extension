import { ResendSender } from "./ResendSender";
import { EmailDispatcher } from "./EmailDispatcher";
import { EmailVerificationHtmlVar } from "./emailVerification";
import { EmailConfirmPaymentHtmlVar } from "./emailConfirmPayment";
import { CreateEmailResponse } from "resend";

export class ResendEmailDispatcher implements EmailDispatcher<
  CreateEmailResponse,
  CreateEmailResponse
> {
  constructor(
    private sender: ResendSender,
    private from: string,
  ) {}

  async sendVerificationEmail(to: string, vars: EmailVerificationHtmlVar) {
    return this.sender.sendTemplate({
      from: this.from,
      to,
      templateId: "simpla-user-email-verification",
      variables: vars,
    });
  }

  async sendConfirmPaymentEmail(to: string, vars: EmailConfirmPaymentHtmlVar) {
    return this.sender.sendTemplate({
      from: this.from,
      to,
      templateId: "simpla-payment-confirmation",
      variables: vars,
    });
  }
}
