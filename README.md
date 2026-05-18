# @uwu-protocol/checkout

> Proof-of-payment checkout SDK for React. UPI payment → Setu Account Aggregator verification → on-chain attestation on Algorand.

A drop-in modal that turns a fiat UPI transfer into a cryptographically verifiable, on-chain proof in under 30 seconds. Think Stripe Checkout, but the receipt lives on a blockchain.

## Install

```sh
npm install @uwu-protocol/checkout
```

Peer deps: `react@^18`, `react-dom@^18`, `algosdk@^3`.

## Usage

```tsx
"use client";
import { useUwUCheckout } from "@uwu-protocol/checkout";

export default function CheckoutButton() {
  const { openCheckout, modal } = useUwUCheckout({
    oracleApiUrl: process.env.NEXT_PUBLIC_ORACLE_API_URL!,
    registryAppId: 762669103,
    merchantVpa: "merchant@bank",
    merchantName: "Acme Co",
    mockMode: process.env.NEXT_PUBLIC_VERIFICATION_MODE !== "setu",
  });

  return (
    <>
      <button onClick={() => openCheckout({
        amount: 1000,
        userWallet: "BUYER_ALGO_ADDRESS_58_CHARS",
        targetCalldata: new Uint8Array([1, 2, 3, 4]),
      }).then(r => console.log(r))}>
        Pay ₹1000
      </button>
      {modal}
    </>
  );
}
```

`openCheckout` returns `Promise<{ success, refId, txId?, error? }>`. On success, `txId` is the on-chain attestation transaction on Algorand testnet — viewable on [Lora](https://lora.algokit.io/testnet).

## Flow

1. **Payment info screen** — shows amount, ref ID, merchant VPA
2. **Setu consent** — embedded iframe for phone + OTP + bank account selection (or auto-simulated in `mockMode`)
3. **FI fetch + auto-attest** — pulls the matched bank transaction, immediately fires the on-chain attestation
4. **Success** — returns `txId` + link to the Algorand explorer

## Requirements

You need a running [uwu-algo-oraclesigner](https://github.com/jaibhedia/uwu-algo-oraclesigner) instance — it holds the Setu credentials and signs the on-chain attestation. Set `oracleApiUrl` in the SDK config to its URL.

## Demo

A minimal P2P-style demo lives in [`examples/demo-p2p/`](./examples/demo-p2p). Run it locally:

```sh
git clone https://github.com/jaibhedia/uwu-algo-sdk
cd uwu-algo-sdk/examples/demo-p2p
cp .env.example .env.local       # point at your oracle URL
npm install
npm run dev
```

## Config

| Field | Required | Notes |
|-------|----------|-------|
| `oracleApiUrl` | yes | URL of your uwu-algo-oraclesigner deployment |
| `registryAppId` | yes | Algorand testnet app ID of UwUPaymentRegistry (currently `762669103`) |
| `merchantVpa` | yes | UPI VPA the buyer pays |
| `merchantName` | yes | Displayed in modal header |
| `mockMode` | optional | `true` skips real Setu — useful for local dev |
| `algodServer` | optional | Defaults to public Algonode testnet |

## License

MIT
