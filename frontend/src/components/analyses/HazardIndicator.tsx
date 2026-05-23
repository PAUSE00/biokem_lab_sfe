import React from 'react';

export function GHS05Corrosive() {
  return (
    <svg className="w-10 h-10 shrink-0 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.15)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 95,50 50,95 5,50" fill="white" stroke="#ef4444" strokeWidth="6" />
      {/* Tubes pouring onto surface */}
      <path d="M 30,32 L 44,46 M 34,28 L 48,42" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 70,32 L 56,46 M 66,28 L 52,42" stroke="black" strokeWidth="3.5" strokeLinecap="round" />
      {/* Pouring drops */}
      <circle cx="47" cy="51" r="1.5" fill="black" />
      <circle cx="53" cy="51" r="1.5" fill="black" />
      {/* Hand & Metal surface */}
      <path d="M 38,62 Q 50,65 62,62 L 62,70 Q 50,73 38,70 Z" fill="black" />
      <path d="M 46,62 L 48,55 L 52,55 L 54,62" stroke="black" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function GHS07Harmful() {
  return (
    <svg className="w-10 h-10 shrink-0 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.15)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 95,50 50,95 5,50" fill="white" stroke="#ef4444" strokeWidth="6" />
      {/* Exclamation point */}
      <path d="M 50,23 L 50,55" stroke="black" strokeWidth="9" strokeLinecap="round" />
      <circle cx="50" cy="71" r="6" fill="black" />
    </svg>
  );
}

export function GHS09Environmental() {
  return (
    <svg className="w-10 h-10 shrink-0 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.15)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 95,50 50,95 5,50" fill="white" stroke="#ef4444" strokeWidth="6" />
      {/* Tree bare branches */}
      <path d="M 33,68 Q 38,55 38,40 M 38,40 L 30,34 M 38,45 L 32,42 M 38,40 L 44,34 M 38,48 L 45,46" stroke="black" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Fish skeleton/silhouette */}
      <path d="M 44,66 Q 54,61 64,66 L 68,59 L 68,73 Z" fill="black" />
      <line x1="44" y1="66" x2="64" y2="66" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function renderGHSPictogram(code: string): React.ReactNode {
  switch (code) {
    case 'GHS05': return <GHS05Corrosive />;
    case 'GHS07': return <GHS07Harmful />;
    case 'GHS09': return <GHS09Environmental />;
    default:      return null;
  }
}
