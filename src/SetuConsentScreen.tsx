"use client";
import { useState, useEffect, useRef } from "react";
import type { ModalSharedProps, SetuTransaction } from "./types";

interface Props extends ModalSharedProps {
  onApprove: (consentId: string, transaction: SetuTransaction) => void;
}

type Phase = "phone_entry" | "creating_consent" | "waiting_consent" | "fi_fetch";

function Spinner() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: "setuSpin 0.9s linear infinite" }}>
      <circle cx="14" cy="14" r="11" stroke="rgba(139,122,240,0.18)" strokeWidth="2.5" />
      <path d="M14 3 A11 11 0 0 1 25 14" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" />
      <style>{`@keyframes setuSpin { to { transform: rotate(360deg); transform-origin: 14px 14px; } }`}</style>
    </svg>
  );
}

export function SetuConsentScreen({ config, payload, refId, onApprove, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("phone_entry");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const consentRef = useRef({ id: "", url: null as string | null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "creating_consent") runCreateConsent();
    else if (phase === "waiting_consent") runWaitConsent();
    else if (phase === "fi_fetch") runFetchFI();
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [phase]);

  async function runCreateConsent() {
    // In mock mode, skip the oracle entirely — generate consent locally so no
    // real Setu call is made. The mock-prefixed ID is routed to mock adapter
    // in the oracle's fi-data endpoint.
    if (config.mockMode) {
      consentRef.current = { id: `mock-${Date.now()}`, url: null };
      if (mountedRef.current) setPhase("waiting_consent");
      return;
    }
    try {
      const resp = await fetch(`${config.oracleApiUrl}/api/verification/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeId: refId,
          inrAmountPaisa: payload.amount * 100,
          payerId: payload.userWallet,
          payeeId: config.merchantVpa,
          phoneNumber: phone,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text().catch(() => resp.statusText));
      const { consentId, consentUrl } = await resp.json();
      if (!mountedRef.current) return;
      consentRef.current = { id: consentId, url: consentUrl || null };
      setPhase("waiting_consent");
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
    }
  }

  function runWaitConsent() {
    const { id: cid, url: curl } = consentRef.current;
    if (config.mockMode) {
      timerRef.current = setTimeout(() => { if (mountedRef.current) setPhase("fi_fetch"); }, 2000);
      return;
    }
    // Don't auto-open — browsers block popups not triggered by a direct user click.
    // The UI shows an "Open Setu →" button instead.
    pollRef.current = setInterval(async () => {
      try {
        const resp = await fetch(`${config.oracleApiUrl}/api/verification/status?consentId=${encodeURIComponent(cid)}`);
        if (!resp.ok || !mountedRef.current) return;
        const { status } = await resp.json();
        if (status === "VERIFIED" && mountedRef.current) {
          clearInterval(pollRef.current!); pollRef.current = null;
          setPhase("fi_fetch");
        } else if (status === "FAILED" && mountedRef.current) {
          clearInterval(pollRef.current!); pollRef.current = null;
          setError("Setu consent was rejected or expired. Please try again.");
        }
      } catch (_) {}
    }, 2000);
  }

  async function runFetchFI() {
    const { id: cid } = consentRef.current;
    if (config.mockMode) {
      await new Promise((r) => setTimeout(r, 800));
      if (!mountedRef.current) return;
      const mockTx: SetuTransaction = {
        amount: payload.amount,
        date: new Date().toISOString(),
        utr: "MK" + Date.now().toString().slice(-10),
        narration: "UPI/P2M/" + refId.replace(/^0x/i, "").slice(0, 8).toUpperCase(),
        bankAccount: "Mock Bank XXXX 4242",
      };
      onApprove(cid, mockTx);
      return;
    }
    try {
      const resp = await fetch(`${config.oracleApiUrl}/api/verification/fi-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId: cid, tradeId: refId, inrAmountPaisa: payload.amount * 100 }),
      });
      if (!resp.ok) throw new Error(await resp.text().catch(() => resp.statusText));
      const { transaction } = await resp.json();
      if (!mountedRef.current) return;
      onApprove(cid, transaction);
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "12px 14px", fontFamily: "var(--font-mono)", wordBreak: "break-word" }}>
          {error}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} className="btn btn-ghost" style={{ flex: 1, height: 40, fontSize: 13, borderRadius: 10 }}>Cancel</button>
          <button onClick={() => { setError(null); setPhase("phone_entry"); }} className="btn btn-primary" style={{ flex: 1, height: 40, fontSize: 13, borderRadius: 10 }}>Try Again</button>
        </div>
      </div>
    );
  }

  if (phase === "phone_entry") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--fg-4)", textTransform: "uppercase", marginBottom: 6 }}>
            Step 2 of 3 · Verify Payment
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.02em" }}>Verify Your Payment</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>
            Enter the mobile number linked to your bank account
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #6C63FF, #3ECFBA)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>Setu Account Aggregator</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>RBI licensed AA · read-only bank access</div>
          </div>
          {config.mockMode && (
            <div style={{ marginLeft: "auto", fontSize: 10, letterSpacing: "0.08em", color: "#f59e0b", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 4, padding: "2px 7px", fontFamily: "var(--font-mono)" }}>
              MOCK
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", color: "var(--fg-4)", textTransform: "uppercase" }}>
            Mobile Number
          </label>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--hair)", borderRadius: 8, overflow: "hidden", background: "var(--bg-2)" }}>
            <span style={{ padding: "10px 12px", fontSize: 14, color: "var(--fg-3)", fontFamily: "var(--font-mono)", background: "var(--bg-3)", borderRight: "1px solid var(--hair)", flexShrink: 0 }}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9999999999"
              style={{ flex: 1, border: "none", background: "transparent", padding: "10px 12px", fontSize: 14, color: "var(--fg)", fontFamily: "var(--font-mono)", outline: "none", letterSpacing: "0.06em" }}
            />
          </div>
          {config.mockMode && (
            <div style={{ fontSize: 11, color: "var(--fg-4)", fontStyle: "italic" }}>MOCK — any 10-digit number works</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setPhase("creating_consent")}
            disabled={phone.length !== 10}
            className="btn btn-primary"
            style={{ width: "100%", height: 44, fontSize: 14, borderRadius: 10, opacity: phone.length === 10 ? 1 : 0.45, cursor: phone.length === 10 ? "pointer" : "not-allowed" }}
          >
            Continue
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={onCancel} style={{ width: "100%", height: 36, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--fg-4)", borderRadius: 8 }}>Cancel</button>
        </div>
      </div>
    );
  }

  if (phase === "creating_consent") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 0" }}>
        <Spinner />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>Creating consent request…</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Connecting to Setu AA Node</div>
        </div>
      </div>
    );
  }

  if (phase === "waiting_consent") {
    if (config.mockMode) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0" }}>
          <Spinner />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>Simulating Setu AA verification…</div>
            <div style={{ fontSize: 12, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>MOCK MODE · auto-advancing</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Setu", "RBI AA", "DEPA"].map((label) => (
              <span key={label} style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "var(--fg-4)", background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 4, padding: "2px 6px" }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      );
    }
    const consentUrl = consentRef.current.url;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--fg-4)", textTransform: "uppercase", marginBottom: 4 }}>
            Step 2 of 3 · Setu Account Aggregator
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em" }}>Verify your bank account</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Complete OTP and account selection below. We'll detect when you're done.</div>
        </div>
        {consentUrl ? (
          <div style={{ position: "relative", border: "1px solid var(--hair)", borderRadius: 10, overflow: "hidden", background: "var(--bg-2)", height: 520 }}>
            <iframe
              src={consentUrl}
              title="Setu AA Consent"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              allow="clipboard-read; clipboard-write"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
        ) : (
          <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Spinner />
            <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Loading Setu verification…</div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 11, color: "var(--fg-4)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)", animation: "setuSpin 1.4s ease-in-out infinite" }} />
            Polling for approval…
          </span>
          {consentUrl && (
            <a href={consentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-3)", textDecoration: "underline" }}>
              Open in new tab
            </a>
          )}
        </div>
        <button onClick={onCancel} style={{ width: "100%", height: 32, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--fg-4)" }}>Cancel</button>
      </div>
    );
  }

  if (phase === "fi_fetch") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 0" }}>
        <Spinner />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>Verifying transaction & recording on-chain…</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Matching your bank transaction and anchoring proof on Algorand</div>
        </div>
      </div>
    );
  }

  return null;
}
