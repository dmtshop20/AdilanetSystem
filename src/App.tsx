import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import UnifiedLogin from "./components/UnifiedLogin";
import DashboardOverview from "./components/DashboardOverview";
import VoucherManager from "./components/VoucherManager";
import MemberManager from "./components/MemberManager";
import QrGateway from "./components/QrGateway";
import BotIntegration from "./components/BotIntegration";
import MikrotikPanel from "./components/MikrotikPanel";
import DisplayConfigPanel from "./components/DisplayConfigPanel";
import CustomerPortal from "./components/CustomerPortal";
import {
  LogOut,
  LayoutDashboard,
  Ticket,
  Users,
  QrCode,
  Bot,
  Wifi,
  Layers,
  User,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";
import {
  CustomerAccount,
  Voucher,
  VoucherPackage,
  QrisTransaction,
} from "./types";

// App shell for Android-First Responsive Admin
function AdminLayout({ children, onLogout, darkMode, toggleDarkMode }: any) {
  const navigate = useNavigate();
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, name: "Dash", path: "/admin" },
    { icon: <Ticket size={20} />, name: "Voucher", path: "/admin/vouchers" },
    { icon: <Wifi size={20} />, name: "MikroTik", path: "/admin/mikrotik" },
    { icon: <QrCode size={20} />, name: "Qris", path: "/admin/gateway" },
    { icon: <Users size={20} />, name: "Member", path: "/admin/members" },
  ];

  const secondaryMenuItems = [
    { icon: <Bot size={20} />, name: "Bot Service", path: "/admin/bot" },
    { icon: <Layers size={20} />, name: "Displays", path: "/admin/displays" },
  ];

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col items-center py-6 text-white overflow-y-auto shrink-0 z-10 shadow-2xl">
        <h1 className="text-xl font-extrabold flex items-center gap-2 mb-8 text-indigo-400">
          <Wifi /> Adila.Net Admin
        </h1>
        <nav className="w-full px-4 space-y-2">
          {[...menuItems, ...secondaryMenuItems].map((k) => (
            <button
              key={k.name}
              onClick={() => navigate(k.path)}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {k.icon} {k.name}
            </button>
          ))}
          <div className="pt-4 border-t border-slate-800 w-full mt-4">
            <button
              onClick={toggleDarkMode}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />} Tema Warna
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={18} /> Keluar
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-900/50">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-20">
          <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Wifi size={20} /> Adila.Net
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-indigo-500 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-24 md:pb-8">{children}</div>
        </main>

        {/* Android / Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
          <div className="flex items-center justify-around p-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

function MainApp() {
  const [userRole, setUserRole] = useState<"guest" | "admin" | "customer">(
    () => {
      return (
        (localStorage.getItem("wifi_user_role") as
          | "guest"
          | "admin"
          | "customer") || "guest"
      );
    },
  );

  const [currentCustomer, setCurrentCustomer] =
    useState<CustomerAccount | null>(() => {
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

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("wifi_dark_mode") === "true";
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("wifi_dark_mode", String(nextVal));
  };

  // Common State (We'll still fetch all this here for simplicity in this port)
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<VoucherPackage[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [transactions, setTransactions] = useState<QrisTransaction[]>([]);
  const [mikrotik, setMikrotik] = useState<any>({ isConnected: false });
  const [dbStatus, setDbStatus] = useState<any>({});
  const [qrislyConfig, setQrislyConfig] = useState<any>({});
  const [displayConfig, setDisplayConfig] = useState<any>({});
  const [botsConfig, setBotsConfig] = useState<any>([]);
  const [chatLogs, setChatLogs] = useState<any>([]);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
        setPackages(data.packages || []);
        setCustomers(data.customers || []);
        setTransactions(data.transactions || []);
        setMikrotik(data.mikrotik || mikrotik);
        setQrislyConfig(data.sanpayConfig || qrislyConfig);
        setDbStatus(data.dbStatus || dbStatus);
        setBotsConfig(data.botsConfig || []);
        setChatLogs(data.chatLogs || []);
        setDisplayConfig(data.displayConfig || displayConfig);
      }
    } catch (e) {
      console.warn("Could not fetch realtime state from node server", e);
    }
  };

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 30000); // 30s auto sync
    return () => clearInterval(id);
  }, []);

  const handleLoginSuccess = (
    role: "admin" | "customer",
    userData?: typeof currentCustomer,
  ) => {
    setUserRole(role);
    localStorage.setItem("wifi_user_role", role);
    if (role === "customer" && userData) {
      setCurrentCustomer(userData);
      localStorage.setItem("wifi_current_customer", JSON.stringify(userData));
    }
  };

  const handleLogout = () => {
    setUserRole("guest");
    setCurrentCustomer(null);
    localStorage.removeItem("wifi_user_role");
    localStorage.removeItem("wifi_current_customer");
    window.location.href = "/";
  };

  // Basic API wrappers for Portal
  const portalRegister = async (
    name: string,
    username: string,
    phone: string,
    password?: string,
  ) => {
    const res = await fetch("/api/customers/portal/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, phone, password }),
    });
    return res.ok;
  };

  const portalBuyWithSaldo = async (packageId: string) => {
    if (!currentCustomer) return;
    try {
      const r = await fetch("/api/vouchers/buy-with-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: currentCustomer.id, packageId }),
      });
      if (r.ok) {
        alert("Pembelian berhasil diproses.");
        await fetchState();
      }
    } catch (e) {}
  };

  const portalQrisTopup = async (
    amount: number,
    type: "Topup" | "DirectBuy",
    packageId?: string,
  ) => {
    if (!currentCustomer) return;
    try {
      const r = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: currentCustomer.id,
          amount,
          type,
          packageId,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.success) setSelectedTxId(d.transaction.transactionId);
        await fetchState();
      }
    } catch (e) {}
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            userRole === "admin" ? (
              <Navigate to="/admin" />
            ) : userRole === "customer" ? (
              <Navigate to="/portal" />
            ) : (
              <UnifiedLogin
                onLoginSuccess={handleLoginSuccess}
                onRegisterCustom={() => {}}
              />
            )
          }
        />

        <Route
          path="/portal"
          element={
            userRole === "customer" && currentCustomer ? (
              <div
                className={`min-h-screen ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 hover:bg-slate-100"}`}
              >
                <header className="bg-slate-900 text-white p-4 flex justify-between items-center z-50">
                  <div className="flex items-center gap-2 font-bold">
                    <Wifi /> Portal Member
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={toggleDarkMode}>
                      <Sun size={18} />
                    </button>
                    <div className="bg-indigo-600 px-3 py-1 rounded text-xs">
                      Saldo: {currentCustomer.saldo}
                    </div>
                  </div>
                </header>
                <div className="p-4 max-w-4xl mx-auto">
                  <CustomerPortal
                    currentCustomer={
                      customers.find((c) => c.id === currentCustomer.id) ||
                      currentCustomer
                    }
                    vouchers={vouchers}
                    packages={packages}
                    transactions={transactions}
                    qrislyConfig={qrislyConfig}
                    onLogout={handleLogout}
                    onBuyVoucherWithSaldo={portalBuyWithSaldo}
                    onRegister={portalRegister}
                    onLogin={async () => true}
                    selectedTxId={selectedTxId}
                    onSelectTx={setSelectedTxId}
                    onTriggerQrisInvoice={portalQrisTopup}
                    onSimulateWebhook={async (tx, status) => {}}
                    displayConfig={displayConfig}
                  />
                </div>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/admin/*"
          element={
            userRole === "admin" ? (
              <AdminLayout
                onLogout={handleLogout}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              >
                <Routes>
                  <Route
                    path=""
                    element={
                      <DashboardOverview
                        vouchers={vouchers}
                        packages={packages}
                        customers={customers}
                        transactions={transactions}
                        mikrotik={mikrotik}
                        dbStatus={dbStatus}
                        botsConfig={botsConfig}
                        onNavigate={() => {}}
                      />
                    }
                  />
                  <Route
                    path="vouchers"
                    element={
                      <VoucherManager
                        vouchers={vouchers}
                        packages={packages}
                        onAddPackage={() => {}}
                        onGenerateVouchers={() => {}}
                        onClearAvailableVouchers={() => {}}
                      />
                    }
                  />
                  <Route
                    path="members"
                    element={
                      <MemberManager
                        customers={customers}
                        onAddCustomer={() => {}}
                        onTopupCustomerManual={() => {}}
                        onToggleCustomerStatus={() => {}}
                        onDeleteCustomer={() => {}}
                      />
                    }
                  />
                  <Route
                    path="mikrotik"
                    element={
                      <MikrotikPanel
                        config={mikrotik}
                        vouchers={vouchers}
                        onUpdateConfig={() => {}}
                        onDisconnect={() => {}}
                      />
                    }
                  />
                  <Route
                    path="gateway"
                    element={
                      <QrGateway
                        transactions={transactions}
                        selectedTxId={selectedTxId}
                        onSelectTx={setSelectedTxId}
                        onSimulateWebhook={async () => {}}
                        onTriggerManualQris={() => {}}
                        qrislyConfig={qrislyConfig}
                        onUpdateQrislyConfig={async () => {}}
                      />
                    }
                  />
                  <Route
                    path="bot"
                    element={
                      <BotIntegration
                        configs={botsConfig}
                        chatLogs={chatLogs}
                        customers={customers}
                        onUpdateConfig={() => {}}
                        onSimulateMessage={() => {}}
                        onClearLogs={() => {}}
                      />
                    }
                  />
                  <Route
                    path="displays"
                    element={
                      <DisplayConfigPanel
                        displayConfig={displayConfig}
                        onUpdateDisplayConfig={() => {}}
                      />
                    }
                  />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default MainApp;
