import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  speedLimit: text("speed_limit").notNull(),
  price: integer("price").notNull(),
  durationHours: integer("duration_hours").notNull(),
  description: text("description").notNull(),
});

export const vouchers = pgTable("vouchers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  packageId: text("package_id").notNull(),
  packageName: text("package_name").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull(), // "Available", "Sold"
  createdAt: text("created_at").notNull(),
  soldTo: text("sold_to"),
  activatedAt: text("activated_at"),
  expiresAt: text("expires_at"),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password"),
  phone: text("phone").notNull(),
  saldo: integer("saldo").notNull().default(0),
  status: text("status").notNull().default("Active"), // "Active", "Inactive"
  joinedDate: text("joined_date").notNull(),
  registeredVia: text("registered_via").notNull(), // "WebPortal", "Admin"
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  type: text("type").notNull(), // "Topup"
  amount: integer("amount").notNull(),
  uniqueCode: integer("unique_code").notNull(),
  totalPayment: integer("total_payment").notNull(),
  status: text("status").notNull(), // "Pending", "Paid", "Failed"
  qrisPayload: text("qris_payload").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
});

export const botsConfig = pgTable("bots_config", {
  provider: text("provider").primaryKey(), // "WhatsApp", "Telegram"
  apiKey: text("api_key").notNull(),
  botUsername: text("bot_username"),
  status: text("status").notNull(), // "Connected", "Disconnected"
  welcomeMessage: text("welcome_message").notNull(),
  autoRepliesEnabled: boolean("auto_replies_enabled").notNull().default(true),
});

export const chatLogs = pgTable("chat_logs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // "WhatsApp", "Telegram"
  senderPhoneOrUser: text("sender_phone_or_user").notNull(),
  senderName: text("sender_name").notNull(),
  messageText: text("message_text").notNull(),
  replyText: text("reply_text"),
  timestamp: text("timestamp").notNull(),
  isIncoming: boolean("is_incoming").notNull(),
});

export const mikrotikConfig = pgTable("mikrotik_config", {
  id: text("id").primaryKey(), // "default"
  ip: text("ip").notNull(),
  username: text("username").notNull(),
  port: integer("port").notNull(),
  isConnected: boolean("is_connected").notNull().default(false),
  activeHotspotUsersCount: integer("active_hotspot_users_count").notNull().default(0),
  detectedProfiles: jsonb("detected_profiles").notNull(), // array of strings
});

export const sanpayConfig = pgTable("sanpay_config", {
  id: text("id").primaryKey(), // "config"
  apiKey: text("api_key").notNull(),
  merchantId: text("merchant_id").notNull(),
  secretKey: text("secret_key").notNull(),
  mode: text("mode").notNull(), // "Simulation", "Production"
  enabled: boolean("enabled").notNull().default(true),
});

export const displayConfig = pgTable("display_config", {
  id: text("id").primaryKey(), // "config"
  runningText: text("running_text").notNull(),
  adsImages: jsonb("ads_images").notNull(), // array of strings
});
