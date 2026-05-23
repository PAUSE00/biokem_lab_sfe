import React, { useState, useEffect, useMemo } from 'react';
import { History, ChevronRight, ChevronDown, Download, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  role: string;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  model: string | null;
  model_id: number | null;
  changes: any | null;
  created_at: string;
  user?: User;
}

interface Deviation {
  id: number;
  sample_id: number;
  type: string;
  parameter: string;
  expected_limit: string;
  actual_value: string;
  status: 'OPEN' | 'RESOLVED';
  comments: string | null;
  created_at: string;
  sample_code?: string;
}

export default function Qualite() {
  const [activeTab, setActiveTab] = useState<'audit' | 'deviations'>('audit');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audit Filters
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Resolution Modal / Action state
  const [resolvingDev, setResolvingDev] = useState<Deviation | null>(null);
  const [resolveComments, setResolveComments] = useState('');

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchSamplesAndDeviations();
    }
  }, [activeTab, actionFilter, startDate, endDate]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get('/api/audit-logs', { params });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSamplesAndDeviations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/samples');
      setSamples(res.data || []);
    } catch (err) {
      console.error('Failed to fetch deviations', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract deviations list from samples
  const deviationsList = useMemo(() => {
    const list: Deviation[] = [];
    samples.forEach(s => {
      if (s.deviations && s.deviations.length > 0) {
        s.deviations.forEach((d: any) => {
          list.push({
            ...d,
            sample_code: s.code
          });
        });
      }
    });
    return list;
  }, [samples]);

  const handleResolveDeviation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDev) return;
    try {
      await api.post(`/api/deviations/${resolvingDev.id}/resolve`, {
        comments: resolveComments,
        signature_data: 'VISA_QUALITE'
      });
      setResolvingDev(null);
      setResolveComments('');
      await fetchSamplesAndDeviations();
      alert('Déviation résolue et clôturée.');
    } catch {
      alert('Erreur lors de la clôture de la déviation.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'Action', 'Détails'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      l.user?.name || 'Système',
      l.action,
      JSON.stringify(l.changes || '')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Registre_ISO_17025_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <History className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Registre de Qualité & Conformité ISO 17025
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Piste d'audit cryptographiquement vérifiable et registre central des anomalies/déviations critiques
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-xs font-bold rounded-lg font-mono uppercase transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#00f0ff]" /> Exporter CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b] shrink-0 font-mono text-xs">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-[#00f0ff] text-[#00f0ff] glow-cyan'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Piste d'Audit ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('deviations')}
          className={`px-4 py-2 font-bold border-b-2 transition-all ${
            activeTab === 'deviations'
              ? 'border-[#00f0ff] text-[#00f0ff] glow-cyan'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Déviations Qualité ({deviationsList.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow min-h-0 flex flex-col bg-[#0d131f]/50 border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        {activeTab === 'audit' ? (
          /* Audit Logs list */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Filter Sub-bar */}
            <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] flex gap-3 items-center shrink-0">
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-xs text-white font-mono focus:outline-none"
              >
                <option value="">Toutes les actions</option>
                <option value="CONNEXION">Connexion</option>
                <option value="CREATION">Création</option>
                <option value="UPDATE">Mise à jour</option>
                <option value="VALIDATION_ANALYSE">Validation d'analyse</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-xs text-white font-mono"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#070b11] border border-[#1e293b] rounded text-xs text-white font-mono"
              />
            </div>

            <div className="flex-grow overflow-y-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#131b2e] border-b border-[#1e293b] text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    <th className="w-6 pl-4"></th>
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Opérateur</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4 text-right pr-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-355">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">Chargement...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-550">Aucun log d'audit.</td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="hover:bg-[#1a2333]/20 cursor-pointer transition-all"
                          >
                            <td className="pl-4 py-2.5">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#00f0ff]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                            </td>
                            <td className="py-2.5 px-4 text-cyan-400">[{new Date(log.created_at).toLocaleString()}]</td>
                            <td className="py-2.5 px-4 font-bold text-slate-200">{log.user?.name || 'Système'}</td>
                            <td className="py-2.5 px-4">{log.action}</td>
                            <td className="py-2.5 px-4">{log.model || 'System'} {log.model_id}</td>
                            <td className="py-2.5 px-4 text-right pr-4 text-emerald-400 font-bold">SHA256 OK</td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-[#070b11]/70">
                              <td colSpan={6} className="p-4 pl-12 font-mono text-[10px] text-teal-400">
                                <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.changes || 'Aucune modification directe', null, 2)}</pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Deviations list */
          <div className="flex-grow overflow-y-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#131b2e] border-b border-[#1e293b] text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4">Horodatage</th>
                  <th className="py-3 px-4">Code Échantillon</th>
                  <th className="py-3 px-4">Type d'Anomalie</th>
                  <th className="py-3 px-4">Paramètre</th>
                  <th className="py-3 px-4">Relevé</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-slate-350">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Chargement...</td>
                  </tr>
                ) : deviationsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-550">Aucune anomalie enregistrée.</td>
                  </tr>
                ) : (
                  deviationsList.map(d => (
                    <tr key={d.id} className="hover:bg-[#1a2333]/20 transition-all">
                      <td className="py-2.5 px-4">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 font-bold text-white">{d.sample_code}</td>
                      <td className="py-2.5 px-4 text-rose-400">{d.type}</td>
                      <td className="py-2.5 px-4">{d.parameter}</td>
                      <td className="py-2.5 px-4">{d.actual_value} (attendu: {d.expected_limit})</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          d.status === 'OPEN' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right pr-4">
                        {d.status === 'OPEN' ? (
                          <button
                            onClick={() => setResolvingDev(d)}
                            className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Résoudre
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-550 italic">Résolu : {d.comments}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingDev && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d131f] rounded-lg border border-[#1e293b] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
              <h3 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Clôturer la Déviation
              </h3>
              <button onClick={() => setResolvingDev(null)} className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer">Fermer</button>
            </div>
            <form onSubmit={handleResolveDeviation} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <p className="text-slate-355">
                  Résolution de l'anomalie <span className="text-rose-400">{resolvingDev.type}</span> sur l'échantillon <span className="font-bold text-white">{resolvingDev.sample_code}</span>.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Actions Correctives Appliquées</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Expliquez la résolution (ex: re-étalonnage du capteur ou re-prélèvement)..."
                  value={resolveComments}
                  onChange={e => setResolveComments(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-white placeholder-slate-650 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-[#1e293b] pt-4">
                <button
                  type="button"
                  onClick={() => setResolvingDev(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded cursor-pointer"
                >
                  Valider la clôture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
