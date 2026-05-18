"use client";
import { useUwUCheckout } from "@uwu-protocol/checkout";
import { useState } from "react";

const OFFER = {
  sellerVpa: "demo@bank",
  sellerName: "Demo Seller",
  inrAmount: 1000,
  algoAmount: 100,
};

const CONFIG = {
  algodServer: "https://testnet-api.algonode.cloud",
  algodToken: "",
  algodPort: "",
  registryAppId: 762669103,
  merchantVpa: OFFER.sellerVpa,
  merchantName: OFFER.sellerName,
  oracleApiUrl: process.env.NEXT_PUBLIC_ORACLE_API_URL || "http://localhost:3001",
  mockMode: (process.env.NEXT_PUBLIC_VERIFICATION_MODE || "mock").toLowerCase() !== "setu",
};

const DEMO_BUYER_WALLET = "DEMOBUYER000000000000000000000000000000000000000000000000";

export default function DemoP2P() {
  const { openCheckout, modal } = useUwUCheckout(CONFIG);
  const [result, setResult] = useState<{ success: boolean; txId?: string; refId?: string; error?: string } | null>(null);

  const onPay = async () => {
    setResult(null);
    const r = await openCheckout({
      amount: OFFER.inrAmount,
      userWallet: DEMO_BUYER_WALLET,
      targetCalldata: new Uint8Array([1, 2, 3, 4]),
    });
    setResult(r);
  };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a86c52", fontWeight: 600, marginBottom: 8 }}>
          uWu SDK Demo · P2P
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          One offer. One button. <br />
          Real proof on Algorand.
        </h1>
        <p style={{ color: "#666", marginTop: 16, lineHeight: 1.5 }}>
          This is the minimum integration of <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>@uwu-protocol/checkout</code>.
          Pay {OFFER.sellerName} ₹{OFFER.inrAmount} for {OFFER.algoAmount} ALGO. The SDK runs the Setu flow and anchors a proof on-chain.
        </p>
      </header>

      <div style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 12px 40px rgba(220,100,120,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>Seller</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{OFFER.sellerName}</div>
            <div style={{ fontSize: 12, color: "#999", fontFamily: "monospace" }}>{OFFER.sellerVpa}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>Offering</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{OFFER.algoAmount} ALGO</div>
            <div style={{ fontSize: 13, color: "#666" }}>for ₹{OFFER.inrAmount}</div>
          </div>
        </div>

        <button
          onClick={onPay}
          style={{
            width: "100%",
            height: 52,
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Pay ₹{OFFER.inrAmount} &amp; Match →
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 24,
          padding: 20,
          background: result.success ? "rgba(95,184,154,0.12)" : "rgba(239,68,68,0.10)",
          border: `1px solid ${result.success ? "rgba(95,184,154,0.4)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {result.success ? "✅ Payment attested" : "❌ Attestation failed"}
          </div>
          {result.refId && (
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#666", marginBottom: 4 }}>
              ref: {result.refId}
            </div>
          )}
          {result.txId && (
            <a
              href={`https://lora.algokit.io/testnet/transaction/${result.txId}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "#0066cc", textDecoration: "underline", wordBreak: "break-all" }}
            >
              View on Algorand → {result.txId}
            </a>
          )}
          {result.error && (
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#a23" }}>{result.error}</div>
          )}
        </div>
      )}

      <footer style={{ marginTop: 60, fontSize: 12, color: "#999", textAlign: "center" }}>
        Powered by <a href="https://github.com/jaibhedia/uwu-algo-sdk" style={{ color: "#666" }}>@uwu-protocol/checkout</a>
        {CONFIG.mockMode && <span style={{ marginLeft: 12, color: "#f59e0b", fontFamily: "monospace" }}>MOCK MODE</span>}
      </footer>

      {modal}
    </main>
  );
}
