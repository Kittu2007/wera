export default function FAQPage() {
  const faqs = [
    {
      q: "How long will my order take to arrive?",
      a: "Because all products are printed on demand, production takes 2-3 business days. After dispatch, standard shipping takes 5-7 days and express shipping takes 2-3 days anywhere in India."
    },
    {
      q: "Do you ship internationally?",
      a: "Currently, WERA only ships within India. We plan to expand to global shipping late next year."
    },
    {
      q: "What is your return policy?",
      a: "We offer a 7-day hassle-free return policy for any manufacturing defects or incorrect sizes. Read our full returns policy for details."
    },
    {
      q: "Are the colors exactly as they appear on screen?",
      a: "We use high-quality DTG printing. While we ensure maximum color accuracy, slight variations may occur due to screen calibration and the texture of premium cotton."
    },
    {
      q: "How should I wash my WERA clothes?",
      a: "Machine wash cold inside-out, gentle cycle with mild detergent. Do not iron directly on the print."
    }
  ];

  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        Frequently Asked Questions
      </h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-[#222] bg-[#0d0d0d] p-6">
            <h3 className="font-heading text-lg uppercase text-brand-yellow mb-2">
              Q: {faq.q}
            </h3>
            <p className="text-[#999] leading-relaxed">
              A: {faq.a}
            </p>
          </div>
        ))}
        
        <div className="mt-12 p-8 border border-brand-yellow/30 bg-brand-yellow/5 text-center">
          <h3 className="font-heading text-h3 text-white uppercase tracking-tight mb-2">
            Still got questions?
          </h3>
          <p className="text-[#999] mb-6">Hit us up at support@wera.in and we'll sort it out.</p>
          <a href="/contact" className="btn-primary inline-flex">Contact Support</a>
        </div>
      </div>
    </>
  );
}
