import { useState, useEffect, useMemo } from 'react';
import { Search, Thermometer, Layers, CheckCircle2, Wrench, Save } from 'lucide-react';
import api from '../services/api';

interface Sample {
  id: number;
  code: string;
  type: string;
  status: string;
  priority: string;
  storage_location: string;
  metadata?: any;
  created_at: string;
}

export default function Preparation() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preparation form state
  const [form, setForm] = useState({
    prep_drying_start: '',
    prep_drying_end: '',
    prep_drying_temp: '35',
    prep_drying_tech: '',
    prep_grinding_type: 'Broyeur à disques',
    prep_grinding_tech: '',
    prep_sieving_mesh: '2',
    prep_homo_uniform: true,
    prep_storage_cab: 'A1',
    prep_storage_shelf: '3',
    prep_storage_bin: '12',
  });

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    if (selectedSample) {
      const meta = selectedSample.metadata || {};
      setForm({
        prep_drying_start: meta.prep_drying_start || '',
        prep_drying_end: meta.prep_drying_end || '',
        prep_drying_temp: meta.prep_drying_temp || '35',
        prep_drying_tech: meta.prep_drying_tech || '',
        prep_grinding_type: meta.prep_grinding_type || 'Broyeur à disques',
        prep_grinding_tech: meta.prep_grinding_tech || '',
        prep_sieving_mesh: meta.prep_sieving_mesh || '2',
        prep_homo_uniform: meta.prep_homo_uniform !== undefined ? meta.prep_homo_uniform : true,
        prep_storage_cab: meta.prep_storage_cab || 'A1',
        prep_storage_shelf: meta.prep_storage_shelf || '3',
        prep_storage_bin: meta.prep_storage_bin || '12',
      });
    }
  }, [selectedSample]);

  const fetchSamples = async () => {
    try {
      const res = await api.get('/api/samples');
      setSamples(res.data || []);
    } catch (err) {
      console.error('Failed to fetch samples for prep', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = useMemo(() => {
    return samples.filter(s => {
      const q = searchTerm.toLowerCase();
      return !q || s.code.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
    });
  }, [samples, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample) return;
    setIsSubmitting(true);
    try {
      const updatedMetadata = {
        ...(selectedSample.metadata || {}),
        ...form
      };
      
      // Update sample metadata and set status to 'En cours' for analysis phase
      await api.patch(`/api/samples/${selectedSample.id}`, {
        metadata: updatedMetadata,
        status: 'En cours'
      });

      setSelectedSample(null);
      await fetchSamples();
      alert('Logs de préparation enregistrés avec succès.');
    } catch {
      alert('Erreur lors de l\'enregistrement de la préparation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Wrench className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Préparation des Échantillons (Phase 3)
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Séchage thermique, broyage mécanique, tamisage granulométrique et stockage physique
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Left Column: Sample List */}
        <div className="w-full lg:w-[360px] flex flex-col h-full glass-panel border border-[#1e293b] rounded-xl overflow-hidden shrink-0">
          <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] space-y-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
              Échantillons à Préparer
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-550" />
              <input
                type="text"
                placeholder="Rechercher code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#070b11]/10 p-2 space-y-1.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Chargement...</div>
            ) : filteredSamples.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Aucun échantillon disponible.</div>
            ) : (
              filteredSamples.map(s => {
                const isSelected = selectedSample?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSample(s)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0d131f] border-[#00f0ff] text-[#00f0ff]'
                        : 'bg-[#0d131f]/40 border-[#1e293b] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold">{s.code}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        s.priority === 'Critique' || s.priority === 'Haute'
                          ? 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800'
                      }`}>
                        {s.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>{s.type}</span>
                      <span className="text-slate-450">{s.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Log form */}
        <div className="flex-grow flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden">
          {selectedSample ? (
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">LOG DE PRÉPARATION // {selectedSample.code}</h3>
                  <p className="text-[10px] text-slate-450 font-mono uppercase">{selectedSample.type}</p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b11] text-xs font-bold rounded-lg font-mono uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Enregistrer Phase 3
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Drying Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                    <Thermometer className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      1. Séchage Thermique (Étuve)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Date début séchage
                      </label>
                      <input
                        type="date"
                        value={form.prep_drying_start}
                        onChange={e => setForm({ ...form, prep_drying_start: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Date fin séchage
                      </label>
                      <input
                        type="date"
                        value={form.prep_drying_end}
                        onChange={e => setForm({ ...form, prep_drying_end: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Température (°C)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={form.prep_drying_temp}
                          onChange={e => setForm({ ...form, prep_drying_temp: e.target.value })}
                          className="flex-1 accent-[#00f0ff]"
                        />
                        <span className="text-xs font-mono font-bold text-[#00f0ff] w-12 text-right">
                          {form.prep_drying_temp} °C
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Technicien Responsable
                    </label>
                    <input
                      type="text"
                      placeholder="Nom du technicien"
                      value={form.prep_drying_tech}
                      onChange={e => setForm({ ...form, prep_drying_tech: e.target.value })}
                      className="w-full max-w-md px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                    />
                  </div>
                </div>

                {/* Grinding & Sieving */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                    <Layers className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      2. Broyage & Tamisage
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Type de Broyeur
                      </label>
                      <select
                        value={form.prep_grinding_type}
                        onChange={e => setForm({ ...form, prep_grinding_type: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      >
                        <option value="Broyeur à disques">Broyeur à disques</option>
                        <option value="Broyeur à marteaux">Broyeur à marteaux</option>
                        <option value="Mortier manuel">Mortier manuel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Mesh du Tamis (mm)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2"
                        value={form.prep_sieving_mesh}
                        onChange={e => setForm({ ...form, prep_sieving_mesh: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Homogénéité Conforme ?
                      </label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.prep_homo_uniform}
                          onChange={e => setForm({ ...form, prep_homo_uniform: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-xs text-slate-350 font-mono">Échantillon homogène</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Storage Location */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      3. Stockage Physique (Logistique)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Armoire
                      </label>
                      <input
                        type="text"
                        value={form.prep_storage_cab}
                        onChange={e => setForm({ ...form, prep_storage_cab: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Étagère
                      </label>
                      <input
                        type="text"
                        value={form.prep_storage_shelf}
                        onChange={e => setForm({ ...form, prep_storage_shelf: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Bac / Slot
                      </label>
                      <input
                        type="text"
                        value={form.prep_storage_bin}
                        onChange={e => setForm({ ...form, prep_storage_bin: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8 select-none">
              <Wrench className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-slate-450">Console de Préparation</p>
              <p className="font-mono text-[10px] text-slate-500 mt-1">Sélectionnez un échantillon dans la colonne de gauche pour enregistrer les données de préparation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
