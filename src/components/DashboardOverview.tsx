import React from "react";
import {
  Users,
  Ticket,
  Wallet,
  DollarSign,
  Bot,
  Wifi,
  ArrowRight,
  TrendingUp,
  Receipt,
  MessageSquare,
  Database,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Voucher,
  VoucherPackage,
  CustomerAccount,
  QrisTransaction,
  BotSetting,
  MikrotikConfig,
} from "../types";

interface Props {
  vouchers: Voucher[];
  packages: VoucherPackage[];
  customers: CustomerAccount[];
  transactions: QrisTransaction[];
  botsConfig: BotSetting[];
  mikrotik: MikrotikConfig;
  onNavigate: (tab: string) => void;
  dbStatus?: {
    connected: boolean;
    error: string | null;
    loadedFrom: string;
    timestamp: string | null;
    sql_host?: string;
    sql_user?: string;
    sql_db?: string;
    sql_port?: string;
  };
}

export default function DashboardOverview({
  vouchers,
  packages,
  customers,
  transactions,
  botsConfig,
  mikrotik,
  onNavigate,
  dbStatus,
}: Props) {
  // Stats calculations
  const totalCustomers = customers.length;
  const totalCustomerSaldo = customers.reduce((sum, c) => sum + c.saldo, 0);

  const availableVouchers = vouchers.filter(
    (v) => v.status === "Available",
  ).length;
  const soldVouchers = vouchers.filter((v) => v.status === "Sold");
  const totalVouchersSoldMoney = soldVouchers.reduce(
    (sum, v) => sum + v.price,
    0,
  );

  // Paid Transactions via QRIS
  const paidTransactions = transactions.filter((t) => t.status === "Paid");
  const totalQrisRevenue = paidTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // Pending transactions awaiting payment
  const pendingTransactions = transactions.filter(
    (t) => t.status === "Pending",
  );

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Recharts Revenue Trend (Last 6 Months Simulation)
  const chartData = [
    { name: "Jan", "Penjualan Voucher": 140000, "Top-up QRIS": 150000 },
    { name: "Feb", "Penjualan Voucher": 185000, "Top-up QRIS": 190000 },
    { name: "Mar", "Penjualan Voucher": 240000, "Top-up QRIS": 250000 },
    { name: "Apr", "Penjualan Voucher": 310000, "Top-up QRIS": 320000 },
    { name: "Mei", "Penjualan Voucher": 420000, "Top-up QRIS": 450000 },
    {
      name: "Jun",
      "Penjualan Voucher": totalVouchersSoldMoney,
      "Top-up QRIS": totalQrisRevenue,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Database Connection Status Diagnostics */}
      {dbStatus && (
        <div
          id="db-status-banner"
          className={`p-5 rounded-2xl border ${
            dbStatus.connected
              ? "bg-emerald-50/40 border-emerald-100 text-emerald-950 dark:bg-emerald-950/10 dark:border-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-50 border-rose-100/80 text-rose-950 dark:bg-rose-955/10 dark:border-rose-900/40 dark:text-rose-300"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${dbStatus.connected ? "bg-emerald-500 text-white" : "bg-rose-500 text-white animate-pulse"}`}
              >
                <Database size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span>Status Database MySQL:</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      dbStatus.connected
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {dbStatus.connected
                      ? "Terkoneksi"
                      : "Terputus (Mode Fallback Memori)"}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Penyimpanan Aktif:{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {dbStatus.loadedFrom}
                  </strong>
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 bg-slate-100/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150/40">
              <span>
                Host:{" "}
                <strong className="text-slate-800 dark:text-slate-300 font-semibold">
                  {dbStatus.sql_host}
                </strong>
              </span>
              <span>
                Port:{" "}
                <strong className="text-slate-800 dark:text-slate-300 font-semibold">
                  {dbStatus.sql_port}
                </strong>
              </span>
              <span>
                DB:{" "}
                <strong className="text-slate-800 dark:text-slate-300 font-semibold">
                  {dbStatus.sql_db}
                </strong>
              </span>
              <span>
                User:{" "}
                <strong className="text-slate-800 dark:text-slate-300 font-semibold">
                  {dbStatus.sql_user}
                </strong>
              </span>
            </div>
          </div>

          {!dbStatus.connected && (
            <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-900/30 space-y-3">
              <div className="p-3 bg-rose-100/30 dark:bg-rose-955/30 rounded-xl text-xs font-mono text-rose-700 dark:text-rose-400 overflow-x-auto border border-rose-150/20">
                <span className="font-bold block text-rose-800 dark:text-rose-300 mb-1">
                  Pesan Error Database:
                </span>
                {dbStatus.error || "Gagal menghubungi database MariaDB."}
              </div>

              <div className="text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  💡 Langkah-Langkah Diagnosa & Solusi:
                </span>
                <ul className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed md:text-justify">
                  <li>
                    <strong>Sandi Root Tidak Sesuai (Access Denied):</strong>{" "}
                    Jika Anda belum menyetel password root untuk database
                    MariaDB di Dockge, maka parameter{" "}
                    <strong>SQL_PASSWORD</strong> di file{" "}
                    <code>docker-compose.yml</code> harus dikosongkan (contoh:{" "}
                    <code>- SQL_PASSWORD=</code>).
                  </li>
                  <li>
                    <strong>
                      Nama Host Mismatch (ENOTFOUND/ECONNREFUSED):
                    </strong>{" "}
                    Pastikan nama kontainer database Anda adalah{" "}
                    <code>mariadb</code>. Jika pada konfigurasi Dockge Anda nama
                    kontainer database-nya berbeda (misalnya{" "}
                    <code>database</code>), ubahlah parameter{" "}
                    <code>- SQL_HOST=mariadb</code> menjadi{" "}
                    <code>- SQL_HOST=database</code> di file{" "}
                    <code>docker-compose.yml</code>.
                  </li>
                  <li>
                    <strong>Docker Network Group:</strong> Hubungkan kedua
                    kontainer ke Docker Network yang sama. Di file{" "}
                    <code>docker-compose.yml</code> Anda menggunakan network
                    eksternal bernama <code>mikhmon_network</code>. Pastikan
                    kontainer MariaDB Anda juga sudah terhubung ke network
                    eksternal <code>mikhmon_network</code> tersebut!
                  </li>
                </ul>
                <div className="pt-2 select-all font-mono text-[10px] bg-slate-50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-slate-150 dark:border-indigo-900/30 text-slate-500 leading-relaxed">
                  Tips: Setelah mengedit file <code>docker-compose.yml</code> di
                  Dockge, tekan tombol{" "}
                  <strong className="text-indigo-650 dark:text-indigo-400">
                    Deploy
                  </strong>{" "}
                  atau simpan kembali konfigurasi agar sistem hot-reloading
                  memicu koneksi yang baru!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Voucher Stock & Sold */}
        <div
          id="metric-vouchers"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-mono font-bold text-slate-400">
              VOUCHER HOTSPOT
            </p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              {soldVouchers.length} Terjual
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Stok siap pakai:{" "}
              <span className="text-indigo-600 font-bold">
                {availableVouchers} pcs
              </span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Ticket size={24} />
          </div>
        </div>

        {/* Metric 2: Customer Deposit Balances */}
        <div
          id="metric-saldo"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-mono font-bold text-slate-400">
              SALDO DEPOSIT PELANGGAN
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">
              {formatRupiah(totalCustomerSaldo)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dari <span className="font-semibold">{totalCustomers} akun</span>{" "}
              terdaftar
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet size={24} />
          </div>
        </div>

        {/* Metric 3: QRIS Revenue */}
        <div
          id="metric-qris"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-mono font-bold text-slate-400 font-bold">
              TOTAL OMSET QRISLY
            </p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              {formatRupiah(totalQrisRevenue)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-500 font-semibold">
                {paidTransactions.length} Transaksi
              </span>{" "}
              lunas
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Metric 4: Active Hotspot Sessions */}
        <div
          id="metric-sessions"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-mono font-bold text-slate-400">
              SINKRONISASI MIKROTIK
            </p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              {mikrotik.isConnected
                ? `${mikrotik.activeHotspotUsersCount} User`
                : "Offline"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 animate-pulse">
              {mikrotik.isConnected
                ? "🟢 Hotspot Server Online"
                : "🔴 Router Terputus"}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wifi size={24} />
          </div>
        </div>
      </div>

      {/* Bots and Webhook Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {botsConfig.map((bot) => {
          const isConnected = bot.status === "Connected";
          return (
            <div
              key={bot.provider}
              className={`p-4 rounded-xl border flex items-center gap-4 ${isConnected ? "bg-emerald-50/50 border-emerald-100/80 text-emerald-900" : "bg-red-50/50 border-red-100 text-red-900"}`}
            >
              <div
                className={`p-2.5 rounded-lg ${isConnected ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
              >
                <Bot size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>Bot {bot.provider}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full ${isConnected ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                  >
                    {bot.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  ID: {bot.botUsername || "Not Configured"}
                </div>
              </div>
            </div>
          );
        })}

        {/* QRISLY Webhook integration Status */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-indigo-950 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white">
            <TrendingUp size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold flex items-center justify-between">
              <span>QRISLY Webhook API</span>
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.2 rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              Instant balance & voucher crediting
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue chart & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Tren Pendapatan & Deposit
              </h4>
              <p className="text-xs text-slate-500">
                Omset penjualan voucher langsung serta total top-up QRIS
                real-time
              </p>
            </div>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
              6 Bulan Terakhir
            </span>
          </div>

          <div className="h-64 mt-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="voucherGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="qrisGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => `Rp${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(value)]}
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Penjualan Voucher"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#voucherGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="Top-up QRIS"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#qrisGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Panel shortcuts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
              Aksi Cepat Admin
            </h4>
            <p className="text-xs text-slate-500">
              Navigasi panel kontrol untuk pengoperasian hotspot voucher wifi.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate("Voucher")}
                className="w-full flex items-center justify-between text-left p-3 rounded-xl border border-indigo-100 hover:border-indigo-200 bg-indigo-50/30 hover:bg-indigo-100/30 text-indigo-950 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Ticket size={18} className="text-indigo-600 animate-pulse" />
                  <div>
                    <div className="text-xs font-semibold">
                      Generate Stok Voucher
                    </div>
                    <div className="text-[10px] text-indigo-800 mt-0.5">
                      Buat ratusan kode hotspot instan
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-indigo-400 group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button
                onClick={() => onNavigate("Member")}
                className="w-full flex items-center justify-between text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs font-semibold">
                      Kelola Member & Saldo
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Atur kredit deposit / tambah saldo manual
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button
                onClick={() => onNavigate("QRISLY")}
                className="w-full flex items-center justify-between text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Receipt size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs font-semibold">
                      Transaksi QRISLY
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Monitor request dynamic static QRIS
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button
                onClick={() => onNavigate("Bot Integration")}
                className="w-full flex items-center justify-between text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-slate-600" />
                  <div>
                    <div className="text-xs font-semibold">
                      Bot WA & Telegram Simulator
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Uji auto-reply order lewat chat
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-400 group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-4">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Dynamic to Static QRIS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Sistem menggunakan API QRISLY untuk memodifikasi payload
              image/string statis merchant Anda dengan menambahkan nominal unik
              & menghitung ulang checksum CRC16 secara melayang.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Pending transactions / recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending QRIS Request Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Menunggu Pembayaran QRIS ({pendingTransactions.length})
            </h4>
            <button
              onClick={() => onNavigate("QRISLY")}
              className="text-xs text-indigo-600 hover:underline"
            >
              Semua Transaksi
            </button>
          </div>

          <div className="space-y-2">
            {pendingTransactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Tidak ada invoice pending. Semua tagihan QRIS terbayar atau
                kedaluwarsa.
              </div>
            ) : (
              pendingTransactions.slice(0, 4).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-slate-50  rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {tx.customerName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {tx.transactionId} &bull; {tx.createdAt}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-slate-800 font-mono">
                      {formatRupiah(tx.totalPayment)}
                    </div>
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-full font-bold ml-auto inline-block">
                      Belum Bayar
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Voucher Stock Alert / Recent Sold Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">
              Voucher Hotspot Terjual Baru-baru Ini
            </h4>
            <button
              onClick={() => onNavigate("Voucher")}
              className="text-xs text-indigo-600 hover:underline"
            >
              Stok & Paket
            </button>
          </div>

          <div className="space-y-2">
            {soldVouchers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada voucher hotspot yang terjual hari ini.
              </div>
            ) : (
              soldVouchers
                .slice(-4)
                .reverse()
                .map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-indigo-50/20 rounded-xl border border-indigo-100/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 font-mono">
                        {v.code}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {v.packageName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">
                        {formatRupiah(v.price)}
                      </div>
                      <div className="text-[9px] text-indigo-700 font-medium mt-0.5">
                        Pembeli: {v.soldTo || "Member/Guest"}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
