import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Key, 
  VolumeX, 
  Volume2, 
  Trash2, 
  Smartphone, 
  User, 
  Sparkles,
  RefreshCw,
  Eye,
  Info
} from "lucide-react";
import { BotSetting, ChatSimMessage, CustomerAccount } from "../types";

interface Props {
  configs: BotSetting[];
  chatLogs: ChatSimMessage[];
  customers: CustomerAccount[];
  onUpdateConfig: (provider: 'WhatsApp' | 'Telegram', apiKey: string, welcomeMessage: string, autoRepliesEnabled: boolean) => void;
  onSimulateMessage: (provider: 'WhatsApp' | 'Telegram', messageText: string, senderPhoneOrUser: string, senderName: string) => void;
  onClearLogs: () => void;
}

export default function BotIntegration({
  configs,
  chatLogs,
  customers,
  onUpdateConfig,
  onSimulateMessage,
  onClearLogs
}: Props) {
  const configsSafe = configs || [];
  const chatLogsSafe = chatLogs || [];
  const customersSafe = customers || [];

  // Config state
  const [activeProvider, setActiveProvider] = useState<'WhatsApp' | 'Telegram'>("WhatsApp");
  const [apiKey, setApiKey] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [isRepliesActive, setIsRepliesActive] = useState(true);

  // Simulation states
  const [simProvider, setSimProvider] = useState<'WhatsApp' | 'Telegram'>("WhatsApp");
  const [selectedUserPhone, setSelectedUserPhone] = useState("08123456789");
  const [selectedUserName, setSelectedUserName] = useState("Andi Wijaya");
  const [inputText, setInputText] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLogsSafe]);

  // Load config when toggling tab
  useEffect(() => {
    const activeCfg = configsSafe.find(c => c.provider === activeProvider);
    if (activeCfg) {
      setApiKey(activeCfg.apiKey);
      setWelcomeMsg(activeCfg.welcomeMessage);
      setIsRepliesActive(activeCfg.autoRepliesEnabled);
    }
  }, [activeProvider, configsSafe]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(activeProvider, apiKey, welcomeMsg, isRepliesActive);
    alert(`Konfigurasi Bot ${activeProvider} berhasil disimpan!`);
  };

  const handleSimulateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSimulateMessage(simProvider, inputText, selectedUserPhone, selectedUserName);
    setInputText("");
  };

  const activeBotConfig = configsSafe.find(c => c.provider === simProvider);

  return (
    <div className="space-y-6">
      {/* Introduction banner */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">Bot WhatsApp & Telegram Portal</h2>
        <p className="text-xs text-slate-500">Membantu transaksi isi ulang & pembelian voucher hotspot secara otomatis 24 jam via chat messaging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: BOT KEY CONFIGURATIONS (Lg: col-span-5) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
          <div className="flex border-b border-slate-100 pb-0.5 text-xs">
            <button 
              type="button" 
              onClick={() => setActiveProvider("WhatsApp")}
              className={`flex-1 py-1.5 font-bold border-b-2 text-center transition-all cursor-pointer ${activeProvider === "WhatsApp" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400"}`}
            >
              Config WhatsApp Bot
            </button>
            <button 
              type="button" 
              onClick={() => setActiveProvider("Telegram")}
              className={`flex-1 py-1.5 font-bold border-b-2 text-center transition-all cursor-pointer ${activeProvider === "Telegram" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400"}`}
            >
              Config Telegram Bot
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Status Sambungan</label>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-xs font-semibold text-slate-700">
                  {apiKey ? "🟢 Terbuka & Siap Beroperasi (Simulasi Online)" : "🔴 Belum Dikonfigurasi"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">API Key / Token Kredensial</label>
              <div className="relative flex items-center">
                <Key className="absolute left-3 text-slate-400" size={14} />
                <input 
                  type="password" 
                  placeholder={activeProvider === "WhatsApp" ? "WhatsApp Web Session ID / API Server Key" : "HTTP BotFather API Token"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 pl-8 pr-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Pemberitahu Balas Otomatis (Auto-Reply)</label>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/65 rounded-xl text-xs text-slate-700">
                <span className="font-semibold">Aktifkan Respon Robot</span>
                <button 
                  type="button"
                  onClick={() => setIsRepliesActive(!isRepliesActive)}
                  className={`p-1 rounded-lg ${isRepliesActive ? 'text-indigo-600' : 'text-slate-400'}`}
                >
                  {isRepliesActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Welcome Message Menu</label>
              <textarea 
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className="w-full text-xs border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 h-40 resize-none text-slate-700 leading-relaxed font-sans"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl border-b-2 border-slate-950 shadow-xs cursor-pointer active:translate-y-0.5 transition-transform"
            >
              Simpan & Hubungkan Bot {activeProvider}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHATBOT SIMULATOR (Lg: col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden flex flex-col min-h-[460px]">
          
          {/* Simulation controller topbar */}
          <div className="p-4 border-b border-indigo-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-600 animate-pulse" />
              <span className="font-bold text-slate-800">Uji Chatbot Simulator</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Simulator provider choice */}
              <select 
                value={simProvider}
                onChange={(e) => setSimProvider(e.target.value as 'WhatsApp' | 'Telegram')}
                className="bg-white border border-slate-200 px-2 py-1 rounded-lg outline-none font-bold text-slate-700 cursor-any"
              >
                <option value="WhatsApp">Uji via WhatsApp</option>
                <option value="Telegram">Uji via Telegram</option>
              </select>

              {/* Sender account simulator selector */}
              <select
                value={selectedUserPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserPhone(val);
                  const found = customersSafe.find(c => c.phone === val || c.username === val);
                  if (found) {
                    setSelectedUserName(found.name);
                  } else {
                    setSelectedUserName("Tamu Guest");
                  }
                }}
                className="bg-white border border-slate-200 px-2 py-1 rounded-lg outline-none font-medium text-slate-600 cursor-any max-w-[120px]"
              >
                <option value="08xxxxxxxx">Guest (Tamu)</option>
                {customersSafe.map(c => (
                  <option key={c.id} value={simProvider === 'WhatsApp' ? c.phone : c.username}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Clear messages */}
              <button 
                onClick={onClearLogs}
                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-slate-100"
                title="Hapus riwayat pesan chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Interactive Chat Window list */}
          <div className={`p-4 flex-1 h-96 overflow-y-auto space-y-3 flex flex-col ${simProvider === 'WhatsApp' ? 'bg-[#efeae2]' : 'bg-[#f4f4f7]'}`}>
            
            {/* System banner instructions */}
            <div className="text-center">
              <span className="bg-white/80 backdrop-blur-xs text-[10px] text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/50 shadow-3xs inline-block font-mono">
                Chatbot Server Online. Ketik *HELP* atau *INFO* untuk mulai menguji.
              </span>
            </div>

            {chatLogsSafe.filter(log => log.provider === simProvider).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-1">
                <Smartphone size={28} className="text-slate-350" />
                <span className="text-xs">Belum ada obrolan simulator chatbot.</span>
                <span className="text-[10px] text-slate-400 italic">Ketik pesan di bawah dan lihat auto-reply robot.</span>
              </div>
            ) : (
              chatLogsSafe.filter(log => log.provider === simProvider).map((log, idx) => (
                <div key={log.id} className="space-y-1.5">
                  {/* Sender user label */}
                  {log.isIncoming && (
                    <div className="text-[9px] text-slate-400 font-bold ml-1 flex items-center gap-1">
                      <User size={8} /> {log.senderName} ({log.senderPhoneOrUser})
                    </div>
                  )}
                  
                  {/* Incoming user balloon */}
                  {log.isIncoming && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white rounded-xl p-2.5 text-xs text-slate-800 shadow-3xs border border-slate-200/30">
                        <div className="whitespace-pre-wrap font-medium">{log.messageText}</div>
                        <div className="text-[8px] text-slate-400 text-right mt-1 font-mono font-bold">{log.timestamp}</div>
                      </div>
                    </div>
                  )}

                  {/* Robot automatic reply balloon */}
                  {log.replyText && (
                    <div className="flex flex-col space-y-1">
                      <div className="text-[9px] text-slate-400 font-bold mr-1 text-right flex items-center justify-end gap-1">
                        <Bot size={8} className="text-indigo-600" /> Auto-Robot: {activeBotConfig?.botUsername || "Bot Server"}
                      </div>
                      <div className="flex justify-end">
                        <div className={`max-w-[85%] rounded-xl p-2.5 text-xs shadow-3xs whitespace-pre-wrap ${
                          simProvider === 'WhatsApp' 
                            ? "bg-[#d9fdd3] text-emerald-950 border border-emerald-100" 
                            : "bg-indigo-50 border border-indigo-100 text-indigo-950"
                        }`}>
                          <div className="font-sans leading-relaxed">{log.replyText}</div>
                          <div className="text-[8px] text-slate-400 text-right mt-1 font-mono font-bold flex items-center justify-end gap-1">
                            {simProvider === 'WhatsApp' ? "✓✓" : ""} {log.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat user payload entry */}
          <form onSubmit={handleSimulateSend} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
            <input 
              type="text" 
              placeholder="Contoh: PAKET atau BELI#pkg-1 atau TOPUP#15000..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs border border-slate-300 px-3.5 py-2 rounded-xl outline-auto bg-white text-slate-700"
            />
            <button 
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
