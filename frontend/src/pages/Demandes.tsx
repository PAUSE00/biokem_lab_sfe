import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Calendar, User } from 'lucide-react';
import api from '../services/api';
import { type Analysis, type Sample, type Technician } from '../components/analyses/types';
import AnalysisFormModal from '../components/analyses/AnalysisFormModal';

export default function Demandes() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [anRes, saRes, usRes] = await Promise.all([
        api.get('/api/analyses'),
        api.get('/api/samples'),
        api.get('/api/users')
      ]);
      setAnalyses(anRes.data || []);
      setSamples(saRes.data || []);
      setTechnicians((usRes.data || []).filter((u: Technician) =>
        ['Technicien', 'Admin', 'Responsable'].includes(u.role)
      ));
    } catch {
      setError('Échec du chargement des demandes d\'analyses.');
    } finally {
      setLoading(false);
    }
  };

  const technicianLoads = useMemo(() => {
    const loads: Record<number, number> = {};
    analyses.forEach(a => {
      if (a.user_id && ['En attente', 'En cours'].includes(a.status)) {
        loads[a.user_id] = (loads[a.user_id] || 0) + 1;
      }
    });
    return loads;
  }, [analyses]);

  const filtered = useMemo(() => {
    return analyses.filter(a => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q
        || `AN-${a.id.toString().padStart(4, '0')}`.toLowerCase().includes(q)
        || (a.sample?.code ?? '').toLowerCase().includes(q)
        || (a.technician?.name ?? '').toLowerCase().includes(q);
      return matchSearch;
    });
  }, [analyses, searchTerm]);

  const handleFormSubmitSuccess = async () => {
    setIsModalOpen(false);
    await fetchData();
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Calendar className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Demandes d'Analyses
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Planification des demandes d'analyses, attribution des techniciens et priorités
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00f0ff] text-[#070b11] text-xs font-bold rounded-lg hover:bg-cyan-400 transition-all font-mono uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)]"
        >
          <Plus className="w-4 h-4" /> Nouvelle Demande
        </button>
      </div>

      {/* Grid List view */}
      <div className="flex-grow min-h-0 flex flex-col glass-panel border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#0d131f]/90 border-b border-[#1e293b] flex justify-between items-center gap-4 shrink-0">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-505" />
            <input
              type="text"
              placeholder="Rechercher ID, échantillon, technicien..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-500 font-mono"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {filtered.length} demande(s) enregistrée(s)
          </span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 bg-[#070b11]/20">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-[2px] border-[#00f0ff]/25 border-t-[#00f0ff] rounded-full animate-spin" />
              <span className="text-[11px] font-mono text-slate-400">Accès au registre des demandes...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-rose-500 font-mono">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              Aucune demande d'analyse enregistrée dans ce slot.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(an => (
                <div key={an.id} className="bg-[#0d131f]/50 border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/30 transition-all duration-300 relative group">
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      an.status === 'Validé' ? 'bg-emerald-500' :
                      an.status === 'Anomalie' ? 'bg-rose-500 animate-ping' :
                      an.status === 'En cours' ? 'bg-sky-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-400">{an.status}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                        AN-{an.id.toString().padStart(4, '0')}
                      </span>
                      <h3 className="text-xs font-black font-mono text-slate-200 uppercase">
                        Éch: {an.sample?.code ?? 'Non lié'}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Créé le : {new Date(an.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {an.parameters?.map(p => (
                        <span key={p} className="bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded text-[9.5px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-850/50 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00f0ff]/70" />
                      {an.technician?.name ?? 'Non assigné'}
                    </span>
                    <span className="text-[#00f0ff]/80">
                      {an.sample?.metadata?.planned_culture ? `Fermage: ${an.sample.metadata.planned_culture}` : 'Standard'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
