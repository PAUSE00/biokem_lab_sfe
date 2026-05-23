
export interface GlassIllustrationProps {
  status: 'Reçu' | 'En cours' | 'Terminé' | 'Anomalie';
}

export const getLiquidColor = (status: string) => {
  switch (status) {
    case 'Reçu': return '#a3e6e6';      // Brand Cyan
    case 'En cours': return '#c9df25';  // Brand Lime
    case 'Terminé': return '#1f2223';   // Brand Charcoal
    case 'Anomalie': return '#e4a8c5';  // Brand Pink
    default: return '#cbd5e1';
  }
};

// 1. Reagent Bottle / Vial SVG (Chemicals / Oil / Others)
export function ReagentBottleSVG({ status }: GlassIllustrationProps) {
  const liquidColor = getLiquidColor(status);
  const isEnCours = status === 'En cours';
  const isAnomalie = status === 'Anomalie';

  return (
    <svg width="100%" height="100%" viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <style>{`
        @keyframes rise-bubble-1 {
          0% { transform: translateY(0px) scale(0.7); opacity: 0; }
          20% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-28px) scale(1.1); opacity: 0; }
        }
        @keyframes liquid-pulse-bottle {
          0%, 100% { fill-opacity: 0.75; }
          50% { fill-opacity: 0.95; }
        }
        .bottle-liquid {
          animation: ${isEnCours ? 'liquid-pulse-bottle 2s infinite ease-in-out' : 'none'};
          transition: fill 0.5s ease;
        }
        .bottle-bubble-1 {
          animation: rise-bubble-1 2.8s infinite ease-in;
          transform-origin: 30px 85px;
        }
        .bottle-bubble-2 {
          animation: rise-bubble-1 2.2s infinite ease-in;
          animation-delay: 0.9s;
          transform-origin: 40px 80px;
        }
        .bottle-bubble-3 {
          animation: rise-bubble-1 3.4s infinite ease-in;
          animation-delay: 1.6s;
          transform-origin: 22px 90px;
        }
      `}</style>
      {/* Cap */}
      <rect x="20" y="5" width="30" height="12" rx="4" fill="#64748b" />
      <rect x="18" y="10" width="34" height="4" rx="1" fill="#475569" />
      {/* Neck */}
      <rect x="25" y="17" width="20" height="10" fill="none" stroke="#94a3b8" strokeWidth="4" />
      {/* Glass Body */}
      <rect x="10" y="27" width="50" height="75" rx="16" fill="rgba(255,255,255,0.7)" stroke="#94a3b8" strokeWidth="4" />
      
      {/* Liquid Content */}
      <rect x="14" y="52" width="42" height="46" rx="8" fill={liquidColor} className="bottle-liquid" />
      
      {/* Dynamic Rising Bubbles inside Liquid */}
      {(isEnCours || isAnomalie) && (
        <g>
          <circle cx="30" cy="85" r="2" fill="white" className="bottle-bubble-1" />
          <circle cx="40" cy="80" r="1.5" fill="white" className="bottle-bubble-2" />
          <circle cx="22" cy="90" r="2.5" fill="white" className="bottle-bubble-3" />
        </g>
      )}

      {/* Glass Reflections / Highlights */}
      <path d="M16 35 C 16 35, 20 31, 28 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="45" x2="16" y2="92" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Label outline */}
      <rect x="20" y="58" width="30" height="24" rx="2" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="24" y1="65" x2="46" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="24" y1="70" x2="40" y2="70" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

// 2. Graduated Test Tube SVG (Water / Liquids)
export function TestTubeSVG({ status }: GlassIllustrationProps) {
  const liquidColor = getLiquidColor(status);
  const isEnCours = status === 'En cours';
  const isAnomalie = status === 'Anomalie';

  return (
    <svg width="100%" height="100%" viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <style>{`
        @keyframes tube-wave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(1px) scaleY(0.97); }
        }
        @keyframes rise-bubble-tube {
          0% { transform: translateY(0px) scale(0.6); opacity: 0; }
          30% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-24px) scale(1.1); opacity: 0; }
        }
        .tube-liquid {
          animation: ${isEnCours ? 'tube-wave 2.5s infinite ease-in-out' : 'none'};
          transform-origin: bottom center;
          transition: fill 0.5s ease;
        }
        .tube-bubble-1 {
          animation: rise-bubble-tube 2.2s infinite ease-in;
          transform-origin: 33px 75px;
        }
        .tube-bubble-2 {
          animation: rise-bubble-tube 1.8s infinite ease-in;
          animation-delay: 0.7s;
          transform-origin: 36px 70px;
        }
      `}</style>
      {/* Rack Holder base */}
      <line x1="10" y1="100" x2="60" y2="100" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
      <rect x="23" y="90" width="24" height="10" fill="#e2e8f0" />
      {/* Test tube cap / rim */}
      <rect x="26" y="5" width="18" height="6" rx="3" fill="#64748b" />
      {/* Tube body */}
      <path d="M29 11 L41 11 L41 85 C41 91, 29 91, 29 85 Z" fill="rgba(255,255,255,0.7)" stroke="#94a3b8" strokeWidth="4" />
      
      {/* Liquid Content */}
      <path d="M33 45 L37 45 L37 83 C37 86, 33 86, 33 83 Z" fill={liquidColor} className="tube-liquid" />
      
      {/* Measurement Ticks */}
      <line x1="38" y1="25" x2="33" y2="25" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="38" y1="35" x2="35" y2="35" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="38" y1="45" x2="33" y2="45" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="38" y1="55" x2="35" y2="55" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="38" y1="65" x2="33" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
      
      {/* Dynamic bubbles */}
      {(isEnCours || isAnomalie) && (
        <g>
          <circle cx="33" cy="75" r="1" fill="white" className="tube-bubble-1" />
          <circle cx="36" cy="70" r="0.8" fill="white" className="tube-bubble-2" />
        </g>
      )}

      {/* Glass reflections */}
      <line x1="32" y1="15" x2="32" y2="78" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    </svg>
  );
}

// 3. Petri Dish SVG (Soil / Earth / Food / Incubation)
export function PetriDishSVG({ status }: GlassIllustrationProps) {
  const liquidColor = getLiquidColor(status);
  const isEnCours = status === 'En cours';
  const isAnomalie = status === 'Anomalie';

  return (
    <svg width="100%" height="100%" viewBox="0 0 85 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <style>{`
        @keyframes colony-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.95; }
        }
        .petri-colony-1 {
          animation: colony-pulse 2.2s infinite ease-in-out;
          transform-origin: 35px 68px;
        }
        .petri-colony-2 {
          animation: colony-pulse 2.8s infinite ease-in-out;
          animation-delay: 0.5s;
          transform-origin: 48px 73px;
        }
        .petri-colony-3 {
          animation: colony-pulse 1.8s infinite ease-in-out;
          animation-delay: 1.1s;
          transform-origin: 40px 71px;
        }
      `}</style>
      {/* Base dish rim */}
      <ellipse cx="42" cy="70" rx="36" ry="18" fill="rgba(255,255,255,0.6)" stroke="#94a3b8" strokeWidth="3" />
      {/* Inner dish content (agar/liquid) */}
      <ellipse cx="42" cy="71" rx="32" ry="14" fill={liquidColor} fillOpacity="0.75" />
      
      {/* Animated Colonies / Culture growth */}
      {(isEnCours || isAnomalie) && (
        <g>
          <circle cx="35" cy="68" r="3.5" fill={isAnomalie ? '#9e2760' : 'white'} fillOpacity="0.8" className="petri-colony-1" />
          <circle cx="48" cy="73" r="2" fill={isAnomalie ? '#9e2760' : 'white'} fillOpacity="0.8" className="petri-colony-2" />
          <circle cx="40" cy="71" r="1.5" fill={isAnomalie ? '#9e2760' : 'white'} fillOpacity="0.8" className="petri-colony-3" />
        </g>
      )}

      {/* Glass Lid rim (tilted upward slightly for 3D effect) */}
      <ellipse cx="42" cy="55" rx="38" ry="19" fill="rgba(255,255,255,0.4)" stroke="#cbd5e1" strokeWidth="2" />
      {/* Lid reflections */}
      <path d="M12 50 C 12 50, 22 40, 42 40" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="42" cy="70" rx="20" ry="8" stroke="white" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
    </svg>
  );
}

export const renderIllustration = (type: string, status: 'Reçu' | 'En cours' | 'Terminé' | 'Anomalie') => {
  switch (type) {
    case 'Eau Potable':
    case 'Eau Résiduaire':
      return <TestTubeSVG status={status} />;
    case 'Sol / Terre':
    case 'Alimentaire':
      return <PetriDishSVG status={status} />;
    case 'Produit Chimique':
    case 'Hydrocarbure':
    case 'Autre':
    default:
      return <ReagentBottleSVG status={status} />;
  }
};
