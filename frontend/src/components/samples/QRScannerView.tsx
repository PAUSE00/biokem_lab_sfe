import React from 'react';
import { QrCode, History, Edit, Check, Scan, Play } from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Deviation {
  id: number;
  type: string;
  actual_value: string;
  expected_limit: string;
  status: string;
  created_at: string;
}

interface Sample {
  id: number;
  code: string;
  type: string;
  status: 'Reçu' | 'En cours' | 'Terminé' | 'Anomalie';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Critique';
  volume: string;
  storage_location: string;
  temp_condition: string;
  temp_value: number | null;
  created_at: string;
  technician?: User | null;
  deviations?: Deviation[];
}

interface QRScannerViewProps {
  samples: Sample[];
  scannerLoading: boolean;
  setScannerLoading: (loading: boolean) => void;
  scannerResult: string | null;
  setScannerResult: (res: string | null) => void;
  scannerCameraActive: boolean;
  setScannerCameraActive: (active: boolean) => void;
  playBeep: () => void;
  openHistoryDrawer: (sample: Sample) => void;
  openEditModal: (sample: Sample) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function QRScannerView({
  samples,
  scannerLoading,
  setScannerLoading,
  scannerResult,
  setScannerResult,
  scannerCameraActive,
  setScannerCameraActive,
  playBeep,
  openHistoryDrawer,
  openEditModal,
  getStatusBadge
}: QRScannerViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 max-w-xl mx-auto space-y-6 rounded-xl shadow-2xl relative overflow-hidden font-mono text-slate-350">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="text-center space-y-2 relative z-10">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
          Système Optique Simulé
        </span>
        <h2 className="text-lg font-extrabold text-white flex items-center justify-center gap-2 mt-1">
          <Scan className="w-5 h-5 text-cyan-400 animate-pulse" />
          LECTEUR OPTIQUE QR CODE
        </h2>
        <p className="text-xs text-slate-400 font-medium">Scannez le code QR d'un flacon physique pour afficher instantanément sa fiche de traçabilité</p>
      </div>

      <div className="relative w-80 h-80 mx-auto bg-slate-950 rounded-xl border-4 border-slate-850 overflow-hidden flex flex-col items-center justify-center shadow-inner relative z-10">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes laserScan {
            0% { top: 10%; opacity: 0.8; }
            50% { top: 90%; opacity: 1; }
            100% { top: 10%; opacity: 0.8; }
          }
          .animate-laser {
            animation: laserScan 2.5s infinite linear;
          }
        ` }} />
        
        {scannerCameraActive ? (
          <>
            {/* Simulated Camera Feed Container */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#131e35_10%,_#020617_90%)] flex flex-col items-center justify-center opacity-70">
              <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mt-4 tracking-widest">Flux Caméra Actif</span>
            </div>
            
            {/* Laser Overlay scanning effect */}
            <div className="absolute left-4 right-4 h-0.5 bg-cyan-500 shadow-[0_0_12px_#00f0ff] animate-laser z-20"></div>

            {/* Target Frame Reticle Overlay */}
            <div className="absolute w-48 h-48 border-2 border-cyan-550/20 border-cyan-500/20 rounded-lg z-10 flex items-center justify-center pointer-events-none">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-md"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-md"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-md"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-md"></div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 p-6 relative z-10">
            <QrCode className="w-16 h-16 text-slate-700 mx-auto" />
            <button
              onClick={() => {
                setScannerCameraActive(true);
                setScannerResult(null);
              }}
              className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md transition-all shadow-lg shadow-cyan-600/20 hover:scale-[1.02] cursor-pointer flex items-center gap-2 mx-auto"
            >
              <Play className="w-4 h-4" /> DÉMARRER LA CAMÉRA
            </button>
          </div>
        )}
      </div>

      {scannerCameraActive && (
        <div className="space-y-4 relative z-10">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-md mx-auto space-y-3">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Simuler le flash d'un échantillon physique :</label>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  const sampleCode = e.target.value;
                  if (!sampleCode) return;
                  setScannerLoading(true);
                  setTimeout(() => {
                    playBeep();
                    setScannerResult(sampleCode);
                    setScannerLoading(false);
                  }, 1200);
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 text-xs font-bold rounded-md text-white outline-none cursor-pointer hover:border-slate-700 transition-colors"
                disabled={scannerLoading}
              >
                <option value="">Sélectionner un code à flasher...</option>
                {samples.map(s => (
                  <option key={s.id} value={s.code} className="bg-slate-900">{s.code} - {s.type}</option>
                ))}
              </select>
            </div>
          </div>

          {scannerLoading && (
            <div className="flex justify-center items-center gap-2 text-xs font-bold text-cyan-400">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></span>
              Lecture du code QR en cours...
            </div>
          )}

          {scannerResult && (
            (() => {
              const matchedSample = samples.find(s => s.code === scannerResult);
              return (
                <div className="p-5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl max-w-md mx-auto animate-in fade-in duration-300 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-800/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-cyan-455 text-cyan-400 tracking-widest">Lecture validée</span>
                      <h4 className="font-extrabold text-white text-sm mt-0.5 font-mono">Code : {scannerResult}</h4>
                    </div>
                  </div>

                  {matchedSample ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 font-bold bg-slate-950 p-4 rounded-lg border border-slate-850 font-mono">
                        <div>Type : <span className="text-white">{matchedSample.type}</span></div>
                        <div className="flex items-center gap-1.5">Statut : {getStatusBadge(matchedSample.status)}</div>
                        <div>Température : <span className="text-white">{matchedSample.temp_value !== null ? `${matchedSample.temp_value}°C` : 'N/D'}</span></div>
                        <div>Volume : <span className="text-white">{matchedSample.volume || 'N/D'}</span></div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={() => openHistoryDrawer(matchedSample)}
                          className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-555 hover:bg-cyan-500 text-white font-bold rounded-md text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/10 border border-cyan-500/20"
                        >
                          <History className="w-4 h-4" /> Voir Traçabilité
                        </button>
                        <button
                          onClick={() => openEditModal(matchedSample)}
                          className="flex-1 py-2.5 px-3 border border-slate-800 text-slate-300 bg-slate-950 hover:bg-slate-900 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-4 h-4 text-slate-500" /> Éditer l'Échantillon
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-rose-500">
                      Échantillon non trouvé dans la base locale. Le code a pu être supprimé.
                    </p>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
