import { useState, useMemo } from 'react';
import { Save, Radio } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CalibrationLog {
  id: number;
  date: string;
  sensor: string;
  slope: number; // percentage
  offset: number; // mV or mV/pH
  status: 'Conforme' | 'Dérive' | 'Critique';
  technician: string;
}

export default function Calibration() {
  const [logs, setLogs] = useState<CalibrationLog[]>([
    { id: 1, date: '2026-05-18', sensor: 'pH-mètre Cond. A', slope: 98.4, offset: -2.1, status: 'Conforme', technician: 'Yassine Touimi' },
    { id: 2, date: '2026-05-19', sensor: 'pH-mètre Cond. A', slope: 98.1, offset: -2.3, status: 'Conforme', technician: 'Yassine Touimi' },
    { id: 3, date: '2026-05-20', sensor: 'pH-mètre Cond. A', slope: 97.5, offset: -2.8, status: 'Conforme', technician: 'Yassine Touimi' },
    { id: 4, date: '2026-05-21', sensor: 'pH-mètre Cond. A', slope: 96.8, offset: -3.5, status: 'Dérive', technician: 'Yassine Touimi' },
    { id: 5, date: '2026-05-22', sensor: 'pH-mètre Cond. A', slope: 98.6, offset: -1.8, status: 'Conforme', technician: 'Yassine Touimi' }, // recalibrated
  ]);

  // Form states
  const [sensor, setSensor] = useState('pH-mètre Cond. A');
  const [pH4, setPh4] = useState('4.01');
  const [pH7, setPh7] = useState('7.00');
  const [pH10, setPh10] = useState('10.01');
  const [ec1413, setEc1413] = useState('1413');
  const [tech, setTech] = useState('');

  const computedSlope = useMemo(() => {
    // Simulated calculation of pH electrode slope based on buffers
    const p4 = parseFloat(pH4);
    const p7 = parseFloat(pH7);
    const p10 = parseFloat(pH10);
    
    // Normal ideal difference is 3 pH units. Let's compute a simulated slope %
    const diff1 = Math.abs(p7 - p4) / 3.0;
    const diff2 = Math.abs(p10 - p7) / 3.0;
    const slope = ((diff1 + diff2) / 2) * 100;
    return parseFloat(slope.toFixed(1));
  }, [pH4, pH7, pH10]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tech) {
      alert('Veuillez renseigner le nom du technicien.');
      return;
    }

    const newLog: CalibrationLog = {
      id: logs.length + 1,
      date: new Date().toISOString().split('T')[0],
      sensor,
      slope: computedSlope,
      offset: parseFloat((-1.5 - Math.random() * 2).toFixed(1)),
      status: computedSlope > 97 ? 'Conforme' : computedSlope > 95 ? 'Dérive' : 'Critique',
      technician: tech
    };

    setLogs([...logs, newLog]);
    setTech('');
    alert('Log d\'étalonnage quotidien enregistré.');
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Radio className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Étalonnage & Calibration Quotidienne (Sondes)
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Enregistrement des solutions étalons pH/Conductivité et suivi de dérive des pentes de mesure
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Left Column: Form */}
        <div className="w-full lg:w-[400px] flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden shrink-0">
          <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center shrink-0">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              Nouvel Étalonnage Journalier
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capteur / Électrode</label>
              <select
                value={sensor}
                onChange={e => setSensor(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="pH-mètre Cond. A">pH-mètre Cond. A (Shimadzu)</option>
                <option value="pH-mètre Cond. B">pH-mètre Cond. B (Mettler Toledo)</option>
                <option value="Conductimètre de paillasse">Conductimètre de paillasse</option>
              </select>
            </div>

            <div className="space-y-3 p-3 bg-[#070b11]/80 border border-[#1e293b] rounded-lg">
              <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider block border-b border-[#1e293b]/70 pb-1 mb-2">
                Tension lue sous Buffers pH
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-500 mb-1">pH 4.01 (mV)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pH4}
                    onChange={e => setPh4(e.target.value)}
                    className="w-full px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 mb-1">pH 7.00 (mV)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pH7}
                    onChange={e => setPh7(e.target.value)}
                    className="w-full px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 mb-1">pH 10.01 (mV)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pH10}
                    onChange={e => setPh10(e.target.value)}
                    className="w-full px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#070b11]/80 border border-[#1e293b] rounded-lg">
              <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider block border-b border-[#1e293b]/70 pb-1 mb-2">
                Standard de Conductivité (1413 µS/cm)
              </span>
              <div>
                <label className="block text-[8px] text-slate-500 mb-1">Valeur mesurée (µS/cm)</label>
                <input
                  type="number"
                  value={ec1413}
                  onChange={e => setEc1413(e.target.value)}
                  className="w-full px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Technicien Responsable</label>
              <input
                type="text"
                required
                placeholder="Yassine Touimi"
                value={tech}
                onChange={e => setTech(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-white placeholder-slate-600"
              />
            </div>

            <div className="pt-2 border-t border-[#1e293b]/60 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Pente Calculée</span>
                <span className="text-sm font-bold text-[#00f0ff] glow-cyan">{computedSlope}%</span>
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b11] font-bold rounded-lg uppercase transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 inline mr-1" /> Loguer
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Analytics Charts */}
        <div className="flex-grow flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden p-6 space-y-6">
          {/* Recharts chart */}
          <div className="bg-[#070b11]/60 border border-[#1e293b] rounded-xl p-4 flex flex-col h-56">
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-4">
              Pente de l'électrode pH (%) // Seuil critique &lt; 95%
            </span>
            <div className="flex-grow min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={8} tickLine={false} />
                  <YAxis domain={[90, 100]} stroke="#475569" fontSize={8} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', fontSize: '9px' }} />
                  <Line type="monotone" dataKey="slope" stroke="#00f0ff" strokeWidth={2} dot={{ r: 3 }} name="Pente pH" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table history */}
          <div className="flex-grow min-h-0 flex flex-col border border-[#1e293b] rounded-xl overflow-hidden bg-[#070b11]/30">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#131b2e] border-b border-[#1e293b] text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sonde</th>
                    <th className="py-3 px-4">Pente (%)</th>
                    <th className="py-3 px-4">Offset (mV)</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Technicien</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-350">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#1a2333]/20 transition-colors">
                      <td className="py-2.5 px-4">{log.date}</td>
                      <td className="py-2.5 px-4 font-bold text-white">{log.sensor}</td>
                      <td className="py-2.5 px-4 font-bold text-cyan-400">{log.slope}%</td>
                      <td className="py-2.5 px-4">{log.offset}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          log.status === 'Conforme' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[10px]">{log.technician}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
