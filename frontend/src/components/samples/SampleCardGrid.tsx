import React from 'react';
import { QrCode, Activity, MoreVertical, Edit, UserPlus, Play, Layers, Printer, FileSignature, Trash2, ShieldAlert, AlertTriangle, Droplet, MapPin, Check } from 'lucide-react';
import { renderIllustration } from './GlasswareIllustration';

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
  client?: User | null;
  aliquots?: Sample[];
  deviations?: Deviation[];
  description?: string | null;
}

interface SampleCardGridProps {
  samples: Sample[];
  activeDropdownId: number | null;
  setActiveDropdownId: (id: number | null) => void;
  onQuickAssign: (sample: Sample) => void;
  onShowQr: (sample: Sample) => void;
  onShowHistory: (sample: Sample) => void;
  onOpenEdit: (sample: Sample) => void;
  onOpenAnalysis: (sample: Sample) => void;
  onOpenAliquots: (sample: Sample) => void;
  onOpenLabel: (sample: Sample) => void;
  onOpenTransfer: (sample: Sample) => void;
  onDelete: (id: number) => void;
  onSearchTerm: (term: string) => void;
  onSelectedDeviation: (dev: Deviation) => void;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getTypeBadge: (type: string) => React.ReactNode;
  getTemperatureBadge: (condition: string | null | undefined, value: number | null | undefined) => React.ReactNode;
  getAvatarBgColor: (name: string) => string;
  getInitials: (name: string) => string;
}

