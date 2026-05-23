import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Wrench, ShieldCheck, Activity, Clock, User, AlertCircle, X } from 'lucide-react';
import api from '../services/api';

interface Equipment {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  status: 'Actif' | 'En maintenance' | 'En étalonnage' | 'Inactif';
  last_calibration_at: string | null;
  next_calibration_at: string | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
}

interface MaintenanceTask {
  id: number;
  equipment_id: number;
  type: 'Maintenance préventive' | 'Maintenance corrective' | 'Étalonnage / Calibration';
  description: string;
  scheduled_at: string;
  completed_at: string | null;
  status: 'Planifié' | 'En cours' | 'Terminé' | 'Annulé';
  technician_name: string;
  cost: number | null;
  notes: string | null;
  equipment?: Equipment;
}

export default function Planning() {
  const [activeTab, setActiveTab] = useState<'equipments' | 'tasks'>('equipments');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals / Forms States
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showScheduleTask, setShowScheduleTask] = useState(false);
  const [showCompleteTask, setShowCompleteTask] = useState<MaintenanceTask | null>(null);

  // New Equipment Form State
  const [newEqName, setNewEqName] = useState('');
  const [newEqModel, setNewEqModel] = useState('');
  const [newEqSerial, setNewEqSerial] = useState('');
  const [newEqStatus, setNewEqStatus] = useState<'Actif' | 'En maintenance' | 'En étalonnage' | 'Inactif'>('Actif');
  const [newEqLastCal, setNewEqLastCal] = useState('');
  const [newEqNextCal, setNewEqNextCal] = useState('');
  const [newEqLastMaint, setNewEqLastMaint] = useState('');
  const [newEqNextMaint, setNewEqNextMaint] = useState('');

  // New Task Form State
  const [newTaskEqId, setNewTaskEqId] = useState('');
  const [newTaskType, setNewTaskType] = useState<'Maintenance préventive' | 'Maintenance corrective' | 'Étalonnage / Calibration'>('Maintenance préventive');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTech, setNewTaskTech] = useState('');
  const [newTaskCost, setNewTaskCost] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<'Planifié' | 'En cours' | 'Terminé'>('Planifié');

  // Complete Task Form State
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeCost, setCompleteCost] = useState('');
  const [completeDate, setCompleteDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, taskRes] = await Promise.all([
        api.get('/api/equipments'),
        api.get('/api/maintenance-tasks')
      ]);

      setEquipments(eqRes.data || []);
      setTasks(taskRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/equipments', {
        name: newEqName,
        model: newEqModel,
        serial_number: newEqSerial,
        status: newEqStatus,
        last_calibration_at: newEqLastCal || null,
        next_calibration_at: newEqNextCal || null,
        last_maintenance_at: newEqLastMaint || null,
        next_maintenance_at: newEqNextMaint || null,
      });

      setShowAddEquipment(false);
      // Reset form
      setNewEqName('');
      setNewEqModel('');
      setNewEqSerial('');
      setNewEqLastCal('');
      setNewEqNextCal('');
      setNewEqLastMaint('');
      setNewEqNextMaint('');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la création de l\'équipement. Veuillez vérifier les champs (notamment le numéro de série unique).');
    }
  };

  const handleScheduleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/maintenance-tasks', {
        equipment_id: parseInt(newTaskEqId),
        type: newTaskType,
        description: newTaskDesc,
        scheduled_at: newTaskDate,
        technician_name: newTaskTech,
        cost: newTaskCost ? parseFloat(newTaskCost) : null,
        notes: newTaskNotes || null,
        status: newTaskStatus
      });

      setShowScheduleTask(false);
      // Reset form
      setNewTaskEqId('');
      setNewTaskDesc('');
      setNewTaskDate('');
      setNewTaskTech('');
      setNewTaskCost('');
      setNewTaskNotes('');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la planification de la tâche.');
    }
  };

  const handleCompleteTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompleteTask) return;
    try {
      await api.put(`/api/maintenance-tasks/${showCompleteTask.id}`, {
        status: 'Terminé',
        completed_at: completeDate,
        cost: completeCost ? parseFloat(completeCost) : showCompleteTask.cost,
        notes: completeNotes || showCompleteTask.notes
      });

      setShowCompleteTask(null);
      setCompleteNotes('');
      setCompleteCost('');
      fetchData();
    } catch (err) {
      alert('Erreur lors de la validation de la tâche.');
    }
  };

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'Actif':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30 glow-lime"><CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> Actif</span>;
      case 'En maintenance':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><Wrench className="w-3.5 h-3.5" /> En maintenance</span>;
      case 'En étalonnage':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 glow-cyan"><ShieldCheck className="w-3.5 h-3.5" /> En étalonnage</span>;
      case 'Inactif':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30"><AlertCircle className="w-3.5 h-3.5" /> Inactif</span>;
    }
  };

  const getTaskStatusBadge = (status: MaintenanceTask['status']) => {
    switch (status) {
      case 'Terminé':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30 glow-lime">Terminé</span>;
      case 'En cours':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">En cours</span>;
      case 'Planifié':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 glow-cyan">Planifié</span>;
      case 'Annulé':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff2e63]/15 text-[#ff2e63] border border-[#ff2e63]/30 glow-rose">Annulé</span>;
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white glow-cyan">Planification & Maintenance</h1>
          <p className="text-sm text-slate-400 mt-1">Gérez le parc d'équipements de laboratoire et suivez les étalonnages et maintenances</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddEquipment(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Équipement
          </button>
          <button 
            onClick={() => {
              if (equipments.length === 0) {
                alert('Veuillez d\'abord ajouter un équipement.');
                return;
              }
              setShowScheduleTask(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#0d131f] border border-[#00f0ff]/30 text-[#00f0ff] text-sm font-bold rounded-md hover:bg-[#00f0ff]/10 hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] transition-all duration-300"
          >
            <Calendar className="w-4 h-4 mr-2 text-[#00f0ff]" />
            Planifier Intervention
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e293b]">
        <button
          onClick={() => setActiveTab('equipments')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'equipments'
              ? 'border-[#00f0ff] text-[#00f0ff] glow-cyan'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Équipements ({equipments.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
            activeTab === 'tasks'
              ? 'border-[#00f0ff] text-[#00f0ff] glow-cyan'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Calendrier & Tâches ({tasks.length})
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin mb-4"></div>
            Chargement des données...
          </div>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-[#ff2e63] bg-[#ff2e63]/10 border border-[#ff2e63]/25 rounded-md">
          {error}
        </div>
      ) : activeTab === 'equipments' ? (
        /* EQUIPMENTS LIST VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {equipments.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 glass-panel rounded-lg">
              <Activity className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
              <p className="text-base font-bold text-slate-300">Aucun équipement enregistré</p>
              <p className="text-sm mt-1 text-slate-500">Ajoutez votre premier appareil de mesure pour démarrer le suivi.</p>
            </div>
          ) : (
            equipments.map((eq) => (
              <div key={eq.id} className="glass-panel rounded-lg p-6 flex flex-col glass-panel-hover transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{eq.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Modèle: <span className="font-semibold text-slate-300">{eq.model}</span> | S/N: <span className="font-semibold text-[#00f0ff]">{eq.serial_number}</span></p>
                  </div>
                  {getStatusBadge(eq.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-[#131b2e]/50 border border-[#1e293b] rounded-lg">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider font-mono text-[#00f0ff]">Étalonnage</span>
                    <div className="mt-1 space-y-1 font-mono">
                      <p className="text-xs text-slate-400">Dernier: <span className="font-medium text-slate-200">{eq.last_calibration_at ? new Date(eq.last_calibration_at).toLocaleDateString() : 'N/A'}</span></p>
                      <p className="text-xs text-slate-400">Prochain: <span className="font-medium text-slate-200">{eq.next_calibration_at ? new Date(eq.next_calibration_at).toLocaleDateString() : 'N/A'}</span></p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider font-mono text-amber-400">Maintenance</span>
                    <div className="mt-1 space-y-1 font-mono">
                      <p className="text-xs text-slate-400">Dernière: <span className="font-medium text-slate-200">{eq.last_maintenance_at ? new Date(eq.last_maintenance_at).toLocaleDateString() : 'N/A'}</span></p>
                      <p className="text-xs text-slate-400">Prochaine: <span className="font-medium text-slate-200">{eq.next_maintenance_at ? new Date(eq.next_maintenance_at).toLocaleDateString() : 'N/A'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#1e293b] flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Cycle recommandé : 6 mois
                  </div>
                  <button 
                    onClick={() => {
                      setNewTaskEqId(eq.id.toString());
                      setShowScheduleTask(true);
                    }}
                    className="text-xs font-bold text-[#00f0ff] hover:text-[#00d8e6] transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Planifier maintenance
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* TASKS / CALENDAR VIEW */
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#131b2e]/60 border-b border-[#1e293b] text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider font-mono">
                  <th className="py-4 px-6">Équipement</th>
                  <th className="py-4 px-6">Type d'Intervention</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Prévu le</th>
                  <th className="py-4 px-6">Responsable</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-sm text-slate-300">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Calendar className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                      Aucune intervention planifiée.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#1a2333]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{task.equipment?.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{task.equipment?.serial_number}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                          task.type === 'Étalonnage / Calibration' ? 'text-[#00f0ff] glow-cyan' : task.type === 'Maintenance corrective' ? 'text-[#ff2e63] glow-rose' : 'text-slate-300'
                        }`}>
                          {task.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <div className="text-slate-300 truncate" title={task.description}>{task.description}</div>
                        {task.notes && <div className="text-[11px] text-slate-400 italic mt-1 truncate font-mono">Note: {task.notes}</div>}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-300 font-mono">
                        {new Date(task.scheduled_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px] font-semibold">{task.technician_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getTaskStatusBadge(task.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {task.status !== 'Terminé' && task.status !== 'Annulé' && (
                          <button 
                            onClick={() => setShowCompleteTask(task)}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-[#a3e635] text-[#070b11] text-xs font-bold rounded-lg hover:bg-[#8ecb2c] hover:shadow-[0_0_10px_rgba(163,230,53,0.3)] transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Réalisé
                          </button>
                        )}
                        {task.status === 'Terminé' && (
                          <span className="text-xs font-bold text-slate-500 italic font-mono">
                            Terminé le {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD EQUIPMENT */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d131f] rounded-lg border border-[#1e293b] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#00f0ff]" /> Nouvel Équipement
              </h3>
              <button onClick={() => setShowAddEquipment(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEquipmentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Nom de l'appareil *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. pH-mètre de paillasse"
                    value={newEqName}
                    onChange={(e) => setNewEqName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Modèle / Marque *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Shimadzu UV-1900i"
                    value={newEqModel}
                    onChange={(e) => setNewEqModel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Numéro de Série *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. S/N-PH-2024"
                    value={newEqSerial}
                    onChange={(e) => setNewEqSerial(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Statut Initial *</label>
                  <select 
                    value={newEqStatus} 
                    onChange={(e) => setNewEqStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  >
                    <option className="bg-[#0d131f] text-white" value="Actif">Actif</option>
                    <option className="bg-[#0d131f] text-white" value="En maintenance">En maintenance</option>
                    <option className="bg-[#0d131f] text-white" value="En étalonnage">En étalonnage</option>
                    <option className="bg-[#0d131f] text-white" value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e293b] grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Dernier Étalonnage</label>
                  <input 
                    type="date" 
                    value={newEqLastCal}
                    onChange={(e) => setNewEqLastCal(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Prochain Étalonnage</label>
                  <input 
                    type="date" 
                    value={newEqNextCal}
                    onChange={(e) => setNewEqNextCal(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Dernière Maintenance</label>
                  <input 
                    type="date" 
                    value={newEqLastMaint}
                    onChange={(e) => setNewEqLastMaint(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Prochaine Maintenance</label>
                  <input 
                    type="date" 
                    value={newEqNextMaint}
                    onChange={(e) => setNewEqNextMaint(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#1e293b]">
                <button 
                  type="button" 
                  onClick={() => setShowAddEquipment(false)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300"
                >
                  Créer Équipement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE TASK */}
      {showScheduleTask && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d131f] rounded-lg border border-[#1e293b] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#00f0ff]" /> Planifier Intervention
              </h3>
              <button onClick={() => setShowScheduleTask(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleTaskSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Équipement concerné *</label>
                  <select 
                    required
                    value={newTaskEqId}
                    onChange={(e) => setNewTaskEqId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  >
                    <option className="bg-[#0d131f] text-slate-400" value="">-- Sélectionner un appareil --</option>
                    {equipments.map(eq => (
                      <option key={eq.id} className="bg-[#0d131f] text-white" value={eq.id}>{eq.name} ({eq.serial_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Type d'Intervention *</label>
                  <select 
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  >
                    <option className="bg-[#0d131f] text-white" value="Maintenance préventive">Maintenance préventive</option>
                    <option className="bg-[#0d131f] text-white" value="Maintenance corrective">Maintenance corrective</option>
                    <option className="bg-[#0d131f] text-white" value="Étalonnage / Calibration">Étalonnage / Calibration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Date prévue *</label>
                  <input 
                    type="date" 
                    required
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Description *</label>
                  <textarea 
                    required 
                    rows={3}
                    placeholder="Détails de l'intervention à réaliser..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Technicien assigné *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Yassine Touimi"
                    value={newTaskTech}
                    onChange={(e) => setNewTaskTech(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Coût estimé (€)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 150"
                    value={newTaskCost}
                    onChange={(e) => setNewTaskCost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Statut de départ</label>
                  <select 
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  >
                    <option className="bg-[#0d131f] text-white" value="Planifié">Planifié</option>
                    <option className="bg-[#0d131f] text-white" value="En cours">En cours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#1e293b]">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleTask(false)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300"
                >
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE TASK */}
      {showCompleteTask && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d131f] rounded-lg border border-[#1e293b] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#a3e635]" /> Valider l'Intervention
              </h3>
              <button onClick={() => setShowCompleteTask(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCompleteTaskSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-300">
                  Vous marquez l'intervention sur <span className="font-bold text-[#00f0ff]">{showCompleteTask.equipment?.name}</span> comme <span className="text-[#a3e635] font-bold glow-lime">Terminée</span>.
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Les dates de l'appareil seront automatiquement mises à jour.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Date de réalisation *</label>
                <input 
                  type="date" 
                  required
                  value={completeDate}
                  onChange={(e) => setCompleteDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Coût Réel (€)</label>
                <input 
                  type="number" 
                  placeholder={showCompleteTask.cost ? showCompleteTask.cost.toString() : "e.g. 150"}
                  value={completeCost}
                  onChange={(e) => setCompleteCost(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Observations / Rapport d'intervention</label>
                <textarea 
                  rows={3}
                  placeholder="Notes techniques sur les résultats..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#1e293b]">
                <button 
                  type="button" 
                  onClick={() => setShowCompleteTask(null)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#a3e635] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#8ecb2c] hover:shadow-[0_0_15px_rgba(163,230,53,0.4)] transition-all duration-300"
                >
                  Confirmer la réalisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
