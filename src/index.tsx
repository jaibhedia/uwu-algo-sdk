"use client";
import { useState, useRef } from "react";
import { UwUCheckoutModal } from "./UwUCheckoutModal";
import type { UwUSDKConfig, CheckoutPayload, CheckoutResult } from "./types";

export type { UwUSDKConfig, CheckoutPayload, CheckoutResult } from "./types";

/**
 * useUwUCheckout — the single integration hook.
 *
 * Usage:
 *   const { openCheckout, modal } = useUwUCheckout(config);
 *   // render {modal} somewhere in your JSX tree
 *   const result = await openCheckout({ amount: 1000, userWallet, targetCalldata });
 */
export function useUwUCheckout(config: UwUSDKConfig) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<CheckoutPayload | null>(null);
  const resolverRef = useRef<((r: CheckoutResult) => void) | null>(null);

  const openCheckout = (p: CheckoutPayload): Promise<CheckoutResult> =>
    new Promise((resolve) => {
      resolverRef.current = resolve;
      setPayload(p);
      setOpen(true);
    });

  const handleDone = (result: CheckoutResult) => {
    setOpen(false);
    setPayload(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  const modal =
    open && payload ? (
      <UwUCheckoutModal config={config} payload={payload} onDone={handleDone} />
    ) : null;

  return { openCheckout, modal };
}

export { UwUCheckoutModal };
