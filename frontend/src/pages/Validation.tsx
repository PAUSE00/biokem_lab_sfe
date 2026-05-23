import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ShieldCheck, Check } from 'lucide-react';
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

export default function Validation() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation Form Checks
  const [checks, setChecks] = useState({
    qc_verified: false,
    results_verified: false,
    ready_for_report: false,
  });

  // HTML5 Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/api/analyses');
      const data = res.data || [];
      // List of analyses waiting for final check (e.g. status === 'En cours')
      setAnalyses(data.filter((a: any) => a.status === 'En cours' && a.results && a.results.length > 0));
    } catch (err) {
      console.error('Failed to fetch analyses for validation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAnalysis) {
      setChecks({
        qc_verified: false,
        results_verified: false,
        ready_for_report: false,
      });
      setSignatureData('');
      setTimeout(() => {
        clearSignature();
      }, 50);
    }
  }, [selectedAnalysis]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => {
      const q = searchTerm.toLowerCase();
      return !q || a.sample?.code.toLowerCase().includes(q) || `AN-${a.id}`.toLowerCase().includes(q);
    });
  }, [analyses, searchTerm]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00f0ff';

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setSignatureData(dataUrl);
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalysis) return;
    if (!checks.qc_verified || !checks.results_verified || !checks.ready_for_report) {
      alert('Veuillez cocher toutes les vérifications de conformité avant de valider.');
      return;
    }
    if (!signatureData) {
      alert('Veuillez signer électroniquement le visa de validation.');
      return;
    }
    setIsSubmitting(true);
    try {
      const finalMetadata = {
        ...(selectedAnalysis.metadata || {}),
        tech_verified: true,
        manager_approved: true,
        signature_data: signatureData,
        validated_at: new Date().toISOString()
      };

      // Confirm sample status is Terminé
      await api.patch(`/api/samples/${selectedAnalysis.sample_id}`, {
        status: 'Terminé',
        metadata: finalMetadata
      });

      // Update validation results status on analysis
      await api.post(`/api/analyses/${selectedAnalysis.id}/validate`, {
        results: selectedAnalysis.results,
        metadata: finalMetadata
      });

      setSelectedAnalysis(null);
      await fetchAnalyses();
      alert('Validation et visa enregistrés. Le certificat d\'analyse final est prêt.');
    } catch {
      alert('Erreur lors de la validation finale du dossier.');
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
            <ShieldCheck className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Centre de Validation & Signature (Double Visa)
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Vérification finale ISO 17025 des résultats d'analyses avant émission du rapport officiel
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Left Column: Pending List */}
        <div className="w-full lg:w-[320px] flex flex-col h-full glass-panel border border-[#1e293b] rounded-xl overflow-hidden shrink-0">
          <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] space-y-2 shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
              Dossiers en attente de visa
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
              <div className="py-8 text-center text-xs text-slate-500 font-mono">Aucun dossier en attente de visa.</div>
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
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-amber-950/40 text-amber-400 border-amber-900/30">
                        A valider
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>Éch: {a.sample?.code}</span>
                      <span>{a.sample?.type}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Validation Dashboard */}
        <div className="flex-grow flex flex-col h-full bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden">
          {selectedAnalysis ? (
            <form onSubmit={handleValidate} className="flex-grow flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">PANEL DE VISA DE CONFORMITÉ // AN-{selectedAnalysis.id.toString().padStart(4, '0')}</h3>
                  <p className="text-[10px] text-slate-450 font-mono uppercase">Opérateur: {selectedAnalysis.technician?.name}</p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b11] text-xs font-bold rounded-lg font-mono uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Signer et Émettre
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Results Review Table */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#070b11]/45 border border-[#1e293b] rounded-xl p-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2">
                      Synthèse des résultats mesurés
                    </span>
                    <div className="divide-y divide-[#1e293b] font-mono text-xs">
                      {selectedAnalysis.results?.map(r => (
                        <div key={r.parameter} className="py-2.5 flex justify-between">
                          <span className="text-slate-400">{r.parameter}</span>
                          <span className="text-white font-bold">{r.value} <span className="text-[10px] text-slate-500 font-normal">{r.unit}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checks & Signature */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4 space-y-4">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-[#1e293b] pb-2 mb-2">
                      Conformité Réglementaire
                    </span>
                    <div className="space-y-3 font-mono text-xs">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checks.qc_verified}
                          onChange={e => setChecks({ ...checks, qc_verified: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-300">Contrôle Qualité Réception (QC) validé et conforme</span>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checks.results_verified}
                          onChange={e => setChecks({ ...checks, results_verified: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-300">Résultats relus et validés techniquement</span>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checks.ready_for_report}
                          onChange={e => setChecks({ ...checks, ready_for_report: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 shrink-0 mt-0.5"
                        />
                        <span className="text-slate-300">Autorisation d'émission du certificat d'analyse</span>
                      </label>
                    </div>
                  </div>

                  {/* HTML5 Electronic Signature Card */}
                  <div className="bg-[#070b11]/40 border border-[#1e293b] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                        Visa & Signature Électronique
                      </span>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[10px] text-rose-400 font-bold hover:underline font-mono uppercase"
                      >
                        Effacer
                      </button>
                    </div>

                    <div className="bg-[#070b11] border border-[#1e293b] rounded-lg overflow-hidden flex justify-center">
                      <canvas
                        ref={canvasRef}
                        width="300"
                        height="120"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="cursor-crosshair bg-slate-950/80"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 block text-center uppercase tracking-widest">
                      DESSINEZ VOTRE VISA SUR LA TABLETTE CI-DESSUS
                    </span>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8 select-none">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-slate-450">Console de Visa</p>
              <p className="font-mono text-[10px] text-slate-500 mt-1">Sélectionnez une analyse dans la colonne de gauche pour signer et émettre le certificat final.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
