import { useMemo } from 'react';
import { getSoilClassification } from './soilClassifier';

interface SoilTriangleSVGProps {
  clay: number;
  silt: number;
  sand: number;
  isValid: boolean;
}

export default function SoilTriangleSVG({ clay, silt, sand, isValid }: SoilTriangleSVGProps) {
  // SVG size setup
  const W = 300;
  const H = 260;
  const xOffset = 40;
  const yOffset = 30;

  // Transform clay, silt, sand to Cartesian x, y
  const point = useMemo(() => {
    if (!isValid) return null;
    const total = clay + silt + sand;
    if (Math.abs(total - 100) > 2) return null;
    
    // x = xOffset + ((Silt + 0.5 * Clay) / 100) * W
    const x = xOffset + ((silt + 0.5 * clay) / 100) * W;
    // y = yOffset + (1 - Clay / 100) * H
    const y = yOffset + (1 - clay / 100) * H;
    return { x, y };
  }, [clay, silt, sand, isValid]);

  // Projections coordinates
  const projections = useMemo(() => {
    if (!point) return null;
    
    // Clay horizontal projection: left edge at same y
    const clayY = point.y;
    const clayXLeft = xOffset + (clay / 100) * 150;

    // Silt projection parallel to Sand-Clay side (left side) ending at bottom edge
    const siltXBottom = xOffset + (silt / 100) * W;
    const siltYBottom = yOffset + H;

    // Sand projection parallel to Clay-Silt side (right side) ending at bottom edge
    const sandXBottom = xOffset + ((100 - sand) / 100) * W;
    const sandYBottom = yOffset + H;

    return {
      clay: { x: clayXLeft, y: clayY },
      silt: { x: siltXBottom, y: siltYBottom },
      sand: { x: sandXBottom, y: sandYBottom },
    };
  }, [point, clay, silt, sand]);

  const classification = useMemo(() => {
    if (!isValid) return "Entrez des valeurs sommant à 100%";
    return getSoilClassification(clay, silt, sand);
  }, [clay, silt, sand, isValid]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3 relative overflow-hidden select-none">
      {/* High-tech grid background */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)',
        backgroundSize: '10px 10px'
      }} />

      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1.5 z-10">
        <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          TRIANGLE DE TEXTURE DES SOLS (ISO 11277)
        </span>
        {isValid && (
          <span className="text-[8px] bg-teal-950/40 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
            {clay.toFixed(0)}% A / {silt.toFixed(0)}% L / {sand.toFixed(0)}% S
          </span>
        )}
      </div>

      <svg width="100%" height="100%" viewBox="0 0 380 345" className="max-w-[340px] drop-shadow-[0_0_15px_rgba(45,212,191,0.05)]">
        {/* Shaded Texture Zones */}
        {/* Argile (Clay >= 40%) */}
        <polygon 
          points={`190,30 ${xOffset + 240},186 ${xOffset + 60},186`} 
          fill="rgba(244, 63, 94, 0.04)" 
          stroke="rgba(244, 63, 94, 0.15)" 
          strokeWidth="1"
        />
        {/* Sable (Sand >= 80%, Clay <= 15%) */}
        <polygon 
          points={`${xOffset},290 ${xOffset + 60},290 ${xOffset + 22.5},251`} 
          fill="rgba(234, 179, 8, 0.04)" 
          stroke="rgba(234, 179, 8, 0.15)" 
          strokeWidth="1"
        />
        {/* Limon (Silt >= 80%, Clay <= 15%) */}
        <polygon 
          points={`${xOffset + 300},290 ${xOffset + 240},290 ${xOffset + 277.5},251`} 
          fill="rgba(16, 185, 129, 0.04)" 
          stroke="rgba(16, 185, 129, 0.15)" 
          strokeWidth="1"
        />
        {/* Franc / Loam (Clay 10-30%, Silt 20-50%) */}
        <polygon 
          points="115,264 145,212 235,212 205,264" 
          fill="rgba(6, 182, 212, 0.04)" 
          stroke="rgba(6, 182, 212, 0.15)" 
          strokeWidth="1"
        />

        {/* 20%, 40%, 60%, 80% Grid Lines */}
        {[20, 40, 60, 80].map(val => {
          const cY = yOffset + (1 - val/100) * H;
          const cX1 = xOffset + (val/100) * 150;
          const cX2 = xOffset + W - (val/100) * 150;

          const siltX1 = xOffset + (val/100) * W;
          const siltX2 = xOffset + 150 + (val/100) * 150;
          const siltY2 = yOffset + (val/100) * H;

          const sandX1 = xOffset + W - (val/100) * W;
          const sandX2 = xOffset + 150 - (val/100) * 150;
          const sandY2 = yOffset + (val/100) * H;

          return (
            <g key={val}>
              {/* Horizontal Clay Line */}
              <line x1={cX1} y1={cY} x2={cX2} y2={cY} stroke="#334155" strokeDasharray="3 3" opacity={0.3} />
              <text x={cX1 - 6} y={cY + 3} fontSize={7} fill="#475569" textAnchor="end" fontFamily="monospace">{val}%</text>

              {/* Silt Line (parallel to left side) */}
              <line x1={siltX1} y1={yOffset + H} x2={siltX2} y2={siltY2} stroke="#334155" strokeDasharray="3 3" opacity={0.3} />
              <text x={siltX2 + 8} y={siltY2 + 2} fontSize={7} fill="#475569" textAnchor="start" fontFamily="monospace">{val}%</text>

              {/* Sand Line (parallel to right side) */}
              <line x1={sandX1} y1={yOffset + H} x2={sandX2} y2={sandY2} stroke="#334155" strokeDasharray="3 3" opacity={0.3} />
              <text x={sandX2 - 8} y={sandY2 + 2} fontSize={7} fill="#475569" textAnchor="end" fontFamily="monospace">{val}%</text>
            </g>
          );
        })}

        {/* Outer Triangle Outline */}
        <polygon 
          points={`190,${yOffset} ${xOffset + W},${yOffset + H} ${xOffset},${yOffset + H}`} 
          fill="none" 
          stroke="#475569" 
          strokeWidth="1.5" 
        />

        {/* Vertex Labels */}
        <g fontFamily="monospace" fontSize="8" fontWeight="bold">
          {/* Top vertex: Clay */}
          <text x="190" y={yOffset - 10} fill="#f43f5e" textAnchor="middle" className="uppercase">Argile (Clay) 100%</text>
          
          {/* Bottom-left: Sand */}
          <text x={xOffset - 12} y={yOffset + H + 18} fill="#eab308" textAnchor="middle" className="uppercase">Sable (Sand) 100%</text>
          
          {/* Bottom-right: Silt */}
          <text x={xOffset + W + 12} y={yOffset + H + 18} fill="#10b981" textAnchor="middle" className="uppercase">Limon (Silt) 100%</text>
        </g>

        {/* Axis Direction Indicators */}
        {/* Clay axis direction: arrow pointing up along left edge */}
        <path d={`M ${xOffset - 15},${yOffset + H - 20} L ${xOffset - 15},${yOffset + 40}`} stroke="#f43f5e" strokeWidth="1" markerEnd="url(#arrow-clay)" opacity={0.5} />
        {/* Silt axis direction: arrow pointing down along right edge */}
        <path d={`M 190 + 160,${yOffset + 40} L 190 + 160,${yOffset + H - 20}`} stroke="#10b981" strokeWidth="1" markerEnd="url(#arrow-silt)" opacity={0.5} />

        {/* Active Point projections & Cursor */}
        {point && projections && (
          <g>
            {/* Dashed projections to axes */}
            {/* Clay projection (horizontal to left edge) */}
            <line 
              x1={point.x} 
              y1={point.y} 
              x2={projections.clay.x} 
              y2={projections.clay.y} 
              stroke="#f43f5e" 
              strokeDasharray="2 2" 
              strokeWidth="1" 
              opacity={0.8}
            />
            {/* Silt projection (to bottom edge) */}
            <line 
              x1={point.x} 
              y1={point.y} 
              x2={projections.silt.x} 
              y2={projections.silt.y} 
              stroke="#10b981" 
              strokeDasharray="2 2" 
              strokeWidth="1" 
              opacity={0.8}
            />
            {/* Sand projection (to bottom edge) */}
            <line 
              x1={point.x} 
              y1={point.y} 
              x2={projections.sand.x} 
              y2={projections.sand.y} 
              stroke="#eab308" 
              strokeDasharray="2 2" 
              strokeWidth="1" 
              opacity={0.8}
            />

            {/* Glowing radar ring */}
            <circle cx={point.x} cy={point.y} r="8" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${point.x}px ${point.y}px` }} />
            
            {/* Solid Point Cursor */}
            <circle cx={point.x} cy={point.y} r="4" fill="#00f0ff" stroke="#0f172a" strokeWidth="1.5" className="shadow-lg" />
          </g>
        )}
      </svg>

      {/* Dynamic Classification Readout */}
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center font-mono">
        <span className="text-[8px] text-slate-500 block uppercase tracking-wider mb-0.5">Classification Texturale</span>
        <span className={`text-xs font-bold ${isValid ? 'text-teal-400' : 'text-slate-550'}`}>
          {classification}
        </span>
      </div>
    </div>
  );
}
