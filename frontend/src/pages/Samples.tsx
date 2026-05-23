import React, { useState, useEffect } from 'react';
import { Plus, Search, Activity, Scan, Table, Grid, Upload, Cpu, Thermometer } from 'lucide-react';
import api from '../services/api';

// Subcomponents
import SampleTableList from '../components/samples/SampleTableList';
import SampleCardGrid from '../components/samples/SampleCardGrid';
import SampleFormModal from '../components/samples/SampleFormModal';
import LabelDesignerModal from '../components/samples/LabelDesignerModal';
import AliquotSplitterModal from '../components/samples/AliquotSplitterModal';
import ResolveDeviationModal from '../components/samples/ResolveDeviationModal';
import CustodyTransferModal from '../components/samples/CustodyTransferModal';
import CustodyTimelineDrawer from '../components/samples/CustodyTimelineDrawer';
import QRScannerView from '../components/samples/QRScannerView';
import BulkImportView from '../components/samples/BulkImportView';
import StorageDashboardView from '../components/samples/StorageDashboardView';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Deviation {
  id: number;
  sample_id: number;
  type: string;
  parameter: string;
  expected_limit: string;
  actual_value: string;
  status: 'OPEN' | 'RESOLVED';
  comments: string | null;
  logged_by?: number | null;
  closed_by?: number | null;
  signature_data?: string | null;
  created_at: string;
  logged_by_user?: User;
  closed_by_user?: User;
}

interface Sample {
  id: number;
  code: string;
  client_id: number | null;
  technician_id: number | null;
  parent_id: number | null;
  status: 'Reçu' | 'En cours' | 'Terminé' | 'Anomalie';
  type: string;
  priority: 'Basse' | 'Normale' | 'Haute' | 'Critique';
  storage_location: string;
  volume: string;
  temp_condition: string;
  temp_value: number | null;
  sampled_at?: string | null;
  description: string | null;
  created_at: string;
  client?: User;
  technician?: User;
  aliquots?: Sample[];
  parent?: Sample | null;
  deviations?: Deviation[];
}