export default function SampleCardGrid({
  samples,
  activeDropdownId,
  setActiveDropdownId,
  onQuickAssign,
  onShowQr,
  onShowHistory,
  onOpenEdit,
  onOpenAnalysis,
  onOpenAliquots,
  onOpenLabel,
  onOpenTransfer,
  onDelete,
  onSearchTerm,
  onSelectedDeviation,
  getPriorityBadge,
  getTypeBadge,
  getTemperatureBadge,
  getAvatarBgColor,
  getInitials
}: SampleCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {samples.map((sample) => (
        <div
          key={sample.id}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20 hover:border-slate-700 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Card Accent Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all"></div>
          
          <div>
            {/* Card Header area */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                {/* Scaled glassware SVG */}
                <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-slate-950 border border-slate-800/80 rounded-xl p-1.5 group-hover:border-cyan-500/30 group-hover:bg-cyan-950/5 transition-all">
                  {renderIllustration(sample.type, sample.status)}
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-white text-sm font-mono tracking-tight group-hover:text-cyan-400 transition-colors block">
                    {sample.code}
                  </span>
                  {/* Parent ID link indicator */}
                  {sample.parent_id && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-0.5 font-mono">
                      <span>Aliquote de:</span>
                      <button
                        onClick={() => onSearchTerm(sample.parent?.code || '')}
                        className="text-cyan-400 underline cursor-pointer bg-transparent border-none p-0 hover:text-white"
                      >
                        {sample.parent?.code || `SMP-${sample.parent_id}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Top right quick icons menu */}
              <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                <button
                  onClick={() => onShowQr(sample)}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-950 border border-slate-800 rounded transition-colors cursor-pointer"
                  title="Code QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onShowHistory(sample)}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-950 border border-slate-800 rounded transition-colors cursor-pointer"
                  title="Traçabilité"
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu Toggle */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(activeDropdownId === sample.id ? null : sample.id);
                    }}
                    className="p-1.5 text-slate-450 hover:text-white hover:bg-slate-950 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdownId === sample.id && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-950 rounded-lg shadow-2xl border border-slate-800 overflow-hidden z-20 py-1 text-left animate-in fade-in slide-in-from-top-2 duration-200 font-mono">
                      <button
                        onClick={() => {
                          onOpenEdit(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2 text-slate-500" />
                        Modifier Spécifications
                      </button>
                      <button
                        onClick={() => {
                          onQuickAssign(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-2 text-slate-500" />
                        S'assigner (Tech)
                      </button>
                      <button
                        onClick={() => {
                          onOpenAnalysis(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Play className="w-4 h-4 mr-2 text-slate-500" />
                        Créer Analyse
                      </button>
                      <button
                        onClick={() => {
                          onOpenAliquots(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Layers className="w-4 h-4 mr-2 text-slate-500" />
                        Diviser en Aliquotes
                      </button>
                      <button
                        onClick={() => {
                          onOpenLabel(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Printer className="w-4 h-4 mr-2 text-slate-500" />
                        Étiquette SGH
                      </button>
                      <button
                        onClick={() => {
                          onOpenTransfer(sample);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <FileSignature className="w-4 h-4 mr-2 text-slate-500" />
                        Transférer la Garde
                      </button>
                      <div className="border-t border-slate-800 my-1"></div>
                      <button
                        onClick={() => {
                          onDelete(sample.id);
                          setActiveDropdownId(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-rose-550" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges block */}
            <div className="flex flex-wrap gap-1.5 mt-3 font-mono">
              {getTypeBadge(sample.type)}
              {getPriorityBadge(sample.priority)}
              {getTemperatureBadge(sample.temp_condition, sample.temp_value)}
            </div>

            {/* Child Aliquots badges block */}
            {sample.aliquots && sample.aliquots.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1 text-[10px] font-bold text-slate-500 font-mono">
                <span>Aliquotes ({sample.aliquots.length}) :</span>
                {sample.aliquots.map(ali => (
                  <button
                    key={ali.id}
                    onClick={() => onSearchTerm(ali.code)}
                    className="px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded hover:bg-cyan-950 hover:text-cyan-400 border border-slate-800 hover:border-cyan-800/30 transition-all cursor-pointer text-[9px] font-mono"
                  >
                    {ali.code.split('-').pop()}
                  </button>
                ))}
              </div>
            )}

            {/* Intake warning notices */}
            {sample.description && sample.description.includes('[ALERTE RÉCEPTION]') && (() => {
              const alertPart = sample.description.split('[ALERTE RÉCEPTION]')[1]?.trim() || '';
              return (
                <div className="mt-2.5 p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg text-[10px] text-rose-350 font-semibold flex items-start gap-1.5 font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-550" />
                  <div>
                    <span className="uppercase tracking-widest block text-[8px] text-rose-455">Alerte Conformité</span>
                    <span className="block mt-0.5 leading-tight font-medium text-slate-300">{alertPart}</span>
                  </div>
                </div>
              );
            })()}

            {/* Deviations warning notices */}
            {sample.deviations && sample.deviations.length > 0 && (
              <div className="mt-2.5 space-y-2 font-mono">
                {sample.deviations.map((dev) => (
                  <div key={dev.id} className={`p-2.5 border rounded-lg text-[10px] font-bold flex items-start gap-1.5 ${
                    dev.status === 'RESOLVED'
                      ? 'bg-emerald-950/25 border-emerald-900/30 text-emerald-400'
                      : 'bg-rose-950/25 border-rose-900/30 text-rose-400'
                  }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${dev.status === 'RESOLVED' ? 'text-emerald-500' : 'text-rose-550'}`} />
                    <div className="flex-1">
                      <span className="uppercase tracking-widest block text-[8px] opacity-75">
                        Déviation : {dev.type === 'TEMP_EXCURSION' ? 'Excursion Température' : dev.type}
                      </span>
                      <span className="block mt-0.5 leading-tight font-medium text-slate-200">
                        Mesuré : {dev.actual_value} (Requis : {dev.expected_limit})
                      </span>
                      {dev.status === 'RESOLVED' ? (
                        <span className="block text-[8px] text-emerald-500 mt-1 font-mono">
                          Résolu par signature de conformité
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectedDeviation(dev)}
                          className="mt-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[8px] rounded cursor-pointer uppercase tracking-wider transition-all block font-mono border border-rose-500/30"
                        >
                          Signer & Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Specs Block */}
            <div className="mt-3.5 space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Client :</span>
                <span className="text-slate-300 font-bold truncate max-w-[130px]">{sample.client ? sample.client.name : 'N/D'}</span>
              </div>
              {sample.volume && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-sky-400" /> Volume :
                  </span>
                  <span className="text-slate-300 font-bold">{sample.volume}</span>
                </div>
              )}
              {sample.storage_location && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Stockage :
                  </span>
                  <span className="text-cyan-400 font-bold truncate max-w-[130px]">{sample.storage_location}</span>
                </div>
              )}
            </div>

            {/* Description Preview */}
            {sample.description && (
              <p className="text-[11px] text-slate-450 italic mt-2.5 line-clamp-2 border-l-2 border-cyan-500/30 pl-2 leading-relaxed">
                "{sample.description.includes('[ALERTE RÉCEPTION]') ? sample.description.split('[ALERTE RÉCEPTION]')[0].trim() : sample.description}"
              </p>
            )}
          </div>

          {/* Sleek inline status stepper */}
          <div>
            {sample.status !== 'Anomalie' ? (
              <div className="mt-4 flex items-center justify-between px-2.5 py-2 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                {[
                  { label: 'Reçu', status: 'Reçu' },
                  { label: 'En cours', status: 'En cours' },
                  { label: 'Terminé', status: 'Terminé' }
                ].map((step, idx, arr) => {
                  const isCompleted =
                    sample.status === 'Terminé' ||
                    (sample.status === 'En cours' && step.status !== 'Terminé') ||
                    (sample.status === 'Reçu' && step.status === 'Reçu');
                  const isActive = sample.status === step.status;
                  return (
                    <React.Fragment key={step.status}>
                      <div className="flex items-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-cyan-400 border border-cyan-400 ring-2 ring-cyan-400/25'
                            : isCompleted
                            ? 'bg-slate-700'
                            : 'bg-slate-950 border border-slate-800'
                        }`}>
                          {isCompleted && !isActive && <Check className="w-1.5 h-1.5 text-slate-950 stroke-[4]" />}
                        </div>
                        <span className={`text-[9px] font-bold ${
                          isActive ? 'text-cyan-400' : 'text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`h-[1px] flex-1 mx-1.5 ${
                          isCompleted && sample.status !== step.status ? 'bg-slate-750' : 'bg-slate-800'
                        }`}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 py-2 px-2.5 bg-rose-950/20 border border-rose-900/30 text-rose-455 rounded-lg text-center flex items-center justify-center gap-1.5 font-mono shadow-inner shadow-rose-950/40">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Échantillon en Anomalie</span>
              </div>
            )}

            <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-semibold font-mono">
              <div className="flex items-center gap-2">
                {sample.technician ? (
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[9px] font-black tracking-tight shadow-sm select-none ${getAvatarBgColor(sample.technician.name)}`}>
                      {getInitials(sample.technician.name)}
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">Technicien</span>
                      <span className="text-slate-300 font-extrabold truncate max-w-[80px] block mt-0.5" title={sample.technician.name}>
                        {sample.technician.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onQuickAssign(sample)}
                    title="Cliquez pour vous assigner cet échantillon"
                    className="flex items-center gap-1.5 text-left group/tech cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    <div className="w-7 h-7 rounded-full border border-dashed border-slate-750 flex items-center justify-center text-slate-500 group-hover/tech:bg-cyan-950/30 group-hover/tech:border-cyan-500/50 group-hover/tech:text-cyan-400 transition-all duration-200">
                      <UserPlus className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">Technicien</span>
                      <span className="text-slate-450 group-hover/tech:text-cyan-400 font-bold block mt-0.5 transition-colors">
                        Assigner
                      </span>
                    </div>
                  </button>
                )}
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none font-mono">Date</span>
                <span className="text-slate-300 font-bold block mt-0.5">{new Date(sample.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
