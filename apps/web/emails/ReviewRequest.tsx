import { Text, Section, Link, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface ReviewRequestProps {
  customerName: string;
  productTitle: string;
  productSlug: string;
}

export function ReviewRequestEmail({
  customerName = "Guest",
  productTitle = "Signature Tee",
  productSlug = "signature-tee",
}: ReviewRequestProps) {
  return (
    <EmailLayout previewText={`How do you like your ${productTitle}?`} heading="Share Your Thoughts">
      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        It's been a few weeks since you received your <strong>{productTitle}</strong>. 
        We'd love to hear what you think of it!
      </Text>
      <Text style={paragraph}>
        Your review helps our community discover great clothing and helps us improve our drops.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`https://wera.in/products/${productSlug}#reviews`} style={button}>
          Write a Review
        </Button>
      </Section>
    </EmailLayout>
  );
}

const paragraph = { color: "#3f3f46", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#FFE600", color: "#111111", padding: "12px 24px", borderRadius: "4px", fontSize: "16px", fontWeight: "700", textDecoration: "none", textTransform: "uppercase" as const };
