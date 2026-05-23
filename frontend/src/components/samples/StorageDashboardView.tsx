import { AlertCircle, Activity } from 'lucide-react';

interface StorageUnit {
  name: string;
  temp: string;
  capacity: number;
  occupied: number;
  occupancy_rate: number;
}

interface StorageDashboardViewProps {
  storageLoading: boolean;
  storageOccupancies: StorageUnit[];
}

export default function StorageDashboardView({
  storageLoading,
  storageOccupancies
}: StorageDashboardViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl space-y-6 font-mono text-slate-300">
      <div className="space-y-2">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
          Surveillance Capteurs & Températures
        </span>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mt-1">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          ÉTATS DE STOCKAGE 2D & CLIMATIQUE
        </h2>
        <p className="text-xs text-slate-400 font-medium">Indicateurs visuels et saturation des réfrigérateurs et congélateurs critiques de conservation ISO 17025.</p>
      </div>

      {storageLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-950 rounded-xl border border-slate-850">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
          <span className="text-xs text-slate-400 font-bold">Chargement de la télémétrie de stockage...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {storageOccupancies.map((unit, idx) => {
            const occupancyRate = Math.round(unit.occupancy_rate);
            const isSaturated = occupancyRate >= 85;
            const strokeDashoffset = 113 - (113 * occupancyRate) / 100;
            
            let strokeColor = 'stroke-cyan-400';
            let strokeGlow = 'drop-shadow-[0_0_4px_#00f0ff]';
            if (isSaturated) {
              strokeColor = 'stroke-rose-500';
              strokeGlow = 'drop-shadow-[0_0_4px_#ff2e63]';
            } else if (occupancyRate > 60) {
              strokeColor = 'stroke-amber-500';
              strokeGlow = 'drop-shadow-[0_0_4px_#f59e0b]';
            }

            return (
              <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4 hover:border-slate-750 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900/50 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/5 transition-all"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-800/30 font-mono tracking-wider">{unit.temp}</span>
                    <h3 className="font-extrabold text-white text-xs mt-3.5 truncate max-w-[140px]" title={unit.name}>{unit.name}</h3>
                  </div>

                  {/* SVG Gauge */}
                  <div className="relative shrink-0 w-16 h-16 flex items-center justify-center bg-slate-900 rounded-full border border-slate-800 shadow-inner">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" className="stroke-slate-800 fill-none" strokeWidth="3.5" />
                      <circle cx="24" cy="24" r="18" className={`${strokeColor} ${strokeGlow} fill-none transition-all duration-500`} strokeWidth="3.5" strokeDasharray="113" strokeDashoffset={strokeDashoffset} />
                    </svg>
                    <span className="absolute text-[10px] font-black text-white">{occupancyRate}%</span>
                  </div>
                </div>

                <div className="space-y-2.5 relative z-10">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Occupé :</span>
                    <span className="text-white font-extrabold">{unit.occupied} / {unit.capacity}</span>
                  </div>
                  
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-800/30">
                    <div className={`h-full rounded-full transition-all duration-500 ${isSaturated ? 'bg-rose-500 shadow-[0_0_6px_#ff2e63]' : occupancyRate > 60 ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]'}`} style={{ width: `${occupancyRate}%` }} />
                  </div>

                  {isSaturated && (
                    <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-[9px] text-rose-300 font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>⚠️ SATURATION PROCHE ({occupancyRate}%) - Réassigner les prélèvements.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
