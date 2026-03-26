import { Html, Head, Body, Container, Section, Text, Img, Heading, Hr, Link, Preview } from "@react-email/components";

interface EmailLayoutProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>WERA</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} WERA. All rights reserved.<br />
              Streetwear That Speaks.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://wera.in" style={link}>Shop</Link> •{" "}
              <Link href="https://wera.in/account" style={link}>Account</Link> •{" "}
              <Link href="https://wera.in/contact" style={link}>Contact</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 0",
  width: "600px",
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "8px",
  overflow: "hidden",
};

const header = {
  backgroundColor: "#111111",
  padding: "30px 40px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "800",
  letterSpacing: "-1px",
  margin: "0",
  fontFamily: "Arial, sans-serif",
};

const content = {
  padding: "40px",
};

const h1 = {
  color: "#111111",
  fontSize: "24px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  margin: "0 0 24px",
  fontFamily: "Arial, sans-serif",
};

const hr = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const footer = {
  backgroundColor: "#fafafa",
  padding: "30px 40px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 10px",
};

const footerLinks = {
  fontSize: "12px",
  margin: "0",
};

const link = {
  color: "#71717a",
  textDecoration: "underline",
};
