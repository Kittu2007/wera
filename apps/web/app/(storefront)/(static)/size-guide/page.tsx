export default function SizeGuidePage() {
  return (
    <>
      <h1 className="font-heading text-display-uppercase tracking-tight text-white mb-8 border-b border-[#333] pb-6">
        Size Guide
      </h1>
      <div className="space-y-8 text-[#999] leading-relaxed">
        
        <p>
          Our garments are designed for a modern, slightly relaxed fit. If you prefer an 
          oversized look, we recommend sizing up. Measurements are in inches.
        </p>

        <section>
          <h2 className="font-heading text-h2 text-white uppercase tracking-tight mb-4">
            Heavyweight Drop-Shoulder Tees (240 GSM)
          </h2>
          <div className="overflow-x-auto border border-[#222]">
            <table className="w-full text-left bg-[#080808]">
              <thead>
                <tr className="border-b border-[#222] bg-[#111]">
                  <th className="p-4 font-heading text-brand-yellow uppercase">Size</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Chest (in)</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Length (in)</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Sleeve (in)</th>
                </tr>
              </thead>
              <tbody>
                {["S", "M", "L", "XL", "XXL"].map((sz, i) => (
                  <tr key={sz} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-bold text-white">{sz}</td>
                    <td className="p-4">{38 + i * 2}</td>
                    <td className="p-4">{27 + i * 0.5}</td>
                    <td className="p-4">{8 + i * 0.5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-h2 text-white uppercase tracking-tight mb-4 mt-12">
            Premium Hoodies (320 GSM)
          </h2>
          <div className="overflow-x-auto border border-[#222]">
            <table className="w-full text-left bg-[#080808]">
              <thead>
                <tr className="border-b border-[#222] bg-[#111]">
                  <th className="p-4 font-heading text-brand-yellow uppercase">Size</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Chest (in)</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Length (in)</th>
                  <th className="p-4 font-heading text-brand-yellow uppercase">Sleeve (in)</th>
                </tr>
              </thead>
              <tbody>
                {["S", "M", "L", "XL", "XXL"].map((sz, i) => (
                  <tr key={sz} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-bold text-white">{sz}</td>
                    <td className="p-4">{40 + i * 2}</td>
                    <td className="p-4">{28 + i * 0.5}</td>
                    <td className="p-4">{24 + i * 0.5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="p-6 bg-[#111] border-l-4 border-brand-yellow mt-8">
          <p className="text-white"><strong>Pro Tip:</strong> Take one of your favorite fitting tees, lay it completely flat, and measure straight across the chest just under the armpits. Multiply by 2. This is your chest measurement.</p>
        </div>

      </div>
    </>
  );
}
