import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface Deviation {
  id: number;
  type: string;
  actual_value: string;
  expected_limit: string;
  status: string;
  created_at: string;
}

interface ResolveDeviationModalProps {
  deviation: Deviation;
  onClose: () => void;
  onSubmit: (signature: string, comments: string) => void;
  isSubmitting: boolean;
}

export default function ResolveDeviationModal({
  deviation,
  onClose,
  onSubmit,
  isSubmitting
}: ResolveDeviationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [comments, setComments] = useState('');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#090d16'; // dark signature ink

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureBase64 = canvas.toDataURL();
    onSubmit(signatureBase64, comments);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="font-extrabold text-white text-sm tracking-wide font-mono">EXCURSION DE TEMPÉRATURE</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Validation de conformité et action corrective ISO 17025</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-md space-y-1.5 text-xs text-rose-350 font-bold font-mono">
            <div>Type de déviation : <span className="text-slate-200 uppercase">{deviation.type}</span></div>
            <div>Valeur mesurée : <span className="text-slate-200">{deviation.actual_value}</span></div>
            <div>Limite requise : <span className="text-slate-200">{deviation.expected_limit}</span></div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Commentaires / Action Corrective :</label>
            <textarea
              className="w-full h-20 p-3 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              placeholder="Ex: Échantillon maintenu au froid de transport. Pas de dégradation constatée. Validation qualité accordée."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Signature Électronique (Pad) :</label>
              <button 
                type="button" 
                onClick={clearCanvas} 
                className="text-[10px] font-bold uppercase text-rose-455 hover:text-rose-400 underline font-mono cursor-pointer"
              >
                Effacer
              </button>
            </div>
            
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-950 shadow-inner">
              <canvas
                ref={canvasRef}
                width="380"
                height="120"
                className="cursor-crosshair w-full block bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-700 text-slate-400 text-xs font-mono font-bold rounded-md hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
            >
              ANNULER
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-md transition-all cursor-pointer border border-emerald-500/30"
            >
              {isSubmitting ? 'VALIDATION...' : 'VALIDER SIGNATURE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
