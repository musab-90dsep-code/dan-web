# Transparent Charity Platform

An anti-corruption donation tracking and operational logging system designed to eliminate fraud and build 100% public trust through real-time financial tracking and proof of impact.

---

## 🚀 Key Features

1. **Live Transparency Dashboard**: Real-time stats showing total donations, current cash in bank/MFS reserves, total beneficiaries served, and meal plates distributed.
2. **Anti-Corruption Ledger**: Publicly visible accounts showing itemized daily expenses (rice, lentils, etc.) linked directly to receipt/bill uploads.
3. **Donor Visibility**: Freedom to choose between public names (e.g., Rahim Ahmed) or complete anonymity (e.g., Anonymous).
4. **Ethical Real-Proof Gallery**: GPS geo-tagged photos, videos, and logs of food distributions. Features automated face blurring to respect and protect beneficiary dignity.
5. **Decentralized Volunteer Management**: District-level volunteer teams (Magura, Dhaka, Jessore) can upload expenses and proof documents.
6. **Programmatic Fraud Prevention**:
   - **Cashless Simulation**: Focuses entirely on digital wallets (bKash, Nagad, Bank).
   - **Dual Approval (Multi-Sig)**: Requires approvals from at least two Super Admins before releasing funds to volunteers.
   - **EXIF & Geolocation Verification**: Verifies coordinates and timestamps of uploaded photos.
7. **Gemini AI Auditing**: Real-time receipt scanning and price anomaly checking (e.g., alerts if market rates are inflated) using Gemini 3.5 Flash.
8. **Emergency & Campaign Modes**: Custom overlays for winter, floods, or Ramadan relief campaigns.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (React 19), Tailwind CSS, Framer Motion (Motion), Lucide React
- **Database**: Google Firebase Firestore (falls back to client-side LocalStorage if API keys are not provided)
- **AI Engine**: Google Gemini 3.5 Flash API (for OCR auditing & price validation)
- **Payment Simulators**: bKash MFS Modal & SSLCommerz Sandbox Gateway

---

## 📦 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone or extract the project repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env.local` file in the root directory and define the following variables:

```env
# Required for Gemini AI Auditing
GEMINI_API_KEY="your-gemini-api-key"

# Optional Firebase config (Falls back to LocalStorage if empty)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
```

### Running Locally

To run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view and interact with the application.
