export type CheckoutState =
  | "IDLE"
  | "DISPLAY_PAYMENT_INFO"
  | "SETU_VERIFY"
  | "ONCHAIN_SUBMITTING"
  | "SUCCESS"
  | "FAILURE";

export interface UwUSDKConfig {
  algodServer: string;
  algodToken: string;
  algodPort: string;
  registryAppId: number;
  merchantVpa: string;
  merchantName: string;
  oracleApiUrl: string;
  mockMode?: boolean;
}

export interface CheckoutPayload {
  amount: number;
  userWallet: string;
  targetCalldata: Uint8Array;
}

export interface CheckoutResult {
  success: boolean;
  refId: string;
  txId?: string;
  error?: string;
}

export interface SetuTransaction {
  amount: number;
  date: string;
  utr: string;
  narration: string;
  bankAccount: string;
}

export interface ModalSharedProps {
  config: UwUSDKConfig;
  payload: CheckoutPayload;
  refId: string;
  formattedRefId: string;
  calldataHash: Uint8Array;
  consentId: string;
  setuTransaction: SetuTransaction | null;
  onCancel: () => void;
}
