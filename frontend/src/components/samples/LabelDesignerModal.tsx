import { useState } from 'react';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
}

interface LabelDesignerModalProps {
  sample: Sample;
  ghsSymbols: string[];
  onGhsToggle: (id: string) => void;
  onClose: () => void;
}

export const GHS_PICTOGRAMS = [
  { id: 'ghs02', label: 'Inflammable', symbol: '🔥', class: 'border-red-400 text-red-650 bg-red-950/20' },
  { id: 'ghs05', label: 'Corrosif', symbol: '🧪', class: 'border-orange-400 text-orange-655 bg-orange-950/20' },
  { id: 'ghs06', label: 'Toxique', symbol: '💀', class: 'border-slate-400 text-slate-300 bg-slate-950/20' },
  { id: 'ghs07', label: 'Irritant', symbol: '⚠️', class: 'border-amber-400 text-amber-600 bg-amber-950/20' },
  { id: 'ghs08', label: 'Danger Santé', symbol: '👤', class: 'border-indigo-400 text-indigo-350 bg-indigo-950/20' },
  { id: 'ghs09', label: 'Environnement', symbol: '🐟', class: 'border-emerald-400 text-emerald-600 bg-emerald-950/20' }
];

export default function LabelDesignerModal({
  sample,
  ghsSymbols,
  onGhsToggle,
  onClose
}: LabelDesignerModalProps) {
  const [labelSize, setLabelSize] = useState<'standard' | 'thermal'>('standard');
  const [includeQr, setIncludeQr] = useState(true);

  const isThermal = labelSize === 'thermal';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2 tracking-wide font-mono">
              <Printer className="w-5 h-5 text-cyan-400 animate-pulse" />
              CONCEPTEUR D'ÉTIQUETTES
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Personnalisez les pictogrammes de sécurité SGH avant impression</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Select & QR Switcher */}
        <div className="flex flex-wrap gap-4 items-center mb-5 justify-between">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLabelSize('standard')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                !isThermal ? 'bg-cyan-550 text-white bg-cyan-600 shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard (80x50mm)
            </button>
            <button
              onClick={() => setLabelSize('thermal')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                isThermal ? 'bg-cyan-550 text-white bg-cyan-600 shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Thermique (50x30mm)
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeQr}
              onChange={(e) => setIncludeQr(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-500 border-slate-750 bg-slate-950 w-4 h-4 cursor-pointer accent-cyan-500"
            />
            <span className="text-xs font-bold text-slate-300 font-mono">Inclure Code QR</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 font-mono">Pictogrammes de Danger SGH</label>
            <div className="grid grid-cols-2 gap-2">
              {GHS_PICTOGRAMS.map(sym => {
                const active = ghsSymbols.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    onClick={() => onGhsToggle(sym.id)}
                    className={`p-2.5 border rounded-md text-left transition-all cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'border-red-500 bg-red-950/20 text-white font-extrabold shadow-lg shadow-red-500/10 scale-[1.02]'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl">{sym.symbol}</span>
                    <span className="text-[10px] font-bold leading-tight font-mono">{sym.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-rose-950/20 border border-rose-900/30 rounded-md text-rose-300 text-[10px] leading-relaxed font-semibold font-mono">
              ⚠️ Les pictogrammes sélectionnés ci-dessus seront reportés sur l'étiquette pour la conformité réglementaire ISO 17025.
            </div>
          </div>

          {/* Label Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Aperçu Avant Impression</span>
            
            {/* Sticker Label Container */}
            <div 
              id="printable-sticker-label"
              className={`bg-white border-2 border-slate-950 text-left relative overflow-hidden flex gap-3 text-black ${
                isThermal 
                  ? 'w-[189px] h-[113px] p-2' 
                  : 'w-[280px] h-[160px] p-4 rounded-lg shadow'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              {/* QR Code */}
              {includeQr && (
                <div className="shrink-0 flex items-center justify-center">
                  <QRCodeSVG 
                    value={`http://localhost:5173/tracking/${sample.code}`}
                    size={isThermal ? 42 : 90}
                    level="H"
                  />
                </div>
              )}

              {/* Specs */}
              <div className="flex-1 flex flex-col justify-between min-w-0 specs-container text-black">
                <div>
                  <div className={`font-extrabold text-black border-b border-black pb-0.5 truncate label-code ${isThermal ? 'text-[9px]' : 'text-sm'}`}>
                    {sample.code}
                  </div>
                  <div className={`font-bold text-black truncate label-detail ${isThermal ? 'text-[6px] mt-0.5' : 'text-[8px] mt-1'}`}>
                    Type: {sample.type}
                  </div>
                  <div className={`font-bold text-black truncate label-detail ${isThermal ? 'text-[6px]' : 'text-[8px]'}`}>
                    Date: {new Date(sample.created_at).toLocaleDateString()}
                  </div>
                  {sample.volume && (
                    <div className={`font-bold text-black truncate label-detail ${isThermal ? 'text-[6px]' : 'text-[8px]'}`}>
                      Vol: {sample.volume}
                    </div>
                  )}
                  {sample.storage_location && (
                    <div className={`font-bold text-black truncate label-detail ${isThermal ? 'text-[6px]' : 'text-[8px]'}`}>
                      Loc: {sample.storage_location}
                    </div>
                  )}
                </div>

                {/* Selected GHS Symbols Row */}
                <div className="flex gap-1 mt-1 overflow-x-hidden ghs-row">
                  {GHS_PICTOGRAMS.filter(s => ghsSymbols.includes(s.id)).map(s => (
                    <span 
                      key={s.id} 
                      className={`inline-flex items-center justify-center rounded border border-black bg-white font-bold text-black ghs-symbol ${
                        isThermal ? 'w-3.5 h-3.5 text-[8px]' : 'w-5.5 h-5.5 text-xs'
                      }`}
                    >
                      {s.symbol}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Lab Certification Stamp */}
              <div className={`absolute top-0 right-0 bg-black text-white font-bold px-1.5 py-0.5 rounded-bl uppercase tracking-widest scale-75 origin-top-right lims-stamp ${
                isThermal ? 'text-[4px]' : 'text-[6px]'
              }`}>
                LIMS CERTIFIED
              </div>
            </div>
            
            <button 
              onClick={() => {
                const element = document.getElementById('printable-sticker-label');
                if (element) {
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'fixed';
                  iframe.style.right = '0';
                  iframe.style.bottom = '0';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = '0';
                  document.body.appendChild(iframe);

                  const doc = iframe.contentWindow?.document;
                  if (doc) {
                    doc.open();
                    doc.write(`
                      <html>
                        <head>
                          <title>Imprimer Étiquette LIMS</title>
                          <style>
                            @page {
                              size: ${isThermal ? '50mm 30mm' : '80mm 50mm'};
                              margin: 0;
                            }
                            body {
                              margin: 0;
                              padding: 0;
                              background: white;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              height: 100vh;
                              width: 100vw;
                            }
                            #printable-sticker-label {
                              border: 1px solid #000000 !important;
                              box-sizing: border-box !important;
                              background: white !important;
                              color: black !important;
                              display: flex !important;
                              flex-direction: row !important;
                              font-family: monospace !important;
                              width: ${isThermal ? '50mm' : '80mm'} !important;
                              height: ${isThermal ? '30mm' : '50mm'} !important;
                              padding: ${isThermal ? '5px' : '15px'} !important;
                              gap: ${isThermal ? '5px' : '12px'} !important;
                              position: relative !important;
                              overflow: hidden !important;
                            }
                            svg {
                              display: block;
                            }
                            .specs-container {
                              display: flex;
                              flex-direction: column;
                              justify-content: space-between;
                              flex-grow: 1;
                              min-width: 0;
                            }
                            .label-code {
                              font-weight: bold;
                              border-bottom: 1px solid black;
                              padding-bottom: 2px;
                              font-size: ${isThermal ? '9px' : '14px'};
                              white-space: nowrap;
                              overflow: hidden;
                              text-overflow: ellipsis;
                            }
                            .label-detail {
                              font-size: ${isThermal ? '6px' : '8px'};
                              margin-top: ${isThermal ? '1px' : '2px'};
                              white-space: nowrap;
                              overflow: hidden;
                              text-overflow: ellipsis;
                            }
                            .ghs-row {
                              display: flex;
                              gap: 4px;
                              margin-top: 4px;
                            }
                            .ghs-symbol {
                              display: inline-flex;
                              align-items: center;
                              justify-content: center;
                              border: 1px solid black;
                              border-radius: 2px;
                              width: ${isThermal ? '14px' : '22px'};
                              height: ${isThermal ? '14px' : '22px'};
                              font-size: ${isThermal ? '8px' : '12px'};
                              font-weight: bold;
                            }
                            .lims-stamp {
                              position: absolute;
                              top: 0;
                              right: 0;
                              background: black;
                              color: white;
                              font-weight: bold;
                              text-transform: uppercase;
                              letter-spacing: 0.1em;
                              transform: scale(0.75);
                              transform-origin: top right;
                              font-size: ${isThermal ? '4px' : '6px'};
                              padding: ${isThermal ? '1px 3px' : '2px 6px'};
                            }
                          </style>
                        </head>
                        <body>
                          ${element.outerHTML}
                        </body>
                      </html>
                    `);
                    doc.close();

                    setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 1000);
                    }, 250);
                  }
                }
              }}
              className="w-full mt-4 py-2.5 bg-cyan-600 text-white text-xs font-bold rounded-md hover:bg-cyan-555 transition-colors shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5 font-mono border border-cyan-500/30"
            >
              <Printer className="w-4 h-4" />
              IMPRIMER L'ÉTIQUETTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
