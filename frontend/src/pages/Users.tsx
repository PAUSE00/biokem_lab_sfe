import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, Filter, MoreVertical, Shield, ShieldCheck, Mail, X } from 'lucide-react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Technicien', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data || []);
    } catch (err) {
      setError('Échec de la récupération des utilisateurs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/users', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'Technicien', password: '' });
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert('Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const isSpecial = role === 'Admin' || role === 'Administrateur';
    if (isSpecial) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/40 text-purple-400 border border-purple-800/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> 
          {role.toUpperCase()}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
        <Shield className="w-3.5 h-3.5 text-[#00f0ff]" /> 
        {role.toUpperCase()}
      </span>
    );
  };

  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[#00f0ff] animate-pulse" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">Gérer les accès, habilitations et rôles du personnel clinique</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00f0ff]/95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer font-mono"
        >
          <Plus className="w-5 h-5 mr-2 stroke-[3]" />
          NOUVEL UTILISATEUR
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-lg flex flex-col sm:flex-row gap-4 border border-[#1e293b]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur par nom, email ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-550 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
          />
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer font-mono">
          <Filter className="w-4 h-4 mr-2 text-[#00f0ff]" />
          FILTRES
        </button>
      </div>

      {/* Roster clinical list */}
      <div className="glass-panel rounded-lg border border-[#1e293b] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap font-mono">
            <thead className="bg-[#131b2e] border-b border-[#1e293b] text-slate-300 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Collaborateur</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rôle / Accès</th>
                <th className="px-6 py-4">Date d'inscription</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] bg-[#0d131f]/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin mb-4"></div>
                      Lecture de la base d'utilisateurs...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#ff2e63] bg-[#ff2e63]/5 font-bold">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <UsersIcon className="w-12 h-12 mx-auto text-slate-650 mb-3 animate-pulse" />
                    <p className="text-base font-bold text-white uppercase tracking-wider">Aucun collaborateur trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1e293b]/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 rounded-full flex items-center justify-center font-bold text-xs shadow-cyan-glow group-hover:scale-105 transition-transform">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-slate-200 group-hover:text-[#00f0ff] transition-colors">{user.name}</span>
                          <span className="block text-[10px] text-slate-500">ID: USR-{user.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-350">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-550" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-500 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors cursor-pointer">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Nouvel Utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel border border-[#1e293b] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-[#1e293b] flex justify-between items-center bg-[#0d131f]">
              <h3 className="font-mono font-bold text-white text-sm tracking-wide flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[#00f0ff]" />
                ENREGISTRER UN COLLABORATEUR
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono">
              <div>
                <label className="block text-xs font-bold text-[#00f0ff] mb-1.5 uppercase tracking-wider">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#00f0ff] mb-1.5 uppercase tracking-wider">Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all"
                  placeholder="jean@chemlab.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#00f0ff] mb-1.5 uppercase tracking-wider">Rôle *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Technicien">Technicien</option>
                    <option value="Admin">Administrateur</option>
                    <option value="Client">Client</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#00f0ff]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#00f0ff] mb-1.5 uppercase tracking-wider">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-655 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all"
                  placeholder="8 caractères minimum"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer uppercase tracking-wider font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-[#00f0ff] text-[#070b11] rounded-md hover:bg-[#00f0ff]/95 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer uppercase tracking-wider font-bold"
                >
                  {isSubmitting ? 'Création...' : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
