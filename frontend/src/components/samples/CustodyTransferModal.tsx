import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

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

interface CustodyTransferModalProps {
  sample: Sample;
  fromPerson: string;
  onClose: () => void;
  onSubmit: (signature: string, toPerson: string, notes: string) => void;
  isSubmitting: boolean;
}

export default function CustodyTransferModal({
  sample,
  fromPerson,
  onClose,
  onSubmit,
  isSubmitting
}: CustodyTransferModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [toPerson, setToPerson] = useState('');
  const [notes, setNotes] = useState('');

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
    onSubmit(signatureBase64, toPerson, notes);
  };

  return (
    <div className="fixed inset-0 bg-slate-955/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="font-extrabold text-white text-sm tracking-wide font-mono">TRANSFERT DE GARDE : {sample.code}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Chaîne de garde - Traçabilité de garde ISO 17025</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remis Par (From) :</label>
              <input
                type="text"
                disabled
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md font-bold text-slate-500 outline-none"
                value={fromPerson}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reçu Par (To) * :</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md font-bold text-slate-200 outline-none focus:border-cyan-500 transition-colors"
                placeholder="Technicien destinataire"
                value={toPerson}
                onChange={(e) => setToPerson(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Notes / Raison du Transfert :</label>
            <textarea
              className="w-full h-16 p-3 bg-slate-950 border border-slate-700 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              placeholder="Ex: Transfert d'échantillon à l'équipe microbiologie pour inoculation."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Signature du Récipiendaire (Pad) :</label>
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
              disabled={isSubmitting || !toPerson.trim()}
              className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-md transition-all cursor-pointer border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'TRANSFERT...' : 'VALIDER TRANSFERT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
