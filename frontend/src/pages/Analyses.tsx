import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Plus, Search, CheckCircle2, Clock, Beaker,
  AlertTriangle, FlaskConical, TestTube
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import { type Analysis, type Sample, type Technician } from '../components/analyses/types';
import { VialTube } from '../components/analyses/VisualGauges';
import AnalysisFormModal from '../components/analyses/AnalysisFormModal';
import SpectrometerConsole from '../components/analyses/SpectrometerConsole';

const STATUS_TABS = ['Tous', 'En attente', 'En cours', 'Validé', 'Anomalie'];

export default function Analyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected analysis
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ── Fetchers ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchAnalyses();
    fetchSamples();
    fetchTechnicians();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/api/analyses');
      const data = res.data || [];
      setAnalyses(data);
    } catch {
      setError('Échec du chargement des analyses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await api.get('/api/samples');
      setSamples(res.data || []);
    } catch { /* silent */ }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/api/users');
      setTechnicians((res.data || []).filter((u: Technician) =>
        ['Technicien', 'Admin', 'Responsable'].includes(u.role)
      ));
    } catch { /* silent */ }
  };

  // Active loaded analysis
  const activeAnalysis = useMemo(() => {
    return analyses.find(a => a.id === selectedAnalysisId) || null;
  }, [analyses, selectedAnalysisId]);

  // Technician workload calculation
  const technicianLoads = useMemo(() => {
    const loads: Record<number, number> = {};
    analyses.forEach(a => {
      if (a.user_id && ['En attente', 'En cours'].includes(a.status)) {
        loads[a.user_id] = (loads[a.user_id] || 0) + 1;
      }
    });
    return loads;
  }, [analyses]);

  // Derived KPIs
  const kpis = useMemo(() => ({
    total:     analyses.length,
    pending:   analyses.filter(a => ['En attente', 'En cours'].includes(a.status)).length,
    validated: analyses.filter(a => a.status === 'Validé').length,
    critical:  analyses.filter(a => (a.risk_score ?? 0) > 70).length,
  }), [analyses]);

  // Filtered list
  const filtered = useMemo(() => {
    return analyses.filter(a => {
      const matchStatus = statusFilter === 'Tous' || a.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q
        || `AN-${a.id.toString().padStart(4, '0')}`.toLowerCase().includes(q)
        || (a.sample?.code ?? '').toLowerCase().includes(q)
        || (a.technician?.name ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [analyses, statusFilter, searchTerm]);

  // Tab count indicators
  const tabCounts = useMemo(() => ({
    'Tous':       analyses.length,
    'En attente': analyses.filter(a => a.status === 'En attente').length,
    'En cours':   analyses.filter(a => a.status === 'En cours').length,
    'Validé':     analyses.filter(a => a.status === 'Validé').length,
    'Anomalie':   analyses.filter(a => a.status === 'Anomalie').length,
  }), [analyses]);

  const findAnalysisBySlot = (rIdx: number, cIdx: number) => {
    return analyses.find(a => {
      const row = Math.floor((a.id - 1) / 5);
      const col = ((a.id - 1) % 5) + 1;
      return (row % 4) === rIdx && col === cIdx;
    });
  };

  const handleFormSubmitSuccess = async (createdId?: number) => {
    await fetchAnalyses();
    if (createdId) {
      setSelectedAnalysisId(createdId);
    }
  };

  const handleDeleteSuccess = async () => {
    setSelectedAnalysisId(null);
    await fetchAnalyses();
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Activity className="w-5 h-5 text-primary animate-pulse" /> Logiciel d'Analyses Physico-Chimiques
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Console ISO 17025 d'acquisition spectrométrique et de calibration de capteurs
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-[#070b11] text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-cyan-glow/20 shrink-0 font-mono uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Planifier Demande
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Analyses Totales', value: kpis.total, color: 'text-slate-100', glow: 'glow-cyan', bg: 'bg-[#00f0ff]/5', border: 'border-[#00f0ff]/20', icon: <FlaskConical className="w-4 h-4 text-primary" /> },
          { label: 'Attente / En cours', value: kpis.pending, color: 'text-[#38bdf8]', glow: 'text-shadow-[0_0_8px_rgba(56,189,248,0.4)]', bg: 'bg-sky-500/5', border: 'border-sky-500/20', icon: <Clock className="w-4 h-4 text-sky-400" /> },
          { label: 'Analyses Validées', value: kpis.validated, color: 'text-[#2dd4bf]', glow: 'text-shadow-[0_0_8px_rgba(45,212,191,0.4)]', bg: 'bg-teal-500/5', border: 'border-teal-500/20', icon: <CheckCircle2 className="w-4 h-4 text-teal-400" /> },
          { label: 'Risques Critiques', value: kpis.critical, color: 'text-[#f43f5e]', glow: 'glow-rose', bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
        ].map(k => (
          <div 
            key={k.label} 
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all duration-300 glass-panel border hover:border-primary/45 ${k.border}`}
          >
            <div className={`p-2 rounded-lg ${k.bg} border ${k.border} shrink-0`}>{k.icon}</div>
            <div>
              <div className={`text-xl font-black tracking-tight leading-none ${k.color} ${k.glow}`}>{k.value}</div>
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-1">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Split-Pane Console ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-grow h-full lg:h-[calc(100vh-230px)] min-h-[550px] overflow-hidden relative">
        
        {/* LEFT PANEL: ACTIVE VIAL RACK */}
        <div className="w-full lg:w-[350px] flex flex-col h-full glass-panel border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl shrink-0">
          {/* Header Rack */}
          <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5 text-primary" /> Rack d'Échantillons
              </span>
              <span className="text-[9px] bg-slate-800 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono font-bold">
                SLOT A1-A20
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher ID, échantillon, technicien..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-500 font-mono"
              />
            </div>

            {/* Well Plate Matrix Grid */}
            <div className="bg-[#070b11] border border-[#1e293b] rounded-lg p-2.5">
              <div className="flex justify-between items-center mb-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                <span>MATRICE DE PLACEMENT DU RACK</span>
                <span className="text-primary font-bold">GRILLE 5x4</span>
              </div>
              <div className="flex flex-col gap-1">
                {[0, 1, 2, 3].map(rIdx => {
                  const rowLabel = String.fromCharCode(65 + rIdx);
                  return (
                    <div key={rIdx} className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-slate-600 w-3 text-center">{rowLabel}</span>
                      <div className="flex-1 flex justify-between">
                        {[1, 2, 3, 4, 5].map(cIdx => {
                          const slotAn = findAnalysisBySlot(rIdx, cIdx);
                          const isSlotSelected = slotAn && selectedAnalysisId === slotAn.id;
                          
                          let statusColor = 'bg-slate-900 border-slate-800/80 text-slate-700';
                          if (slotAn) {
                            if (slotAn.status === 'Validé') statusColor = 'bg-emerald-500/80 border-emerald-400/30';
                            else if (slotAn.status === 'Anomalie') statusColor = 'bg-rose-500/80 border-rose-400/30';
                            else if (slotAn.status === 'En cours') statusColor = 'bg-sky-500/80 border-sky-400/30';
                            else statusColor = 'bg-amber-500/80 border-amber-400/30';
                          }

                          return (
                            <button
                              key={cIdx}
                              disabled={!slotAn}
                              onClick={() => slotAn && setSelectedAnalysisId(slotAn.id)}
                              title={slotAn ? `Slot ${rowLabel}${cIdx} : AN-${slotAn.id.toString().padStart(4, '0')} (${slotAn.status})` : `Slot ${rowLabel}${cIdx} libre`}
                              className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${statusColor} ${
                                isSlotSelected 
                                  ? 'ring-1 ring-primary ring-offset-1 ring-offset-[#070b11] scale-110 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                                  : slotAn ? 'hover:scale-105 cursor-pointer hover:border-slate-400' : 'opacity-20 cursor-not-allowed'
                              }`}
                            >
                              {isSlotSelected && <span className="w-1 h-1 rounded-full bg-white animate-ping" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-[#1e293b]/40 text-[7px] font-mono text-slate-500">
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Attente</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> En cours</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Validé</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Anomalie</div>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
              {STATUS_TABS.map(tab => {
                const count = tabCounts[tab as keyof typeof tabCounts] ?? 0;
                const isActive = statusFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all shrink-0 flex items-center gap-1 font-mono uppercase tracking-wider cursor-pointer ${
                      isActive
                        ? 'bg-primary text-[#070b11] border-primary shadow-cyan-glow/20'
                        : 'bg-[#070b11]/60 text-slate-400 border-[#1e293b] hover:border-primary/50'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`px-1 py-0.2 rounded-full text-[8px] font-mono ${
                      isActive ? 'bg-[#070b11]/25 text-[#070b11] font-bold' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vials Shelf List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#070b11]/30">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-505">
                <div className="w-6 h-6 border-[2px] border-primary/25 border-t-primary rounded-full animate-spin" />
                <span className="text-[11px] font-mono">Lecture du Rack...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-rose-500 font-mono">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-505">
                <TestTube className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">RACK VIDE</p>
                <p className="text-[10px] text-slate-505 mt-0.5 font-mono">Aucune analyse correspondante.</p>
              </div>
            ) : (
              filtered.map(analysis => {
                const isSelected = selectedAnalysisId === analysis.id;
                const rs = analysis.risk_score;
                
                return (
                  <div
                    key={analysis.id}
                    onClick={() => setSelectedAnalysisId(analysis.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#0d131f] border-primary shadow-cyan-glow/10 ring-1 ring-primary/30'
                        : 'bg-[#0d131f]/45 border-[#1e293b]/70 hover:border-slate-700 hover:bg-[#0d131f]/75'
                    }`}
                  >
                    {/* Visual Test tube */}
                    <VialTube status={analysis.status} />

                    {/* Meta info */}
                    <div className="flex-grow min-w-0 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono font-bold">
                            {(() => {
                              const r = Math.floor((analysis.id - 1) / 5);
                              const c = ((analysis.id - 1) % 5) + 1;
                              return `${String.fromCharCode(65 + (r % 4))}${c}`;
                            })()}
                          </span>
                          <span className={`font-mono text-xs font-black ${isSelected ? 'text-primary glow-cyan' : 'text-slate-200'}`}>
                            AN-{analysis.id.toString().padStart(4, '0')}
                          </span>
                        </div>
                        {/* LED status light */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            analysis.status === 'Validé' ? 'bg-emerald-500' :
                            analysis.status === 'Anomalie' ? 'bg-rose-500 animate-ping' :
                            analysis.status === 'En cours' ? 'bg-sky-500 animate-pulse' : 'bg-slate-500'
                          }`} />
                          <span className="text-[9px] font-mono text-slate-400">{analysis.status}</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono font-medium text-slate-400 mt-0.5 flex justify-between">
                        <span>Éch: {analysis.sample?.code ?? `#${analysis.sample_id}`}</span>
                        {rs !== null && (
                          <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                            rs > 70 ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 
                            rs > 35 ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 
                            'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          }`}>
                            Risque {rs}%
                          </span>
                        )}
                      </div>

                      {/* Parameters snippet */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {analysis.parameters?.slice(0, 3).map(p => (
                          <span key={p} className="bg-[#070b11] text-slate-400 border border-[#1e293b]/70 px-1.5 py-0.2 rounded text-[9px] font-mono">
                            {p}
                          </span>
                        ))}
                        {(analysis.parameters?.length ?? 0) > 3 && (
                          <span className="bg-[#070b11] text-slate-505 border border-[#1e293b]/70 px-1 py-0.2 rounded text-[9px] font-mono">
                            +{analysis.parameters.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: INSTRUMENT VIEWPORT */}
        <div className="flex-grow flex flex-col h-full overflow-hidden relative">
          <SpectrometerConsole
            activeAnalysis={activeAnalysis}
            onClose={() => setSelectedAnalysisId(null)}
            onDeleteSuccess={handleDeleteSuccess}
            onValidateSuccess={fetchAnalyses}
            user={user}
            onScheduleClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* ── Modal (Schedule Request) ── */}
      <AnalysisFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        samples={samples}
        technicians={technicians}
        technicianLoads={technicianLoads}
        onSubmitSuccess={handleFormSubmitSuccess}
      />
    </div>
  );
}
