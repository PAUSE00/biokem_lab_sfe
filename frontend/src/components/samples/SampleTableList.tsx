import React from 'react';
import { QrCode, Activity, MoreVertical, Edit, Play, Layers, Printer, FileSignature, Trash2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
}

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
  parent_id?: number | null;
  parent?: { code: string } | null;
  technician_id?: number | null;
  technician?: User | null;
  client_name?: string;
  deviations?: Deviation[];
}

interface SampleTableListProps {
  samples: Sample[];
  activeDropdownId: number | null;
  setActiveDropdownId: (id: number | null) => void;
  onAssign: (sample: Sample) => void;
  onShowQr: (sample: Sample) => void;
  onShowHistory: (sample: Sample) => void;
  onOpenEdit: (sample: Sample) => void;
  onOpenAnalysis: (sample: Sample) => void;
  onOpenAliquots: (sample: Sample) => void;
  onOpenLabel: (sample: Sample) => void;
  onOpenTransfer: (sample: Sample) => void;
  onDelete: (id: number) => void;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getTemperatureBadge: (condition: string | null | undefined, value: number | null | undefined) => React.ReactNode;
}

export default function SampleTableList({
  samples,
  activeDropdownId,
  setActiveDropdownId,
  onAssign,
  onShowQr,
  onShowHistory,
  onOpenEdit,
  onOpenAnalysis,
  onOpenAliquots,
  onOpenLabel,
  onOpenTransfer,
  onDelete,
  getPriorityBadge,
  getTemperatureBadge
}: SampleTableListProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800 font-mono">
              <th className="p-3.5">Code Echantillon</th>
              <th className="p-3.5">Statut LIMS</th>
              <th className="p-3.5">Matrice / Type</th>
              <th className="p-3.5">Demandeur</th>
              <th className="p-3.5">Volume & Temp.</th>
              <th className="p-3.5">Rack / Position</th>
              <th className="p-3.5">Opérateur Assigné</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
            {samples.map((sample) => (
              <tr key={sample.id} className="hover:bg-slate-850/50 transition-colors group">
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-white text-xs group-hover:text-cyan-400 transition-colors font-mono">
                      {sample.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(sample.priority)}
                      {sample.parent_id && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-cyan-950/20 text-cyan-400 border border-cyan-800/30 rounded text-[8px] font-black uppercase">
                          Aliquote
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {sample.status === 'Anomalie' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-955/20 bg-rose-950/20 text-rose-400 border border-rose-900/30 uppercase">
                      Anomalie
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        sample.status === 'Terminé' 
                          ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 animate-pulse' 
                          : sample.status === 'En cours' 
                          ? 'bg-sky-500 shadow-md shadow-sky-500/20' 
                          : 'bg-slate-500'
                      }`} />
                      <span className="text-[11px] font-bold text-slate-200">{sample.status}</span>
                    </div>
                  )}
                </td>
                <td className="p-3 font-semibold text-slate-200">
                  {sample.type}
                </td>
                <td className="p-3 text-slate-400 max-w-[120px] truncate">
                  {sample.client_name || 'LAB-DEMANDEUR'}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-200 font-bold">{sample.volume || 'N/A'}</span>
                    <span>{getTemperatureBadge(sample.temp_condition, sample.temp_value)}</span>
                  </div>
                </td>
                <td className="p-3 font-bold text-cyan-400">
                  {sample.storage_location ? (
                    <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {sample.storage_location}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium italic">Non assigné</span>
                  )}
                </td>
                <td className="p-3">
                  {sample.technician ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-800/30 flex items-center justify-center text-[9px] font-black font-mono">
                        {sample.technician.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-slate-200 font-semibold">{sample.technician.name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAssign(sample)}
                      className="px-2 py-1 bg-cyan-950/30 hover:bg-cyan-900/30 text-cyan-455 hover:text-cyan-400 border border-cyan-850 border-cyan-800/30 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      + S'ASSIGNER
                    </button>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onShowQr(sample)}
                      className="p-1 border border-slate-750 bg-slate-950 hover:bg-slate-850 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Code QR"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onShowHistory(sample)}
                      className="p-1 border border-slate-750 bg-slate-950 hover:bg-slate-850 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Traçabilité"
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Quick Dropdown Actions Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === sample.id ? null : sample.id);
                        }}
                        className="p-1 border border-slate-750 bg-slate-950 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdownId === sample.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-slate-950 rounded-lg shadow-2xl border border-slate-800 overflow-hidden z-20 py-1 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={() => {
                              onOpenEdit(sample);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-305 hover:bg-slate-900 text-slate-350 hover:text-white transition-colors font-mono"
                          >
                            <Edit className="w-4 h-4 mr-2 text-slate-500" />
                            Modifier Spécifications
                          </button>
                          <button
                            onClick={() => {
                              onOpenAnalysis(sample);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-305 hover:bg-slate-900 text-slate-350 hover:text-white transition-colors font-mono"
                          >
                            <Play className="w-4 h-4 mr-2 text-slate-500" />
                            Créer Analyse
                          </button>
                          <button
                            onClick={() => {
                              onOpenAliquots(sample);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-305 hover:bg-slate-900 text-slate-350 hover:text-white transition-colors font-mono"
                          >
                            <Layers className="w-4 h-4 mr-2 text-slate-500" />
                            Diviser en Aliquotes
                          </button>
                          <button
                            onClick={() => {
                              onOpenLabel(sample);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-305 hover:bg-slate-900 text-slate-350 hover:text-white transition-colors font-mono"
                          >
                            <Printer className="w-4 h-4 mr-2 text-slate-500" />
                            Imprimer Étiquette SGH
                          </button>
                          <button
                            onClick={() => {
                              onOpenTransfer(sample);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-305 hover:bg-slate-900 text-slate-350 hover:text-white transition-colors font-mono"
                          >
                            <FileSignature className="w-4 h-4 mr-2 text-slate-500" />
                            Transférer la Garde
                          </button>
                          <div className="border-t border-slate-850 border-slate-800 my-1"></div>
                          <button
                            onClick={() => {
                              onDelete(sample.id);
                              setActiveDropdownId(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-950/20 transition-colors font-mono"
                          >
                            <Trash2 className="w-4 h-4 mr-2 text-rose-500" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
