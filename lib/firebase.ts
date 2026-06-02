// Firebase initialization and database wrapper with LocalStorage fallback
import { Donation, Expense, DistributionProof } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all essential keys are provided
export const isFirebaseEnabled = 
  !!firebaseConfig.apiKey && 
  !!firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.projectId !== "";

let app: any = null;
let db: any = null;

// Dynamic imports to prevent errors if Firebase is not installed yet during linting/build
const initFirebase = async () => {
  if (!isFirebaseEnabled) return null;
  
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");
    
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    return db;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
};

// Start initialization
if (typeof window !== "undefined" && isFirebaseEnabled) {
  initFirebase();
  console.log("Firebase Firestore Client active.");
} else if (typeof window !== "undefined") {
  console.warn("Firebase config missing. Using LocalStorage fallback database.");
}

// -------------------------------------------------------------
// LOCAL STORAGE MOCK DB IMPLEMENTATION (FALLBACK)
// -------------------------------------------------------------
const getLocalData = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === "undefined") return initialData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialData;
  }
};

const setLocalData = <T>(key: string, data: T[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Mock Datasets
const defaultDonations: Donation[] = [
  { id: "don-1", donorName: "রহিম আহমেদ", amount: 5000, cause: "Food", timestamp: "২০২৬-০৬-০২ ১০:১৫", isAnonymous: false, message: "মাগুরা সদর টিমের জন্য উৎসর্গীকৃত", paymentGateway: "bKash", txnId: "BK_5017283" },
  { id: "don-2", donorName: "Anonymous", amount: 12000, cause: "Medical", timestamp: "২০২৬-০৬-০২ ০৮:৩০", isAnonymous: true, message: "জরুরি চিকিৎসার কাজে সাহায্য করুন", paymentGateway: "Nagad", txnId: "NG_9281726" },
  { id: "don-3", donorName: "ফাহমিদা জাহান", amount: 2500, cause: "Education", timestamp: "২০২৬-০৬-০১ ১৯:৪৫", isAnonymous: false, message: "শিক্ষার্থীদের খাতা কলম ক্রয়ের জন্য", paymentGateway: "SSLCommerz", txnId: "SSL_2019472" },
  { id: "don-4", donorName: "মো আরিফুল ইসলাম", amount: 1500, cause: "Food", timestamp: "২০২৬-০৬-০১ ১৪:২০", isAnonymous: false, message: "৩০টি দুপুরের পুষ্টিকর খাবার", paymentGateway: "bKash", txnId: "BK_8291048" },
  { id: "don-5", donorName: "Anonymous", amount: 1000, cause: "Food", timestamp: "২০২৬-০৫-৩১ ১১:১০", isAnonymous: true, paymentGateway: "bKash", txnId: "BK_1048291" }
];

const defaultExpenses: Expense[] = [
  {
    id: "exp-1",
    itemName: "মিনিকেট চাল (১২ কা বস্তা)",
    quantity: "৩০০ কেজি",
    amount: 19500,
    cause: "Food",
    unitPrice: 65,
    team: "Magura Team",
    receiptUrl: "https://picsum.photos/seed/receipt1/400/500",
    admin1Approval: true,
    admin2Approval: true,
    status: "Fully Signed",
    createdAt: "২০২৬-০৬-০২ ১১:০০",
    aiAudit: {
      isSuspicious: false,
      anomalyScore: 8,
      marketRateComparison: "মিনিকেট চালের সরকারি গড় বাজার মূল্য ৬৫-৬৮ ৳ প্রতি কেজি। এই চাল সংগৃহীত হয়েছে ৬৫ ৳ মূল্যে যা একদম সঠিক।",
      reasoning: "কোনোরূপ মূল্য বিচ্যুতি বা অস্বাভাবিকতা মেলেনি। চাল সরবরাহকারী প্রতিষ্ঠানটির চালানপত্র বৈধ।"
    }
  },
  {
    id: "exp-2",
    itemName: "মসুর ডাল (উন্নত মানের)",
    quantity: "৫০ কেজি",
    amount: 6250,
    cause: "Food",
    unitPrice: 125,
    team: "Magura Team",
    receiptUrl: "https://picsum.photos/seed/receipt2/400/500",
    admin1Approval: true,
    admin2Approval: true,
    status: "Fully Signed",
    createdAt: "২০২৬-০৬-০২ ১১:১৫",
    aiAudit: {
      isSuspicious: false,
      anomalyScore: 12,
      marketRateComparison: "মসুর ডালের বর্তমান পাইকারি বাজার মূল্য ১২০-১৩০ ৳ প্রতি কেজি। ১২৫ ৳ মূল্য যুক্তিসঙ্গত।",
      reasoning: "সঠিক বাজার মূল্য অনুযায়ী ডাটা এন্ট্রি করা হয়েছে। রশিদের বৈধতা প্রমাণিত।"
    }
  },
  {
    id: "exp-3",
    itemName: "জরুরি অক্সিজেন সিলিন্ডার ফিলিং",
    quantity: "২টি সিলিন্ডার",
    amount: 2800,
    cause: "Medical",
    unitPrice: 1400,
    team: "Dhaka Team",
    receiptUrl: "https://picsum.photos/seed/receipt3/400/500",
    admin1Approval: true,
    admin2Approval: false,
    status: "Pending Approval",
    createdAt: "২০২৬-০৬-০২ ১৪:০০",
    aiAudit: {
      isSuspicious: false,
      anomalyScore: 5,
      marketRateComparison: "অক্সিজেন ফিলিং এর বাজার মূল্য ১৪০০ ৳ প্রতি সিলিন্ডার যুক্তিসঙ্গত।",
      reasoning: "কোনো অস্বাভাবিকতা পাওয়া যায়নি।"
    }
  },
  {
    id: "exp-4",
    itemName: "প্রাথমিক স্কুল বই ও কলম সেট",
    quantity: "১৫ সেট",
    amount: 4500,
    cause: "Education",
    unitPrice: 300,
    team: "Jessore Team",
    receiptUrl: "https://picsum.photos/seed/receipt4/400/500",
    admin1Approval: true,
    admin2Approval: true,
    status: "Fully Signed",
    createdAt: "২০২৬-০৫-৩১ ১৫:৩০",
    aiAudit: {
      isSuspicious: false,
      anomalyScore: 10,
      marketRateComparison: "বই ও কলমের বাজার মূল্য ৩০০ ৳ প্রতি সেট সঠিক আছে।",
      reasoning: "স্বাভাবিক বাজার দর।"
    }
  },
  {
    id: "exp-5",
    itemName: "ডিম ও রান্নার মসলা",
    quantity: "৪০০ পিস ডিম",
    amount: 6800,
    cause: "Food",
    unitPrice: 17,
    team: "Dhaka Team",
    receiptUrl: "https://picsum.photos/seed/receipt5/400/500",
    admin1Approval: false,
    admin2Approval: false,
    status: "Flagged",
    createdAt: "২০২৬-০৬-০১ ১০:৪৫",
    aiAudit: {
      isSuspicious: true,
      anomalyScore: 82,
      marketRateComparison: "ডিম প্রতি পিস এর লোকাল মূল্য সাধারণত ১১-১৩ ৳ হওয়া বাঞ্ছনীয়। ঢাকার মিরপুর এলাকায় ডিম সর্বোচ্চ ১৩ ৳ দরে খুচরা বিক্রীত হয়েছে। ১৭ ৳ রেট অস্বাভাবিক ও বেশি।",
      reasoning: "ডিমের দাম বাজার দরের চেয়ে অস্বাভাবিক পরিমাণে বেশি এন্ট্রি করা হয়েছে। চালানের সত্যতা রিভিউ করা উচিত।"
    }
  }
];

const defaultProofs: DistributionProof[] = [
  {
    id: "prf-1",
    locationName: "মাগুরা সদর সুবিধাবঞ্চিত পাড়া",
    coordinates: "23.4873° N, 89.4190° E",
    servedCount: 180,
    cause: "Food",
    timestamp: "২০২৬-০৬-০২ ১২:৩০",
    imageUrl: "https://picsum.photos/seed/meal1/600/400",
    isFacesBlurred: true,
    volunteerCount: 5
  },
  {
    id: "prf-2",
    locationName: "যশোর রেল স্টেশন বস্তি এলাকা",
    coordinates: "23.1670° N, 89.2155° E",
    servedCount: 120,
    cause: "Food",
    timestamp: "২০২৬-০৬-০১ ১৩:০০",
    imageUrl: "https://picsum.photos/seed/meal2/600/400",
    isFacesBlurred: true,
    volunteerCount: 4
  },
  {
    id: "prf-3",
    locationName: "মিরপুর-১১ বস্তি স্কুল প্রাঙ্গণ",
    coordinates: "23.8223° N, 90.3654° E",
    servedCount: 35,
    cause: "Education",
    timestamp: "২০২৬-০৫-৩১ ১৫:০০",
    imageUrl: "https://picsum.photos/seed/school1/600/400",
    isFacesBlurred: true,
    volunteerCount: 3
  }
];

// Mock Listeners
const listeners = {
  donations: [] as ((data: Donation[]) => void)[],
  expenses: [] as ((data: Expense[]) => void)[],
  proofs: [] as ((data: DistributionProof[]) => void)[],
};

const notifyListeners = (type: "donations" | "expenses" | "proofs", data: any[]) => {
  listeners[type].forEach((cb) => cb(data));
};

// -------------------------------------------------------------
// PUBLIC API FOR BOTH REAL AND MOCK DB
// -------------------------------------------------------------

// 1. ADD DONATION
export const addDonation = async (donation: Donation): Promise<void> => {
  if (isFirebaseEnabled) {
    try {
      const { collection, doc, setDoc } = await import("firebase/firestore");
      const clientDb = db || await initFirebase();
      if (clientDb) {
        await setDoc(doc(collection(clientDb, "donations"), donation.id), donation);
        return;
      }
    } catch (e) {
      console.error("Firestore error, writing locally:", e);
    }
  }

  // Local storage fallback
  const donations = getLocalData<Donation>("charity_donations", defaultDonations);
  const updated = [donation, ...donations];
  setLocalData("charity_donations", updated);
  notifyListeners("donations", updated);
};

// 2. ADD EXPENSE
export const addExpense = async (expense: Expense): Promise<void> => {
  if (isFirebaseEnabled) {
    try {
      const { collection, doc, setDoc } = await import("firebase/firestore");
      const clientDb = db || await initFirebase();
      if (clientDb) {
        await setDoc(doc(collection(clientDb, "expenses"), expense.id), expense);
        return;
      }
    } catch (e) {
      console.error("Firestore error:", e);
    }
  }

  const expenses = getLocalData<Expense>("charity_expenses", defaultExpenses);
  const updated = [expense, ...expenses];
  setLocalData("charity_expenses", updated);
  notifyListeners("expenses", updated);
};

// 3. ADD PROOF
export const addProof = async (proof: DistributionProof): Promise<void> => {
  if (isFirebaseEnabled) {
    try {
      const { collection, doc, setDoc } = await import("firebase/firestore");
      const clientDb = db || await initFirebase();
      if (clientDb) {
        await setDoc(doc(collection(clientDb, "distributions"), proof.id), proof);
        return;
      }
    } catch (e) {
      console.error("Firestore error:", e);
    }
  }

  const proofs = getLocalData<DistributionProof>("charity_proofs", defaultProofs);
  const updated = [proof, ...proofs];
  setLocalData("charity_proofs", updated);
  notifyListeners("proofs", updated);
};

// 4. UPDATE EXPENSE
export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
  if (isFirebaseEnabled) {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const clientDb = db || await initFirebase();
      if (clientDb) {
        await updateDoc(doc(clientDb, "expenses", id), updates);
        return;
      }
    } catch (e) {
      console.error("Firestore error:", e);
    }
  }

  const expenses = getLocalData<Expense>("charity_expenses", defaultExpenses);
  const updated = expenses.map((exp) => {
    if (exp.id === id) {
      return { ...exp, ...updates };
    }
    return exp;
  });
  setLocalData("charity_expenses", updated);
  notifyListeners("expenses", updated);
};

