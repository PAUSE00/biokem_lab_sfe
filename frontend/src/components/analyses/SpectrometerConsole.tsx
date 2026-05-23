import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, X, Info, Download, Trash2, FileText, AlertTriangle, CheckCircle2,
  Beaker, TestTube, Plus
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import api from '../../services/api';
import {
  type Analysis, type Hazard, PARAM_CATALOGUE,
  checkValueOutOfRange, getHazards, paramIcon
} from './types';
import { renderGHSPictogram } from './HazardIndicator';
import { RiskGauge } from './VisualGauges';
import ParameterGaugeCard from './ParameterGaugeCard';
import SoilTriangleSVG from './SoilTriangleSVG';

interface SpectrometerConsoleProps {
  activeAnalysis: Analysis | null;
  onClose: () => void;
  onDeleteSuccess: () => Promise<void>;
  onValidateSuccess: () => Promise<void>;
  user: any;
  onScheduleClick: () => void;
}

const SCANNING_LOGS = [
  "INITIALISATION DU SCAN SPECTROMÉTRIQUE COMPLET...",
  "CONNEXION À LA SONDE OPTIQUE DE PRÉCISION... OK",
  "ACQUISITION DE LA DENSITÉ CHIMIQUE DU MÉLANGER... OK",
  "LANCEMENT DU DIAGNOSTIC DE SPECTROPHOTOMÉTRIE (380nm - 780nm)...",
  "COMPOSITION MOLÉCULAIRE DÉTECTÉE AVEC SUCCÈS... OK",
  "IDENTIFICATION DES SEUILS CRITIQUES DANGER GHS... OK",
  "RÉSOLUTION DE L'INDICE DE RISQUE TECHNIQUE... OK",
  "TRANSMISSION DE LA TÉLÉMESURE AU BACKEND LIMS ISO 17025..."
];

