import { Text, Section, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface PasswordResetProps {
  customerName: string;
  resetLink: string;
}

export function PasswordResetEmail({
  customerName = "User",
  resetLink = "https://wera.in/reset-password",
}: PasswordResetProps) {
  return (
    <EmailLayout previewText="Reset your WERA password" heading="Password Reset">
      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        Someone recently requested a password change for your WERA account. 
        If this was you, you can set a new password here:
      </Text>

      <Section style={buttonContainer}>
        <Button href={resetLink} style={button}>
          Reset Password
        </Button>
      </Section>

      <Text style={paragraph}>
        If you didn't request a password reset, you can safely ignore this email.
        Your password will remain the same.
      </Text>
    </EmailLayout>
  );
}

const paragraph = { color: "#3f3f46", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#111111", color: "#ffffff", padding: "12px 24px", borderRadius: "4px", fontSize: "16px", fontWeight: "600", textDecoration: "none" };
