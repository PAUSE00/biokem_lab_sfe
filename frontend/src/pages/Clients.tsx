import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Mail, Phone, Building, Layers } from 'lucide-react';
import api from '../services/api';
import { type Analysis } from '../components/analyses/types';

interface ClientItem {
  name: string;
  phone: string;
  email: string;
  company: string;
  sampleCount: number;
}

export default function Clients() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/api/analyses');
      setAnalyses(res.data || []);
    } catch {
      setError('Échec du chargement des clients.');
    } finally {
      setLoading(false);
    }
  };

  // Compute unique clients from analysis metadata
  const clientsList = useMemo(() => {
    const clientsMap: Record<string, ClientItem> = {};

    analyses.forEach(an => {
      const meta = an.sample?.metadata;
      if (meta && meta.client_name) {
        const key = meta.client_name.toLowerCase().trim();
        if (clientsMap[key]) {
          clientsMap[key].sampleCount += 1;
        } else {
          clientsMap[key] = {
            name: meta.client_name,
            phone: meta.client_phone || '—',
            email: meta.client_email || '—',
            company: meta.client_company || '—',
            sampleCount: 1
          };
        }
      }
    });

    return Object.values(clientsMap);
  }, [analyses]);

  const filtered = useMemo(() => {
    return clientsList.filter(c => {
      const q = searchTerm.toLowerCase();
      return !q
        || c.name.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || c.company.toLowerCase().includes(q);
    });
  }, [clientsList, searchTerm]);

  return (
    <div className="space-y-4 flex flex-col h-full flex-grow min-h-0 overflow-hidden">
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 uppercase font-mono">
            <Users className="w-5 h-5 text-[#00f0ff] animate-pulse" /> Registre des Clients
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Registre des entreprises agricoles, fermes et contacts des expéditeurs d'échantillons
          </p>
        </div>
      </div>

      {/* Table view */}
      <div className="flex-grow min-h-0 flex flex-col glass-panel border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#0d131f]/90 border-b border-[#1e293b] flex justify-between items-center gap-4 shrink-0">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, société..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#070b11] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-slate-500 font-mono"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {filtered.length} client(s) identifié(s)
          </span>
        </div>

        <div className="flex-grow overflow-y-auto bg-[#070b11]/20">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-[2px] border-[#00f0ff]/25 border-t-[#00f0ff] rounded-full animate-spin" />
              <span className="text-[11px] font-mono text-slate-400">Accès au registre des clients...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-rose-500 font-mono">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              Aucun client enregistré dans ce slot.
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b] border-collapse w-full">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#0d131f]/60 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Nom du Client</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Téléphone</div>
                <div className="col-span-3">Société / Ferme</div>
                <div className="col-span-1 text-right">Dossiers</div>
              </div>

              {/* Table body */}
              {filtered.map(c => (
                <div key={c.name} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 px-6 py-4 items-center text-xs text-slate-350 hover:bg-[#141b2a]/50 transition-all font-mono">
                  <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] font-bold text-[10px]">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-extrabold text-slate-100">{c.name}</span>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>

                  <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                    <span>{c.phone}</span>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex items-center gap-1.5 text-slate-450">
                    <Building className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                    <span className="truncate">{c.company}</span>
                  </div>

                  <div className="col-span-1 md:col-span-1 text-right flex md:block justify-between items-center">
                    <span className="md:hidden text-slate-500">Dossiers :</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-950/40 text-teal-400 border border-teal-900/30 font-bold text-[10px]">
                      <Layers className="w-3 h-3" /> {c.sampleCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
