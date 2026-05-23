import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Trash2, Edit3, Calendar, Truck, X } from 'lucide-react';
import api from '../services/api';

interface StockItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  expiry_date: string | null;
  supplier_name: string | null;
  created_at: string;
  updated_at: string;
}

export default function Stock() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'L',
    threshold: '',
    expiry_date: '',
    supplier_name: ''
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await api.get('/api/stock');
      setStockItems(response.data || []);
    } catch (err) {
      setError('Échec de la récupération des réactifs de stock.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: '',
      unit: 'L',
      threshold: '',
      expiry_date: '',
      supplier_name: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      threshold: item.threshold.toString(),
      expiry_date: item.expiry_date || '',
      supplier_name: item.supplier_name || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce réactif ? Cette action est irréversible.')) {
      return;
    }
    try {
      await api.delete(`/api/stock/${id}`);
      setStockItems(stockItems.filter(item => item.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression de l\'article de stock.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        threshold: parseFloat(formData.threshold),
        expiry_date: formData.expiry_date || null,
        supplier_name: formData.supplier_name || null
      };

      if (editingItem) {
        const response = await api.put(`/api/stock/${editingItem.id}`, payload);
        setStockItems(stockItems.map(item => item.id === editingItem.id ? response.data : item));
      } else {
        const response = await api.post('/api/stock', payload);
        setStockItems([...stockItems, response.data]);
      }
      setShowModal(false);
    } catch (err) {
      alert('Une erreur est survenue lors de l\'enregistrement de l\'article.');
    }
  };

  // Filtering stock items
  const filteredItems = stockItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.supplier_name && item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics
  const lowStockCount = stockItems.filter(item => Number(item.quantity) <= Number(item.threshold)).length;
  const expiredCount = stockItems.filter(item => item.expiry_date && new Date(item.expiry_date) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#00f0ff] animate-pulse" />
            Gestion des Stocks & Réactifs
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gérez le catalogue des réactifs chimiques, suivez les niveaux de stock et recevez des alertes automatiques</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un Réactif
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-lg flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00f0ff] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 font-mono uppercase tracking-wider">Total Réactifs</p>
            <p className="text-3xl font-black text-white font-mono">{stockItems.length}</p>
          </div>
          <div className="w-12 h-12 rounded-md bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center border border-[#00f0ff]/20 shadow-cyan-glow">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#ff2e63] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 font-mono uppercase tracking-wider">Alerte Stock Faible</p>
            <p className={`text-3xl font-black font-mono ${lowStockCount > 0 ? 'text-[#ff2e63] glow-rose' : 'text-slate-300'}`}>{lowStockCount}</p>
          </div>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center border transition-all ${
            lowStockCount > 0 
              ? 'bg-[#ff2e63]/10 text-[#ff2e63] border-[#ff2e63]/30 shadow-rose-glow' 
              : 'bg-[#1e293b] text-slate-500 border-[#1e293b]'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#f59e0b] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-400 font-mono uppercase tracking-wider">Produits Expirés / Périmés</p>
            <p className={`text-3xl font-black font-mono ${expiredCount > 0 ? 'text-[#f59e0b]' : 'text-slate-300'}`}>{expiredCount}</p>
          </div>
          <div className={`w-12 h-12 rounded-md flex items-center justify-center border transition-all ${
            expiredCount > 0 
              ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30' 
              : 'bg-[#1e293b] text-slate-500 border-[#1e293b]'
          }`}>
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-lg flex flex-col sm:flex-row gap-4 border border-[#1e293b]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom de réactif, fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
          />
        </div>
      </div>

      {/* Low Stock Alerts Highlight */}
      {lowStockCount > 0 && (
        <div className="bg-[#ff2e63]/5 border border-[#ff2e63]/20 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#ff2e63] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-[#ff2e63] glow-rose font-mono uppercase tracking-wider">Seuil critique atteint !</h4>
            <p className="text-xs text-slate-300 mt-1">Certains réactifs ont un niveau de stock inférieur ou égal au seuil minimum configuré. Veuillez passer commande auprès des fournisseurs correspondants.</p>
          </div>
        </div>
      )}

      {/* Stock Items Table */}
      <div className="glass-panel rounded-lg border border-[#1e293b] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#131b2e] border-b border-[#1e293b] text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                <th className="px-6 py-4">Nom du Réactif</th>
                <th className="px-6 py-4">Quantité Actuelle</th>
                <th className="px-6 py-4">Seuil Critique</th>
                <th className="px-6 py-4">Date d'Expiration</th>
                <th className="px-6 py-4">Fournisseur</th>
                <th className="px-6 py-4 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 bg-[#0d131f]/50">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin mb-4"></div>
                      Chargement des stocks...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#ff2e63] bg-[#ff2e63]/5 font-mono">
                    {error}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 bg-[#0d131f]/50">
                    <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    Aucun réactif ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.threshold);
                  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#1e293b]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 font-semibold font-mono ${isLow ? 'text-[#ff2e63] glow-rose' : 'text-slate-300'}`}>
                          {item.quantity} {item.unit}
                          {isLow && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ff2e63]/10 text-[#ff2e63] border border-[#ff2e63]/20 uppercase animate-pulse">ALERTE</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {item.threshold} {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        {item.expiry_date ? (
                          <span className={`inline-flex items-center gap-1.5 font-mono ${isExpired ? 'text-[#f59e0b] font-semibold' : 'text-slate-300'}`}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                            {isExpired && (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 uppercase">EXPIRÉ</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#00f0ff]" />
                          {item.supplier_name || 'Production Interne'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-[#ff2e63] hover:bg-[#ff2e63]/10 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#070b11]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d131f] rounded-lg border border-[#1e293b] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="px-6 py-4 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
              <h3 className="font-bold text-base text-white font-mono uppercase tracking-wider">
                {editingItem ? 'Modifier le Réactif' : 'Ajouter un Réactif'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Nom du Réactif *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Nitrate de Potassium (KNO₃)"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Quantité Actuelle *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex. 10.00"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Unité *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  >
                    <option className="bg-[#0d131f] text-white" value="L">Litre (L)</option>
                    <option className="bg-[#0d131f] text-white" value="mL">Millilitre (mL)</option>
                    <option className="bg-[#0d131f] text-white" value="g">Gramme (g)</option>
                    <option className="bg-[#0d131f] text-white" value="kg">Kilogramme (kg)</option>
                    <option className="bg-[#0d131f] text-white" value="pcs">Pièce (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Seuil de Sécurité *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex. 2.00"
                    value={formData.threshold}
                    onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Date d'Expiration</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Fournisseur</label>
                <input
                  type="text"
                  placeholder="Ex. Merck Life Sciences"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#070b11] border border-[#1e293b] rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all font-mono"
                />
              </div>

              <div className="pt-4 border-t border-[#1e293b] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-300 text-sm font-bold rounded-md transition-all cursor-pointer font-mono"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#00f0ff] text-[#070b11] text-sm font-bold rounded-md hover:bg-[#00d8e6] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 cursor-pointer font-mono"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
