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
const FALLBACK_ORACLE_ADDR = "6KG55V5QGWFMYKKMQWG4Q56KR6VR4MFE5LWTRWTPJE26CCWPH3CJS2PO3Q";

type CheckoutResult = { success: boolean; txId?: string; refId?: string; error?: string };
type CompletedAt = { result: CheckoutResult; at: Date } | null;

function truncate(s: string, head = 6, tail = 4): string {
  if (!s || s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={onClick}
      className={`copy-btn${copied ? " copied" : ""}`}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
          <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
          <path d="M5.5 3.5V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export default function DemoP2P() {
  const { openCheckout, modal } = useUwUCheckout(CONFIG);
  const [completed, setCompleted] = useState<CompletedAt>(null);
  const [oracleAddr, setOracleAddr] = useState<string>(FALLBACK_ORACLE_ADDR);

  useEffect(() => {
    fetch(`${CONFIG.oracleApiUrl}/api/health`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.oracleAddress) setOracleAddr(d.oracleAddress);
      })
      .catch(() => {});
  }, []);

  const onPay = async () => {
    setCompleted(null);
    const r = await openCheckout({
      amount: OFFER.inrAmount,
      userWallet: DEMO_BUYER_WALLET,
      targetCalldata: new Uint8Array([1, 2, 3, 4]),
    });
    setCompleted({ result: r, at: new Date() });
  };

  const showError =
    completed && !completed.result.success && completed.result.error && completed.result.error !== "cancelled";
  const showSuccess = completed?.result.success;

  return (
    <main
      className="shell"
      style={{
        paddingTop: "max(112px, 13vh)",
        paddingBottom: 96,
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <Petals />

      <span className="pill" style={{ alignSelf: "flex-start" }}>
        <span className="pill-dot" />
        UwU SDK · Demo P2P
      </span>

      <h1
        className="h-display"
        style={{ marginTop: 28, maxWidth: 760, textWrap: "balance" }}
      >
        One offer. One button.{" "}
        <em>Real proof on Algorand.</em>
      </h1>

      <p className="body-lg" style={{ marginTop: 22, maxWidth: 680 }}>
        The minimum integration of <code>@uwu-protocol/checkout</code>. Pay{" "}
        {OFFER.sellerName} ₹{OFFER.inrAmount} for {OFFER.algoAmount} ALGO — the SDK
        runs the Setu Account Aggregator flow and anchors a proof on-chain.
      </p>

      <section className="how-it-works" style={{ marginTop: 56 }}>
        <div className="eyebrow">How it works · 3 steps</div>
        <ol>
          <li>
            <span className="step-num">01</span>
            <div>
              <h3>Pay seller via UPI</h3>
              <p>
                Standard <code>upi://pay</code> intent — money goes directly to the seller's bank account.
                uWu never touches fiat, never holds funds, never asks for a payment licence.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">02</span>
            <div>
              <h3>Setu Account Aggregator verifies the credit</h3>
              <p>
                Buyer approves a one-time consent on Setu's RBI-licensed AA portal. The oracle reads
                the buyer's bank statement and matches the credit by amount + UTR.
              </p>
            </div>
          </li>
          <li>
            <span className="step-num">03</span>
            <div>
              <h3>Oracle anchors proof on Algorand</h3>
              <p>
                An Ed25519-signed attestation is submitted to <code>UwUPaymentRegistry</code> (app{" "}
                <code>762669103</code>) as a 40-byte box write. Any escrow contract can verify it and release funds.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section
        className="card"
        style={{ marginTop: 56, width: "100%", maxWidth: 560, padding: 28 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 24,
          }}
        >
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
            <div className="body-sm" style={{ marginTop: 2 }}>for ₹{OFFER.inrAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <button
          onClick={onPay}
          className="btn btn-primary"
          style={{ width: "100%", height: 48, fontSize: 14.5 }}
        >
          Pay ₹{OFFER.inrAmount.toLocaleString("en-IN")} &amp; Match
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {showSuccess && completed && (
        <section
          className="card"
          style={{
            marginTop: 22,
            width: "100%",
            maxWidth: 560,
            padding: 26,
            background: "rgba(95, 184, 154, 0.07)",
            borderColor: "rgba(95, 184, 154, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span
              style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(95, 184, 154, 0.18)",
                border: "1.5px solid rgba(95, 184, 154, 0.5)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <path d="M3 6.5l2.4 2.4L10 4.3" stroke="var(--green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)" }}>
              Payment attested on Algorand
            </div>
          </div>

          <div>
            <div className="receipt-row">
              <span className="label">Amount</span>
              <span className="value">
                ₹{OFFER.inrAmount.toLocaleString("en-IN")} → {OFFER.algoAmount} ALGO
              </span>
            </div>
            <div className="receipt-row">
              <span className="label">Timestamp</span>
              <span className="value">
                {completed.at.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
            {completed.result.refId && (
              <div className="receipt-row">
                <span className="label">Ref ID</span>
                <span className="value">
                  <span title={completed.result.refId}>{truncate(completed.result.refId, 8, 6)}</span>
                  <CopyButton value={completed.result.refId} />
                </span>
              </div>
            )}
            {completed.result.txId && (
              <div className="receipt-row">
                <span className="label">Tx ID</span>
                <span className="value">
                  <span title={completed.result.txId}>{truncate(completed.result.txId, 8, 6)}</span>
                  <CopyButton value={completed.result.txId} />
                </span>
              </div>
            )}
            <div className="receipt-row">
              <span className="label">Registry</span>
              <span className="value">
                <a
                  href={`https://lora.algokit.io/testnet/application/${CONFIG.registryAppId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--fg)", textDecoration: "underline" }}
                >
                  app {CONFIG.registryAppId}
                </a>
              </span>
            </div>
            <div className="receipt-row">
              <span className="label">Oracle</span>
              <span className="value">
                <span title={oracleAddr}>{truncate(oracleAddr, 6, 4)}</span>
                <CopyButton value={oracleAddr} />
              </span>
            </div>
          </div>

          {completed.result.txId && (
            <a
              href={`https://lora.algokit.io/testnet/transaction/${completed.result.txId}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 22, height: 44, fontSize: 13.5 }}
            >
              View transaction on Algorand
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 10L10 2M5 2h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
          }}
        >
          <div className="eyebrow" style={{ color: "#c44545", marginBottom: 8 }}>Attestation failed</div>
          {completed?.result.refId && (
            <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginBottom: 6, wordBreak: "break-all" }}>
              ref: {completed.result.refId}
            </div>
          )}
          <div className="mono" style={{ fontSize: 12.5, color: "#a23", wordBreak: "break-word" }}>
            {completed?.result.error}
          </div>
        </section>
      )}

      <footer
        style={{
          marginTop: 96,
          paddingTop: 24,
          width: "100%",
          borderTop: "1px solid var(--hair)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <span className="body-sm">
          Powered by{" "}
          <a
            href="https://github.com/jaibhedia/uwu-algo-sdk"
            style={{ color: "var(--fg-2)", textDecoration: "underline" }}
          >
            @uwu-protocol/checkout
          </a>
        </span>
        {CONFIG.mockMode && (
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.1em",
              color: "#f59e0b",
              padding: "3px 8px",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: 4,
              textTransform: "uppercase",
            }}
          >
            mock mode
          </span>
        )}
      </footer>

      {modal}
    </main>
  );
}
