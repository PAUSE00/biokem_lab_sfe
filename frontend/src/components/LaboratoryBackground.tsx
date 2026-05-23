export default function LaboratoryBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Scientific grid paper pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.08) 1px, transparent 0),
            linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 0),
            linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 0)
          `,
          backgroundSize: '16px 16px, 80px 80px, 80px 80px',
        }}
      />

      {/* 2. SVG Programmatic Molecule Network & Benzene Rings */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Subtle glow effect */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Benzene Ring Template */}
          <g id="benzene-ring" className="text-indigo-500/10 stroke-current" strokeWidth="1.5" fill="none">
            {/* Hexagon */}
            <polygon points="100,50 143,75 143,125 100,150 57,125 57,75" />
            {/* Double bonds */}
            <line x1="97" y1="58" x2="134" y2="80" />
            <line x1="137" y1="120" x2="100" y2="141" />
            <line x1="63" y1="120" x2="63" y2="80" />
            {/* Outer atom connections */}
            <line x1="100" y1="50" x2="100" y2="25" />
            <line x1="143" y1="75" x2="165" y2="62" />
            <line x1="143" y1="125" x2="165" y2="138" />
            <line x1="100" y1="150" x2="100" y2="175" />
            <line x1="57" y1="125" x2="35" y2="138" />
            <line x1="57" y1="75" x2="35" y2="62" />
            {/* Carbon Atoms (Nodes) */}
            <circle cx="100" cy="50" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
            <circle cx="143" cy="75" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
            <circle cx="143" cy="125" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
            <circle cx="100" cy="150" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
            <circle cx="57" cy="125" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
            <circle cx="57" cy="75" r="4" className="fill-indigo-500/20 stroke-indigo-500/30" strokeWidth="1" />
          </g>

          {/* Simple Water/Salt Molecule Template */}
          <g id="molecule-water" className="text-sky-500/15 stroke-current" strokeWidth="1.2" fill="none">
            <line x1="50" y1="50" x2="20" y2="80" />
            <line x1="50" y1="50" x2="80" y2="80" />
            <circle cx="50" cy="50" r="8" className="fill-sky-500/10 stroke-sky-500/25" strokeWidth="1.5" />
            <circle cx="20" cy="80" r="5" className="fill-sky-500/5 stroke-sky-500/20" />
            <circle cx="80" cy="80" r="5" className="fill-sky-500/5 stroke-sky-500/20" />
          </g>
        </defs>

        {/* 3. Programmatic layout placement & float animations */}
        <style>{`
          @keyframes float-slow-1 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
          @keyframes float-slow-2 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(12px) rotate(-8deg); }
          }
          @keyframes pulse-soft {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.3; }
          }
          .anim-float-1 { animation: float-slow-1 25s ease-in-out infinite; transform-origin: center; }
          .anim-float-2 { animation: float-slow-2 30s ease-in-out infinite; transform-origin: center; }
          .anim-pulse-soft { animation: pulse-soft 8s ease-in-out infinite; }
        `}</style>

        {/* Top-Right Cluster */}
        <g className="anim-float-1" style={{ transform: 'translate(85%, 10%) scale(0.95)' }}>
          <use href="#benzene-ring" />
          <line x1="85%" y1="10%" x2="78%" y2="25%" className="stroke-indigo-500/5" strokeWidth="1" strokeDasharray="3,3" />
        </g>

        {/* Center-Left Cluster */}
        <g className="anim-float-2" style={{ transform: 'translate(5%, 45%) scale(1.1)' }}>
          <use href="#benzene-ring" />
          <use href="#molecule-water" x="120" y="30" />
        </g>

        {/* Bottom-Right Water/Reagent Cluster */}
        <g className="anim-float-1" style={{ transform: 'translate(80%, 75%) scale(1.2)' }}>
          <use href="#molecule-water" />
          <line x1="-30" y1="30" x2="50" y2="50" className="stroke-sky-500/10" strokeWidth="1" />
          <circle cx="-30" cy="30" r="3" className="fill-sky-500/10 stroke-sky-500/20" />
        </g>

        {/* Light connecting networks on backgrounds */}
        <path 
          d="M 150,150 L 300,180 L 350,300 M 800,200 L 950,220 L 1050,150" 
          className="stroke-indigo-500/5 fill-none" 
          strokeWidth="1" 
          strokeDasharray="4,4" 
        />
        <circle cx="150" cy="150" r="3" className="fill-indigo-500/10" />
        <circle cx="300" cy="180" r="2.5" className="fill-indigo-500/10" />
        <circle cx="350" cy="300" r="3" className="fill-indigo-500/10" />
        <circle cx="800" cy="200" r="3.5" className="fill-indigo-500/10" />
        <circle cx="950" cy="220" r="2" className="fill-indigo-500/10" />
        <circle cx="1050" cy="150" r="3" className="fill-indigo-500/10" />
      </svg>
    </div>
  );
}
