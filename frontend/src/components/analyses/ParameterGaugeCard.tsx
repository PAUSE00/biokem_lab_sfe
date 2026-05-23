import { TestTube } from 'lucide-react';
import { type AnalysisResult, getParamMeta, paramIcon } from './types';

interface ParameterGaugeCardProps {
  result: AnalysisResult;
}

export default function ParameterGaugeCard({ result }: ParameterGaugeCardProps) {
  const val = parseFloat(result.value);
  const min = result.reference_min ?? 0;
  const max = result.reference_max ?? 100;
  const meta = getParamMeta(result.parameter);
  
  const range = max - min || 1;
  const percentage = ((val - min) / range) * 50 + 25; // 25% is min, 75% is max
  const boundedPercentage = Math.min(95, Math.max(5, percentage));
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-8 h-8 bg-teal-500/5 rounded-bl-full pointer-events-none" />
      
      <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase font-mono tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-400 font-bold">
          {meta ? paramIcon(meta.icon) : <TestTube className="w-3.5 h-3.5" />}
          {result.parameter}
        </span>
        <span className={`px-1.5 py-0.5 rounded font-extrabold text-[8px] ${
          result.is_anomaly 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {result.is_anomaly ? '⚠️ HORS-NORME' : '✓ CONFORME'}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xl font-bold font-mono text-white tracking-tight">
          {result.value}
        </span>
        <span className="text-xs text-slate-400 font-medium font-mono">
          {result.unit || ''}
        </span>
      </div>

      {meta && (
        <span className="text-[10px] text-slate-500 leading-tight">
          {meta.description}
        </span>
      )}

      {/* Horizontal indicator slider */}
      <div className="mt-2 space-y-1">
        <div className="relative h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-visible">
          {/* Reference normal range zone (from 25% to 75%) */}
          <div className="absolute left-[25%] right-[25%] top-0 bottom-0 bg-emerald-500/15 rounded" />
          
          {/* Min / Max lines */}
          <div className="absolute left-[25%] top-[-2px] bottom-[-2px] w-[1px] bg-slate-700" />
          <div className="absolute left-[75%] top-[-2px] bottom-[-2px] w-[1px] bg-slate-700" />

          {/* Indicator Dot */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-slate-950 shadow-md transition-all duration-500 ${
              result.is_anomaly ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
            }`}
            style={{ left: `${boundedPercentage}%` }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-[7px] font-mono text-slate-650 px-0.5">
          <span>MIN: {min}</span>
          <span className="text-slate-500">CONFORME</span>
          <span>MAX: {max}</span>
        </div>
      </div>
    </div>
  );
}
