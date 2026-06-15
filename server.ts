import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { db as pgDb } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import { 
  VoucherPackage, 
  Voucher, 
  CustomerAccount, 
  QrisTransaction, 
  BotSetting, 
  ChatSimMessage, 
  MikrotikConfig,
  QrislyConfig,
  AppDisplayConfig
} from "./src/types";

// CRC16 Generator for EMVCo QRIS dynamic generation
function computeCRC16(data: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < data.length; c++) {
    const charCode = data.charCodeAt(c);
    crc ^= (charCode << 8);
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Generate real-style dynamic EMVCo QRIS string payload
function generateDynamicQrisPayload(amount: number, txId: string): string {
  // Static QRIS payload header & merchant identifier info
  const step1 = "00020101021226300012ID.CO.QRISLY.WWW0118936000020112345678520400005303360";
  
  // Tag 54 is transaction amount
  const amountStr = amount.toFixed(0);
  const tag54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // Country code & Merchant info
  const step2 = "5802ID5909WIFI_RAJA6007BANDUNG";
  
  // Tag 62 is Additional Data Field Template (includes Tx ID)
  const txTag = `05${txId.length.toString().padStart(2, '0')}${txId}`;
  const tag62 = `62${txTag.length.toString().padStart(2, '0')}${txTag}`;
  
  // Tag 63 is CRC16
  const dataForCrc = `${step1}${tag54}${step2}${tag62}6304`;
  const crc = computeCRC16(dataForCrc);
  
  return `${dataForCrc}${crc}`;
}

// Initial Database seeds
const DEFAULTS = {
  packages: [
    { id: "pkg-1", name: "Paket 2 Jam (Super Speed)", speedLimit: "3 Mbps", price: 2000, durationHours: 2, description: "Internet kencang masa aktif 2 jam sejak login" },
    { id: "pkg-2", name: "Paket Harian (Unlimited)", speedLimit: "5 Mbps", price: 5000, durationHours: 24, description: "Puas internetan selama 24 jam penuh" },
    { id: "pkg-3", name: "Paket Mingguan (Mantap)", speedLimit: "10 Mbps", price: 15000, durationHours: 168, description: "Seminggu penuh hemat tanpa pusing kuota" },
    { id: "pkg-4", name: "Paket Bulanan (Sultan)", speedLimit: "15 Mbps", price: 50000, durationHours: 720, description: "Internet premium 30 hari termurah sekampung" }
  ] as VoucherPackage[],

  vouchers: [
    // Pre-generated vouchers
    { id: "v-1", code: "WIFI-FAST-291", packageId: "pkg-1", packageName: "Paket 2 Jam (Super Speed)", price: 2000, status: "Available", createdAt: "2026-06-10" },
    { id: "v-2", code: "WIFI-FAST-772", packageId: "pkg-1", packageName: "Paket 2 Jam (Super Speed)", price: 2000, status: "Available", createdAt: "2026-06-10" },
    { id: "v-3", code: "WIFI-DAY-389", packageId: "pkg-2", packageName: "Paket Harian (Unlimited)", price: 5000, status: "Available", createdAt: "2026-06-10" },
    { id: "v-4", code: "WIFI-DAY-442", packageId: "pkg-2", packageName: "Paket Harian (Unlimited)", price: 5000, status: "Sold", createdAt: "2026-06-09", soldTo: "andi_wijaya", activatedAt: "2026-06-09 14:02", expiresAt: "2026-06-10 14:02" },
    { id: "v-5", code: "WIFI-WEEK-591", packageId: "pkg-3", packageName: "Paket Mingguan (Mantap)", price: 15000, status: "Available", createdAt: "2026-06-10" },
    { id: "v-6", code: "WIFI-MONTH-102", packageId: "pkg-4", packageName: "Paket Bulanan (Sultan)", price: 50000, status: "Available", createdAt: "2026-06-10" }
  ] as Voucher[],

  customers: [
    { id: "cust-1", name: "Andi Wijaya", username: "andi_wijaya", password: "andi_wijaya123", phone: "08123456789", saldo: 25000, status: "Active", joinedDate: "2026-06-01", registeredVia: "WebPortal" },
    { id: "cust-2", name: "Siti Rahma", username: "siti_rahma", password: "siti_rahma123", phone: "08987654321", saldo: 5000, status: "Active", joinedDate: "2026-06-05", registeredVia: "WebPortal" },
    { id: "cust-3", name: "Rizky Pratama", username: "rizky_p", password: "rizky_p123", phone: "087711223344", saldo: 120000, status: "Active", joinedDate: "2026-06-08", registeredVia: "Admin" }
  ] as CustomerAccount[],

  transactions: [
    {
      id: "tx-1001",
      transactionId: "QRLY-9902123",
      customerId: "cust-1",
      customerName: "Andi Wijaya",
      type: "Topup" as const,
      amount: 20000,
      uniqueCode: 154,
      totalPayment: 20154,
      status: "Paid" as const,
      qrisPayload: generateDynamicQrisPayload(20154, "QRLY-9902123"),
      note: "Isi Ulang Saldo Terverifikasi",
      createdAt: "2026-06-09 10:24",
      paidAt: "2026-06-09 10:25"
    }
  ] as QrisTransaction[],

  botsConfig: [
    {
      provider: "WhatsApp" as const,
      apiKey: "90da8b37f2d6c1c8a14ec1234bc5ee81",
      botUsername: "0812-7788-9900",
      status: "Connected" as const,
      welcomeMessage: "Halo! Selamat datang di Layanan Bot WiFi Voucher Raja 🚀\n\nBalas chat ini dengan mengetik kombinasi menu berikut:\n👉 *DAFTAR#Nama#Username* (Untuk register akun kupon)\n👉 *INFO* (Mengecek sisa Saldo member)\n👉 *PAKET* (Melihat list harga Voucher wifi)\n👉 *BELI#KodePaket* (Beli langsung potong saldo, contoh: *BELI#pkg-1*)\n👉 *TOPUP#Nominal* (Topup saldo otomatis via QRIS)\n👉 *BANTUAN* (Kontak Support aduan)",
      autoRepliesEnabled: true
    },
    {
      provider: "Telegram" as const,
      apiKey: "582910395:AAHr82939103-bc92d193b2bbbdde",
      botUsername: "@WifiVoucherRajaBot",
      status: "Connected" as const,
      welcomeMessage: "Halo! Selamat datang di Telegram Bot WiFi Voucher Raja RTRW-NET! \n\nKetik /start atau balas dengan pilihan perintah:\n- /register : Pendaftaran akun member\n- /info : Cek sisa saldo & akun Anda\n- /paket : Daftar harga paket Wifi\n- /beli : Membeli voucher potong saldo\n- /topup : Request barcode top-up saldo via QRISLY\n- /bantuan : Kontak dukungan teknis",
      autoRepliesEnabled: true
    }
  ] as BotSetting[],

  chatLogs: [
    {
      id: "log-1",
      provider: "WhatsApp" as const,
      senderPhoneOrUser: "08123456789",
      senderName: "Andi Wijaya",
      messageText: "INFO",
      replyText: "Halo Andi Wijaya! Akun Anda aktif.\n💰 Sisa Saldo: *Rp 25.000*\nID Pengguna: @andi_wijaya\nKetik *PAKET* untuk membeli voucher hotspot atau *TOPUP#Nominal* untuk isi ulang saldo.",
      timestamp: "10:15 AM",
      isIncoming: true
    },
    {
      id: "log-2",
      provider: "Telegram" as const,
      senderPhoneOrUser: "siti_rahma",
      senderName: "Siti Rahma",
      messageText: "/paket",
      replyText: "Berikut daftar Voucher WiFi Raja yang tersedia:\n\n1. **Paket 2 Jam (Super Speed)** - Rp 2.000 (ID: `pkg-1`)\n2. **Paket Harian (Unlimited)** - Rp 5.000 (ID: `pkg-2`)\n3. **Paket Mingguan (Mantap)** - Rp 15.000 (ID: `pkg-3`)\n4. **Paket Bulanan (Sultan)** - Rp 50.000 (ID: `pkg-4`)\n\nUntuk membeli langsung ketik: /beli <ID_PAKET> (Contoh: `/beli pkg-2`)",
      timestamp: "10:18 AM",
      isIncoming: true
    }
  ] as ChatSimMessage[],

  mikrotik: {
    ip: "10.10.10.1",
    username: "admin_hotspot",
    port: 8728,
    isConnected: true,
    activeHotspotUsersCount: 18,
    detectedProfiles: ["default", "Speed_2_Mbps", "Speed_3_Mbps", "Speed_5_Mbps", "Speed_10_Mbps", "Speed_15_Mbps"]
  } as MikrotikConfig,

  sanpayConfig: {
    apiKey: process.env.SANPAY_API_KEY || "",
    merchantId: process.env.SANPAY_MERCHANT_ID || "",
    secretKey: process.env.SANPAY_SECRET_KEY || "",
    mode: (process.env.SANPAY_MODE || (process.env.SANPAY_API_KEY ? "Production" : "Simulation")) as "Simulation" | "Production",
    enabled: true
  },

  activeGateway: "Sanpay" as "Sanpay",
  
  displayConfig: {
    runningText: "Selamat datang di Wi-Fi Hotspot Kami! Nikmati internet cepat dan stabil. Beli paket sekarang juga!",
    adsImages: [
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
    ]
  } as AppDisplayConfig
};

// Local storage model
let db = JSON.parse(JSON.stringify(DEFAULTS));

async function loadDb() {
  try {
    const pkgResult = await pgDb.select().from(schema.packages);
    const voucherResult = await pgDb.select().from(schema.vouchers);
    const customerResult = await pgDb.select().from(schema.customers);
    const transactionResult = await pgDb.select().from(schema.transactions);
    const botResult = await pgDb.select().from(schema.botsConfig);
    const chatResult = await pgDb.select().from(schema.chatLogs);
    const mikrotikResult = await pgDb.select().from(schema.mikrotikConfig);
    const sanpayResult = await pgDb.select().from(schema.sanpayConfig);
    const displayResult = await pgDb.select().from(schema.displayConfig);

    if (pkgResult.length === 0) {
      console.log("[POSTGRES] DB is empty. Seeding defaults...");
      
      for (const p of DEFAULTS.packages) {
        await pgDb.insert(schema.packages).values(p).onConflictDoNothing();
      }
      for (const v of DEFAULTS.vouchers) {
        await pgDb.insert(schema.vouchers).values({
          id: v.id,
          code: v.code,
          packageId: v.packageId,
          packageName: v.packageName,
          price: v.price,
          status: v.status,
          createdAt: v.createdAt,
          soldTo: v.soldTo || null,
          activatedAt: v.activatedAt || null,
          expiresAt: v.expiresAt || null
        }).onConflictDoNothing();
      }
      for (const c of DEFAULTS.customers) {
        await pgDb.insert(schema.customers).values({
          id: c.id,
          name: c.name,
          username: c.username,
          password: c.password || null,
          phone: c.phone,
          saldo: c.saldo,
          status: c.status,
          joinedDate: c.joinedDate,
          registeredVia: c.registeredVia
        }).onConflictDoNothing();
      }
      for (const t of DEFAULTS.transactions) {
        await pgDb.insert(schema.transactions).values({
          id: t.id,
          transactionId: t.transactionId,
          customerId: t.customerId || "guest",
          customerName: t.customerName,
          type: t.type,
          amount: t.amount,
          uniqueCode: t.uniqueCode,
          totalPayment: t.totalPayment,
          status: t.status,
          qrisPayload: t.qrisPayload || "",
          note: t.note || null,
          createdAt: t.createdAt,
          paidAt: t.paidAt || null
        }).onConflictDoNothing();
      }
      for (const b of DEFAULTS.botsConfig) {
        await pgDb.insert(schema.botsConfig).values({
          provider: b.provider,
          apiKey: b.apiKey,
          botUsername: b.botUsername || null,
          status: b.status,
          welcomeMessage: b.welcomeMessage,
          autoRepliesEnabled: b.autoRepliesEnabled
        }).onConflictDoNothing();
      }
      for (const cl of DEFAULTS.chatLogs) {
        await pgDb.insert(schema.chatLogs).values({
          id: cl.id,
          provider: cl.provider,
          senderPhoneOrUser: cl.senderPhoneOrUser,
          senderName: cl.senderName,
          messageText: cl.messageText,
          replyText: cl.replyText || null,
          timestamp: cl.timestamp,
          isIncoming: cl.isIncoming
        }).onConflictDoNothing();
      }
      
      await pgDb.insert(schema.mikrotikConfig).values({
        id: "default",
        ip: DEFAULTS.mikrotik.ip,
        username: DEFAULTS.mikrotik.username,
        port: DEFAULTS.mikrotik.port,
        isConnected: DEFAULTS.mikrotik.isConnected,
        activeHotspotUsersCount: DEFAULTS.mikrotik.activeHotspotUsersCount,
        detectedProfiles: DEFAULTS.mikrotik.detectedProfiles
      }).onConflictDoNothing();

      await pgDb.insert(schema.sanpayConfig).values({
        id: "config",
        apiKey: DEFAULTS.sanpayConfig.apiKey,
        merchantId: DEFAULTS.sanpayConfig.merchantId,
        secretKey: DEFAULTS.sanpayConfig.secretKey,
        mode: DEFAULTS.sanpayConfig.mode,
        enabled: DEFAULTS.sanpayConfig.enabled
      }).onConflictDoNothing();

      await pgDb.insert(schema.displayConfig).values({
        id: "config",
        runningText: DEFAULTS.displayConfig.runningText,
        adsImages: DEFAULTS.displayConfig.adsImages
      }).onConflictDoNothing();

      db = JSON.parse(JSON.stringify(DEFAULTS));
    } else {
      console.log("[POSTGRES] Loading state from PostgreSQL...");
      db.packages = pkgResult;
      db.vouchers = voucherResult;
      db.customers = customerResult;
      db.transactions = transactionResult;
      db.botsConfig = botResult;
      db.chatLogs = chatResult;
      db.mikrotik = mikrotikResult[0] ? {
        ip: mikrotikResult[0].ip,
        username: mikrotikResult[0].username,
        port: mikrotikResult[0].port,
        isConnected: mikrotikResult[0].isConnected,
        activeHotspotUsersCount: mikrotikResult[0].activeHotspotUsersCount,
        detectedProfiles: mikrotikResult[0].detectedProfiles as string[]
      } : DEFAULTS.mikrotik;

      db.sanpayConfig = sanpayResult[0] ? {
        apiKey: sanpayResult[0].apiKey,
        merchantId: sanpayResult[0].merchantId,
        secretKey: sanpayResult[0].secretKey,
        mode: sanpayResult[0].mode as "Simulation" | "Production",
        enabled: sanpayResult[0].enabled
      } : DEFAULTS.sanpayConfig;

      db.displayConfig = displayResult[0] ? {
        runningText: displayResult[0].runningText,
        adsImages: displayResult[0].adsImages as string[]
      } : DEFAULTS.displayConfig;
    }
  } catch (err) {
    console.error("[POSTGRES] Failed to load data from PostgreSQL:", err);
  }
}

async function saveDb() {
  try {
    for (const p of db.packages) {
      await pgDb.insert(schema.packages)
        .values(p)
        .onConflictDoUpdate({
          target: schema.packages.id,
          set: {
            name: p.name,
            speedLimit: p.speedLimit,
            price: p.price,
            durationHours: p.durationHours,
            description: p.description
          }
        });
    }
    const existingPkgs = await pgDb.select().from(schema.packages);
    for (const ep of existingPkgs) {
      if (!db.packages.some((p: any) => p.id === ep.id)) {
        await pgDb.delete(schema.packages).where(eq(schema.packages.id, ep.id));
      }
    }

    for (const v of db.vouchers) {
      await pgDb.insert(schema.vouchers)
        .values(v)
        .onConflictDoUpdate({
          target: schema.vouchers.id,
          set: {
            code: v.code,
            packageId: v.packageId,
            packageName: v.packageName,
            price: v.price,
            status: v.status,
            createdAt: v.createdAt,
            soldTo: v.soldTo || null,
            activatedAt: v.activatedAt || null,
            expiresAt: v.expiresAt || null
          }
        });
    }
    const existingVouchers = await pgDb.select().from(schema.vouchers);
    for (const ev of existingVouchers) {
      if (!db.vouchers.some((v: any) => v.id === ev.id)) {
        await pgDb.delete(schema.vouchers).where(eq(schema.vouchers.id, ev.id));
      }
    }

    for (const c of db.customers) {
      await pgDb.insert(schema.customers)
        .values(c)
        .onConflictDoUpdate({
          target: schema.customers.id,
          set: {
            name: c.name,
            username: c.username,
            password: c.password,
            phone: c.phone,
            saldo: c.saldo,
            status: c.status,
            joinedDate: c.joinedDate,
            registeredVia: c.registeredVia
          }
        });
    }
    const existingCusts = await pgDb.select().from(schema.customers);
    for (const ec of existingCusts) {
      if (!db.customers.some((c: any) => c.id === ec.id)) {
        await pgDb.delete(schema.customers).where(eq(schema.customers.id, ec.id));
      }
    }

    for (const t of db.transactions) {
      await pgDb.insert(schema.transactions)
        .values({
          id: t.id,
          transactionId: t.transactionId,
          customerId: t.customerId,
          customerName: t.customerName,
          type: t.type,
          amount: t.amount,
          uniqueCode: t.uniqueCode,
          totalPayment: t.totalPayment,
          status: t.status,
          qrisPayload: t.qrisPayload,
          note: t.note || null,
          createdAt: t.createdAt,
          paidAt: t.paidAt || null
        })
        .onConflictDoUpdate({
          target: schema.transactions.id,
          set: {
            transactionId: t.transactionId,
            customerId: t.customerId,
            customerName: t.customerName,
            type: t.type,
            amount: t.amount,
            uniqueCode: t.uniqueCode,
            totalPayment: t.totalPayment,
            status: t.status,
            qrisPayload: t.qrisPayload,
            note: t.note || null,
            createdAt: t.createdAt,
            paidAt: t.paidAt || null
          }
        });
    }
    const existingTxs = await pgDb.select().from(schema.transactions);
    for (const etx of existingTxs) {
      if (!db.transactions.some((t: any) => t.id === etx.id)) {
        await pgDb.delete(schema.transactions).where(eq(schema.transactions.id, etx.id));
      }
    }

    for (const b of db.botsConfig) {
      await pgDb.insert(schema.botsConfig)
        .values(b)
        .onConflictDoUpdate({
          target: schema.botsConfig.provider,
          set: {
            apiKey: b.apiKey,
            botUsername: b.botUsername,
            status: b.status,
            welcomeMessage: b.welcomeMessage,
            autoRepliesEnabled: b.autoRepliesEnabled
          }
        });
    }

    for (const cl of db.chatLogs) {
      await pgDb.insert(schema.chatLogs)
        .values(cl)
        .onConflictDoUpdate({
          target: schema.chatLogs.id,
          set: {
            provider: cl.provider,
            senderPhoneOrUser: cl.senderPhoneOrUser,
            senderName: cl.senderName,
            messageText: cl.messageText,
            replyText: cl.replyText,
            timestamp: cl.timestamp,
            isIncoming: cl.isIncoming
          }
        });
    }
    const existingChatLogs = await pgDb.select().from(schema.chatLogs);
    for (const ec of existingChatLogs) {
      if (!db.chatLogs.some((cl: any) => cl.id === ec.id)) {
        await pgDb.delete(schema.chatLogs).where(eq(schema.chatLogs.id, ec.id));
      }
    }

    await pgDb.insert(schema.mikrotikConfig)
      .values({
        id: "default",
        ip: db.mikrotik.ip,
        username: db.mikrotik.username,
        port: db.mikrotik.port,
        isConnected: db.mikrotik.isConnected,
        activeHotspotUsersCount: db.mikrotik.activeHotspotUsersCount,
        detectedProfiles: db.mikrotik.detectedProfiles
      })
      .onConflictDoUpdate({
        target: schema.mikrotikConfig.id,
        set: {
          ip: db.mikrotik.ip,
          username: db.mikrotik.username,
          port: db.mikrotik.port,
          isConnected: db.mikrotik.isConnected,
          activeHotspotUsersCount: db.mikrotik.activeHotspotUsersCount,
          detectedProfiles: db.mikrotik.detectedProfiles
        }
      });

    await pgDb.insert(schema.sanpayConfig)
      .values({
        id: "config",
        apiKey: db.sanpayConfig.apiKey,
        merchantId: db.sanpayConfig.merchantId,
        secretKey: db.sanpayConfig.secretKey,
        mode: db.sanpayConfig.mode,
        enabled: db.sanpayConfig.enabled
      })
      .onConflictDoUpdate({
        target: schema.sanpayConfig.id,
        set: {
          apiKey: db.sanpayConfig.apiKey,
          merchantId: db.sanpayConfig.merchantId,
          secretKey: db.sanpayConfig.secretKey,
          mode: db.sanpayConfig.mode,
          enabled: db.sanpayConfig.enabled
        }
      });

    await pgDb.insert(schema.displayConfig)
      .values({
        id: "config",
        runningText: db.displayConfig.runningText,
        adsImages: db.displayConfig.adsImages
      })
      .onConflictDoUpdate({
        target: schema.displayConfig.id,
        set: {
          runningText: db.displayConfig.runningText,
          adsImages: db.displayConfig.adsImages
        }
      });
  } catch (err) {
    console.error("[POSTGRES] Failed to save data to PostgreSQL:", err);
  }
}

// Helper: Auto reply function for WhatsApp / Telegram simulator
function processBotReply(provider: 'WhatsApp' | 'Telegram', sender: string, senderName: string, text: string): string {
  const normText = text.trim().toUpperCase();
  const botInfo = db.botsConfig.find((b: BotSetting) => b.provider === provider);
  if (!botInfo || !botInfo.autoRepliesEnabled) {
    return "Layanan bot otomatis sedang dinonaktifkan oleh administrator.";
  }

  // 1. Help instructions
  if (normText === "HELP" || normText === "P" || normText === "START" || normText === "/START" || normText === "MENU" || normText === "MAIN" || normText === "BANTUAN") {
    return botInfo.welcomeMessage;
  }

  // 2. Client registration flow: DAFTAR#Nama#Username
  if (normText.startsWith("DAFTAR#") || normText.startsWith("/REGISTER")) {
    let parts: string[] = [];
    if (normText.startsWith("DAFTAR#")) {
      parts = text.split("#").map(p => p.trim());
    } else {
      // /register budi budi99
      parts = ["DAFTAR", text.split(" ")[1], text.split(" ")[2]];
    }

    if (parts.length < 3 || !parts[1] || !parts[2]) {
      return `❌ Registrasi Gagal!\nFormat yang benar:\nWhatsApp: *DAFTAR#Nama#Username*\nTelegram: \`/register Nama Username\``;
    }

    const name = parts[1];
    const username = parts[2].toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Check if duplicate username
    const exists = db.customers.some((c: CustomerAccount) => c.username === username);
    if (exists) {
      return `❌ Username @${username} sudah digunakan. Silakan pilih username lain!`;
    }

    const newCust: CustomerAccount = {
      id: "cust-" + (db.customers.length + 101),
      name: name,
      username: username,
      phone: provider === 'WhatsApp' ? sender : "085700001122",
      saldo: 0,
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      registeredVia: "WebPortal"
    };

    db.customers.push(newCust);
    return `✅ Selamat *${name}*, akun Anda BERHASIL terdaftar!\n\n🔑 Username Anda: *@${username}*\n📞 No Telepon: *${newCust.phone}*\n💰 Saldo Sekarang: *Rp 0*\n\nSilakan ketik *TOPUP#20000* untuk mengisi saldo via QRIS otomatis!`;
  }

  // Find customer account if phone matches (WA) or username matches (Telegram)
  let customer = db.customers.find((c: CustomerAccount) => {
    if (provider === 'WhatsApp') {
      return c.phone === sender || c.username === sender;
    } else {
      return c.username === sender || c.name.toLowerCase() === sender.toLowerCase();
    }
  });

  // Fallback try matching by name
  if (!customer && senderName) {
    customer = db.customers.find((c: CustomerAccount) => c.name.toLowerCase() === senderName.toLowerCase());
  }

  // 3. User Info checking
  if (normText === "INFO" || normText === "/INFO" || normText === "SALDO" || normText === "CEK") {
    if (!customer) {
      return `⚠️ Nomor/Akun Anda belum terdaftar!\n\nSilakan daftar terlebih dahulu dengan ketik:\n👉 *DAFTAR#NamaAnda#username_baru*`;
    }
    return `👤 *INFORMASI AKUN ANDA*:\n━━━━━━━━━━━━\n📌 Nama: *${customer.name}*\n🏷️ Username: *@${customer.username}*\n💰 Saldo Anda: *Rp ${customer.saldo.toLocaleString("id-ID")}*\n🟢 Status Akun: *${customer.status}*\n\nKetik *PAKET* untuk beli wifi voucher langsung!`;
  }

  // 4. Packages list info
  if (normText === "PAKET" || normText === "/PAKET" || normText === "VOUCHER") {
    let pkgList = `🎫 *HARGA VOUCHER WIFI RAJA*:\n━━━━━━━━━━━━\n`;
    db.packages.forEach((p: VoucherPackage, idx: number) => {
      pkgList += `${idx + 1}. *${p.name}*\n   ⚡ Speed: *${p.speedLimit}* | ⏳ Durasi: *${p.durationHours} Jam*\n   💵 Harga: *Rp ${p.price.toLocaleString("id-ID")}*\n   🔑 Kode Beli: *BELI#${p.id}*\n\n`;
    });
    pkgList += `Ketik *BELI#KodePaket* untuk membeli voucher langsung potong saldo.`;
    return pkgList;
  }

  // 5. Purchasing process via balance: BELI#pkg-1 or /beli pkg-1
  if (normText.startsWith("BELI#") || normText.startsWith("/BELI")) {
    let pkgId = "";
    if (normText.startsWith("BELI#")) {
      pkgId = text.split("#")[1]?.trim() || "";
    } else {
      pkgId = text.split(" ")[1]?.trim() || "";
    }

    if (!pkgId) {
      return `❌ Gagal memproses.\nTentukan kode paketnya! Contoh: *BELI#pkg-1*`;
    }

    const pkg = db.packages.find((p: VoucherPackage) => p.id === pkgId);
    if (!pkg) {
      return `❌ Kode paket *${pkgId}* tidak ditemukan. Ketik *PAKET* untuk daftar kode yang valid.`;
    }

    if (!customer) {
      return `⚠️ Pembelian gagal!\nNomor Anda belum terdaftar sebagai member. Silakan daftarkan akun Anda terlebih dahulu dengan mengetik:\n👉 *DAFTAR#Nama#Username*`;
    }

    if (customer.saldo < pkg.price) {
      return `⚠️ Saldo Anda tidak mencukupi!\n💵 Harga Paket: *Rp ${pkg.price.toLocaleString("id-ID")}*\n💰 Saldo Anda: *Rp ${customer.saldo.toLocaleString("id-ID")}*\n\nSilakan ketik *TOPUP#${pkg.price}* untuk menghasilkan kode QRIS isi saldo secara instan!`;
    }

    // Spend saldo & allocation
    customer.saldo -= pkg.price;

    // Check if available voucher in stock
    let voucher = db.vouchers.find((v: Voucher) => v.packageId === pkg.id && v.status === "Available");
    
    // Auto-generate if stock is empty
    if (!voucher) {
      const code = `HS-${pkg.name.substring(0, 3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;
      voucher = {
        id: "v-" + (db.vouchers.length + 101),
        code: code,
        packageId: pkg.id,
        packageName: pkg.name,
        price: pkg.price,
        status: "Available",
        createdAt: new Date().toISOString().split("T")[0]
      };
      db.vouchers.push(voucher);
    }

    voucher.status = "Sold";
    voucher.soldTo = customer.name;
    voucher.activatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    voucher.expiresAt = new Date(Date.now() + pkg.durationHours * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 16);

    return `🎉 *PEMBELIAN BERHASIL!* 🎉\n━━━━━━━━━━━━\n🎫 Voucher: *${pkg.name}*\n🔑 Kode Voucher / Sandi Hotspot:\n👉  **${voucher.code}**  👈\n\n⚡ Kecepatan: *${pkg.speedLimit}*\n⏳ Masa Aktif: *${pkg.durationHours} Jam*\n💰 Sisa Saldo Anda: *Rp ${customer.saldo.toLocaleString("id-ID")}*\n\nHubungkan wifi Anda ke SSID *WiFi_Woucher_Raja*, masukkan sandi di atas di portal login! Terima kasih.`;
  }

  // 6. Topup workflow: TOPUP#20000 or /topup 20000
  if (normText.startsWith("TOPUP#") || normText.startsWith("/TOPUP") || normText.startsWith("ISI#")) {
    let amtStr = "";
    if (normText.startsWith("TOPUP#")) {
      amtStr = text.split("#")[1]?.trim() || "";
    } else if (normText.startsWith("ISI#")) {
      amtStr = text.split("#")[1]?.trim() || "";
    } else {
      amtStr = text.split(" ")[1]?.trim() || "";
    }

    const amount = parseInt(amtStr);
    if (isNaN(amount) || amount < 1000) {
      return `❌ Nominal top-up minimal adalah Rp 1.000. Contoh format: *TOPUP#20000*`;
    }

    if (!customer) {
      return `⚠️ Top-up Gagal!\nNomor Anda belum terdaftar sebagai member. Silakan daftar dulu:\n👉 *DAFTAR#Nama#Username*`;
    }

    // Generate Transaction with unique nominal billing code
    const uniqueVal = Math.floor(1 + Math.random() * 499); // Nominal unik 1-499
    const totalPay = amount + uniqueVal;
    
    const newTx: QrisTransaction = {
      id: "tx-" + (db.transactions.length + 1001),
      transactionId: "QRLY-" + Math.floor(1000000 + Math.random() * 90000).toString(),
      customerId: customer.id,
      customerName: customer.name,
      type: "Topup",
      amount: amount,
      uniqueCode: uniqueVal,
      totalPayment: totalPay,
      status: "Pending",
      qrisPayload: generateDynamicQrisPayload(totalPay, "TXBOT-" + customer.id),
      note: `Topup Saldo Saluran Bot ${provider}`,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    db.transactions.push(newTx);

    return `⏳ *TAGIHAN TOP-UP SALDO (QRISLY)* ⏳\n━━━━━━━━━━━━\n👤 Pelanggan: *${customer.name}*\n💵 Nominal Request: *Rp ${amount.toLocaleString("id-ID")}*\n🔢 Kode Unik: *Rp ${uniqueVal}*\n💰 Total Pembayaran: *Rp ${totalPay.toLocaleString("id-ID")}*\n\n👉 *PENTING*: Anda WAJIB membayar nominal pas *Rp ${totalPay}* agar sistem mendeteksi pembayaran secara otomatis!\n\n📸 *BARCODE QRIS ANDA*:\nSistem QRISLY mengonversi static code ke dynamic code. Silakan buka Panel Utama untuk membayar kuitansi atau simulasikan penyelesaian transaksi instan!\n👉 Link Simulator Tagihan: */qris-pay/${newTx.id}*`;
  }

  // Default fallback conversational bot replies
  return `🤖 Maaf, saya tidak mengerti maksud Anda.\n\nKetik *BANTUAN* atau *HELP* untuk melihat bantuan navigasi menu WiFi Router.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  await loadDb();

  // Auto-sync middleware to PostgreSQL on any modifying REST method
  app.use((req, res, next) => {
    res.on("finish", async () => {
      if (["POST", "PUT", "DELETE"].includes(req.method)) {
        try {
          console.log(`[POSTGRES] Auto-syncing database on ${req.method} ${req.originalUrl}...`);
          await saveDb();
        } catch (e) {
          console.error(`[POSTGRES] Auto-sync error:`, e);
        }
      }
    });
    next();
  });

  // 1. Return all state
  app.get("/api/all-data", (req, res) => {
    res.json(db);
  });

  // 2. Clear & Reset DB State
  app.post("/api/reset", (req, res) => {
    db = JSON.parse(JSON.stringify(DEFAULTS));
    res.json({ success: true, message: "Database berhasil direset ke setelan awal", data: db });
  });

  // --- DISPLAY CONFIG API ---
  app.post("/api/display/config", (req, res) => {
    const { runningText, adsImages } = req.body;
    db.displayConfig = {
      runningText: runningText || db.displayConfig.runningText,
      adsImages: adsImages || db.displayConfig.adsImages
    };
    res.json({ success: true, config: db.displayConfig });
  });

  // --- VOUCHER PACKAGES API ---
  app.get("/api/packages", (req, res) => {
    res.json(db.packages);
  });

  app.post("/api/packages", (req, res) => {
    const newPkg: VoucherPackage = {
      id: "pkg-" + (db.packages.length + 100) + Math.floor(Math.random()*10),
      ...req.body
    };
    db.packages.push(newPkg);
    res.json({ success: true, package: newPkg, packages: db.packages });
  });

  app.put("/api/packages/:id", (req, res) => {
    const pkgId = req.params.id;
    const index = db.packages.findIndex((p: VoucherPackage) => p.id === pkgId);
    if (index !== -1) {
      db.packages[index] = { ...db.packages[index], ...req.body };
      res.json({ success: true, package: db.packages[index], packages: db.packages });
    } else {
      res.status(404).json({ success: false, message: "Paket tidak ditemukan" });
    }
  });

  app.delete("/api/packages/:id", (req, res) => {
    const pkgId = req.params.id;
    db.packages = db.packages.filter((p: VoucherPackage) => p.id !== pkgId);
    res.json({ success: true, message: "Paket voucher terhapus", packages: db.packages });
  });

  // --- VOUCHERS INVENTORY API ---
  app.post("/api/vouchers/generate", (req, res) => {
    const { packageId, quantity, customPrefix } = req.body;
    const pkg = db.packages.find((p: VoucherPackage) => p.id === packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Paket tidak ditemukan" });
    }

    const qty = parseInt(quantity) || 10;
    const prefix = (customPrefix || "WIFI").toUpperCase();
    const newGenerated: Voucher[] = [];

    for (let i = 0; i < qty; i++) {
      const code = `${prefix}-${Math.floor(1000 + Math.random()*8999)}`;
      const newVoucher: Voucher = {
        id: "v-" + (db.vouchers.length + newGenerated.length + 101),
        code: code,
        packageId: pkg.id,
        packageName: pkg.name,
        price: pkg.price,
        status: "Available",
        createdAt: new Date().toISOString().split("T")[0]
      };
      newGenerated.push(newVoucher);
    }

    db.vouchers = [...db.vouchers, ...newGenerated];
    res.json({ success: true, message: `Berhasil men-generate ${qty} kode voucher hotspot baru`, vouchers: db.vouchers });
  });

  app.post("/api/vouchers/delete-all", (req, res) => {
    db.vouchers = db.vouchers.filter((v: Voucher) => v.status === "Sold"); // Keep sold history
    res.json({ success: true, message: "Semua voucher 'Available' berhasil dikosongkan", vouchers: db.vouchers });
  });

  // --- CUSTOMER REGISTER & SATELLITE PORTAL API ---
  app.get("/api/customers", (req, res) => {
    res.json(db.customers);
  });

  app.post("/api/customers", (req, res) => {
    const username = req.body.username?.toLowerCase().trim() || "cust_" + Math.floor(Math.random()*100);
    const exists = db.customers.some((c: CustomerAccount) => c.username === username);
    if (exists) {
      return res.status(400).json({ success: false, message: "Username sudah terdaftar" });
    }

    const newCust: CustomerAccount = {
      id: "cust-" + (db.customers.length + 101),
      saldo: 0,
      joinedDate: new Date().toISOString().split("T")[0],
      status: "Active",
      registeredVia: "Admin",
      ...req.body,
      username: username
    };

    db.customers.push(newCust);
    res.json({ success: true, customer: newCust, customers: db.customers });
  });

  app.put("/api/customers/:id", (req, res) => {
    const custId = req.params.id;
    const index = db.customers.findIndex((c: CustomerAccount) => c.id === custId);
    if (index !== -1) {
      db.customers[index] = { ...db.customers[index], ...req.body };
      res.json({ success: true, customer: db.customers[index], customers: db.customers });
    } else {
      res.status(404).json({ success: false, message: "Pelanggan tidak ditemukan" });
    }
  });

  app.delete("/api/customers/:id", (req, res) => {
    const custId = req.params.id;
    db.customers = db.customers.filter((c: CustomerAccount) => c.id !== custId);
    res.json({ success: true, message: "Pelanggan terhapus", customers: db.customers });
  });

  // Customer portal authentication API
  app.post("/api/customers/portal/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Nama pengguna dan kata sandi wajib diisi" });
    }

    const userNorm = username.trim().toLowerCase();
    const customer = db.customers.find((c: CustomerAccount) => c.username === userNorm || c.phone === userNorm);
    
    if (customer) {
      if (customer.status === "Suspended") {
        return res.status(403).json({ success: false, message: "Akun Anda dinonaktifkan sementara" });
      }
      
      // Secure password check (with fallback for legacy seeds)
      const isPasswordCorrect = !customer.password || customer.password === password;
      if (!isPasswordCorrect) {
        return res.status(401).json({ success: false, message: "Kata sandi yang Anda masukkan salah" });
      }

      res.json({ success: true, customer });
    } else {
      res.status(404).json({ success: false, message: "Akun tidak ditemukan atau kata sandi tidak cocok. Silakan lakukan Registrasi Baru." });
    }
  });

  app.post("/api/customers/portal/register", (req, res) => {
    const { name, username, phone, password } = req.body;
    if (!name || !username || !phone || !password) {
      return res.status(400).json({ success: false, message: "Semua isian termasuk kata sandi wajib dilengkapi" });
    }

    const userNorm = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const exists = db.customers.some((c: CustomerAccount) => c.username === userNorm);
    if (exists) {
      return res.status(400).json({ success: false, message: "Username sudah digunakan member lain" });
    }

    const newCust: CustomerAccount = {
      id: "cust-" + (db.customers.length + 101),
      name: name,
      username: userNorm,
      phone: phone,
      password: password,
      saldo: 0,
      status: "Active",
      joinedDate: new Date().toISOString().split("T")[0],
      registeredVia: "WebPortal"
    };

    db.customers.push(newCust);
    res.json({ success: true, customer: newCust, customers: db.customers });
  });

  // Buy voucher directly via saldo (balance)
  app.post("/api/vouchers/buy-with-saldo", (req, res) => {
    const { customerId, packageId } = req.body;
    const cust = db.customers.find((c: CustomerAccount) => c.id === customerId);
    const pkg = db.packages.find((p: VoucherPackage) => p.id === packageId);

    if (!cust) return res.status(404).json({ success: false, message: "Member tidak terdaftar" });
    if (!pkg) return res.status(404).json({ success: false, message: "Paket wifi tidak terdeteksi" });

    if (cust.saldo < pkg.price) {
      return res.status(400).json({ success: false, message: "Saldo tidak mencukupi untuk memborong paket" });
    }

    // Get available voucher
    let voucher = db.vouchers.find((v: Voucher) => v.packageId === pkg.id && v.status === "Available");
    if (!voucher) {
      // Auto build dynamic voucher stock item on hot demand
      const code = `HS-${pkg.name.substring(0, 3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;
      voucher = {
        id: "v-" + (db.vouchers.length + 101),
        code: code,
        packageId: pkg.id,
        packageName: pkg.name,
        price: pkg.price,
        status: "Available",
        createdAt: new Date().toISOString().split("T")[0]
      };
      db.vouchers.push(voucher);
    }

    cust.saldo -= pkg.price;
    voucher.status = "Sold";
    voucher.soldTo = cust.name;
    voucher.activatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    voucher.expiresAt = new Date(Date.now() + pkg.durationHours * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 16);

    res.json({ success: true, voucher, customer: cust, vouchers: db.vouchers, customers: db.customers });
  });

  // --- QRISLY QR GATEWAY INTEGRATION API ---
  app.get("/api/qris/transactions", (req, res) => {
    res.json(db.transactions);
  });

  // Diagnostics endpoint for testing and verification
  app.get("/api/qris/diagnostics", (req, res) => {
    res.json({
      success: true,
      activeGateway: "Sanpay",
      sanpayConfig: {
        apiKey: process.env.SANPAY_API_KEY || db.sanpayConfig?.apiKey || "",
        merchantId: process.env.SANPAY_MERCHANT_ID || db.sanpayConfig?.merchantId || "",
        secretKey: process.env.SANPAY_SECRET_KEY || db.sanpayConfig?.secretKey || "",
        mode: process.env.SANPAY_MODE || db.sanpayConfig?.mode || "Simulation",
        enabled: true,
        envSecretsActive: {
          apiKey: !!process.env.SANPAY_API_KEY,
          merchantId: !!process.env.SANPAY_MERCHANT_ID,
          secretKey: !!process.env.SANPAY_SECRET_KEY,
        }
      },
      lastWebhookLog: db.lastWebhookLog || null,
      transactionsCount: db.transactions.length,
      uncompletedCount: db.transactions.filter((t: any) => t.status === "Pending").length,
      chatLogsCount: db.chatLogs.length
    });
  });

  // Configure Sanpay Settings (Active Gateway is Sanpay)
  app.get("/api/qris/gateway-config", (req, res) => {
    res.json({
      activeGateway: "Sanpay",
      sanpayConfig: {
        apiKey: process.env.SANPAY_API_KEY || db.sanpayConfig?.apiKey || "",
        merchantId: process.env.SANPAY_MERCHANT_ID || db.sanpayConfig?.merchantId || "",
        secretKey: process.env.SANPAY_SECRET_KEY || db.sanpayConfig?.secretKey || "",
        mode: process.env.SANPAY_MODE || db.sanpayConfig?.mode || "Simulation",
        enabled: true,
        envSecretsActive: {
          apiKey: !!process.env.SANPAY_API_KEY,
          merchantId: !!process.env.SANPAY_MERCHANT_ID,
          secretKey: !!process.env.SANPAY_SECRET_KEY,
        }
      }
    });
  });

  app.post("/api/qris/gateway-config", (req, res) => {
    const { sanpayConfig } = req.body;
    if (sanpayConfig) {
      db.sanpayConfig = { 
        apiKey: sanpayConfig.apiKey || "",
        merchantId: sanpayConfig.merchantId || "",
        secretKey: sanpayConfig.secretKey || "",
        mode: sanpayConfig.mode || "Simulation",
        enabled: true
      };
    }
    db.activeGateway = "Sanpay";
    res.json({
      success: true,
      activeGateway: "Sanpay",
      sanpayConfig: db.sanpayConfig
    });
  });

  // Create QRIS invoice (Sandbox/Simulation OR calls real Sanpay if configured)
  app.post("/api/qris/create", async (req, res) => {
    const { customerId, customerName, type, amount, packageId } = req.body;
    const baseAmt = parseInt(amount);

    if (isNaN(baseAmt) || baseAmt < 1000) {
      return res.status(400).json({ success: false, message: "Jumlah pembayaran minimal Rp 1.000" });
    }

    const uniqueVal = Math.floor(1 + Math.random() * 499);
    const totalAmount = baseAmt + uniqueVal;
    const txId = "QRLY-" + Math.floor(1000000 + Math.random() * 900000).toString();

    let note = "Top Up Stored Balance";
    if (type === "DirectBuy" && packageId) {
      const pkg = db.packages.find((p: VoucherPackage) => p.id === packageId);
      if (pkg) note = `Pembelian Langsung: ${pkg.name}`;
    }

    // Determine gateway provider (Always Sanpay or local dynamic QRIS fallback simulation)
    let qrisPayload = generateDynamicQrisPayload(totalAmount, txId);
    let realApiResponseLog: any = null;
    let isRealLiveAPI = false;

    const config = {
      apiKey: process.env.SANPAY_API_KEY || db.sanpayConfig?.apiKey || "",
      merchantId: process.env.SANPAY_MERCHANT_ID || db.sanpayConfig?.merchantId || "",
      secretKey: process.env.SANPAY_SECRET_KEY || db.sanpayConfig?.secretKey || "",
      mode: process.env.SANPAY_MODE || db.sanpayConfig?.mode || "Simulation"
    };

    isRealLiveAPI = !!(config.apiKey && config.apiKey.trim().length > 5);

    if (isRealLiveAPI) {
      try {
        console.log(`[SANPAY API] Melakukan request QRIS ke sanpay.site dengan Key: ${config.apiKey.substring(0, 5)}***`);
        
        // Prepare official compliant request payload matching official specifications
        const bodyObj = {
          amount: totalAmount,
          partnerReferenceNo: txId,
          expirySeconds: 900
        };

        const rawBody = JSON.stringify(bodyObj);
        
        // Generate HMAC-SHA256 signature using the API Key as the secret key over the raw JSON body
        const signature = crypto.createHmac("sha256", config.apiKey).update(rawBody).digest("hex");

        const response = await fetch("https://sanpay.site/api/v1/topup_qris", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Merchant-Code": config.merchantId,
            "X-Signature": signature
          },
          body: rawBody
        });

        const responseText = await response.text();
        let apiData: any = null;
        try {
          apiData = JSON.parse(responseText);
        } catch {
          apiData = { rawResponse: responseText };
        }

        realApiResponseLog = {
          gateway: "Sanpay",
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          body: apiData
        };

        if (response.ok) {
          if (apiData && (apiData.qrContent || apiData.qris_data || apiData.qr_string || apiData.qris_payload || apiData.qr_data)) {
            qrisPayload = apiData.qrContent || apiData.qris_data || apiData.qr_string || apiData.qris_payload || apiData.qr_data;
            console.log("[SANPAY API] Sukses Mendapatkan data QRIS dari Sanpay!");
          } else if (apiData && apiData.data && (apiData.data.qrContent || apiData.data.qris_data || apiData.data.qr_string || apiData.data.qris_payload || apiData.data.qr_code)) {
            qrisPayload = apiData.data.qrContent || apiData.data.qris_data || apiData.data.qr_string || apiData.data.qris_payload || apiData.data.qr_code;
            console.log("[SANPAY API] Sukses Mendapatkan data QRIS dari Sanpay!");
          }
        } else {
          console.warn(`[SANPAY API] Sanpay mengembalikan status error ${response.status}:`, responseText);
        }
      } catch (err: any) {
        console.warn("[SANPAY API] Info: Sambungan ke Sanpay ditangguhkan.", err.message);
        realApiResponseLog = {
          gateway: "Sanpay",
          error: err.message,
          note: "Terjadi gangguan koneksi atau konfigurasi Sanpay. Sistem beralih ke simulasi QRIS lokal demi keandalan layanan."
        };
      }
    }

    const newTx: QrisTransaction = {
      id: "tx-" + (db.transactions.length + 2001),
      transactionId: txId,
      customerId: customerId || undefined,
      customerName: customerName || "Tamu Guest",
      type: type || "Topup",
      amount: baseAmt,
      uniqueCode: uniqueVal,
      totalPayment: totalAmount,
      status: "Pending",
      qrisPayload: qrisPayload,
      note: note,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    // Store response debug log directly inside the transaction so frontend checkout can render it
    if (realApiResponseLog) {
      (newTx as any).apiDebugLog = realApiResponseLog;
    }

    db.transactions.push(newTx);
    res.json({ 
      success: true, 
      transaction: newTx, 
      transactions: db.transactions,
      isRealLiveAPI,
      realApiResponseLog
    });
  });

  // GET /api/qris/check-status/:id -> Poll and auto-verify real payment details on Sanpay
  app.get("/api/qris/check-status/:id", async (req, res) => {
    const txId = req.params.id;
    const txIndex = db.transactions.findIndex((t: QrisTransaction) => t.id === txId || t.transactionId === txId);

    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    const tx = db.transactions[txIndex];
    let apiStatusResponse: any = null;
    let isLiveChecked = false;
    let paymentVerified = false;

    // Is real integration active? Special handling for Sanpay directly
    let isRealLiveAPI = false;

    const config = {
      apiKey: process.env.SANPAY_API_KEY || db.sanpayConfig?.apiKey || "",
      merchantId: process.env.SANPAY_MERCHANT_ID || db.sanpayConfig?.merchantId || "",
      secretKey: process.env.SANPAY_SECRET_KEY || db.sanpayConfig?.secretKey || "",
      mode: process.env.SANPAY_MODE || db.sanpayConfig?.mode || "Simulation"
    };

    isRealLiveAPI = !!(config.apiKey && config.apiKey.trim().length > 5);

    if (isRealLiveAPI) {
      isLiveChecked = true;
      try {
        console.log(`[SANPAY API] Mengecek riwayat mutasi dari sanpay.site...`);
        const response = await fetch(`https://sanpay.site/api/v1/get_mutasi?apikey=${config.apiKey}&merchant_code=${config.merchantId}`, {
          method: "GET"
        });

        if (response.ok) {
          const apiData = (await response.json()) as any;
          apiStatusResponse = apiData;
          
          // Identify array of mutations (could be top level or inside data field)
          const mutations = Array.isArray(apiData) ? apiData : (apiData.data || apiData.mutations || apiData.mutasi || []);
          
          if (Array.isArray(mutations)) {
            // Locate transaction matching reference string or unique amount
            const matchedMutation = mutations.find((m: any) => {
              const mRef = (m.transactionID || m.partnerReferenceNo || m.ref_id || m.merchant_ref || m.reference || m.code || m.id || "").toString().toLowerCase();
              const mAmount = parseInt(m.amount || m.nominal || m.credit || m.amount_paid || "0");
              
              const isRefMatch = tx.transactionId.toLowerCase() === mRef || tx.id.toLowerCase() === mRef;
              const isAmountMatch = tx.totalPayment === mAmount;
              
              return isRefMatch || isAmountMatch;
            });
            
            if (matchedMutation) {
              paymentVerified = true;
              console.log(`[SANPAY API] Transaksi ${tx.transactionId} terverifikasi lunas di get_mutasi bursa.`);
            }
          }
        }
      } catch (err: any) {
        console.warn("Gagal melacak status di Sanpay:", err.message);
      }
    }

    // Standard simulated fulfillment triggers. If sandbox simulation is paid, update too.
    // (SimulatePaid call comes from simulator trigger directly or webhook, but this endpoint checks live status)
    if (paymentVerified && tx.status === "Pending") {
      db.transactions[txIndex].status = "Paid";
      db.transactions[txIndex].paidAt = new Date().toISOString().replace("T", " ").substring(0, 16);

      // 1. Credit balance
      if (tx.type === "Topup" && tx.customerId) {
        const custIndex = db.customers.findIndex((c: CustomerAccount) => c.id === tx.customerId);
        if (custIndex !== -1) {
          db.customers[custIndex].saldo += tx.amount;
        }
      }

      // 2. Fulfill Direct Buy Voucher
      if (tx.type === "DirectBuy") {
        let matchedPkg = db.packages.find((p: VoucherPackage) => tx.note!.includes(p.name));
        if (!matchedPkg) matchedPkg = db.packages[0];

        let voucher = db.vouchers.find((v: Voucher) => v.packageId === matchedPkg!.id && v.status === "Available");
        if (!voucher) {
          const code = `HS-${matchedPkg!.name.substring(0, 3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;
          voucher = {
            id: "v-" + (db.vouchers.length + 101),
            code: code,
            packageId: matchedPkg!.id,
            packageName: matchedPkg!.name,
            price: matchedPkg!.price,
            status: "Available",
            createdAt: new Date().toISOString().split("T")[0]
          };
          db.vouchers.push(voucher);
        }

        voucher.status = "Sold";
        voucher.soldTo = tx.customerName;
        voucher.activatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
        voucher.expiresAt = new Date(Date.now() + matchedPkg!.durationHours * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 16);
        db.transactions[txIndex].qrisPayload = `KODE VOUCHER ANDA: ${voucher.code}`;
      }

      // 3. Bot Notifications
      const waAlertNum = tx.customerId ? (db.customers.find((c: CustomerAccount) => c.id === tx.customerId)?.phone || "0x") : "081299990000";
      const waAlertName = tx.customerName;
      const automatedText = tx.type === "Topup"
        ? `🔔 *NOTIFIKASI PEMBAYARAN SANPAY* 🔔\n\nIsi ulang saldo Anda senilai *Rp ${tx.amount.toLocaleString("id-ID")}* berhasil terdeteksi!\n💰 Saldo saat ini telah ditambahkan.`
        : `🔔 *NOTIFIKASI PEMBAYARAN SANPAY* 🔔\n\nPembelian Voucher WiFi Raja berhasil diverifikasi secara instan!`;

      db.chatLogs.push({
        id: "log-" + (db.chatLogs.length + 1001),
        provider: "WhatsApp",
        senderPhoneOrUser: waAlertNum,
        senderName: waAlertName,
        messageText: "Sistem SANPAY Verifikator (AUTO REALTIME CHECK)",
        replyText: automatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isIncoming: false
      });
    }

    res.json({
      success: true,
      transactionStatus: db.transactions[txIndex].status,
      transaction: db.transactions[txIndex],
      isLiveChecked,
      paymentVerified,
      apiStatusResponse,
      customers: db.customers,
      vouchers: db.vouchers
    });
  });

  // Webhook Simulator & Real Callback Endpoint: Resolves payments & auto-dispatches vouchers or topups
  app.post("/api/qris/webhook", (req, res) => {
    // Log incoming webhooks directly to console
    console.log("[WEBHOOK RECEIVER] Payload terdeteksi:", JSON.stringify(req.body));

    // Save webhook log to db for frontend troubleshooting
    db.lastWebhookLog = {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      headers: req.headers,
      body: req.body
    };

    const transactionId = req.body.partnerReferenceNo || req.body.transactionId || req.body.transaction_id || req.body.merchant_ref || req.body.reference || req.body.id || req.body.txId;
    const status = req.body.status || req.body.payment_status || req.body.paymentStatus || req.body.status_pembayaran;

    if (!transactionId) {
      return res.status(400).json({ success: false, message: "Kunci identifikasi transaksi (partnerReferenceNo, transactionId atau merchant_ref) kosong atau tidak terkirim." });
    }

    const txIndex = db.transactions.findIndex((t: QrisTransaction) => t.transactionId === transactionId || t.id === transactionId);
    
    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: `Kode QRIS transaksi "${transactionId}" tidak ditemukan di sistem Wifi` });
    }

    const tx = db.transactions[txIndex];
    if (tx.status !== "Pending") {
      return res.json({ success: true, message: "Transaksi sudah diselesaikan sebelumnya", transaction: tx });
    }

    const isPaid = status === "Paid" || status === "PAID" || status === "Success" || status === "SUCCESS" || status === "lunas";

    if (isPaid) {
      db.transactions[txIndex].status = "Paid";
      db.transactions[txIndex].paidAt = new Date().toISOString().replace("T", " ").substring(0, 16);

      // 1. If Topup transaction, topup the balance!
      if (tx.type === "Topup" && tx.customerId) {
        const custIndex = db.customers.findIndex((c: CustomerAccount) => c.id === tx.customerId);
        if (custIndex !== -1) {
          db.customers[custIndex].saldo += tx.amount; 
        }
      }

      // 2. If Direct Buy transaction, fulfill voucher delivery directly!
      if (tx.type === "DirectBuy") {
        let matchedPkg = db.packages.find((p: VoucherPackage) => tx.note.includes(p.name));
        if (!matchedPkg) matchedPkg = db.packages[0]; 

        let voucher = db.vouchers.find((v: Voucher) => v.packageId === matchedPkg!.id && v.status === "Available");
        if (!voucher) {
          const code = `HS-${matchedPkg!.name.substring(0, 3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;
          voucher = {
            id: "v-" + (db.vouchers.length + 101),
            code: code,
            packageId: matchedPkg!.id,
            packageName: matchedPkg!.name,
            price: matchedPkg!.price,
            status: "Available",
            createdAt: new Date().toISOString().split("T")[0]
          };
          db.vouchers.push(voucher);
        }

        voucher.status = "Sold";
        voucher.soldTo = tx.customerName;
        voucher.activatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
        voucher.expiresAt = new Date(Date.now() + matchedPkg!.durationHours * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 16);
        db.transactions[txIndex].qrisPayload = `KODE VOUCHER ANDA: ${voucher.code}`; 
      }

      // 3. Generate automatic simulated Bot Alerts
      const waAlertNum = tx.customerId ? (db.customers.find((c: CustomerAccount) => c.id === tx.customerId)?.phone || "0x") : "081299990000";
      const waAlertName = tx.customerName;

      const automatedText = tx.type === "Topup"   
        ? `🔔 *NOTIFIKASI PEMBAYARAN SANPAY* 🔔\n\nIsi ulang saldo Anda senilai *Rp ${tx.amount.toLocaleString("id-ID")}* berhasil terdeteksi!\n💰 Saldo saat ini telah ditambahkan.`
        : `🔔 *NOTIFIKASI PEMBAYARAN SANPAY* 🔔\n\nPembelian Voucher WiFi Raja berhasil diverifikasi secara instan!`;

      db.chatLogs.push({
        id: "log-" + (db.chatLogs.length + 1001),
        provider: "WhatsApp",
        senderPhoneOrUser: waAlertNum,
        senderName: waAlertName,
        messageText: "Sistem SANPAY Verifikator (WEBHOOK LINK)",
        replyText: automatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isIncoming: false
      });
    } else {
      db.transactions[txIndex].status = "Expired";
    }

    res.json({ success: true, message: "Webhook terproses dengan aman", transaction: db.transactions[txIndex], customers: db.customers, vouchers: db.vouchers });
  });

  // --- CHATBOTS MANAGEMENT ---
  app.post("/api/bot/config", (req, res) => {
    const { provider, apiKey, welcomeMessage, autoRepliesEnabled } = req.body;
    const index = db.botsConfig.findIndex((b: BotSetting) => b.provider === provider);
    if (index !== -1) {
      db.botsConfig[index] = {
        ...db.botsConfig[index],
        apiKey: apiKey || db.botsConfig[index].apiKey,
        welcomeMessage: welcomeMessage || db.botsConfig[index].welcomeMessage,
        autoRepliesEnabled: autoRepliesEnabled !== undefined ? autoRepliesEnabled : db.botsConfig[index].autoRepliesEnabled,
        status: apiKey ? "Connected" : "Disconnected"
      };
      res.json({ success: true, config: db.botsConfig[index], configs: db.botsConfig });
    } else {
      res.status(404).json({ success: false, message: "Provider bot tidak disupport" });
    }
  });

  // Simulate an incoming message to test bots replies
  app.post("/api/bot/simulate-incoming", (req, res) => {
    const { provider, senderPhoneOrUser, senderName, messageText } = req.body;
    
    if (!messageText) {
      return res.status(400).json({ success: false, message: "Pesan tidak boleh kosong" });
    }

    const reply = processBotReply(provider, senderPhoneOrUser, senderName, messageText);
    
    const newInteraction: ChatSimMessage = {
      id: "log-" + (db.chatLogs.length + 1001),
      provider: provider,
      senderPhoneOrUser: senderPhoneOrUser || "08xxxx",
      senderName: senderName || "Test User",
      messageText: messageText,
      replyText: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isIncoming: true
    };

    db.chatLogs.push(newInteraction);
    res.json({ success: true, reply: reply, chatLogs: db.chatLogs, customers: db.customers, vouchers: db.vouchers });
  });

  // Clean chat log logs
  app.post("/api/bot/clear-logs", (req, res) => {
    db.chatLogs = [];
    res.json({ success: true, chatLogs: db.chatLogs });
  });

  // --- MIKROTIK CONNECT HOTSPOT SIMULATOR ---
  app.post("/api/mikrotik/config", (req, res) => {
    db.mikrotik = {
      ...db.mikrotik,
      ...req.body,
      isConnected: true,
      activeHotspotUsersCount: Math.floor(10 + Math.random()*25),
      detectedProfiles: ["default", "Speed_2_Mbps", "Speed_3_Mbps", "Speed_5_Mbps", "Speed_10_Mbps", "Speed_15_Mbps"]
    };
    res.json({ success: true, config: db.mikrotik });
  });

  app.post("/api/mikrotik/disconnect", (req, res) => {
    db.mikrotik.isConnected = false;
    db.mikrotik.activeHotspotUsersCount = 0;
    res.json({ success: true, config: db.mikrotik });
  });

  // Standard express Vite wrapper fallback integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server bound on port ${PORT}`);
  });
}

startServer();
