import React, { useState, useEffect } from "react";
import {
  User,
  Wallet,
  Ticket,
  ShoppingBag,
  Plus,
  Copy,
  LogOut,
  UserPlus,
  LogIn,
  Wifi,
  Check,
  ArrowRight,
  Info,
  QrCode,
  Smartphone,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Search,
  Lock,
} from "lucide-react";
import {
  CustomerAccount,
  VoucherPackage,
  Voucher,
  QrisTransaction,
  AppDisplayConfig,
} from "../types";

interface Props {
  currentCustomer: CustomerAccount | null;
  vouchers: Voucher[];
  packages: VoucherPackage[];
  onLogin: (username: string, password?: string) => Promise<boolean>;
  onRegister: (
    name: string,
    username: string,
    phone: string,
    password?: string,
  ) => Promise<boolean>;
  onLogout: () => void;
  onBuyVoucherWithSaldo: (packageId: string) => void;
  onTriggerQrisInvoice: (
    amount: number,
    type: "Topup" | "DirectBuy",
    packageId?: string,
  ) => void;
  transactions: QrisTransaction[];
  qrislyConfig: any;
  selectedTxId: string | null;
  onSelectTx: (txId: string | null) => void;
  onSimulateWebhook: (
    transactionId: string,
    status: "Paid" | "Expired",
  ) => Promise<void>;
  displayConfig?: AppDisplayConfig;
}

