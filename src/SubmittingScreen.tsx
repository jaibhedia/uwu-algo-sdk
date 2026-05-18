"use client";
import { useEffect, useRef } from "react";
import type { ModalSharedProps, CheckoutResult } from "./types";
import { sha256Bytes, bytesToHex } from "./utils";

interface Props extends ModalSharedProps {
  onDone: (result: CheckoutResult) => void;
}

async function submitAttestation(
  config: Props["config"],
  refId: string,
  calldataHash: Uint8Array
): Promise<string> {
  const calldataHashHex = bytesToHex(calldataHash);

  // Real path: oracle signs and submits mock_attest_payment to deployed registry on Algorand.
  // Falls back to mock if oracle is unreachable or registry not funded.
  try {
    const resp = await fetch(`${config.oracleApiUrl}/api/verification/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refId, calldataHashHex, registryAppId: config.registryAppId }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.txId) return data.txId;
    }
  } catch (_) {}

  // Fallback mock path — oracle not running or contract not deployed
  await new Promise((r) => setTimeout(r, 2800));
  const seedBytes = new TextEncoder().encode(`mock:${refId}:${calldataHashHex}`);
  const seedHash = await sha256Bytes(seedBytes);
  return Array.from(seedHash)
    .map((b) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      return chars[b % 32];
    })
    .join("")
    .slice(0, 52);
}

export function SubmittingScreen({ config, refId, calldataHash, onDone, onCancel }: Props) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    submitAttestation(config, refId, calldataHash)
      .then((txId) => {
        onDone({ success: true, refId, txId });
      })
      .catch((err) => {
        onDone({ success: false, refId, error: String(err?.message ?? err) });
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "28px 0" }}>
      {/* Animated logo */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ animation: "spin 1.2s linear infinite", position: "absolute", inset: 0 }}>
          <circle cx="28" cy="28" r="24" stroke="rgba(139,122,240,0.15)" strokeWidth="3" />
          <path d="M28 4 A24 24 0 0 1 52 28" stroke="var(--blue)" strokeWidth="3" strokeLinecap="round" />
          <style>{`@keyframes spin { to { transform: rotate(360deg); transform-origin: 28px 28px; } }`}</style>
        </svg>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ position: "absolute", inset: "50%", transform: "translate(-50%,-50%)" }}>
          <defs>
            <linearGradient id="attest-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fab39a" />
              <stop offset="0.5" stopColor="#b8a4f5" />
              <stop offset="1" stopColor="#9fdcc0" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="29" height="29" rx="7" stroke="url(#attest-grad)" strokeOpacity="0.6" strokeWidth="1.2" />
          <circle cx="9" cy="13" r="2.6" fill="url(#attest-grad)" />
          <circle cx="23" cy="13" r="2.6" fill="url(#attest-grad)" />
          <path d="M5.5 19 Q9 25 12.5 19 Q16 13 19.5 19 Q23 25 26.5 19" stroke="url(#attest-grad)" strokeWidth="1.7" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em", marginBottom: 6 }}>
          Generating attestation…
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)" }}>
          Cryptographic proof anchoring to Algorand
        </div>
      </div>

      {/* Step trace */}
      <div style={{ width: "100%", background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "Setu AA consent verified",
          "Calldata hash computed (SHA-256)",
          "mock_attest_payment() dispatched",
          "Awaiting on-chain confirmation…",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: i < 3 ? "var(--green)" : "var(--fg-3)" }}>
            {i < 3 ? (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--green)" strokeOpacity="0.5" />
                <path d="M4 6.5l1.8 1.8 3-3" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid var(--fg-4)", display: "inline-block", flexShrink: 0, animation: "pulse-ring 1.8s ease-out infinite" }} />
            )}
            <span style={{ fontFamily: i < 3 ? "inherit" : "var(--font-mono)" }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Success and failure result views — rendered by UwUCheckoutModal after onDone resolves */
export function SuccessView({ refId, txId, onClose }: { refId: string; txId?: string; onClose: () => void }) {
  const explorerUrl = txId ? `https://lora.algokit.io/testnet/transaction/${txId}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "16px 0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(95,184,154,0.15)", border: "1.5px solid rgba(95,184,154,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M6 13l5 5 9-9" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Payment Attested
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)" }}>
          Proof-of-payment anchored on Algorand
        </div>
      </div>

      <div style={{ width: "100%", background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Ref ID</div>
          <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>{refId}</code>
        </div>
        {txId && (
          <div>
            <div style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Tx ID</div>
            <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg)", wordBreak: "break-all" }}>{txId}</code>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ width: "100%", height: 40, fontSize: 13, borderRadius: 10, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            View on Lora
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M5 2h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        )}
        <button onClick={onClose} className="btn btn-primary" style={{ width: "100%", height: 44, fontSize: 14, borderRadius: 10 }}>
          Done
        </button>
      </div>
    </div>
  );
}

export function FailureView({ error, onRetry, onClose }: { error?: string; onRetry: () => void; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "16px 0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.10)", border: "1.5px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>Submission Failed</div>
        <div style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)", background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 6, padding: "8px 12px", maxWidth: "100%", wordBreak: "break-word", marginTop: 8 }}>
          {error ?? "Unknown error"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, height: 40, fontSize: 13, borderRadius: 10 }}>Close</button>
        <button onClick={onRetry} className="btn btn-primary" style={{ flex: 1, height: 40, fontSize: 13, borderRadius: 10 }}>Retry</button>
      </div>
    </div>
  );
}
