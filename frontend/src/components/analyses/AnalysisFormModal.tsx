import React, { useState } from 'react';
import { X, User, Plus } from 'lucide-react';
import api from '../../services/api';
import { type Sample, type Technician, PARAM_CATALOGUE, paramIcon } from './types';

interface AnalysisFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
  technicians: Technician[];
  technicianLoads: Record<number, number>;
  onSubmitSuccess: (createdId: number) => Promise<void>;
}

export default function AnalysisFormModal({
  isOpen,
  onClose,
  samples,
  technicians,
  technicianLoads,
  onSubmitSuccess,
}: AnalysisFormModalProps) {
  const [formData, setFormData] = useState<{ sample_id: string; user_id: string; parameters: string[] }>({
    sample_id: '',
    user_id: '',
    parameters: ['pH', 'Turbidité', 'Conductivité'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleParam = (key: string) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.includes(key)
        ? prev.parameters.filter(p => p !== key)
        : [...prev.parameters, key],
    }));
  };

  const handleSampleChange = (sampleIdStr: string) => {
    if (!sampleIdStr) {
      setFormData(prev => ({ ...prev, sample_id: '', parameters: ['pH', 'Turbidité', 'Conductivité'] }));
      return;
    }
    const sId = parseInt(sampleIdStr);
    const selectedSample = samples.find(s => s.id === sId);
    
    setFormData(prev => {
      let nextParams = [...prev.parameters];
      if (selectedSample?.type === 'Sol / Terre') {
        nextParams = ['Argile', 'Limon', 'Sable'];
      } else {
        nextParams = ['pH', 'Turbidité', 'Conductivité'];
      }
      return {
        ...prev,
        sample_id: sampleIdStr,
        parameters: nextParams
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/api/analyses', formData);
      setFormData({ sample_id: '', user_id: '', parameters: ['pH', 'Turbidité', 'Conductivité'] });
      onClose();
      if (res.data && res.data.id) {
        await onSubmitSuccess(res.data.id);
      } else {
        await onSubmitSuccess(0);
      }
    } catch {
      alert("Erreur lors de l'enregistrement de l'analyse");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-xl border border-[#1e293b] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-white">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e293b]/70 bg-[#070b11]/80">
          <div>
            <h3 className="font-bold text-[#00f0ff] text-sm uppercase font-mono tracking-widest glow-cyan">Planifier une Analyse</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Enregistrer une nouvelle demande d'acquisition physique</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-[#1e293b] hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Sample selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Échantillon <span className="text-rose-500">*</span></label>
            <select
              required
              value={formData.sample_id}
              onChange={e => handleSampleChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
            >
              <option value="" className="bg-[#0d131f] text-slate-400">— Sélectionnez un échantillon —</option>
              {samples.map(s => <option key={s.id} value={s.id} className="bg-[#0d131f] text-white">{s.code}</option>)}
            </select>
          </div>

          {/* Technician selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              <User className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
              Technicien Assigné
            </label>
            <select
              value={formData.user_id}
              onChange={e => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
            >
              <option value="" className="bg-[#0d131f] text-slate-400">— Non assigné —</option>
              {technicians.map(t => {
                const activeCount = technicianLoads[t.id] || 0;
                const loadLabel = activeCount === 0 ? 'Disponible' : `${activeCount} tâche(s) active(s)`;
                return (
                  <option key={t.id} value={t.id} className="bg-[#0d131f] text-white">
                    {t.name} ({loadLabel})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Parameter checkboxes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Paramètres à Analyser
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PARAM_CATALOGUE.map(p => {
                const checked = formData.parameters.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-[11px] font-mono ${
                      checked
                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-cyan-glow/10'
                        : 'bg-[#070b11]/50 border-[#1e293b] text-slate-400 hover:border-slate-700 hover:text-slate-350'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParam(p.key)}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="flex items-center gap-1 shrink-0">
                      {paramIcon(p.icon)} {p.label}
                    </span>
                    {p.unit && <span className="ml-auto text-[8px] text-slate-500 font-mono">{p.unit}</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Parameter Explainer */}
          {formData.parameters.length > 0 && (
            <div className="bg-[#070b11]/60 border border-[#1e293b]/70 rounded-lg p-2.5 text-[11px] space-y-1.5 max-h-[85px] overflow-y-auto">
              <span className="font-bold text-slate-300 block font-mono">🔬 Rôle des paramètres sélectionnés</span>
              {PARAM_CATALOGUE.map(p => {
                const isSelected = formData.parameters.includes(p.key);
                if (!isSelected) return null;
                return (
                  <div key={p.key} className="text-slate-400 border-l-2 border-primary/20 pl-2">
                    <strong className="text-slate-200 font-mono">{p.label}</strong> : {p.description}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2.5 border-t border-[#1e293b]/70">
            <button type="button" onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-mono text-slate-400 bg-transparent border border-[#1e293b] rounded-lg hover:bg-[#1e293b] hover:text-white transition-all cursor-pointer">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || formData.parameters.length === 0}
              className="px-4 py-1.5 text-xs font-mono font-bold text-[#070b11] bg-primary rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-cyan-glow/20 uppercase tracking-wider cursor-pointer">
              {isSubmitting ? (
                <React.Fragment><div className="w-3 h-3 border-2 border-[#070b11]/30 border-t-[#070b11] rounded-full animate-spin" /> Envoi…</React.Fragment>
              ) : (
                <React.Fragment><Plus className="w-3.5 h-3.5" /> Planifier</React.Fragment>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
