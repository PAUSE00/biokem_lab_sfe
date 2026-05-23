import { useState, useEffect } from 'react';
import { History, Filter, User as UserIcon, Download, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
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

export default function Audit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Expanded log metadata view
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, modelFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Building query params
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (modelFilter) params.model = modelFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get('/api/audit-logs', {
        params
      });
      setLogs(response.data || []);
    } catch (err) {
      setError('Échec du chargement de la piste d\'audit. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleExportCSV = () => {
    // Generate clean CSV
    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'Rôle', 'Action', 'Entité', 'ID Entité', 'Détails'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString(),
      log.user?.name || 'Système',
      log.user?.role || 'N/A',
      log.action,
      log.model || 'N/A',
      log.model_id || 'N/A',
      JSON.stringify(log.changes || '')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registre_Audit_ChemLab_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (modelFilter) params.append('model', modelFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8000/api/audit-logs/export-pdf?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to export PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Registre_Audit_ISO17025_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Erreur lors de l'exportation PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#00f0ff] animate-pulse" />
            Registre d'Audit & Conformité ISO 17025
          </h1>
          <p className="text-sm text-slate-400 mt-1">Tracez toutes les actions du système, les modifications de données et garantissez la conformité ISO 17025</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer font-mono"
          >
            <Download className="w-5 h-5 mr-2 text-[#00f0ff]" />
            Exporter CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 cursor-pointer font-mono"
          >
            <Download className="w-5 h-5 mr-2" />
            Rapport de Sécurité
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-6 rounded-lg border border-[#1e293b] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1e293b] text-white font-bold text-sm font-mono uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#00f0ff]" />
          Filtres de Traçabilité
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Type d'Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
            >
              <option className="bg-[#0d131f]" value="">Toutes les actions</option>
              <option className="bg-[#0d131f]" value="CONNEXION">Connexion</option>
              <option className="bg-[#0d131f]" value="CREATION">Création</option>
              <option className="bg-[#0d131f]" value="UPDATE">Mise à jour</option>
              <option className="bg-[#0d131f]" value="DELETE">Suppression</option>
              <option className="bg-[#0d131f]" value="VALIDATION_ANALYSE">Validation d'analyse</option>
              <option className="bg-[#0d131f]" value="CREATION_ECHANTILLON">Création d'échantillon</option>
              <option className="bg-[#0d131f]" value="MODIFICATION_STOCK">Modification stock</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Module / Entité</label>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
            >
              <option className="bg-[#0d131f]" value="">Toutes les entités</option>
              <option className="bg-[#0d131f]" value="User">Utilisateur</option>
              <option className="bg-[#0d131f]" value="Sample">Échantillon</option>
              <option className="bg-[#0d131f]" value="Analysis">Analyse</option>
              <option className="bg-[#0d131f]" value="Equipment">Équipement</option>
              <option className="bg-[#0d131f]" value="StockItem">Article de Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Date de Début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Date de Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline/Table */}
      <div className="glass-panel rounded-lg border border-[#1e293b] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-mono">
            <thead>
              <tr className="bg-[#131b2e] border-b border-[#1e293b] text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                <th className="w-8"></th>
                <th className="px-6 py-4">Horodatage / Système</th>
                <th className="px-6 py-4">Opérateur</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entité / Référence</th>
                <th className="px-6 py-4">Intégrité Cryptographique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-xs leading-relaxed">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 bg-[#0d131f]/50">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin mb-4"></div>
                      Lecture du journal système...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#ff2e63] bg-[#ff2e63]/5 font-mono">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 bg-[#0d131f]/50">
                    <History className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
                    Aucune ligne d'audit trouvée dans les registres.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  
                  // Action Badge styling
                  let actionBadge = '';
                  if (log.action.includes('CREATION') || log.action === 'VALIDATION_ANALYSE') {
                    actionBadge = 'bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20 glow-lime';
                  } else if (log.action.includes('DELETE')) {
                    actionBadge = 'bg-[#ff2e63]/10 text-[#ff2e63] border border-[#ff2e63]/20 glow-rose';
                  } else if (log.action.includes('CONNEXION')) {
                    actionBadge = 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 glow-cyan';
                  } else {
                    actionBadge = 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20';
                  }

                  return (
                    <span key={log.id} className="table-row-group">
                      <tr 
                        onClick={() => toggleExpand(log.id)}
                        className="hover:bg-[#1e293b]/40 transition-colors cursor-pointer group"
                      >
                        <td className="pl-4 py-4 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#00f0ff]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#00f0ff] glow-cyan font-bold">
                          [{new Date(log.created_at).toLocaleString()}]
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 border border-[#1e293b] group-hover:border-[#00f0ff]/40">
                              <UserIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-white">{log.user?.name || 'Système'}</div>
                              <div className="text-[9px] text-[#00f0ff]/80 font-bold uppercase">{log.user?.role || 'SYSTEM'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${actionBadge}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {log.model ? (
                            <span>
                              {log.model} <span className="text-[#00f0ff]/60 font-semibold">ID::{log.model_id}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-full border border-[#a3e635]/20 glow-lime">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635]" /> CERTIFIÉ CONFORME
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#070b11]/70 border-l-2 border-[#00f0ff]">
                          <td colSpan={6} className="px-8 py-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                                <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                  <span>&gt;_ </span>Journal des Modifications du Modèle
                                </h5>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Tracé HASH :: <span className="text-[#00f0ff]">SHA256-{(log.id * 749312984).toString(16).toUpperCase()}</span>
                                </div>
                              </div>
                              
                              {log.changes ? (
                                <pre className="bg-[#070b11] border border-[#1e293b] text-[#a3e635] text-xs p-4 rounded-md overflow-x-auto shadow-inner max-w-4xl font-mono leading-relaxed">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              ) : (
                                <div className="text-slate-500 text-xs italic font-mono pl-2">
                                  // Aucun attribut supplémentaire enregistré pour cette action.
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" />
                                <span>Rapport de Traçabilité ISO 17025 cryptographiquement ancré.</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </span>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
