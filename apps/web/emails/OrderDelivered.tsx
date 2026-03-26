import { Text, Section, Link, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface OrderDeliveredProps {
  orderNumber: string;
  customerName: string;
}

export function OrderDeliveredEmail({
  orderNumber = "ORD-001",
  customerName = "Guest",
}: OrderDeliveredProps) {
  return (
    <EmailLayout previewText={`Your order ${orderNumber} has been delivered`} heading="Order Delivered">
      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        Great news! Your WERA order <strong>#{orderNumber}</strong> has been marked as delivered. We hope you love your new gear!
      </Text>

      <Section style={buttonContainer}>
        <Button href="https://wera.in/account/orders" style={button}>
          View Order
        </Button>
      </Section>

      <Text style={paragraph}>
        If you haven't received it yet, please check around your property or with your neighbours. 
        If you have any questions or issues with your order, 
        <Link href="https://wera.in/contact" style={link}>contact our support team</Link>.
      </Text>
    </EmailLayout>
  );
}

const paragraph = { color: "#3f3f46", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#111111", color: "#ffffff", padding: "12px 24px", borderRadius: "4px", fontSize: "16px", fontWeight: "600", textDecoration: "none" };
const link = { color: "#111111", textDecoration: "underline" };
