import React from 'react';
import { riskColor } from './types';

interface VialTubeProps {
  status: string;
}

export function VialTube({ status }: VialTubeProps) {
  let liquidColor = 'stroke-slate-300 fill-slate-100'; 
  let pulseClass = '';
  let bubbleElements = null;

  if (status === 'Validé') {
    liquidColor = 'fill-emerald-500/80 stroke-emerald-600/30';
    bubbleElements = (
      <React.Fragment>
        <circle cx="8" cy="30" r="0.8" className="fill-white/60 animate-[bounce_1.5s_infinite]" />
        <circle cx="12" cy="22" r="1.2" className="fill-white/60 animate-[bounce_2.5s_infinite]" />
        <circle cx="6" cy="26" r="0.6" className="fill-white/60 animate-[bounce_1.2s_infinite]" />
      </React.Fragment>
    );
  } else if (status === 'Anomalie') {
    liquidColor = 'fill-rose-500/80 stroke-rose-600/30';
    pulseClass = 'animate-pulse';
    bubbleElements = (
      <React.Fragment>
        <circle cx="7" cy="29" r="1" className="fill-white/70 animate-[bounce_1.4s_infinite]" />
        <circle cx="13" cy="23" r="0.7" className="fill-white/70 animate-[bounce_2.1s_infinite]" />
      </React.Fragment>
    );
  } else if (status === 'En cours') {
    liquidColor = 'fill-sky-500/70 stroke-sky-600/30';
    bubbleElements = (
      <React.Fragment>
        <circle cx="7" cy="34" r="0.8" className="fill-white/50 animate-[bounce_2s_infinite]" />
        <circle cx="11" cy="31" r="1" className="fill-white/50 animate-[bounce_1.6s_infinite]" />
      </React.Fragment>
    );
  } else {
    liquidColor = 'fill-amber-500/10 stroke-amber-600/10';
  }

  return (
    <div className="relative w-6 h-12 shrink-0 flex items-end justify-center">
      {/* Test tube glass container */}
      <svg className="w-4 h-10 overflow-visible z-10" viewBox="0 0 20 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cap */}
        <rect x="4" y="0" width="12" height="3" rx="0.5" fill="#475569" />
        <rect x="6" y="3" width="8" height="2" fill="#64748b" />
        
        {/* Glass body outline */}
        <path d="M 6,5 L 6,40 A 4,4 0 0 0 14,40 L 14,5 Z" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
        <path d="M 7,8 L 7,38" stroke="white" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" fill="none" />
        
        {/* Liquid content */}
        {status !== 'En attente' && (
          <g className={pulseClass}>
            <path
              d={
                status === 'Validé' || status === 'Anomalie'
                  ? "M 6.5,15 L 6.5,40 A 3.5,3.5 0 0 0 13.5,40 L 13.5,15 Z"
                  : status === 'En cours'
                    ? "M 6.5,25 Q 10,23 13.5,25 L 13.5,40 A 3.5,3.5 0 0 0 13.5,40 L 6.5,40 Z"
                    : "M 6.5,38 L 6.5,40 A 3.5,3.5 0 0 0 13.5,40 L 13.5,38 Z"
              }
              className={liquidColor}
            />
            {bubbleElements}
          </g>
        )}
        
        {/* Idle liquid line for Pending */}
        {status === 'En attente' && (
          <path d="M 6.5,38 L 6.5,40 A 3.5,3.5 0 0 0 13.5,40 L 13.5,38 Z" className={liquidColor} />
        )}
      </svg>
    </div>
  );
}

interface RiskGaugeProps {
  score: number;
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const c = riskColor(score);
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border bg-slate-900 border-slate-800 text-white shadow-md relative overflow-hidden group">
      <div className="absolute top-1.5 left-1.5 text-[7px] font-mono text-slate-650 tracking-wider">SYS.DIAG // RISK INDEX</div>
      <div className="absolute top-1.5 right-1.5 text-[7px] font-mono text-slate-650">V.3.4</div>
      
      <div className="relative w-24 h-24 flex items-center justify-center mt-1">
        {/* Outer tick marks */}
        <svg className="absolute inset-0 w-full h-full transform rotate-180 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,6" fill="none" />
          <circle cx="50" cy="50" r="41" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,12" fill="none" />
        </svg>

        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            className="text-slate-800"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            cx="18"
            cy="18"
            r="15.9155"
          />
          <circle
            className="transition-all duration-700 ease-out"
            strokeWidth="3.5"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            stroke={score > 70 ? '#f43f5e' : score > 35 ? '#f59e0b' : '#10b981'}
            fill="none"
            cx="18"
            cy="18"
            r="15.9155"
            style={{
              filter: `drop-shadow(0 0 3px ${score > 70 ? '#f43f5e' : score > 35 ? '#f59e0b' : '#10b981'}80)`
            }}
          />
        </svg>
        <div className="absolute text-center flex flex-col justify-center items-center">
          <span className="text-xl font-black font-mono tracking-tighter leading-none text-white">
            {score}%
          </span>
          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Indice Risque</span>
        </div>
      </div>
      
      <div className="w-full flex items-center justify-center">
        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border transition-all duration-300 ${
          score > 70
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse'
            : score > 35
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          Risque {c.label}
        </span>
      </div>
    </div>
  );
}
