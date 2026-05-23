import React, { useState } from 'react';
import { Layers, X, Plus, MapPin, Trash2 } from 'lucide-react';
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
}

interface AliquotSplitterModalProps {
  sample: Sample;
  onClose: () => void;
  onSubmit: (aliquots: Array<{ volume: string; storage_location: string; description: string }>) => void;
  isSubmitting: boolean;
  existingLocations: string[];
}

export default function AliquotSplitterModal({
  sample,
  onClose,
  onSubmit,
  isSubmitting,
  existingLocations
}: AliquotSplitterModalProps) {
  const [aliquots, setAliquots] = useState<Array<{ volume: string; storage_location: string; description: string }>>([
    { volume: '', storage_location: '', description: '' }
  ]);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const addAliquot = () => {
    setAliquots([...aliquots, { volume: '', storage_location: '', description: '' }]);
  };

  const removeAliquot = (index: number) => {
    if (aliquots.length === 1) return;
    setAliquots(aliquots.filter((_, i) => i !== index));
  };

  const updateAliquot = (index: number, field: string, value: string) => {
    const updated = aliquots.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setAliquots(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(aliquots);
  };

  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2 tracking-wide font-mono">
              <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
              DIVISION EN ALIQUOTES - {sample.code}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Subdivisez cet échantillon brut en sous-flacons indépendants pour analyses</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {aliquots.map((aliquot, index) => {
              const letter = alphabet[index] ?? String(index + 1);
              return (
                <div key={index} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row gap-3 items-start relative group">
                  <div className="w-9 h-9 rounded-full bg-cyan-950/30 text-cyan-400 font-mono font-black text-xs flex items-center justify-center border border-cyan-500/20 shrink-0 self-center">
                    {sample.code}-{letter}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Volume</label>
                      <input
                        type="text"
                        placeholder="Ex: 50 ml, 100 g..."
                        required
                        value={aliquot.volume}
                        onChange={(e) => updateAliquot(index, 'volume', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-700 rounded-md text-xs font-mono text-slate-200 bg-slate-900 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Emplacement de Stockage</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: Ligne B, Colonne 3..."
                          required
                          value={aliquot.storage_location}
                          onChange={(e) => updateAliquot(index, 'storage_location', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-700 rounded-md text-xs font-mono text-slate-200 bg-slate-900 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerIndex(index)}
                          className="px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Description Aliquote (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: Pour microbiologie / métaux lourds..."
                        value={aliquot.description}
                        onChange={(e) => updateAliquot(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-700 rounded-md text-xs font-semibold text-slate-200 bg-slate-900 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  {aliquots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAliquot(index)}
                      className="absolute top-2 right-2 md:relative md:top-0 md:right-0 p-1.5 text-rose-500 hover:bg-rose-950/30 rounded-lg shrink-0 self-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addAliquot}
            className="w-full py-2.5 border border-dashed border-slate-750 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Ajouter une aliquote supplémentaire
          </button>

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
              className="px-5 py-2.5 text-xs font-mono font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors disabled:opacity-75 flex items-center shadow-lg shadow-cyan-600/25 border border-cyan-500/30"
            >
              {isSubmitting ? 'CRÉATION...' : 'GÉNÉRER LES ALIQUOTES'}
            </button>
          </div>
        </form>

        {pickerIndex !== null && (
          <StorageMapPicker
            currentLocation={aliquots[pickerIndex].storage_location}
            onSelect={(loc) => {
              updateAliquot(pickerIndex, 'storage_location', loc);
              setPickerIndex(null);
            }}
            onClose={() => setPickerIndex(null)}
            existingLocations={existingLocations}
          />
        )}
      </div>
    </div>
  );
}
