import React, { useState } from "react";
import { 
  Plus, 
  Ticket, 
  Trash2, 
  RefreshCw, 
  Search, 
  Download, 
  Filter, 
  CheckCircle, 
  X, 
  Sparkles,
  Wifi,
  Clock
} from "lucide-react";
import { Voucher, VoucherPackage } from "../types";

interface Props {
  vouchers: Voucher[];
  packages: VoucherPackage[];
  onAddPackage: (pkg: Omit<VoucherPackage, "id">) => void;
  onGenerateVouchers: (packageId: string, quantity: number, customPrefix: string) => void;
  onClearAvailableVouchers: () => void;
}

export default function VoucherManager({
  vouchers,
  packages,
  onAddPackage,
  onGenerateVouchers,
  onClearAvailableVouchers
}: Props) {
  const vouchersSafe = vouchers || [];
  const packagesSafe = packages || [];

  // Local state for modals & search
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  
  // Create Package form states
  const [pkgName, setPkgName] = useState("");
  const [pkgSpeed, setPkgSpeed] = useState("5 Mbps");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgDuration, setPkgDuration] = useState("24");
  const [pkgDesc, setPkgDesc] = useState("");

  // Generate Voucher form states
  const [genPkgId, setGenPkgId] = useState(packagesSafe[0]?.id || "");
  const [genQty, setGenQty] = useState(20);
  const [customPrefix, setCustomPrefix] = useState("WIFI");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [packageFilter, setPackageFilter] = useState<string>("ALL");

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice || !pkgDuration) {
      alert("Harap isi semua kolom wajib!");
      return;
    }
    onAddPackage({
      name: pkgName,
      speedLimit: pkgSpeed,
      price: parseInt(pkgPrice),
      durationHours: parseInt(pkgDuration),
      description: pkgDesc || `${pkgSpeed} unlimited selama ${pkgDuration} jam`
    });
    // Reset
    setPkgName("");
    setPkgPrice("");
    setPkgDuration("24");
    setPkgDesc("");
    setIsPkgModalOpen(false);
  };

  const handleTriggerGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genPkgId) {
      alert("Harap pilih paket voucher terlebih dahulu!");
      return;
    }
    onGenerateVouchers(genPkgId, genQty, customPrefix);
    setIsGenModalOpen(false);
  };

  // Filter vouchers
  const filteredVouchers = vouchersSafe.filter(v => {
    const matchesSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.soldTo && v.soldTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" ? true : v.status === statusFilter;
    const matchesPackage = packageFilter === "ALL" ? true : v.packageId === packageFilter;
    return matchesSearch && matchesStatus && matchesPackage;
  });

  return (
    <div className="space-y-6">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Manajemen Paket & Voucher Hotspot</h2>
          <p className="text-xs text-slate-500">Buat paket kecepatan internet MikroTik dan cetak massal kode sandi voucher client.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              if (packagesSafe.length > 0) {
                setGenPkgId(packagesSafe[0].id);
                setIsGenModalOpen(true);
              } else {
                alert("Silakan buat Paket Voucher terlebih dahulu!");
              }
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles size={14} />
            Cetak Bulk Voucher
          </button>
          <button 
            type="button"
            onClick={() => setIsPkgModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Tambah Paket
          </button>
        </div>
      </div>

      {/* Grid of Packages */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Daftar Paket Kecepatan WiFi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packagesSafe.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 rounded-xl col-span-full">
              Belum ada paket voucher wifi. Klik "Tambah Paket" untuk membuatnya pertama kali!
            </div>
          ) : (
            packagesSafe.map(pkg => {
              // Count available voucher units
              const unitCount = vouchersSafe.filter(v => v.packageId === pkg.id && v.status === "Available").length;
              return (
                <div key={pkg.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold rounded-bl-lg">
                    {pkg.speedLimit}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wifi size={16} className="text-indigo-600" />
                      <span className="text-xs text-slate-400 font-mono font-medium">PK-CODE: {pkg.id}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{pkg.name}</h4>
                    <p className="text-[11px] text-slate-500 min-h-[32px] line-clamp-2">{pkg.description}</p>
                    
                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock size={10} /> {pkg.durationHours} JAM AKTIF
                        </div>
                        <div className="text-lg font-extrabold text-slate-800 tracking-tight mt-0.5">
                          {formatRupiah(pkg.price)}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${unitCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        Stok: {unitCount} pcs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Vouchers inventory operations */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs overflow-hidden">
        {/* Filters and search box */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs max-w-md">
            <Search size={15} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kode voucher, paket, atau nama pembeli..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-700"
            />
            {searchQuery && (
              <X size={14} className="text-slate-400 cursor-pointer" onClick={() => setSearchQuery("")} />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <Filter size={12} className="text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Available">Tersedia (Ready)</option>
                <option value="Sold">Terjual</option>
              </select>
            </div>

            {/* Package Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <Ticket size={12} className="text-slate-400" />
              <select 
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Paket</option>
                {packagesSafe.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Clear Available stock button */}
            <button
              onClick={() => {
                if(confirm("Apakah Anda yakin ingin mengosongkan semua voucher nganggur (Tersedia)?\nTindakan ini tidak memengaruhi voucher yang sudah terjual.")) {
                  onClearAvailableVouchers();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl font-semibold border border-red-100 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              Kosongkan Stok Unused
            </button>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">KODE VOUCHER (HOTSPOT CODE)</th>
                <th className="py-3 px-4 font-bold">PAKET WI-FI</th>
                <th className="py-3 px-4 font-bold">HARGA DEPOSIT</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold">DI-KLAIM OLEH</th>
                <th className="py-3 px-4 font-bold">GENT-TIME / AKTIVASI</th>
                <th className="py-3 px-4 font-bold text-center">MASA EXPIRED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Tidak ditemukan voucher hotspot yang cocok dengan kriteria filter masukan.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Ticket size={14} className="text-indigo-500" />
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md">
                          {v.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{v.packageName}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800">{formatRupiah(v.price)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 font-bold text-[9px] rounded-full inline-block ${
                        v.status === "Available" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        v.status === "Sold" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        v.status === "Expired" ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-600"
                      }`}>
                        {v.status === "Available" ? "Tersedia" : v.status === "Sold" ? "Terjual/Aktif" : v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {v.soldTo ? `@${v.soldTo}` : <span className="text-slate-400 italic">Belum diklaim</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {v.activatedAt || v.createdAt}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-red-600 font-semibold text-center">
                      {v.expiresAt || <span className="text-slate-400 font-normal italic">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: ADD PACKAGE --- */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wifi size={18} className="text-indigo-600" />
                Tambah Paket Kecepatan Baru
              </h3>
              <button onClick={() => setIsPkgModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Nama Paket Voucher</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Paket 3 Jam Kebut"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Profil Speed Limit</label>
                  <select 
                    value={pkgSpeed}
                    onChange={(e) => setPkgSpeed(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="2 Mbps">2 Mbps (Sederhana)</option>
                    <option value="3 Mbps">3 Mbps (Standar)</option>
                    <option value="5 Mbps">5 Mbps (Kencang)</option>
                    <option value="10 Mbps">10 Mbps (Mantap)</option>
                    <option value="15 Mbps">15 Mbps (Sultan)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Harga (Rp)</label>
                  <input 
                    type="number" n-max="1000000"
                    required
                    placeholder="Contoh: 3000"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Durasi Masa Aktif (Jam)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Masa aktif sejak login (dalam jam), e.g. 24"
                  value={pkgDuration}
                  onChange={(e) => setPkgDuration(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Keterangan / Deskripsi</label>
                <textarea 
                  placeholder="Internet lancar jaya sepuasnya tanpa lag..."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPkgModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-750 transition-colors"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BULK PRINT VOUCHER GENERATE --- */}
      {isGenModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                Cetak Bulk Hotspot Voucher
              </h3>
              <button onClick={() => setIsGenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTriggerGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Pilih Paket WiFi</label>
                <select 
                  value={genPkgId}
                  onChange={(e) => setGenPkgId(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 bg-white"
                >
                  {packagesSafe.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatRupiah(p.price)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Prefix Kode</label>
                  <input 
                    type="text" 
                    placeholder="e.g. VIP, KM, HS"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none text-center focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Jumlah Cetak</label>
                  <input 
                    type="number" n-min="1" n-max="100"
                    placeholder="e.g. 50"
                    value={genQty}
                    onChange={(e) => setGenQty(parseInt(e.target.value) || 10)}
                    className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none text-center focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                ⚠️ Router MikroTik akan secara dinamis memetakan kode voucher acak ini ke profile hotspot (speed limiter) saat customer login pertama kali.
              </p>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsGenModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-750 transition-colors"
                >
                  Cetak Massal Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
