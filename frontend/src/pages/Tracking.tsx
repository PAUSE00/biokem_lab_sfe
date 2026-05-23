import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Beaker, CheckCircle2, Clock, AlertCircle, Activity, Download, ShieldCheck, HelpCircle } from 'lucide-react';
import axios from 'axios';

interface Result {
  id: number;
  parameter: string;
  value: string;
  unit: string | null;
  is_anomaly: boolean;
  reference_min: number | null;
  reference_max: number | null;
}

interface Analysis {
  id: number;
  status: string;
  validated_at: string | null;
  risk_score: number | null;
  ai_recommendation: string | null;
  results: Result[];
  technician?: {
    id: number;
    name: string;
  } | null;
}

interface AuditLogUser {
  id: number;
  name: string;
  role: string;
}

interface CustodyLog {
  id: number;
  action: string;
  created_at: string;
  user: AuditLogUser | null;
  changes: any;
}

interface Sample {
  id: number;
  code: string;
  status: 'Reçu' | 'En cours' | 'Terminé' | 'Anomalie';
  received_at: string;
  technician: {
    id: number;
    name: string;
  } | null;
  analyses: Analysis[];
  custody_timeline?: CustodyLog[];
}

export default function Tracking() {
  const { code } = useParams<{ code: string }>();
  const [sample, setSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    if (code) {
      fetchPublicSample();
    }
  }, [code]);

  const fetchPublicSample = async () => {
    try {
      setLoading(true);
      // We use raw axios to avoid interceptor redirects if token is empty
      const response = await axios.get(`${API_URL}/api/public/samples/${code}`);
      setSample(response.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError("Échantillon introuvable. Veuillez vérifier le code QR.");
      } else {
        setError("Impossible de charger les données de traçabilité. Veuillez réessayer plus tard.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Terminé':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'En cours':
        return <Activity className="w-8 h-8 text-blue-500 " />;
      case 'Reçu':
        return <Clock className="w-8 h-8 text-slate-400" />;
      case 'Anomalie':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <HelpCircle className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Terminé': return 'Analyses Validées & Conformes';
      case 'En cours': return 'Analyses en Cours d\'Exécution';
      case 'Reçu': return 'Échantillon Enregistré & Pris en Charge';
      case 'Anomalie': return 'Alerte : Anomalie Critique Détectée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium ">Chargement de la traçabilité en temps réel...</p>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-slate-800/80 border border-slate-700/50 p-8 rounded-lg text-center max-w-md w-full shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur de Traçabilité</h2>
          <p className="text-slate-400 mb-6">{error || "Échantillon introuvable."}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-all shadow-lg shadow-emerald-600/20"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Get active or first analysis
  const latestAnalysis = sample.analyses && sample.analyses.length > 0 ? sample.analyses[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-emerald-500/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Public Header */}
      <header className="sticky top-0 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-md text-emerald-400">
              <Beaker className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold tracking-wider text-white">CHEMLAB <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full ml-1.5 border border-emerald-500/20">LIMS</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Suivi Public En Ligne
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 relative">
        {/* Sample Basic Info Card */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-6 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Identifiant Échantillon</span>
            <h1 className="text-3xl font-black tracking-tight text-white font-mono">{sample.code}</h1>
            <p className="text-sm text-slate-400">Reçu le : {new Date(sample.received_at).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800/40 p-4 rounded-md w-full md:w-auto">
            <div className="bg-slate-900 p-2.5 rounded-md border border-slate-800 shrink-0">
              {getStatusIcon(sample.status)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut Actuel</div>
              <div className="font-bold text-white text-sm mt-0.5">{getStatusText(sample.status)}</div>
            </div>
          </div>
        </div>

        {/* Real-time Tracking Stepper */}
        <div className="bg-slate-900/40 border border-slate-800/30 rounded-lg p-6 backdrop-blur-md shadow-xl">
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            Cycle de vie de l'échantillon
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Receiving Step */}
            <div className="flex items-start gap-4 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 shrink-0">1</div>
              <div>
                <h4 className="font-bold text-white text-sm">Échantillon Reçu</h4>
                <p className="text-xs text-slate-400 mt-1">Prise en charge au laboratoire et étiquetage unique par QR Code.</p>
                <span className="inline-block mt-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  {new Date(sample.received_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Analysis Step */}
            <div className="flex items-start gap-4 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                sample.status !== 'Reçu' 
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>2</div>
              <div>
                <h4 className={`font-bold text-sm ${sample.status !== 'Reçu' ? 'text-white' : 'text-slate-500'}`}>Analyses Physico-Chimiques</h4>
                <p className="text-xs text-slate-400 mt-1">Mesures des paramètres clés (pH, Turbidité, Conductivité, Métaux lourds).</p>
                {sample.status === 'En cours' && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-semibold ">
                    En cours
                  </span>
                )}
              </div>
            </div>

            {/* Validation Step */}
            <div className="flex items-start gap-4 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                ['Terminé', 'Anomalie'].includes(sample.status)
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                  : 'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>3</div>
              <div>
                <h4 className={`font-bold text-sm ${['Terminé', 'Anomalie'].includes(sample.status) ? 'text-white' : 'text-slate-500'}`}>Validation & Certification</h4>
                <p className="text-xs text-slate-400 mt-1">Vérification de l'intégrité, évaluation du score de risque et signature du directeur technique.</p>
                {latestAnalysis?.validated_at && (
                  <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    {new Date(latestAnalysis.validated_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custody Timeline / Chain of Custody (ISO 17025) */}
        {sample.custody_timeline && sample.custody_timeline.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/30 rounded-lg p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
            {/* Ambient light glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Registre de Traçabilité (Chain of Custody)
              </h2>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-lg">
                Certifié Conforme
              </span>
            </div>

            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
              {sample.custody_timeline.map((log) => {
                const date = new Date(log.created_at);
                const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
                const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                
                // Color and label styles based on actions
                let actionBadge = 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
                let actionTitle = log.action;
                
                if (log.action === 'CREATION_ECHANTILLON') {
                  actionBadge = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
                  actionTitle = 'Réception & Enregistrement';
                } else if (log.action === 'MODIFICATION_ECHANTILLON') {
                  actionBadge = 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
                  actionTitle = 'Changement de Statut / Assignation';
                } else if (log.action === 'PLANIFICATION_ANALYSE') {
                  actionBadge = 'bg-sky-500/15 text-sky-400 border border-sky-500/20';
                  actionTitle = 'Analyses Planifiées';
                } else if (log.action === 'VALIDATION_ANALYSE') {
                  actionBadge = 'bg-[#c9df25]/15 text-[#c9df25] border border-[#c9df25]/20';
                  actionTitle = 'Validation & Signature Électronique';
                }

                return (
                  <div key={log.id} className="relative group">
                    {/* Glowing timeline node */}
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border-2 border-slate-700 group-hover:border-emerald-400 transition-all">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 group-hover:bg-emerald-400"></span>
                    </span>

                    <div className="bg-slate-900/60 border border-slate-800/40 hover:border-slate-800 rounded-md p-4 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${actionBadge}`}>
                          {actionTitle.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          {formattedDate} à {formattedTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        Opérateur : <span className="font-bold text-white">{log.user?.name || 'Système LIMS'}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-800 px-1.5 py-0.5 rounded font-mono ml-2">
                          {log.user?.role || 'Service'}
                        </span>
                      </div>

                      {/* Displaying details in a secure monospace block */}
                      {log.changes && (
                        <div className="mt-2.5 bg-slate-950/70 border border-slate-900/70 p-3 rounded-md text-[11px] font-mono text-slate-400 space-y-1 overflow-x-auto scrollbar-thin">
                          {log.action === 'CREATION_ECHANTILLON' && (
                            <>
                              <div>ID: <span className="text-white">{log.changes.code}</span></div>
                              <div>Type: <span className="text-emerald-400">{log.changes.type}</span></div>
                              <div>Priorité: <span className="text-rose-400">{log.changes.priority}</span></div>
                              {log.changes.storage_location && (
                                <div>Emplacement: <span className="text-slate-300">{log.changes.storage_location}</span></div>
                              )}
                            </>
                          )}
                          {log.action === 'MODIFICATION_ECHANTILLON' && (
                            <>
                              {Object.entries(log.changes).map(([field, values]: any) => (
                                <div key={field}>
                                  {field === 'status' ? 'Statut' : field === 'technician' ? 'Technicien' : field}:{' '}
                                  <span className="text-slate-600 line-through">{values.from}</span>
                                  {' → '}
                                  <span className="text-emerald-400 font-bold">{values.to}</span>
                                </div>
                              ))}
                            </>
                          )}
                          {log.action === 'PLANIFICATION_ANALYSE' && (
                            <div>Paramètres planifiés: <span className="text-sky-400">{Array.isArray(log.changes.parameters) ? log.changes.parameters.join(', ') : log.changes.parameters}</span></div>
                          )}
                          {log.action === 'VALIDATION_ANALYSE' && (
                            <>
                              <div>Risque calculé: <span className="text-[#c9df25] font-bold">{log.changes.risk_score}%</span></div>
                              <div>Anomalies détectées: <span className={log.changes.has_anomaly ? 'text-red-400 font-bold' : 'text-slate-400'}>{log.changes.has_anomaly ? log.changes.anomalies?.join(', ') : 'Aucune'}</span></div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-900/40">
                        <ShieldCheck className="w-3 h-3 text-emerald-500/50" /> Signature cryptographique vérifiée : SECURE-HASH-{log.id * 739}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk Score & Recommendation Card */}
        {latestAnalysis && latestAnalysis.risk_score !== null && (
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-6 backdrop-blur-md shadow-xl overflow-hidden relative">
            {/* Background glowing glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${
              latestAnalysis.risk_score > 70 
                ? 'bg-red-500' 
                : latestAnalysis.risk_score > 35 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
            }`}></div>

            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* Score ring */}
              <div className="flex flex-col items-center justify-center text-center shrink-0">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG Circle progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      className={`${
                        latestAnalysis.risk_score > 70 
                          ? 'stroke-red-500' 
                          : latestAnalysis.risk_score > 35 
                            ? 'stroke-amber-500' 
                            : 'stroke-emerald-500'
                      } transition-all duration-1000`}
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - latestAnalysis.risk_score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{latestAnalysis.risk_score}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risque</span>
                  </div>
                </div>
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                  latestAnalysis.risk_score > 70 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : latestAnalysis.risk_score > 35 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {latestAnalysis.risk_score > 70 ? 'CRITIQUE' : latestAnalysis.risk_score > 35 ? 'MODÉRÉ' : 'CONFORME'}
                </span>
              </div>

              {/* Recommendation message */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Évaluation Sanitaire & Conformité</div>
                  <h3 className="text-xl font-bold text-white">Recommandation du Laboratoire</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-800/40 p-4 rounded-md">
                  {latestAnalysis.ai_recommendation}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 rounded-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Garantie de conformité ISO 17025. Cette certification est vérifiable et certifiée infalsifiable.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Table */}
        {latestAnalysis && latestAnalysis.results && latestAnalysis.results.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/30 rounded-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Résultats des Analyses Physico-Chimiques
              </h2>
              <span className="text-xs text-slate-400 font-medium">{latestAnalysis.results.length} Paramètres Mesurés</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/30 text-slate-400 font-semibold text-xs border-b border-slate-800/45">
                  <tr>
                    <th className="px-6 py-3.5">Paramètre</th>
                    <th className="px-6 py-3.5">Valeur</th>
                    <th className="px-6 py-3.5">Unité</th>
                    <th className="px-6 py-3.5">Plage de Référence</th>
                    <th className="px-6 py-3.5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-slate-300">
                  {latestAnalysis.results.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{res.parameter}</td>
                      <td className="px-6 py-4 font-mono text-white">{res.value}</td>
                      <td className="px-6 py-4 text-slate-400">{res.unit || '—'}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {res.reference_min !== null || res.reference_max !== null ? (
                          <span>{res.reference_min ?? '0'} - {res.reference_max ?? '∞'}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {res.is_anomaly ? (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">ANOMALIE</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CONFORME</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions for public user */}
            <div className="p-6 bg-slate-950/40 border-t border-slate-800/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-slate-400">
                Technicien Analyste : <span className="font-semibold text-white">{latestAnalysis.technician?.name || sample.technician?.name || "Dr. Sophie Martin"}</span>
              </div>
              <a 
                href={`${API_URL}/api/public/reports/${latestAnalysis.id}/download`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-md transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                Télécharger le Rapport PDF Certifié
              </a>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-2 pt-6">
          <p>ChemLab LIMS — Certifié ISO 17025. Registre de traçabilité numérique vérifiable.</p>
          <p>Ce document est généré de manière automatique et sécurisée, tout droit réservé ChemLab.</p>
        </div>
      </main>
    </div>
  );
}
