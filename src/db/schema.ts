import { mysqlTable, varchar, text, int, boolean, timestamp, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const packages = mysqlTable("packages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  speedLimit: varchar("speed_limit", { length: 255 }).notNull(),
  price: int("price").notNull(),
  durationHours: int("duration_hours").notNull(),
  description: text("description").notNull(),
});

export const vouchers = mysqlTable("vouchers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  packageId: varchar("package_id", { length: 255 }).notNull(),
  packageName: varchar("package_name", { length: 255 }).notNull(),
  price: int("price").notNull(),
  status: varchar("status", { length: 255 }).notNull(), // "Available", "Sold"
  createdAt: varchar("created_at", { length: 255 }).notNull(),
  soldTo: varchar("sold_to", { length: 255 }),
  activatedAt: varchar("activated_at", { length: 255 }),
  expiresAt: varchar("expires_at", { length: 255 }),
});

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  phone: varchar("phone", { length: 255 }).notNull(),
  saldo: int("saldo").notNull().default(0),
  status: varchar("status", { length: 255 }).notNull().default("Active"), // "Active", "Inactive"
  joinedDate: varchar("joined_date", { length: 255 }).notNull(),
  registeredVia: varchar("registered_via", { length: 255 }).notNull(), // "WebPortal", "Admin"
});

export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(), // "Topup"
  amount: int("amount").notNull(),
  uniqueCode: int("unique_code").notNull(),
  totalPayment: int("total_payment").notNull(),
  status: varchar("status", { length: 255 }).notNull(), // "Pending", "Paid", "Failed"
  qrisPayload: text("qris_payload").notNull(),
  note: varchar("note", { length: 255 }),
  createdAt: varchar("created_at", { length: 255 }).notNull(),
  paidAt: varchar("paid_at", { length: 255 }),
});

export const botsConfig = mysqlTable("bots_config", {
  provider: varchar("provider", { length: 255 }).primaryKey(), // "WhatsApp", "Telegram"
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  botUsername: varchar("bot_username", { length: 255 }),
  status: varchar("status", { length: 255 }).notNull(), // "Connected", "Disconnected"
  welcomeMessage: text("welcome_message").notNull(),
  autoRepliesEnabled: boolean("auto_replies_enabled").notNull().default(true),
});

export const chatLogs = mysqlTable("chat_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  provider: varchar("provider", { length: 255 }).notNull(), // "WhatsApp", "Telegram"
  senderPhoneOrUser: varchar("sender_phone_or_user", { length: 255 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  messageText: text("message_text").notNull(),
  replyText: text("reply_text"),
  timestamp: varchar("timestamp", { length: 255 }).notNull(),
  isIncoming: boolean("is_incoming").notNull(),
});

export const mikrotikConfig = mysqlTable("mikrotik_config", {
  id: varchar("id", { length: 255 }).primaryKey(), // "default"
  ip: varchar("ip", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  port: int("port").notNull(),
  isConnected: boolean("is_connected").notNull().default(false),
  activeHotspotUsersCount: int("active_hotspot_users_count").notNull().default(0),
  detectedProfiles: json("detected_profiles").notNull(), // array of strings
});

export const sanpayConfig = mysqlTable("sanpay_config", {
  id: varchar("id", { length: 255 }).primaryKey(), // "config"
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  merchantId: varchar("merchant_id", { length: 255 }).notNull(),
  secretKey: varchar("secret_key", { length: 255 }).notNull(),
  mode: varchar("mode", { length: 255 }).notNull(), // "Simulation", "Production"
  enabled: boolean("enabled").notNull().default(true),
});

export const displayConfig = mysqlTable("display_config", {
  id: varchar("id", { length: 255 }).primaryKey(), // "config"
  runningText: text("running_text").notNull(),
  adsImages: json("ads_images").notNull(), // array of strings
});
