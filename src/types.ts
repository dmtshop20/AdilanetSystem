export type VoucherStatus = "Available" | "Sold" | "Active" | "Expired";

export interface VoucherPackage {
  id: string;
  name: string;
  speedLimit: string;
  price: number;
  durationHours: number; // e.g. 2, 24, 168 (7 days), 720 (30 days)
  description: string;
}

export interface Voucher {
  id: string;
  code: string; // The Hotspot code (usually username = password)
  packageId: string;
  packageName: string;
  price: number;
  status: VoucherStatus;
  createdAt: string;
  soldTo?: string; // name or id of customer
  activatedAt?: string;
  expiresAt?: string;
  durationLeft?: string; // computed or display duration
}

export interface CustomerAccount {
  id: string;
  name: string;
  username: string; // Used for login in student/client portal
  password?: string; // Optional registered password for secure login
  phone: string;
  saldo: number; // Stored balance in Rupiah
  status: "Active" | "Suspended";
  joinedDate: string;
  registeredVia: "Admin" | "WebPortal";
}

export type TransactionType = "Topup" | "DirectBuy";
export type TransactionStatus = "Pending" | "Paid" | "Expired";

export interface QrisTransaction {
  id: string;
  transactionId: string; // QRISLY custom txn
  customerId?: string; // empty if guest
  customerName: string;
  type: TransactionType;
  amount: number; // base nominal
  uniqueCode: number; // 1 - 999 nominal unik to identify payment
  totalPayment: number; // amount + uniqueCode
  status: TransactionStatus;
  qrisPayload?: string; // EMVCo string computed
  qrisImageUrl?: string; // QR rendering or SVG
  note?: string; // purchased details, e.g. "Topup Saldo" or "Direct Voucher 2 Jam"
  createdAt: string;
  paidAt?: string;
}

export interface BotSetting {
  provider: "WhatsApp" | "Telegram";
  apiKey: string;
  botUsername?: string; // e.g. @RtrwWifiVoucherBot
  status: "Connected" | "Disconnected" | "Connecting";
  welcomeMessage: string;
  autoRepliesEnabled: boolean;
}

export interface ChatSimMessage {
  id: string;
  provider: "WhatsApp" | "Telegram";
  senderPhoneOrUser: string;
  senderName: string;
  messageText: string;
  replyText?: string;
  timestamp: string;
  isIncoming: boolean;
}

export interface MikrotikConfig {
  ip: string;
  username: string;
  password?: string;
  port: number;
  isConnected: boolean;
  activeHotspotUsersCount: number;
  detectedProfiles?: string[];
}

export interface QrislyConfig {
  apiKey: string;
  merchantId: string;
  mode: "Simulation" | "Production";
  autoCheckInterval: number;
  enabled: boolean;
}

export interface SanpayConfig {
  apiKey: string;
  merchantId: string;
  secretKey: string;
  mode: "Simulation" | "Production";
  enabled: boolean;
}

export interface AppDisplayConfig {
  runningText: string;
  adsImages: string[];
  adminPassword?: string;
}
