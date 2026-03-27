import { Resend } from "resend";
import { render } from "@react-email/render";

import { OrderConfirmedEmail } from "../emails/OrderConfirmed";
import { OrderShippedEmail } from "../emails/OrderShipped";
import { OrderDeliveredEmail } from "../emails/OrderDelivered";
import { ReviewRequestEmail } from "../emails/ReviewRequest";
import { PasswordResetEmail } from "../emails/PasswordReset";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "WERA <hello@wera.in>";

export async function sendOrderConfirmed(to: string, props: Parameters<typeof OrderConfirmedEmail>[0]) {
  const html = await render(<OrderConfirmedEmail {...props} />);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Order Confirmed: #${props.orderNumber}`,
    html,
  });
}

export async function sendOrderShipped(to: string, props: Parameters<typeof OrderShippedEmail>[0]) {
  const html = await render(<OrderShippedEmail {...props} />);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your order #${props.orderNumber} has shipped!`,
    html,
  });
}

export async function sendOrderDelivered(to: string, props: Parameters<typeof OrderDeliveredEmail>[0]) {
  const html = await render(<OrderDeliveredEmail {...props} />);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your order #${props.orderNumber} has been delivered`,
    html,
  });
}

export async function sendReviewRequest(to: string, props: Parameters<typeof ReviewRequestEmail>[0]) {
  const html = await render(<ReviewRequestEmail {...props} />);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `How's your ${props.productTitle}?`,
    html,
  });
}

export async function sendPasswordReset(to: string, props: Parameters<typeof PasswordResetEmail>[0]) {
  const html = await render(<PasswordResetEmail {...props} />);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reset your WERA password`,
    html,
  });
}
