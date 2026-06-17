import React, { useState } from "react";
import {
  User,
  Lock,
  LogIn,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onLoginSuccess: (userRole: "admin" | "customer", userData?: any) => void;
  onRegisterCustom: () => void;
}

export default function UnifiedLogin({
  onLoginSuccess,
  onRegisterCustom,
}: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess(data.role, data.user);
      } else {
        setErrorMsg(data.error || "Kredensial tidak valid");
      }
    } catch (e) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="text-white" size={32} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang</h1>
          <p className="text-slate-400 text-sm mb-8">
            Masuk dengan satu akun untuk semua akses jaringan Adila.Net (Admin,
            User, atau Teknisi).
          </p>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2 mb-6"
            >
              <div className="mt-0.5">⚠️</div>
              <p>{errorMsg}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau nomor HP"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk Sekarang
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-900/80 p-6 border-t border-white/5 text-center flex flex-col items-center">
          <p className="text-sm text-slate-400 mb-3">
            Belum punya akun member?
          </p>
          <button
            onClick={onRegisterCustom}
            className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <UserPlus size={16} />
            Daftar Member Baru
          </button>
        </div>
      </motion.div>
    </div>
  );
}
