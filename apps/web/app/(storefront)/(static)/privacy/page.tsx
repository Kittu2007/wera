export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        Privacy Policy
      </h1>
      <div className="space-y-6 text-[#999] leading-relaxed">
        
        <p><strong>Effective Date: March 2026</strong></p>
        
        <p>
          WERA ("we," "our," or "us") respects your privacy and is committed to protecting 
          your personal data. This Privacy Policy outlines how your personal information is 
          collected, used, protected, and shared when you visit or make a purchase from wera.in.
        </p>

        <h2 className="font-heading text-h3 text-white uppercase mt-10 mb-4 tracking-tight">
          1. Information We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identity & Contact Data:</strong> Name, email address, phone number, shipping and billing address.</li>
          <li><strong>Transaction Data:</strong> Details about payments (processed securely via Razorpay; we do not store full card numbers).</li>
          <li><strong>Technical Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
        </ul>

        <h2 className="font-heading text-h3 text-white uppercase mt-10 mb-4 tracking-tight">
          2. How We Use Your Information
        </h2>
        <p>We use the collected data to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fulfill orders through our print-on-demand fulfillment partners.</li>
          <li>Process payments securely.</li>
          <li>Send transactional emails (order confirmations, shipping updates) via Resend.</li>
          <li>Communicate with you regarding support queries.</li>
          <li>Prevent fraud and enhance security.</li>
        </ul>

        <h2 className="font-heading text-h3 text-white uppercase mt-10 mb-4 tracking-tight">
          3. Sharing Your Information
        </h2>
        <p>
          We do not sell your personal data. We share data only with trusted third parties 
          required to operate our business:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Merch Factory:</strong> For printing and dispatching your order.</li>
          <li><strong>Razorpay:</strong> For secure payment gateway processing.</li>
          <li><strong>Supabase:</strong> For database and authentication infrastructure.</li>
          <li><strong>Logistics Partners:</strong> (BlueDart, Delhivery, etc.) for delivering your package.</li>
        </ul>

        <h2 className="font-heading text-h3 text-white uppercase mt-10 mb-4 tracking-tight">
          4. Contact Us
        </h2>
        <p>
          For any privacy-related questions, or to request deletion of your account data, 
          please email us at <a href="mailto:privacy@wera.in" className="text-brand-yellow hover:underline">privacy@wera.in</a>.
        </p>
      </div>
    </>
  );
}
