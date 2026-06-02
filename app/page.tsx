"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Coins,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  Users,
  Search,
  Upload,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  HeartPulse,
  Utensils,
  Maximize2,
  Briefcase,
  Lock,
  Compass,
  Cpu,
  User,
  Check,
  Settings,
  Eye,
  Camera,
  Layers,
  Sparkles
} from "lucide-react";
import { 
  subscribeDonations, 
  subscribeExpenses, 
  subscribeProofs, 
  addDonation as dbAddDonation, 
  addExpense as dbAddExpense, 
  addProof as dbAddProof, 
  updateExpense as dbUpdateExpense,
  isFirebaseEnabled
} from "@/lib/firebase";
import { Donation, Expense, DistributionProof } from "@/lib/types";

function CharityPlatformApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "ledger" | "proofs" | "sandbox" | "blueprint">("dashboard");
  const [activePersona, setActivePersona] = useState<"donor" | "volunteer" | "admin">("donor");

  // Search/Filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState<"All" | "Food" | "Medical" | "Education">("All");

  // Local state synced with database in real-time
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [proofs, setProofs] = useState<DistributionProof[]>([]);

  // Simulation forms
  const [donorForm, setDonorForm] = useState({
    name: "",
    amount: "500",
    cause: "Food" as "Food" | "Medical" | "Education",
    isAnonymous: false,
    message: "",
    paymentGateway: "bkash" as "bkash" | "sslcommerz"
  });

  const [volunteerForm, setVolunteerForm] = useState({
    itemName: "",
    quantity: "",
    amount: "",
    cause: "Food" as "Food" | "Medical" | "Education",
    team: "Magura Team",
    receiptMockId: "1",
    locationName: "",
    servedCount: ""
  });

  // UI state for modals or interactive panels
  const [bkashModal, setBkashModal] = useState(false);
  const [bkashStep, setBkashStep] = useState<"phone" | "pin" | "success">("phone");
  const [bkashPhone, setBkashPhone] = useState("");
  const [bkashPin, setBkashPin] = useState("");
  const [currentDonationProcessing, setCurrentDonationProcessing] = useState<any>(null);

  const [aiAuditingId, setAiAuditingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Expense | null>(null);

  // SSLCommerz success overlay state
  const [sslSuccessModal, setSslSuccessModal] = useState(false);
  const [sslSuccessDetails, setSslSuccessDetails] = useState<{ donor: string; amount: number } | null>(null);

  // Check for SSLCommerz payment success redirection query parameters
  useEffect(() => {
    const success = searchParams.get("payment_success");
    const donor = searchParams.get("donor");
    const amount = searchParams.get("amount");

    if (success === "true" && amount) {
      setSslSuccessDetails({
        donor: donor ? decodeURIComponent(donor) : "উদার হৃদয়ের মানুষ",
        amount: parseFloat(amount)
      });
      setSslSuccessModal(true);
      
      // Clear query params after showing modal
      setTimeout(() => {
        router.replace("/");
      }, 5000);
    }
  }, [searchParams, router]);

  // Sync lists on Client Mount using real-time subscriptions
  useEffect(() => {
    const unsubDonations = subscribeDonations((data) => setDonations(data));
    const unsubExpenses = subscribeExpenses((data) => setExpenses(data));
    const unsubProofs = subscribeProofs((data) => setProofs(data));

    return () => {
      unsubDonations();
      unsubExpenses();
      unsubProofs();
    };
  }, []);

  // Math totals
  const totalDonationsAmount = donations.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSignedExpensesAmount = expenses
    .filter((e) => e.status === "Fully Signed")
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  // Real MFS Cash Reserve in bKash/Nagad
  const currentCashInHand = totalDonationsAmount - totalSignedExpensesAmount;

  // Meal support stats: 50 BDT = 1 Meal
  const totalMealsServed = proofs
    .filter((p) => p.cause === "Food")
    .reduce((acc, curr) => acc + curr.servedCount, 0);

  const totalPeopleServedCount = proofs.reduce((acc, curr) => acc + curr.servedCount, 0);

  // Trigger simulated payment layout
  const handleSponsorClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorForm.amount || parseFloat(donorForm.amount) <= 0) return;

    const newDonationObj: Donation = {
      id: `don-${Date.now()}`,
      donorName: donorForm.isAnonymous ? "Anonymous" : donorForm.name || "উদার হৃদয়ের মানুষ",
      amount: parseFloat(donorForm.amount),
      cause: donorForm.cause,
      timestamp: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }).substring(0, 16),
      isAnonymous: donorForm.isAnonymous,
      message: donorForm.message || undefined,
      paymentGateway: donorForm.paymentGateway === "bkash" ? "bKash" : "SSLCommerz",
      txnId: donorForm.paymentGateway === "bkash" ? `BK_${Math.random().toString(36).substring(2, 9).toUpperCase()}` : ""
    };

    if (donorForm.paymentGateway === "bkash") {
      setCurrentDonationProcessing(newDonationObj);
      setBkashStep("phone");
      setBkashModal(true);
    } else {
      // SSLCommerz initiation flow
      try {
        const res = await fetch("/api/sslcommerz/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newDonationObj)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.redirectUrl) {
            router.push(data.redirectUrl);
          }
        } else {
          alert("SSLCommerz গেটওয়ে কানেকশন ব্যর্থ হয়েছে।");
        }
      } catch (err) {
        console.error(err);
        alert("সার্ভার ত্রুটি। অনুগ্রহ করে পরে চেষ্টা করুন।");
      }
    }
  };

  const processPaymentSuccess = async () => {
    if (!currentDonationProcessing) return;
    
    // Save to Database (Firestore or LocalStorage fallback)
    await dbAddDonation(currentDonationProcessing);

    // Reset Form
    setDonorForm({
      name: "",
      amount: "500",
      cause: "Food",
      isAnonymous: false,
      message: "",
      paymentGateway: donorForm.paymentGateway
    });
    setBkashStep("success");
    setTimeout(() => {
      setBkashModal(false);
      setBkashStep("phone");
      setCurrentDonationProcessing(null);
    }, 2800);
  };

  // Simulated Volunteer inputs
  const handleVolunteerLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerForm.itemName || !volunteerForm.amount) return;

    // Log the expense as pending approval
    const newExpenseObj: Expense = {
      id: `exp-${Date.now()}`,
      itemName: volunteerForm.itemName,
      quantity: volunteerForm.quantity || "N/A",
      amount: parseFloat(volunteerForm.amount),
      cause: volunteerForm.cause,
      unitPrice: Math.round(parseFloat(volunteerForm.amount) / (parseFloat(volunteerForm.quantity) || 1)),
      team: volunteerForm.team,
      receiptUrl: `https://picsum.photos/seed/receipt_${Date.now()}/400/500`,
      admin1Approval: false, // New requests need both
      admin2Approval: false,
      status: "Pending Approval",
      createdAt: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }).substring(0, 16)
    };

    // Auto-create a corresponding proof if distribution location provided
    if (volunteerForm.locationName && volunteerForm.servedCount) {
      const newProofObj: DistributionProof = {
        id: `prf-${Date.now()}`,
        locationName: volunteerForm.locationName,
        coordinates: volunteerForm.team === "Magura Team" ? "23.4873° N, 89.4190° E" : volunteerForm.team === "Dhaka Team" ? "23.8103° N, 90.4125° E" : "23.1670° N, 89.2155° E",
        servedCount: parseInt(volunteerForm.servedCount) || 12,
        cause: volunteerForm.cause,
        timestamp: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }).substring(0, 16),
        imageUrl: volunteerForm.cause === "Food" 
          ? `https://picsum.photos/seed/diet-${Date.now()}/600/400`
          : volunteerForm.cause === "Medical" 
            ? `https://picsum.photos/seed/medic-${Date.now()}/600/400`
            : `https://picsum.photos/seed/edu-${Date.now()}/600/400`,
        isFacesBlurred: true, // Ethics standard
        volunteerCount: Math.floor(Math.random() * 4) + 2
      };
      await dbAddProof(newProofObj);
    }

    await dbAddExpense(newExpenseObj);

    // Reset Volunteer Form
    setVolunteerForm({
      itemName: "",
      quantity: "",
      amount: "",
      cause: "Food",
      team: "Magura Team",
      receiptMockId: "1",
      locationName: "",
      servedCount: ""
    });

    alert("স্বেচ্ছাসেবী ভাই/বোন, আপনার খরচ ও বিতরণের তথ্য পাবলিক লেজারে সাবমিট হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে!");
  };

  // Run Real/Simulated AI Auditor on expense using Next API
  const runAiAuditor = async (expenseId: string) => {
    setAiAuditingId(expenseId);
    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    try {
      const response = await fetch("/api/verify-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          itemName: target.itemName,
          quantity: target.quantity,
          amount: target.amount,
          description: `অডিট টিম: ${target.team} - ক্যাটাগরি: ${target.cause}`,
          location: target.team + ", Bangladesh"
        })
      });

      if (response.ok) {
        const auditData = await response.json();
        await dbUpdateExpense(expenseId, {
          aiAudit: auditData,
          status: auditData.isSuspicious ? "Flagged" : target.status
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiAuditingId(null);
    }
  };

  // Multi-Sig Toggle Approvals
  const toggleAdminApproval = async (expenseId: string, adminNo: 1 | 2) => {
    const exp = expenses.find((e) => e.id === expenseId);
    if (!exp) return;

    const updates: Partial<Expense> = {};
    if (adminNo === 1) updates.admin1Approval = !exp.admin1Approval;
    if (adminNo === 2) updates.admin2Approval = !exp.admin2Approval;

    const nextAdmin1 = updates.admin1Approval !== undefined ? updates.admin1Approval : exp.admin1Approval;
    const nextAdmin2 = updates.admin2Approval !== undefined ? updates.admin2Approval : exp.admin2Approval;

    if (nextAdmin1 && nextAdmin2) {
      updates.status = "Fully Signed";
    } else {
      updates.status = "Pending Approval";
    }

    await dbUpdateExpense(expenseId, updates);
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-emerald-500 selection:text-white" id="main_root">
      
      {/* Dynamic Confetti Success Overlay for bKash */}
      <AnimatePresence>
        {bkashModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#E2125B] max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* bkash header */}
              <div className="p-4 bg-white flex justify-between items-center border-b border-pink-100">
                <img src="https://picsum.photos/seed/bkashlogo/120/40" alt="bKash" className="h-8 object-contain rounded" />
                <button 
                  onClick={() => setBkashModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold tracking-tight p-1"
                >
                  বাতিল
                </button>
              </div>

              {bkashStep === "phone" && (
                <div className="p-6 text-white text-center">
                  <div className="mb-4 text-sm font-light">আপনার বিকাশ একাউন্ট নম্বর টাইপ করুন (সিমুলেশন)</div>
                  <input 
                    type="tel"
                    placeholder="e.g. 01712345678"
                    value={bkashPhone}
                    onChange={(e) => setBkashPhone(e.target.value)}
                    className="w-full text-center py-2.5 text-slate-900 font-mono font-bold tracking-widest text-lg rounded-lg border-none focus:ring-2 focus:ring-pink-300 outline-none placeholder:text-gray-400"
                  />
                  <div className="mt-2 text-xs text-pink-100">মোট দান: <span className="font-bold underline">{currentDonationProcessing?.amount} ৳</span></div>
                  <button 
                    onClick={() => setBkashStep("pin")}
                    className="w-full mt-6 bg-white text-[#E2125B] py-2.5 rounded-lg font-bold text-sm tracking-wide shadow-md hover:bg-pink-50 transition-colors"
                  >
                    পরবর্তী ধাপ
                  </button>
                </div>
              )}

              {bkashStep === "pin" && (
                <div className="p-6 text-white text-center">
                  <div className="mb-4 text-sm font-light">পিন নম্বর দিন (সিমুলেশন - যেকোনো ৪ সংখ্যা)</div>
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={bkashPin}
                    onChange={(e) => setBkashPin(e.target.value)}
                    className="w-full text-center py-2.5 text-slate-900 font-mono font-bold tracking-widest text-xl rounded-lg border-none focus:ring-2 focus:ring-pink-300 outline-none"
                  />
                  <button 
                    onClick={processPaymentSuccess}
                    className="w-full mt-6 bg-emerald-500 text-white py-2.5 rounded-lg font-bold text-sm tracking-wide shadow-md hover:bg-emerald-600 transition-colors"
                  >
                    নিশ্চিত করুন
                  </button>
                </div>
              )}

              {bkashStep === "success" && (
                <div className="p-8 text-white text-center flex flex-col items-center justify-center">
                  <div className="h-16 w-16 bg-white/25 rounded-full flex items-center justify-center animate-bounce mb-4">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">পেমেন্ট সফল হয়েছে!</h3>
                  <p className="text-sm text-pink-100 font-light">আপনার দানটি সরাসরি পাবলিক লেজারে যুক্ত করা হয়েছে।</p>
                  <p className="text-xs text-pink-200 mt-4 leading-relaxed font-mono">আইডি: {currentDonationProcessing?.id}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Confetti Success Overlay for SSLCommerz */}
      <AnimatePresence>
        {sslSuccessModal && sslSuccessDetails && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-emerald-600 max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl relative p-8 text-white text-center flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setSslSuccessModal(false)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white text-sm font-semibold p-1 outline-none"
              >
                &times; বন্ধ
              </button>
              <div className="h-16 w-16 bg-white/25 rounded-full flex items-center justify-center animate-bounce mb-4">
                <Check className="h-8 w-8 text-white stroke-[3]" />
              </div>
              <h3 className="text-xl font-bold mb-1">পেমেন্ট সফল হয়েছে!</h3>
              <p className="text-sm text-emerald-100 font-light leading-relaxed">
                উদার দাতা <strong className="font-bold">{sslSuccessDetails.donor}</strong>-এর কাছ থেকে <strong className="underline">{sslSuccessDetails.amount.toLocaleString()} ৳</strong> অনুদান সফলভাবে প্রাপ্ত হয়েছে এবং পাবলিক লেজারে সিঙ্ক করা হয়েছে।
              </p>
              <div className="mt-4 text-[10px] text-emerald-200">SSLCommerz Secured Transaction</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Banner Grid & Top Notification */}
      <div className="bg-slate-900 text-white py-2 px-4 shadow-sm text-xs sm:text-sm" id="banner_top">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>আজকের লাইভ ক্যাম্পেইন মোড: <strong className="text-amber-400">“মাগুরা ও যশোর জেলায় বন্যা দুর্গতদের পুষ্টিকর আহার বিতরণ”</strong></span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span>MFS (বিকাশ/নগদ) গেটওয়ে ব্যালেন্স: <strong className="text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{currentCashInHand.toLocaleString()} ৳</strong></span>
            <span className="hidden sm:inline bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">ডুয়াল-সিগ সিকিউরিটি অ্যাক্টিভ</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-md">
              <Shield className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                স্বচ্ছ চ্যারিটি প্ল্যাটফর্ম <span className="text-xs bg-slate-900 text-white font-normal px-2 py-0.5 rounded">সততা ও স্বচ্ছতা</span>
              </h1>
              <p className="text-xs text-slate-500">দুর্নীতি দূরীকরণে এবং শতভাগ ট্রাস্ট গঠনে রিয়েল-টাইম পাবলিক লেজার সিস্টেম</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl" id="menu_nav">
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "dashboard" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Compass className="h-3.5 w-3.5" />
              লাইভ ইন্ডিকেটর
            </button>
            <button 
              onClick={() => setActiveTab("ledger")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "ledger" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <FileText className="h-3.5 w-3.5" />
              হিসাবের খাতা (Public Ledger)
            </button>
            <button 
              onClick={() => setActiveTab("proofs")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "proofs" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Camera className="h-3.5 w-3.5" />
              বাস্তব প্রমাণ (Proofs)
            </button>
            <button 
              onClick={() => setActiveTab("sandbox")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "sandbox" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              স্যান্ডবক্স পোর্টাল
            </button>
            <button 
              onClick={() => setActiveTab("blueprint")} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === "blueprint" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Cpu className="h-3.5 w-3.5" />
              প্ল্যাটফর্ম ব্লুপ্রিন্ট (বাংলা)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Core Stats Overview widget */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="stats_panel">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              মোট সংগৃহীত অনুদান
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {totalDonationsAmount.toLocaleString()} ৳
              </span>
              <p className="text-xs text-emerald-600 font-medium mt-1">১৭২ জন উদার দাতা থেকে</p>
            </div>
            <div className="bg-slate-50 h-1 w-full rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: "100%" }}></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              ক্যাশ ইন হ্যান্ড
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600">
                {currentCashInHand.toLocaleString()} ৳
              </span>
              <p className="text-xs text-slate-500 mt-1">অনুমোদিত ব্যাংক/MFS এ সঞ্চিত</p>
            </div>
            <div className="bg-slate-50 h-1 w-full rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${(currentCashInHand/totalDonationsAmount)*100}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              সুবিধাপ্রাপ্ত মোট মানুষ
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {totalPeopleServedCount.toLocaleString()} জন
              </span>
              <p className="text-xs text-blue-600 font-medium mt-1">ঢাকা, মাগুরা ও যশোর জেলায়</p>
            </div>
            <div className="bg-slate-50 h-1 w-full rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: "75%" }}></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              বণ্টনকৃত মোট খাবার
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {totalMealsServed.toLocaleString()} টি মিল
              </span>
              <p className="text-xs text-rose-600 font-medium mt-1">৮টি ভিন্ন স্বেচ্ছাসেবী দল কর্তৃক</p>
            </div>
            <div className="bg-slate-50 h-1 w-full rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: "65%" }}></div>
            </div>
          </div>
        </section>

        {/* Dynamic Tab Rendering */}

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 animate-fade-in"
            id="dashboard_view"
          >
            {/* Split Top Row: Interactive Impact Calculator & Emergency Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Campaign / Mode Banner inside of col 7 */}
              <div className="lg:col-span-7 bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Shield className="h-44 w-44" />
                </div>
                <div>
                  <div className="flex items-center gap-1 bg-teal-500/10 text-teal-300 font-semibold px-3 py-1 rounded-full text-xs border border-teal-500/20 max-w-max mb-4">
                    <CheckCircle className="h-3 w-3" /> শতভাগ ট্রাস্ট অ্যান্ড রিয়েল-টাইম হিসাব
                  </div>
                  <h2 className="text-2xl sm:text-3.5xl font-extrabold leading-tight text-white tracking-tight">
                    ডিজিটাল প্রযুক্তিতে <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">দুর্নীতিহীন ও স্বচ্ছ</span> দাতব্য ব্যবস্থা।
                  </h2>
                  <p className="text-sm text-slate-300 mt-4 leading-relaxed font-light">
                    আপনার দেয়া প্রতিটি পয়সা কোথায় যাচ্ছে তা দেখুন লাইভ। প্রতিটি ব্যয়ের সাথে বাধ্যতামূলক দোকান রশিদ আপলোড, স্বেচ্ছাসেবীর বাস্তব লোকেশন জিপিএস কোঅর্ডিনেট এবং ২ জন সুপার ও স্বাধীন অডিটর এডমিনের অনুমোদন পাওয়ার পর অর্থ MFS ব্যাংক ওয়ালেট থেকে পেইড আউট হয়।
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <h4 className="text-amber-400 text-sm font-semibold">৫০০৳ = ১০টি মিল</h4>
                    <p className="text-xs text-slate-300">পুষ্টিকর খাদ্য</p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <h4 className="text-cyan-400 text-sm font-semibold">১০০% ক্যাশলেস</h4>
                    <p className="text-xs text-slate-300">ব্যাংক ও MFS চ্যানেল</p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <h4 className="text-emerald-400 text-sm font-semibold">২-এডমিন সাইন</h4>
                    <p className="text-xs text-slate-300">মাল্টি-সিগ ওয়ালেট</p>
                  </div>
                </div>
              </div>

              {/* Impact Calculator Widget col 5 */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    ইমপ্যাক্ট ক্যালকুলেটর (BDT)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">কত টাকা দান করলে কী পরিমাণ সামাজিক পরিবর্তন হবে তা হিসেব করুন</p>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">আপনার টার্গেটেড অনুদানের পরিমাণ নির্ধারণ করুন</label>
                      <div className="flex items-center bg-slate-100 rounded-xl p-2.5">
                        <input 
                          type="number" 
                          placeholder="e.g. 5000"
                          defaultValue={2500}
                          id="calc_input"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const meals = Math.floor(val / 50);
                            const books = Math.floor(val / 150);
                            const meds = Math.floor(val / 500);
                            
                            const mealsEl = document.getElementById("calc_meals");
                            const booksEl = document.getElementById("calc_books");
                            const medsEl = document.getElementById("calc_meds");
                            
                            if (mealsEl) mealsEl.innerText = `${meals} জন`;
                            if (booksEl) booksEl.innerText = `${books} জন`;
                            if (medsEl) medsEl.innerText = `${meds} জন`;
                          }}
                          className="bg-transparent text-lg font-extrabold w-full border-none outline-none text-slate-900 p-1"
                        />
                        <span className="text-lg font-bold text-slate-500 mr-2">৳</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-2">
                          <div className="bg-rose-100 text-rose-600 p-1.5 rounded-md"><Utensils className="h-4 w-4" /></div>
                          <span className="text-xs font-medium text-slate-700">খাবার সরবরাহ হবে (১ ফুড মিল = ৫০৳)</span>
                        </div>
                        <span id="calc_meals" className="text-sm font-extrabold text-slate-900">৫০ জন</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md"><BookOpen className="h-4 w-4" /></div>
                          <span className="text-xs font-medium text-slate-700">শিক্ষা কিট বিতরণ (১ বুক প্যাকেজ = ১৫০৳)</span>
                        </div>
                        <span id="calc_books" className="text-sm font-extrabold text-slate-900">১৬ জন</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-md"><HeartPulse className="h-4 w-4" /></div>
                          <span className="text-xs font-medium text-slate-700">ডাক্তারি ও ওষুধ সহায়তা (১ ফ্যামিলি সাপোর্ট = ৫০০৳)</span>
                        </div>
                        <span id="calc_meds" className="text-sm font-extrabold text-slate-900">৫ জন</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={() => {
                      const calcVal = (document.getElementById("calc_input") as HTMLInputElement)?.value || "2500";
                      setDonorForm({
                        ...donorForm,
                        amount: calcVal
                      });
                      setActiveTab("sandbox");
                      setActivePersona("donor");
                    }} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    এই পরিমাণ টাকা স্পন্সর করুন <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>

            {/* Three Pillar Core Causes Overview */}
            <div>
              <h3 className="text-lg font-bold text-slate-950 mb-4">আমাদের সাহায্য কার্যক্রমের মূল খাতসমূহ (Causes)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-4"><Utensils className="h-5 w-5 stroke-[2]" /></div>
                  <h4 className="text-base font-bold text-slate-900">১. দৈনিক দুপুরের পুষ্টিকর খাবার</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">মাঠ পর্যায়ে সুবিধাবঞ্চিত শিশু ও দারিদ্র্যপীড়িত বৃদ্ধদের সুষম খাদ্য সরবরাহ। প্রতি প্লেটের গড় খরচ ৫০ টাকা।</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">এই খাতে আজ বিতরণকৃত</span>
                    <strong className="text-slate-900">১৮০ জন সুবিধাভোগী</strong>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4"><HeartPulse className="h-5 w-5 stroke-[2]" /></div>
                  <h4 className="text-base font-bold text-slate-900">২. প্রয়োজনীয় ফ্রি চিকিৎসা ও ঔষধ</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">বস্তি ও ভাসমান রোগীদের ডাক্তারের পরামর্শ, অ্যান্টিবায়োটিক, এবং অক্সিজেন সিলিন্ডার সহায়তা।</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">এই খাতে আজ বিতরণকৃত</span>
                    <strong className="text-slate-900">৬টি অক্সিজেন রিফিল ক্যাম্প</strong>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><BookOpen className="h-5 w-5 stroke-[2]" /></div>
                  <h4 className="text-base font-bold text-slate-900">৩. শিক্ষা সহায়ক উপকরণ বিতরণ</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">পড়ালেখা যাতে বন্ধ না হয়, তজ্জন্য বিনামূল্যে বইপত্র, রঙ পেন্সিল, এবং স্কুল খাতা সরাসরি বিতরণ।</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400">এই খাতে সংগৃহীত ফান্ড</span>
                    <strong className="text-slate-900">৪৫,০০০ ৳ লাইভ ব্যালেন্স</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* Simulated Live Action Stream (Latest Donations / Ongoing distributions) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Side: Real-time Live Donor Ledger Feed */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-500" />
                    লাইভ অনুদান ফিড (Real-Time Donation Feed)
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Auto-Syncing</span>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {donations.map((d) => (
                    <div key={d.id} className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs gap-4 hover:border-slate-300 transition-colors">
                      <div className="flex gap-2">
                        <div className="bg-emerald-100 text-emerald-700 h-8 w-8 rounded-full flex items-center justify-center font-bold">
                          {d.isAnonymous ? "An" : d.donorName.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            {d.isAnonymous ? "অজ্ঞাতনামা দাতা (Anonymous)" : d.donorName}
                            <span className="text-[10px] font-normal text-slate-400">({d.timestamp})</span>
                          </div>
                          <p className="text-slate-500 mt-0.5">খাত: <span className="font-semibold text-slate-800">{d.cause === "Food" ? "খাদ্য সাহায্য" : d.cause === "Medical" ? "জরুরি চিকিৎসা" : "শিক্ষা উপকরণ"}</span></p>
                          {d.message && <p className="text-slate-600 bg-white p-1.5 rounded border border-slate-100 mt-1 italic">“{d.message}”</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-1 rounded text-sm block">+{d.amount.toLocaleString()} ৳</span>
                        <span className="text-[9px] text-[#E2125B] font-semibold mt-1 inline-block bg-pink-50 px-1.5 rounded">bKash Verified</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setActiveTab("sandbox");
                      setActivePersona("donor");
                    }} 
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3 w-3" /> বিকাশ গেটওয়ে দিয়ে একটি টেস্ট পেমেন্ট করুন
                  </button>
                </div>
              </div>

              {/* Right Side: Anti-Corruption Rule Badge */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-950 flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-3">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    দুর্নীতি ও জালিয়াতি রোধ নীতিমালাসমূহ (Strict Anti-Fraud)
                  </h3>
                  
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="flex gap-2.5">
                      <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center"><Check className="h-4 w-4" /></div>
                      <div>
                        <strong className="text-slate-900 block font-bold">১০০% ক্যাশলেস ট্রানজেকশন</strong>
                        <span className="text-slate-500">কোনো স্বেচ্ছাসেবক বা মাঠকর্মী সরাসরি নগদ ক্যাশ টাকা গ্রহণ করেন না। সকল লেনদেন bKash, নাগাদ বা সরাসরি ব্যাংক একাউন্ট এ পেইড হয়।</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center"><Check className="h-4 w-4" /></div>
                      <div>
                        <strong className="text-slate-900 block font-bold">২-এডমিন মাল্টি-সিগ (Dual Approvals)</strong>
                        <span className="text-slate-500">একক প্যানেলের নির্দেশে কোনো টাকা ফান্ড রিলিজ হয় না। প্রতিটি স্বেচ্ছাসেবীর খরচের দাবী ২ জন স্বনামধন্য এডমিন ডিজিটাল কনফার্মেশন দিলেই হিসাব খাতে হিট করে।</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center"><Check className="h-4 w-4" /></div>
                      <div>
                        <strong className="text-slate-900 block font-bold">জেও-ট্যাগড ও সময় নিরীক্ষণ (Geo-tagged Proof)</strong>
                        <span className="text-slate-500">স্বেচ্ছাসেবীদের ছবি তোলার সাথে জিপিএস কোঅর্ডিনেট লেজারে সেড হয়। একইসাথে সুবিধাভোগী দরিদ্র ভাইবোনদের সম্মান রক্ষার্থে তাদের মুখাবয়ব অটো-ব্লার ফিল্টার দিয়ে ঢাকা হয়।</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center"><Check className="h-4 w-4" /></div>
                      <div>
                        <strong className="text-slate-900 block font-bold">জেমিনি এআই রিয়েল রশিদ স্ক্যান (AI OCR Checks)</strong>
                        <span className="text-slate-500">কৃত্রিম বুদ্ধিমত্তা চালিত জেমিনি অডিট ইঞ্জিন প্রতিটি রশিদের টেক্সট পড়ে লোকাল মার্কেট রেটের সাথে তুলনা করে অস্বাভাবিক বা স্ফীত মূল্যের খরচ সন্দেহভাজন হিসেবে হাইলাইট করে।</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="bg-emerald-500 text-white p-2 rounded-xl h-10 w-10 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">অডিট টিম দ্বারা সার্টিফাইড প্ল্যাটফর্ম</h5>
                    <p className="text-[10px] text-slate-500">১২ই জুন ২০২৬ তারিখে বার্ষিক অডিট রিপোর্ট প্রকাশিত হবে।</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: IMMUTABLE LEDGER */}
        {activeTab === "ledger" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
            id="ledger_view"
          >
            {/* Ledger Filters row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {(["All", "Food", "Medical", "Education"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLedgerFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all ${ledgerFilter === filter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {filter === "All" ? "সকল খরচ" : filter === "Food" ? "খাদ্য সামগ্রী" : filter === "Medical" ? "ওষুধ ও সিলিন্ডার" : "শিক্ষা উপকরণ"}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="রশিদ বা বাজারের খাত খুঁজুন..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full bg-slate-50 pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Expenses Ledger Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-950 text-base">পাবলিক হিসাবের খাতা (Anti-Corruption Ledger)</h3>
                  <p className="text-xs text-slate-500">মাঠকর্মী ও স্বেচ্ছাসেবীদের আপলোডকৃত প্রতিটি খরচের রশিদ ও এআই অডিট স্কোর সহ লাইভ এন্ট্রি</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded">স্বাক্ষরিত মোট খরচ: {totalSignedExpensesAmount.toLocaleString()} ৳</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium tracking-tight">
                      <th className="p-4">তারিখ ও টিম</th>
                      <th className="p-4">বাজারের জিনিস ও ক্যাটাগরি</th>
                      <th className="p-4">পরিমাণ / রেট</th>
                      <th className="p-4">মোট বিল (৳)</th>
                      <th className="p-4">রশিদ ফাইল</th>
                      <th className="p-4">এআই অডিট অংগ (AI Scan)</th>
                      <th className="p-4">২-এডমিন মাল্টি-সিগ</th>
                      <th className="p-4 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {expenses
                      .filter((exp) => ledgerFilter === "All" || exp.cause === ledgerFilter)
                      .filter((exp) => exp.itemName.toLowerCase().includes(ledgerSearch.toLowerCase()) || exp.team.toLowerCase().includes(ledgerSearch.toLowerCase()))
                      .map((exp) => {
                        return (
                          <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors text-slate-800">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{exp.createdAt}</div>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded italic">{exp.team}</span>
                            </td>
                            <td className="p-4">
                              <div className="font-extrabold text-slate-900">{exp.itemName}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                {exp.cause === "Food" ? (
                                  <span className="text-[9px] bg-rose-50 text-rose-500 font-bold px-1.5 rounded flex items-center gap-1"><Utensils className="h-2 w-2" /> দৈনিক খাবার</span>
                                ) : exp.cause === "Medical" ? (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-500 font-bold px-1.5 rounded flex items-center gap-1"><HeartPulse className="h-2 w-2" /> চিকিৎসা সেবা</span>
                                ) : (
                                  <span className="text-[9px] bg-blue-50 text-blue-500 font-bold px-1.5 rounded flex items-center gap-1"><BookOpen className="h-2 w-2" /> শিক্ষা সামগ্রী</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold">{exp.quantity}</div>
                              <div className="text-[10px] text-slate-500">গড় রেট: {exp.unitPrice} ৳/ইউনিট</div>
                            </td>
                            <td className="p-4 font-extrabold text-slate-950 text-base">
                              {exp.amount.toLocaleString()} ৳
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => setSelectedReceipt(exp)}
                                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg transition-transform outline-none text-[11px]"
                              >
                                <Eye className="h-3 w-3 text-slate-500" />
                                রশিদ দেখুন
                              </button>
                            </td>
                            <td className="p-4">
                              {exp.aiAudit ? (
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-max ${exp.aiAudit.isSuspicious ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {exp.aiAudit.isSuspicious ? (
                                      <>
                                        <AlertCircle className="h-3 w-3" />
                                        জালিয়াতি অ্যালার্ট ({exp.aiAudit.anomalyScore}%)
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3" />
                                        স্বচ্ছ স্কোর ({exp.aiAudit.anomalyScore || 10}%)
                                      </>
                                    )}
                                  </span>
                                  <p className="text-[9px] text-slate-500 max-w-[150px] truncate" title={exp.aiAudit.reasoning}>
                                    {exp.aiAudit.reasoning}
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => runAiAuditor(exp.id)}
                                  disabled={aiAuditingId === exp.id}
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  {aiAuditingId === exp.id ? (
                                    <span className="flex items-center gap-1">
                                      <span className="animate-spin h-2 w-2 border-2 border-purple-700 border-t-transparent rounded-full"></span>
                                      স্ক্যান হচ্ছে...
                                    </span>
                                  ) : (
                                    <>
                                      <Sparkles className="h-2.5 w-2.5" />
                                      এআই অডিট কন্সোল
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-2.5 w-2.5 rounded-full ${exp.admin1Approval ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                                  <span className="text-[10px] text-slate-500">এডমিন ১: {exp.admin1Approval ? "স্বাক্ষরিত" : "অপেক্ষা"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-2.5 w-2.5 rounded-full ${exp.admin2Approval ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                                  <span className="text-[10px] text-slate-500">এডমিন ২: {exp.admin2Approval ? "স্বাক্ষরিত" : "অপেক্ষা"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${exp.status === "Fully Signed" ? "bg-emerald-100 text-emerald-800" : exp.status === "Flagged" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                                {exp.status === "Fully Signed" ? "অনুমোদিত ও পেইড" : exp.status === "Flagged" ? "ডিনাইড / স্থগিত" : "বকেয়া সই"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receipt Viewer Details Modal */}
            {selectedReceipt && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h4 className="font-bold text-sm">খরচের যাচাই রশিদ ও ভাউচার</h4>
                    <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white font-extrabold text-sm">&times; বন্ধ করুন</button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                      <div>
                        <strong>আইটেমের নাম:</strong>
                        <p className="font-extrabold text-slate-900 text-base">{selectedReceipt.itemName}</p>
                      </div>
                      <div>
                        <strong>প্রয়োজনীয় পরিমাণ:</strong>
                        <p className="font-bold text-slate-800 text-sm">{selectedReceipt.quantity}</p>
                      </div>
                      <div>
                        <strong>বিতরণ কারী স্বেচ্ছাসেবী টিম:</strong>
                        <p className="font-semibold text-slate-900">{selectedReceipt.team}</p>
                      </div>
                      <div>
                        <strong>মোট আর্থিক বিল মূল্য:</strong>
                        <p className="font-extrabold text-emerald-600 text-lg">{selectedReceipt.amount} BDT</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                      <img src={selectedReceipt.receiptUrl} alt="Receipt Image File" className="max-h-60 h-full object-contain rounded mb-2 hover:scale-105 transition-transform" />
                      <span className="text-[10px] text-slate-400 font-mono">ভাউচার মেটাডাটা আইডি: SHA-256://{selectedReceipt.id}829c9</span>
                    </div>

                    {selectedReceipt.aiAudit && (
                      <div className={`p-4 rounded-xl border ${selectedReceipt.aiAudit.isSuspicious ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                        <h5 className={`font-bold text-xs flex items-center gap-1.5 mb-1 ${selectedReceipt.aiAudit.isSuspicious ? "text-red-700" : "text-emerald-700"}`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          জেমিনি ৩.৫ অডিটর বিশ্লেষণ রিপোর্ট
                        </h5>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium"><strong>মার্কেট ভ্যালু চেক:</strong> {selectedReceipt.aiAudit.marketRateComparison}</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-2 italic"><strong>বিশ্লেষণ:</strong> {selectedReceipt.aiAudit.reasoning}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setSelectedReceipt(null)} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">ঠিক আছে</button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* TAB 3: ETHICAL PROOF GALLERY */}
        {activeTab === "proofs" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
            id="proofs_view"
          >
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3 text-emerald-800">
                <Shield className="h-10 w-10 shrink-0 stroke-[2] mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">নিরাপদ ও নীতিগত প্রমাণ ব্যবস্থা (Ethical Real-Proof Gallery)</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                    সুবিধাবঞ্চিত দরিদ্র ও অনাহারী মানুষের দারিদ্র্য ও দরিদ্রতাকে পুঁজি করে তাদের অসহায় অবস্থার ছবি তোলা আইনত দণ্ডনীয়। তাই আমাদের স্বেচ্ছাসেবক দল প্রতিটি বিতরণের পুষ্টিকর ছবির ক্ষেত্রে মানুষের সম্মান ও আত্মমর্যাদা ক্ষুণ্ন না করতে মুখমণ্ডল ব্লার/ফিল্টার করে আপলোড করতে বাধ্য থাকে।
                  </p>
                </div>
              </div>
              <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl block shrink-0">Ethical AI Filter Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {proofs.map((proof) => {
                return (
                  <div key={proof.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                    <div className="relative h-48 bg-slate-100">
                      <img src={proof.imageUrl} alt={proof.locationName} className="w-full h-full object-cover" />
                      
                      {proof.isFacesBlurred && (
                        <div className="absolute top-2.5 right-2.5 bg-black/60 shadow-md text-[10px] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 backdrop-blur-xs">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          Dignity-Blur Enabled
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 bg-emerald-600 text-white font-bold text-[10px] px-2 py-1 rounded">
                        {proof.cause === "Food" ? "খাদ্য সাহায্য" : proof.cause === "Medical" ? "জরুরি চিকিৎসা" : "শিক্ষা প্যাকেজ"}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm block truncate" title={proof.locationName}>{proof.locationName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          জিপিএস: {proof.coordinates}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-600">
                        <div>
                          <strong>মোট সুবিধাপ্রাপ্ত:</strong>
                          <p className="font-extrabold text-slate-900">{proof.servedCount} জন মানুষ</p>
                        </div>
                        <div>
                          <strong>বিতরণকারী দল:</strong>
                          <p className="font-semibold text-slate-900">{proof.volunteerCount} জন স্বেচ্ছাসেবী</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>বিতরণ সময়: {proof.timestamp}</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">ID: {proof.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 4: INTERACTIVE SANDBOX PORTALS */}
        {activeTab === "sandbox" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
            id="sandbox_view"
          >
            {/* Persona Selector Header tab */}
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-1.5 mb-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                স্বচ্ছ হিউম্যান সিমুলেশন স্যান্ডবক্স (Interactive Sandbox)
              </h3>
              <p className="text-xs text-slate-300 mb-6">
                নিচের প্যানেলটি থেকে আপনার কাঙ্ক্ষিত রোল (Donor, Volunteer বা Admin) খুজে ক্লিক করুন এবং প্ল্যাটফর্মের রিয়েল-টাইম কার্যক্রম নিজ হাতে পরীক্ষা করুন।
              </p>

              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800 rounded-xl">
                <button 
                  onClick={() => setActivePersona("donor")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activePersona === "donor" ? "bg-emerald-600 text-white" : "hover:bg-slate-750 text-slate-400"}`}
                >
                  <User className="h-3.5 w-3.5" />
                  (a) দাতব্য ব্যক্তি (Donor)
                </button>
                <button 
                  onClick={() => setActivePersona("volunteer")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activePersona === "volunteer" ? "bg-emerald-600 text-white" : "hover:bg-slate-750 text-slate-400"}`}
                >
                  <Users className="h-3.5 w-3.5" />
                  (b) স্বেচ্ছাসেবী (Volunteer)
                </button>
                <button 
                  onClick={() => setActivePersona("admin")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activePersona === "admin" ? "bg-emerald-600 text-white" : "hover:bg-slate-750 text-slate-400"}`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  (c) সুপার এডমিন (Approver)
                </button>
              </div>
            </div>

            {/* Persona Display Cards */}

            {/* PERSONA A: DONOR */}
            {activePersona === "donor" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200">
                  <h4 className="font-extrabold text-slate-900 border-b border-indigo-100 pb-2 mb-4 flex items-center gap-1.5 text-sm">
                    <Utensils className="h-4 w-4 text-[#E2125B]" />
                    ১. ডোনেশন সিলেক্ট ও পেমেন্ট
                  </h4>
                  
                  <form onSubmit={handleSponsorClick} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">দাতার পূর্ণ নাম (বাংলা/English)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. জাহিদ হাসান"
                        value={donorForm.name}
                        onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                        disabled={donorForm.isAnonymous}
                        className="w-full bg-slate-50 p-2 text-xs rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="flex gap-4 items-center">
                      <input 
                        type="checkbox" 
                        id="anonymous_check"
                        checked={donorForm.isAnonymous}
                        onChange={(e) => setDonorForm({ ...donorForm, isAnonymous: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <label htmlFor="anonymous_check" className="text-slate-650 font-medium">আমার নাম সবার সামনে প্রকাশ করবেন না (Anonymity)</label>
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">অর্থ সহায়তার খাত নির্বাচন করুন</label>
                      <select 
                        value={donorForm.cause}
                        onChange={(e) => setDonorForm({ ...donorForm, cause: e.target.value as any })}
                        className="w-full bg-slate-50 p-2 text-xs rounded-lg border border-slate-200 text-slate-900 outline-none"
                      >
                        <option value="Food">Daily Food (৫০৳ = ১টি দুপুরের সুষম থালা)</option>
                        <option value="Medical">Medical Support (অক্সিজেন ফিলিং ও জরুরি ঔষধ)</option>
                        <option value="Education">Education Support (বই খাতা ও পাঠ্য সহায়ক)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">অনুদানের পরিমাণ (বাংলাদেশি BDT ৳)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 500"
                        value={donorForm.amount}
                        onChange={(e) => setDonorForm({ ...donorForm, amount: e.target.value })}
                        className="w-full bg-slate-50 p-2 text-sm font-bold rounded-lg border border-slate-200 text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">উৎসাহমূলক বা বিশেষ বার্তা (Beneficiary Message)</label>
                      <textarea 
                        placeholder="সুবিধাপ্রাপ্ত ভাই বোনদের উদ্দেশ্যে আন্তরিক কিছু কথা..."
                        rows={2}
                        value={donorForm.message}
                        onChange={(e) => setDonorForm({ ...donorForm, message: e.target.value })}
                        className="w-full bg-slate-50 p-2 text-xs rounded-lg border border-slate-200 text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">পেমেন্ট গেটওয়ে নির্বাচন করুন</label>
                      <select 
                        value={donorForm.paymentGateway}
                        onChange={(e) => setDonorForm({ ...donorForm, paymentGateway: e.target.value as any })}
                        className="w-full bg-slate-50 p-2 text-xs rounded-lg border border-slate-200 text-slate-900 outline-none"
                      >
                        <option value="bkash">bKash (বিকাশ লাইভ সিমুলেশন পপআপ)</option>
                        <option value="sslcommerz">SSLCommerz (বাংলাদেশি গেটওয়ে সিমুলেশন)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className={`w-full text-white font-extrabold text-sm py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${donorForm.paymentGateway === "bkash" ? "bg-[#E2125B] hover:bg-[#c20d4d]" : "bg-orange-500 hover:bg-orange-600"}`}
                    >
                      {donorForm.paymentGateway === "bkash" ? "বিকাশ দিয়ে অনুদান পাঠান" : "SSLCommerz দিয়ে পেমেন্ট করুন"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200">
                  <h4 className="font-extrabold text-slate-950 text-sm mb-4">২. রিয়েল-টাইম পাবলিক ভিউয়ার পোর্টাল</h4>
                  <p className="text-xs text-slate-400 mb-4">দাতব্য ব্যক্তি পেমেন্ট করার পর তার অর্থ ও স্পন্সর ট্র্যাকিং নিম্নের মত সাধারণ মানুষের সামনে দৃশ্যমান হয়:</p>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">রিসিপ্ট আইডি: {currentDonationProcessing?.id || "REC-12509A"}</div>
                        <h5 className="font-extrabold text-slate-950 text-lg sm:text-xl mt-1">
                          {currentDonationProcessing?.donorName || "রহিম আহমেদ"} - {currentDonationProcessing?.amount || "৫,০০০"} BDT ৳
                        </h5>
                        <p className="text-xs text-slate-500 mt-1">পেমেন্ট মেথড: {currentDonationProcessing?.paymentGateway || "bKash"} | ট্রানজেকশন আইডি: <span className="font-mono text-slate-700">{currentDonationProcessing?.txnId || "TXN938201991"}</span></p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" />
                        লেজার ভেরিফাইড
                      </span>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <strong className="text-slate-400 font-semibold block">আবেদিত অর্থ খাত:</strong>
                        <p className="font-bold text-slate-900 mt-0.5">{currentDonationProcessing?.cause === "Food" ? "দৈনিক পুষ্টিকর খাবার সরবরাহ" : "জরুরি চিকিৎসা ফান্ড"}</p>
                      </div>
                      <div>
                        <strong className="text-slate-400 font-semibold block">অনুদান ট্র্যাকিং লোকেশন:</strong>
                        <p className="font-bold text-slate-900 mt-0.5">মাগুরা সদর স্বেচ্ছাসেবী টিম</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PERSONA B: VOLUNTEER */}
            {activePersona === "volunteer" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200">
                  <h4 className="font-extrabold text-slate-900 border-b border-indigo-100 pb-2 mb-4 flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-emerald-500" />
                    স্বেচ্ছাসেবী খরচ ও বিতরণ সাবমিশন ফর্ম
                  </h4>

                  <form onSubmit={handleVolunteerLog} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">অ্যাক্টিভ জেলা দল</label>
                        <select 
                          value={volunteerForm.team}
                          onChange={(e) => setVolunteerForm({ ...volunteerForm, team: e.target.value })}
                          className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-900 outline-none"
                        >
                          <option value="Magura Team">Magura Team</option>
                          <option value="Dhaka Team">Dhaka Team</option>
                          <option value="Jessore Team">Jessore Team</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">খরচের ক্যাটাগরি</label>
                        <select 
                          value={volunteerForm.cause}
                          onChange={(e) => setVolunteerForm({ ...volunteerForm, cause: e.target.value as any })}
                          className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-900 outline-none"
                        >
                          <option value="Food">খাদ্য (চাল, ডাল, সবজি ক্রয়)</option>
                          <option value="Medical">চিকিৎসা (অক্সিজেন ফিলিং, ঔষধ)</option>
                          <option value="Education">শিক্ষা সহায়ক (খাতা, কলম বই)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-slate-700 font-semibold block mb-1">আইটেমের বিবরণ/নাম</label>
                        <input 
                          type="text" 
                          placeholder="e.g. পোলাও চাল ও পোল্ট্রি মুরগি"
                          value={volunteerForm.itemName}
                          onChange={(e) => setVolunteerForm({ ...volunteerForm, itemName: e.target.value })}
                          className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-700 font-semibold block mb-1">পরিমাণ/ইউনিট</label>
                        <input 
                          type="text" 
                          placeholder="e.g. ১০০ কেজি"
                          value={volunteerForm.quantity}
                          onChange={(e) => setVolunteerForm({ ...volunteerForm, quantity: e.target.value })}
                          className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">মোট ভাউচার বিল মূল্য (BDT ৳)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5800"
                        value={volunteerForm.amount}
                        onChange={(e) => setVolunteerForm({ ...volunteerForm, amount: e.target.value })}
                        className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-900 outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                        <Upload className="h-3.5 w-3.5" /> রশিদের ছবি আপলোড (বাধ্যতামূলক)
                      </label>
                      <div className="flex items-center gap-3">
                        <button type="button" className="bg-white border border-slate-200 px-3 py-1.5 rounded text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1">
                          <Plus className="h-3 w-3" /> ছবি তুলুন / সিলেক্ট করুন
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">receipt_voucher_02.png (1.2 MB)</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl space-y-3">
                      <h5 className="font-bold text-[10px] text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" /> ট্র্যাকিং ও এথিক্যাল প্রুভ ফিল্টার
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">বিতরণ লোকেশন নাম</label>
                          <input 
                            type="text" 
                            placeholder="e.g. মাগুরা সোনামুখি বস্তি"
                            value={volunteerForm.locationName}
                            onChange={(e) => setVolunteerForm({ ...volunteerForm, locationName: e.target.value })}
                            className="w-full bg-white p-2 rounded-lg border border-emerald-200 text-emerald-950 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">উপকারভোগীর সংখ্যা</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 150"
                            value={volunteerForm.servedCount}
                            onChange={(e) => setVolunteerForm({ ...volunteerForm, servedCount: e.target.value })}
                            className="w-full bg-white p-2 rounded-lg border border-emerald-200 text-emerald-950 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="checkbox" id="volunteer_blur" defaultChecked disabled className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                        <label htmlFor="volunteer_blur" className="text-[10px] text-emerald-700 font-medium">ডাবল-ফেস অটো-ব্লার ফিল্টার এনাবল্ড (Ethics Match)</label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      ভেরিফায়েড লেজারে খরচ ও ছবি সাবমিট করুন
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-950 text-sm mb-4">৩. মাঠকর্মীদের জন্য জিপিএস মেটাডাটা অ্যানালিটিক্স</h4>
                    <p className="text-xs text-slate-400 mb-4">স্বেচ্ছাসেবীদের আপলোডকৃত ফাইলের সাথে ব্যাকএন্ড সিস্টেমে নিচে প্রদর্শিত ট্র্যাকিং অ্যানালিটিক্স লজিকালি বাফারিং হয়:</p>

                    <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl shadow-inner space-y-4">
                      <div>
                        <span className="text-slate-400">{"// ২-এডমিন কাস্টডি ট্রাস্ট এস্টাবলিশমেন্ট লুপ"}</span>
                        <div className="text-white mt-1">INITIATING GPS GEO-FENCING INTEGRITY CHECK...</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-300">
                        <div>
                          <span>[DEVICE GPS COORDINATES]</span>
                          <p className="text-teal-300 font-bold">23.4873° N, 89.4190° E (Magura Sadar)</p>
                        </div>
                        <div>
                          <span>[DEVICE TIMESTAMPS]</span>
                          <p className="text-teal-300 font-bold">2026-06-02 20:11:21 UTC (True Match)</p>
                        </div>
                        <div>
                          <span>[Blur Filter Status]</span>
                          <p className="text-emerald-400 font-bold">Active (100% Faces Redacted)</p>
                        </div>
                        <div>
                          <span>[IP Address Signature]</span>
                          <p className="text-slate-400">103.182.204.18 (bDIX Bangladesh)</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                        * এই মেটাডাটা ফাইলটি কোনোভাবেই পরিবর্তন বা এডিটযোগ্য নয় এবং পাবলিক অডিটররা এটি সরাসরি কোঅর্ডিনেট ম্যাপ দিয়ে ট্র‍্যাক করতে পারবেন।
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs">
                    <strong className="text-slate-900 block font-bold mb-1">অফলাইন-ফার্স্ট সলিউশন সুবিধা:</strong>
                    <span className="text-slate-500 block">মাঠ পর্যায়ে ইন্টারনেট চলে গেলেও আমাদের মোবাইল স্যান্ডবক্স অ্যাপটি ব্যাকআপ ড্রাইভে ডেটা হোল্ড করে এবং ইন্টারনেট কানেক্ট হলেই ট্রানজেকশন হ্যাশ সহ সিঙ্ক করে।</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PERSONA C: ADMIN MULTI-SIG APPROVER */}
            {activePersona === "admin" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-xs text-amber-800">
                  <AlertCircle className="h-5 w-5 shrink-0 stroke-[2.5]" />
                  <span>
                    <strong>এডমিন মাল্টি-সিগ নোটিশ:</strong> যেকোনো পেন্ডিং খরচের অর্থ MFS ওয়ালেট থেকে স্বেচ্ছাসেবীদের ব্যাংক একাউন্টে সফলভাবে ট্রান্সফার করতে কমপক্ষে ২ জন পেনালিস্ট এডমিনের অনুমোদন সাইন আবশ্যক। আপনি নিচে পেন্ডিং খরচে ক্লিক করে সাইন দিতে পারেন।
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Pending Approvals Table */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200">
                    <h3 className="font-bold text-slate-950 text-sm mb-4">চলতি পেন্ডিং খরচের বিবরণী (Pending Multi-Sig Bills)</h3>

                    <div className="space-y-4">
                      {expenses
                        .filter((e) => e.status === "Pending Approval" || e.status === "Flagged")
                        .map((exp) => (
                          <div key={exp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-sm">{exp.itemName}</h5>
                                <p className="text-[10px] text-slate-450 mt-1 font-mono">{exp.team} | আইডি: {exp.id}</p>
                              </div>
                              <span className="text-base font-extrabold text-slate-950">{exp.amount.toLocaleString()} ৳</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200 pt-3 text-[11px]">
                              {/* Admin 1 sign */}
                              <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between">
                                <span className="font-semibold text-slate-600">এডমিন ১ সই:</span>
                                <button
                                  onClick={() => toggleAdminApproval(exp.id, 1)}
                                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase transition-colors outline-none ${exp.admin1Approval ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                                >
                                  {exp.admin1Approval ? "স্বাক্ষরিত" : "স্বাক্ষর দিন"}
                                </button>
                              </div>

                              {/* Admin 2 sign */}
                              <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between">
                                <span className="font-semibold text-slate-600">এডমিন ২ সই:</span>
                                <button
                                  onClick={() => toggleAdminApproval(exp.id, 2)}
                                  className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase transition-colors outline-none ${exp.admin2Approval ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                                >
                                  {exp.admin2Approval ? "স্বাক্ষরিত" : "স্বাক্ষর দিন"}
                                </button>
                              </div>

                              <div className="flex items-center justify-end">
                                <button 
                                  onClick={() => runAiAuditor(exp.id)}
                                  className="w-full sm:w-auto bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-3 py-1.5 rounded text-[10px] uppercase"
                                >
                                  জেমিনি এআই চেক
                                </button>
                              </div>
                            </div>

                            {/* Ai indicator */}
                            {exp.aiAudit && (
                              <div className="p-2 bg-purple-50 text-purple-900 rounded border border-purple-100 text-[10px] font-mono leading-normal">
                                <strong>[এআই অডিট ফাইন্ডিং]:</strong> {exp.aiAudit.reasoning}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Anti-fraud diagram */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3 text-sm">ডুয়াল-সিগ ওয়ালেট কেন জরুরি?</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        একটি সেন্ট্রালাইজড এ্যাডমিনের পাসওয়ার্ড ডেপ্রিকেট হলে অথবা কোনো একক এ্যাডমিন হ্যাকিংয়ের শিকার হলে প্ল্যাটফর্মের সম্পূর্ণ অর্থ হারিয়ে যায় না। মাল্টি-সিগ প্রটোকলে প্রতিটি ট্রানজেকশনে মিনিমাম ২ বা ৩ জনের পৃথক প্রাইভেট কী সাইনেচার ভ্যালিডেট হতে হবে, নয়তো বিকাশ API অর্থ ট্রান্সফার করতে অস্বীকৃতি জানাবে।
                      </p>

                      <div className="mt-6 border-l-2 border-emerald-500 pl-3 py-1 text-slate-700 text-xs space-y-2">
                        <div>
                          <strong className="block font-bold">এডমিন ১: Musab Sharif</strong>
                          <span className="text-[10px] text-slate-400">Status: Signed in on iOS</span>
                        </div>
                        <div>
                          <strong className="block font-bold">এডমিন ২: Sadek Rahman</strong>
                          <span className="text-[10px] text-slate-400">Status: Remote Active (Dhaka)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 block tracking-wider uppercase mb-1">সিগনেচার আর্কিটেকচার</span>
                      <div className="bg-slate-100 p-2.5 rounded font-mono text-[9px] text-slate-650">
                        m_of_n_rules: &quot;2_of_3&quot;<br />
                        encryption: &quot;secp256k1&quot;<br />
                        verifiedByGateway: true
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}

        {/* TAB 5: COMPREHENSIVE ARCHITECTURE & SYSTEM BLUEPRINT */}
        {activeTab === "blueprint" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
            id="blueprint_view"
          >
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-4">
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Technical Project Blueprint
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                দুর্নীতিমুক্ত চ্যারিটি প্ল্যাটফর্মের পূর্ণাঙ্গ ব্লুপ্রিন্ট ও টেকনিক্যাল ডিজাইন
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                এটি একটি বিস্তারিত প্রজেক্ট আর্কিটেকচার গাইড যা ১০০% সততা, জনসম্মুখে লাইভ ট্র্যাকিং এবং ক্যাশলেস দুর্নীতিহীন ফান্ড ও বিতরণ নিশ্চিত করার জন্য প্রণয়ন করা হয়েছে।
              </p>
            </div>

            {/* Blueprint Section Accordion/Grid */}
            <div className="space-y-6">
              
              {/* Pillar 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">১</span>
                  সিস্টেম আর্কিটেকচার ও টেক স্ট্যাক (System Architecture & Tech Stack)
                </h3>
                
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    ব্যয়বহুল ডেটাবেসে না গিয়ে ও দ্রুত রিয়েল-টাইম কনভারজেন্ট লেজার রেন্ডারিং এর জন্য এই প্ল্যাটফর্মটি <strong>Micro-frontend & Full-Stack Node</strong> আর্কিটেকচারে ডিফাইন করা হয়েছে।
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <strong className="text-slate-900 block font-bold text-xs mb-1">ওয়েব ড্যাশবোর্ড (Web app)</strong>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        <strong>Next.js + Tailwind CSS</strong><br />
                        দ্রুত ইন্টারঅ্যাক্টিভিটি, লাইভ ডিলিশন সিগন্যালিং এবং চার্ট ডাটার জন্য রিএক্ট কম্পোনেন্টস ও রিডিজাইন্ড ভিউ লুপ।
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <strong className="text-slate-900 block font-bold text-xs mb-1">মোবাইল অ্যাপ (Volunteers Mobile)</strong>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        <strong>Flutter / Dart</strong><br />
                        মাঠ পর্যায়ের স্বেচ্ছাসেবীদের ট্রাভেল জোন ট্র্যাকিং, অফলাইন ও ক্যামেরা EXIF ডাটা নিষ্কাশনের জন্য অ্যান্ড্রয়েড এবং আইওএস অ্যাপ্লিকেশন।
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <strong className="text-slate-900 block font-bold text-xs mb-1">সার্ভার লেয়ার (Backend APIs)</strong>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        <strong>Next Serverless API / Express</strong><br />
                        বিকাশ API ইন্টিগ্রেশন, ২-এডমিন মাল্টি-সিগনেচার হ্যান্ডলিং, এবং ক্যামেরা ডাবল ফেস ব্লার ও এআই ফ্রড চেকার।
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <strong className="text-slate-900 block font-bold text-xs mb-1">ডাটাবেস ও ফাইল (Database)</strong>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        <strong>Google Firebase Firestore</strong><br />
                        যেকোনো উপভোক্তার লাইভ ব্রাউজিং সিঙ্কের জন্য। রশিদের অবজেক্ট ফাইলের জন্য Firebase ক্লাউড স্টোরেজ।
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">২</span>
                  ডাটাবেস স্কিমা ও রিলেশনশিপ ম্যাপিং (Database Schema Logic)
                </h3>
                
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                  <p>
                    Firestore-এর মত নো-এসকিউএল সিস্টেমে রিলেশনাল ইনভ্যারিয়েন্স বজায় রাখতে নিম্নের মতো ডকুমেন্টেড কালেকশন ম্যাপিং ড্রাফট ডিজাইন প্রয়োজন:
                  </p>

                  <div className="space-y-4 font-mono text-[11px] sm:text-xs bg-slate-900 text-slate-300 p-4 sm:p-5 rounded-2xl">
                    <div>
                      <span className="text-amber-400">{"// ১. /collections/donations (সংগৃহীত দানপাপত্র)"}</span>
                      <pre className="text-emerald-400 font-light leading-normal">
{`{
  id: string,               // primary_key ("don_3901")
  donorName: string,        // "রহিম আহমেদ" বা "Anonymous"
  isAnonymous: boolean,     // true বা false
  amount: number,           // BDT (e.g. 5000)
  cause: string,            // "Food" | "Medical" | "Education"
  txnId: string,            // bKash gateway transaction ID
  timestamp: string,        // iso format ("2026-06-02T20:11:19Z")
  message: string           // ঐচ্ছিক উৎসাহ সূচক টেক্সট
}`}
                      </pre>
                    </div>

                    <div>
                      <span className="text-amber-400">{"// ২. /collections/expenses (পাবলিক লেজার ব্যয়)"}</span>
                      <pre className="text-emerald-400 font-light leading-normal">
{`{
  id: string,               // pk ("exp_8312")
  itemName: string,         // "Miniket Rice"
  quantity: string,         // "300 Kg"
  amount: number,           // BDT (e.g. 19500)
  unitPrice: number,        // e.g. 65
  cause: string,            // "Food"
  receiptUrl: string,       // Firebase Storage URI ("https://storage...png")
  geotag: {
    lat: number,            // GPS latitude
    lng: number             // GPS longitude
  },
  adminApprovals: string[], // [ "admin_uid_1", "admin_uid_2" ] -> Multi-Sig
  status: string,           // "Pending" | "Fully Signed" | "Flagged"
  createdAt: string,
  aiAudit: {
    isSuspicious: boolean,
    anomalyScore: number,
    reasoning: string
  }
}`}
                      </pre>
                    </div>

                    <div>
                      <span className="text-amber-400">{"// ৩. /collections/distributions (নীতিগত প্রমাণ গ্যালারি)"}</span>
                      <pre className="text-emerald-400 font-light leading-normal">
{`{
  id: string,               // pk
  locationName: string,     // "Magura Slum No 2"
  servedCount: number,      // e.g. 150
  cause: string,            // "Food"
  attachedExpenseId: string,// Relational check back to expenses
  facesBlurred: boolean,    // true (Stops victim vulnerability)
  timestamp: string
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">৩</span>
                  ইউজার জার্নি ও ফ্লো (End-to-End User Journeys)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1 mb-2 text-xs">১. দাতা (Donor Journey)</strong>
                    <ol className="list-decimal pl-4 space-y-1.5 font-light">
                      <li>দাতব্য ব্যক্তি ওয়েব ড্যাশবোর্ডে &quot;ইমপ্যাক্ট ক্যালকুলেটর&quot; ব্যবহার করে অ্যামাউন্ট নির্বাচন করে।</li>
                      <li>পেমেন্ট বাটন প্রেস করলে বিকাশ/নগদ পেমেন্ট গেটওয়ের সিমুলেটেড পপআপ ওপেন হয়।</li>
                      <li>দান সফল হলে bKash API থেকে গেটওয়ে কনফার্মেশন সহ ট্রানজেকশন হ্যাশ লেজারে সিঙ্ক হয়।</li>
                      <li>মূহুর্তেই লাইভ ফিডে ও ক্যাশ ইন হ্যান্ডে টাকা আপডেট হয়ে জনসম্মুখে লাইভ ফিড দেখায়।</li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1 mb-2 text-xs">২. স্বেচ্ছাসেবী (Volunteer Journey)</strong>
                    <ol className="list-decimal pl-4 space-y-1.5 font-light">
                      <li>মোবাইল অ্যাপ দিয়ে স্বেচ্ছাসেবী লোকাল বাজারে চাল-ডাল ক্রয় করে ক্যাশ মেমো সংগ্রহ করেন।</li>
                      <li>টাকা খরচের আইটেম নাম, পরিমাণ, ও ভাউচারের জিপিএস ক্যামেরা যুক্ত ছবি তুলে আপলোড করেন।</li>
                      <li>খাদ্য বিতরণের চমৎকার ছবি তোলার পর এথিক্যাল এআই মডেলটি স্বয়ংক্রিয়ভাবে সুবিধাভোগীদের মুখাবয়ব ব্লার বা আড়াল করে দেয়।</li>
                      <li>খরচ ও প্রমাণপত্র ২-এডমিন প্যানেলে অনুমোদনের জন্য প্রেরণ করা হয়।</li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1 mb-2 text-xs">৩. সুপার এডমিন (Super Admin Journey)</strong>
                    <ol className="list-decimal pl-4 space-y-1.5 font-light">
                      <li>এডমিন পেন্ডিং রিকোয়েস্ট অ্যালার্ট প্যানেলে প্রবেশ করে খরচটি দেখেন।</li>
                      <li>জেমিনি এআই ওসিআর দিয়ে অলরেডি চালিত অস্বাভাবিক মূল্য চেক এবং জিপিএস ট্র্যাকিং অডিট দেখে বিচার করেন।</li>
                      <li>কমপক্ষে ২ জন নিবন্ধিত এডমিন ট্রানজেকশনে সই প্রদান করেন।</li>
                      <li>দুজনের সই পাওয়ার পর সিস্টেম স্বয়ংক্রিয় bKash API এর মাধ্যমে স্বেচ্ছাসেবীর ব্যাংক একাউন্টে অর্থ রিলিজ করে ব্যালেন্স আপডেট করে দেয়।</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">৪</span>
                  প্রতারণা প্রতিরোধ ও মাল্টি-সিগ মেকানিজম (Fraud Mitigation Mechanism)
                </h3>
                
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                  <p>
                    যেহেতু টাকা এবং দুর্নীতির ঝুঁকি অন্যতম প্রধান সমস্যা, তাই প্ল্যাটফর্মের সিকিউরিটি কাঠামো ডিজাইন করা হয়েছে দুটি প্রধান গেম-চেঞ্জিং উপাদানের ওপর:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <strong className="text-slate-905 block font-bold text-xs mb-1">ক্যাশলেস ডুয়াল এ্যাডমিন সাইন (Multi-Sig API Routing)</strong>
                      <span className="text-xs text-slate-500 leading-normal block pt-1 font-light">
                        রিলিজ ফান্ডের জন্য Next.js এপিআই রাউটে নিম্নের ভ্যালিডেশন কোড ব্যবহৃত হয়:<br />
                        <code className="bg-slate-900 text-emerald-400 p-1.5 rounded block font-mono text-[9px] mt-2 leading-relaxed">
{`const canPayout = (expense) => {
  const verifiedAdmins = expense.adminApprovals.filter(uid => registeredAdmins.includes(uid));
  return verifiedAdmins.length >= 2; // Strict minimal signature
}`}
                        </code>
                        একক এডমিনের একাউন্ট কমপ্রোমাইজ হলেও সিস্টেম ও bKash API টাকা রিলিজ দেবে না যতক্ষণ পর্যন্ত না দ্বিতীয় ভেরিফাইড কি দিয়ে সই ভ্যালিডেট হচ্ছে।
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <strong className="text-slate-905 block font-bold text-xs mb-1">জেমিনি এআই প্রাইস এনোমালি ডিটেক্টর (AI-driven Auditing)</strong>
                      <span className="text-xs text-slate-500 leading-normal block pt-1 font-light">
                        আজকের স্যান্ডবক্স প্যানেলে যুক্ত জেমিনি ৩.৫ মডেলটি কোনো রশিদের বা চালানের বিবরণী পড়েই বাংলাদেশের সরকারি খাদ্য বাজার দরের সাথে রিয়েল-টাইম তুলনা ঘটাতে পারে। যদি কোনো টিম ডাল ১২০ ৳ কেজি এর জায়গায় ১৭৫ ৳ দেখায়, তবে এআই সরাসরি সেটিকে <strong>“Flagged / Suspicious”</strong> করে দেয় এবং এডমিনদের নোটিফাই করে।
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">৫</span>
                  বিকাশ পরিকল্পনা ও বাস্তবায়ন রোডম্যাপ (Implementation Roadmap)
                </h3>
                
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-light space-y-4">
                  <p>
                    একটি নিখুঁত ও ট্রাস্টেড স্টার্টআপ দাঁড় করানোর পদ্ধতি নিচে ৪ টি ধাপে উপস্থাপন করা হয়েছে:
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="font-extrabold text-[#E2125B] shrink-0 text-sm">১ম ধাপ (MVP - মাস ১-৩):</span>
                      <p> Next.js ওয়েব প্ল্যাটফর্মের বেসিক লাইভ ড্যাশবোর্ড লঞ্চ। বিকাশ গেটওয়ের স্যান্ডবক্স ইন্টিগ্রেশন এবং এডমিন অনুমোদন প্যানেলের কোর আর্কিটেকচার এস্টাব্লিশমেন্ট।</p>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-[#E2125B] shrink-0 text-sm">২য় ধাপ (Beta - মাস ৩-৬):</span>
                      <p>স্বেচ্ছাসেবীদের জন্য ফ্লাটার মোবাইল অ্যাপ নিয়ে আসা। ও অফলাইন ট্র্যাকিং সিঙ্ক ও জিপিএস কোঅর্ডিনেট ডাটা ভ্যালিডেশন মেকানিজম সেটআপ করা।</p>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-[#E2125B] shrink-0 text-sm">৩য় ধাপ (AI Shield - মাস ৬-৯):</span>
                      <p>জেমিনি এআই ওসিআর যুক্ত করা যা স্বয়ংক্রিয়ভাবে রশিদ পড়ে ভুল ডাটা চেক করবে। বাংলাদেশে প্রতিটি কাঁচাবাজারের স্ট্যান্ডার্ড প্রাইস সিঙ্ক করার জন্য স্ক্র্যাপার কাস্টমাইজেশন।</p>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                      <span className="font-extrabold text-[#E2125B] shrink-0 text-sm">৪র্থ ধাপ (Scale - মাস ১২+):</span>
                      <p>৬৪টি জেলাতে স্বেচ্ছাসেবী সম্প্রসারণ এবং ক্রিপ্টোগ্রাফিক লজিক্যাল ইমিউটেবিলিটি বজায় রাখতে সম্পূর্ণ ট্রানজেকশন প্রুভ চেইন ওপেন করা।</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </main>

      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800" id="app_footer">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            <strong className="text-emerald-400 font-bold block text-sm">Transparent Charity Platform</strong>
            <p className="text-slate-400 mt-1">প্রযুক্তি দিয়ে সততা ও স্বচ্ছতা নিশ্চিত করে অসহায় ও দরিদ্র মানুষের মুখে খাবার তুলে দেওয়াই আমাদের লক্ষ্য।</p>
          </div>
          <p className="text-slate-500 font-mono">© 2026 Transparent Charity Platform (BD). All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-3">
        <span className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></span>
        <span className="text-xs text-slate-500 font-bold">প্ল্যাটফর্ম লোড হচ্ছে...</span>
      </div>
    }>
      <CharityPlatformApp />
    </Suspense>
  );
}
