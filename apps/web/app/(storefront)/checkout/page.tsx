// =============================================================================
// WERA — Multi-Step Checkout
// Section 6.5: Contact → Shipping → Delivery → Payment → Review
// Razorpay order created server-side, signature verified server-side
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, Check, Lock, Truck, CreditCard,
  MapPin, User, FileText, ChevronDown, AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useCartStore } from "@/lib/cart-store";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "contact" | "shipping" | "delivery" | "payment" | "review";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "contact", label: "Contact", icon: User },
  { key: "shipping", label: "Shipping", icon: MapPin },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "review", label: "Review", icon: FileText },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const { items, subtotal, clearCart, couponCode } = useCartStore();
  const cartSubtotal = subtotal();
  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("contact");
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country] = useState("India");

  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [coupon, setCoupon] = useState(couponCode ?? "");
  const [gstInvoice, setGstInvoice] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  // Order flow state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderNumber?: string;
    orderId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved addresses (for logged-in users)
  const { data: savedAddresses } = trpc.account.addresses.useQuery(undefined, {
    retry: false,
  });

  // tRPC mutations
  const createOrderMutation = trpc.checkout.createOrder.useMutation();
  const verifyPaymentMutation = trpc.checkout.verify.useMutation();

  // Pricing calculation
  const GST_RATE = 0.18;
  const FREE_SHIPPING_THRESHOLD = 999;
  const SHIPPING_STANDARD = 99;
  const SHIPPING_EXPRESS = 199;

  const shippingCost =
    cartSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : deliveryMethod === "express"
        ? SHIPPING_EXPRESS
        : SHIPPING_STANDARD;

  const gst = (cartSubtotal * GST_RATE);
  const total = cartSubtotal + shippingCost + gst;

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case "contact":
        return email.includes("@") && phone.length >= 10;
      case "shipping":
        return fullName && line1 && city && state && pincode.length === 6;
      case "delivery":
        return true;
      case "payment":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, email, phone, fullName, line1, city, state, pincode]);

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.key === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]!.key);
    }
  };

  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.key === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]!.key);
    }
  };

  // ---------------------------------------------------------------------------
  // Place order — Razorpay flow (PRD Section 8.5)
  // ---------------------------------------------------------------------------

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order server-side via tRPC
      const order = await createOrderMutation.mutateAsync({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        addressId: "", // Will be created inline — for now use saved address ID
        couponCode: coupon || undefined,
        gstInvoiceRequested: gstInvoice,
        notes: orderNotes || undefined,
      });

      // Step 2: Open Razorpay checkout in browser
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(total * 100), // In paise
        currency: order.currency,
        name: "WERA",
        description: `Order ${order.orderNumber}`,
        order_id: order.razorpayOrderId,
        prefill: {
          email,
          contact: phone,
          name: fullName,
        },
        theme: {
          color: "#FFE600",
          backdrop_color: "rgba(17, 17, 17, 0.85)",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Step 3: Verify signature server-side
            const result = await verifyPaymentMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setOrderResult({
              success: true,
              orderNumber: result.orderNumber,
              orderId: result.orderId,
            });

            // Clear cart on success
            clearCart();
          } catch (err: any) {
            setError(err.message ?? "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError("Payment was cancelled.");
          },
        },
      };

      // Load Razorpay script dynamically
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message ?? "Failed to create order.");
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (orderResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="w-20 h-20 bg-brand-yellow flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-brand-black" />
          </div>
          <h1 className="font-heading text-display-xl uppercase tracking-tight mb-4">
            Order Confirmed
          </h1>
          <p className="text-body text-[#999] mb-2">
            Order #{orderResult.orderNumber}
          </p>
          <p className="text-body text-[#666] mb-8">
            We&apos;re on it. You&apos;ll get a confirmation email shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/account/orders`} className="btn-primary">
              Track Order
            </Link>
            <Link href="/products" className="btn-ghost">
              Keep Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty cart redirect
  // ---------------------------------------------------------------------------

  if (items.length === 0 && !orderResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <h1 className="font-heading text-h1 uppercase tracking-tight mb-4 text-[#555]">
            Cart is empty
          </h1>
          <p className="text-body text-[#666] mb-8">
            Add something to your cart before checking out.
          </p>
          <Link href="/products" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen">
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Header */}
      <div className="border-b border-[#222]">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="font-heading text-[28px] font-extrabold tracking-[-0.03em]">
            WERA
          </Link>
          <div className="flex items-center gap-2 text-body-sm text-[#666]">
            <Lock className="w-4 h-4" />
            Secure Checkout
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-[#222]">
        <div className="container py-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, i) => {
              const isActive = step.key === currentStep;
              const isCompleted = i < currentStepIndex;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <button
                    onClick={() => isCompleted && setCurrentStep(step.key)}
                    disabled={!isCompleted}
                    className={`flex items-center gap-2 transition-colors
                               ${isActive
                                 ? "text-brand-yellow"
                                 : isCompleted
                                   ? "text-brand-yellow/60 cursor-pointer hover:text-brand-yellow"
                                   : "text-[#555] cursor-default"
                               }`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold
                                 ${isActive
                                   ? "bg-brand-yellow text-brand-black"
                                   : isCompleted
                                     ? "bg-brand-yellow/20 text-brand-yellow"
                                     : "bg-[#222] text-[#555]"
                                 }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="hidden md:inline font-heading text-label uppercase">
                      {step.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`hidden md:block w-12 h-[2px] mx-2
                                   ${i < currentStepIndex ? "bg-brand-yellow/40" : "bg-[#222]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-12">
          {/* ============================================================
              LEFT — Form Steps
              ============================================================ */}
          <div>
            {/* Error display */}
            {error && (
              <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10
                             p-4 mb-8 text-red-400 text-body-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1: Contact */}
            {currentStep === "contact" && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-h1 uppercase tracking-tight mb-8">
                  Contact Info
                </h2>
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      inputMode="tel"
                      autoComplete="tel"
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping */}
            {currentStep === "shipping" && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-h1 uppercase tracking-tight mb-8">
                  Shipping Address
                </h2>

                {/* Saved addresses */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="mb-8">
                    <p className="font-heading text-label uppercase text-[#999] mb-4">
                      Saved Addresses
                    </p>
                    <div className="grid gap-3">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setFullName(addr.fullName);
                            setLine1(addr.line1);
                            setLine2(addr.line2 ?? "");
                            setCity(addr.city);
                            setState(addr.state);
                            setPincode(addr.pincode);
                          }}
                          className="text-left border border-[#333] p-4
                                     hover:border-brand-yellow transition-colors"
                        >
                          <p className="text-body-sm text-white font-bold">{addr.fullName}</p>
                          <p className="text-body-sm text-[#999]">
                            {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          {addr.isDefault && <span className="badge mt-2">Default</span>}
                        </button>
                      ))}
                    </div>
                    <div className="h-[1px] bg-[#222] my-6" />
                  </div>
                )}

                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      autoComplete="address-line1"
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Address Line 2 <span className="text-[#555]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      autoComplete="address-line2"
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        autoComplete="address-level2"
                        className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                   text-white placeholder:text-[#555]
                                   focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                    <div>
                      <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                        Pincode
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        autoComplete="postal-code"
                        className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                   text-white placeholder:text-[#555]
                                   focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      State
                    </label>
                    <div className="relative">
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        autoComplete="address-level1"
                        className="w-full appearance-none bg-transparent border border-[#333]
                                   px-5 py-3.5 pr-10 text-white
                                   focus:outline-none focus:border-brand-yellow cursor-pointer"
                      >
                        <option value="" className="bg-brand-black">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s} className="bg-brand-black">{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4
                                             text-[#666] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Delivery */}
            {currentStep === "delivery" && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-h1 uppercase tracking-tight mb-8">
                  Delivery Method
                </h2>
                <div className="space-y-4 max-w-lg">
                  {[
                    {
                      key: "standard" as const,
                      label: "Standard Delivery",
                      time: "5–7 business days",
                      price: cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_STANDARD,
                    },
                    {
                      key: "express" as const,
                      label: "Express Delivery",
                      time: "2–3 business days",
                      price: SHIPPING_EXPRESS,
                    },
                  ].map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setDeliveryMethod(method.key)}
                      className={`w-full text-left p-5 border transition-colors flex items-center
                                 justify-between ${
                                   deliveryMethod === method.key
                                     ? "border-brand-yellow bg-brand-yellow/5"
                                     : "border-[#333] hover:border-[#555]"
                                 }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-5 h-5 border-2 flex items-center justify-center
                                     ${deliveryMethod === method.key
                                       ? "border-brand-yellow bg-brand-yellow"
                                       : "border-[#555]"
                                     }`}
                        >
                          {deliveryMethod === method.key && (
                            <Check className="w-3 h-3 text-brand-black" />
                          )}
                        </div>
                        <div>
                          <p className="font-heading text-sm uppercase tracking-tight text-white">
                            {method.label}
                          </p>
                          <p className="text-body-sm text-[#666]">{method.time}</p>
                        </div>
                      </div>
                      <span className="font-heading text-brand-yellow">
                        {method.price === 0 ? "FREE" : `₹${method.price}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === "payment" && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-h1 uppercase tracking-tight mb-8">
                  Payment
                </h2>
                <div className="max-w-lg space-y-6">
                  {/* Coupon */}
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 bg-transparent border border-[#333] px-5 py-3
                                   text-white placeholder:text-[#555] font-heading uppercase
                                   tracking-wider text-sm
                                   focus:outline-none focus:border-brand-yellow"
                      />
                      <button className="px-6 py-3 bg-[#222] text-white font-heading text-xs
                                        uppercase hover:bg-[#333] transition-colors">
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* GST Invoice */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors
                                 ${gstInvoice
                                   ? "border-brand-yellow bg-brand-yellow"
                                   : "border-[#555] group-hover:border-brand-yellow"
                                 }`}
                    >
                      {gstInvoice && <Check className="w-3 h-3 text-brand-black" />}
                    </div>
                    <span className="text-body-sm text-[#999] group-hover:text-white transition-colors">
                      I need a GST invoice
                    </span>
                  </label>

                  {/* Order Notes */}
                  <div>
                    <label className="font-heading text-label uppercase text-[#999] mb-2 block">
                      Order Notes <span className="text-[#555]">(Optional)</span>
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special instructions..."
                      className="w-full bg-transparent border border-[#333] px-5 py-3.5
                                 text-white placeholder:text-[#555]
                                 focus:outline-none focus:border-brand-yellow resize-none"
                    />
                  </div>

                  <div className="border border-[#222] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-brand-yellow" />
                      <p className="font-heading text-sm uppercase tracking-tight text-white">
                        Powered by Razorpay
                      </p>
                    </div>
                    <p className="text-body-sm text-[#666]">
                      You&apos;ll be redirected to Razorpay&apos;s secure payment page.
                      Supports UPI, Cards, Netbanking, Wallets, and EMI.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === "review" && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-h1 uppercase tracking-tight mb-8">
                  Review Order
                </h2>
                <div className="space-y-6 max-w-lg">
                  {/* Contact summary */}
                  <div className="border border-[#222] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading text-label uppercase text-[#999]">Contact</span>
                      <button
                        onClick={() => setCurrentStep("contact")}
                        className="text-caption text-brand-yellow hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-body-sm text-white">{email}</p>
                    <p className="text-body-sm text-[#666]">{phone}</p>
                  </div>

                  {/* Shipping summary */}
                  <div className="border border-[#222] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading text-label uppercase text-[#999]">Ship to</span>
                      <button
                        onClick={() => setCurrentStep("shipping")}
                        className="text-caption text-brand-yellow hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-body-sm text-white">{fullName}</p>
                    <p className="text-body-sm text-[#666]">
                      {line1}{line2 ? `, ${line2}` : ""}, {city}, {state} — {pincode}
                    </p>
                  </div>

                  {/* Items summary */}
                  <div className="border border-[#222] p-5">
                    <span className="font-heading text-label uppercase text-[#999] mb-4 block">
                      Items ({cartItemCount})
                    </span>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-3">
                          <div className="w-12 h-14 relative bg-[#1a1a1a] flex-shrink-0">
                            {item.imageUrl && (
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm text-white truncate">{item.title}</p>
                            <p className="text-caption text-[#666]">
                              {item.size} / {item.color} × {item.quantity}
                            </p>
                          </div>
                          <span className="text-body-sm text-brand-yellow font-bold">
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-10 max-w-lg">
              {currentStepIndex > 0 ? (
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-body-sm text-[#999]
                             hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <Link
                  href="/products"
                  className="flex items-center gap-2 text-body-sm text-[#999]
                             hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Continue Shopping
                </Link>
              )}

              {currentStep === "review" ? (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="btn-primary flex items-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-brand-black border-t-transparent
                                     animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₹{total.toFixed(0)}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceed}
                  className="btn-primary flex items-center gap-2
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================
              RIGHT — Order Summary (sticky sidebar)
              ============================================================ */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 border border-[#222] p-6 space-y-5">
              <h3 className="font-heading text-h3 uppercase tracking-tight">
                Order Summary
              </h3>

              {/* Items */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="w-14 h-16 relative bg-[#1a1a1a] flex-shrink-0">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                                      bg-brand-yellow text-brand-black text-[10px] font-bold
                                      flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-white truncate">{item.title}</p>
                      <p className="text-caption text-[#666]">{item.size} / {item.color}</p>
                    </div>
                    <span className="text-body-sm text-[#ccc]">
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-[1px] bg-[#222]" />

              {/* Totals */}
              <div className="space-y-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-[#999]">Subtotal</span>
                  <span className="text-white">₹{cartSubtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999]">Shipping</span>
                  <span className="text-white">
                    {shippingCost === 0 ? (
                      <span className="text-brand-yellow">FREE</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999]">GST (18%)</span>
                  <span className="text-white">₹{gst.toFixed(0)}</span>
                </div>
              </div>

              <div className="h-[2px] bg-brand-yellow" />

              <div className="flex justify-between">
                <span className="font-heading text-h3 uppercase tracking-tight">Total</span>
                <span className="font-heading text-h2 text-brand-yellow">
                  ₹{total.toFixed(0)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