export default function SpectrometerConsole({
  activeAnalysis,
  onClose,
  onDeleteSuccess,
  onValidateSuccess,
  user,
  onScheduleClick,
}: SpectrometerConsoleProps) {
  // Chart view tab
  const [chartTab, setChartTab] = useState<'spectrum' | 'comparison' | 'soil_triangle'>('spectrum');

  // Scan simulation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogIndex, setScanLogIndex] = useState(0);

  // Validation form state
  const [resultsForm, setResultsForm] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report preview modal state
  const [previewAnalysis, setPreviewAnalysis] = useState<Analysis | null>(null);

  const isSoilAnalysis = useMemo(() => {
    if (!activeAnalysis) return false;
    const params = activeAnalysis.parameters || [];
    return params.includes('Argile') && params.includes('Limon') && params.includes('Sable');
  }, [activeAnalysis]);

  // Set default parameters form on active analysis change
  useEffect(() => {
    if (activeAnalysis) {
      const params = activeAnalysis.parameters || [];
      const isSoil = params.includes('Argile') && params.includes('Limon') && params.includes('Sable');
      if (isSoil) {
        setChartTab('soil_triangle');
      } else {
        setChartTab('spectrum');
      }
      
      if (activeAnalysis.status !== 'Validé') {
        const init: Record<string, string> = {};
        params.forEach(p => {
          init[p] = '';
        });
        setResultsForm(init);
      } else {
        setResultsForm({});
      }
    } else {
      setResultsForm({});
    }
  }, [activeAnalysis]);

  // Web Audio synthesizer for premium feedback
  const playSound = (type: 'scan' | 'success' | 'anomaly') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'scan') {
        // Sound sweep from 150Hz to 850Hz representing laser scanning
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 1.6);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
        
        // LFO modulation for telemetry effect
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 16;
        lfoGain.gain.value = 0.05;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.6);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        lfo.start();
        
        osc.stop(ctx.currentTime + 1.6);
        lfo.stop(ctx.currentTime + 1.6);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.55);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
      } else if (type === 'success') {
        // Harmonic major chord C5-E5-G5-C6
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          
          gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };
        
        playTone(523.25, 0.0, 0.3); // C5
        playTone(659.25, 0.1, 0.3); // E5
        playTone(783.99, 0.2, 0.3); // G5
        playTone(1046.50, 0.3, 0.5); // C6
      } else if (type === 'anomaly') {
        // Low dissonant warning buzzer
        const playBuzz = (start: number) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = 'sawtooth';
          osc2.type = 'sawtooth';
          
          osc1.frequency.setValueAtTime(120, ctx.currentTime + start);
          osc2.frequency.setValueAtTime(123, ctx.currentTime + start);
          
          gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.35);
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;
          
          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(ctx.currentTime + start);
          osc2.start(ctx.currentTime + start);
          osc1.stop(ctx.currentTime + start + 0.4);
          osc2.stop(ctx.currentTime + start + 0.4);
        };
        
        playBuzz(0.0);
        playBuzz(0.25);
      }
    } catch (e) {
      console.warn("Web Audio failure:", e);
    }
  };

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnalysis) return;

    if (isSoilAnalysis) {
      const clayVal = parseFloat(resultsForm['Argile'] || '0');
      const siltVal = parseFloat(resultsForm['Limon'] || '0');
      const sandVal = parseFloat(resultsForm['Sable'] || '0');
      const total = clayVal + siltVal + sandVal;
      if (Math.abs(total - 100) > 0.01) {
        playSound('anomaly');
        alert(`Erreur de granulométrie : La somme de l'Argile, du Limon et du Sable doit être exactement égale à 100% (actuellement : ${total.toFixed(2)}%).`);
        return;
      }
    }

    setIsScanning(true);
    playSound('scan');
  };

  // Scanning log sequence trigger
  useEffect(() => {
    if (!isScanning) return;
    setScanLogIndex(0);
    const interval = setInterval(() => {
      setScanLogIndex(prev => {
        if (prev >= SCANNING_LOGS.length - 1) {
          clearInterval(interval);
          executeValidationSubmit();
          return prev;
        }
        return prev + 1;
      });
    }, 200); // 1.6 seconds total scan
    return () => clearInterval(interval);
  }, [isScanning]);

  const executeValidationSubmit = async () => {
    if (!activeAnalysis) return;

    if (isSoilAnalysis) {
      const clayVal = parseFloat(resultsForm['Argile'] || '0');
      const siltVal = parseFloat(resultsForm['Limon'] || '0');
      const sandVal = parseFloat(resultsForm['Sable'] || '0');
      const total = clayVal + siltVal + sandVal;
      if (Math.abs(total - 100) > 0.01) {
        playSound('anomaly');
        alert(`Erreur de granulométrie : La somme de l'Argile, du Limon et du Sable doit être exactement égale à 100% (actuellement : ${total.toFixed(2)}%).`);
        setIsScanning(false);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const resultsArray = Object.entries(resultsForm).map(([parameter, value]) => {
        const meta = PARAM_CATALOGUE.find(p => p.key === parameter);
        return {
          parameter,
          value,
          unit: meta?.unit ?? '',
          reference_min: meta?.min ?? null,
          reference_max: meta?.max ?? null,
        };
      });
      await api.post(`/api/analyses/${activeAnalysis.id}/validate`, { results: resultsArray });
      
      // Play premium audio feedback based on risk index
      if (liveRiskScore >= 35) {
        playSound('anomaly');
      } else {
        playSound('success');
      }

      setIsScanning(false);
      setResultsForm({});
      await onValidateSuccess();
    } catch {
      alert('Erreur lors de la validation');
      setIsScanning(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnalysis = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande d'analyse ?")) return;
    try {
      await api.delete(`/api/analyses/${id}`);
      await onDeleteSuccess();
    } catch {
      alert("Erreur lors de la suppression de l'analyse. Vérifiez vos permissions.");
    }
  };

  const handleAutoCalibrate = (preset?: 'clean' | 'chemical' | 'nitrate' | 'soil_clay' | 'soil_sandy' | 'soil_loam') => {
    if (!activeAnalysis) return;
    const newForm: Record<string, string> = {};
    activeAnalysis.parameters.forEach(param => {
      const meta = PARAM_CATALOGUE.find(p => p.key === param);
      if (meta) {
        let value = 0;
        if (preset === 'soil_clay') {
          switch (param) {
            case 'Argile': value = 55.0; break;
            case 'Limon':  value = 25.0; break;
            case 'Sable':  value = 20.0; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'soil_sandy') {
          switch (param) {
            case 'Argile': value = 10.0; break;
            case 'Limon':  value = 5.0; break;
            case 'Sable':  value = 85.0; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'soil_loam') {
          switch (param) {
            case 'Argile': value = 20.0; break;
            case 'Limon':  value = 40.0; break;
            case 'Sable':  value = 40.0; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'clean') {
          switch (param) {
            case 'pH':           value = 7.1 + Math.random() * 0.4; break;
            case 'Turbidité':    value = 0.05 + Math.random() * 0.15; break;
            case 'Conductivité': value = 120 + Math.random() * 80; break;
            case 'Nitrate':      value = 1.0 + Math.random() * 3.5; break;
            case 'Zinc':         value = 0.01 + Math.random() * 0.03; break;
            case 'Température':  value = 15.0 + Math.random() * 3.0; break;
            case 'Argile':       value = 20.0; break;
            case 'Limon':        value = 40.0; break;
            case 'Sable':        value = 40.0; break;
            default:             value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'chemical') {
          switch (param) {
            case 'pH':           value = 2.8 + Math.random() * 0.8; break;
            case 'Turbidité':    value = 1.5 + Math.random() * 1.5; break;
            case 'Conductivité': value = 500 + Math.random() * 200; break;
            case 'Nitrate':      value = 15.0 + Math.random() * 10.0; break;
            case 'Zinc':         value = 3.6 + Math.random() * 1.2; break; // heavy metal anomaly
            case 'Température':  value = 17.0 + Math.random() * 4.0; break;
            case 'Argile':       value = 45.0; break;
            case 'Limon':        value = 45.0; break;
            case 'Sable':        value = 10.0; break;
            default:             value = meta.max + Math.random() * 2;
          }
        } else if (preset === 'nitrate') {
          switch (param) {
            case 'pH':           value = 6.4 + Math.random() * 0.8; break;
            case 'Turbidité':    value = 4.2 + Math.random() * 1.8; break;
            case 'Conductivité': value = 850 + Math.random() * 250; break;
            case 'Nitrate':      value = 55.0 + Math.random() * 20.0; break; // critical nitrate
            case 'Zinc':         value = 0.1 + Math.random() * 0.4; break;
            case 'Température':  value = 14.0 + Math.random() * 4.0; break;
            case 'Argile':       value = 15.0; break;
            case 'Limon':        value = 65.0; break;
            case 'Sable':        value = 20.0; break;
            default:             value = meta.max + Math.random() * 3;
          }
        } else {
          const randomFactor = Math.random();
          if (randomFactor > 0.85) {
            const isLow = Math.random() > 0.5;
            if (isLow) {
              value = meta.min - (Math.random() * (meta.min * 0.15) + 0.1);
            } else {
              value = meta.max + (Math.random() * (meta.max * 0.15) + 0.1);
            }
          } else {
            value = meta.min + Math.random() * (meta.max - meta.min);
          }
        }
        newForm[param] = value.toFixed(2);
      } else {
        newForm[param] = (Math.random() * 10).toFixed(2);
      }
    });
    setResultsForm(newForm);
  };

  const handleDownloadPDF = async (analysis: Analysis) => {
    try {
      const response = await api.get(`/api/reports/${analysis.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_Analyse_AN-${analysis.id.toString().padStart(4, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  /* ── Calculations & Memos ─────────────────────────────────────────────── */
  const liveRiskScore = useMemo(() => {
    if (!activeAnalysis) return 0;
    let score = 0;
    activeAnalysis.parameters.forEach(param => {
      const valStr = resultsForm[param];
      if (!valStr || isNaN(parseFloat(valStr))) return;
      const value = parseFloat(valStr);
      const meta = PARAM_CATALOGUE.find(p => p.key === param);
      
      let isAnomaly = false;
      if (meta) {
        if (value < meta.min || value > meta.max) {
          isAnomaly = true;
        }
      }
      
      if (isAnomaly) {
        const paramName = param.toLowerCase();
        if (paramName.includes('ph')) {
          score += (value < 4.0 || value > 10.0) ? 50 : 30;
        } else if (paramName.includes('zinc') || paramName.includes('zn')) {
          score += 40;
        } else if (paramName.includes('turbid')) {
          score += 20;
        } else if (paramName.includes('nitrate') || paramName.includes('no3')) {
          score += 35;
        } else if (paramName.includes('temp')) {
          score += 10;
        } else if (paramName.includes('conductiv')) {
          score += 15;
        } else {
          score += 15;
        }
      }
    });
    return Math.min(score, 100);
  }, [resultsForm, activeAnalysis]);

  const spectrographData = useMemo(() => {
    if (!activeAnalysis) return [];
    const results = activeAnalysis.results || [];
    const hasResults = results.length > 0;

    const getVal = (param: string) => {
      if (hasResults) {
        return parseFloat(results.find(r => r.parameter === param)?.value || '0');
      }
      return parseFloat(resultsForm[param] || '0');
    };

    const phVal = getVal('pH') || 7.0;
    const turbidityVal = getVal('Turbidité') || 0;
    const conductivityVal = getVal('Conductivité') || 0;
    const nitrateVal = getVal('Nitrate') || 0;
    const zincVal = getVal('Zinc') || 0;
    const tempVal = getVal('Température') || 20.0;

    const data = [];
    for (let wl = 400; wl <= 700; wl += 10) {
      let base = 0.04 + ((700 - wl) / 300) * 0.04;
      let scattering = (turbidityVal / 5.0) * 0.22;
      
      let pHPeak = 0;
      if (phVal < 7) {
        pHPeak = Math.exp(-Math.pow(wl - 440, 2) / 600) * (((7 - phVal) / 7) * 0.35);
      } else {
        pHPeak = Math.exp(-Math.pow(wl - 590, 2) / 800) * (((phVal - 7) / 7) * 0.45);
      }
      
      let nitratePeak = 0;
      if (nitrateVal > 0) {
        nitratePeak = Math.exp(-Math.pow(wl - 510, 2) / 500) * (nitrateVal / 50.0) * 0.55;
      }

      let zincPeak = 0;
      if (zincVal > 0) {
        zincPeak = Math.exp(-Math.pow(wl - 630, 2) / 700) * (zincVal / 3.0) * 0.7;
      }

      let conductivityRipple = 0;
      if (conductivityVal > 0) {
        conductivityRipple = Math.sin(wl * 0.3) * (conductivityVal / 1000) * 0.015;
      }

      let tempVibration = Math.sin(wl * 0.6) * (tempVal / 25.0) * 0.004;

      let totalAbsorbance = base + scattering + pHPeak + nitratePeak + zincPeak + conductivityRipple + tempVibration;
      totalAbsorbance = Math.max(0.005, totalAbsorbance);

      data.push({
        wavelength: `${wl}nm`,
        absorbance: parseFloat(totalAbsorbance.toFixed(3)),
      });
    }
    return data;
  }, [activeAnalysis, resultsForm]);

  const thresholdData = useMemo(() => {
    if (!activeAnalysis) return [];
    const results = activeAnalysis.results || [];
    const sourceParameters = activeAnalysis.parameters || [];
    const hasResults = results.length > 0;

    return sourceParameters.map(param => {
      const meta = PARAM_CATALOGUE.find(p => p.key === param);
      let valueNum = 0;
      let isAnomaly = false;

      if (hasResults) {
        const resObj = results.find(r => r.parameter === param);
        valueNum = resObj ? parseFloat(resObj.value) : 0;
        isAnomaly = resObj ? resObj.is_anomaly : false;
      } else {
        const valStr = resultsForm[param] || '';
        valueNum = parseFloat(valStr) || 0;
        if (meta && valStr !== '') {
          isAnomaly = valueNum < meta.min || valueNum > meta.max;
        }
      }

      let deviation = 50; 
      if (meta) {
        const range = meta.max - meta.min;
        if (range > 0) {
          const pct = ((valueNum - meta.min) / range) * 50 + 25; // center is ~50
          deviation = Math.min(100, Math.max(5, pct));
        }
      }

      return {
        name: param,
        value: valueNum,
        deviation: parseFloat(deviation.toFixed(1)),
        isAnomaly
      };
    });
  }, [activeAnalysis, resultsForm]);

  const activeHazards = useMemo(() => {
    if (!activeAnalysis) return [];
    if (activeAnalysis.status === 'Validé' && activeAnalysis.results) {
      return activeAnalysis.results
        .map(r => getHazards(r.parameter, r.value))
        .filter((h): h is Hazard => h !== null);
    } else {
      return Object.entries(resultsForm)
        .map(([param, val]) => getHazards(param, val))
        .filter((h): h is Hazard => h !== null);
    }
  }, [activeAnalysis, resultsForm]);

  if (!activeAnalysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden h-full min-h-[500px]">
        {/* Oscilloscope Grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(to right, #2dd4bf 1px, transparent 1px), linear-gradient(to bottom, #2dd4bf 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {/* Pulsing Concentric Radar Rings */}
        <div className="absolute w-80 h-80 rounded-full border border-teal-500/10 flex items-center justify-center animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute w-60 h-60 rounded-full border border-teal-500/5 flex items-center justify-center animate-ping" style={{ animationDuration: '6s' }} />

        <div className="relative z-10 text-center max-w-sm flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-teal-500/10 blur-md animate-pulse" />
            <div className="w-14 h-14 rounded-full border border-teal-500/30 flex items-center justify-center text-teal-400 bg-slate-900 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
              <Activity className="w-7 h-7 animate-[pulse_2s_infinite]" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold font-mono tracking-widest text-teal-400 uppercase">
              CONSOLES SPECTRO-ANALYSES
            </h3>
            <p className="text-[9px] text-slate-650 font-mono mt-1">LIMS CORE SYSTEM // CHANNEL IDLE</p>
          </div>

          <svg className="w-48 h-8 text-teal-500/20" viewBox="0 0 200 40" fill="none">
            <path d="M 0,20 Q 25,5 50,20 T 100,20 T 150,20 T 200,20" stroke="currentColor" strokeWidth="2" fill="none" className="animate-[dash_5s_linear_infinite]" />
            <style>{`
              @keyframes dash {
                0% { stroke-dasharray: 0, 200; stroke-dashoffset: 0; }
                50% { stroke-dasharray: 80, 120; stroke-dashoffset: -40; }
                100% { stroke-dasharray: 0, 200; stroke-dashoffset: -200; }
              }
            `}</style>
          </svg>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Sélectionnez un flacon dans le rack d'analyses à gauche pour charger ses données moléculaires, lancer le diagnostic spectral ou télécharger le rapport ISO 17025.
          </p>

          <button
            onClick={onScheduleClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-mono text-xs font-bold uppercase rounded-lg border border-teal-500/30 transition-all shadow-[0_0_12px_rgba(15,118,110,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" /> Planifier Demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-white relative">
      
      {isScanning && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-white select-none">
          {/* Pulsing scanner laser line */}
          <div className="absolute inset-x-0 h-0.5 bg-teal-500 shadow-[0_0_12px_#2dd4bf] animate-[scanLaser_1.5s_ease-in-out_infinite]" />
          
          <style>{`
            @keyframes scanLaser {
              0% { top: 0%; opacity: 0.8; }
              50% { top: 100%; opacity: 1; }
              100% { top: 0%; opacity: 0.8; }
            }
          `}</style>

          <div className="relative max-w-sm w-full flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.25)]" />

            <div className="text-center">
              <h4 className="text-xs font-bold font-mono tracking-widest text-teal-400 uppercase">
                [ ACQUISITION SPECTROMÉTRIQUE ]
              </h4>
              <p className="text-[9px] text-slate-550 font-mono mt-1 uppercase">Séquençage chimique en cours</p>
            </div>

            {/* Simulated logs terminal */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[9px] text-teal-400/90 space-y-1.5 h-36 overflow-y-auto">
              {SCANNING_LOGS.slice(0, scanLogIndex + 1).map((log, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-slate-655">[{new Date().toLocaleTimeString()}]</span>
                  <span className={index === scanLogIndex ? "animate-pulse font-bold text-white" : ""}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewport Top Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold font-mono tracking-widest text-teal-400 uppercase">
              SPECTRO-ANALYSEUR CANAL #01
            </h3>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              FICHE: AN-{activeAnalysis.id.toString().padStart(4, '0')} · CODE ÉCHANTILLON: {activeAnalysis.sample?.code ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator badge */}
          <span className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold border ${
            activeAnalysis.status === 'Validé' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
            activeAnalysis.status === 'Anomalie' ? 'bg-rose-950/30 text-rose-400 border-rose-500/20 animate-pulse' :
            activeAnalysis.status === 'En cours' ? 'bg-sky-950/30 text-sky-400 border-sky-500/20' : 
            'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {activeAnalysis.status.toUpperCase()}
          </span>

          {/* ISO 17025 Download Report */}
          {activeAnalysis.status === 'Validé' && (
            <button
              onClick={() => setPreviewAnalysis(activeAnalysis)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 border border-teal-500/20 rounded font-mono text-[9px] font-bold uppercase transition-all"
            >
              <Download className="w-3.5 h-3.5" /> APERÇU RAPPORT
            </button>
          )}

          {/* Admin Delete Action */}
          {user && ['Admin', 'Responsable'].includes(user.role) && (
            <button
              onClick={() => handleDeleteAnalysis(activeAnalysis.id)}
              className="p-1 hover:bg-rose-950/30 text-rose-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded transition-all"
              title="Supprimer la demande d'analyse"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close console */}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 border border-slate-800 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          
          {/* LEFT COLUMN: TELEMETRY & GRAPHICS */}
          <div className="space-y-4 flex flex-col">
            
            {/* Physical Subsystems Telemetry */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 font-mono text-[9px]">
              <div className="flex items-center gap-2 border border-emerald-500/10 bg-emerald-950/5 px-2.5 py-1.5 rounded-lg text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-[7px] text-slate-500 block uppercase leading-none">Lampe UV</span>
                  <span className="font-bold">STABLE</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-emerald-500/10 bg-emerald-950/5 px-2.5 py-1.5 rounded-lg text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-[7px] text-slate-500 block uppercase leading-none">Faisceau Optique</span>
                  <span className="font-bold">DÉGAGÉ</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-teal-500/10 bg-teal-950/5 px-2.5 py-1.5 rounded-lg text-teal-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <div>
                  <span className="text-[7px] text-slate-500 block uppercase leading-none">Temp. Cuve</span>
                  <span className="font-bold">25.0°C</span>
                </div>
              </div>
            </div>

            {/* Charts tabs header */}
            <div className="flex border-b border-slate-800 pb-1.5 items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">VISUALISATION DIAGNOSTIQUE</span>
              <div className="flex gap-2 font-mono text-[9px]">
                {isSoilAnalysis && (
                  <button
                    onClick={() => setChartTab('soil_triangle')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      chartTab === 'soil_triangle' 
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    TRIANGLE TEXTURE
                  </button>
                )}
                <button
                  onClick={() => setChartTab('spectrum')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    chartTab === 'spectrum' 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SPECTRE MOLÉCULAIRE
                </button>
                <button
                  onClick={() => setChartTab('comparison')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    chartTab === 'comparison' 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CARTOGRAPHIE SEUILS
                </button>
              </div>
            </div>

            {/* Chart Container */}
            {chartTab === 'soil_triangle' && isSoilAnalysis ? (
              <SoilTriangleSVG
                clay={
                  activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Argile')?.value || '0')
                    : parseFloat(resultsForm['Argile'] || '0')
                }
                silt={
                  activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Limon')?.value || '0')
                    : parseFloat(resultsForm['Limon'] || '0')
                }
                sand={
                  activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Sable')?.value || '0')
                    : parseFloat(resultsForm['Sable'] || '0')
                }
                isValid={(() => {
                  const c = activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Argile')?.value || '0')
                    : parseFloat(resultsForm['Argile'] || '0');
                  const si = activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Limon')?.value || '0')
                    : parseFloat(resultsForm['Limon'] || '0');
                  const sa = activeAnalysis.status === 'Validé' && activeAnalysis.results
                    ? parseFloat(activeAnalysis.results.find(r => r.parameter === 'Sable')?.value || '0')
                    : parseFloat(resultsForm['Sable'] || '0');
                  return Math.abs(c + si + sa - 100) < 1.5;
                })()}
              />
            ) : chartTab === 'spectrum' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col h-[260px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    SPECTROPHOTOMÉTRIE (SCAN VISIBLE)
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">Absorbance (AU) / Wavelength (nm)</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spectrographData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="absorbanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="wavelength" stroke="#475569" fontSize={8} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={8} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} 
                        labelStyle={{ color: '#94a3b8', fontSize: '9px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#2dd4bf', fontSize: '10px' }}
                      />
                      <Area type="monotone" dataKey="absorbance" name="Absorbance" stroke="#2dd4bf" strokeWidth={1.8} fillOpacity={1} fill="url(#absorbanceGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col h-[260px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    DÉVIATION DES COMPOSÉS (% VALEUR CIBLE)
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">Normes de Tolérance ISO 17025</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thresholdData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={8} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '10px' }}
                        formatter={(value: any) => [`${value}%`, "Seuil"]}
                      />
                      <Bar dataKey="deviation" radius={[3, 3, 0, 0]}>
                        {thresholdData.map((entry: any, index: number) => {
                          const color = entry.isAnomaly ? '#f43f5e' : '#10b981';
                          return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} />;
                        })}
                      </Bar>
                      <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" opacity={0.5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Row of Diagnostics & Hazards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* circular Gauge risk */}
              <RiskGauge score={activeAnalysis.status === 'Validé' ? (activeAnalysis.risk_score ?? 0) : liveRiskScore} />
              
              {/* Technical diagnostics panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-teal-400 font-mono tracking-wide">
                  <FileText className="w-4 h-4 text-teal-400" /> CONCLUSIONS & RECOMMANDATIONS TECHNIQUES
                </div>
                {activeAnalysis.status === 'Validé' ? (
                  <p className="text-xs text-slate-300 leading-normal font-sans font-medium">
                    {activeAnalysis.ai_recommendation || "Diagnostic conforme. Aucun danger bio-chimique détecté."}
                  </p>
                ) : Object.values(resultsForm).some(v => v !== '') ? (
                  <p className="text-xs text-teal-300/80 leading-normal font-mono italic">
                    [Calcul en direct] : Risque global évalué à {liveRiskScore}%. En attente de validation finale pour générer la synthèse ISO.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 leading-normal font-mono italic">
                    Instrument en attente d'acquisition. Saisissez les mesures pour lancer le moteur de diagnostic analytique.
                  </p>
                )}

                {/* GHS warnings */}
                {activeHazards.length > 0 && (
                  <div className="mt-auto space-y-1.5">
                    <span className="text-[8px] font-bold text-slate-500 font-mono block">DANGER CLASSIFICATION SGH</span>
                    <div className="flex flex-col gap-1.5 max-h-[80px] overflow-y-auto">
                      {activeHazards.map((h, i) => (
                        <div key={i} className={`p-2 rounded border text-[9px] flex gap-2 items-center ${h.color}`}>
                          {renderGHSPictogram(h.code)}
                          <div>
                            <strong className="block font-mono">{h.name}</strong>
                            <span className="opacity-90 block">{h.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SENSORS VALUES & CALIBRATION */}
          <div>
            {activeAnalysis.status === 'Validé' && activeAnalysis.results ? (
              /* Display validated result cards */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">
                    RAPPORTS DE CAPTEURS ACTIFS ({activeAnalysis.results.length})
                  </span>
                  {activeAnalysis.validated_at && (
                    <span className="text-[8px] text-slate-400 font-mono">
                      VALIDÉ LE {new Date(activeAnalysis.validated_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeAnalysis.results.map(r => (
                    <ParameterGaugeCard key={r.id} result={r} />
                  ))}
                </div>

                {/* Lab inspector tech details */}
                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-black">
                    {activeAnalysis.technician?.name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Technicien Responsable</span>
                    <span className="text-xs font-bold text-slate-300 block">{activeAnalysis.technician?.name || "Inspecteur ISO"}</span>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Statut LIMS</span>
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">CERTIFIÉ CONFORME</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Sensor calibration forms */
              <div className="flex flex-col gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-3 mb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase block">
                      CONSOLE D'ACQUISITION DE PARAMÈTRES
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono block">LECTURE OPTIQUE ET CALIBRAGE DIRECT</span>
                  </div>
                  
                  {/* Premium Scenario Presets */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {isSoilAnalysis ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('soil_clay')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                          title="Calibrer comme un sol argileux (Argile: 55%, Limon: 25%, Sable: 20%)"
                        >
                          <Beaker className="w-3.5 h-3.5 text-rose-400" /> SOL ARGILEUX
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('soil_sandy')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          title="Calibrer comme un sol sableux (Argile: 10%, Limon: 5%, Sable: 85%)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> SOL SABLEUX
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('soil_loam')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                          title="Calibrer comme un sol franc / loam (Argile: 20%, Limon: 40%, Sable: 40%)"
                        >
                          <Beaker className="w-3.5 h-3.5 text-emerald-400" /> SOL FRANC
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('clean')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                          title="Injecte des valeurs nominales parfaites pour de l'eau pure"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> EAU PURE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('chemical')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse"
                          title="Injecte une anomalie acide (pH bas) et métaux lourds (Zinc élevé)"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> ANOMALIE CHIMIQUE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoCalibrate('nitrate')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          title="Injecte une pollution aux nitrates (Nitrates et Turbidité élevés)"
                        >
                          <Beaker className="w-3.5 h-3.5 text-amber-400" /> POLLUTION NITRATES
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <form id="validate-form" onSubmit={handleStartScan} className="space-y-3.5">
                  {activeAnalysis.parameters?.map(param => {
                    const meta = PARAM_CATALOGUE.find(p => p.key === param);
                    const rawVal = resultsForm[param] ?? '';
                    const { out, hint } = checkValueOutOfRange(param, rawVal);

                    // Determine slider step value dynamically
                    const getStepForParam = (key: string) => {
                      switch (key) {
                        case 'pH': return '0.05';
                        case 'Turbidité': return '0.05';
                        case 'Conductivité': return '1';
                        case 'Nitrate': return '0.5';
                        case 'Zinc': return '0.05';
                        case 'Température': return '0.1';
                        case 'Argile': case 'Limon': case 'Sable': return '0.5';
                        default: return '1';
                      }
                    };

                    return (
                      <div key={param} className="flex flex-col gap-1.5 bg-slate-950/45 p-2.5 rounded-lg border border-slate-850">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-1.5 font-semibold text-slate-300">
                            {meta ? paramIcon(meta.icon) : <TestTube className="w-3.5 h-3.5" />}
                            {meta?.label ?? param}
                            {meta && (
                              <span className="text-[9px] font-normal text-slate-500 font-mono ml-1">
                                (cible: {meta.min}–{meta.max} {meta.unit})
                              </span>
                            )}
                          </label>
                          {out && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                              ⚠ {hint}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            value={rawVal}
                            onChange={e => setResultsForm({ ...resultsForm, [param]: e.target.value })}
                            placeholder={meta ? `Ex: ${((meta.min + meta.max) / 2).toFixed(1)}` : '0.00'}
                            className={`w-full px-3 py-1.5 border rounded-lg font-mono text-xs focus:outline-none transition-all ${
                              out
                                ? 'border-amber-500/50 bg-amber-950/20 text-amber-200 focus:ring-1 focus:ring-amber-500/30'
                                : rawVal !== ''
                                  ? 'border-teal-500/40 bg-teal-950/10 text-teal-200 focus:ring-1 focus:ring-teal-500/30'
                                  : 'border-slate-800 bg-slate-950 text-slate-100 focus:ring-1 focus:ring-teal-500/30 focus:border-teal-500/50'
                            }`}
                          />
                          {meta?.unit && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                              {meta.unit}
                            </span>
                          )}
                        </div>
                        {meta && (
                          <div className="flex items-center gap-2 px-1">
                            <input
                              type="range"
                              min={meta.min}
                              max={meta.max}
                              step={getStepForParam(meta.key)}
                              value={parseFloat(rawVal) || meta.min}
                              onChange={e => setResultsForm({ ...resultsForm, [param]: e.target.value })}
                              className="flex-1 accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[8px] font-mono text-slate-500 select-none">
                              {meta.min}—{meta.max}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-slate-800 mt-4 flex items-center justify-between gap-4">
                    <div className="text-[10px] text-slate-500 leading-snug">
                      <Info className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      L'acquisition déclenchera le calibrage de l'oscilloscope moléculaire.
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 text-xs font-bold font-mono uppercase text-white bg-teal-600 hover:bg-teal-500 border border-teal-400/20 rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.15)] disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    >
                      <Activity className="w-4 h-4" /> VALIDER LES CAPTEURS
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         ISO 17025 REPORT PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {previewAnalysis && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 text-white relative">
            {/* Holographic glowing grids */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
              backgroundImage: 'linear-gradient(to right, #2dd4bf 1px, transparent 1px), linear-gradient(to bottom, #2dd4bf 1px, transparent 1px)',
              backgroundSize: '15px 15px'
            }} />
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold font-mono text-sm tracking-widest text-teal-400">RAPPORT CERTIFIÉ ISO/CEI 17025</h3>
                  <p className="text-[9px] text-slate-505 font-mono mt-0.5">PREVIEW DOCUMENT DÉMATÉRIALISÉ // LIMS CORE</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewAnalysis(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Document Header & Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800/80 bg-slate-950/40 p-4 rounded-xl font-mono text-xs text-slate-300">
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Organisme Émetteur</div>
                  <div className="font-bold text-teal-300">LIMS ChemLab Corp. Ltd</div>
                  <div>Service d'Analyse Environnementale & Moléculaire</div>
                  <div className="text-[10px] text-slate-550">Accréditation Cofrac #4-8902 (Norme 17025)</div>
                </div>
                <div className="space-y-1.5 md:border-l md:border-slate-800 md:pl-4">
                  <div className="text-[10px] text-slate-505 uppercase tracking-wider font-bold">Métadonnées d'Analyse</div>
                  <div>Rapport ID : <span className="font-bold text-white">REP-{previewAnalysis.id.toString().padStart(6, '0')}</span></div>
                  <div>Fiche LIMS : <span className="font-bold text-white">AN-{previewAnalysis.id.toString().padStart(4, '0')}</span></div>
                  <div>Échantillon : <span className="font-bold text-teal-400">{previewAnalysis.sample?.code || `SMP-${previewAnalysis.sample_id}`}</span></div>
                  <div>Date Diagnostic : <span className="font-bold text-white">{previewAnalysis.validated_at ? new Date(previewAnalysis.validated_at).toLocaleString() : 'En attente'}</span></div>
                </div>
              </div>

              {/* KPI indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-slate-800/80 bg-slate-950/20 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Score Risque Global</span>
                  <span className={`text-xl font-bold font-mono mt-1 ${
                    (previewAnalysis.risk_score ?? 0) > 70 ? 'text-rose-400' : (previewAnalysis.risk_score ?? 0) > 35 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{previewAnalysis.risk_score ?? 0}%</span>
                </div>
                <div className="border border-slate-800/80 bg-slate-950/20 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Statut de Conformité</span>
                  <span className={`text-xs font-bold font-mono mt-1.5 px-2 py-0.5 rounded border ${
                    previewAnalysis.status === 'Anomalie' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {previewAnalysis.status === 'Anomalie' ? '⚠️ DANGER / ANOMALIE' : '✓ CERTIFIÉ CONFORME'}
                  </span>
                </div>
                <div className="border border-slate-800/80 bg-slate-950/20 p-3 rounded-lg flex flex-col items-center justify-center text-center col-span-1">
                  <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Opérateur Responsable</span>
                  <span className="text-xs font-bold text-slate-300 mt-1.5">{previewAnalysis.technician?.name || 'Inspecteur LIMS'}</span>
                </div>
              </div>

              {/* Table of values */}
              <div className="border border-slate-800/80 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 font-mono text-[9px] text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Paramètre Analysé</th>
                      <th className="px-4 py-2.5">Valeur Acquise</th>
                      <th className="px-4 py-2.5">Plage Réf. ISO</th>
                      <th className="px-4 py-2.5 text-right">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewAnalysis.results?.map(r => (
                      <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-semibold text-slate-300 flex items-center gap-1.5">
                          {r.parameter}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {r.value} <span className="text-slate-400 font-normal text-[10px]">{r.unit}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {r.reference_min !== null && r.reference_max !== null 
                            ? `[${r.reference_min} - ${r.reference_max}]` 
                            : 'Aucune'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            r.is_anomaly 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {r.is_anomaly ? '⚠️ ANOMALIE' : 'CONFORME'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GHS Hazards and Technical Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Technical synthesis */}
                <div className="border border-slate-800/80 bg-slate-950/20 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-teal-400 font-mono tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> SYNTHÈSE DE CONFORMITÉ TECHNIQUE
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {previewAnalysis.ai_recommendation || "L'analyse spectrophotométrique ne révèle aucune déviance moléculaire par rapport aux limites autorisées. L'échantillon peut être considéré comme conforme aux normes de sécurité en vigueur."}
                  </p>
                </div>

                {/* SGH Classifications */}
                <div className="border border-slate-800/80 bg-slate-950/20 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-rose-400 font-mono tracking-wider">
                    DANGERS IDENTIFIÉS (SYSTÈME SGH)
                  </span>
                  {previewAnalysis.results && previewAnalysis.results.some(r => r.is_anomaly) ? (
                    <div className="space-y-2">
                      {previewAnalysis.results
                        .map(r => getHazards(r.parameter, r.value))
                        .filter((h): h is Hazard => h !== null)
                        .map((h, i) => (
                          <div key={i} className={`p-2.5 rounded-lg border text-[9px] flex gap-2 items-center bg-slate-900 ${h.color}`}>
                            {renderGHSPictogram(h.code)}
                            <div>
                              <strong className="block font-mono">{h.name}</strong>
                              <span className="opacity-90 block">{h.desc}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic leading-relaxed font-mono">
                      Aucune substance dangereuse identifiée sous le protocole SGH.
                    </p>
                  )}
                </div>
              </div>

              {/* Soil texture analysis section in PDF report */}
              {previewAnalysis.parameters?.includes('Argile') && 
               previewAnalysis.parameters?.includes('Limon') && 
               previewAnalysis.parameters?.includes('Sable') && (
                <div className="border border-slate-800 bg-slate-950/40 p-5 rounded-xl flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 font-mono tracking-widest block uppercase">
                      🔬 SECTION TEXTURE DU SOL (ISO 11277)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      La répartition granulométrique de cet échantillon a été mesurée par sédimentation et diffraction laser. Les proportions relatives d'Argile, de Limon et de Sable positionnent précisément l'échantillon sur le triangle de texture de l'USDA pour déterminer sa classe physique.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                      <div className="bg-slate-900 border border-slate-800/80 rounded p-1.5">
                        <span className="text-[8px] text-slate-500 block">ARGILE</span>
                        <span className="text-xs font-bold text-rose-400">
                          {parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Argile')?.value || '0').toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800/80 rounded p-1.5">
                        <span className="text-[8px] text-slate-500 block">LIMON</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Limon')?.value || '0').toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800/80 rounded p-1.5">
                        <span className="text-[8px] text-slate-500 block">SABLE</span>
                        <span className="text-xs font-bold text-amber-400">
                          {parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Sable')?.value || '0').toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-80 shrink-0">
                    <SoilTriangleSVG
                      clay={parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Argile')?.value || '0')}
                      silt={parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Limon')?.value || '0')}
                      sand={parseFloat(previewAnalysis.results?.find(r => r.parameter === 'Sable')?.value || '0')}
                      isValid={true}
                    />
                  </div>
                </div>
              )}

              {/* Digital signature block */}
              <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-[9px] text-slate-505 uppercase font-bold tracking-wider">Certificats de Signature</div>
                  <div className="text-xs text-slate-300">Cryptage : <span className="text-white">SHA-256 HMAC SECURE</span></div>
                  <div className="text-[9px] text-slate-600 truncate max-w-[280px]">
                    HASH: SECURE-LIMS-HEX-893F204C39B2A
                  </div>
                </div>

                {/* Glowing cryptographic stamp */}
                <div className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-950/10 px-4 py-2 rounded-lg text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-bl-full animate-ping" />
                  <div className="text-right">
                    <span className="text-[8px] font-bold block uppercase tracking-widest text-emerald-500 leading-none">LIMS SIGNED</span>
                    <span className="text-[9px] font-black block mt-1 tracking-tight text-white leading-none">APPROVED ISO 17025</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-950/20 text-emerald-400 shadow-[inset_0_0_4px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
              <button 
                type="button" 
                onClick={() => setPreviewAnalysis(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              >
                Fermer l'aperçu
              </button>
              <button 
                type="button" 
                onClick={() => {
                  handleDownloadPDF(previewAnalysis);
                  setPreviewAnalysis(null);
                }}
                className="px-5 py-2.5 text-xs font-mono uppercase text-white bg-teal-600 hover:bg-teal-500 border border-teal-400/20 rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.15)] flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> TÉLÉCHARGER LE PDF OFFICIEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
