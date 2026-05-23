import { useState, useEffect } from 'react';
import { Bell, Search, AlertCircle, CheckCircle2, MailOpen } from 'lucide-react';
import api from '../services/api';

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch {
      setError('Échec du chargement des notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch {
      alert('Erreur lors du marquage comme lu.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read_at);
      await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id}/read`)));
      await fetchNotifications();
      alert('Toutes les alertes ont été marquées comme lues.');
    } catch {
      alert('Erreur lors du traitement global.');
    }
  };

  const filtered = notifications.filter(n => {
    const q = searchTerm.toLowerCase();
    return !q || n.message.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Bell className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Centre d'Alertes & Télémesures Alarme
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Historique complet des anomalies de température, stocks critiques et retards d'analyses
          </p>
        </div>
        <button
          onClick={() => handleMarkAllRead()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-350 text-xs font-bold rounded-lg font-mono uppercase transition-all cursor-pointer"
        >
          <MailOpen className="w-3.5 h-3.5 text-[#00f0ff]" /> Tout marquer lu
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-grow min-h-0 flex flex-col glass-panel border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-3 bg-[#0d131f]/90 border-b border-[#1e293b] flex justify-between items-center gap-4 shrink-0">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1e293b]" />
            <input
              type="text"
              placeholder="Filtrer les messages d'alarme..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-550 font-mono"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {filtered.length} notification(s) affichée(s)
          </span>
        </div>

        <div className="flex-grow overflow-y-auto bg-[#070b11]/10 divide-y divide-[#1e293b]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              Interrogation des capteurs d'alertes...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-rose-500 font-mono">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              Aucune notification active.
            </div>
          ) : (
            filtered.map(n => {
              const isCrit = n.type.includes('critique') || n.type.includes('eleve');
              const Icon = isCrit ? AlertCircle : CheckCircle2;
              const iconColor = isCrit ? 'text-rose-400 bg-rose-950/40 border border-rose-900/30' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30';
              
              return (
                <div key={n.id} className={`p-4 flex items-start gap-4 hover:bg-[#141b2a]/30 transition-all ${!n.read_at ? 'bg-[#0f1523]/70' : 'opacity-60'}`}>
                  <div className={`p-1.5 rounded shrink-0 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono ${!n.read_at ? 'text-slate-100 font-bold' : 'text-slate-400'}`}>
                      {n.message}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                      Reçu le : {new Date(n.created_at).toLocaleString()} // Catégorie: {n.type}
                    </span>
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-slate-800 border border-slate-700 text-[#00f0ff] rounded text-[10px] font-mono font-bold cursor-pointer shrink-0"
                    >
                      Acquitter
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
