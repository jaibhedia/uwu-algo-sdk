"use client";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import type { ModalSharedProps } from "./types";
import { formatInr } from "./utils";

interface Props extends ModalSharedProps {
  onVerify: () => void;
}

function UpiQr({ vpa, merchantName, amount, refId }: { vpa: string; merchantName: string; amount: number; refId: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!refId) return;
    const upiStr = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(refId)}`;
    QRCode.toDataURL(upiStr, { width: 140, margin: 1, color: { dark: "#1a1a1a", light: "#ffffff" } })
      .then(setDataUrl)
      .catch(() => {});
  }, [vpa, merchantName, amount, refId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      {dataUrl ? (
        <img src={dataUrl} alt="UPI QR Code" width={140} height={140} style={{ borderRadius: 8, display: "block", background: "white" }} />
      ) : (
        <div style={{ width: 140, height: 140, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "qrSpin 0.9s linear infinite" }}>
            <circle cx="10" cy="10" r="8" stroke="rgba(139,122,240,0.18)" strokeWidth="2" />
            <path d="M10 2 A8 8 0 0 1 18 10" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
            <style>{`@keyframes qrSpin { to { transform: rotate(360deg); transform-origin: 10px 10px; } }`}</style>
          </svg>
        </div>
      )}
      <div style={{ fontSize: 9, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Scan to pay
      </div>
    </div>
  );
}

export function PaymentInfoScreen({ config, payload, formattedRefId, onVerify, onCancel }: Props) {
  const [copied, setCopied] = useState(false);

  const copyRefId = async () => {
    await navigator.clipboard.writeText(formattedRefId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortRef = formattedRefId.slice(0, 7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Step label */}
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--fg-4)", textTransform: "uppercase" }}>
        Step 1 of 3 · Payment
      </div>

      {/* Centered: amount → QR → UPI ID → ref chip */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* Amount */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em" }}>
            {formatInr(payload.amount)}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>
            to {config.merchantName}
          </div>
        </div>

        {/* QR */}
        <UpiQr
          vpa={config.merchantVpa}
          merchantName={config.merchantName}
          amount={payload.amount}
          refId={formattedRefId}
        />

        {/* UPI ID */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>UPI ID</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>{config.merchantVpa}</div>
        </div>

        {/* Compact ref chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-3)", border: "1px solid var(--hair)", borderRadius: 7, padding: "6px 10px" }}>
          <div style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Ref</div>
          <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-2)", letterSpacing: "0.04em" }}>{shortRef}…</code>
          <button
            onClick={copyRefId}
            style={{ background: "none", border: "1px solid var(--hair)", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontSize: 10, color: copied ? "var(--green)" : "var(--fg-3)", fontFamily: "var(--font-mono)", transition: "color 0.2s" }}
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={onVerify}
          className="btn btn-primary"
          style={{ width: "100%", height: 44, fontSize: 14, borderRadius: 10 }}
        >
          I&apos;ve Sent Payment
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          onClick={onCancel}
          style={{ width: "100%", height: 36, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--fg-4)", borderRadius: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
