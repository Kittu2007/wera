export default function AboutPage() {
  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        About WERA
      </h1>
      <p className="text-xl text-brand-yellow font-heading uppercase mb-6">
        STREETWEAR THAT SPEAKS.
      </p>
      <div className="space-y-6 text-[#999] leading-relaxed">
        <p>
          Founded in 2026, WERA was born out of a desire to create a clothing brand that 
          genuinely reflects the pulse of modern streetwear in India. We aren't just selling 
          t-shirts; We're providing a canvas for bold ideas, sharp aesthetics, and 
          unapologetic expression.
        </p>
        <p>
          The name <strong>WERA</strong> stands for an era of authenticity—a time when wearing 
          your thoughts on your sleeve isn't just a metaphor, it's a lifestyle. We believe 
          that premium quality shouldn't come with exorbitant gatekeeping, which is why we 
          partner with top-tier print facilities to deliver unmatched comfort and durability 
          direct to you.
        </p>
        <h2 className="font-heading text-h2 uppercase text-white mt-12 mb-4">Our Process</h2>
        <p>
          Every piece of WERA apparel is printed on demand. This means when you place an order, 
          it's being made specifically for you. Why? Because producing exactly what people want 
          eliminates the massive waste associated with traditional fast fashion. Better for the 
          planet, better for our quality control.
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-2 text-white">
          <li><strong>0% Waste:</strong> We carry zero deadstock inventory.</li>
          <li><strong>100% Cotton:</strong> All our tees are 240+ GSM premium bio-washed cotton.</li>
          <li><strong>Express Delivery:</strong> Printed within 2 days, delivered across India fast.</li>
        </ul>
      </div>
    </>
  );
}
