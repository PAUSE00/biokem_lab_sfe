import { useState, useEffect } from 'react';
import { Cpu, Thermometer, Radio, Clock } from 'lucide-react';
import api from '../services/api';

interface Equipment {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  status: 'Actif' | 'En maintenance' | 'En étalonnage' | 'Inactif';
  last_calibration_at: string | null;
  next_calibration_at: string | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
}

export default function Equipements() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulated instrument telemetry values
  const [telemetry, setTelemetry] = useState<Record<string, { temp: number; lampHours: number; statusSignal: string }>>({});

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Update telemetry values to simulate live sensors reading
  useEffect(() => {
    if (equipments.length === 0) return;
    
    const initTelemetry: Record<string, { temp: number; lampHours: number; statusSignal: string }> = {};
    equipments.forEach(eq => {
      initTelemetry[eq.serial_number] = {
        temp: 24.8 + Math.random() * 0.4,
        lampHours: Math.floor(1200 + Math.random() * 500),
        statusSignal: 'STABLE'
      };
    });
    setTelemetry(initTelemetry);

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const copy = { ...prev };
        Object.keys(copy).forEach(sn => {
          copy[sn] = {
            temp: 24.9 + Math.random() * 0.3,
            lampHours: copy[sn].lampHours + (Math.random() > 0.95 ? 1 : 0),
            statusSignal: Math.random() > 0.98 ? 'CALIBRATING' : 'STABLE'
          };
        });
        return copy;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [equipments]);

  const fetchEquipments = async () => {
    try {
      const res = await api.get('/api/equipments');
      setEquipments(res.data || []);
    } catch {
      setError('Échec du chargement des équipements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Cpu className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Diagnostic & Télémétrie Instrumental
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Surveillance en temps réel des températures de cuves, temps de vie des lampes UV et signaux d'étalonnage
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto bg-[#070b11]/10 p-1 space-y-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-[2px] border-[#00f0ff]/25 border-t-[#00f0ff] rounded-full animate-spin" />
            <span className="text-[11px] font-mono text-slate-400">Interrogation du parc instrumental...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-rose-500 font-mono">{error}</div>
        ) : equipments.length === 0 ? (
          <div className="py-24 text-center text-slate-500 font-mono text-xs">
            Aucun instrument enregistré dans la base de données.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipments.map(eq => {
              const tel = telemetry[eq.serial_number] || { temp: 25.0, lampHours: 1500, statusSignal: 'STABLE' };
              
              return (
                <div key={eq.id} className="glass-panel border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between hover:border-[#00f0ff]/30 transition-all duration-300 relative overflow-hidden group">
                  {/* Glowing sensor beam */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none rounded-bl-full" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-sm font-black font-mono text-slate-100 uppercase">{eq.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">{eq.model} // S/N: {eq.serial_number}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        eq.status === 'Actif' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30 glow-lime' :
                        eq.status === 'En maintenance' ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' :
                        'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {eq.status}
                      </span>
                    </div>

                    {/* Sensor Telemetry dashboard */}
                    <div className="grid grid-cols-3 gap-3.5 my-4 p-3.5 bg-[#070b11] border border-[#1e293b] rounded-lg">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Thermometer className="w-4 h-4 text-cyan-400 mb-1" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Temp. Cuve</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{tel.temp.toFixed(1)} °C</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center border-l border-r border-[#1e293b]/70">
                        <Clock className="w-4 h-4 text-cyan-400 mb-1" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Heures Lampe</span>
                        <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">{tel.lampHours} h</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center">
                        <Radio className="w-4 h-4 text-[#a3e635] mb-1 animate-pulse" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Statut Signal</span>
                        <span className="text-xs font-mono font-bold text-[#a3e635] mt-0.5 uppercase">{tel.statusSignal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1e293b]/60 flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Calibré le : {eq.last_calibration_at ? new Date(eq.last_calibration_at).toLocaleDateString() : 'N/A'}</span>
                    <span className="text-cyan-400">Prochain étalonnage: {eq.next_calibration_at ? new Date(eq.next_calibration_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