// 5. SUBSCRIBE TO DONATIONS
export const subscribeDonations = (callback: (data: Donation[]) => void): (() => void) => {
  if (isFirebaseEnabled) {
    let unsubscribe: any = null;
    const startSubscription = async () => {
      try {
        const { collection, query, onSnapshot } = await import("firebase/firestore");
        const clientDb = db || await initFirebase();
        if (clientDb) {
          unsubscribe = onSnapshot(collection(clientDb, "donations"), (snapshot) => {
            const list: Donation[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as Donation));
            // Sort by timestamp desc (iso format sorts nicely)
            list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            callback(list);
          });
        }
      } catch (e) {
        console.error("Firestore subscribe error:", e);
      }
    };
    startSubscription();
    return () => unsubscribe && unsubscribe();
  }

  // Local Storage listener registration
  listeners.donations.push(callback);
  // Send current data immediately
  const current = getLocalData<Donation>("charity_donations", defaultDonations);
  callback(current);
  
  return () => {
    listeners.donations = listeners.donations.filter((cb) => cb !== callback);
  };
};

// 6. SUBSCRIBE TO EXPENSES
export const subscribeExpenses = (callback: (data: Expense[]) => void): (() => void) => {
  if (isFirebaseEnabled) {
    let unsubscribe: any = null;
    const startSubscription = async () => {
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const clientDb = db || await initFirebase();
        if (clientDb) {
          unsubscribe = onSnapshot(collection(clientDb, "expenses"), (snapshot) => {
            const list: Expense[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as Expense));
            // Sort by createdAt desc
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            callback(list);
          });
        }
      } catch (e) {
        console.error("Firestore subscribe error:", e);
      }
    };
    startSubscription();
    return () => unsubscribe && unsubscribe();
  }

  listeners.expenses.push(callback);
  const current = getLocalData<Expense>("charity_expenses", defaultExpenses);
  callback(current);
  
  return () => {
    listeners.expenses = listeners.expenses.filter((cb) => cb !== callback);
  };
};

// 7. SUBSCRIBE TO PROOFS
export const subscribeProofs = (callback: (data: DistributionProof[]) => void): (() => void) => {
  if (isFirebaseEnabled) {
    let unsubscribe: any = null;
    const startSubscription = async () => {
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const clientDb = db || await initFirebase();
        if (clientDb) {
          unsubscribe = onSnapshot(collection(clientDb, "distributions"), (snapshot) => {
            const list: DistributionProof[] = [];
            snapshot.forEach((doc) => list.push(doc.data() as DistributionProof));
            list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            callback(list);
          });
        }
      } catch (e) {
        console.error("Firestore subscribe error:", e);
      }
    };
    startSubscription();
    return () => unsubscribe && unsubscribe();
  }

  listeners.proofs.push(callback);
  const current = getLocalData<DistributionProof>("charity_proofs", defaultProofs);
  callback(current);
  
  return () => {
    listeners.proofs = listeners.proofs.filter((cb) => cb !== callback);
  };
};
