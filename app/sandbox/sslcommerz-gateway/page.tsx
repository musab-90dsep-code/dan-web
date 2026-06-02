"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { addDonation } from "@/lib/firebase";
import { Donation } from "@/lib/types";
import { Shield, CreditCard, Smartphone, Landmark, Check, AlertTriangle, ArrowLeft } from "lucide-react";

function GatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<Donation | null>(null);
  const [activeTab, setActiveTab] = useState<"card" | "mobile" | "internet">("card");
  const [selectedProvider, setSelectedProvider] = useState<string>("visa");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending");
  const [phoneNo, setPhoneNo] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp" | "complete">("input");

  useEffect(() => {
    const sessionBase64 = searchParams.get("session");
    if (sessionBase64) {
      try {
        const decodedStr = Buffer.from(sessionBase64, "base64").toString("utf-8");
        const parsed = JSON.parse(decodedStr) as Donation;
        setSessionData(parsed);
      } catch (err) {
        console.error("Failed to decode gateway session:", err);
      }
    }
  }, [searchParams]);

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm w-full">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">ত্রুটিপূর্ণ সেশন</h3>
          <p className="text-xs text-slate-500 mt-2">পেমেন্ট সেশন ডাটা খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
          <button 
            onClick={() => router.push("/")}
            className="mt-6 w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold"
          >
            হোম পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const handlePaymentSubmit = async (isSimulatedSuccess = true) => {
    setPaymentStatus("processing");
    
    // Simulate network delay
    setTimeout(async () => {
      if (isSimulatedSuccess) {
        setPaymentStatus("success");
        try {
          // Write directly to our database wrapper
          await addDonation(sessionData);
          
          setTimeout(() => {
            // Redirect back to home page with success flags
            router.push(`/?payment_success=true&donor=${encodeURIComponent(sessionData.donorName)}&amount=${sessionData.amount}`);
          }, 1500);
        } catch (err) {
          console.error("Failed to write donation:", err);
          setPaymentStatus("failed");
        }
      } else {
        setPaymentStatus("failed");
        setTimeout(() => {
          router.push("/?payment_cancelled=true");
        }, 1500);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-8 w-24 rounded flex items-center justify-center text-white font-extrabold text-sm tracking-tighter">
              SSLCOMMERZ
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">Sandbox Mode</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Merchant</span>
            <span className="text-xs font-bold text-slate-900">Transparent Charity Platform</span>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Transaction Summary */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">অর্ডার সারসংক্ষেপ</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 block">অনুদানের খাত (Cause)</span>
              <span className="text-xs font-bold text-slate-800">
                {sessionData.cause === "Food" ? "দৈনিক আহার বিতরণ" : sessionData.cause === "Medical" ? "জরুরি চিকিৎসা সেবা" : "শিক্ষা সহায়ক সামগ্রী"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">দাতার নাম (Donor Name)</span>
              <span className="text-xs font-bold text-slate-800">
                {sessionData.isAnonymous ? "Anonymous (অজ্ঞাতনামা)" : sessionData.donorName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">সেশন আইডি (Txn ID)</span>
              <span className="text-xs font-mono text-slate-600">{sessionData.txnId}</span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">
              <span className="text-[10px] text-slate-400 block">পরিশোধযোগ্য মোট মূল্য</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{sessionData.amount.toLocaleString()} BDT</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed pt-4 border-t border-slate-100 flex items-start gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>এটি একটি নিরাপদ টেস্ট স্যান্ডবক্স পেমেন্ট এনভায়রনমেন্ট। এখানে কোনো আসল অর্থ লেনদেন হবে না।</span>
          </div>
        </div>

        {/* Right column: Payment Methods */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col min-h-[420px]">
          
          {paymentStatus === "pending" && (
            <>
              {/* Tab headers */}
              <div className="flex bg-slate-50 border-b border-slate-200">
                <button 
                  onClick={() => { setActiveTab("card"); setSelectedProvider("visa"); }}
                  className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${activeTab === "card" ? "bg-white text-orange-500 border-orange-500" : "text-slate-600 hover:text-slate-900 border-transparent"}`}
                >
                  <CreditCard className="h-4 w-4" />
                  কার্ড পেমেন্ট
                </button>
                <button 
                  onClick={() => { setActiveTab("mobile"); setSelectedProvider("bkash"); }}
                  className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${activeTab === "mobile" ? "bg-white text-orange-500 border-orange-500" : "text-slate-600 hover:text-slate-900 border-transparent"}`}
                >
                  <Smartphone className="h-4 w-4" />
                  মোবাইল ব্যাংকিং (MFS)
                </button>
                <button 
                  onClick={() => { setActiveTab("internet"); setSelectedProvider("city"); }}
                  className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${activeTab === "internet" ? "bg-white text-orange-500 border-orange-500" : "text-slate-600 hover:text-slate-900 border-transparent"}`}
                >
                  <Landmark className="h-4 w-4" />
                  ইন্টারনেট ব্যাংকিং
                </button>
              </div>

              {/* Tab contents */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* CARD TAB */}
                  {activeTab === "card" && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {["visa", "mastercard", "amex"].map((provider) => (
                          <button
                            key={provider}
                            onClick={() => setSelectedProvider(provider)}
                            className={`px-3 py-2 border rounded-xl flex items-center justify-center transition-all ${selectedProvider === provider ? "border-orange-500 bg-orange-50/10 shadow-xs" : "border-slate-200 hover:border-slate-350"}`}
                          >
                            <span className="text-xs font-extrabold uppercase text-slate-700">{provider}</span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="text-slate-600 font-semibold">কার্ড নম্বর (Card Number)</label>
                          <input 
                            type="text" 
                            placeholder="4321 0987 6543 2109"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-slate-600 font-semibold">মেয়াদ (Expiry)</label>
                            <input 
                              type="text" 
                              placeholder="MM/YY"
                              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none text-slate-850"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-600 font-semibold">CVV/CVC</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              placeholder="***"
                              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MOBILE BANKING TAB */}
                  {activeTab === "mobile" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {["bkash", "nagad", "rocket", "upay"].map((provider) => (
                          <button
                            key={provider}
                            onClick={() => setSelectedProvider(provider)}
                            className={`px-3 py-2 border rounded-xl flex items-center justify-center transition-all ${selectedProvider === provider ? "border-orange-500 bg-orange-50/10 shadow-xs" : "border-slate-200 hover:border-slate-350"}`}
                          >
                            <span className="text-xs font-bold uppercase text-slate-800">{provider}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="text-slate-600 font-semibold">আপনার {selectedProvider.toUpperCase()} অ্যাকাউন্ট নম্বর</label>
                        <input 
                          type="tel" 
                          placeholder="e.g. 01712345678"
                          value={phoneNo}
                          onChange={(e) => setPhoneNo(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 text-slate-800 text-sm font-semibold tracking-wider"
                        />
                      </div>
                    </div>
                  )}

                  {/* INTERNET BANKING TAB */}
                  {activeTab === "internet" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { id: "city", name: "City Touch (City Bank)" },
                          { id: "dbbl", name: "DBBL NexusPay" },
                          { id: "bankasia", name: "Bank Asia" },
                          { id: "ibbl", name: "iBanking (IBBL)" }
                        ].map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => setSelectedProvider(bank.id)}
                            className={`px-3 py-2 border rounded-xl text-left transition-all ${selectedProvider === bank.id ? "border-orange-500 bg-orange-50/10 shadow-xs" : "border-slate-200 hover:border-slate-350"}`}
                          >
                            <span className="text-[11px] font-bold text-slate-700 block">{bank.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer simulation actions */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <button 
                    onClick={() => router.push("/?payment_failed=true")}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-2 px-3 rounded-lg"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    পেমেন্ট বাতিল করুন
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handlePaymentSubmit(false)}
                      className="flex-1 sm:flex-none border border-rose-200 hover:border-rose-350 bg-rose-50 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      পেমেন্ট ব্যর্থ করুন (Simulate Fail)
                    </button>
                    <button 
                      onClick={() => handlePaymentSubmit(true)}
                      className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      পেমেন্ট করুন (Simulate Success)
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Processing view */}
          {paymentStatus === "processing" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <span className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">অনুরোধ প্রসেস করা হচ্ছে...</h4>
                <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন, ব্রাউজার উইন্ডো বন্ধ করবেন না।</p>
              </div>
            </div>
          )}

          {/* Success view */}
          {paymentStatus === "success" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-emerald-50/10">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 text-sm">পেমেন্ট সফল হয়েছে!</h4>
                <p className="text-xs text-slate-500 mt-1">আপনাকে মূল চ্যারিটি প্ল্যাটফর্মে রিডিরেক্ট করা হচ্ছে...</p>
              </div>
            </div>
          )}

          {/* Failed view */}
          {paymentStatus === "failed" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-rose-50/10">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-rose-800 text-sm">পেমেন্ট সফল হয়নি!</h4>
                <p className="text-xs text-slate-500 mt-1">লেনদেনটি ব্যর্থ হয়েছে। আপনাকে রিডিরেক্ট করা হচ্ছে...</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 border-t border-slate-800 text-[10px] font-mono">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Secure transaction powered by SSLCommerz Engine</span>
          <span>© 2026 SSLCommerz Sandbox (BD). All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default function SSLCommerzGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></span>
      </div>
    }>
      <GatewayContent />
    </Suspense>
  );
}
