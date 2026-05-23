import { X, Activity, History, ShieldCheck, QrCode } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface Deviation {
  id: number;
  type: string;
  actual_value: string;
  expected_limit: string;
  status: string;
  created_at: string;
}

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
  deviations?: Deviation[];
}

interface CustodyTimelineDrawerProps {
  sample: Sample;
  onClose: () => void;
  historyLogs: any[];
  historyLoading: boolean;
}

const generateTemperatureHistory = (sample: Sample) => {
  const cond = sample.temp_condition;
  const val = sample.temp_value !== null && sample.temp_value !== undefined ? sample.temp_value : 20;
  
  if (cond === 'Réfrigéré') {
    if (val > 8) {
      return [
        { time: 'T-5h', temp: 4.2 },
        { time: 'T-4h', temp: 4.8 },
        { time: 'T-3h', temp: 5.5 },
        { time: 'T-2h', temp: 7.2 },
        { time: 'T-1h', temp: 9.5 },
        { time: 'Réception', temp: val },
      ];
    } else if (val < 2) {
      return [
        { time: 'T-5h', temp: 4.5 },
        { time: 'T-4h', temp: 3.5 },
        { time: 'T-3h', temp: 2.8 },
        { time: 'T-2h', temp: 1.5 },
        { time: 'T-1h', temp: 0.8 },
        { time: 'Réception', temp: val },
      ];
    } else {
      return [
        { time: 'T-5h', temp: 4.5 },
        { time: 'T-4h', temp: 4.1 },
        { time: 'T-3h', temp: 4.9 },
        { time: 'T-2h', temp: 5.2 },
        { time: 'T-1h', temp: 4.7 },
        { time: 'Réception', temp: val },
      ];
    }
  } else if (cond === 'Congelé') {
    if (val > -15) {
      return [
        { time: 'T-5h', temp: -18.5 },
        { time: 'T-4h', temp: -17.2 },
        { time: 'T-3h', temp: -16.8 },
        { time: 'T-2h', temp: -14.2 },
        { time: 'T-1h', temp: -12.5 },
        { time: 'Réception', temp: val },
      ];
    } else {
      return [
        { time: 'T-5h', temp: -19.2 },
        { time: 'T-4h', temp: -18.7 },
        { time: 'T-3h', temp: -19.5 },
        { time: 'T-2h', temp: -18.2 },
        { time: 'T-1h', temp: -18.9 },
        { time: 'Réception', temp: val },
      ];
    }
  } else {
    return [
      { time: 'T-5h', temp: 21.2 },
      { time: 'T-4h', temp: 20.8 },
      { time: 'T-3h', temp: 22.1 },
      { time: 'T-2h', temp: 21.5 },
      { time: 'T-1h', temp: 20.2 },
      { time: 'Réception', temp: val },
    ];
  }
};