export default function Samples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'volume'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'list' | 'scanner' | 'bulk' | 'storage'>('list');

  // Modals / Selection States
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Custom design and process views
  const [isLabelCustomizerOpen, setIsLabelCustomizerOpen] = useState(false);
  const [selectedSampleForLabel, setSelectedSampleForLabel] = useState<Sample | null>(null);
  const [selectedGhsSymbols, setSelectedGhsSymbols] = useState<string[]>([]);
  
  const [isAliquotDrawerOpen, setIsAliquotDrawerOpen] = useState(false);
  const [selectedSampleForAliquots, setSelectedSampleForAliquots] = useState<Sample | null>(null);
  
  const [selectedDeviation, setSelectedDeviation] = useState<any | null>(null);
  const [transferSample, setTransferSample] = useState<Sample | null>(null);
  
  // Storage Telemetry occupancy state
  const [storageOccupancies, setStorageOccupancies] = useState<any[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);

  // QR Live camera scanner simulated state
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerResult, setScannerResult] = useState<string | null>(null);
  const [scannerCameraActive, setScannerCameraActive] = useState(false);

  // Bulk import states
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkSamples, setBulkSamples] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custody History Drawer State
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedSampleForHistory, setSelectedSampleForHistory] = useState<Sample | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    if (activeTab === 'storage') {
      fetchStorageOccupancy();
    }
  }, [activeTab]);

  const fetchSamples = async () => {
    try {
      const response = await api.get('/api/samples');
      setSamples(response.data || []);
    } catch (err) {
      setError('Échec de la récupération des échantillons.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageOccupancy = async () => {
    try {
      setStorageLoading(true);
      const response = await api.get('/api/storage/occupancy');
      setStorageOccupancies(response.data || []);
    } catch (err) {
      console.error('Failed to fetch storage occupancy statistics', err);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent, data: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedDesc = `[Checklist Réception: conteneur=${data.container_ok ? 'OK' : 'KO'}, étiquette=${data.label_ok ? 'OK' : 'KO'}, volume=${data.volume_ok ? 'OK' : 'KO'}, scellé=${data.seal_ok ? 'OK' : 'KO'}] ${data.description || ''}`;
      await api.post('/api/samples', {
        type: data.type,
        priority: data.priority,
        storage_location: data.storage_location || null,
        volume: data.volume || null,
        temp_condition: data.temp_condition,
        temp_value: data.temp_value ? parseFloat(data.temp_value) : null,
        sampled_at: data.sampled_at || null,
        description: parsedDesc
      });
      setIsCreateModalOpen(false);
      fetchSamples();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de l\'échantillon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent, data: any) => {
    e.preventDefault();
    if (!selectedSample) return;
    setIsSubmitting(true);
    try {
      const parsedDesc = `[Checklist Réception: conteneur=${data.container_ok ? 'OK' : 'KO'}, étiquette=${data.label_ok ? 'OK' : 'KO'}, volume=${data.volume_ok ? 'OK' : 'KO'}, scellé=${data.seal_ok ? 'OK' : 'KO'}] ${data.description || ''}`;
      await api.put(`/api/samples/${selectedSample.id}`, {
        client_id: selectedSample.client_id,
        technician_id: selectedSample.technician_id,
        status: data.status,
        type: data.type,
        priority: data.priority,
        storage_location: data.storage_location || null,
        volume: data.volume || null,
        temp_condition: data.temp_condition,
        temp_value: data.temp_value ? parseFloat(data.temp_value) : null,
        sampled_at: data.sampled_at || null,
        description: parsedDesc
      });
      setIsEditModalOpen(false);
      setSelectedSample(null);
      fetchSamples();
    } catch (err) {
      alert('Erreur lors de la modification de l\'échantillon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet échantillon ? Cela supprimera également ses analyses associées.')) return;
    try {
      await api.delete(`/api/samples/${id}`);
      fetchSamples();
    } catch (err) {
      alert('Impossible de supprimer l\'échantillon.');
    }
  };

  const handleQuickAssign = async (sample: Sample) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Veuillez vous reconnecter pour assigner un technicien.');
      return;
    }
    const loggedUser = JSON.parse(userStr);
    try {
      await api.put(`/api/samples/${sample.id}`, {
        client_id: sample.client_id,
        technician_id: loggedUser.id,
        status: 'En cours',
        type: sample.type,
        priority: sample.priority,
        storage_location: sample.storage_location,
        volume: sample.volume,
        temp_condition: sample.temp_condition,
        temp_value: sample.temp_value,
        sampled_at: sample.sampled_at,
        description: sample.description
      });
      fetchSamples();
    } catch (err) {
      alert('Erreur lors de l\'assignation rapide.');
    }
  };

  const handleSplitAliquots = async (aliquots: any[]) => {
    if (!selectedSampleForAliquots) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/samples/${selectedSampleForAliquots.id}/aliquots`, { aliquots });
      setIsAliquotDrawerOpen(false);
      setSelectedSampleForAliquots(null);
      fetchSamples();
      alert('Aliquotes générées avec succès !');
    } catch (err) {
      alert('Erreur lors de la génération des aliquotes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResolveDeviation = async (signature: string, comments: string) => {
    if (!selectedDeviation) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/deviations/${selectedDeviation.id}/resolve`, {
        comments,
        signature_data: signature
      });
      alert('Déviation de température résolue avec succès !');
      setSelectedDeviation(null);
      fetchSamples();
    } catch (err) {
      alert('Erreur lors de la résolution de la déviation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTransfer = async (signature: string, toPerson: string, notes: string) => {
    if (!transferSample) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/samples/${transferSample.id}/transfer`, {
        from_person: 'Technicien Connecté (ISO 17025)',
        to_person: toPerson,
        signature_data: signature,
        notes
      });
      alert('Transfert de responsabilité enregistré et signé !');
      setTransferSample(null);
      fetchSamples();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement du transfert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryDrawer = async (sample: Sample) => {
    setSelectedSampleForHistory(sample);
    setIsHistoryDrawerOpen(true);
    try {
      setHistoryLoading(true);
      const response = await api.get(`/api/samples/${sample.id}`);
      setHistoryLogs(response.data.custody_timeline || []);
    } catch (err) {
      console.error('Failed to load custody timeline', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const parseBulkText = (text: string) => {
    if (!text.trim()) {
      setBulkSamples([]);
      return;
    }
    const lines = text.split('\n');
    const parsed: any[] = [];
    lines.forEach((line) => {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2 || (parts.length === 1 && parts[0] === '')) return;

      const type = parts[0] || 'Eau Potable';
      const priority = parts[1] || 'Normale';
      const volume = parts[2] || '';
      const temp_condition = parts[3] || 'Température Ambiante';
      const temp_value = parts[4] || '';
      const storage_location = parts[5] || '';
      const description = parts[6] || '';

      const errors: string[] = [];
      if (!type) errors.push("Le type d'échantillon est requis.");
      if (!['Eau Potable', 'Eau Résiduaire', 'Sol / Terre', 'Alimentaire', 'Produit Chimique', 'Hydrocarbure', 'Autre'].includes(type)) {
        errors.push("Type d'échantillon invalide.");
      }
      if (!['Basse', 'Normale', 'Urgente', 'Critique'].includes(priority)) {
        errors.push('Priorité invalide.');
      }
      if (temp_value && isNaN(parseFloat(temp_value))) {
        errors.push('La température doit être un nombre.');
      }

      parsed.push({
        type,
        priority,
        storage_location,
        volume,
        temp_condition,
        temp_value,
        description,
        isValid: errors.length === 0,
        errors
      });
    });
    setBulkSamples(parsed);
  };

  const handleBulkSubmit = async () => {
    const validSamples = bulkSamples.filter(s => s.isValid);
    if (validSamples.length === 0) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/samples/bulk-import', {
        samples: validSamples.map(s => ({
          type: s.type,
          priority: s.priority,
          storage_location: s.storage_location,
          volume: s.volume,
          temp_condition: s.temp_condition,
          temp_value: s.temp_value ? parseFloat(s.temp_value) : null,
          sampled_at: new Date().toISOString(),
          description: s.description || null
        }))
      });
      alert(`${validSamples.length} échantillons importés avec succès !`);
      setBulkSamples([]);
      setBulkInputText('');
      fetchSamples();
      setActiveTab('list');
    } catch (err) {
      alert('Erreur lors de l\'importation en lot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper Badge Renderers
  const getPriorityBadge = (priority: string) => {
    const weights: Record<string, string> = {
      Critique: 'bg-rose-950/20 text-rose-400 border-rose-900/30 font-black',
      Haute: 'bg-amber-950/20 text-amber-400 border-amber-900/30 font-bold',
      Urgente: 'bg-amber-950/20 text-amber-400 border-amber-900/30 font-bold',
      Normale: 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30 font-medium',
      Basse: 'bg-slate-950/20 text-slate-400 border-slate-900/30 font-medium'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border uppercase ${weights[priority] || weights.Normale}`}>
        {priority}
      </span>
    );
  };

  const getTemperatureBadge = (condition: string | null | undefined, value: number | null | undefined) => {
    if (!condition) return null;
    let badgeColor = 'bg-slate-950/30 text-slate-400 border-slate-900/50';
    if (condition === 'Congelé') {
      badgeColor = 'bg-blue-950/20 text-blue-400 border-blue-900/30';
    } else if (condition === 'Réfrigéré') {
      badgeColor = 'bg-cyan-950/20 text-cyan-400 border-cyan-900/30';
    } else if (condition === 'Température Ambiante') {
      badgeColor = 'bg-amber-950/20 text-amber-400 border-amber-900/30';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border ${badgeColor}`}>
        <Thermometer className="w-3.5 h-3.5" /> {condition} {value !== null && value !== undefined ? `(${value}°C)` : ''}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Terminé: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30',
      'En cours': 'bg-sky-950/20 text-sky-400 border-sky-900/30',
      Reçu: 'bg-slate-950/20 text-slate-400 border-slate-900/30',
      Anomalie: 'bg-rose-950/20 text-rose-400 border-rose-900/30'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border uppercase font-bold ${map[status] || map.Reçu}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-950 border border-slate-800 text-slate-300">
      🔬 {type || 'Eau Potable'}
    </span>
  );

  const getAvatarBgColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['bg-[#00f0ff]/20 text-[#00f0ff]', 'bg-[#a3e625]/20 text-[#a3e625]', 'bg-rose-955/20 text-rose-400', 'bg-violet-955/20 text-violet-400'];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  };

  // Filter & Search Logic
  const filteredSamples = samples
    .filter(sample => {
      const matchesSearch =
        sample.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sample.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sample.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sample.priority || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || sample.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'priority') {
        const weights: Record<string, number> = { Critique: 4, Haute: 3, Urgente: 3, Normale: 2, Basse: 1 };
        return (weights[b.priority] || 2) - (weights[a.priority] || 2);
      }
      if (sortBy === 'volume') return (parseFloat(b.volume) || 0) - (parseFloat(a.volume) || 0);
      return 0;
    });

  const existingLocations = samples.map(s => s.storage_location).filter(Boolean);

  return (
    <div className="space-y-6 text-slate-300">
      {/* Telemetry Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-white font-mono flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400 animate-spin-slow" />
            CONSOLE DE TRAÇABILITÉ DES ÉCHANTILLONS
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Système d'enregistrement, d'étiquetage SGH et de chaîne de garde ISO 17025
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSample(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-555 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-cyan-600/10 border border-cyan-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ENREGISTRER UN FLACON
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-850 gap-2 font-mono">
        {[
          { id: 'list', label: 'Echantillons', icon: Table },
          { id: 'scanner', label: 'Lecteur Optique', icon: Scan },
          { id: 'bulk', label: 'Import en Lot', icon: Upload },
          { id: 'storage', label: 'Console Stockage', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-white bg-cyan-950/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-455 text-rose-400 text-xs font-bold flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main Tab Switcher */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Filters Area */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-855 p-4 rounded-xl shadow-md">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher par code, type, priorité, client..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-cyan-500/50 transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs w-full lg:w-auto">
              <div className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-955 bg-slate-950">
                {['All', 'Reçu', 'En cours', 'Terminé', 'Anomalie'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-2 border-r last:border-0 border-slate-800 transition-colors cursor-pointer ${
                      statusFilter === st ? 'bg-cyan-950/30 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'All' ? 'Tous' : st}
                  </button>
                ))}
              </div>

              <select
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none cursor-pointer hover:border-slate-700 transition-colors"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
                <option value="priority">Priorité</option>
                <option value="volume">Volume</option>
              </select>

              <div className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-955 bg-slate-950 shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors border-r border-slate-800 cursor-pointer ${
                    viewMode === 'table' ? 'bg-slate-900 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vue Tableau"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-slate-900 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Vue Cartes"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 bg-slate-900 border border-slate-855 rounded-xl">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
              <span className="text-xs text-slate-400 font-mono">Chargement de la base d'échantillons...</span>
            </div>
          ) : filteredSamples.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-850 rounded-xl font-mono text-slate-500">
              Aucun flacon enregistré dans cette catégorie.
            </div>
          ) : viewMode === 'table' ? (
            <SampleTableList
              samples={filteredSamples as any}
              activeDropdownId={activeDropdownId}
              setActiveDropdownId={setActiveDropdownId}
              onAssign={(s: any) => handleQuickAssign(s)}
              onShowQr={(s: any) => {
                setSelectedSampleForLabel(s);
                setIsLabelCustomizerOpen(true);
              }}
              onShowHistory={(s: any) => openHistoryDrawer(s)}
              onOpenEdit={(s: any) => {
                setSelectedSample(s);
                setIsEditModalOpen(true);
              }}
              onOpenAnalysis={() => {}}
              onOpenAliquots={(s: any) => {
                setSelectedSampleForAliquots(s);
                setIsAliquotDrawerOpen(true);
              }}
              onOpenLabel={(s: any) => {
                setSelectedSampleForLabel(s);
                setIsLabelCustomizerOpen(true);
              }}
              onOpenTransfer={(s: any) => setTransferSample(s)}
              onDelete={handleDelete}
              getPriorityBadge={getPriorityBadge}
              getTemperatureBadge={getTemperatureBadge}
            />
          ) : (
            <SampleCardGrid
              samples={filteredSamples as any}
              activeDropdownId={activeDropdownId}
              setActiveDropdownId={setActiveDropdownId}
              onQuickAssign={(s: any) => handleQuickAssign(s)}
              onShowQr={(s: any) => {
                setSelectedSampleForLabel(s);
                setIsLabelCustomizerOpen(true);
              }}
              onShowHistory={(s: any) => openHistoryDrawer(s)}
              onOpenEdit={(s: any) => {
                setSelectedSample(s);
                setIsEditModalOpen(true);
              }}
              onOpenAnalysis={() => {}}
              onOpenAliquots={(s: any) => {
                setSelectedSampleForAliquots(s);
                setIsAliquotDrawerOpen(true);
              }}
              onOpenLabel={(s: any) => {
                setSelectedSampleForLabel(s);
                setIsLabelCustomizerOpen(true);
              }}
              onOpenTransfer={(s: any) => setTransferSample(s)}
              onDelete={handleDelete}
              onSearchTerm={setSearchTerm}
              onSelectedDeviation={(dev: any) => setSelectedDeviation(dev)}
              getPriorityBadge={getPriorityBadge}
              getTypeBadge={getTypeBadge}
              getTemperatureBadge={getTemperatureBadge}
              getAvatarBgColor={getAvatarBgColor}
              getInitials={getInitials}
            />
          )}
        </div>
      )}

      {activeTab === 'scanner' && (
        <QRScannerView
          samples={samples as any}
          scannerLoading={scannerLoading}
          setScannerLoading={setScannerLoading}
          scannerResult={scannerResult}
          setScannerResult={setScannerResult}
          scannerCameraActive={scannerCameraActive}
          setScannerCameraActive={setScannerCameraActive}
          playBeep={playBeep}
          openHistoryDrawer={(s: any) => openHistoryDrawer(s)}
          openEditModal={(s: any) => {
            setSelectedSample(s);
            setIsEditModalOpen(true);
          }}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'bulk' && (
        <BulkImportView
          bulkInputText={bulkInputText}
          setBulkInputText={setBulkInputText}
          bulkSamples={bulkSamples}
          setBulkSamples={setBulkSamples}
          parseBulkText={parseBulkText}
          handleBulkSubmit={handleBulkSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {activeTab === 'storage' && (
        <StorageDashboardView
          storageLoading={storageLoading}
          storageOccupancies={storageOccupancies}
        />
      )}

      {/* Modal overlays */}
      {isCreateModalOpen && (
        <SampleFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          existingLocations={existingLocations}
        />
      )}

      {isEditModalOpen && selectedSample && (
        <SampleFormModal
          sample={selectedSample as any}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSample(null);
          }}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          existingLocations={existingLocations}
        />
      )}

      {isLabelCustomizerOpen && selectedSampleForLabel && (
        <LabelDesignerModal
          sample={selectedSampleForLabel as any}
          ghsSymbols={selectedGhsSymbols}
          onGhsToggle={(id) => {
            setSelectedGhsSymbols(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
          }}
          onClose={() => {
            setIsLabelCustomizerOpen(false);
            setSelectedSampleForLabel(null);
            setSelectedGhsSymbols([]);
          }}
        />
      )}

      {isAliquotDrawerOpen && selectedSampleForAliquots && (
        <AliquotSplitterModal
          sample={selectedSampleForAliquots as any}
          onClose={() => {
            setIsAliquotDrawerOpen(false);
            setSelectedSampleForAliquots(null);
          }}
          onSubmit={handleSplitAliquots}
          isSubmitting={isSubmitting}
          existingLocations={existingLocations}
        />
      )}

      {selectedDeviation && (
        <ResolveDeviationModal
          deviation={selectedDeviation as any}
          onClose={() => setSelectedDeviation(null)}
          onSubmit={submitResolveDeviation}
          isSubmitting={isSubmitting}
        />
      )}

      {transferSample && (
        <CustodyTransferModal
          sample={transferSample as any}
          fromPerson="Technicien Connecté (ISO 17025)"
          onClose={() => setTransferSample(null)}
          onSubmit={submitTransfer}
          isSubmitting={isSubmitting}
        />
      )}

      {isHistoryDrawerOpen && selectedSampleForHistory && (
        <CustodyTimelineDrawer
          onClose={() => {
            setIsHistoryDrawerOpen(false);
            setSelectedSampleForHistory(null);
            setHistoryLogs([]);
          }}
          sample={selectedSampleForHistory as any}
          historyLogs={historyLogs}
          historyLoading={historyLoading}
        />
      )}
    </div>
  );
}
