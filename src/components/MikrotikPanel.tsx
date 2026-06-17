import React, { useState } from "react";
import { 
  Wifi, 
  Cpu, 
  Settings, 
  Activity, 
  Square, 
  CheckCircle2, 
  Lock
} from "lucide-react";
import { MikrotikConfig, Voucher } from "../types";

interface Props {
  config: MikrotikConfig;
  vouchers: Voucher[];
  onUpdateConfig: (updated: Partial<MikrotikConfig>) => void;
  onDisconnect: () => void;
}

export default function MikrotikPanel({
  config,
  vouchers,
  onUpdateConfig,
  onDisconnect
}: Props) {
  const [ip, setIp] = useState(config.ip);
  const [username, setUsername] = useState(config.username);
  const [pwd, setPwd] = useState(config.password || "");
  const [port, setPort] = useState(config.port);

  const [isConnecting, setIsConnecting] = useState(false);
  const [uptime, setUptime] = useState("08 days, 14 hours, 22 minutes");
  const [cpuUsage, setCpuUsage] = useState(5); // in percentage
  const [memoryUsage, setMemoryUsage] = useState(38.4); // MB or %

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setTimeout(() => {
      onUpdateConfig({
        ip,
        username,
        password: pwd,
        port,
        isConnected: true
      });
      setIsConnecting(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  // Map sold vouchers into active live sessions on MikroTek Hotspot
  const soldVouchers = vouchers.filter(v => v.status === "Sold");
  const sessions = soldVouchers.map((v, i) => {
    // Generate pseudo parameters unique to each credential
    const ipLastOctet = (i + 15) % 254;
    const macHex = (i * 11 + 10).toString(16).padStart(2, '0').toUpperCase();
    return {
      username: v.code,
      packageName: v.packageName,
      ipAddress: `10.5.50.${ipLastOctet}`,
      macAddress: `FC:EC:DA:B0:12:${macHex}`,
      uptime: "02:44:11",
      rxRate: `${(Math.random() * 4 + 0.5).toFixed(1)} Mbps`,
      txRate: `${(Math.random() * 1 + 0.1).toFixed(1)} Mbps`
    };
  });

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">MikroTik Hotspot RouterOS API</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Integritasi router nirkabel, telemetri pemakaian resource RAM/CPU, serta daftar sesi pelanggan aktif.</p>
        </div>

        {config.isConnected ? (
          <button 
            type="button"
            onClick={handleDisconnect}
            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/40 px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Square size={14} />
            Putuskan Koneksi Router
          </button>
        ) : (
          <div className="text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-3.5 py-2 rounded-xl flex items-center gap-2 font-semibold">
            Status: Integrasi Terputus
          </div>
        )}
      </div>

      {/* Grid: Config Setup vs Hardware Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Router Hardware stats */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-3xs transition-colors">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Cpu size={16} className="text-indigo-600 dark:text-indigo-455 animate-pulse" />
            Router Telemetry (ROS v7.14)
          </h4>

          {config.isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase font-mono">Uptime Router</span>
                  <div className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">{uptime}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    API Connection OK
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase font-mono">Load CPU</span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">{cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${cpuUsage}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">hEX GR3 (DualCore MT7621)</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase font-mono">RAM Utilization</span>
                    <span className="font-extrabold text-amber-700 dark:text-amber-400 font-mono">{memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${memoryUsage}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Free memory: 158 MB</span>
                </div>
              </div>

              {/* AUTOMATICALLY DETECTED MIKROTIK PROFILES */}
              <div className="border border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/25 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <h5 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    <Wifi size={13} className="animate-pulse text-indigo-550" />
                    Profil Layanan Terdeteksi Dari MikroTik (Auto-detected)
                  </h5>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-150 dark:border-emerald-900/30">
                    STATUS: ACTIVE SYNC
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
                  Sistem otomatis melacak, mengurai, dan mendeteksi profil kecepatan (Bandwidth Profil) yang dikonfigurasikan pada User Profile Hotspot di MikroTik Anda:
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono">
                  {config.detectedProfiles && config.detectedProfiles.length > 0 ? (
                    config.detectedProfiles.map((prof, pIdx) => (
                      <span key={pIdx} className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-3xs hover:border-indigo-500 transition-colors cursor-default">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        <span>{prof}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">Memindai profil aktif...</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
              <Wifi size={28} className="text-slate-350" />
              <span>Harap isi kredensial dan hubungkan router untuk menampilkan data hardware.</span>
            </div>
          )}
        </div>

        {/* Credentials Editor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 shadow-3xs transition-colors">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings size={16} className="text-slate-500" />
            Kredensial API MikroTik
          </h4>

          <form onSubmit={handleConnect} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">Router IP Address</label>
              <input 
                type="text" value={ip} onChange={(e) => setIp(e.target.value)} required
                className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl font-mono text-center font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">API SSL Port</label>
                <input 
                  type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value))} required
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl font-mono text-center text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">API Username</label>
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl font-mono text-center text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">Password</label>
              <input 
                type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-center text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button 
              type="submit" disabled={isConnecting}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors disabled:bg-indigo-400 flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <Wifi size={14} />
              {isConnecting ? "Mencoba Koneksi..." : config.isConnected ? "Simpan & Hubungkan Kembali" : "Hubungkan Router"}
            </button>
          </form>
        </div>
      </div>

      {/* Active sessions list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-3xs overflow-hidden transition-colors">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-500 animate-pulse" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Active Hotspot Sessions ({sessions.length})</h4>
          </div>
          <span className="text-[9px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full">
            REALTIME MONITOR
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 font-mono text-[10px] uppercase">
                <th className="p-3.5 px-4 font-bold">USER PIN HOTSPOT</th>
                <th className="p-3.5 px-4 font-bold">PROFIL KECEPATAN</th>
                <th className="p-3.5 px-4 font-bold">ALAMAT IP</th>
                <th className="p-3.5 px-4 font-bold">ALAMAT MAC</th>
                <th className="p-3.5 px-4 font-bold">LIVE RX</th>
                <th className="p-3.5 px-4 font-bold">LIVE TX</th>
                <th className="p-3.5 px-4 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {!config.isConnected ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-amber-600 bg-amber-50/20 dark:bg-amber-950/10">
                    ⚠️ MikroTik terputus. Silakan hubungkan router di atas untuk menarik data sesi live.
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-normal">
                    Belum ada voucher hotspot yang login aktif ke router MikroTik.
                  </td>
                </tr>
              ) : (
                sessions.map((ses, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 px-4 font-bold text-slate-800 dark:text-slate-200 font-mono bg-slate-50/40 dark:bg-slate-950/20">{ses.username}</td>
                    <td className="p-3 px-4">{ses.packageName}</td>
                    <td className="p-3 px-4 font-mono">{ses.ipAddress}</td>
                    <td className="p-3 px-4 font-mono">{ses.macAddress}</td>
                    <td className="p-3 px-4 text-emerald-600 font-mono">{ses.rxRate}</td>
                    <td className="p-3 px-4 text-indigo-600 font-mono">{ses.txRate}</td>
                    <td className="p-3 px-4 text-center">
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/mikrotik/kick", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ username: ses.username })
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert(`Hotspot User ${ses.username} berhasil di-kick dari Router.`);
                            } else {
                              alert(`Gagal memutuskan sesi ${ses.username} di Router.`);
                            }
                          } catch (err: any) {
                            alert(`Gagal menghubungi server API: ${err.message}`);
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-950/85 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-bold border border-red-100 dark:border-red-900/40 text-[10px] cursor-pointer"
                      >
                        KICK
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
  );
}
