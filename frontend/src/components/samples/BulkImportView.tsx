import { Table, Check, AlertCircle, CheckSquare, Upload } from 'lucide-react';

interface BulkSample {
  type: string;
  priority: string;
  volume: string;
  temp_condition: string;
  temp_value: string;
  storage_location: string;
  description: string;
  isValid: boolean;
  errors: string[];
}

interface BulkImportViewProps {
  bulkInputText: string;
  setBulkInputText: (text: string) => void;
  bulkSamples: BulkSample[];
  setBulkSamples: (samples: BulkSample[]) => void;
  parseBulkText: (text: string) => void;
  handleBulkSubmit: () => void;
  isSubmitting: boolean;
}

export default function BulkImportView({
  bulkInputText,
  setBulkInputText,
  bulkSamples,
  setBulkSamples,
  parseBulkText,
  handleBulkSubmit,
  isSubmitting
}: BulkImportViewProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl space-y-6 font-mono text-slate-355 text-slate-300">
      <div className="space-y-2">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
          Intake Massive CSV/TXT
        </span>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mt-1">
          <Upload className="w-5 h-5 text-cyan-400 animate-bounce" />
          IMPORTATION EN LOT
        </h2>
        <p className="text-xs text-slate-400 font-medium">Enregistrez des dizaines d'échantillons en une seule opération. Idéal pour les campagnes de prélèvements environnementaux.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
            <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest">Coller des données (CSV / Tab) :</label>
            <textarea
              className="w-full h-56 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-cyan-500/50 placeholder-slate-600 transition-colors"
              placeholder="Format: Type, Priorité, Volume, Condition Temp, Valeur Temp, Stockage, Description&#10;Exemple:&#10;Eau Potable, Normale, 250 ml, Réfrigéré, 4.2, Réfrigérateur A, Eau de rivière&#10;Eau Résiduaire, Urgente, 1 L, Congelé, -18.0, Congélateur B, Rejet usine"
              value={bulkInputText}
              onChange={(e) => {
                setBulkInputText(e.target.value);
                parseBulkText(e.target.value);
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const sampleText = `Eau Potable, Normale, 250 ml, Réfrigéré, 4.2, Réfrigérateur A > Etagère 1, Échantillon conforme test
Eau Résiduaire, Urgente, 1 L, Congelé, -18.5, Congélateur B > Etagère 2, Rejet de cuve industrielle
Produit Chimique, Critique, 50 ml, Température Ambiante, 22.4, Armoire de sécurité C, Solvant de rinçage
Eau Potable, Normale, 500 ml, Réfrigéré, 12.5, Réfrigérateur A > Etagère 1, [ALERTE] Température trop élevée à la livraison !`;
                setBulkInputText(sampleText);
                parseBulkText(sampleText);
              }}
              className="flex-1 py-2.5 px-3 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer text-center font-mono"
            >
              Charger Exemple
            </button>
            <button
              onClick={() => {
                setBulkInputText('');
                setBulkSamples([]);
              }}
              className="py-2.5 px-3 border border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 text-slate-500 font-bold text-xs rounded-md transition-all cursor-pointer font-mono"
            >
              Effacer
            </button>
          </div>
        </div>

        {/* Validation Table Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Prévisualisation & Validation</h3>
                {bulkSamples.length > 0 && (
                  <div className="text-[11px] font-bold font-mono">
                    Total: <span className="text-white">{bulkSamples.length}</span> | Valides: <span className="text-emerald-400">{bulkSamples.filter(s => s.isValid).length}</span> | Erreurs: <span className="text-rose-400">{bulkSamples.filter(s => !s.isValid).length}</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900 scrollbar-thin">
                {bulkSamples.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3 font-mono">
                    <Table className="w-12 h-12 text-slate-800" />
                    <p className="font-bold text-xs">Aucune donnée importée</p>
                    <p className="text-[10px] text-slate-655 text-slate-600">Collez des lignes CSV ou chargez l'exemple de démonstration.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-slate-850">
                        <th className="p-3">Type</th>
                        <th className="p-3">Priorité</th>
                        <th className="p-3">Volume</th>
                        <th className="p-3">Conserve</th>
                        <th className="p-3">Temp (°C)</th>
                        <th className="p-3">Emplacement</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {bulkSamples.map((sample, idx) => (
                        <tr key={idx} className={sample.isValid ? 'hover:bg-slate-850/30' : 'bg-rose-950/20 hover:bg-rose-955/20 border-l-2 border-l-rose-500'}>
                          <td className="p-3 text-white">🔬 {sample.type}</td>
                          <td className="p-3">{sample.priority}</td>
                          <td className="p-3">{sample.volume}</td>
                          <td className="p-3">{sample.temp_condition}</td>
                          <td className="p-3">{sample.temp_value}</td>
                          <td className="p-3 truncate max-w-[120px]" title={sample.storage_location}>{sample.storage_location}</td>
                          <td className="p-3">
                            {sample.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                                <Check className="w-3 h-3" /> OK
                              </span>
                            ) : (
                              <span 
                                title={sample.errors.join('; ')} 
                                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-455 text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30 cursor-help animate-pulse"
                              >
                                <AlertCircle className="w-3 h-3 text-rose-500" /> ERREUR
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {bulkSamples.length > 0 && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkSamples.filter(s => s.isValid).length === 0 || isSubmitting}
                  className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-md transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none border border-cyan-500/30"
                >
                  <CheckSquare className="w-4 h-4" />
                  IMPORTER LES {bulkSamples.filter(s => s.isValid).length} ENREGISTREMENTS VALIDES
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
