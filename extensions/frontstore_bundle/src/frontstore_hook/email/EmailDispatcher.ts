import { EmailVerificationHtmlVar } from "./emailVerification";
import { EmailConfirmPaymentHtmlVar } from "./emailConfirmPayment";

export interface EmailDispatcher<VerificationEmail, ConfirmPaymentEmail> {
  sendVerificationEmail(
    to: string,
    vars: EmailVerificationHtmlVar,
  ): Promise<VerificationEmail>;
  sendConfirmPaymentEmail(
    to: string,
    vars: EmailConfirmPaymentHtmlVar,
  ): Promise<ConfirmPaymentEmail>;
}
