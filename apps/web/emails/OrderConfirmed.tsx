import { Text, Section, Link, Button, Row, Column, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderConfirmedProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  trackingUrl?: string; // Can be empty at confirmation
}

export function OrderConfirmedEmail({
  orderNumber = "ORD-001",
  customerName = "Guest",
  items = [],
  total = 0,
}: OrderConfirmedProps) {
  return (
    <EmailLayout previewText={`Order Confirmed: ${orderNumber}`} heading="Order Confirmed">
      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        We've received your order <strong>#{orderNumber}</strong>. We're getting your items
        ready and will notify you as soon as they ship.
      </Text>

      <Section style={summarySection}>
        <Text style={summaryHeading}>Order Summary</Text>
        <Hr style={hr} />
        {items.map((item, i) => (
          <Row key={i} style={itemRow}>
            <Column>
              <Text style={itemTitle}>{item.title} <span style={muted}>x{item.quantity}</span></Text>
            </Column>
            <Column align="right">
              <Text style={itemPrice}>₹{item.price.toFixed(0)}</Text>
            </Column>
          </Row>
        ))}
        <Hr style={hr} />
        <Row style={totalRow}>
          <Column><Text style={totalLabel}>Total</Text></Column>
          <Column align="right"><Text style={totalAmount}>₹{total.toFixed(0)}</Text></Column>
        </Row>
      </Section>

      <Section style={buttonContainer}>
        <Button href={`https://wera.in/account/orders`} style={button}>
          View Order Status
        </Button>
      </Section>

      <Text style={paragraph}>
        If you have any questions, reply to this email or visit our <Link href="https://wera.in/faq" style={link}>FAQ</Link>.
      </Text>
    </EmailLayout>
  );
}

const paragraph = { color: "#3f3f46", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const summarySection = { backgroundColor: "#fafafa", padding: "24px", borderRadius: "4px", margin: "24px 0" };
const summaryHeading = { color: "#111111", fontSize: "16px", fontWeight: "600", margin: "0 0 16px" };
const itemRow = { marginTop: "12px", marginBottom: "12px" };
const itemTitle = { color: "#3f3f46", fontSize: "14px", margin: "0" };
const itemPrice = { color: "#111111", fontSize: "14px", fontWeight: "600", margin: "0" };
const muted = { color: "#a1a1aa" };
const totalRow = { marginTop: "16px" };
const totalLabel = { color: "#111111", fontSize: "16px", fontWeight: "600", margin: "0" };
const totalAmount = { color: "#111111", fontSize: "18px", fontWeight: "700", margin: "0" };
const hr = { borderColor: "#e4e4e7" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#111111", color: "#ffffff", padding: "12px 24px", borderRadius: "4px", fontSize: "16px", fontWeight: "600", textDecoration: "none" };
const link = { color: "#111111", textDecoration: "underline" };
