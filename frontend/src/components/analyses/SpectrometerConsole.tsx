import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity, X, Download, Trash2, FileText, CheckCircle2,
  Beaker, TestTube, Plus, ChevronRight, User, MapPin, Calendar, Clock,
  Check, Edit3, Shield, Star
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import api from '../../services/api';
import {
  type Analysis, type Hazard, PARAM_CATALOGUE,
  checkValueOutOfRange, getHazards, paramIcon
} from './types';
import { renderGHSPictogram } from './HazardIndicator';
import { RiskGauge } from './VisualGauges';
import SoilTriangleSVG from './SoilTriangleSVG';

interface SpectrometerConsoleProps {
  activeAnalysis: Analysis | null;
  onClose: () => void;
  onDeleteSuccess: () => Promise<void>;
  onValidateSuccess: () => Promise<void>;
  user: any;
  onScheduleClick: () => void;
}

const PHASES = [
  { id: 1, label: "Réception" },
  { id: 2, label: "Qualité (QC)" },
  { id: 3, label: "Préparation" },
  { id: 4, label: "Analyses" },
  { id: 5, label: "Validation" },
  { id: 6, label: "Recommendations" },
  { id: 7, label: "Rapport PDF" }
];

export default function SpectrometerConsole({
  activeAnalysis,
  onClose,
  onDeleteSuccess,
  onValidateSuccess,
  user,
  onScheduleClick,
}: SpectrometerConsoleProps) {
  // Stepper state
  const [activePhase, setActivePhase] = useState<number>(1);
  const [chartTab, setChartTab] = useState<'spectrum' | 'comparison' | 'soil_triangle'>('spectrum');

  // Scan simulation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogIndex, setScanLogIndex] = useState(0);

  // Validation forms
  const [resultsForm, setResultsForm] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HTML5 Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Metadata for the 7 LIMS Phases
  const [metadata, setMetadata] = useState<any>({
    module: 'sol',
    // Phase 1
    client_name: '',
    client_phone: '',
    client_email: '',
    client_company: '',
    region: '',
    commune: '',
    gps: '',
    surface: '',
    current_culture: '',
    planned_culture: '',
    sampler: '',
    sample_count: '1',
    date_sample: '',
    date_reception: '',
    // Phase 2
    qc_qty: true,
    qc_id: true,
    qc_contamination: true,
    qc_humidity: true,
    qc_bottle: true,
    qc_volume: true,
    qc_label: true,
    qc_delay: true,
    qc_decision: 'Accepte',
    // Phase 3
    prep_drying_start: '',
    prep_drying_end: '',
    prep_drying_temp: '35',
    prep_drying_tech: '',
    prep_grinding_type: 'Broyeur à disques',
    prep_grinding_tech: '',
    prep_sieving_mesh: '2',
    prep_homo_uniform: true,
    prep_storage_cab: 'A1',
    prep_storage_shelf: '3',
    prep_storage_bin: '12',
    // Phase 5
    tech_verified: false,
    manager_approved: false,
    signature_data: '',
  });

  const isSoilAnalysis = useMemo(() => {
    if (!activeAnalysis) return false;
    const params = activeAnalysis.parameters || [];
    return params.includes('Argile') && params.includes('Limon') && params.includes('Sable');
  }, [activeAnalysis]);

  // Synchronize metadata and resultsForm from active analysis
  useEffect(() => {
    if (activeAnalysis) {
      const isSol = activeAnalysis.sample?.type === 'Sol / Terre' || isSoilAnalysis;
      const existingMeta = activeAnalysis.metadata || activeAnalysis.sample?.metadata || {};
      
      setMetadata((prev: any) => ({
        ...prev,
        module: isSol ? 'sol' : 'eau',
        client_name: activeAnalysis.sample?.client?.name || existingMeta.client_name || '',
        client_email: activeAnalysis.sample?.client?.email || existingMeta.client_email || '',
        date_reception: activeAnalysis.sample?.received_at 
          ? new Date(activeAnalysis.sample.received_at).toISOString().split('T')[0] 
          : existingMeta.date_reception || new Date().toISOString().split('T')[0],
        date_sample: existingMeta.date_sample || new Date().toISOString().split('T')[0],
        sampler: existingMeta.sampler || activeAnalysis.technician?.name || '',
        ...existingMeta
      }));

      const params = activeAnalysis.parameters || [];
      if (isSol) {
        setChartTab('soil_triangle');
      } else {
        setChartTab('spectrum');
      }

      const init: Record<string, string> = {};
      if (activeAnalysis.results && activeAnalysis.results.length > 0) {
        activeAnalysis.results.forEach(r => {
          init[r.parameter] = r.value;
        });
      } else {
        params.forEach(p => {
          init[p] = '';
        });
      }
      setResultsForm(init);
      setActivePhase(1); // Reset to Phase 1
    }
  }, [activeAnalysis]);

  // Redraw signature on canvas if in Phase 5 and signature exists
  useEffect(() => {
    if (activePhase === 5 && metadata.signature_data && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = metadata.signature_data;
      }
    }
  }, [activePhase, metadata.signature_data]);

  // Web Audio synthesizer for premium feedback
  const playSound = (type: 'scan' | 'success' | 'anomaly') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'scan') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 1.6);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.6);
      } else if (type === 'success') {
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + start + 0.05);
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
        const playBuzz = (start: number) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sawtooth';
          osc2.type = 'sawtooth';
          osc1.frequency.setValueAtTime(120, ctx.currentTime + start);
          osc2.frequency.setValueAtTime(123, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.35);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(ctx.currentTime + start);
          osc2.start(ctx.currentTime + start);
          osc1.stop(ctx.currentTime + start + 0.4);
          osc2.stop(ctx.currentTime + start + 0.4);
        };
        playBuzz(0.0);
        playBuzz(0.2);
      }
    } catch (e) {
      console.warn("Web Audio failure:", e);
    }
  };

  // HTML5 Canvas Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00f0ff';
    
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
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMetadata((prev: any) => ({ ...prev, signature_data: '' }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setMetadata((prev: any) => ({ ...prev, signature_data: dataUrl }));
  };

  // Automated Calculations for Soil & Water
  const waterCalculations = useMemo(() => {
    if (metadata.module !== 'eau') return null;

    // Saisie des ions en mg/L
    const Ca_mg = parseFloat(resultsForm['Calcium'] || '0');
    const Mg_mg = parseFloat(resultsForm['Magnésium'] || '0');
    const Na_mg = parseFloat(resultsForm['Sodium'] || '0');
    const HCO3_mg = parseFloat(resultsForm['Bicarbonates'] || '0');
    const CO3_mg = parseFloat(resultsForm['Carbonates'] || '0');
    const EC = parseFloat(resultsForm['Conductivité'] || '0'); // dS/m ou µS/cm

    // Conversion en meq/L
    const Ca_meq = Ca_mg / 20.04;
    const Mg_meq = Mg_mg / 12.15;
    const Na_meq = Na_mg / 22.99;
    const HCO3_meq = HCO3_mg / 61.02;
    const CO3_meq = CO3_mg / 30.00;

    // 1. SAR (Sodium Adsorption Ratio)
    const sarDiv = Math.sqrt((Ca_meq + Mg_meq) / 2);
    const SAR = sarDiv > 0 ? Na_meq / sarDiv : 0;
    
    let sarRating = 'Faible';
    if (SAR > 18) sarRating = 'Élevé';
    else if (SAR > 10) sarRating = 'Moyen';

    // 2. RSC (Residual Sodium Carbonate)
    const RSC = (HCO3_meq + CO3_meq) - (Ca_meq + Mg_meq);

    // 3. Dureté Totale (TH)
    const TH = (Ca_mg * 2.497) + (Mg_mg * 4.118);

    // 4. Classification Irrigation (C-S)
    // Classe Salinité (EC)
    let cClass = 'C1';
    if (EC >= 2.25) cClass = 'C4';
    else if (EC >= 0.75) cClass = 'C3';
    else if (EC >= 0.25) cClass = 'C2';

    // Classe Sodium (SAR)
    let sClass = 'S1';
    if (SAR >= 26) sClass = 'S4';
    else if (SAR >= 18) sClass = 'S3';
    else if (SAR >= 10) sClass = 'S2';

    return {
      sar: parseFloat(SAR.toFixed(2)),
      sarRating,
      rsc: parseFloat(RSC.toFixed(2)),
      hardness: parseFloat(TH.toFixed(1)),
      classification: `${cClass}-${sClass}`
    };
  }, [resultsForm, metadata.module]);

  // Automatic rule-based Recommendations
  const recommendations = useMemo(() => {
    const list: string[] = [];
    const pH = parseFloat(resultsForm['pH'] || '0');

    if (metadata.module === 'sol') {
      const MO = parseFloat(resultsForm['Matière organique'] || '0');
      const P = parseFloat(resultsForm['Phosphore'] || '0');
      const K = parseFloat(resultsForm['Potassium'] || '0');

      if (MO > 0 && MO < 2.0) {
        list.push("Taux de Matière Organique (MO) faible : Appliquer du Compost à raison de 20 T/ha pour reconstituer le complexe argilo-humique.");
      }
      if (P > 0 && P < 15.0) {
        list.push("Déficit en Phosphore (P) : Préconiser l'apport d'engrais phosphatés de type MAP (Mono-Ammonium Phosphate) à 150 kg/ha.");
      }
      if (K > 0 && K < 120.0) {
        list.push("Déficit en Potassium (K) : Appliquer du Sulfate de potassium pour améliorer la régulation hydrique des futures cultures.");
      }
      if (pH > 7.5) {
        list.push("Sol alcalin (pH élevé) : Envisager une acidification du sol par incorporation de soufre élémentaire.");
      }
    } else {
      const EC = parseFloat(resultsForm['Conductivité'] || '0');
      const SAR = waterCalculations?.sar || 0;
      const NO3 = parseFloat(resultsForm['Nitrate'] || '0');

      if (EC > 2.0) {
        list.push("Salinité de l'eau élevée (Conductivité critique) : Augmenter la fraction de lessivage pour évacuer les sels hors de la rhizosphère.");
      }
      if (SAR > 9.0 || (waterCalculations && waterCalculations.rsc > 1.25)) {
        list.push("Indice SAR / RSC critique (Risque sodique élevé) : Amender l'eau ou les sols avec du Gypse agricole (Sulfate de Calcium) pour déplacer le sodium.");
      }
      if (NO3 > 50.0) {
        list.push("Nitrates élevés (> 50 mg/L) : Réduire drastiquement les apports d'engrais azotés dans votre plan de fertilisation d'irrigation.");
      }
    }

    if (list.length === 0) {
      list.push(metadata.module === 'sol' 
        ? "La structure physico-chimique du sol est optimale pour la zira3a." 
        : "Qualité de l'eau excellente et idéale pour l'irrigation agricole."
      );
    }
    return list;
  }, [resultsForm, metadata.module, waterCalculations]);

  // Live Risk score & Warnings
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

  const activeHazards = useMemo(() => {
    if (!activeAnalysis) return [];
    return Object.entries(resultsForm)
      .map(([param, val]) => getHazards(param, val))
      .filter((h): h is Hazard => h !== null);
  }, [activeAnalysis, resultsForm]);

  // Submit scan trigger
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
        if (prev >= 7) {
          clearInterval(interval);
          executeValidationSubmit();
          return prev;
        }
        return prev + 1;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isScanning]);

  const executeValidationSubmit = async () => {
    if (!activeAnalysis) return;

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

      // Prepare final metadata
      const finalMetadata = {
        ...metadata,
        water_sar: waterCalculations?.sar ?? null,
        water_rsc: waterCalculations?.rsc ?? null,
        water_hardness: waterCalculations?.hardness ?? null,
        water_irrigation_class: waterCalculations?.classification ?? null,
        recommendations: recommendations
      };

      // 1. Update Sample metadata & status
      await api.patch(`/api/samples/${activeAnalysis.sample_id}`, {
        status: metadata.qc_decision === 'Refuse' ? 'Anomalie' : 'En cours',
        metadata: finalMetadata
      });

      // 2. Validate Analysis with results and recommendations
      await api.post(`/api/analyses/${activeAnalysis.id}/validate`, {
        results: resultsArray,
        metadata: finalMetadata
      });

      playSound('success');
      setIsScanning(false);
      await onValidateSuccess();
      setActivePhase(7); // Jump to final PDF Phase
    } catch (err) {
      alert('Erreur lors de la validation technique.');
      setIsScanning(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoCalibrate = (preset: 'soil_clay' | 'soil_sandy' | 'soil_loam' | 'water_pure' | 'water_saline' | 'water_polluted') => {
    if (!activeAnalysis) return;
    const newForm: Record<string, string> = {};
    
    activeAnalysis.parameters.forEach(param => {
      const meta = PARAM_CATALOGUE.find(p => p.key === param);
      if (meta) {
        let value = 0;
        if (preset === 'soil_clay') {
          switch (param) {
            case 'Argile': value = 50.0; break;
            case 'Limon':  value = 30.0; break;
            case 'Sable':  value = 20.0; break;
            case 'pH':     value = 6.40; break;
            case 'Conductivité': value = 350; break;
            case 'Matière organique': value = 3.2; break;
            case 'Phosphore': value = 24.5; break;
            case 'Potassium': value = 180; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'soil_sandy') {
          switch (param) {
            case 'Argile': value = 10.0; break;
            case 'Limon':  value = 10.0; break;
            case 'Sable':  value = 80.0; break;
            case 'pH':     value = 5.80; break;
            case 'Conductivité': value = 120; break;
            case 'Matière organique': value = 0.8; break; // Low OM
            case 'Phosphore': value = 8.2; break; // Low P
            case 'Potassium': value = 65; break; // Low K
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'soil_loam') {
          switch (param) {
            case 'Argile': value = 20.0; break;
            case 'Limon':  value = 40.0; break;
            case 'Sable':  value = 40.0; break;
            case 'pH':     value = 6.80; break;
            case 'Conductivité': value = 280; break;
            case 'Matière organique': value = 2.5; break;
            case 'Phosphore': value = 40.0; break;
            case 'Potassium': value = 210; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'water_pure') {
          switch (param) {
            case 'pH':           value = 7.20; break;
            case 'Conductivité': value = 150; break;
            case 'TDS':          value = 95; break;
            case 'Calcium':      value = 35.0; break;
            case 'Magnésium':    value = 8.5; break;
            case 'Sodium':       value = 12.0; break;
            case 'Potassium':    value = 1.8; break;
            case 'Chlorures':    value = 18.0; break;
            case 'Sulfates':     value = 10.0; break;
            case 'Bicarbonates':  value = 45.0; break;
            case 'Carbonates':   value = 0.0; break;
            case 'Nitrate':      value = 4.2; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'water_saline') {
          switch (param) {
            case 'pH':           value = 8.10; break;
            case 'Conductivité': value = 2400; break; // High salinity
            case 'TDS':          value = 1500; break;
            case 'Calcium':      value = 120.0; break;
            case 'Magnésium':    value = 85.0; break;
            case 'Sodium':       value = 420.0; break; // High Sodium
            case 'Potassium':    value = 12.5; break;
            case 'Chlorures':    value = 680.0; break;
            case 'Sulfates':     value = 240.0; break;
            case 'Bicarbonates':  value = 180.0; break;
            case 'Carbonates':   value = 0.0; break;
            case 'Nitrate':      value = 12.0; break;
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        } else if (preset === 'water_polluted') {
          switch (param) {
            case 'pH':           value = 6.10; break;
            case 'Conductivité': value = 1100; break;
            case 'TDS':          value = 710; break;
            case 'Calcium':      value = 90.0; break;
            case 'Magnésium':    value = 30.0; break;
            case 'Sodium':       value = 110.0; break;
            case 'Potassium':    value = 8.5; break;
            case 'Chlorures':    value = 210.0; break;
            case 'Sulfates':     value = 85.0; break;
            case 'Bicarbonates':  value = 120.0; break;
            case 'Carbonates':   value = 0.0; break;
            case 'Nitrate':      value = 65.0; break; // Critical Nitrate
            default: value = meta.min + Math.random() * (meta.max - meta.min);
          }
        }
        newForm[param] = value.toFixed(2);
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

  const handleDeleteAnalysis = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande d'analyse ?")) return;
    try {
      await api.delete(`/api/analyses/${id}`);
      await onDeleteSuccess();
    } catch {
      alert("Erreur lors de la suppression de l'analyse. Vérifiez vos permissions.");
    }
  };

  if (!activeAnalysis) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-white relative select-none">
        
        {/* Workspace Top Bar / Tabs */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-slate-950 border border-slate-800 text-[#00f0ff] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              SYS.DIAG
            </span>
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#00f0ff] uppercase glow-cyan flex items-center gap-1.5">
              CONSOLES ET WORKSPACES ACTIFS
            </h3>
          </div>
          <div className="flex gap-1.5">
            {['Synthèse Clinique', 'Spectrométrie 1', 'Capteurs 2', 'Calibration'].map(tab => (
              <button
                key={tab}
                disabled={tab !== 'Synthèse Clinique'}
                className={`px-3 py-1 rounded text-[9.5px] font-mono font-bold uppercase transition-all ${
                  tab === 'Synthèse Clinique'
                    ? 'bg-teal-500/10 text-[#00f0ff] border border-teal-500/30'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Synthesis Workspace */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-950/40 flex flex-col min-h-0">
          
          {/* Visual flowchart grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-[#070b11]/70 p-3.5 rounded-xl border border-slate-800/80 relative overflow-hidden shrink-0">
            {/* 1. SELECTION & ACQUISITION */}
            <div className="md:col-span-1.5 flex flex-col gap-3.5">
              {/* Selection Card */}
              <div className="bg-slate-950/90 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1.5 shadow-lg hover:border-teal-500/20 transition-all duration-300">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">SÉLECTION DU FLACON</div>
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-1 shrink-0 p-1 bg-slate-900 border border-slate-800 rounded">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-emerald-500' : i === 4 ? 'bg-sky-500' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    <div>AN-0001 (A1)</div>
                    <div className="text-slate-500 text-[8px]">Argiles & pH</div>
                  </div>
                </div>
              </div>

              {/* Spectro Card */}
              <div className="bg-slate-950/90 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1.5 shadow-lg hover:border-teal-500/20 transition-all duration-300">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">ACQUISITION SPECTROMÉTRIQUE</div>
                <div className="flex flex-col gap-1">
                  <div className="h-1 bg-slate-900 border border-slate-800 rounded overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-sky-500 w-2/3 animate-pulse" />
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 flex justify-between">
                    <span>Wavelength 532nm</span>
                    <span className="text-teal-400">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection arrow 1 */}
            <div className="hidden md:flex justify-center items-center">
              <svg className="w-8 h-8 text-teal-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* 2. CENTRE DE CONTROLE */}
            <div className="md:col-span-1.5 flex justify-center">
              <div className="bg-slate-950/95 border border-[#00f0ff]/30 p-4 rounded-xl flex flex-col items-center text-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.05)] max-w-[180px] w-full">
                <div className="w-9 h-9 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] shadow-inner animate-pulse">
                  <Beaker className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-mono font-black text-[#00f0ff] uppercase tracking-wider">CENTRE CLINIQUE</div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">CORE ENGINE V4.0</div>
                </div>
              </div>
            </div>

            {/* Connection arrow 2 */}
            <div className="hidden md:flex justify-center items-center">
              <svg className="w-8 h-8 text-teal-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* 3. STEPPERS */}
            <div className="md:col-span-1 flex flex-col gap-2 bg-[#090e17]/80 p-2 rounded-lg border border-slate-850">
              {[
                { label: 'TRAITEMENT DONNÉES', active: true, icon: '⚙️' },
                { label: 'VALIDATION ISO', active: false, icon: '🛡️' },
                { label: 'GÉNÉRATION RAPPORT', active: false, icon: '📄' }
              ].map((step, sIdx) => (
                <div key={sIdx} className={`p-2 rounded flex items-center gap-2 border text-[8px] font-mono ${
                  step.active
                    ? 'bg-[#00f0ff]/5 border-[#00f0ff]/20 text-[#00f0ff]'
                    : 'bg-slate-950 border-slate-850 text-slate-500'
                }`}>
                  <span className="text-[10px]">{step.icon}</span>
                  <span className="font-bold">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart & Parameters Table split view */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 flex-grow min-h-0">
            {/* Spectrum Graph (3/5 width) */}
            <div className="lg:col-span-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col min-h-[200px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
                  VUE D'ENSEMBLE SPECTRALE (MULTI-ÉCHANTILLONS)
                </span>
                <span className="text-[8px] text-slate-500 font-mono">Absorbance (AU) / Longueur d'onde (nm)</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { nm: '400nm', val1: 0.12, val2: 0.25, val3: 0.05 },
                      { nm: '440nm', val1: 0.18, val2: 0.32, val3: 0.12 },
                      { nm: '480nm', val1: 0.31, val2: 0.45, val3: 0.22 },
                      { nm: '520nm', val1: 0.42, val2: 0.58, val3: 0.38 },
                      { nm: '560nm', val1: 0.35, val2: 0.41, val3: 0.28 },
                      { nm: '600nm', val1: 0.22, val2: 0.29, val3: 0.18 },
                      { nm: '640nm', val1: 0.15, val2: 0.18, val3: 0.11 },
                      { nm: '680nm', val1: 0.09, val2: 0.12, val3: 0.07 },
                      { nm: '720nm', val1: 0.05, val2: 0.08, val3: 0.04 }
                    ]}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="nm" stroke="#475569" fontSize={8} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', fontSize: '9px' }} />
                    <Area type="monotone" dataKey="val1" stroke="#2dd4bf" strokeWidth={1.5} fillOpacity={0.08} fill="#0f766e" name="AN-0001" />
                    <Area type="monotone" dataKey="val2" stroke="#a855f7" strokeWidth={1.5} fillOpacity={0.05} fill="#701a75" name="AN-0002" />
                    <Area type="monotone" dataKey="val3" stroke="#38bdf8" strokeWidth={1.5} fillOpacity={0.05} fill="#0369a1" name="AN-0003" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Parameters list (2/5 width) */}
            <div className="lg:col-span-2 bg-[#070b11]/80 border border-slate-800 rounded-xl p-3 flex flex-col min-h-[200px]">
              <div className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                RÉSUMÉ ANALYTIQUE RECENT
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-350 min-h-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="pb-1.5 font-normal">ID</th>
                      <th className="pb-1.5 font-normal">PARAMÈTRES</th>
                      <th className="pb-1.5 font-normal">pH</th>
                      <th className="pb-1.5 font-normal text-right">ABS.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { id: 'AN-0001', params: 'Clay, Silt, Sand', ph: '6.85', abs: '0.42' },
                      { id: 'AN-0002', params: 'pH, EC, Salinity', ph: '7.20', abs: '0.58' },
                      { id: 'AN-0003', params: 'CEC, Organic M.', ph: '6.40', abs: '0.31' },
                      { id: 'AN-0004', params: 'Nitrate, Phosphate', ph: '6.90', abs: '0.15' }
                    ].map(row => (
                      <tr key={row.id} className="hover:bg-slate-900/40">
                        <td className="py-2 text-[#00f0ff] font-bold">{row.id}</td>
                        <td className="py-2 text-slate-400 truncate max-w-[110px]">{row.params}</td>
                        <td className="py-2">{row.ph}</td>
                        <td className="py-2 text-right text-teal-400">{row.abs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom timeline of analysis */}
          <div className="bg-[#070b11]/70 p-3 rounded-xl border border-slate-800/80 shrink-0">
            <div className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              TIMELINE GÉNÉRALE DU WORKFLOW LIMS
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 overflow-x-auto pb-0.5">
              {[
                { id: 1, label: 'Préparation', desc: 'Séchage & broyage' },
                { id: 2, label: 'Acquisition', desc: 'Scan spectrométrique' },
                { id: 3, label: 'In-Progress', desc: 'Calculs physiques' },
                { id: 4, label: 'Calibration', desc: 'Sondes optiques' },
                { id: 5, label: 'Validation', desc: 'Double validation' },
                { id: 6, label: 'Rapport', desc: 'Édition PDF' }
              ].map((ph, idx, arr) => (
                <div key={ph.id} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border ${
                      ph.id === 1 
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {ph.id}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-bold ${ph.id === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>{ph.label}</span>
                      <span className="text-[7px] text-slate-500 font-normal">{ph.desc}</span>
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="w-8 h-px bg-slate-800 mx-2 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Planifier button */}
          <div className="pt-1.5 flex justify-center shrink-0">
            <button
              onClick={onScheduleClick}
              className="w-full max-w-sm py-2.5 bg-[#00f0ff] hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Planifier une nouvelle demande d'analyse
            </button>
          </div>
        </div>

        {/* Laboratory Instrument Telemetry Footer */}
        <div className="h-10 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 shrink-0 font-mono text-[9px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-teal-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              INSTRUMENTATION : CONNECTÉE
            </span>
            <span className="h-3 w-px bg-slate-800" />
            <span>LASER DIODE : PRÊT (532 nm)</span>
            <span className="h-3 w-px bg-slate-800" />
            <span>T° DE CUVE : 25.0 °C (CALIBRÉ)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>DÉBIT : 1.2 ml/min</span>
            <span className="h-3 w-px bg-slate-800" />
            <span className="text-[#00f0ff] uppercase">PROTOCOLE : ISO 17025 v4.0</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-white relative select-none">
      {isScanning && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-white">
          <div className="absolute inset-x-0 h-0.5 bg-teal-500 shadow-[0_0_12px_#2dd4bf] animate-[scanLaser_1.5s_ease-in-out_infinite]" />
          <div className="relative max-w-sm w-full flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
            <div className="text-center">
              <h4 className="text-xs font-bold font-mono tracking-widest text-teal-400 uppercase">
                [ SPECTROPHOTOMÉTRIE CHIMIQUE ]
              </h4>
              <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">SÉQUENÇAGE & INTERPOLATION TEXTURALE</p>
            </div>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[9px] text-teal-400/90 space-y-1.5 h-36 overflow-y-auto">
              {[
                "CONNEXION À LA SONDE OPTIQUE ISO 17025...",
                "CALIBRATION DU FAISCEAU LUMINEUX... OK",
                "MESURE DU PH ET DES DISSOLUTIONS IONIQUES...",
                "INTERPOLATION DES PARAMÈTRES N-P-K...",
                "PROJECTION SUR LE TRIANGLE TEXTURAL DE L'USDA...",
                "ÉVALUATION DU RISQUE CHIMIQUE & RECOMMENDATIONS...",
                "TRANSMISSION DE LA SYNTHÈSE AU COMPILER LIMS..."
              ].slice(0, scanLogIndex + 1).map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                  <span className={idx === scanLogIndex ? "animate-pulse text-white" : ""}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Viewport Top Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[9.5px] bg-slate-950 border border-slate-800 text-[#00f0ff] px-2 py-0.5 rounded font-mono font-bold tracking-wider">
            SLOT {(() => {
              const id = activeAnalysis.id;
              const rowIndex = Math.floor((id - 1) / 5);
              const colIndex = ((id - 1) % 5) + 1;
              return `${String.fromCharCode(65 + (rowIndex % 4))}${colIndex}`;
            })()}
          </span>
          <div>
            <h3 className="text-xs font-bold font-mono tracking-widest text-[#00f0ff] uppercase glow-cyan flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              CONSOLE {metadata.module === 'sol' ? 'SOL / FERTILITÉ' : 'ACQUISITION EAU'} #AN-{activeAnalysis.id.toString().padStart(4, '0')}
            </h3>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              CODE: {activeAnalysis.sample?.code ?? '—'} · STATUT : {activeAnalysis.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && ['Admin', 'Responsable'].includes(user.role) && (
            <button
              onClick={() => handleDeleteAnalysis(activeAnalysis.id)}
              className="p-1 hover:bg-rose-950/30 text-rose-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded transition-all"
              title="Supprimer la demande d'analyse"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-800 border border-slate-800 rounded text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7 Phases Stepper Header */}
      <div className="bg-slate-950 border-b border-slate-800 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 p-2 min-w-[700px]">
          {PHASES.map((ph, idx) => {
            const isCompleted = activePhase > ph.id;
            const isActive = activePhase === ph.id;
            return (
              <React.Fragment key={ph.id}>
                <button
                  type="button"
                  onClick={() => setActivePhase(ph.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase transition-all ${
                    isActive
                      ? 'bg-teal-500/10 text-[#00f0ff] border border-teal-500/30 shadow-[0_0_10px_rgba(0,240,255,0.05)]'
                      : isCompleted
                        ? 'text-teal-400/80 hover:text-teal-300'
                        : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] ${
                    isActive ? 'border-teal-400 bg-teal-950 text-[#00f0ff]' :
                    isCompleted ? 'border-teal-500 bg-teal-500 text-slate-950' : 'border-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : ph.id}
                  </span>
                  {ph.label}
                </button>
                {idx < PHASES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-800 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        
        {/* PHASE 1: RECEPTION DETAILS */}
        {activePhase === 1 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <User className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Informations Client</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={metadata.client_name}
                    onChange={e => setMetadata({ ...metadata, client_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    placeholder="ex: Rachid Bensalah"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={metadata.client_phone}
                    onChange={e => setMetadata({ ...metadata, client_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    placeholder="ex: +212 661-XXXXXX"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Email du client</label>
                  <input
                    type="email"
                    value={metadata.client_email}
                    onChange={e => setMetadata({ ...metadata, client_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    placeholder="ex: client@domaine.ma"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Société / Ferme (Optionnel)</label>
                  <input
                    type="text"
                    value={metadata.client_company}
                    onChange={e => setMetadata({ ...metadata, client_company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    placeholder="ex: Agropôle Souss"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <MapPin className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {metadata.module === 'sol' ? 'Localisation de la Parcelle' : 'Source de prélèvement'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {metadata.module === 'sol' ? (
                  <>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Région</label>
                      <input
                        type="text"
                        value={metadata.region}
                        onChange={e => setMetadata({ ...metadata, region: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: Souss-Massa"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Commune</label>
                      <input
                        type="text"
                        value={metadata.commune}
                        onChange={e => setMetadata({ ...metadata, commune: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: Taroudant"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Coordonnées GPS</label>
                      <input
                        type="text"
                        value={metadata.gps}
                        onChange={e => setMetadata({ ...metadata, gps: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: 30.4206° N, 8.8762° W"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Surface (Ha)</label>
                      <input
                        type="text"
                        value={metadata.surface}
                        onChange={e => setMetadata({ ...metadata, surface: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: 12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Culture Actuelle</label>
                      <input
                        type="text"
                        value={metadata.current_culture}
                        onChange={e => setMetadata({ ...metadata, current_culture: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: Blé"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Culture Prévue</label>
                      <input
                        type="text"
                        value={metadata.planned_culture}
                        onChange={e => setMetadata({ ...metadata, planned_culture: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: Maraîchage"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Source de l'eau</label>
                      <select
                        value={metadata.water_source}
                        onChange={e => setMetadata({ ...metadata, water_source: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      >
                        <option value="Puits">Puits</option>
                        <option value="Forage">Forage</option>
                        <option value="Barrage">Barrage</option>
                        <option value="Rivière">Rivière</option>
                        <option value="Réseau potable">Réseau potable</option>
                        <option value="Bassin">Bassin de stockage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Date/Heure prélèvement</label>
                      <input
                        type="datetime-local"
                        value={metadata.water_sample_time}
                        onChange={e => setMetadata({ ...metadata, water_sample_time: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Température de prélèvement (°C)</label>
                      <input
                        type="text"
                        value={metadata.water_temp}
                        onChange={e => setMetadata({ ...metadata, water_temp: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: 18.5"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <Calendar className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Traçabilité du Prélèvement</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Préleveur agréé</label>
                  <input
                    type="text"
                    value={metadata.sampler}
                    onChange={e => setMetadata({ ...metadata, sampler: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    placeholder="ex: Tech. Larbi"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Nombre d'échantillons du lot</label>
                  <input
                    type="number"
                    value={metadata.sample_count}
                    onChange={e => setMetadata({ ...metadata, sample_count: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Date prélèvement</label>
                  <input
                    type="date"
                    value={metadata.date_sample}
                    onChange={e => setMetadata({ ...metadata, date_sample: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Date réception labo</label>
                  <input
                    type="date"
                    value={metadata.date_reception}
                    onChange={e => setMetadata({ ...metadata, date_reception: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => { playSound('success'); setActivePhase(2); }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5"
              >
                Passer au Contrôle Qualité <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: QUALITY CONTROL CHECKLIST */}
        {activePhase === 2 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between text-teal-400">
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Critères d'acceptation réglementaires</span>
                <span className="text-[8px] bg-slate-950 text-slate-500 border border-slate-800 px-2 py-0.5 rounded font-mono">ISO 17025 CHECKLIST</span>
              </div>

              <div className="space-y-3.5">
                {metadata.module === 'sol' ? (
                  <>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Quantité de sol suffisante</span>
                        <span className="text-[9px] text-slate-500 font-mono">Volume minimum requis de 500 grammes</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_qty}
                        onChange={e => setMetadata({ ...metadata, qc_qty: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Identification claire</span>
                        <span className="text-[9px] text-slate-500 font-mono">Étiquette lisible et code barre valide</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_id}
                        onChange={e => setMetadata({ ...metadata, qc_id: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Zéro contamination grossière</span>
                        <span className="text-[9px] text-slate-500 font-mono">Absence de cailloux excessifs, plastique ou déchets</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_contamination}
                        onChange={e => setMetadata({ ...metadata, qc_contamination: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Humidité acceptable</span>
                        <span className="text-[9px] text-slate-500 font-mono">Pas de saturation d'eau liquide libre</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_humidity}
                        onChange={e => setMetadata({ ...metadata, qc_humidity: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Bouteille propre et étanche</span>
                        <span className="text-[9px] text-slate-500 font-mono">Flacon en PEHD ou verre stérile intact</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_bottle}
                        onChange={e => setMetadata({ ...metadata, qc_bottle: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Volume d'eau suffisant</span>
                        <span className="text-[9px] text-slate-500 font-mono">Volume de mesure adéquat pour la physico-chimie</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_volume}
                        onChange={e => setMetadata({ ...metadata, qc_volume: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Étiquette réglementaire</span>
                        <span className="text-[9px] text-slate-500 font-mono">Code d'identification unique lisible</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_label}
                        onChange={e => setMetadata({ ...metadata, qc_label: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Délai de transport respecté</span>
                        <span className="text-[9px] text-slate-500 font-mono">Arrivée au laboratoire sous 24h après prélèvement</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.qc_delay}
                        onChange={e => setMetadata({ ...metadata, qc_delay: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <Shield className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Décision de réception LIMS</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMetadata({ ...metadata, qc_decision: 'Accepte' })}
                  className={`p-3 rounded-lg border font-mono text-[10px] font-bold uppercase transition-all ${
                    metadata.qc_decision === 'Accepte'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✓ Accepté
                </button>
                <button
                  type="button"
                  onClick={() => setMetadata({ ...metadata, qc_decision: 'Refuse' })}
                  className={`p-3 rounded-lg border font-mono text-[10px] font-bold uppercase transition-all ${
                    metadata.qc_decision === 'Refuse'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✗ Refusé
                </button>
                <button
                  type="button"
                  onClick={() => setMetadata({ ...metadata, qc_decision: 'Re-prelevement' })}
                  className={`p-3 rounded-lg border font-mono text-[10px] font-bold uppercase transition-all ${
                    metadata.qc_decision === 'Re-prelevement'
                      ? 'bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚠ Re-prélèvement
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActivePhase(1)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => { playSound('success'); setActivePhase(3); }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5"
              >
                Passer à la Préparation <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: SAMPLE PREPARATION */}
        {activePhase === 3 && (
          <div className="space-y-4 max-w-xl mx-auto">
            {metadata.module === 'sol' ? (
              <>
                <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">Séchage en Étuve ventilée</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Date début séchage</label>
                      <input
                        type="date"
                        value={metadata.prep_drying_start}
                        onChange={e => setMetadata({ ...metadata, prep_drying_start: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Date fin séchage</label>
                      <input
                        type="date"
                        value={metadata.prep_drying_end}
                        onChange={e => setMetadata({ ...metadata, prep_drying_end: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Température de consigne (°C)</label>
                      <input
                        type="text"
                        value={metadata.prep_drying_temp}
                        onChange={e => setMetadata({ ...metadata, prep_drying_temp: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Technicien responsable</label>
                      <input
                        type="text"
                        value={metadata.prep_drying_tech}
                        onChange={e => setMetadata({ ...metadata, prep_drying_tech: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                        placeholder="ex: M. Alaoui"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                    <Beaker className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">Broyage, Tamisage & Homogénéisation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Type de broyeur utilisé</label>
                      <input
                        type="text"
                        value={metadata.prep_grinding_type}
                        onChange={e => setMetadata({ ...metadata, prep_grinding_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Maille du tamis (mm)</label>
                      <input
                        type="text"
                        value={metadata.prep_sieving_mesh}
                        onChange={e => setMetadata({ ...metadata, prep_sieving_mesh: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <label className="col-span-2 flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">Homogénéisation terminée</span>
                        <span className="text-[9px] text-slate-500 font-mono">Mélange quartage ou diviseur rotatif effectué</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={metadata.prep_homo_uniform}
                        onChange={e => setMetadata({ ...metadata, prep_homo_uniform: e.target.checked })}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                    <Star className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">Classification de Stockage</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Armoire</label>
                      <input
                        type="text"
                        value={metadata.prep_storage_cab}
                        onChange={e => setMetadata({ ...metadata, prep_storage_cab: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Étagère</label>
                      <input
                        type="text"
                        value={metadata.prep_storage_shelf}
                        onChange={e => setMetadata({ ...metadata, prep_storage_shelf: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Numéro du bac</label>
                      <input
                        type="text"
                        value={metadata.prep_storage_bin}
                        onChange={e => setMetadata({ ...metadata, prep_storage_bin: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl text-center space-y-4">
                <Beaker className="w-10 h-10 mx-auto text-teal-400" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Aucune préparation requise pour l'eau</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Les échantillons d'eau physico-chimiques ne nécessitent pas de phase de séchage ni de broyage mécanique. Ils sont transmis directement au banc d'analyses spectrophotométriques et potentiométriques.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActivePhase(2)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => { playSound('success'); setActivePhase(4); }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5"
              >
                Passer aux Analyses <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: PHYSICO-CHEMICAL ANALYSES */}
        {activePhase === 4 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* Left: Telemetry graphics (8 cols) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex border-b border-slate-800 pb-1.5 items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">LECTURES SPECTROMÉTRIQUES</span>
                <div className="flex gap-2 font-mono text-[9px]">
                  {metadata.module === 'sol' && (
                    <button
                      onClick={() => setChartTab('soil_triangle')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        chartTab === 'soil_triangle' ? 'bg-teal-500/10 text-[#00f0ff] border border-teal-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      TRIANGLE TEXTURE
                    </button>
                  )}
                  <button
                    onClick={() => setChartTab('spectrum')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      chartTab === 'spectrum' ? 'bg-teal-500/10 text-[#00f0ff] border border-teal-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SPECTRE MOLÉCULAIRE
                  </button>
                  <button
                    onClick={() => setChartTab('comparison')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      chartTab === 'comparison' ? 'bg-teal-500/10 text-[#00f0ff] border border-teal-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    CARTOGRAPHIE SEUILS
                  </button>
                </div>
              </div>

              {chartTab === 'soil_triangle' && metadata.module === 'sol' ? (
                <SoilTriangleSVG
                  clay={parseFloat(resultsForm['Argile'] || '0')}
                  silt={parseFloat(resultsForm['Limon'] || '0')}
                  sand={parseFloat(resultsForm['Sable'] || '0')}
                  isValid={Math.abs(parseFloat(resultsForm['Argile'] || '0') + parseFloat(resultsForm['Limon'] || '0') + parseFloat(resultsForm['Sable'] || '0') - 100) < 1.5}
                />
              ) : chartTab === 'spectrum' ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col h-[260px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                      SPECTROPHOTOMÉTRIE (ABSORBANCE COMPLÈTE)
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">Absorbance (AU) / Longueur d'onde (nm)</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    {/* Simulated spectrum chart based on parameters */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { nm: '400nm', val: 0.15 }, { nm: '440nm', val: 0.22 },
                        { nm: '480nm', val: 0.35 }, { nm: '520nm', val: 0.48 },
                        { nm: '560nm', val: 0.38 }, { nm: '600nm', val: 0.25 },
                        { nm: '640nm', val: 0.18 }, { nm: '680nm', val: 0.12 },
                        { nm: '720nm', val: 0.08 }
                      ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="nm" stroke="#475569" fontSize={8} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', fontSize: '9px' }} />
                        <Area type="monotone" dataKey="val" stroke="#2dd4bf" strokeWidth={1.8} fillOpacity={0.15} fill="#0f766e" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col h-[260px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase flex items-center gap-1 font-mono">
                      Écarts des seuils limites autorisés
                    </span>
                  </div>
                  <div className="flex-grow flex items-center justify-center text-slate-500 font-mono text-[10px]">
                    [Graphique de tolérance en cours de traitement]
                  </div>
                </div>
              )}

              {/* Water Specific Calculations Dashboard Panel */}
              {metadata.module === 'eau' && waterCalculations && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-4 gap-3 font-mono">
                  <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg text-center">
                    <span className="text-[7px] text-slate-500 block uppercase">Sodium Adsorp. Ratio (SAR)</span>
                    <span className="text-xs font-bold text-[#00f0ff] block mt-1">{waterCalculations.sar}</span>
                    <span className={`text-[7px] font-extrabold uppercase mt-0.5 inline-block px-1.5 py-0.2 rounded ${
                      waterCalculations.sarRating === 'Élevé' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                    }`}>{waterCalculations.sarRating}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg text-center">
                    <span className="text-[7px] text-slate-500 block uppercase">Sodium Résiduel (RSC)</span>
                    <span className="text-xs font-bold text-[#00f0ff] block mt-1">{waterCalculations.rsc}</span>
                    <span className="text-[7px] text-slate-400 block mt-0.5">meq/L</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg text-center">
                    <span className="text-[7px] text-slate-500 block uppercase">Dureté Totale (TH)</span>
                    <span className="text-xs font-bold text-[#00f0ff] block mt-1">{waterCalculations.hardness}</span>
                    <span className="text-[7px] text-slate-400 block mt-0.5">°fH (Sels Ca/Mg)</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg text-center border-l-2 border-l-amber-500/40">
                    <span className="text-[7px] text-slate-500 block uppercase">Classe Irrigation</span>
                    <span className="text-sm font-black text-amber-400 block mt-1">{waterCalculations.classification}</span>
                    <span className="text-[7px] text-slate-400 block mt-0.5">Qualité C-S</span>
                  </div>
                </div>
              )}

              {/* General telemetry status */}
              <div className="grid grid-cols-2 gap-4">
                <RiskGauge score={liveRiskScore} />
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-teal-400 font-mono tracking-wide">
                    <FileText className="w-4 h-4 text-teal-400" /> ALERTE PHYSICO-CHIMIQUE SGH
                  </div>
                  {activeHazards.length > 0 ? (
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto mt-2">
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
                  ) : (
                    <p className="text-xs text-slate-500 italic font-mono mt-2">
                      Aucun danger chimique (SGH) ou anomalie de seuils n'a été détecté.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Potentiometer calibration inputs (5 cols) */}
            <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-col gap-2 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#00f0ff] tracking-widest uppercase font-mono">
                    POTENTIOMÈTRES & SLIDERS LIMS
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">CALIBRAGE DIRECT</span>
                </div>
                
                {/* Calibration Presets */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {metadata.module === 'sol' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('soil_clay')}
                        className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        SOL ARGILEUX
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('soil_sandy')}
                        className="px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        SOL SABLEUX
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('soil_loam')}
                        className="px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        SOL FRANC
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('water_pure')}
                        className="px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        EAU CLAIRE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('water_saline')}
                        className="px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        EC SALINE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoCalibrate('water_polluted')}
                        className="px-2 py-0.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20 rounded-[4px] text-[8px] font-bold font-mono transition-all"
                      >
                        ACIDE/NITRATE
                      </button>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleStartScan} className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {activeAnalysis.parameters?.map(param => {
                  const meta = PARAM_CATALOGUE.find(p => p.key === param);
                  const rawVal = resultsForm[param] ?? '';
                  const { out, hint } = checkValueOutOfRange(param, rawVal);

                  const step = param === 'pH' || param === 'Zinc' || param === 'Matière organique' ? '0.05' : '1';

                  return (
                    <div key={param} className="flex flex-col gap-2.5 bg-[#090e17]/80 p-3 rounded-lg border border-slate-850 hover:border-teal-500/20 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-300 font-mono uppercase tracking-wider">
                          {meta ? paramIcon(meta.icon) : <TestTube className="w-3.5 h-3.5" />}
                          {meta?.label ?? param}
                        </label>
                        <div className="flex items-center gap-2">
                          {out && (
                            <span className="text-[8px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono animate-pulse">
                              ⚠ {hint}
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-black text-teal-400 bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded tracking-wide shadow-[0_0_8px_rgba(45,212,191,0.08)] min-w-[70px] text-center">
                            {rawVal ? `${parseFloat(rawVal).toFixed(2)}` : '—'} <span className="text-[8px] text-slate-500 font-normal">{meta?.unit}</span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="col-span-2">
                          {meta && (
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={meta.min}
                                max={meta.max}
                                step={step}
                                value={parseFloat(rawVal) || meta.min}
                                onChange={e => setResultsForm({ ...resultsForm, [param]: e.target.value })}
                                className="flex-grow accent-teal-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            value={rawVal}
                            onChange={e => setResultsForm({ ...resultsForm, [param]: e.target.value })}
                            className={`w-full px-2.5 py-1.5 bg-slate-950 border rounded-lg font-mono text-[11px] text-center text-slate-100 focus:outline-none transition-all ${
                              out
                                ? 'border-amber-500/50 bg-amber-950/20 text-amber-200 focus:border-amber-500'
                                : 'border-slate-800 focus:border-teal-500/50'
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-slate-850 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActivePhase(3)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00f0ff] hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    <Activity className="w-3.5 h-3.5" /> Lancer Scan Optique
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PHASE 5: VALIDATION & SIGNATURE */}
        {activePhase === 5 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Vérification des Rôles LIMS</span>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Confirmation du technicien</span>
                    <span className="text-[9px] text-slate-500 font-mono">Je certifie que les mesures sont exactes et étalonnées.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metadata.tech_verified}
                    onChange={e => setMetadata({ ...metadata, tech_verified: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Approbation du responsable</span>
                    <span className="text-[9px] text-slate-500 font-mono">Approbation finale de la conformité réglementaire.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={metadata.manager_approved}
                    onChange={e => setMetadata({ ...metadata, manager_approved: e.target.checked })}
                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between text-teal-400">
                <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Edit3 className="w-4 h-4" /> Tablette de Signature Électronique
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[9px] font-mono text-rose-400 hover:text-rose-300 uppercase cursor-pointer"
                >
                  Effacer
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden p-1 flex justify-center">
                <canvas
                  ref={canvasRef}
                  width="400"
                  height="160"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="bg-[#0b1329] rounded-lg max-w-full cursor-crosshair shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]"
                />
              </div>
              <p className="text-[8px] text-slate-500 font-mono text-center">
                Dessinez votre signature manuscrite à l'aide de votre souris ou de votre écran tactile. Elle sera intégrée au PDF officiel.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActivePhase(4)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => { playSound('success'); setActivePhase(6); }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5"
              >
                Générer les Recommandations <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 6: AUTOMATED RECOMMENDATIONS */}
        {activePhase === 6 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="border border-slate-800 bg-slate-900/50 p-5 rounded-2xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center gap-2 text-teal-400">
                <Shield className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Moteur de calcul de recommendations automatiques
                </span>
              </div>

              <div className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 border border-teal-500/10 rounded-lg flex items-start gap-2 text-xs font-mono text-teal-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActivePhase(5)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={executeValidationSubmit}
                disabled={isSubmitting || !metadata.tech_verified || !metadata.manager_approved}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                Enregistrer & Terminer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 7: FINAL PDF REPORT */}
        {activePhase === 7 && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="border border-slate-800 bg-slate-900/50 p-6 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-full border border-teal-500/30 bg-teal-950/30 flex items-center justify-center mx-auto text-teal-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-teal-400">
                Analyse enregistrée & Rapport final disponible
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                Toutes les phases du workflow (Réception, QC, Préparation, Sédimentation, Signature électronique) ont été auditées avec succès. Le certificat d'analyse officielle ISO 17025 est désormais consultable et téléchargeable.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(activeAnalysis)}
                  className="px-5 py-3 bg-[#00f0ff] hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 mx-auto shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  <Download className="w-4 h-4" /> Télécharger le PDF officiel
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => { playSound('success'); onClose(); }}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-mono text-slate-400 uppercase"
              >
                Fermer la console LIMS
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Laboratory Instrument Telemetry Footer */}
      <div className="h-10 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 shrink-0 font-mono text-[9px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            INSTRUMENTATION : CONNECTÉE
          </span>
          <span className="h-3 w-px bg-slate-800" />
          <span>LASER DIODE : PRÊT (532 nm)</span>
          <span className="h-3 w-px bg-slate-800" />
          <span>T° DE CUVE : 25.0 °C (CALIBRÉ)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>DÉBIT : 1.2 ml/min</span>
          <span className="h-3 w-px bg-slate-800" />
          <span className="text-[#00f0ff] uppercase">PROTOCOLE : ISO 17025 v4.0</span>
        </div>
      </div>
    </div>
  );
}
