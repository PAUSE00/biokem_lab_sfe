import React from 'react';
import {
  Droplets, Wind, Zap, FlaskConical, Beaker, Thermometer, TestTube,
  Layers, Grid, Filter
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface Sample {
  id: number;
  code: string;
  type?: string;
  client_id?: number | null;
  technician_id?: number | null;
  parent_id?: number | null;
  status?: string;
  priority?: string;
  storage_location?: string;
  volume?: string;
  temp_condition?: string;
  temp_value?: number | null;
  sampled_at?: string | null;
  received_at?: string | null;
  description?: string | null;
  created_at?: string;
  client?: { id: number; name: string; role: string; email?: string };
  technician?: { id: number; name: string; role: string };
  metadata?: any;
}

export interface Technician {
  id: number;
  name: string;
  role: string;
}

export interface AnalysisResult {
  id: number;
  parameter: string;
  value: string;
  unit: string;
  is_anomaly: boolean;
  reference_min: number | null;
  reference_max: number | null;
}

export interface Analysis {
  id: number;
  sample_id: number;
  user_id: number | null;
  parameters: string[];
  status: string;
  created_at: string;
  validated_at?: string;
  risk_score: number | null;
  ai_recommendation: string | null;
  sample?: Sample;
  technician?: Technician;
  results?: AnalysisResult[];
  metadata?: any;
}

export interface Hazard {
  code: string;
  name: string;
  desc: string;
  color: string;
}

export const PARAM_CATALOGUE = [
  { key: 'pH',           label: 'pH',           unit: '',       min: 6.0,  max: 9.0,   icon: 'droplet', description: "Mesure de l'acidité ou de la basicité. Idéalement neutre." },
  { key: 'Turbidité',    label: 'Turbidité',    unit: 'NTU',    min: 0,    max: 5.0,   icon: 'wind',    description: "Mesure de la clarté. Indique la présence de matières en suspension." },
  { key: 'Conductivité', label: 'Conductivité', unit: 'µS/cm',  min: 0,    max: 1000,  icon: 'zap',     description: "Indicateur de minéralisation et de concentration saline." },
  { key: 'Nitrate',      label: 'Nitrate',      unit: 'mg/L',   min: 0,    max: 50.0,  icon: 'flask',   description: "Polluant chimique majeur d'origine agricole ou urbaine." },
  { key: 'Zinc',         label: 'Zinc (Zn)',    unit: 'mg/L',   min: 0,    max: 3.0,   icon: 'beaker',  description: "Traces de métaux lourds. Nocif à haute dose pour la faune." },
  { key: 'Température',  label: 'Température',  unit: '°C',     min: 10.0, max: 25.0,  icon: 'thermo',  description: "Impacte la solubilité de l'oxygène et la flore microbienne." },
  { key: 'Argile',        label: 'Argile',        unit: '%',      min: 0.0,  max: 100.0, icon: 'layers',  description: "Fraction granulométrique fine (< 2 µm) retenant l'eau et les nutriments." },
  { key: 'Limon',         label: 'Limon',         unit: '%',      min: 0.0,  max: 100.0, icon: 'grid',    description: "Fraction intermédiaire (2 - 50 µm) conférant une bonne texture au sol." },
  { key: 'Sable',         label: 'Sable',         unit: '%',      min: 0.0,  max: 100.0, icon: 'filter',  description: "Fraction grossière (50 µm - 2 mm) assurant l'aération et le drainage." },
  { key: 'Matière organique', label: 'Matière organique', unit: '%', min: 0.0, max: 10.0, icon: 'layers', description: "Taux de matière organique. Essentiel pour la structure et la fertilité du sol." },
  { key: 'Azote',        label: 'Azote (N)',    unit: 'ppm',    min: 0.0,  max: 200.0, icon: 'wind',    description: "Azote minéral disponible pour la croissance des plantes." },
  { key: 'Phosphore',    label: 'Phosphore (P)', unit: 'ppm',    min: 0.0,  max: 100.0, icon: 'flask',   description: "Phosphore assimilable indispensable au développement racinaire." },
  { key: 'Potassium',    label: 'Potassium (K)', unit: 'ppm',    min: 0.0,  max: 500.0, icon: 'beaker',  description: "Potassium échangeable régulant l'eau et la résistance de la plante." },
  { key: 'Calcium',      label: 'Calcium (Ca)',  unit: 'mg/L',   min: 0.0,  max: 1000.0, icon: 'beaker',  description: "Teneur en calcium. Important pour la structure du sol et la dureté de l'eau." },
  { key: 'Magnésium',    label: 'Magnésium (Mg)', unit: 'mg/L',   min: 0.0,  max: 500.0,  icon: 'beaker',  description: "Teneur en magnésium. Constituant de la chlorophylle et de la dureté." },
  { key: 'Sodium',       label: 'Sodium (Na)',   unit: 'mg/L',   min: 0.0,  max: 500.0,  icon: 'beaker',  description: "Teneur en sodium. Risque d'alcalinisation ou de sodisation." },
  { key: 'Calcaire total', label: 'Calcaire total', unit: '%',    min: 0.0,  max: 50.0,   icon: 'grid',    description: "Proportion totale de carbonate de calcium (CaCO3) du sol." },
  { key: 'CEC',          label: 'CEC',          unit: 'cmole/kg', min: 0.0, max: 50.0,  icon: 'layers',  description: "Capacité d'Échange Cationique du sol. Pouvoir de rétention des nutriments." },
  { key: 'TDS',          label: 'TDS',          unit: 'mg/L',   min: 0.0,  max: 2000.0, icon: 'zap',     description: "Total des Solides Dissous. Indicateur général de minéralisation." },
  { key: 'Chlorures',    label: 'Chlorures (Cl)', unit: 'mg/L',   min: 0.0,  max: 1000.0, icon: 'filter',  description: "Teneur en ions chlorures. Toxique pour les cultures à haute dose." },
  { key: 'Sulfates',     label: 'Sulfates (SO4)', unit: 'mg/L',   min: 0.0,  max: 500.0,  icon: 'filter',  description: "Teneur en sulfates. Source de soufre mais risque saline si excessive." },
  { key: 'Bicarbonates',  label: 'Bicarbonates (HCO3)', unit: 'mg/L', min: 0.0, max: 500.0, icon: 'filter', description: "Teneur en bicarbonates. Impacte l'alcalinité et le risque RSC." },
  { key: 'Carbonates',   label: 'Carbonates (CO3)', unit: 'mg/L', min: 0.0,  max: 100.0,  icon: 'filter',  description: "Teneur en carbonates libres dans l'eau." },
] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
export function paramIcon(icon: string) {
  const cls = 'w-3.5 h-3.5';
  switch (icon) {
    case 'droplet':  return React.createElement(Droplets, { className: cls });
    case 'wind':     return React.createElement(Wind, { className: cls });
    case 'zap':      return React.createElement(Zap, { className: cls });
    case 'flask':    return React.createElement(FlaskConical, { className: cls });
    case 'beaker':   return React.createElement(Beaker, { className: cls });
    case 'thermo':   return React.createElement(Thermometer, { className: cls });
    case 'layers':   return React.createElement(Layers, { className: cls });
    case 'grid':     return React.createElement(Grid, { className: cls });
    case 'filter':   return React.createElement(Filter, { className: cls });
    default:         return React.createElement(TestTube, { className: cls });
  }
}

export function riskColor(score: number) {
  if (score > 70) return { bg: 'bg-rose-950/20 text-rose-400 border-rose-500/30', bar: 'bg-rose-500', label: 'Critique' };
  if (score > 35) return { bg: 'bg-amber-950/20 text-amber-400 border-amber-500/30', bar: 'bg-amber-500', label: 'Modéré' };
  return { bg: 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500', label: 'Faible' };
}

export function getParamMeta(paramKey: string) {
  return PARAM_CATALOGUE.find(p => p.key.toLowerCase() === paramKey.toLowerCase()) ?? null;
}

export function getHazards(parameter: string, valueStr: string): Hazard | null {
  if (!valueStr || isNaN(parseFloat(valueStr))) return null;
  const val = parseFloat(valueStr);
  const param = parameter.toLowerCase();
  
  if (param.includes('ph')) {
    if (val < 4.5 || val > 9.5) {
      return {
        code: 'GHS05',
        name: 'Corrosif (GHS05)',
        desc: 'Substance hautement acide ou basique. Risque de brûlures chimiques majeures.',
        color: 'border-rose-950/20 bg-rose-950/10 text-rose-300'
      };
    }
  }
  if (param.includes('zinc') || param.includes('zn')) {
    if (val > 3.0) {
      return {
        code: 'GHS09',
        name: 'Polluant Environnemental (GHS09)',
        desc: 'Teneur excessive en métaux lourds. Toxique pour les organismes aquatiques.',
        color: 'border-amber-950/20 bg-amber-950/10 text-amber-300'
      };
    }
  }
  if (param.includes('nitrate') || param.includes('no3')) {
    if (val > 50.0) {
      return {
        code: 'GHS07',
        name: 'Nocif / Irritant (GHS07)',
        desc: 'Teneur critique en nitrates. Danger de méthémoglobinémie chez le nourrisson.',
        color: 'border-orange-950/20 bg-orange-950/10 text-orange-300'
      };
    }
  }
  return null;
}

export function checkValueOutOfRange(paramKey: string, rawValue: string): { out: boolean; hint: string } {
  const meta = PARAM_CATALOGUE.find(p => p.key === paramKey);
  if (!meta || rawValue === '') return { out: false, hint: '' };
  const v = parseFloat(rawValue);
  if (isNaN(v)) return { out: false, hint: '' };
  if (v < meta.min) return { out: true, hint: `Trop bas (min: ${meta.min} ${meta.unit})` };
  if (v > meta.max) return { out: true, hint: `Trop élevé (max: ${meta.max} ${meta.unit})` };
  return { out: false, hint: '' };
}
