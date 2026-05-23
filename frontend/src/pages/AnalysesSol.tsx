import { useState, useEffect, useMemo } from 'react';
import { Activity, Beaker, Search, Save, Lightbulb } from 'lucide-react';
import api from '../services/api';
import SoilTriangleSVG from '../components/analyses/SoilTriangleSVG';
import { getSoilClassification } from '../components/analyses/soilClassifier';

interface Analysis {
  id: number;
  sample_id: number;
  status: string;
  parameters: string[];
  results?: any[];
  metadata?: any;
  sample?: {
    code: string;
    type: string;
  };
  technician?: {
    name: string;
  };
}

export default function AnalysesSol() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form values
  const [values, setValues] = useState<Record<string, string>>({
    Argile: '33',
    Limon: '33',
    Sable: '34',
    pH: '7.0',
    'Matière organique': '2.0',
    Phosphore: '20',
    Potassium: '150',
  });

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/api/analyses');
      // Filter for soil analyses
      const data = res.data || [];
      const soilAnalyses = data.filter((a: any) => 
        a.sample?.type === 'Sol / Terre' || 
        (a.parameters && a.parameters.includes('Argile'))
      );
      setAnalyses(soilAnalyses);
    } catch (err) {
      console.error('Failed to fetch soil analyses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAnalysis) {
      const existingResults: Record<string, string> = {};
      if (selectedAnalysis.results && selectedAnalysis.results.length > 0) {
        selectedAnalysis.results.forEach(r => {
          existingResults[r.parameter] = String(r.value);
        });
      } else {
        selectedAnalysis.parameters.forEach(p => {
          existingResults[p] = '';
        });
      }
      
      // Seed default texture values if missing
      setValues({
        Argile: existingResults['Argile'] || '33',
        Limon: existingResults['Limon'] || '33',
        Sable: existingResults['Sable'] || '34',
        pH: existingResults['pH'] || '7.0',
        'Matière organique': existingResults['Matière organique'] || '2.0',
        Phosphore: existingResults['Phosphore'] || '20',
        Potassium: existingResults['Potassium'] || '150',
        ...existingResults
      });
    }
  }, [selectedAnalysis]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => {
      const q = searchTerm.toLowerCase();
      return !q || a.sample?.code.toLowerCase().includes(q) || `AN-${a.id}`.toLowerCase().includes(q);
    });
  }, [analyses, searchTerm]);

  // Texture calculations
  const clay = parseFloat(values['Argile'] || '0');
  const silt = parseFloat(values['Limon'] || '0');
  const sand = parseFloat(values['Sable'] || '0');
  const totalTexture = clay + silt + sand;
  const isTextureValid = Math.abs(totalTexture - 100) < 1.0;

  // Auto recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const pH = parseFloat(values['pH'] || '7');
    const MO = parseFloat(values['Matière organique'] || '2');
    const P = parseFloat(values['Phosphore'] || '20');
    const K = parseFloat(values['Potassium'] || '150');

    if (MO < 2.0) {
      recs.push("Apport recommandé de compost (20 tonnes/ha) pour stimuler la matière organique.");
    }
    if (P < 15.0) {
      recs.push("Déficit en Phosphore assimilable : Appliquer 100 kg/ha de Superphosphate.");
    }
    if (K < 100.0) {
      recs.push("Faible teneur en Potassium : Ajouter du Sulfate de potasse (150 kg/ha) avant semis.");
    }
    if (pH > 8.0) {
      recs.push("pH alcalin : Envisager un amendement soufré pour abaisser le pH.");
    } else if (pH < 6.0) {
      recs.push("pH acide : Envisager un chaulage correcteur (Dolomie).");
    }
    if (recs.length === 0) {
      recs.push("La structure nutritive et physique du sol est optimale pour la culture.");
    }
    return recs;
  }, [values]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysis) return;
    if (!isTextureValid) {
      alert(`La somme d'Argile, Limon et Sable doit être égale à 100% (actuelle: ${totalTexture.toFixed(1)}%).`);
      return;
    }
    setIsSaving(true);
    try {
      const resultsArray = Object.entries(values).map(([parameter, value]) => ({
        parameter,
        value,
        unit: parameter === 'pH' ? '' : parameter.includes('organique') || ['Argile', 'Limon', 'Sable'].includes(parameter) ? '%' : 'ppm',
      }));

      const finalMetadata = {
        ...(selectedAnalysis.metadata || {}),
        recommendations,
        texture_class: getSoilClassification(clay, silt, sand)
      };

      await api.post(`/api/analyses/${selectedAnalysis.id}/validate`, {
        results: resultsArray,
        metadata: finalMetadata
      });

      setSelectedAnalysis(null);
      await fetchAnalyses();
      alert('Résultats de l\'analyse de sol validés avec succès.');
    } catch {
      alert('Erreur lors de l\'enregistrement de l\'analyse.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Activity className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Console d'Analyse du Sol
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Fertilité de la terre, granulométrie, triangle de texture USDA et recommandations agronomiques
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Left Column: List */}
        <div className="w-full lg:w-[320px] flex flex-col h-full glass-panel border border-[#1e293b] rounded-xl overflow-hidden shrink-0">
          <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] space-y-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
              Dossiers Sols
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-550" />
              <input
                type="text"
                placeholder="Rechercher dossier..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#070b11]/10 p-2 space-y-1.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Chargement...</div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Aucun dossier sol.</div>
            ) : (
              filteredAnalyses.map(a => {
                const isSelected = selectedAnalysis?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAnalysis(a)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0d131f] border-[#00f0ff] text-[#00f0ff]'
                        : 'bg-[#0d131f]/40 border-[#1e293b] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold">AN-{a.id.toString().padStart(4, '0')}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        a.status === 'Validé' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-slate-900/60 text-slate-400 border-slate-800'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>Éch: {a.sample?.code}</span>
                      <span>{a.technician?.name || 'Non assigné'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Console */}
        <div className="flex-grow flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden">
          {selectedAnalysis ? (
            <form onSubmit={handleSave} className="flex-grow flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">ANALYSE DU SOL // AN-{selectedAnalysis.id.toString().padStart(4, '0')}</h3>
                  <p className="text-[10px] text-slate-450 font-mono uppercase">Échantillon: {selectedAnalysis.sample?.code}</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving || !isTextureValid}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b11] text-xs font-bold rounded-lg font-mono uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" /> Enregistrer & Valider
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Granulometry Controls */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-4 bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2">
                      Granulométrie (Doit sommer à 100%)
                    </span>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-400">Argile (Clay)</span>
                          <span className="text-[#f43f5e] font-bold">{clay}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={values['Argile']}
                          onChange={e => setValues({ ...values, Argile: e.target.value })}
                          className="w-full accent-[#f43f5e]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-400">Limon (Silt)</span>
                          <span className="text-[#10b981] font-bold">{silt}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={values['Limon']}
                          onChange={e => setValues({ ...values, Limon: e.target.value })}
                          className="w-full accent-[#10b981]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-400">Sable (Sand)</span>
                          <span className="text-[#eab308] font-bold">{sand}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={values['Sable']}
                          onChange={e => setValues({ ...values, Sable: e.target.value })}
                          className="w-full accent-[#eab308]"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#1e293b]/50">
                        <span className="text-xs text-slate-400 font-mono">Somme :</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isTextureValid ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                        }`}>
                          {totalTexture.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chemical Parameters */}
                  <div className="space-y-4 bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2">
                      Paramètres Chimiques
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">pH</label>
                        <input
                          type="number"
                          step="0.1"
                          value={values['pH']}
                          onChange={e => setValues({ ...values, pH: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Matière Organique (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={values['Matière organique']}
                          onChange={e => setValues({ ...values, 'Matière organique': e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phosphore (ppm)</label>
                        <input
                          type="number"
                          value={values['Phosphore']}
                          onChange={e => setValues({ ...values, Phosphore: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Potassium (ppm)</label>
                        <input
                          type="number"
                          value={values['Potassium']}
                          onChange={e => setValues({ ...values, Potassium: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Area: Soil triangle & recommendations */}
                <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                  <SoilTriangleSVG clay={clay} silt={silt} sand={sand} isValid={isTextureValid} />

                  <div className="bg-[#070b11]/45 border border-[#1e293b] rounded-xl p-4 flex-grow flex flex-col">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#00f0ff]" /> Recommandations de Fertilisation
                    </span>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                      {recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="p-2.5 bg-[#0d131f]/60 border border-[#1e293b] rounded text-[11px] text-slate-300 font-mono leading-relaxed flex items-start gap-2">
                          <span className="text-[#00f0ff] font-bold shrink-0 mt-0.5">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8 select-none">
              <Beaker className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-slate-450">Console Granulométrique</p>
              <p className="font-mono text-[10px] text-slate-500 mt-1">Sélectionnez un dossier de sol dans la colonne de gauche pour enregistrer les valeurs physiques et chimiques.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
