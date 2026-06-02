// Shared Type Definitions for the Transparent Charity Platform

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  cause: "Food" | "Medical" | "Education";
  timestamp: string;
  isAnonymous: boolean;
  message?: string;
  paymentGateway?: string;
  txnId?: string;
}

export interface Expense {
  id: string;
  itemName: string;
  quantity: string;
  amount: number;
  cause: "Food" | "Medical" | "Education";
  unitPrice: number;
  team: string; // e.g. "Magura Team"
  receiptUrl: string;
  admin1Approval: boolean;
  admin2Approval: boolean;
  status: "Pending Approval" | "Fully Signed" | "Flagged";
  createdAt: string;
  aiAudit?: {
    isSuspicious: boolean;
    anomalyScore: number;
    reasoning: string;
    marketRateComparison: string;
  };
}

export interface DistributionProof {
  id: string;
  locationName: string;
  coordinates: string;
  servedCount: number;
  cause: "Food" | "Medical" | "Education";
  timestamp: string;
  imageUrl: string;
  isFacesBlurred: boolean;
  volunteerCount: number;
}
