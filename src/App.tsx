import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard,
  Ticket,
  Users,
  QrCode,
  Bot,
  Layers,
  Wifi,
  Smartphone,
  Heart,
  RefreshCw,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Database,
  LogOut,
  LogIn,
  Sun,
  Moon
} from "lucide-react";
import { 
  Voucher, 
  VoucherPackage, 
  CustomerAccount, 
  QrisTransaction, 
  BotSetting, 
  ChatSimMessage, 
  MikrotikConfig 
} from "./types";
import DashboardOverview from "./components/DashboardOverview";
import VoucherManager from "./components/VoucherManager";
import MemberManager from "./components/MemberManager";
import QrGateway from "./components/QrGateway";
import BotIntegration from "./components/BotIntegration";
import MikrotikPanel from "./components/MikrotikPanel";
import CustomerPortal from "./components/CustomerPortal";
import DisplayConfigPanel from "./components/DisplayConfigPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("wifi_active_tab") || "Dashboard";
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Master Synchronized Database State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<VoucherPackage[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [transactions, setTransactions] = useState<QrisTransaction[]>([]);
  const [botsConfig, setBotsConfig] = useState<BotSetting[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatSimMessage[]>([]);
  const [mikrotik, setMikrotik] = useState<MikrotikConfig>({
    ip: "10.0.0.1",
    username: "admin",
    port: 8728,
    isConnected: false,
    activeHotspotUsersCount: 0
  });
  const [qrislyConfig, setQrislyConfig] = useState<any>({
    apiKey: "",
    merchantId: "M0001893",
    mode: "Simulation",
    autoCheckInterval: 5,
    enabled: true
  });
  const [displayConfig, setDisplayConfig] = useState<any>({
    runningText: "Selamat datang di Wi-Fi Hotspot Kami! Nikmati internet cepat dan stabil. Beli paket sekarang juga!",
    adsImages: []
  });
  const [dbStatus, setDbStatus] = useState<any>({
    connected: false,
    error: null,
    loadedFrom: "Memory (Fallback)",
    timestamp: null
  });

  // Client session for Customer Portal
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(() => {
    const saved = localStorage.getItem("wifi_current_customer");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isLainnyaOpen, setIsLainnyaOpen] = useState(false);

  // User Role control in navigation gate
  const [userRole, setUserRole] = useState<'guest' | 'admin' | 'customer'>(() => {
    return (localStorage.getItem("wifi_user_role") as 'guest' | 'admin' | 'customer') || 'guest';
  });

  // Keep states persisted on changes/refresh
  useEffect(() => {
    localStorage.setItem("wifi_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (currentCustomer) {
      localStorage.setItem("wifi_current_customer", JSON.stringify(currentCustomer));
    } else {
      localStorage.removeItem("wifi_current_customer");
    }
  }, [currentCustomer]);

  useEffect(() => {
    localStorage.setItem("wifi_user_role", userRole);
  }, [userRole]);
  const [isAdminLoginFormOpen, setIsAdminLoginFormOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wifi_dark_mode") === "true";
  });

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("wifi_dark_mode", String(nextVal));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = displayConfig?.adminPassword || "admin";
    if (adminPasswordInput === correctPassword) {
      setUserRole("admin");
      setActiveTab("Dashboard");
      setAdminPasswordInput("");
      setAdminAuthError("");
      setIsAdminLoginFormOpen(false);
    } else {
      setAdminAuthError("Kata sandi yang Anda masukkan salah.");
    }
  };

  // Load all server-side database items 
  const fetchAllData = async () => {
    try {
      const res = await fetch("/api/all-data");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
        setPackages(data.packages || []);
        setCustomers(data.customers || []);
        setTransactions(data.transactions || []);
        setBotsConfig(data.botsConfig || []);
        setChatLogs(data.chatLogs || []);
        setMikrotik(data.mikrotik || {
          ip: "10.0.0.1",
          username: "admin",
          port: 8728,
          isConnected: false,
          activeHotspotUsersCount: 0
        });
        setQrislyConfig(data.qrislyConfig || {
          apiKey: "",
          merchantId: "M0001893",
          mode: "Simulation",
          autoCheckInterval: 5,
          enabled: true
        });
        if (data.displayConfig) {
          setDisplayConfig(data.displayConfig);
        }
        if (data.dbStatus) {
          setDbStatus(data.dbStatus);
        }

        // Maintain client session sync if logged in
        if (currentCustomer) {
          const freshCust = (data.customers || []).find((c: CustomerAccount) => c.id === currentCustomer.id);
          if (freshCust) {
            setCurrentCustomer(freshCust);
          }
        }
      }
    } catch (e) {
      console.error("Gagal menarik data dari server backend.", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // API 1: Reset System to defaults
  const handleResetSystemState = async () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan seluruh data paket, voucher hotspot, member, dan transaksi? Konfigurasi penting seperti IP MikroTik dan metode pembayaran Sanpay akan tetap aman.")) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/reset", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setCurrentCustomer(null);
          setSelectedTxId(null);
          await fetchAllData();
          alert(data.message || "Database berhasil dikosongkan seutuhnya!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // API 2: Add Speed limit package
  const handleAddPackage = async (pkgPayload: Omit<VoucherPackage, "id">) => {
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkgPayload)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 3: Bulk print vouchers
  const handleGenerateVouchers = async (packageId: string, quantity: number, customPrefix: string) => {
    try {
      const res = await fetch("/api/vouchers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, quantity, customPrefix })
      });
      if (res.ok) {
        await fetchAllData();
        alert(`Bagus! Berhasil mencetak ${quantity} lembar kode voucher hotspot.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 4: Clear unused voucher units
  const handleClearUnusedVouchers = async () => {
    try {
      const res = await fetch("/api/vouchers/delete-all", { method: "POST" });
      if (res.ok) {
        await fetchAllData();
        alert("Semua stok voucher yang belum dibeli berhasil dikosongkan!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 5: Save custom member
  const handleAddCustomer = async (name: string, username: string, phone: string, password?: string) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, phone, password })
      });
      if (res.ok) {
        await fetchAllData();
        alert(`Member ${name} berhasil didaftarkan manual.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 6: Manual deposit to customer balance
  const handleTopupCustomerManual = async (customerId: string, amount: number) => {
    try {
      const target = customers.find(c => c.id === customerId);
      if (!target) return;
      
      const newSaldo = target.saldo + amount;
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo: newSaldo })
      });
      if (res.ok) {
        await fetchAllData();
        alert(`Berhasil menambahkan saldo cash Rp ${amount.toLocaleString("id-ID")} ke @${target.username}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 7: Change user connectivity
  const handleToggleCustomerStatus = async (customerId: string) => {
    try {
      const target = customers.find(c => c.id === customerId);
      if (!target) return;
      const newStatus = target.status === "Active" ? "Suspended" : "Active";
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 8: Remove customer member from log
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 9: Customer portal login action
  const handlePortalLogin = async (username: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/customers/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentCustomer(data.customer);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // API 10: Customer Portal Registration
  const handlePortalRegister = async (name: string, username: string, phone: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/customers/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, phone, password })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // API 11: Deduct balance client to buy hotspot code
  const handleBuyVoucherWithSaldo = async (packageId: string) => {
    if (!currentCustomer) return;
    try {
      const res = await fetch("/api/vouchers/buy-with-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: currentCustomer.id, packageId })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        alert(`YAY! Pembelian berhasil!\nKode Hotspot Anda: ${data.voucher.code}\nMasukkan kode ini di portal masuk WiFi net.`);
      } else {
        const errData = await res.json();
        alert(errData.message || "Proses beli gagal, silakan top up saldo.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 12: Trigger QRIS invoice Creation
  const handleTriggerQrisInvoice = async (amount: number, type: 'Topup' | 'DirectBuy', packageId?: string) => {
    try {
      const body = {
        amount,
        customerName: currentCustomer ? currentCustomer.name : "Tamu Guest",
        customerId: currentCustomer ? currentCustomer.id : undefined,
        type,
        packageId
      };
      
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        setSelectedTxId(data.transaction.transactionId);
        if (!currentCustomer) {
          setActiveTab("QRISLY Transactions");
          alert(`Invoice QRIS terbit untuk ${body.customerName}!\nHalaman dipindahkan ke Checkout.`);
        } else {
          alert(`Invoice QRIS terbit! Selesaikan pembayaran Anda di bawah.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 13: Admin manual triggers QRIS Invoice
  const handleTriggerManualQris = async (amount: number, custName: string) => {
    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, customerName: custName, type: "Topup" })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        setSelectedTxId(data.transaction.transactionId);
        alert(`Barcode QRIS manual berhasil dicetak untuk ${custName}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 14: Simulated Gate webhook response
  const handleSimulateWebhook = async (transactionId: string, status: 'Paid' | 'Expired') => {
    try {
      const res = await fetch("/api/qris/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, status })
      });
      if (res.ok) {
        await fetchAllData();
        alert("Simulasi Event Webhook Berhasil Terkirim! DB Pelanggan berhasil dimutasi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 15: Configure bot credentials
  const handleUpdateDisplayConfig = async (runningText: string, adsImages: string[], adminPassword?: string) => {
    try {
      const res = await fetch("/api/display/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runningText, adsImages, adminPassword })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBotConfig = async (
    provider: 'WhatsApp' | 'Telegram', 
    apiKey: string, 
    welcomeMessage: string, 
    autoRepliesEnabled: boolean
  ) => {
    try {
      const res = await fetch("/api/bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, welcomeMessage, autoRepliesEnabled })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 16: Bots Incoming message simulation
  const handleSimulateBotMessage = async (
    provider: 'WhatsApp' | 'Telegram',
    messageText: string,
    senderPhoneOrUser: string,
    senderName: string
  ) => {
    try {
      const res = await fetch("/api/bot/simulate-incoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, messageText, senderPhoneOrUser, senderName })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 17: Empty bots conversation logs
  const handleClearBotLogs = async () => {
    try {
      const res = await fetch("/api/bot/clear-logs", { method: "POST" });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 18: MikroTik Config
  const handleUpdateMikrotik = async (updated: Partial<MikrotikConfig>) => {
    try {
      const res = await fetch("/api/mikrotik/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 19: MikroTik Disconnect
  const handleDisconnectMikrotik = async () => {
    try {
      const res = await fetch("/api/mikrotik/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API 20: Update QRISLY Configuration
  const handleUpdateQrislyConfig = async (newConfig: any) => {
    try {
      const res = await fetch("/api/qris/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Voucher & Paket", icon: Ticket },
    { label: "Member Portal", icon: Users },
    { label: "QRISLY Transactions", icon: QrCode },
    { label: "Bot Integration", icon: Bot },
    { label: "MikroTik Router", icon: Wifi },
    { label: "Customer Portal", icon: Smartphone },
    { label: "Tampilan Portal", icon: Layers },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans text-xs font-bold text-slate-500">
        <RefreshCw className="animate-spin text-indigo-600 mb-2" size={24} />
         Menyinkronkan Kredensial & Loket Hotspot Adila.Net...
      </div>
    );
  }

  if (userRole === "guest") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 relative overflow-hidden font-sans">
        {/* Ambient background light effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header decoration */}
        <header className="p-6 flex justify-between items-center z-10 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Wifi size={16} />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-white">ADILA.NET</span>
          </div>
          <span className="text-[9px] bg-indigo-950/40 border border-indigo-900/50 font-bold font-mono text-indigo-400 px-3 py-1 rounded-full uppercase tracking-wider">
            Portal Gateway
          </span>
        </header>

        {/* Center Card Selection / Form */}
        <div className="flex-1 flex items-center justify-center p-4 z-10">
          <div className="max-w-md w-full space-y-8">
            
            {/* Title / Hero */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                Sistem Hotspot <span className="text-indigo-400 font-extrabold">Adila.Net</span>
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                Pilih akses masuk di bawah untuk melanjutkan ke halaman portal atau panel administrator.
              </p>
            </div>

            {/* If not submitting administrative password form */}
            {!isAdminLoginFormOpen ? (
              <div className="grid grid-cols-1 gap-4">
                {/* 1. MEMBER / CUSTOMER PORTAL */}
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("customer");
                    setActiveTab("Customer Portal");
                  }}
                  className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 p-6 rounded-2xl text-left transition duration-200 shadow-md cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-950 border border-emerald-900/50 group-hover:scale-105 transition duration-150 p-3 rounded-xl text-emerald-400 shadow-sm">
                      <Smartphone size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        Portal Member & Pelanggan
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Masuk untuk cek saldo deposit, beli voucher WiFi instan, dan melihat mutasi transfer QRIS Anda.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2. ADMIN PORTAL */}
                <button
                  type="button"
                  onClick={() => setIsAdminLoginFormOpen(true)}
                  className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-855 hover:border-slate-800 p-6 rounded-2xl text-left transition duration-200 shadow-md cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-950 border border-indigo-900/50 group-hover:scale-105 transition duration-150 p-3 rounded-xl text-indigo-400 shadow-sm">
                      <LayoutDashboard size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        Operator & Admin Dashboard
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Kelola paket bandwith, cetak voucher massal, atur router Mikrotik, dan integrasi Sanpay.id.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            ) : (
              // ADMIN PASSWORD COMPONENT
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase">Authentication Operator</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAdminLoginFormOpen(false);
                      setAdminPasswordInput("");
                      setAdminAuthError("");
                    }} 
                    className="text-slate-400 hover:text-white transition text-xs font-semibold cursor-pointer border-none bg-transparent"
                  >
                    Batal
                  </button>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  {adminAuthError && (
                    <div className="p-3 bg-red-955/60 text-red-400 border border-red-900 text-[11px] rounded-xl font-medium font-sans">
                      ⚠️ {adminAuthError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Kata Sandi Administrator</label>
                    <input 
                      type="password" 
                      required
                      autoFocus
                      placeholder="Masukkan kata sandi"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 hover:border-slate-700/60 focus:border-indigo-500 px-3.5 py-2.5 rounded-xl outline-none text-white font-mono placeholder:text-slate-600 transition"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-none"
                  >
                    <LogIn size={14} />
                    Verifikasi Operator
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Footer info */}
        <footer className="p-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-wider">
          SISTEM KEAMANAN TERINTEGRASI &copy; 2026 ADILA.NET &bull; PORT 3000
        </footer>
      </div>
    );
  }

  if (userRole === "customer") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans text-slate-300">
        <header className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-indigo-400 animate-pulse" />
            <span className="font-extrabold text-xs tracking-wider text-white">ADILA.NET PORTAL MEMBER</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setCurrentCustomer(null);
              setUserRole("guest");
            }}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-800 transition cursor-pointer"
          >
            <LogOut size={11} /> Kembali ke Menu
          </button>
        </header>
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
          <CustomerPortal 
            currentCustomer={currentCustomer}
            vouchers={vouchers}
            packages={packages}
            onLogin={handlePortalLogin}
            onRegister={handlePortalRegister}
            onLogout={() => {
              setCurrentCustomer(null);
              setUserRole("guest");
            }}
            onBuyVoucherWithSaldo={handleBuyVoucherWithSaldo}
            onTriggerQrisInvoice={handleTriggerQrisInvoice}
            transactions={transactions}
            qrislyConfig={qrislyConfig}
            selectedTxId={selectedTxId}
            onSelectTx={(txId) => setSelectedTxId(txId)}
            onSimulateWebhook={handleSimulateWebhook}
            displayConfig={displayConfig}
          />
        </div>
        <footer className="py-4 text-center text-[10px] text-slate-600 border-t border-slate-850 bg-slate-950/40">
          POWERED BY ADILA.NET &bull; SECURE LOCAL HOTSPOT CLIENT
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-100 transition-colors duration-150">
      
      {/* 1. SIDE NAVIGATION BAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        <div className="space-y-6 pt-6 px-5">
          
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md">
              <Wifi size={20} className="animate-bounce" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">WIFI VOUCHER</h1>
              <p className="text-[10px] text-indigo-400 font-mono font-medium tracking-widest mt-0.5">ADILA GATEWAY</p>
            </div>
          </div>

          <nav className="space-y-1.5 select-none text-xs font-semibold">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.label);
                    // Clear selected invoice view if transitioning away from transactions
                    if (item.label !== "QRISLY Transactions") {
                      setSelectedTxId(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md font-bold' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={12} className={`opacity-40 transition-transform ${isActive ? 'translate-x-0.5' : ''}`} />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] space-y-1 font-mono text-zinc-400">
            <div>Owner: peciwaru@gmail.com</div>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>QRISLY Hook: ACTIVE</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleResetSystemState}
            className="w-full text-center bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 font-bold py-2 rounded-xl text-[10px] transition font-mono cursor-pointer"
          >
            SINKRON ULANG DATA
          </button>

          <button 
            type="button"
            onClick={() => {
              setUserRole("guest");
            }}
            className="w-full text-center bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 hover:text-rose-300 font-bold py-2 rounded-xl text-[10px] transition font-mono cursor-pointer"
          >
            KELUAR ADMIN
          </button>
        </div>
      </aside>

      {/* 2. RESPONSIVE MOBILE NAVIGATION FOR DIRECT COMFORT ON ANDROID/IOS */}
      {/* 2a. Mobile Sticky Header with Current Page Breadcrumb */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-150 dark:border-slate-800 px-4 flex items-center justify-between z-30 shadow-2xs transition-colors">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Wifi size={14} className="animate-pulse" />
          </div>
          <span className="font-extrabold text-xs tracking-wider text-slate-800 dark:text-white font-sans">ADILA.NET</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title={darkMode ? "Mode Terang" : "Mode Gelap"}
          >
            {darkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
          </button>
          <div className="bg-indigo-50 dark:bg-indigo-950/65 border border-indigo-100/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wide font-mono">
            {activeTab}
          </div>
        </div>
      </div>

      {/* 2b. Fixed iOS & Android style Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/50 flex items-center justify-around z-40 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-[safe-area-inset-bottom]">
        <button
          onClick={() => {
            setActiveTab("Dashboard");
            setSelectedTxId(null);
            setIsLainnyaOpen(false);
          }}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === "Dashboard" && !isLainnyaOpen ? "text-indigo-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-1 tracking-tight font-medium font-sans">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("Voucher & Paket");
            setSelectedTxId(null);
            setIsLainnyaOpen(false);
          }}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === "Voucher & Paket" && !isLainnyaOpen ? "text-indigo-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Ticket size={18} />
          <span className="text-[9px] mt-1 tracking-tight font-medium font-sans">Voucher</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("Member Portal");
            setSelectedTxId(null);
            setIsLainnyaOpen(false);
          }}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === "Member Portal" && !isLainnyaOpen ? "text-indigo-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] mt-1 tracking-tight font-medium font-sans">Member</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("QRISLY Transactions");
            setIsLainnyaOpen(false);
          }}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === "QRISLY Transactions" && !isLainnyaOpen ? "text-indigo-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <QrCode size={18} />
          <span className="text-[9px] mt-1 tracking-tight font-medium font-sans">QRISLY</span>
        </button>

        <button
          onClick={() => setIsLainnyaOpen(!isLainnyaOpen)}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            isLainnyaOpen ? "text-indigo-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Menu size={18} />
          <span className="text-[9px] mt-1 tracking-tight font-medium font-sans">Lainnya</span>
        </button>
      </div>

      {/* 2c. Slide-Up bottom sheet menu list */}
      {isLainnyaOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 lg:hidden"
            onClick={() => setIsLainnyaOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 rounded-t-3xl pb-8 pt-5 px-6 z-50 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <button 
              type="button"
              onClick={() => setIsLainnyaOpen(false)}
              className="w-12 h-1 bg-slate-200 hover:bg-slate-300 rounded-full mx-auto mb-4 outline-none block border-none"
            />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black font-mono text-slate-400 uppercase tracking-widest">Pengaturan Tambahan</h3>
              <button 
                onClick={() => setIsLainnyaOpen(false)}
                className="text-xs font-bold text-indigo-600"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => {
                  setActiveTab("Bot Integration");
                  setIsLainnyaOpen(false);
                }}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                  activeTab === "Bot Integration" 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" 
                    : "bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-700"
                }`}
              >
                <div className="bg-indigo-600 text-white p-2 rounded-xl mb-2.5">
                  <Bot size={16} />
                </div>
                <span className="text-xs font-bold font-sans">WhatsApp Bot</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-sans">Simulasi reply transaksi</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("MikroTik Router");
                  setIsLainnyaOpen(false);
                }}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                  activeTab === "MikroTik Router" 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" 
                    : "bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-700"
                }`}
              >
                <div className="bg-sky-600 text-white p-2 rounded-xl mb-2.5">
                  <Wifi size={16} />
                </div>
                <span className="text-xs font-bold font-sans">MikroTik Router</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-sans">Kontrol IP bandwidth</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("Customer Portal");
                  setIsLainnyaOpen(false);
                }}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                  activeTab === "Customer Portal" 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" 
                    : "bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-700"
                }`}
              >
                <div className="bg-emerald-600 text-white p-2 rounded-xl mb-2.5">
                  <Smartphone size={16} />
                </div>
                <span className="text-xs font-bold font-sans">Portal Pelanggan</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-sans">Gunakan sebagai member</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("Tampilan Portal");
                  setIsLainnyaOpen(false);
                }}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                  activeTab === "Tampilan Portal" 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" 
                    : "bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-700"
                }`}
              >
                <div className="bg-purple-600 text-white p-2 rounded-xl mb-2.5">
                  <Layers size={16} />
                </div>
                <span className="text-xs font-bold font-sans">Tampilan Portal</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-sans">Seting Banner & Info</span>
              </button>

              <button
                onClick={() => {
                  setIsLainnyaOpen(false);
                  handleResetSystemState();
                }}
                className="flex flex-col items-start p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-150 text-slate-700 hover:text-rose-955 text-left transition"
              >
                <div className="bg-rose-600 text-white p-2 rounded-xl mb-2.5">
                  <Database size={16} />
                </div>
                <span className="text-xs font-bold font-sans">Sinkron Ulang</span>
                <span className="text-[9px] text-slate-400 mt-1 leading-tight font-sans">Kosongkan/Reset DB</span>
              </button>
            </div>

            <button
              onClick={() => {
                setUserRole("guest");
                setIsLainnyaOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-650 text-rose-600 font-extrabold py-3 rounded-2xl text-xs transition duration-150"
            >
              <LogOut size={14} />
              Keluar Sesi Administrator
            </button>
          </div>
        </>
      )}

      {/* 3. MAIN WORKSTAGE VIEWPORT */}
      <main className="flex-1 flex flex-col pt-14 pb-16 lg:pt-0 lg:pb-0 overflow-y-auto max-h-screen">
        
        {/* Top Breadcrumb header bar */}
        <header className="hidden lg:flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-4 transition-colors">
          <div className="text-xs font-mono text-slate-400 font-bold">
            WI-FI CENTER &rarr; <span className="text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wide">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-705 transition cursor-pointer"
              title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Gateway Engine: Sanpay.id Premium</span>
            </div>
          </div>
        </header>

        {/* Tab Routing logic container */}
        <div className="p-4 lg:p-8">
          {activeTab === "Dashboard" && (
            <DashboardOverview 
              vouchers={vouchers}
              packages={packages}
              customers={customers}
              transactions={transactions}
              botsConfig={botsConfig}
              mikrotik={mikrotik}
              dbStatus={dbStatus}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setSelectedTxId(null);
              }}
            />
          )}

          {activeTab === "Voucher & Paket" && (
            <VoucherManager 
              vouchers={vouchers}
              packages={packages}
              onAddPackage={handleAddPackage}
              onGenerateVouchers={handleGenerateVouchers}
              onClearAvailableVouchers={handleClearUnusedVouchers}
            />
          )}

          {activeTab === "Member Portal" && (
            <MemberManager 
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onTopupCustomerManual={handleTopupCustomerManual}
              onToggleCustomerStatus={handleToggleCustomerStatus}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === "QRISLY Transactions" && (
            <QrGateway 
              transactions={transactions}
              selectedTxId={selectedTxId}
              onSelectTx={(txId) => setSelectedTxId(txId)}
              onSimulateWebhook={handleSimulateWebhook}
              onTriggerManualQris={handleTriggerManualQris}
              qrislyConfig={qrislyConfig}
              onUpdateQrislyConfig={handleUpdateQrislyConfig}
            />
          )}

          {activeTab === "Bot Integration" && (
            <BotIntegration 
              configs={botsConfig}
              chatLogs={chatLogs}
              customers={customers}
              onUpdateConfig={handleUpdateBotConfig}
              onSimulateMessage={handleSimulateBotMessage}
              onClearLogs={handleClearBotLogs}
            />
          )}

          {activeTab === "MikroTik Router" && (
            <MikrotikPanel 
              config={mikrotik}
              vouchers={vouchers}
              onUpdateConfig={handleUpdateMikrotik}
              onDisconnect={handleDisconnectMikrotik}
            />
          )}

          {activeTab === "Customer Portal" && (
            <CustomerPortal 
              currentCustomer={currentCustomer}
              vouchers={vouchers}
              packages={packages}
              onLogin={handlePortalLogin}
              onRegister={handlePortalRegister}
              onLogout={() => setCurrentCustomer(null)}
              onBuyVoucherWithSaldo={handleBuyVoucherWithSaldo}
              onTriggerQrisInvoice={handleTriggerQrisInvoice}
              transactions={transactions}
              qrislyConfig={qrislyConfig}
              selectedTxId={selectedTxId}
              onSelectTx={(txId) => setSelectedTxId(txId)}
              onSimulateWebhook={handleSimulateWebhook}
              displayConfig={displayConfig}
            />
          )}

          {activeTab === "Tampilan Portal" && (
            <DisplayConfigPanel 
              displayConfig={displayConfig}
              onUpdateDisplayConfig={handleUpdateDisplayConfig}
            />
          )}
        </div>

        {/* Dynamic visual copyright credit line */}
        <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-4 px-8 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono transition-colors duration-150">
          <div className="flex items-center justify-center gap-1.5">
            <span>Sistem Pemasaran Voucher Hotspot & gateway QRISLY</span>
            <span>&bull;</span>
            <span className="flex items-center gap-0.5">Crafted with <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" /> for peciwaru@gmail.com</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
