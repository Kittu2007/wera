export default function ReturnsPage() {
  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        Returns & Exchanges
      </h1>
      <div className="space-y-8 text-[#999] leading-relaxed">
        
        <section>
          <h2 className="font-heading text-h3 text-white uppercase tracking-tight mb-3">
            7-Day Easy Returns
          </h2>
          <p>
            At WERA, quality is everything. Because our pieces are printed specifically for you 
            when you order, we encourage you to check our sizing charts before making a purchase. 
            However, if there is a manufacturing defect or you received the wrong item, we offer 
            a seamless 7-day exchange or refund window.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-h3 text-white uppercase tracking-tight mb-3">
            What is Eligible?
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Misprinted or damaged graphics.</li>
            <li>Defective garments (tears, holes prior to wearing).</li>
            <li>Incorrect item sent (wrong size, colour, or design).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-h3 text-white uppercase tracking-tight mb-3">
            What is NOT Eligible?
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Items that have been worn, washed, or altered.</li>
            <li>Items without original tags or packaging.</li>
            <li>Exchanges merely due to a "change of mind" or purchasing the wrong size without checking the guide.</li>
          </ul>
        </section>

        <section className="border border-brand-yellow/30 p-6 bg-brand-yellow/5">
          <h2 className="font-heading text-brand-yellow uppercase tracking-tight mb-2">
            How to Initiate a Return
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-white">
            <li>Email <strong>support@wera.in</strong> within 7 days of receiving your order.</li>
            <li>Include your Order Number in the subject line.</li>
            <li>Attach clear photos of the defect or incorrect item.</li>
            <li>Our team will arrange a reverse pickup within 24-48 hours.</li>
            <li>Once the item is received and inspected, we will issue a rapid replacement or full refund to your original payment method.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
