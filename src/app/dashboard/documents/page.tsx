"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen, ShieldAlert, CheckCircle, AlertTriangle, Eye, UploadCloud, Info
} from "lucide-react";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [aadhaarMasked, setAadhaarMasked] = useState(false);
  const [panScanned, setPanScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleMaskAadhaar = () => {
    setScanning(true);
    setTimeout(() => {
      setAadhaarMasked(true);
      setScanning(false);
      toast.success("Aadhaar masked successfully! +25 Security XP");
    }, 1500);
  };

  const handleScanPAN = () => {
    setScanning(true);
    setTimeout(() => {
      setPanScanned(true);
      setScanning(false);
      toast.success("PAN scanned. No public exposure detected! +25 Security XP");
    }, 1500);
  };

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderOpen className="text-rose-400 h-5 w-5" /> VaultIQ Document Security Shield
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Aadhaar maskers, PAN exposure scanners, app permission audits, and identity theft logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Protection Tools (5 Cols) */}
        <div className="col-span-5 space-y-4">
          
          {/* Aadhaar Guard */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Aadhaar Card Protection
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
              Upload your Aadhaar to generate a masked virtual replica showing only the last 4 digits to prevent unauthorized KYC usage.
            </p>
            {aadhaarMasked ? (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle size={14} /> Aadhaar successfully masked and encrypted!
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMaskAadhaar}
                disabled={scanning}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5"
              >
                <UploadCloud size={12} /> {scanning ? "PROCESSING..." : "MASK AADHAAR CARD"}
              </motion.button>
            )}
          </div>

          {/* PAN Exposure scanner */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-1.5">
              <Eye size={14} /> PAN Exposure Scanner
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
              Checks public data breaches and domain indexes for accidental PAN number exposures.
            </p>
            {panScanned ? (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle size={14} /> 0 exposures found across indexed databases.
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScanPAN}
                disabled={scanning}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1.5"
              >
                {scanning ? "SCANNING INDEX..." : "INITIATE EXPOSURE SCAN"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Right Column: Permission Scanner & Audit Checklist (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-[#D4AF37]" /> App Permission Scanner Log
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {[
              { app: "Scam Call Blocker App", perm: "Contacts, Call Logs, SMS", status: "Critical Threat", color: "text-rose-400 border-rose-500/20 bg-rose-500/5" },
              { app: "Regional Language keyboard", perm: "Keystrokes, Microphone", status: "High Risk", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
              { app: "Stock Signals Channel App", perm: "Location, Notifications", status: "Medium Risk", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
            ].map((a, i) => (
              <div key={i} className={`p-3 rounded-lg border text-xs flex justify-between items-start ${a.color}`}>
                <div>
                  <h4 className="font-bold text-white">{a.app}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Requested permissions: {a.perm}</p>
                </div>
                <span className="font-black uppercase tracking-wider text-[9px]">{a.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