export default function CustomerPortal({
  currentCustomer,
  vouchers,
  packages,
  onLogin,
  onRegister,
  onLogout,
  onBuyVoucherWithSaldo,
  onTriggerQrisInvoice,
  transactions,
  qrislyConfig,
  selectedTxId,
  onSelectTx,
  onSimulateWebhook,
  displayConfig,
}: Props) {
  // Auth screen toggle
  const [isAdminMode, setIsAdminMode] = useState(false); // To let them switch easily if desired
  const [isRegister, setIsRegister] = useState(false);

  // Login states
  const [loginUser, setLoginUser] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register form states
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regError, setRegError] = useState("");

  // Portal App state for bottom nav and connect
  const [activePortalTab, setActivePortalTab] = useState<
    "home" | "buy" | "vouchers" | "history"
  >("home");
  const [connectedVoucherId, setConnectedVoucherId] = useState<string | null>(
    null,
  );
  const [isConnectingWifi, setIsConnectingWifi] = useState(false);
  const [connectionTimeLeft, setConnectionTimeLeft] = useState<string>("");

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    if (
      !displayConfig ||
      !displayConfig.adsImages ||
      displayConfig.adsImages.length === 0
    )
      return;
    const intervalId = setInterval(() => {
      setCurrentSlideIndex(
        (prev) => (prev + 1) % displayConfig.adsImages.length,
      );
    }, 4000);
    return () => clearInterval(intervalId);
  }, [displayConfig]);

  // Topup form states
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("20000");

  // Local notification copy banner
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter active transaction if selected and belongs to our logged-in customer
  const activeTx = transactions.find(
    (t) =>
      t.customerId === currentCustomer?.id &&
      (t.id === selectedTxId || t.transactionId === selectedTxId),
  );

  const autoInterval = qrislyConfig?.autoCheckInterval || 5;

  const [pollCountdown, setPollCountdown] = useState(autoInterval);
  const [isPolling, setIsPolling] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string>(
    "Sistem standby, siap melacak.",
  );
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);

  // Background Auto-polling checker if an invoice is in 'Pending' state
  useEffect(() => {
    if (!activeTx || activeTx.status !== "Pending") return;

    setPollCountdown(autoInterval);
    setLastCheckMessage("Menjadwalkan pemeriksaan berkala...");

    const checkIntervalId = setInterval(async () => {
      try {
        setIsPolling(true);
        setLastCheckMessage(`Menghubungi endpoint verifikasi...`);

        const res = await fetch(
          `/api/qris/check-status/${activeTx.transactionId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setRawApiResponse(
            data.apiStatusResponse || {
              info: "Berjalan dalam mode simulasi",
              status: data.transactionStatus,
            },
          );

          if (data.transactionStatus === "Paid") {
            setLastCheckMessage("🎉 Pembayaran terverifikasi lunas!");
            clearInterval(checkIntervalId);
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setLastCheckMessage(
              `Dicek pada ${new Date().toLocaleTimeString()} - Status: Belum Bayar.`,
            );
          }
        }
      } catch (err) {
        console.error("Auto tracking QRIS err:", err);
        setLastCheckMessage("Gagal menyambung ke server pelacak.");
      } finally {
        setIsPolling(false);
        setPollCountdown(autoInterval);
      }
    }, autoInterval * 1000);

    // Countdown visual effect
    const countdownId = setInterval(() => {
      setPollCountdown((c) => (c > 1 ? c - 1 : autoInterval));
    }, 1000);

    return () => {
      clearInterval(checkIntervalId);
      clearInterval(countdownId);
    };
  }, [activeTx, autoInterval]);

  // Handle WiFi connection simulation
  useEffect(() => {
    let interval: any;
    if (connectedVoucherId) {
      const activeVouch = vouchers.find((v) => v.id === connectedVoucherId);
      if (activeVouch) {
        // Calculate remaining time
        interval = setInterval(() => {
          const expiresEnd = new Date(activeVouch.expiresAt).getTime();
          const now = new Date().getTime();
          const diff = expiresEnd - now;

          if (diff <= 0) {
            setConnectedVoucherId(null);
            setConnectionTimeLeft("WAKTU HABIS");
            clearInterval(interval);
          } else {
            const h = Math.floor(
              (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setConnectionTimeLeft(`${h}j ${m}m ${s}d`);
          }
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [connectedVoucherId, vouchers]);

  const handleManualStatusCheck = async () => {
    if (!activeTx) return;
    try {
      setManualCheckLoading(true);
      setLastCheckMessage("Mengecek status pembayaran langsung...");

      const res = await fetch(
        `/api/qris/check-status/${activeTx.transactionId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRawApiResponse(
          data.apiStatusResponse || {
            status: data.transactionStatus,
            note: "Pilih tombol simulasi di bawah jika sandbox.",
          },
        );

        if (data.transactionStatus === "Paid") {
          alert(
            "Selamat! Pembayaran Telah Diterima. Saldo Anda akan otomatis bertambah.",
          );
          window.location.reload();
        } else {
          alert(
            "Pembayaran belum terdeteksi. Silakan transfer nominal pas sesuai nominal sampai digit terakhir.",
          );
        }
      }
    } catch (err) {
      alert("Error memeriksa status pembayaran.");
    } finally {
      setManualCheckLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPassword) return;
    setIsLoading(true);
    setLoginError("");
    try {
      const success = await onLogin(loginUser, loginPassword);
      if (!success) {
        setLoginError(
          "Nama Pengguna (Username), No HP, atau Kata Sandi salah. Pilih 'Daftar' jika akun baru.",
        );
      }
    } catch (err) {
      setLoginError("Terjadi error sistem login. Silakan daftar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !regName ||
      !regUser ||
      !regPhone ||
      !regPassword ||
      !regConfirmPassword
    ) {
      setRegError("Harap isi semua kolom!");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi kata sandi yang Anda masukkan tidak cocok!");
      return;
    }
    setIsLoading(true);
    setRegError("");
    try {
      const success = await onRegister(regName, regUser, regPhone, regPassword);
      if (success) {
        setIsRegister(false);
        setLoginUser(regUser);
        setLoginPassword(regPassword);
        alert(
          "Pendaftaran berhasil! Silakan masuk menggunakan kata sandi Anda.",
        );
      } else {
        setRegError(
          "Username sudah terdaftar! Pilih username slang unik lain.",
        );
      }
    } catch (err) {
      setRegError("Gagal meregistrasi akun member baru.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConnectWifi = (voucherId: string) => {
    setIsConnectingWifi(true);
    setTimeout(() => {
      setConnectedVoucherId(voucherId);
      setIsConnectingWifi(false);
      alert(
        "Autentikasi Router Berhasil. Anda sekarang terhubung ke Internet!",
      );
    }, 1500);
  };

  const handleDisconnectWifi = () => {
    if (confirm("Putuskan koneksi WiFi saat ini?")) {
      setConnectedVoucherId(null);
      setConnectionTimeLeft("");
    }
  };

  // Get current logged-in customer vouchers
  const myVouchers = vouchers.filter((v) => v.soldTo === currentCustomer?.name);

  // Auth gate render
  if (!currentCustomer) {
    return (
      <div className="min-h-[550px] flex flex-col items-center p-2 sm:p-4">
        {/* LOGGED OUT RUNNING TEXT TICKER */}
        {displayConfig?.runningText && (
          <div className="w-full max-w-md overflow-hidden bg-indigo-950/30 border border-indigo-900/50 py-1.5 px-3 rounded-full flex items-center relative gap-2 mb-3">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <div className="whitespace-nowrap overflow-hidden relative flex-1">
              <div className="inline-block animate-[marquee_20s_linear_infinite] pl-[100%] text-[10px] sm:text-xs font-bold text-indigo-200 tracking-wide">
                {displayConfig.runningText}
              </div>
            </div>
          </div>
        )}

        {/* LOGGED OUT IMAGE SLIDER */}
        {displayConfig?.adsImages?.length > 0 && (
          <div className="w-full max-w-md relative aspect-[21/9] sm:aspect-[16/7] rounded-2xl overflow-hidden border border-slate-800 shadow-md mb-4 shrink-0">
            {displayConfig.adsImages.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt="Ad banner"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              />
            ))}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
              {displayConfig.adsImages.map((_: any, idx: number) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlideIndex ? "bg-indigo-500 w-3" : "bg-white/40"}`}
                ></span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-900 max-w-md w-full rounded-2xl border border-slate-850 shadow-xl overflow-hidden flex flex-col shrink-0">
          <div className="flex-1 p-5 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-md animate-pulse">
                <Wifi size={24} />
              </div>
              <h2 className="text-lg font-extrabold text-white">
                Portal Member WiFi Adila.Net
              </h2>
              <p className="text-xs text-slate-450 text-slate-400 leading-relaxed font-medium">
                Beli voucher hotspot kecepatan tinggi, langsung potong saldo
                deposit Anda kapan saja!
              </p>
            </div>

            {/* Form selectors Tabs */}
            <div className="flex border-b border-slate-850 pb-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setLoginError("");
                }}
                className={`flex-1 py-2 px-3 font-bold text-center border-b-2 transition-all cursor-pointer ${!isRegister ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-400"}`}
              >
                Masuk Member
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setRegError("");
                }}
                className={`flex-1 py-2 px-3 font-bold text-center border-b-2 transition-all cursor-pointer ${isRegister ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-400"}`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Error alerts */}
            {!isRegister && loginError && (
              <div className="p-3 bg-red-950/40 text-red-400 border border-red-900/50 text-[11px] rounded-xl font-medium font-sans">
                ⚠️ {loginError}
              </div>
            )}
            {isRegister && regError && (
              <div className="p-3 bg-red-950/40 text-red-400 border border-red-900/50 text-[11px] rounded-xl font-medium font-sans">
                ⚠️ {regError}
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Username / No HP WhatsApp
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-3 text-slate-500"
                      size={15}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan username, contoh: andi_wijaya"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-medium transition placeholder:text-slate-700 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Kata Sandi Akun
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-3 text-slate-500"
                      size={15}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan kata sandi portal Anda"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-medium transition placeholder:text-slate-700 font-sans font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white text-xs font-extrabold py-3 rounded-xl shadow-lg transition-all cursor-pointer disabled:bg-slate-800 disabled:text-slate-600 hover:scale-[1.02] active:scale-[0.98] border-none"
                >
                  <LogIn size={14} />
                  {isLoading ? "Menghubungkan..." : "Masuk ke Panel Portal"}
                </button>

                <div className="text-[10px] text-slate-500 font-mono flex flex-col items-center justify-center gap-1 text-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <div>
                    Akun uji coba:{" "}
                    <span className="font-bold text-indigo-400">
                      andi_wijaya
                    </span>
                  </div>
                  <div>
                    Kata sandi default:{" "}
                    <span className="font-bold text-indigo-400">
                      andi_wijaya123
                    </span>
                  </div>
                </div>
              </form>
            ) : (
              /* 2. REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap, contoh: Budi Santoso"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 px-3.5 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-medium transition placeholder:text-slate-700 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Pilih Username Unik (Sandi Toko)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. budilancar"
                    value={regUser}
                    onChange={(e) =>
                      setRegUser(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 px-3.5 py-3 rounded-xl outline-none focus:border-indigo-500 text-indigo-300 font-mono font-bold transition placeholder:text-slate-755"
                  />
                  <p className="text-[9px] text-slate-500 italic block">
                    Hanya huruf kecil, angka, dan underscore.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Nomor WhatsApp (Aktif)
                  </label>
                  <div className="relative">
                    <Smartphone
                      className="absolute left-3.5 top-3 text-slate-500"
                      size={15}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08123456789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 pl-10 pr-3 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-mono font-medium transition placeholder:text-slate-705"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Kata Sandi Akun Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-3 text-slate-500"
                      size={15}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 pl-10 pr-3 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-mono font-medium transition placeholder:text-slate-705"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                    Ulangi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-3 text-slate-500"
                      size={15}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Verifikasi kata sandi baru"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-850 hover:border-slate-800 pl-10 pr-3 py-3 rounded-xl outline-none focus:border-indigo-500 text-white font-mono font-medium transition placeholder:text-slate-705"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all cursor-pointer disabled:bg-slate-800 disabled:text-slate-600 hover:scale-[1.02] active:scale-[0.98] border-none"
                >
                  <UserPlus size={14} />
                  {isLoading ? "Mendaftarkan..." : "Selesaikan Pendaftaran"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PORTAL LOGGED IN VIEW
  return (
    <div className="relative pb-20 bg-slate-950 min-h-[600px] border border-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans max-w-md mx-auto sm:max-w-none">
      {/* Mobile status bar simulation */}
      <div className="bg-slate-900 text-slate-500 text-[10px] py-1 px-4 flex justify-between items-center font-mono font-bold border-b border-slate-850">
        <span>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="flex items-center gap-2">
          {connectedVoucherId ? (
            <Wifi size={10} className="text-emerald-400" />
          ) : (
            <Wifi size={10} />
          )}
          <span className="font-sans font-bold">100%</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* RUNNING TEXT TICKER */}
        {displayConfig?.runningText && (
          <div className="overflow-hidden bg-indigo-950/30 border border-indigo-900/50 py-1.5 px-3 rounded-full flex items-center relative gap-2 shrink-0">
            <Info size={12} className="text-indigo-400 shrink-0" />
            <div className="whitespace-nowrap overflow-hidden relative flex-1">
              <div className="inline-block animate-[marquee_20s_linear_infinite] pl-[100%] text-[10px] sm:text-xs font-bold text-indigo-200 tracking-wide">
                {displayConfig.runningText}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE SLIDER */}
        {displayConfig?.adsImages?.length > 0 && (
          <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            {displayConfig.adsImages.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt="Ad banner"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentSlideIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              />
            ))}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
              {displayConfig.adsImages.map((_: any, idx: number) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlideIndex ? "bg-indigo-500 w-3" : "bg-white/40"}`}
                ></span>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE CONNECTION OVERLAY (IF CONNECTED) */}
        {connectedVoucherId && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden animate-fade-in">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="w-14 h-14 bg-emerald-900/80 rounded-full flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/30">
              <Wifi size={28} className="animate-pulse" />
            </div>
            <h3 className="text-white font-extrabold text-sm mb-1">
              Terhubung ke Internet
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Sisa waktu akses WiFi Anda:
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 my-2 tracking-wider">
              {connectionTimeLeft || "Menghitung..."}
            </div>
            <button
              onClick={handleDisconnectWifi}
              className="mt-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-900/40 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Putuskan Sambungan
            </button>
          </div>
        )}

        {/* --- TAB CONTENT: HOME --- */}
        {activePortalTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            {/* Lobby User Banner */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 flex flex-col items-center sm:flex-row sm:justify-between gap-4 shadow-md">
              <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-lg shadow-inner ring-4 ring-slate-950/50">
                  {(currentCustomer.name || "M")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Halo, {currentCustomer.name}!
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    @{currentCustomer.username} &bull; Member Aktif
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-950/50 hover:bg-red-950/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-medium w-full sm:w-auto justify-center"
              >
                <LogOut size={13} />
                Keluar
              </button>
            </div>

            {/* Saldo Balance Card */}
            <div className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-900/40 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between gap-5">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] pointer-events-none transform">
                <Wallet size={180} />
              </div>
              <div className="space-y-1 relative">
                <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-300 uppercase">
                  SALDO DEPOSIT
                </span>
                <h2 className="text-3xl font-black tracking-tight text-white mb-2">
                  {formatRupiah(currentCustomer.saldo)}
                </h2>
                <div className="inline-flex items-center gap-1.5 text-[9px] bg-slate-950/50 text-slate-300 font-mono font-bold px-2.5 py-1 rounded-md border border-slate-800/80">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                  Saldo Aman
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTopupModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-900 font-bold text-xs text-white px-5 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all cursor-pointer border-none w-full"
              >
                <Plus size={16} />
                Isi Ulang Saldo via QRIS
              </button>
            </div>

            {/* Quick Actions / Shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setActivePortalTab("buy")}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-indigo-900/50 hover:bg-slate-850 transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-950/50 rounded-full flex items-center justify-center text-indigo-400">
                  <ShoppingBag size={18} />
                </div>
                <span className="font-bold text-xs text-slate-200">
                  Beli Paket
                </span>
              </div>
              <div
                onClick={() => setActivePortalTab("vouchers")}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-indigo-900/50 hover:bg-slate-850 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-950/50 rounded-full flex items-center justify-center text-amber-400">
                  <Ticket size={18} />
                </div>
                <span className="font-bold text-xs text-slate-200">
                  Voucher Saya
                </span>
              </div>
            </div>

            {/* 2. LIVE CHECKOUT IF AN ACTIVE TRANSACTION EXISTS */}
            {activeTx && (
              <div
                id="customer-active-checkout"
                className="bg-gradient-to-b from-slate-900 to-indigo-950/20 rounded-2xl border border-indigo-900/40 p-5 space-y-5 shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Status Checkout QRIS: {activeTx.note}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTx(null)}
                    className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer bg-slate-900 border border-slate-850 hover:bg-slate-850 px-2.5 py-1 rounded-lg"
                  >
                    <X size={12} /> Sembunyikan QRIS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* QR Code Canvas */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-900">
                    {activeTx.status === "Paid" ? (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <CheckCircle2
                          size={48}
                          className="text-emerald-400 animate-bounce"
                        />
                        <span className="font-bold text-xs text-white">
                          Pembayaran Sukses
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Saldo Anda Otomatis Bertambah
                        </span>
                      </div>
                    ) : activeTx.status === "Expired" ? (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
                        <AlertTriangle size={48} className="text-red-400" />
                        <span className="font-bold text-xs text-white">
                          Tagihan Expired
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Silakan buat ulang
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-3.5 rounded-2xl shadow-inner flex flex-col items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(activeTx.qrisPayload)}`}
                            alt="QRIS Sanpay Barcode"
                            className="w-[150px] h-[150px] object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-[8px] font-bold bg-indigo-950 border border-indigo-900/50 text-indigo-400 px-3.5 py-1.5 rounded-full font-mono mt-4 uppercase tracking-widest text-center">
                          SCAN BARCODE MANDIRI/E-WALLET/ALL BANK
                        </div>
                      </>
                    )}
                  </div>

                  {/* Price tag details */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono uppercase block">
                        NO ID INVOICE
                      </span>
                      <div className="text-sm font-extrabold text-indigo-400 font-mono tracking-wider">
                        {activeTx.transactionId}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Dibuat: {activeTx.createdAt}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 font-mono space-y-2.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Nominal Pengisian:
                        </span>
                        <span className="font-bold text-white">
                          {formatRupiah(activeTx.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-indigo-300 font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/20">
                        <span className="text-slate-400">
                          Kode Unik Verifikasi (+):
                        </span>
                        <span>+{activeTx.uniqueCode}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-2 text-sm">
                        <span className="font-bold text-slate-450 text-slate-400">
                          Total Wajib Transfer:
                        </span>
                        <span className="font-extrabold text-indigo-400 underline decoration-indigo-400/20 decoration-2">
                          {formatRupiah(activeTx.totalPayment)}
                        </span>
                      </div>
                    </div>

                    {activeTx.status === "Pending" && (
                      <div className="p-3 bg-amber-950/30 text-amber-500 border border-amber-900/40 rounded-xl text-[10px] leading-relaxed font-semibold">
                        ⚠️ <strong>PENTING:</strong> Transfer sebesar nominal
                        pas{" "}
                        <strong>{formatRupiah(activeTx.totalPayment)}</strong>{" "}
                        (jangan dibulatkan atau dikurangi) agar sistem
                        automatically mendeteksi status lunas Anda dalam 10
                        detik!
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE STATUS MONITOR & Webhook sandbox simulate */}
                {activeTx.status === "Pending" && (
                  <div className="bg-slate-950 text-slate-200 rounded-xl p-4 border border-slate-900 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400 border-b border-slate-900 pb-2">
                      <span className="flex items-center gap-1.5 tracking-wider">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        PELACAK QRISLY ADILA TIMESTAMPS
                      </span>
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950 border border-indigo-900/50 px-20 px-2.5 py-0.5 rounded-md">
                        Update {pollCountdown}s
                      </span>
                    </div>

                    <div className="text-[10px] space-y-1.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Infrastruktur Status:</span>
                        <span className="text-emerald-400 font-bold">
                          Connected Realtime &bull; Sandbox
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Hasil Verifikasi Gateway:</span>
                        <span className="text-amber-400 font-bold animate-pulse">
                          {lastCheckMessage}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2 font-sans">
                      <button
                        type="button"
                        onClick={handleManualStatusCheck}
                        disabled={manualCheckLoading}
                        className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white font-bold text-[10px] py-2.5 rounded-lg transition border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-900 disabled:text-slate-600"
                      >
                        <RefreshCw
                          size={11}
                          className={manualCheckLoading ? "animate-spin" : ""}
                        />
                        Cek Status Lunas Sekarang
                      </button>

                      {qrislyConfig?.mode !== "Production" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              confirm(
                                "Simulasikan Pembayaran QRIS Lunas Sukses menggunakan Pembayar Sandbox?",
                              )
                            ) {
                              await onSimulateWebhook(
                                activeTx.transactionId,
                                "Paid",
                              );
                              alert(
                                "Simulasi lunas sandbox diproses! Saldo akun otomatis bertambah.",
                              );
                              window.location.reload();
                            }
                          }}
                          className="flex-1 bg-emerald-650 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-2.5 rounded-lg transition border-none flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Sparkles size={11} />
                          Simulasi Webhook Lunas (Sandbox)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnostics raw log under panel */}
                {rawApiResponse && (
                  <div className="bg-slate-950 rounded-xl border border-slate-900 p-3 font-mono text-[9px] text-emerald-400 overflow-x-auto max-h-[120px]">
                    <span className="text-slate-500 block border-b border-slate-900 pb-1 mb-1 font-bold font-sans">
                      DIAGNOSTICS QRISLY RESPONSE:
                    </span>
                    <pre className="whitespace-pre">
                      {JSON.stringify(rawApiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: BUY PACKAGES --- */}
        {activePortalTab === "buy" && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-1 pt-2">
              <h2 className="font-extrabold text-white text-lg">Pilih Paket</h2>
              <p className="text-xs text-slate-400">
                Beli voucher WiFi langsung potong saldo deposit Anda.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {packages.map((p) => {
                const canAfford = currentCustomer.saldo >= p.price;
                return (
                  <div
                    key={p.id}
                    className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-md flex flex-col justify-between hover:border-indigo-900/50 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-400 font-bold px-2.5 py-0.5 rounded-md border border-indigo-900/30">
                          {p.speedLimit}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono font-bold">
                          {p.durationHours} Jam
                        </span>
                      </div>
                      <h4 className="font-extrabold text-white text-sm">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-450 text-slate-400 min-h-[30px] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-500 block font-mono uppercase tracking-wider">
                          BIAYA BELI
                        </span>
                        <span className="text-base font-black text-white">
                          {formatRupiah(p.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (!canAfford) {
                            if (
                              confirm(
                                "Saldo Anda tidak cukup. Buat pesanan QRIS top-up saldo sekarang?",
                              )
                            ) {
                              setIsTopupModalOpen(true);
                              setTopupAmount(p.price.toString());
                            }
                            return;
                          }
                          if (
                            confirm(
                              `Konfirmasi pembelian ${p.name}? Sisa saldo Anda akan berkurang Rp ${p.price}`,
                            )
                          ) {
                            onBuyVoucherWithSaldo(p.id);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                          canAfford
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                            : "bg-slate-950 text-slate-500 hover:bg-slate-850 border border-slate-900"
                        }`}
                      >
                        Beli Paket
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: MY VOUCHERS --- */}
        {activePortalTab === "vouchers" && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-1 pt-2 border-b border-slate-850 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Ticket size={20} className="text-indigo-400" />
                  Voucher Saya
                </h2>
                <p className="text-xs text-slate-400">
                  Total: {myVouchers.length} tiket aktif
                </p>
              </div>
            </div>

            {myVouchers.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500 font-medium">
                <Ticket size={48} className="mx-auto mb-4 text-slate-800" />
                <p className="text-sm text-slate-300 font-bold mb-1">
                  Tidak Ada Voucher
                </p>
                <p className="text-xs">Anda belum membeli paket apapun.</p>
                <button
                  onClick={() => setActivePortalTab("buy")}
                  className="mt-4 px-4 py-2 bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-900/60 transition-colors"
                >
                  Beli Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {myVouchers
                  .slice()
                  .reverse()
                  .map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-900 p-5 rounded-2xl border border-slate-850 relative overflow-hidden space-y-4 shadow-md"
                    >
                      <div className="absolute top-0 right-0 p-2 text-[9px] bg-indigo-950 border-l border-b border-indigo-900 text-indigo-400 font-bold font-mono rounded-bl-xl tracking-wider">
                        ACTIVE
                      </div>

                      <div className="space-y-1 pr-12">
                        <span className="text-[10px] text-slate-400 block font-mono font-semibold uppercase">
                          {v.packageName}
                        </span>
                        <div className="font-mono text-xl font-black text-white tracking-widest flex items-center gap-2 pt-1 border-b border-slate-800 pb-2">
                          {v.code}
                          <button
                            onClick={() => executeCopy(v.code)}
                            title="Salin Kode Voucher"
                            className="text-slate-500 hover:text-indigo-400 transition-colors"
                          >
                            {copiedCode === v.code ? (
                              <Check size={16} className="text-green-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-1.5 font-sans pb-2">
                        <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                          <span className="text-slate-500 font-medium font-sans">
                            Aktivasi:
                          </span>
                          <span className="font-mono font-bold text-indigo-300">
                            {v.activatedAt}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-red-950/20 p-2 rounded-lg border border-red-950/50">
                          <span className="text-red-400/70 font-medium font-sans">
                            Expired:
                          </span>
                          <span className="font-mono font-bold text-red-400">
                            {v.expiresAt}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnectWifi(v.id)}
                        disabled={
                          connectedVoucherId === v.id || isConnectingWifi
                        }
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all border-none shadow-md ${
                          connectedVoucherId === v.id
                            ? "bg-emerald-900/50 text-emerald-400 cursor-not-allowed border border-emerald-900"
                            : isConnectingWifi
                              ? "bg-slate-800 text-slate-500 cursor-wait"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                        }`}
                      >
                        <Wifi
                          size={16}
                          className={
                            isConnectingWifi && connectedVoucherId !== v.id
                              ? "animate-pulse"
                              : ""
                          }
                        />
                        {connectedVoucherId === v.id
                          ? "SEDANG TERHUBUNG"
                          : isConnectingWifi
                            ? "MENGOTENTIKASI..."
                            : "MULAI INTERNET SEKARANG"}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB CONTENT: MY TRANSACTIONS --- */}
        {activePortalTab === "history" && (
          <div className="space-y-4 animate-fade-in">
            <div className="px-1 pt-2 border-b border-slate-850 pb-3">
              <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
                <QrCode size={20} className="text-indigo-400" />
                Riwayat QRIS
              </h2>
              <p className="text-xs text-slate-400">
                Tagihan topup saldo deposit.
              </p>
            </div>

            {transactions.filter((t) => t.customerId === currentCustomer?.id)
              .length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500 font-medium">
                Mulai isi saldo menggunakan QRIS di beranda untuk melihat
                riwayat.
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {transactions
                  .filter((t) => t.customerId === currentCustomer?.id)
                  .slice()
                  .reverse()
                  .map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {t.createdAt}
                          </span>
                          <div className="font-mono font-bold text-white tracking-wider text-xs">
                            {t.transactionId}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                            t.status === "Paid"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50"
                              : t.status === "Pending"
                                ? "bg-amber-950/60 text-amber-400 border border-amber-900/50"
                                : "bg-red-950/60 text-red-400 border border-red-900/50"
                          }`}
                        >
                          {t.status === "Paid"
                            ? "LUNAS"
                            : t.status === "Pending"
                              ? "MENUNGGU"
                              : t.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">
                          Total Wajib Transfer
                        </span>
                        <span className="font-black font-mono text-indigo-400">
                          {formatRupiah(t.totalPayment)}
                        </span>
                      </div>

                      {t.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTx(t.transactionId);
                            setActivePortalTab("home"); // Switch to home to view active checkout
                            setTimeout(() => {
                              document
                                .getElementById("customer-active-checkout")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }, 50);
                          }}
                          className="w-full text-[10px] text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-3 py-2 rounded-lg transition-all cursor-pointer border-none"
                        >
                          Buka Barcode QRIS
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>{" "}
      {/* End scrollable content */}
      {/* --- FIXED BOTTOM NAVIGATION BAR --- */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-xl border-t border-slate-850 flex items-center justify-around px-2 z-10">
        <button
          onClick={() => setActivePortalTab("home")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activePortalTab === "home" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"}`}
        >
          <User
            size={20}
            className={
              activePortalTab === "home"
                ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                : ""
            }
          />
          <span className="text-[9px] font-bold tracking-wide">Beranda</span>
        </button>
        <button
          onClick={() => setActivePortalTab("buy")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activePortalTab === "buy" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"}`}
        >
          <ShoppingBag
            size={20}
            className={
              activePortalTab === "buy"
                ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                : ""
            }
          />
          <span className="text-[9px] font-bold tracking-wide">Beli</span>
        </button>
        <button
          onClick={() => setActivePortalTab("vouchers")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${activePortalTab === "vouchers" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"}`}
        >
          {myVouchers.length > 0 && (
            <span className="absolute top-2 right-[25%] sm:right-[35%] w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-slate-950 pb-2"></span>
          )}
          <Ticket
            size={20}
            className={
              activePortalTab === "vouchers"
                ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                : ""
            }
          />
          <span className="text-[9px] font-bold tracking-wide">Voucher</span>
        </button>
        <button
          onClick={() => setActivePortalTab("history")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activePortalTab === "history" ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"}`}
        >
          <Clock
            size={20}
            className={
              activePortalTab === "history"
                ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                : ""
            }
          />
          <span className="text-[9px] font-bold tracking-wide">Riwayat</span>
        </button>
      </div>
      {/* --- TOP-UP QRIS DIALOG MODAL --- */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-850 p-6 max-w-sm w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <QrCode size={18} className="text-indigo-400" />
                Isi Ulang Saldo Terverifikasi
              </h3>
              <button
                onClick={() => setIsTopupModalOpen(false)}
                className="text-slate-400 hover:text-white transition duration-150 cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-400 leading-relaxed font-sans">
                Layanan gateway Sanpay.id mengubah kode QRIS statis merchant
                Anda menjadi dynamic invoice dengan total nominal unik agar
                mutasi lunas langsung terdeteksi otomatis.
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold font-mono text-slate-500 uppercase block tracking-wider">
                  Masukkan Jumlah Isi Ulang (Rp)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="1000000"
                  required
                  placeholder="e.g. 20000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full font-mono text-xl font-bold bg-slate-950 border border-slate-850 hover:border-slate-800 text-indigo-300 px-3 py-3 rounded-xl outline-none text-center focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="text-[10px] text-indigo-400 bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/30 leading-relaxed">
                ℹ️ Sistem akan menyisipkan kode unik (+Rp1 s.d +Rp499) secara
                melayang untuk deteksi instan tanpa konfirmasi manual.
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-850 font-sans">
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2.5 border border-slate-850 text-slate-400 rounded-xl hover:bg-slate-850 hover:text-white transition-all bg-transparent cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseInt(topupAmount);
                    if (isNaN(amt) || amt < 1000) {
                      alert("Minimal isi ulang adalah Rp 1.000");
                      return;
                    }
                    onTriggerQrisInvoice(amt, "Topup");
                    setIsTopupModalOpen(false);
                  }}
                  className="text-xs font-extrabold px-4 py-2.5 bg-indigo-650 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg transition-all cursor-pointer border-none"
                >
                  Buat Barcode QRIS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
