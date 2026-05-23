import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, CheckCircle2, FileBarChart } from 'lucide-react';
import api from '../services/api';

interface Sample {
  id: number;
  code: string;
}

interface Analysis {
  id: number;
  sample_id: number;
  status: string;
  created_at: string;
  validated_at: string;
  risk_score: number | null;
  ai_recommendation: string | null;
  sample?: Sample;
}

export default function Reports() {
  const [reports, setReports] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Fetching all analyses, then we filter validated ones
      const response = await api.get('/api/analyses');
      const validAnalyses = (response.data || []).filter((a: Analysis) => a.status === 'Validé');
      setReports(validAnalyses);
    } catch (err) {
      setError('Échec de la récupération des rapports. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (analysis: Analysis) => {
    try {
      const response = await api.get(`/api/reports/${analysis.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_Analyse_AN-${analysis.id.toString().padStart(4, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#00f0ff] animate-pulse" />
            Rapports d'Analyse
          </h1>
          <p className="text-sm text-slate-400 mt-1">Consultez et exportez les rapports officiels des analyses validées</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-lg flex flex-col sm:flex-row gap-4 border border-[#1e293b]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un rapport par code d'échantillon ou ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
          />
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer font-mono">
          <Filter className="w-4 h-4 mr-2 text-[#00f0ff]" />
          Filtres
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-[#0d131f]/30 border border-[#1e293b] rounded-md">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin mb-4"></div>
              Lecture de la base de rapports...
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full py-12 text-center text-[#ff2e63] bg-[#ff2e63]/5 border border-[#ff2e63]/25 rounded-md font-mono">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-[#0d131f]/30 border border-[#1e293b] rounded-lg shadow-xl">
            <FileBarChart className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
            <p className="text-base font-bold text-white font-mono uppercase tracking-wider">Aucun rapport disponible</p>
            <p className="text-sm text-slate-400 mt-1">Validez des analyses pour générer automatiquement les rapports.</p>
          </div>
        ) : (
          reports.map((report) => {
            const hasHighRisk = report.risk_score !== null && report.risk_score > 70;
            const hasMediumRisk = report.risk_score !== null && report.risk_score > 35;
            
            return (
              <div key={report.id} className="glass-panel rounded-lg p-6 flex flex-col hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:border-[#00f0ff]/40 transition-all duration-300 relative group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#a3e635] opacity-40 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-md bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center border border-[#00f0ff]/20 shadow-cyan-glow">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 font-mono">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/25 glow-lime">
                      <CheckCircle2 className="w-3.5 h-3.5" /> VALIDÉ
                    </span>
                    {report.risk_score !== null && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        hasHighRisk 
                          ? 'bg-[#ff2e63]/10 text-[#ff2e63] border-[#ff2e63]/30 glow-rose' 
                          : hasMediumRisk 
                            ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' 
                            : 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/30 glow-lime'
                      }`}>
                        Risque: {report.risk_score}%
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-white mb-1 font-mono tracking-wide">
                  Rapport AN-{report.id.toString().padStart(4, '0')}
                </h3>
                <p className="text-sm text-slate-400 mb-3 font-mono">
                  Échantillon: <span className="font-bold text-[#00f0ff] glow-cyan">{report.sample?.code || `#${report.sample_id}`}</span>
                </p>

                {report.ai_recommendation && (
                  <div className={`text-xs p-3 rounded border mb-4 leading-relaxed font-mono ${
                    hasHighRisk 
                      ? 'bg-[#ff2e63]/5 text-slate-350 border-[#ff2e63]/20' 
                      : hasMediumRisk 
                        ? 'bg-[#f59e0b]/5 text-slate-355 border-[#f59e0b]/20' 
                        : 'bg-[#1e293b]/30 text-slate-300 border-[#1e293b]'
                  }`}>
                    <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-[#00f0ff] glow-cyan">Conclusions Cliniques</p>
                    {report.ai_recommendation}
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-[#1e293b] flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono">
                    Validé le {new Date(report.validated_at || report.created_at).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => handleDownloadPDF(report)}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-350 hover:text-white text-xs font-bold rounded-md transition-all cursor-pointer font-mono"
                  >
                    <Download className="w-4 h-4 mr-1 text-[#00f0ff]" />
                    PDF
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