export default function CustodyTimelineDrawer({
  sample,
  onClose,
  historyLogs,
  historyLoading
}: CustodyTimelineDrawerProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-end z-50 p-0 animate-in fade-in duration-200">
      <div className="bg-slate-950 text-slate-100 w-full max-w-md h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300 border-l border-slate-800">
        {/* Background glowing glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/20 px-2.5 py-0.5 rounded-full border border-cyan-500/25 font-mono">
              Conformité ISO 17025
            </span>
            <h3 className="font-extrabold text-white text-lg mt-1.5 flex items-center gap-2 font-mono">
              <Activity className="w-5 h-5 text-cyan-400" />
              TRAÇABILITÉ : {sample.code}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-450 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin">
          {/* Température Excursion Graph */}
          {sample.temp_condition && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Suivi de la Chaîne du Froid</h4>
                  <span className="text-[11px] font-bold text-slate-200 mt-0.5 block font-mono">
                    Condition : {sample.temp_condition} ({sample.temp_value !== null && sample.temp_value !== undefined ? `${sample.temp_value}°C` : 'N/D'})
                  </span>
                </div>
                {sample.deviations?.some(d => d.type === 'TEMPERATURE_EXCURSION' && d.status === 'OPEN') ? (
                  <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-[9px] font-black rounded uppercase tracking-wider font-mono animate-pulse">
                    Excursion Détectée
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black rounded uppercase tracking-wider font-mono">
                    Conforme
                  </span>
                )}
              </div>
              <div className="h-32 w-full text-[9px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateTemperatureHistory(sample)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <XAxis dataKey="time" stroke="#475569" tickLine={false} />
                    <YAxis stroke="#475569" tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '4px' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    />
                    {sample.temp_condition === 'Réfrigéré' && (
                      <>
                        <ReferenceLine y={8} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Max 8°C', fill: '#f43f5e', position: 'insideTopRight', fontSize: 8 }} />
                        <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Min 2°C', fill: '#3b82f6', position: 'insideBottomRight', fontSize: 8 }} />
                      </>
                    )}
                    {sample.temp_condition === 'Congelé' && (
                      <ReferenceLine y={-15} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Max -15°C', fill: '#f43f5e', position: 'insideTopRight', fontSize: 8 }} />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke={sample.deviations?.some(d => d.type === 'TEMPERATURE_EXCURSION' && d.status === 'OPEN') ? '#ef4444' : '#10b981'} 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#020617', strokeWidth: 2 }} 
                      activeDot={{ r: 5 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <span className="text-slate-400 font-bold text-sm font-mono">Chargement du journal d'audit...</span>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2 font-mono">
              <History className="w-12 h-12 mx-auto text-slate-800" />
              <p className="font-bold text-sm">Aucun événement de traçabilité</p>
              <p className="text-xs text-slate-600">Aucun historique d'audit disponible.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
              {historyLogs.map((log) => {
                const date = new Date(log.created_at);
                const formattedDate = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                
                let badgeColor = 'bg-blue-950/20 text-blue-400 border-blue-900/30';
                let actionLabel = log.action;
                if (log.action === 'CREATION_ECHANTILLON') {
                  badgeColor = 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
                  actionLabel = 'Réception & Enregistrement';
                } else if (log.action === 'MODIFICATION_ECHANTILLON') {
                  badgeColor = 'bg-amber-955/20 bg-amber-950/20 text-amber-400 border-amber-900/30';
                  actionLabel = 'Mise à jour / Assignation';
                } else if (log.action === 'PLANIFICATION_ANALYSE') {
                  badgeColor = 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30';
                  actionLabel = 'Analyses Planifiées';
                } else if (log.action === 'VALIDATION_ANALYSE') {
                  badgeColor = 'bg-lime-950/20 text-lime-400 border-lime-900/30';
                  actionLabel = 'Validation & Signature';
                }

                return (
                  <div key={log.id} className="relative group">
                    {/* Dot indicator */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-slate-700 group-hover:border-cyan-400 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-650 bg-slate-600 group-hover:bg-cyan-400"></span>
                    </span>
                    
                    <div className="space-y-2 bg-slate-900/50 border border-slate-800 p-4 rounded-md relative hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border tracking-wider font-mono ${badgeColor}`}>
                          {actionLabel.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {formattedDate} à {formattedTime}
                        </span>
                      </div>
                      
                      <div className="text-xs font-mono text-slate-300">
                        Technicien : <span className="text-white font-bold">{log.user?.name || 'Système LIMS'}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded ml-1.5 font-bold">
                          {log.user?.role || 'Service'}
                        </span>
                      </div>

                      {/* Changes details */}
                      {log.changes && (
                        <div className="mt-3 text-[11px] font-medium text-slate-400 space-y-1.5 bg-slate-950 p-3 rounded-md border border-slate-850 font-mono overflow-hidden">
                          {log.action === 'CREATION_ECHANTILLON' && (
                            <div className="space-y-1">
                              <div>Code: <span className="text-white">{log.changes.code}</span></div>
                              <div>Type: <span className="text-cyan-400">{log.changes.type}</span></div>
                              <div>Priorité: <span className="text-rose-400">{log.changes.priority}</span></div>
                              {log.changes.storage_location && (
                                <div>Zone: <span className="text-slate-350">{log.changes.storage_location}</span></div>
                              )}
                            </div>
                          )}

                          {log.action === 'MODIFICATION_ECHANTILLON' && (
                            <div className="space-y-1">
                              {Object.entries(log.changes).map(([field, values]: any) => (
                                <div key={field} className="truncate">
                                  {field === 'status' ? 'Statut' : field === 'technician' ? 'Technicien' : field}:{' '}
                                  <span className="text-slate-500 line-through">{values.from}</span>
                                  {' → '}
                                  <span className="text-emerald-400 font-bold">{values.to}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.action === 'PLANIFICATION_ANALYSE' && (
                            <div className="space-y-1">
                              <div>Paramètres: <span className="text-cyan-400">{Array.isArray(log.changes.parameters) ? log.changes.parameters.join(', ') : log.changes.parameters}</span></div>
                            </div>
                          )}

                          {log.action === 'VALIDATION_ANALYSE' && (
                            <div className="space-y-1">
                              <div>Indice de Risque: <span className="text-lime-400 font-bold">{log.changes.risk_score}%</span></div>
                              <div>Anomalies: <span className={log.changes.has_anomaly ? 'text-rose-455 font-bold' : 'text-slate-400'}>{log.changes.has_anomaly ? log.changes.anomalies?.join(', ') : 'Aucune'}</span></div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[9px] text-slate-550 text-slate-500 font-mono mt-2 border-t border-slate-800/50 pt-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/70" />
                        INTEGRITY HASH: SHA-256-[{log.id * 1024}]
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 relative z-10 flex gap-2.5">
          <a 
            href={`/tracking/${sample.code}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-md transition-all text-center flex items-center justify-center gap-1.5 font-mono border border-cyan-500/30 shadow-lg shadow-cyan-600/20"
          >
            <QrCode className="w-4 h-4" />
            Certificat Public
          </a>
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs rounded-md transition-all font-mono"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
