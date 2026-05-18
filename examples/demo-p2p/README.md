# uwu-sdk-demo-p2p

Minimal P2P-style demo of [`@uwu-protocol/checkout`](https://www.npmjs.com/package/@uwu-protocol/checkout). One offer, one button, real attestation on Algorand testnet.

## Run

```sh
cp .env.example .env.local       # edit NEXT_PUBLIC_ORACLE_API_URL
npm install
npm run dev
# open http://localhost:3000
```

## What it does

1. Renders one mock seller offer ("100 ALGO for ₹1000")
2. Clicking "Pay & Match" opens the SDK modal
3. Modal runs the Setu AA consent flow (mock by default — flip `NEXT_PUBLIC_VERIFICATION_MODE=setu` for real)
4. Oracle submits an `mock_attest_payment` transaction to UwUPaymentRegistry on Algorand
5. Demo shows the success state with a Lora explorer link

All of the SDK integration is in [`app/page.tsx`](./app/page.tsx) — about 100 lines.
