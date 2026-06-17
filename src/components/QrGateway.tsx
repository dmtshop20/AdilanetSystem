import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  CreditCard,
  ChevronRight,
  Database,
  Search,
  Sparkles,
  RefreshCw,
  BellRing,
  Settings,
  Globe,
  Terminal,
  Info,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { QrisTransaction } from "../types";

interface Props {
  transactions: QrisTransaction[];
  selectedTxId: string | null;
  onSelectTx: (txId: string | null) => void;
  onSimulateWebhook: (
    transactionId: string,
    status: "Paid" | "Expired",
  ) => Promise<void>;
  onTriggerManualQris: (amount: number, custName: string) => void;
  qrislyConfig: {
    apiKey: string;
    merchantId: string;
    mode: "Simulation" | "Production";
    autoCheckInterval: number;
    enabled: boolean;
  };
  onUpdateQrislyConfig: (newConfig: any) => Promise<void>;
}

export default function QrGateway({
  transactions,
  selectedTxId,
  onSelectTx,
  onSimulateWebhook,
  onTriggerManualQris,
  qrislyConfig,
  onUpdateQrislyConfig,
}: Props) {
  const [copiedText, setCopiedText] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom manual deposit state
  const [manualName, setManualName] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  // Configuration States (Sanpay Gateway)
  const [activeGateway, setActiveGateway] = useState<"Sanpay">("Sanpay");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [autoInterval, setAutoInterval] = useState(5);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Sanpay config states
  const [sanpayApiKey, setSanpayApiKey] = useState("");
  const [sanpayMerchantId, setSanpayMerchantId] = useState("");
  const [sanpaySecretKey, setSanpaySecretKey] = useState("");
  const [sanpayMode, setSanpayMode] = useState<"Simulation" | "Production">(
    "Simulation",
  );
  const [showSanpaySecret, setShowSanpaySecret] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Gemini AI Studio Secrets info
  const [envSecretsActive, setEnvSecretsActive] = useState<{
    apiKey: boolean;
    merchantId: boolean;
    secretKey: boolean;
  }>({
    apiKey: false,
    merchantId: false,
    secretKey: false,
  });

  // Polling states on active checkout
  const [isPolling, setIsPolling] = useState(false);
  const [pollCountdown, setPollCountdown] = useState(autoInterval);
  const [lastCheckMessage, setLastCheckMessage] = useState<string>(
    "Sistem standby, siap melacak.",
  );
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);

  // Fetch Sanpay gateway config from backend on mount or when config accordion opens
  useEffect(() => {
    const fetchGatewayConfig = async () => {
      try {
        const res = await fetch("/api/qris/gateway-config");
        if (res.ok) {
          const data = await res.json();
          if (data.sanpayConfig) {
            setSanpayApiKey(data.sanpayConfig.apiKey || "");
            setSanpayMerchantId(data.sanpayConfig.merchantId || "");
            setSanpaySecretKey(data.sanpayConfig.secretKey || "");
            setSanpayMode(data.sanpayConfig.mode || "Simulation");
            if (data.sanpayConfig.envSecretsActive) {
              setEnvSecretsActive(data.sanpayConfig.envSecretsActive);
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil konfigurasi gateway:", err);
      }
    };
    fetchGatewayConfig();
  }, [isConfigOpen]);

  const activeTx = transactions.find(
    (t) => t.id === selectedTxId || t.transactionId === selectedTxId,
  );

  // Background Auto-polling checker if an invoice is in 'Pending' state
  useEffect(() => {
    if (!activeTx || activeTx.status !== "Pending") return;

    setPollCountdown(autoInterval);
    setLastCheckMessage("Menjadwalkan pemeriksaan berkala...");

    const checkIntervalId = setInterval(async () => {
      try {
        setIsPolling(true);
        setLastCheckMessage(
          `Menghubungi endpoint verifikasi untuk ${activeTx.transactionId}...`,
        );

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
            // Wait 1.5 seconds and perform window reload to update entire client state smoothly
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

  const handleManualStatusCheck = async () => {
    if (!activeTx) return;
    try {
      setManualCheckLoading(true);
      setLastCheckMessage(
        "Mengecek status pembayaran langsung ke sanpay.site...",
      );

      const res = await fetch(
        `/api/qris/check-status/${activeTx.transactionId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRawApiResponse(
          data.apiStatusResponse || {
            status: data.transactionStatus,
            note: "Server verifikator sandbox memberi sinyal standby.",
          },
        );

        if (data.transactionStatus === "Paid") {
          alert(
            "Selamat! Pembayaran Telah Diterima. Paket Voucher Wifi otomatis aktif.",
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

  const saveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const payload = {
        sanpayConfig: {
          apiKey: sanpayApiKey,
          merchantId: sanpayMerchantId,
          secretKey: sanpaySecretKey,
          mode: sanpayMode,
          enabled: true,
        },
      };

      const res = await fetch("/api/qris/gateway-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsConfigOpen(false);
        alert(
          `✅ Kredensial Payment Gateway sanpay.site berhasil disimpan secara aman server-side!`,
        );
      } else {
        alert("Gagal melakukan sinkronisasi kredensial ke server backend.");
      }
    } catch (err) {
      alert("Gagal menyimpan kredensial.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const copyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const transactionsSafe = transactions || [];

  const filteredTxs = transactionsSafe
    .filter((t) => {
      return (
        (t?.customerName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (t?.transactionId || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (t?.status || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .reverse(); // Latest transaction first

  return (
    <div className="space-y-6">
      {/* 0. CONFIGURATION & GATEWAY MANAGEMENT BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              INTEGRASI PREMIUM SANPAY.SITE
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">
              Sanpay.site Gateway Hub
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Saluran verifikasi QRIS otomatis berbasis callback webhook dan
              simulasi terintegrasi. Menghubungkan secara langsung dengan server
              API sanpay.site untuk validasi pembayaran instan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono ${
                sanpayMode === "Production"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sanpayMode === "Production"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500 animate-pulse"
                }`}
              ></span>
              {sanpayMode === "Production"
                ? "LIVE PRODUCTION API"
                : "SIMULATION SANDBOX"}
            </span>

            {Object.values(envSecretsActive).some(Boolean) && (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5 font-mono animate-pulse">
                <Sparkles size={11} className="text-indigo-450" />
                SECRET ACTIVE
              </span>
            )}

            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Settings
                size={14}
                className={isConfigOpen ? "animate-spin" : ""}
              />
              Setelan Gateway
            </button>
          </div>
        </div>

        {/* Accordion Settings Form */}
        {isConfigOpen && (
          <form
            onSubmit={saveConfiguration}
            className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-5 text-xs text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 font-mono">
                  <Lock size={13} className="text-emerald-450" />
                  Kredensial Sanpay Payment Gateway (Server-Side)
                </h4>
                {Object.values(envSecretsActive).some(Boolean) && (
                  <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> Terbaca dari Secrets Gemini AI Studio
                  </span>
                )}
              </div>

              {Object.values(envSecretsActive).some(Boolean) && (
                <div className="bg-indigo-950/40 p-3 rounded-lg border border-indigo-800/40 text-[11px] text-indigo-200 font-sans leading-relaxed">
                  💡 <strong>Informasi Gateway:</strong> Beberapa kredensial
                  Sanpay terdeteksi diisi langsung melalui{" "}
                  <strong>Secrets panel di Gemini AI Studio</strong> Anda. Nilai
                  tersebut otomatis diutamakan. Anda tetap bisa menimpa nilainya
                  dengan form di bawah ini.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold font-mono text-slate-350 uppercase">
                      Sanpay API Key (Bearer Token)
                    </label>
                    {envSecretsActive.apiKey && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        ✓ Diisi dari Secret
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder={
                        envSecretsActive.apiKey
                          ? "•••••••••••••••••••• (Terisi Otomatis)"
                          : "Masukkan API Key Sanpay Anda"
                      }
                      value={sanpayApiKey}
                      onChange={(e) => setSanpayApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Dapatkan di Dashboard Sanpay &rarr; Pengaturan API
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold font-mono text-slate-350 uppercase">
                      Sanpay Merchant ID
                    </label>
                    {envSecretsActive.merchantId && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        ✓ Diisi dari Secret
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={
                      envSecretsActive.merchantId
                        ? "(Terisi Otomatis)"
                        : "Contoh: S1930"
                    }
                    value={sanpayMerchantId}
                    onChange={(e) => setSanpayMerchantId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono font-bold text-xs h-[38px]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold font-mono text-slate-350 uppercase">
                      Sanpay Secret / Signature Key
                    </label>
                    {envSecretsActive.secretKey && (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        ✓ Diisi dari Secret
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showSanpaySecret ? "text" : "password"}
                      placeholder={
                        envSecretsActive.secretKey
                          ? "•••••••••••••••••••• (Terisi Otomatis)"
                          : "Masukkan Sanpay Secret Key"
                      }
                      value={sanpaySecretKey}
                      onChange={(e) => setSanpaySecretKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSanpaySecret(!showSanpaySecret)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showSanpaySecret ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-350 uppercase">
                    Mode Pelacak Sanpay
                  </label>
                  <select
                    value={sanpayMode}
                    onChange={(e: any) => setSanpayMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-100 font-medium text-xs h-[38px] font-sans"
                  >
                    <option value="Simulation">
                      Simulation / Sandbox Mode (Simulasi Sehat)
                    </option>
                    <option value="Production">
                      Live Production (Hubungkan Sanpay Real API)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIVE WEBHOOK COPIER & TROUBLESHOOTING CARD */}
            <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/35 border-dashed space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-300 font-mono font-bold tracking-wider uppercase block">
                  🌐 ALAMAT WEBHOOK CALLBACK SANPAY.SITE
                </span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono font-bold">
                  READY TO RECEIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans font-medium">
                Sistem secara otomatis menyediakan URL Webhook Callback untuk
                menyambungkan status pembayaran instan dari server Sanpay ke
                Router / Bot WiFi Anda:
              </p>
              <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-lg border border-slate-800">
                <code className="text-[10px] text-indigo-300 font-mono select-all break-all overflow-x-auto flex-1">
                  {window.location.origin}/api/qris/webhook
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/api/qris/webhook`,
                    );
                    alert("✅ Alamat webhook berhasil disalin!");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy size={11} /> Salin URL Webhook
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                <Info size={11} /> Nilai API key disimpan aman server-side demi
                menjaga keamanan.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-350 font-semibold px-4 py-1.5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  {isSavingConfig ? "Menyimpan..." : "Simpan Setelan"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 1. CHECKOUT VIEW IF SELECTED */}
      {activeTx ? (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
          {/* Status color-coded top banner */}
          <div
            className={`p-4 text-center text-xs font-bold font-mono tracking-wider text-white ${
              activeTx.status === "Paid"
                ? "bg-emerald-600"
                : activeTx.status === "Pending"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-600"
            }`}
          >
            {activeTx.status === "Paid"
              ? "✅ QRIS DI-VERIFIKASI LUNAS"
              : activeTx.status === "Pending"
                ? "⏳ MENUNGGU SCAN PEMBAYARAN"
                : "❌ INVOICE KEDALUWARSA/EXPIRED"}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">
                  SANPAY.SITE BILLING SYSTEM
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTx.note}
                </h3>
              </div>
              <button
                onClick={() => onSelectTx(null)}
                className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Kembali ke Ringkasan
              </button>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Code graphic generator visual mockup */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/60 relative">
                {activeTx.status === "Paid" ? (
                  <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <CheckCircle2
                      size={48}
                      className="text-emerald-500 animate-bounce"
                    />
                    <span className="font-bold text-xs text-slate-800">
                      Pembayaran Sukses
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Diterima via QRISLY
                    </span>
                  </div>
                ) : activeTx.status === "Expired" ? (
                  <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <AlertTriangle size={48} className="text-red-500" />
                    <span className="font-bold text-xs text-slate-800">
                      Invoice Expired
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Waktu bayar habis
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs flex flex-col items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(activeTx.qrisPayload)}`}
                        alt="QRIS Merchant QR code"
                        className="w-[160px] h-[160px] object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Merchant banner overlay */}
                    <div className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-mono tracking-widest mt-3 uppercase">
                      WIFI VOUCHER ADILA.NET
                    </div>
                  </>
                )}
              </div>

              {/* Checkout pricing specifics */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                    Penerima Tagihan
                  </span>
                  <div className="text-sm font-bold text-slate-800">
                    {activeTx.customerName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-505 text-indigo-600 font-bold">
                    ID Transaksi: {activeTx.transactionId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 font-mono space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Nominal Dasar:</span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(activeTx.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Kode Unik (+): </span>
                    <span className="font-bold">+{activeTx.uniqueCode}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm">
                    <span className="font-bold text-slate-900">
                      Total Transfer:
                    </span>
                    <span className="font-extrabold text-indigo-600">
                      {formatRupiah(activeTx.totalPayment)}
                    </span>
                  </div>
                </div>

                {activeTx.status === "Pending" && (
                  <div className="p-3 bg-indigo-50 rounded-lg text-[10px] text-indigo-800 border border-indigo-100 leading-relaxed font-semibold">
                    💡 <strong>PENTING:</strong> Agar terintegrasi otomatis ke
                    sanpay.site, pembayar wajib mentransfer nominal pas{" "}
                    <strong>{formatRupiah(activeTx.totalPayment)}</strong>.
                    Jangan dibulatkan!
                  </div>
                )}
              </div>
            </div>

            {/* REAL-TIME AUTO POLLING LOGS/TRACKER */}
            {activeTx.status === "Pending" && (
              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505 bg-indigo-500"></span>
                    </span>
                    TRACKER STATUS OTOMATIS (AUTO-POLLING REALTTIME)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                    Cek ulang dalam {pollCountdown} detik
                  </span>
                </div>

                <div className="text-[10px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Endpoint:</span>
                    <span className="text-slate-300">
                      GET /api/qris/check-status/{activeTx.transactionId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Gateway Target:</span>
                    <span className="text-indigo-400 font-bold">
                      {sanpayMode === "Production"
                        ? "sanpay.site LIVE API Server"
                        : "sanpay.site Simulation/Local Sandbox"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pesan Log:</span>
                    <span className="text-amber-400 font-bold animate-pulse">
                      {lastCheckMessage}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleManualStatusCheck}
                    disabled={manualCheckLoading}
                    className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] py-2 rounded-lg transition border-b-2 border-indigo-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw
                      size={12}
                      className={manualCheckLoading ? "animate-spin" : ""}
                    />
                    Paksa Cek Pembayaran Sekarang (Real-time Pull)
                  </button>
                </div>
              </div>
            )}

            {/* RAW RESPONSE VIEW FOR API DIAGNOSTICS */}
            {rawApiResponse && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-1.5 font-mono text-[9px] text-emerald-400">
                <span className="text-slate-400 block border-b border-slate-800 pb-1 text-[10px] font-bold">
                  RAW RESPONSE DIAGNOSTIK RAJAONGKIR API:
                </span>
                <pre className="overflow-x-auto whitespace-pre p-1 text-xs">
                  {JSON.stringify(rawApiResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Webhook debug action buttons */}
            {activeTx.status === "Pending" && (
              <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <Sparkles size={16} className="text-amber-600 animate-spin" />
                  <span>SIMULASI CEPAT / PRESENTASI FITUR</span>
                </div>
                <p className="text-[11px] text-amber-950/80 leading-relaxed font-medium">
                  Jika sedang menguji alur tanpa menyambungkan rekening bank
                  asli, Anda dapat mengirim payload pembayaran sukses lunas di
                  simulator berikut:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        confirm(
                          "Simulasikan pembayaran lunas sukses via Webhook?",
                        )
                      ) {
                        await onSimulateWebhook(activeTx.transactionId, "Paid");
                      }
                    }}
                    className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs cursor-pointer border-b-2 border-emerald-800"
                  >
                    Simulasi Webhook sanpay.site (PAID) &rarr; Aktivasi Voucher
                    WiFi/User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. TRANSACTION OPERATIONS SUMMARY PANEL FOR ADM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Manual Payment Receipt Request */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <CreditCard size={16} className="text-indigo-600" />
                Buat Barcode QRIS Baru
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const amt = parseInt(manualAmount);
                  if (!manualName || isNaN(amt) || amt < 1000) {
                    alert("Harap lengkapi isian minimal Rp 1.000");
                    return;
                  }
                  onTriggerManualQris(amt, manualName);
                  // Reset
                  setManualName("");
                  setManualAmount("");
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                    Nama Penyumbang / Member
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                    Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="1000000"
                    required
                    placeholder="Contoh: 10000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                >
                  Buat Tagihan QRIS sanpay.site
                </button>
              </form>
            </div>

            {/* INTEGRATION INFOGRAPHICS STATE */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3.5">
              <h4 className="text-xs font-mono font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                <Globe size={13} />
                ALUR BERKOMUNIKASI OTOMATIS
              </h4>
              <ol className="text-[10px] space-y-2 list-decimal list-inside text-slate-300 font-medium leading-relaxed">
                <li>
                  <strong className="text-white">Request Dynamic QR:</strong>{" "}
                  Server melakukan request ke endpoint API sanpay.site dengan
                  menyertakan Kredensial API Merchant.
                </li>
                <li>
                  <strong className="text-white">Penambahan Angka Unik:</strong>{" "}
                  Untuk mencocokkan pembayaran tanpa bentrokan nominal, sistem
                  menambahkan bilangan acak (misal, 20000 menjadi 20129).
                </li>
                <li>
                  <strong className="text-white">
                    Auto Polling Monitoring:
                  </strong>{" "}
                  Browser menyalakan countdown berkala untuk menanyakan status
                  ke server secara terjadwal.
                </li>
                <li>
                  <strong className="text-white">Auto Fulfillment:</strong>{" "}
                  Begitu webhook terdeteksi atau status berubah lunas, saldo /
                  voucher seketika dikirim ke member.
                </li>
              </ol>
            </div>
          </div>

          {/* List of Invoice Requests */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Log Transaksi sanpay.site Gateway
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Semua request dynamic QRIS terintegrasi sanpay.site secara
                  aman
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none font-medium text-slate-700 max-w-[120px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-4 font-bold">KODE INVOICE</th>
                    <th className="py-2.5 px-4 font-bold">NAMA PELANGGAN</th>
                    <th className="py-2.5 px-4 font-bold">JUMLAH REQ</th>
                    <th className="py-2.5 px-4 font-bold">KODE UNIK</th>
                    <th className="py-2.5 px-4 font-bold">TOTAL HARGA</th>
                    <th className="py-2.5 px-4 font-bold">STATUS</th>
                    <th className="py-2.5 px-4 text-center">TINDAKAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-slate-400 text-xs"
                      >
                        Belum ada transaksi QRISLY yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {tx.transactionId}
                        </td>
                        <td className="py-3 px-4">{tx.customerName}</td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">
                          +{tx.uniqueCode}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-slate-800">
                          {formatRupiah(tx.totalPayment)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              tx.status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : tx.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                                  : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                          >
                            {tx.status === "Paid"
                              ? "Selesai"
                              : tx.status === "Pending"
                                ? "Pending"
                                : tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onSelectTx(tx.id)}
                            className="text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
                          >
                            Buka QR
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
