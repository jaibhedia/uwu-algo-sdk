"use client";
import { useUwUCheckout } from "@uwu-protocol/checkout";
import { useEffect, useState } from "react";
import { Petals } from "../components/Petals";

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

type CheckoutResult = { success: boolean; txId?: string; refId?: string; error?: string };

export default function DemoP2P() {
  const { openCheckout, modal } = useUwUCheckout(CONFIG);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    fetch(`${CONFIG.oracleApiUrl}/api/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  const onPay = async () => {
    setResult(null);
    const r = await openCheckout({
      amount: OFFER.inrAmount,
      userWallet: DEMO_BUYER_WALLET,
      targetCalldata: new Uint8Array([1, 2, 3, 4]),
    });
    setResult(r);
  };

  const showError = result && !result.success && result.error && result.error !== "cancelled";

  return (
    <main className="shell" style={{ paddingTop: "max(112px, 13vh)", paddingBottom: 96, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <Petals />

      <span className="pill">
        <span className="pill-dot" />
        UwU SDK · Demo P2P
      </span>

      <h1 className="h-display" style={{ marginTop: 28, maxWidth: 900 }}>
        One offer. One button.{" "}
        <em>Real proof on Algorand.</em>
      </h1>

      <p className="body-lg" style={{ marginTop: 22, maxWidth: 600 }}>
        The minimum integration of <code>@uwu-protocol/checkout</code>. Pay{" "}
        {OFFER.sellerName} ₹{OFFER.inrAmount} for {OFFER.algoAmount} ALGO — the SDK
        runs the Setu Account Aggregator flow and anchors a proof on-chain.
      </p>

      <section className="card" style={{ marginTop: 44, width: "100%", maxWidth: 560, padding: 28, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Seller</div>
            <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>
              {OFFER.sellerName}
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {OFFER.sellerVpa}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow" style={{ marginBottom: 6, justifyContent: "flex-end" }}>Offering</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {OFFER.algoAmount} ALGO
            </div>
            <div className="body-sm" style={{ marginTop: 2 }}>for ₹{OFFER.inrAmount}</div>
          </div>
        </div>

        <button
          onClick={onPay}
          className="btn btn-primary"
          style={{ width: "100%", height: 48, fontSize: 14.5 }}
        >
          Pay ₹{OFFER.inrAmount} &amp; Match
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {result?.success && (
        <section
          className="card"
          style={{
            marginTop: 22,
            width: "100%",
            maxWidth: 560,
            padding: 22,
            background: "rgba(95, 184, 154, 0.10)",
            borderColor: "rgba(95, 184, 154, 0.35)",
            textAlign: "left",
          }}
        >
          <div className="eyebrow" style={{ color: "var(--green)", marginBottom: 8 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--green)" strokeOpacity="0.5" />
              <path d="M4 6.5l1.8 1.8 3-3" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Payment attested
          </div>
          {result.refId && (
            <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginBottom: 6, wordBreak: "break-all" }}>
              ref: {result.refId}
            </div>
          )}
          {result.txId && (
            <a
              href={`https://lora.algokit.io/testnet/transaction/${result.txId}`}
              target="_blank"
              rel="noreferrer"
              className="mono"
              style={{ fontSize: 12.5, color: "var(--blue)", textDecoration: "underline", wordBreak: "break-all", display: "inline-block" }}
            >
              View on Algorand →
            </a>
          )}
        </section>
      )}

      {showError && (
        <section
          className="card"
          style={{
            marginTop: 22,
            width: "100%",
            maxWidth: 560,
            padding: 22,
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.30)",
            textAlign: "left",
          }}
        >
          <div className="eyebrow" style={{ color: "#c44545", marginBottom: 8 }}>Attestation failed</div>
          {result?.refId && (
            <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginBottom: 6, wordBreak: "break-all" }}>
              ref: {result.refId}
            </div>
          )}
          <div className="mono" style={{ fontSize: 12.5, color: "#a23", wordBreak: "break-word" }}>
            {result?.error}
          </div>
        </section>
      )}

      <footer style={{ marginTop: 96, paddingTop: 24, width: "100%", borderTop: "1px solid var(--hair)", display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 16, textAlign: "center" }}>
        <span className="body-sm">
          Powered by{" "}
          <a href="https://github.com/jaibhedia/uwu-algo-sdk" style={{ color: "var(--fg-2)", textDecoration: "underline" }}>
            @uwu-protocol/checkout
          </a>
        </span>
        {CONFIG.mockMode && (
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "#f59e0b", padding: "3px 8px", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: 4, textTransform: "uppercase" }}>
            mock mode
          </span>
        )}
      </footer>

      {modal}
    </main>
  );
}
