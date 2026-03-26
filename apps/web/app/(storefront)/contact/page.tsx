// =============================================================================
// WERA — Contact Us Page
// Section 15.3: Contact form + details
// =============================================================================

"use client";

import { useState } from "react";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 1500);
  };

  return (
    <div className="container min-h-[60vh] py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-display-uppercase tracking-tight text-center mb-4">
          Contact Us
        </h1>
        <p className="text-body-sm text-[#666] text-center mb-16 max-w-lg mx-auto">
          Have a question about an order, drops, or collaborations? Reach out and our team will get back to you within 24 hours.
        </p>

        <div className="grid md:grid-cols-[1fr,400px] gap-12">
          {/* Form */}
          <div>
            {status === "success" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 text-center animate-fade-in">
                <MessageSquare className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="font-heading text-h3 text-white uppercase tracking-tight mb-2">
                  Message Sent
                </h3>
                <p className="text-body-sm text-emerald-400/80">
                  Thanks for reaching out! We've received your message and will respond shortly.
                </p>
                <button onClick={() => setStatus("idle")} className="btn-secondary mt-8">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">Name</label>
                    <input type="text" required className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white focus:outline-none focus:border-brand-yellow" />
                  </div>
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">Email Address</label>
                    <input type="email" required className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white focus:outline-none focus:border-brand-yellow" />
                  </div>
                </div>
                <div>
                  <label className="font-heading text-label uppercase text-[#999] mb-2 block">Order Number (Optional)</label>
                  <input type="text" placeholder="ORD-..." className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white focus:outline-none focus:border-brand-yellow" />
                </div>
                <div>
                  <label className="font-heading text-label uppercase text-[#999] mb-2 block">Message</label>
                  <textarea required rows={5} className="w-full bg-transparent border border-[#333] px-5 py-3.5 text-white focus:outline-none focus:border-brand-yellow resize-none" />
                </div>
                <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div className="border border-[#222] bg-[#0d0d0d] p-8">
              <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center mb-6">
                <Mail className="w-5 h-5 text-brand-yellow" />
              </div>
              <h3 className="font-heading text-h3 uppercase text-white mb-2 tracking-tight">Email Details</h3>
              <p className="text-body-sm text-[#999] mb-4">
                For order support, returns, and general inquiries.
              </p>
              <a href="mailto:support@wera.in" className="text-brand-yellow font-bold text-lg hover:underline transition-all">
                support@wera.in
              </a>
            </div>

            <div className="border border-[#222] bg-[#0d0d0d] p-8">
              <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center mb-6">
                <MapPin className="w-5 h-5 text-brand-yellow" />
              </div>
              <h3 className="font-heading text-h3 uppercase text-white mb-2 tracking-tight">Office HQ</h3>
              <p className="text-body-sm text-[#999] leading-relaxed">
                Cyber Hub, DLF Phase 2<br />
                Sector 24, Gurugram<br />
                Haryana 122022<br />
                India
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
