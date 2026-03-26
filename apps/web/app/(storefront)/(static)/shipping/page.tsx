export default function ShippingPage() {
  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        Shipping Policy
      </h1>
      <div className="space-y-8 text-[#999] leading-relaxed">
        
        <p className="text-xl text-white font-heading uppercase mb-6">
          DELIVERING EXPERIENCES DIRECTLY TO YOUR DOOR.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border border-[#222] p-6 bg-[#0d0d0d]">
            <h3 className="font-heading text-brand-yellow uppercase mb-2">Standard Shipping</h3>
            <p className="text-white text-2xl font-mono mb-2">₹99</p>
            <p className="text-sm">5–7 Business Days Delivery</p>
            <p className="text-xs mt-2 text-[#555]">Free on orders above ₹999</p>
          </div>
          <div className="border border-[#222] p-6 bg-[#0d0d0d]">
            <h3 className="font-heading text-emerald-400 uppercase mb-2">Express Shipping</h3>
            <p className="text-white text-2xl font-mono mb-2">₹199</p>
            <p className="text-sm">2–3 Business Days Delivery</p>
            <p className="text-xs mt-2 text-[#555]">Priority production routing</p>
          </div>
        </div>

        <section>
          <h2 className="font-heading text-h3 text-white uppercase tracking-tight mb-3">
            Production Times
          </h2>
          <p>
            Every piece is printed specifically for your order. Our fulfillment partners operate 
            state-of-the-art DTG machines. Standard orders enter production within 24 hours and 
            are dispatched within 48 hours. Express orders are pushed to the front of the queue 
            for immediate dispatch.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-h3 text-white uppercase tracking-tight mb-3">
            Coverage Area
          </h2>
          <p>
            We deliver to 21,000+ pincodes across India via premium courier partners (BlueDart, 
            Delhivery, ExpressBees). Tracking links are issued via email the moment your package 
            leaves the facility.
          </p>
        </section>

      </div>
    </>
  );
}
