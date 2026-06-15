import React, { useState } from "react";
import { Info, Image as ImageIcon, Save, Trash2, Plus } from "lucide-react";
import { AppDisplayConfig } from "../types";

export default function DisplayConfigPanel({
  displayConfig,
  onUpdateDisplayConfig
}: {
  displayConfig: AppDisplayConfig;
  onUpdateDisplayConfig: (runningText: string, adsImages: string[]) => void;
}) {
  const [runningText, setRunningText] = useState(displayConfig?.runningText || "");
  const [adsImages, setAdsImages] = useState(
    displayConfig?.adsImages?.length ? displayConfig.adsImages : [""]
  );

  const handleUpdate = () => {
    onUpdateDisplayConfig(runningText, adsImages.filter(i => i.trim() !== ""));
    alert("Konfigurasi Tampilan Portal Berhasil Diperbarui!");
  };

  const addImage = () => {
    setAdsImages([...adsImages, ""]);
  };

  const removeImage = (index: number) => {
    setAdsImages(adsImages.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, val: string) => {
    const updated = [...adsImages];
    updated[index] = val;
    setAdsImages(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2 dark:text-white">
            <Info className="text-indigo-500" /> Pengaturan Tampilan Portal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Atur Running Text (Marquee) dan Foto Banner yang akan tampil di Portal Pelanggan agar aplikasi terlihat lebih modern dan interaktif seperti Android Native.</p>
        </div>

        <hr className="border-slate-100 dark:border-slate-850" />

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
            Running Text (Pengumuman Berjalan)
          </label>
          <input 
            type="text" 
            placeholder="Ketik teks yang akan berjalan di layar pelanggan..." 
            value={runningText}
            onChange={e => setRunningText(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ImageIcon size={16} /> Image Banner Slider (URL Gambar)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">Masukkan link URL gambar rasio 21:9 atau 16:9 agar fit di perangkat.</p>
          
          <div className="space-y-3">
            {adsImages.map((img, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  value={img}
                  onChange={e => updateImage(idx, e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-200"
                />
                <button 
                  onClick={() => removeImage(idx)}
                  className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 text-red-500 p-3 rounded-xl transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addImage}
            className="text-xs flex items-center gap-1 font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Plus size={14} /> Tambah Gambar Slider
          </button>
        </div>

        <button 
          onClick={handleUpdate}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
        >
          Simpan Tampilan Portal
        </button>
      </div>
    </div>
  );
}
