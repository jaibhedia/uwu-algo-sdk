<p align="center">
  <h1 align="center">@uwu-protocol/checkout</h1>
  <p align="center">
    <strong>Proof-of-payment checkout SDK for React</strong>
  </p>
  <p align="center">
    UPI payment → Setu Account Aggregator verification → On-chain attestation on Algorand
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/@uwu-protocol/checkout"><img src="https://img.shields.io/npm/v/@uwu-protocol/checkout?style=flat-square&color=cb3837&label=npm" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/@uwu-protocol/checkout"><img src="https://img.shields.io/npm/dm/@uwu-protocol/checkout?style=flat-square&color=blue" alt="npm downloads" /></a>
    <a href="https://github.com/jaibhedia/uwu-algo-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Source%20Available-orange?style=flat-square" alt="license" /></a>
    <a href="https://github.com/jaibhedia/uwu-algo-sdk"><img src="https://img.shields.io/github/stars/jaibhedia/uwu-algo-sdk?style=flat-square" alt="GitHub stars" /></a>
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-%3E%3D18-61dafb?style=flat-square&logo=react&logoColor=white" alt="React 18+" />
    <img src="https://img.shields.io/badge/Algorand-Testnet-000?style=flat-square&logo=algorand&logoColor=white" alt="Algorand" />
  </p>
</p>

---

A drop-in modal that turns a fiat UPI transfer into a cryptographically verifiable, on-chain proof in under 30 seconds. Think **Stripe Checkout**, but the receipt lives on a blockchain.

## ✨ Features

- **One-hook integration** — `useUwUCheckout()` is all you need
- **Full-stack verification** — Setu Account Aggregator confirms the real bank transaction
- **On-chain attestation** — immutable proof written to Algorand
- **Mock mode** — develop and test without Setu credentials
- **Fully typed** — first-class TypeScript support with exported types
- **Zero config UI** — styled modal with payment info, QR code, and status screens

## 📦 Installation

```sh
npm install @uwu-protocol/checkout
```

**Peer dependencies:**

```sh
npm install react@^18 react-dom@^18 algosdk@^3
```

## 🚀 Quick Start

```tsx
import { useUwUCheckout } from "@uwu-protocol/checkout";

export default function CheckoutButton() {
  const { openCheckout, modal } = useUwUCheckout({
    oracleApiUrl: process.env.NEXT_PUBLIC_ORACLE_API_URL!,
    registryAppId: 762669103,
    merchantVpa: "merchant@bank",
    merchantName: "Acme Co",
    mockMode: process.env.NEXT_PUBLIC_VERIFICATION_MODE !== "setu",
  });

  const handlePay = async () => {
    const result = await openCheckout({
      amount: 1000,
      userWallet: "BUYER_ALGO_ADDRESS_58_CHARS",
      targetCalldata: new Uint8Array([1, 2, 3, 4]),
    });

    if (result.success) {
      console.log("Attestation TX:", result.txId);
    }
  };

  return (
    <>
      <button onClick={handlePay}>Pay ₹1,000</button>
      {modal}
    </>
  );
}
```

> [!NOTE]
> **Next.js App Router** — Since this hook uses React state, add `"use client"` at the top of your component file when using the Next.js App Router.

> [!TIP]
> `openCheckout` returns `Promise<CheckoutResult>`. On success, `txId` is the on-chain attestation transaction on Algorand testnet — viewable on [Lora Explorer](https://lora.algokit.io/testnet).

## 🔄 How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌──────────────┐
│  Your App    │────▶│  Payment Info    │────▶│  Setu Consent  │────▶│  On-Chain     │
│  calls       │     │  Screen          │     │  OTP + Bank    │     │  Attestation  │
│  openCheckout│     │  (QR / VPA)      │     │  Selection     │     │  on Algorand  │
└──────────────┘     └──────────────────┘     └────────────────┘     └──────────────┘
```

| Step | What happens |
|------|-------------|
| **1. Payment info** | Modal displays amount, reference ID, and merchant UPI VPA |
| **2. Setu consent** | Embedded iframe for phone + OTP + bank account selection (auto-simulated in `mockMode`) |
| **3. FI fetch + attest** | Matched bank transaction is pulled and the on-chain attestation fires automatically |
| **4. Success** | Promise resolves with `txId` + explorer link |

## 📖 API Reference

### `useUwUCheckout(config)`

The primary integration hook. Returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `openCheckout` | `(payload: CheckoutPayload) => Promise<CheckoutResult>` | Opens the modal and initiates the checkout flow |
| `modal` | `React.ReactNode` | The modal element — render this in your JSX tree |

### `UwUSDKConfig`

```ts
interface UwUSDKConfig {
  oracleApiUrl: string;    // URL of your uwu-algo-oraclesigner deployment
  registryAppId: number;   // Algorand testnet app ID (currently 762669103)
  merchantVpa: string;     // UPI VPA the buyer pays to
  merchantName: string;    // Displayed in the modal header
  mockMode?: boolean;      // Skip real Setu verification (default: false)
  algodServer?: string;    // Custom Algod node (default: Algonode testnet)
  algodToken?: string;     // Algod auth token (default: "")
  algodPort?: string;      // Algod port (default: "")
}
```

### `CheckoutPayload`

```ts
interface CheckoutPayload {
  amount: number;              // Amount in INR (₹)
  userWallet: string;          // Buyer's Algorand address (58 chars)
  targetCalldata: Uint8Array;  // Arbitrary calldata attached to the attestation
}
```

### `CheckoutResult`

```ts
interface CheckoutResult {
  success: boolean;
  refId: string;      // Unique reference ID for this transaction
  txId?: string;      // Algorand transaction ID (on success)
  error?: string;     // Error message (on failure)
}
```

## ⚙️ Configuration Reference

| Field | Required | Default | Description |
|-------|:--------:|---------|-------------|
| `oracleApiUrl` | ✅ | — | URL of your [uwu-algo-oraclesigner](https://github.com/jaibhedia/uwu-algo-oraclesigner) deployment |
| `registryAppId` | ✅ | — | Algorand testnet app ID of `UwUPaymentRegistry` |
| `merchantVpa` | ✅ | — | UPI VPA that receives the payment |
| `merchantName` | ✅ | — | Human-readable name shown in the modal |
| `mockMode` | | `false` | Skips real Setu AA — useful for local development |
| `algodServer` | | Algonode testnet | Custom Algorand node URL |
| `algodToken` | | `""` | Authentication token for your Algod node |
| `algodPort` | | `""` | Port for your Algod node |

## 🏗️ Prerequisites

You need a running **[uwu-algo-oraclesigner](https://github.com/jaibhedia/uwu-algo-oraclesigner)** instance. This backend service:

- Holds your Setu Account Aggregator credentials
- Signs on-chain attestations on behalf of the oracle
- Exposes the API that this SDK calls internally

Point `oracleApiUrl` in your SDK config to the signer's URL.

## 🧪 Demo

A minimal P2P demo is included in [`examples/demo-p2p/`](./examples/demo-p2p):

```sh
git clone https://github.com/jaibhedia/uwu-algo-sdk
cd uwu-algo-sdk/examples/demo-p2p
cp .env.example .env.local   # configure your oracle URL
npm install
npm run dev
```

## 📄 License

**Source Available** — © 2026 UwU Protocol. You may use this software, but you may **not** modify, redistribute, or create derivative works. See [LICENSE](./LICENSE) for full terms.