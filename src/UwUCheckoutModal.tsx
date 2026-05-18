"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CheckoutState, UwUSDKConfig, CheckoutPayload, CheckoutResult, SetuTransaction } from "./types";
import { sha256Bytes, generateRefId, formatRefId } from "./utils";
import { PaymentInfoScreen } from "./PaymentInfoScreen";
import { SetuConsentScreen } from "./SetuConsentScreen";
import { SubmittingScreen, SuccessView, FailureView } from "./SubmittingScreen";

interface Props {
  config: UwUSDKConfig;
  payload: CheckoutPayload;
  onDone: (result: CheckoutResult) => void;
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: n < current ? "var(--green)" : n === current ? "var(--blue)" : "var(--bg-3)",
            border: `1.5px solid ${n < current ? "var(--green)" : n === current ? "var(--blue)" : "var(--hair)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
            color: n <= current ? "white" : "var(--fg-4)",
            transition: "all 0.3s",
          }}>
            {n < current ? (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2.5 5.5l2 2 3.5-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : n}
          </div>
          {n < 3 && (
            <div style={{ width: 24, height: 1.5, background: n < current ? "var(--green)" : "var(--hair)", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function UwUCheckoutModal({ config, payload, onDone }: Props) {
  const [state, setState] = useState<CheckoutState>("IDLE");
  const [refId, setRefId] = useState("");
  const [formattedRefId, setFormattedRefId] = useState("");
  const [calldataHash, setCalldataHash] = useState<Uint8Array>(new Uint8Array(32));
  const [consentId, setConsentId] = useState("");
  const [setuTransaction, setSetuTransaction] = useState<SetuTransaction | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (state !== "IDLE") return;
    (async () => {
      const [hash, rawRef] = await Promise.all([
        sha256Bytes(payload.targetCalldata),
        generateRefId(payload.userWallet, payload.amount),
      ]);
      setCalldataHash(hash);
      setRefId(rawRef);
      setFormattedRefId(formatRefId(rawRef));
      setState("DISPLAY_PAYMENT_INFO");
    })();
  }, []);

  const handleCancel = () => onDone({ success: false, refId, error: "cancelled" });
  const handleVerify = () => setState("SETU_VERIFY");
  const handleVerifyDone = (cid: string, tx: SetuTransaction) => {
    setConsentId(cid);
    setSetuTransaction(tx);
    setState("ONCHAIN_SUBMITTING");
  };

  const handleSubmitDone = (res: CheckoutResult) => {
    setResult(res);
    setState(res.success ? "SUCCESS" : "FAILURE");
  };

  const sharedProps = { config, payload, refId, formattedRefId, calldataHash, consentId, setuTransaction, onCancel: handleCancel };

  const currentStep: 1 | 2 | 3 =
    state === "DISPLAY_PAYMENT_INFO" ? 1
    : state === "SETU_VERIFY" ? 2
    : 3;

  const showStepper = !["IDLE", "SUCCESS", "FAILURE"].includes(state);

  const content = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        background: "rgba(13,13,18,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.18s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{
          width: "100%", maxWidth: 440,
          background: "var(--bg)",
          border: "1px solid var(--hair)",
          borderRadius: 18,
          boxShadow: "0 32px 80px -20px rgba(13,13,18,0.5), 0 1px 0 rgba(255,255,255,0.7) inset",
          overflow: "hidden",
          animation: "slideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Nav bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid var(--hair)",
          background: "var(--bg-2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="modal-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#fab39a" />
                  <stop offset="0.5" stopColor="#b8a4f5" />
                  <stop offset="1" stopColor="#9fdcc0" />
                </linearGradient>
              </defs>
              <rect x="1.5" y="1.5" width="29" height="29" rx="7" stroke="url(#modal-grad)" strokeOpacity="0.6" strokeWidth="1.2" />
              <circle cx="9" cy="13" r="2.6" fill="url(#modal-grad)" />
              <circle cx="23" cy="13" r="2.6" fill="url(#modal-grad)" />
              <path d="M5.5 19 Q9 25 12.5 19 Q16 13 19.5 19 Q23 25 26.5 19" stroke="url(#modal-grad)" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em" }}>
              UwU Checkout
            </span>
            {config.mockMode && (
              <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--fg-4)", fontFamily: "var(--font-mono)", background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 4, padding: "1px 5px" }}>
                MOCK
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {showStepper && <StepIndicator current={currentStep} />}
            <button
              onClick={handleCancel}
              style={{ background: "none", border: "1px solid var(--hair)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 22px" }}>
          {state === "IDLE" && (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.9s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(139,122,240,0.2)" strokeWidth="2" />
                <path d="M12 2 A10 10 0 0 1 22 12" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); transform-origin: 12px 12px; } }`}</style>
              </svg>
            </div>
          )}

          {state === "DISPLAY_PAYMENT_INFO" && (
            <PaymentInfoScreen {...sharedProps} onVerify={handleVerify} />
          )}

          {state === "SETU_VERIFY" && (
            <SetuConsentScreen {...sharedProps} onApprove={handleVerifyDone} />
          )}

          {state === "ONCHAIN_SUBMITTING" && (
            <SubmittingScreen {...sharedProps} onDone={handleSubmitDone} />
          )}

          {state === "SUCCESS" && result && (
            <SuccessView
              refId={formattedRefId}
              txId={result.txId}
              onClose={() => onDone(result)}
            />
          )}

          {state === "FAILURE" && result && (
            <FailureView
              error={result.error}
              onRetry={() => { setResult(null); setState("ONCHAIN_SUBMITTING"); }}
              onClose={() => onDone(result)}
            />
          )}
        </div>

        {/* Footer trust strip */}
        <div style={{ borderTop: "1px solid var(--hair)", background: "var(--bg-3)", padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          {["Setu AA", "RBI Framework", "Algorand", "Ed25519"].map((label) => (
            <span key={label} style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
