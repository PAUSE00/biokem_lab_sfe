import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import StorageMapPicker from './StorageMapPicker';

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
  sampled_at?: string;
  description?: string;
  container_ok?: boolean;
  label_ok?: boolean;
  volume_ok?: boolean;
  seal_ok?: boolean;
}

interface SampleFormModalProps {
  sample?: Sample | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, data: any) => void;
  isSubmitting: boolean;
  existingLocations: string[];
}

export default function SampleFormModal({
  sample,
  onClose,
  onSubmit,
  isSubmitting,
  existingLocations
}: SampleFormModalProps) {
  const isEdit = !!sample;

  // Form State
  const [formData, setFormData] = useState({
    type: sample?.type || 'Eau Potable',
    priority: sample?.priority || 'Normale',
    volume: sample?.volume || '',
    storage_location: sample?.storage_location || '',
    temp_condition: sample?.temp_condition || 'Température Ambiante',
    temp_value: sample?.temp_value !== null && sample?.temp_value !== undefined ? String(sample.temp_value) : '',
    sampled_at: sample?.sampled_at ? sample.sampled_at.substring(0, 16) : new Date().toISOString().substring(0, 16),
    description: sample?.description || '',
    container_ok: sample?.container_ok ?? true,
    label_ok: sample?.label_ok ?? true,
    volume_ok: sample?.volume_ok ?? true,
    seal_ok: sample?.seal_ok ?? true,
    status: sample?.status || 'Reçu'
  });

  const [activeFamily, setActiveFamily] = useState(() => {
    const t = formData.type;
    if (t === 'Eau Potable' || t === 'Eau Résiduaire') return 'water';
    if (t === 'Sol / Terre' || t === 'Alimentaire') return 'solid';
    return 'chem';
  });

  const [isStoragePickerOpen, setIsStoragePickerOpen] = useState(false);

  const families = [
    { id: 'water', label: 'Eaux', icon: '💧', desc: 'Potable, Usée, Rivière' },
    { id: 'solid', label: 'Solides', icon: '🪨', desc: 'Sol, Sédiments, Déchets' },
    { id: 'chem', label: 'Chimiques', icon: '⚗️', desc: 'Solvants, Réactifs, Inconnus' }
  ];

  const handleFamilyChange = (fam: string) => {
    setActiveFamily(fam);
    if (fam === 'water') {
      setFormData(prev => ({ ...prev, type: 'Eau Potable' }));
    } else if (fam === 'solid') {
      setFormData(prev => ({ ...prev, type: 'Sol / Terre' }));
    } else {
      setFormData(prev => ({ ...prev, type: 'Produit Chimique' }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    onSubmit(e, formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="font-extrabold text-white text-lg tracking-wide font-mono">
              {isEdit ? `MODIFIER L'ÉCHANTILLON - ${sample.code}` : "ENREGISTRER UN ÉCHANTILLON"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Chaîne de garde et métadonnées du prélèvement</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto scrollbar-thin">
          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column 1: Material/Matrix */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-2">Famille de Matrice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {families.map(family => {
                      const isSelected = activeFamily === family.id;
                      return (
                        <button
                          key={family.id}
                          type="button"
                          onClick={() => handleFamilyChange(family.id)}
                          className={`p-2.5 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center font-mono ${
                            isSelected 
                              ? 'bg-cyan-950/30 border-cyan-500 text-white scale-[1.02] font-black'
                              : 'bg-slate-950 border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="text-lg mb-0.5">{family.icon}</span>
                          <span className="text-[9px] tracking-tight block uppercase leading-none">{family.label}</span>
                          <span className="text-[7px] text-slate-500 block mt-1 leading-none">{family.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5 mt-4">Type de Prélèvement Spécifique</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-750 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {activeFamily === 'water' && (
                      <>
                        <option value="Eau Potable">Eau Potable</option>
                        <option value="Eau Résiduaire">Eau Résiduaire</option>
                        <option value="Eau Souterraine">Eau Souterraine</option>
                        <option value="Eau de Surface">Eau de Surface</option>
                      </>
                    )}
                    {activeFamily === 'solid' && (
                      <>
                        <option value="Sol / Terre">Sol / Terre</option>
                        <option value="Alimentaire">Alimentaire</option>
                        <option value="Sédiment">Sédiment</option>
                        <option value="Déchet Solide">Déchet Solide</option>
                      </>
                    )}
                    {activeFamily === 'chem' && (
                      <>
                        <option value="Produit Chimique">Produit Chimique</option>
                        <option value="Hydrocarbure">Hydrocarbure</option>
                        <option value="Solvant Organique">Solvant Organique</option>
                        <option value="Autre">Autre</option>
                      </>
                    )}
                  </select>
                </div>

                {isEdit && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5">Statut de Traitement</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-2.5 border border-slate-750 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="Reçu">Reçu</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                      <option value="Anomalie">Anomalie</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Column 2: Storage & Metrics */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono mb-1.5">Niveau de Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-4 py-2.5 border border-slate-755 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="Basse">Basse (Routine)</option>
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute (Prioritaire)</option>
                    <option value="Critique">Critique (Urgent)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Condition Temp.</label>
                    <select
                      value={formData.temp_condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, temp_condition: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-750 rounded-md text-xs text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="Température Ambiante">Temp. Ambiante</option>
                      <option value="Réfrigéré">Réfrigéré (+4°C)</option>
                      <option value="Congelé">Congelé (-20°C)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Temp. (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 4.2"
                      value={formData.temp_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, temp_value: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-750 rounded-md text-xs text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Volume</label>
                    <input
                      type="text"
                      placeholder="Ex: 250 ml"
                      required
                      value={formData.volume}
                      onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-750 rounded-md text-xs text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-1.5">Date Prélèvement</label>
                    <input
                      type="datetime-local"
                      value={formData.sampled_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, sampled_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-750 rounded-md text-xs text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono mb-1.5">Emplacement de Stockage</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Congélateur A - Colonne 3..."
                      value={formData.storage_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, storage_location: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-750 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setIsStoragePickerOpen(true)}
                      className="px-3 bg-slate-950 hover:bg-slate-850 border border-slate-750 rounded-md text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      title="Choisir sur la carte 2D"
                    >
                      <MapPin className="w-5 h-5 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Contrôle de Conformité à la Réception (ISO 17025)</h4>
                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-black">4 Points</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-start gap-2.5 p-2 bg-slate-900 border border-slate-850 rounded cursor-pointer hover:border-slate-700 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={formData.container_ok}
                    onChange={(e) => setFormData(prev => ({ ...prev, container_ok: e.target.checked }))}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer accent-cyan-500"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 block leading-tight">Récipient Conforme</span>
                    <span className="text-[8px] text-slate-500 block leading-none mt-1">Propre, étanche et intègre</span>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 bg-slate-900 border border-slate-850 rounded cursor-pointer hover:border-slate-700 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={formData.label_ok}
                    onChange={(e) => setFormData(prev => ({ ...prev, label_ok: e.target.checked }))}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer accent-cyan-500"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 block leading-tight">Étiquetage Conforme</span>
                    <span className="text-[8px] text-slate-500 block leading-none mt-1">Code lisible et infos complètes</span>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 bg-slate-900 border border-slate-850 rounded cursor-pointer hover:border-slate-700 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={formData.volume_ok}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume_ok: e.target.checked }))}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer accent-cyan-500"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 block leading-tight">Volume Suffisant</span>
                    <span className="text-[8px] text-slate-500 block leading-none mt-1">Suffisant pour les analyses</span>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 p-2 bg-slate-900 border border-slate-850 rounded cursor-pointer hover:border-slate-700 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={formData.seal_ok}
                    onChange={(e) => setFormData(prev => ({ ...prev, seal_ok: e.target.checked }))}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-950 w-4 h-4 cursor-pointer accent-cyan-500"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 block leading-tight">Scellé Intact</span>
                    <span className="text-[8px] text-slate-500 block leading-none mt-1">Sceau de sécurité non altéré</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono mb-1.5">Observations / Instructions Spéciales</label>
              <textarea
                rows={3}
                placeholder="Décrivez les conditions de prélèvement, consignes de conservation, ou paramètres critiques attendus..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-750 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-mono font-bold text-slate-400 bg-slate-950 hover:bg-slate-850 hover:text-white border border-slate-800 rounded-md transition-colors"
              >
                ANNULER
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-mono font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors disabled:opacity-70 flex items-center shadow-lg shadow-cyan-600/25 border border-cyan-500/30"
              >
                {isSubmitting ? 'ENREGISTREMENT...' : isEdit ? "ENREGISTRER LES MODIFICATIONS" : "CRÉER L'ÉCHANTILLON"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isStoragePickerOpen && (
        <StorageMapPicker
          currentLocation={formData.storage_location}
          onSelect={(loc) => {
            setFormData(prev => ({ ...prev, storage_location: loc }));
            setIsStoragePickerOpen(false);
          }}
          onClose={() => setIsStoragePickerOpen(false)}
          existingLocations={existingLocations}
        />
      )}
    </div>
  );
}
