import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Wallet,
  ShieldAlert,
  UserX,
  Check,
  UserCheck,
  X,
  Trash2,
  UserPlus,
} from "lucide-react";
import { CustomerAccount } from "../types";

interface Props {
  customers: CustomerAccount[];
  onAddCustomer: (
    name: string,
    username: string,
    phone: string,
    password?: string,
  ) => void;
  onTopupCustomerManual: (customerId: string, amount: number) => void;
  onToggleCustomerStatus: (customerId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export default function MemberManager({
  customers,
  onAddCustomer,
  onTopupCustomerManual,
  onToggleCustomerStatus,
  onDeleteCustomer,
}: Props) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Add customer form states
  const [custName, setCustName] = useState("");
  const [custUsername, setCustUsername] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPassword, setCustPassword] = useState("");

  // Topup manual form states
  const [topupAmount, setTopupAmount] = useState("");

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custUsername || !custPhone || !custPassword) {
      alert("Harap lengkapi semua kolom!");
      return;
    }
    onAddCustomer(
      custName,
      custUsername.toLowerCase().trim(),
      custPhone,
      custPassword,
    );
    setCustName("");
    setCustUsername("");
    setCustPhone("");
    setCustPassword("");
    setIsAddOpen(false);
  };

  const handleManualTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(topupAmount);
    if (!selectedCustomerId || isNaN(amt) || amt <= 0) {
      alert("Harap pilih pelanggan & masukkan nominal valid!");
      return;
    }
    onTopupCustomerManual(selectedCustomerId, amt);
    setTopupAmount("");
    setSelectedCustomerId("");
    setIsTopupOpen(false);
  };

  const customersSafe = customers || [];

  const filteredCustomers = customersSafe.filter((c) => {
    return (
      (c?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c?.phone || "").includes(searchQuery)
    );
  });

  const selectedCustObj = customersSafe.find(
    (c) => c.id === selectedCustomerId,
  );

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Manajemen Pelanggan & Deposit Saldo
          </h2>
          <p className="text-xs text-slate-500">
            Daftarkan akun portal pelanggan khusus dan isi saldo manual bagi
            yang menyetor tunai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus size={14} />
            Registrasi Pelanggan Baru
          </button>
        </div>
      </div>

      {/* Main Grid: Member search & list */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs w-full max-w-sm">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, username (@...), atau no HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-700"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-bold">
            Total Terdaftar: {customers.length} Orang
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-mono text-[10px] uppercase">
                <th className="py-3 px-4 font-bold">NAMA PELANGGAN</th>
                <th className="py-3 px-4 font-bold">KONTAK INFO</th>
                <th className="py-3 px-4 font-bold">REGISTERED VIA</th>
                <th className="py-3 px-4 font-bold">SALDO DEPOSIT</th>
                <th className="py-3 px-4 font-bold">STATUS SYSTEM</th>
                <th className="py-3 px-4 text-center">AKSI MANAJEMEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-400 text-xs"
                  >
                    Belum ada pelanggan terdaftar yang cocok dengan pencarian
                    kata kunci.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-indigo-600 font-mono font-bold">
                          @{c.username}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      <div>{c.phone}</div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        {c.joinedDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                          c.registeredVia === "WebPortal"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.registeredVia === "WebPortal"
                          ? "WEB PORTAL"
                          : "REGISTER BY ADM"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-base font-extrabold text-emerald-600">
                      {formatRupiah(c.saldo)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}
                      >
                        {c.status === "Active" ? "AKTIF" : "DITANGGUHKAN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* MANUAL TOP-UP BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setIsTopupOpen(true);
                          }}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-100 cursor-pointer"
                        >
                          <Wallet size={12} />+ Top Up
                        </button>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => onToggleCustomerStatus(c.id)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            c.status === "Active"
                              ? "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"
                              : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          }`}
                          title={
                            c.status === "Active"
                              ? "Tangguhkan Pelanggan"
                              : "Aktifkan Pelanggan"
                          }
                        >
                          {c.status === "Active" ? (
                            <UserX size={13} />
                          ) : (
                            <UserCheck size={13} />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Apakah Anda yakin ingin menghapus pelanggan @${c.username}?\nTindakan ini ireversibel.`,
                              )
                            ) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: REGISTRASI PELANGGAN --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Registrasi Akun Portal Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Yusuf"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                  Username Portal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: yusuf88"
                  value={custUsername}
                  onChange={(e) => setCustUsername(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                  No WhatsApp Aktif
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 085234567890"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                  Kata Sandi Akun
                </label>
                <input
                  type="password"
                  required
                  placeholder="Default / custom password"
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-750 transition-colors"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: MANUAL CREDIT TOPUP --- */}
      {isTopupOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" />
                Isi Saldo Manual (Cash Setor Tunai)
              </h3>
              <button
                onClick={() => {
                  setIsTopupOpen(false);
                  setSelectedCustomerId("");
                  setTopupAmount("");
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualTopupSubmit} className="space-y-4">
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono">
                  Penerima Sandi
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {selectedCustObj?.name} (@{selectedCustObj?.username})
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Saldo Terkini:{" "}
                  {selectedCustObj
                    ? formatRupiah(selectedCustObj.saldo)
                    : "Rp0"}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                  Jumlah Saldo yang Dititipkan (Rp)
                </label>
                <input
                  type="number"
                  n-min="500"
                  n-max="1000000"
                  required
                  placeholder="Contoh: 15000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none font-bold text-slate-800"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsTopupOpen(false);
                    setSelectedCustomerId("");
                    setTopupAmount("");
                  }}
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-750 transition-colors cursor-pointer"
                >
                  Isi Saldo Tunai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
