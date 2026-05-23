import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface StorageMapPickerProps {
  currentLocation: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
  existingLocations: string[];
}

export default function StorageMapPicker({
  currentLocation,
  onSelect,
  onClose,
  existingLocations
}: StorageMapPickerProps) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];
  
  const [selectedBox, setSelectedBox] = useState('Congélateur Cryogénique A');

  const parseLocation = (loc: string) => {
    if (!loc) return { row: '', col: null };
    const rowMatch = loc.match(/Ligne ([A-F])/);
    const colMatch = loc.match(/Colonne ([1-8])/);
    return {
      row: rowMatch ? rowMatch[1] : '',
      col: colMatch ? parseInt(colMatch[1]) : null
    };
  };

  const currentSelection = parseLocation(currentLocation);

  const getOccupancyKey = (row: string, col: number) => {
    return `${selectedBox} - Colonne ${col}, Ligne ${row}`;
  };

  const isOccupied = (row: string, col: number) => {
    const key = getOccupancyKey(row, col);
    return existingLocations.includes(key);
  };

  const totalSlots = rows.length * cols.length;
  const occupiedCount = rows.reduce((sum, row) => 
    sum + cols.filter(col => isOccupied(row, col)).length, 0
  );
  const occupancyRate = Math.round((occupiedCount / totalSlots) * 100);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden p-6 animate-in zoom-in-95 duration-200 shadow-cyan-950/20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2 tracking-wide font-mono">
              <MapPin className="w-5 h-5 text-cyan-400 animate-pulse" />
              SÉLECTEUR DE STOCKAGE 2D
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Visualisez et réservez une place dans les racks cryogéniques</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5">Unité de Stockage Cryogénique</label>
          <select
            value={selectedBox}
            onChange={(e) => setSelectedBox(e.target.value)}
            className="w-full px-4 py-2 border border-slate-700 rounded-md text-xs font-mono text-slate-200 bg-slate-950 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="Congélateur Cryogénique A">Congélateur Cryogénique A (-80°C)</option>
            <option value="Réfrigérateur Labo B">Réfrigérateur Labo B (+4°C)</option>
            <option value="Étuve Incubation C">Étuve Incubation C (+37°C)</option>
            <option value="Armoire Solvants D">Armoire Solvants D (Temp. Ambiante)</option>
          </select>
        </div>

        {/* Occupancy HUD */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 mb-5 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-800 rounded-sm border border-slate-700"></span> Occupé ({occupiedCount})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-950/20 border border-cyan-500/30 rounded-sm"></span> Libre ({totalSlots - occupiedCount})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Sélectionné</span>
          </div>
          <div className="font-mono text-slate-300">
            Taux d'occupation : <span className={occupancyRate > 80 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-cyan-400 font-bold'}>{occupancyRate}%</span>
          </div>
        </div>

        {/* 2D Grid Layout */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 shadow-inner flex flex-col items-center">
          <div className="grid grid-cols-9 gap-2 w-full text-center">
            {/* Corner header */}
            <div className="text-slate-600 text-[10px] font-black font-mono self-center">RANG</div>
            {cols.map(c => (
              <div key={c} className="text-slate-500 text-[10px] font-bold font-mono">C{c}</div>
            ))}

            {rows.map(row => (
              <React.Fragment key={row}>
                <div className="text-slate-500 font-bold font-mono self-center text-xs">{row}</div>
                {cols.map(col => {
                  const occupied = isOccupied(row, col);
                  const isCurrent = currentSelection.row === row && currentSelection.col === col;
                  
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      disabled={occupied}
                      onClick={() => onSelect(getOccupancyKey(row, col))}
                      className={`h-9 rounded-md border text-[10px] font-extrabold transition-all cursor-pointer font-mono ${
                        isCurrent
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-105'
                          : occupied
                          ? 'bg-slate-900 border-slate-800 text-slate-650 cursor-not-allowed text-slate-600'
                          : 'bg-slate-950 border-cyan-500/10 text-cyan-400 hover:border-cyan-500 hover:bg-cyan-950/20'
                      }`}
                    >
                      {row}{col}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-md text-xs font-bold hover:text-white transition-all font-mono border border-slate-700"
          >
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}
