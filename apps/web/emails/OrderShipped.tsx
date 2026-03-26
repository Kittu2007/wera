import { Text, Section, Link, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface OrderShippedProps {
  orderNumber: string;
  customerName: string;
  trackingUrl: string;
}

export function OrderShippedEmail({
  orderNumber = "ORD-001",
  customerName = "Guest",
  trackingUrl = "https://wera.in/track",
}: OrderShippedProps) {
  return (
    <EmailLayout previewText={`Your order ${orderNumber} has shipped`} heading="Order Shipped">
      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        Great news! Your WERA order <strong>#{orderNumber}</strong> has been shipped and is on its way to you.
      </Text>

      <Section style={buttonContainer}>
        <Button href={trackingUrl} style={button}>
          Track Shipment
        </Button>
      </Section>

      <Text style={paragraph}>
        Please note that it may take up to 24 hours for the tracking link to show active updates.
        If you have any questions, visit our <Link href="https://wera.in/faq" style={link}>FAQ</Link>.
      </Text>
    </EmailLayout>
  );
}

const paragraph = { color: "#3f3f46", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#FFE600", color: "#111111", padding: "12px 24px", borderRadius: "4px", fontSize: "16px", fontWeight: "700", textDecoration: "none", textTransform: "uppercase" as const };
const link = { color: "#111111", textDecoration: "underline" };
