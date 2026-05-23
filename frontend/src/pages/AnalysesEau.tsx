import { useState, useEffect, useMemo } from 'react';
import { Search, Save, Droplets, Info } from 'lucide-react';
import api from '../services/api';

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

export default function AnalysesEau() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form values in mg/L
  const [values, setValues] = useState<Record<string, string>>({
    Calcium: '40',
    Magnésium: '10',
    Sodium: '15',
    Bicarbonates: '50',
    Carbonates: '0',
    Conductivité: '0.5',
    TDS: '320',
    Nitrate: '15',
    pH: '7.2'
  });

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/api/analyses');
      const data = res.data || [];
      // Filter for water analyses
      const waterAnalyses = data.filter((a: any) => 
        a.sample?.type === 'Eau / Liquide' || 
        (a.parameters && a.parameters.includes('Calcium') && a.parameters.includes('Sodium'))
      );
      setAnalyses(waterAnalyses);
    } catch (err) {
      console.error('Failed to fetch water analyses', err);
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

      setValues({
        Calcium: existingResults['Calcium'] || '40',
        Magnésium: existingResults['Magnésium'] || '10',
        Sodium: existingResults['Sodium'] || '15',
        Bicarbonates: existingResults['Bicarbonates'] || '50',
        Carbonates: existingResults['Carbonates'] || '0',
        Conductivité: existingResults['Conductivité'] || '0.5',
        TDS: existingResults['TDS'] || '320',
        Nitrate: existingResults['Nitrate'] || '15',
        pH: existingResults['pH'] || '7.2',
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

  // Automated computations
  const waterCalculations = useMemo(() => {
    const Ca_mg = parseFloat(values['Calcium'] || '0');
    const Mg_mg = parseFloat(values['Magnésium'] || '0');
    const Na_mg = parseFloat(values['Sodium'] || '0');
    const HCO3_mg = parseFloat(values['Bicarbonates'] || '0');
    const CO3_mg = parseFloat(values['Carbonates'] || '0');
    const EC = parseFloat(values['Conductivité'] || '0');

    // meq/L conversions
    const Ca_meq = Ca_mg / 20.04;
    const Mg_meq = Mg_mg / 12.15;
    const Na_meq = Na_mg / 22.99;
    const HCO3_meq = HCO3_mg / 61.02;
    const CO3_meq = CO3_mg / 30.00;

    // SAR
    const sarDiv = Math.sqrt((Ca_meq + Mg_meq) / 2);
    const SAR = sarDiv > 0 ? Na_meq / sarDiv : 0;

    // RSC
    const RSC = (HCO3_meq + CO3_meq) - (Ca_meq + Mg_meq);

    // TH (Hardness)
    const TH = (Ca_mg * 2.497) + (Mg_mg * 4.118);

    // Irrigation Class
    let cClass = 'C1';
    if (EC >= 2.25) cClass = 'C4';
    else if (EC >= 0.75) cClass = 'C3';
    else if (EC >= 0.25) cClass = 'C2';

    let sClass = 'S1';
    if (SAR >= 26) sClass = 'S4';
    else if (SAR >= 18) sClass = 'S3';
    else if (SAR >= 10) sClass = 'S2';

    return {
      sar: parseFloat(SAR.toFixed(2)),
      rsc: parseFloat(RSC.toFixed(2)),
      hardness: parseFloat(TH.toFixed(1)),
      classification: `${cClass}-${sClass}`,
      sodiumRisk: SAR > 9 ? 'CRITIQUE' : SAR > 3 ? 'MODÉRÉ' : 'OPTIMAL',
      salinityRisk: EC > 2.0 ? 'ÉLEVÉ' : EC > 0.75 ? 'MODÉRÉ' : 'FAIBLE'
    };
  }, [values]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const EC = parseFloat(values['Conductivité'] || '0');
    const Nitrate = parseFloat(values['Nitrate'] || '0');
    const { sar, rsc } = waterCalculations;

    if (EC > 2.0) {
      recs.push("Salinité élevée : Augmenter la fraction de lessivage (15-20%) pour éviter l'accumulation de sels dans le sol.");
    }
    if (sar > 9.0 || rsc > 1.25) {
      recs.push("Indice SAR/RSC élevé : Amender le sol ou l'eau avec du gypse agricole (Sulfate de Calcium) pour neutraliser l'effet sodique.");
    }
    if (Nitrate > 50.0) {
      recs.push("Concentration critique en Nitrates : Réduire l'apport en fertilisants azotés de 20% pour éviter la surfertilisation.");
    }
    if (recs.length === 0) {
      recs.push("Excellente qualité d'eau pour l'irrigation maraîchère et arboricole.");
    }
    return recs;
  }, [values, waterCalculations]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysis) return;
    setIsSaving(true);
    try {
      const resultsArray = Object.entries(values).map(([parameter, value]) => ({
        parameter,
        value,
        unit: parameter === 'pH' ? '' : parameter.includes('Conductivité') ? 'dS/m' : 'mg/L',
      }));

      const finalMetadata = {
        ...(selectedAnalysis.metadata || {}),
        water_sar: waterCalculations.sar,
        water_rsc: waterCalculations.rsc,
        water_hardness: waterCalculations.hardness,
        water_irrigation_class: waterCalculations.classification,
        recommendations
      };

      await api.post(`/api/analyses/${selectedAnalysis.id}/validate`, {
        results: resultsArray,
        metadata: finalMetadata
      });

      setSelectedAnalysis(null);
      await fetchAnalyses();
      alert('Résultats de l\'analyse d\'eau enregistrés avec succès.');
    } catch {
      alert('Erreur lors de la sauvegarde de l\'analyse d\'eau.');
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
            <Droplets className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Console d'Analyse d'Eau
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Qualité d'irrigation, concentration en cations/anions, calculs SAR/RSC/TH et classification C-S
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Left Column: List */}
        <div className="w-full lg:w-[320px] flex flex-col h-full glass-panel border border-[#1e293b] rounded-xl overflow-hidden shrink-0">
          <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] space-y-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
              Dossiers Eaux
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
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Aucun dossier eau.</div>
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

        {/* Right Column: Console */}
        <div className="flex-grow flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden">
          {selectedAnalysis ? (
            <form onSubmit={handleSave} className="flex-grow flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">ANALYSE D'EAU // AN-{selectedAnalysis.id.toString().padStart(4, '0')}</h3>
                  <p className="text-[10px] text-slate-450 font-mono uppercase">Échantillon: {selectedAnalysis.sample?.code}</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b11] text-xs font-bold rounded-lg font-mono uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Enregistrer & Valider
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Inputs */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4 space-y-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2">
                      Saisie des concentrations ioniques (mg/L)
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {['Calcium', 'Magnésium', 'Sodium', 'Bicarbonates', 'Carbonates', 'Nitrate', 'TDS', 'Conductivité', 'pH'].map(param => (
                        <div key={param}>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                            {param} {param === 'Conductivité' ? '(dS/m)' : param === 'pH' ? '' : '(mg/L)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={values[param] || ''}
                            onChange={e => setValues({ ...values, [param]: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Computations & Recommendations */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Telemetry Index values */}
                  <div className="bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4 space-y-3.5">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2">
                      Indices Agro-Chimiques calculés
                    </span>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-[#0d131f] border border-[#1e293b] p-3 rounded-lg flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">SAR (Sodium Adsorp.)</span>
                        <span className="text-lg font-black text-[#00f0ff] glow-cyan font-mono mt-1">{waterCalculations.sar}</span>
                        <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">Risque : {waterCalculations.sodiumRisk}</span>
                      </div>
                      <div className="bg-[#0d131f] border border-[#1e293b] p-3 rounded-lg flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">RSC (Carbonate résiduel)</span>
                        <span className="text-lg font-black text-[#00f0ff] glow-cyan font-mono mt-1">{waterCalculations.rsc} meq/L</span>
                      </div>
                      <div className="bg-[#0d131f] border border-[#1e293b] p-3 rounded-lg flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Dureté TH (Cal-Mag)</span>
                        <span className="text-lg font-black text-[#00f0ff] glow-cyan font-mono mt-1">{waterCalculations.hardness} °F</span>
                      </div>
                      <div className="bg-[#0d131f] border border-[#1e293b] p-3 rounded-lg flex flex-col justify-center items-center text-center">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Classification C-S</span>
                        <span className="text-lg font-black text-amber-400 font-mono mt-1">{waterCalculations.classification}</span>
                        <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">Salinité : {waterCalculations.salinityRisk}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4 flex flex-col flex-grow">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#00f0ff]" /> Diagnostic de Compatibilité
                    </span>
                    <div className="space-y-2 overflow-y-auto">
                      {recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="p-2.5 bg-[#0d131f]/60 border border-[#1e293b] rounded text-[11px] text-slate-350 font-mono leading-relaxed">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8 select-none">
              <Droplets className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-slate-450">Console Hydro-Chimique</p>
              <p className="font-mono text-[10px] text-slate-500 mt-1">Sélectionnez un dossier d'eau dans la colonne de gauche pour lancer le diagnostic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
