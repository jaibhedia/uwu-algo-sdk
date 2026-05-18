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
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
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

function FlowDiagram() {
  const steps = [
    {
      label: "UPI",
      title: "Pay seller via UPI",
      hint: "Money goes direct to bank. uWu never touches fiat.",
      tone: "#c2530a",
    },
    {
      label: "Setu AA",
      title: "Verify the credit",
      hint: "RBI-licensed consent → oracle matches by amount + UTR.",
      tone: "#6d4ed9",
    },
    {
      label: "Algorand",
      title: "Anchor proof on-chain",
      hint: "Ed25519 attestation → UwUPaymentRegistry app 762669103.",
      tone: "#3a9d7a",
    },
  ];
  return (
    <div className="flow-card">
      <div className="flow-head">
        <div className="eyebrow">Trade flow</div>
        <div className="flow-status">
          <span className="flow-status-dot" />
          <span className="mono" style={{ fontSize: 10.5 }}>READY</span>
        </div>
      </div>
      <ol className="flow-lanes">
        {steps.map((s, i) => (
          <li key={i} className="flow-lane">
            <span className="flow-node" style={{ background: s.tone, boxShadow: `0 0 0 4px ${s.tone}22` }}>
              <span className="flow-num">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <div className="flow-body">
              <div className="flow-label" style={{ color: s.tone }}>{s.label}</div>
              <div className="flow-title">{s.title}</div>
              <div className="flow-hint">{s.hint}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flow-foot">
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.1em" }}>
          ⌬ algorand testnet · app 762669103
        </span>
      </div>
    </div>
  );
}

function ReceiptCard({ completed, oracleAddr }: { completed: NonNullable<CompletedAt>; oracleAddr: string }) {
  const { result, at } = completed;
  return (
    <div className="flow-card" style={{ borderColor: "rgba(95,184,154,0.4)", background: "rgba(95,184,154,0.06)" }}>
      <div className="flow-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(95,184,154,0.18)", border: "1.5px solid rgba(95,184,154,0.5)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M3 6.5l2.4 2.4L10 4.3" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>Payment attested</div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="receipt-row">
          <span className="label">Amount</span>
          <span className="value">₹{OFFER.inrAmount.toLocaleString("en-IN")} → {OFFER.algoAmount} ALGO</span>
        </div>
        <div className="receipt-row">
          <span className="label">Time</span>
          <span className="value">{at.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
        {result.refId && (
          <div className="receipt-row">
            <span className="label">Ref</span>
            <span className="value">
              <span title={result.refId}>{truncate(result.refId, 6, 4)}</span>
              <CopyButton value={result.refId} />
            </span>
          </div>
        )}
        {result.txId && (
          <div className="receipt-row">
            <span className="label">Tx</span>
            <span className="value">
              <span title={result.txId}>{truncate(result.txId, 6, 4)}</span>
              <CopyButton value={result.txId} />
            </span>
          </div>
        )}
        <div className="receipt-row">
          <span className="label">Oracle</span>
          <span className="value">
            <span title={oracleAddr}>{truncate(oracleAddr, 5, 4)}</span>
            <CopyButton value={oracleAddr} />
          </span>
        </div>
      </div>
      {result.txId && (
        <a
          href={`https://lora.algokit.io/testnet/transaction/${result.txId}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 18, height: 40, fontSize: 13 }}
        >
          View on Algorand
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 10L10 2M5 2h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </div>
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

  const showError = completed && !completed.result.success && completed.result.error && completed.result.error !== "cancelled";
  const showSuccess = !!completed?.result.success;

  return (
    <section className="hero-section">
      <Petals />
      <div className="shell hero-grid">
        {/* LEFT: copy + offer card */}
        <div className="hero-left">
          <span className="pill" style={{ alignSelf: "flex-start" }}>
            <span className="pill-dot" />
            UwU SDK · Demo P2P
          </span>

          <h1 className="h-display" style={{ marginTop: 24, textWrap: "balance" }}>
            One offer. One button.{" "}
            <em>Real proof on Algorand.</em>
          </h1>

          <p className="body-lg" style={{ marginTop: 18, color: "var(--fg-2)", maxWidth: 540 }}>
            The minimum integration of <code>@uwu-protocol/checkout</code>. Click pay, complete
            the Setu AA flow, get a signed on-chain receipt.
          </p>

          <div className="offer-card">
            <div className="offer-row">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Seller</div>
                <div style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-0.01em" }}>{OFFER.sellerName}</div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 1 }}>{OFFER.sellerVpa}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="eyebrow" style={{ marginBottom: 4, justifyContent: "flex-end" }}>Offering</div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{OFFER.algoAmount} ALGO</div>
                <div className="body-sm" style={{ marginTop: 1 }}>for ₹{OFFER.inrAmount.toLocaleString("en-IN")}</div>
              </div>
            </div>

            <button onClick={onPay} className="btn btn-primary" style={{ width: "100%", marginTop: 18, height: 46, fontSize: 14 }}>
              Pay ₹{OFFER.inrAmount.toLocaleString("en-IN")} &amp; Match
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {showError && (
            <div className="error-strip">
              <span className="mono" style={{ color: "#c44545", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Failed</span>
              <span className="mono" style={{ fontSize: 12, color: "#a23", wordBreak: "break-word" }}>{completed?.result.error}</span>
            </div>
          )}
        </div>

        {/* RIGHT: flow viz OR receipt */}
        <div className="hero-right">
          {showSuccess && completed ? (
            <ReceiptCard completed={completed} oracleAddr={oracleAddr} />
          ) : (
            <FlowDiagram />
          )}
        </div>
      </div>

      {/* Floor strip — minimal */}
      <div className="hero-floor shell">
        <span className="body-sm">
          Powered by{" "}
          <a href="https://github.com/jaibhedia/uwu-algo-sdk" style={{ color: "var(--fg-2)", textDecoration: "underline" }}>
            @uwu-protocol/checkout
          </a>
        </span>
        {CONFIG.mockMode && (
          <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "#f59e0b", padding: "2px 7px", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 4, textTransform: "uppercase" }}>
            mock mode
          </span>
        )}
      </div>

      {modal}
    </section>
  );
}
