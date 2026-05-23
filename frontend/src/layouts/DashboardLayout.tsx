import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Beaker, Home, Users, LogOut, FileText, Activity, Bell, AlertCircle, CheckCircle2, Calendar, Package, History, Radio, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import LaboratoryBackground from '../components/LaboratoryBackground';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [systemUptime, setSystemUptime] = useState('00:00:00');
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    
    // Simulate system clock/uptime ticker for scientific telemetry feel
    const startTime = Date.now();
    const clockInterval = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setSystemUptime(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      const data = response.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read_at).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // Base navigation menu items
  const menuItems = [
    { icon: Home, label: 'Tableau de Bord', path: '/dashboard', roles: ['Admin', 'Responsable', 'Technicien'] },
    { icon: Beaker, label: 'Échantillons', path: '/samples', roles: ['Admin', 'Responsable', 'Technicien'] },
    { icon: Activity, label: 'Analyses', path: '/analyses', roles: ['Admin', 'Responsable', 'Technicien'] },
    { icon: FileText, label: 'Rapports', path: '/reports', roles: ['Admin', 'Responsable', 'Technicien'] },
    { icon: Calendar, label: 'Planification', path: '/planning', roles: ['Admin', 'Responsable', 'Technicien'] },
    { icon: Package, label: 'Stocks & Réactifs', path: '/stock', roles: ['Admin', 'Responsable'] },
    { icon: History, label: 'Registre d\'Audit', path: '/audit', roles: ['Admin', 'Responsable'] },
    { icon: Users, label: 'Utilisateurs', path: '/users', roles: ['Admin'] },
  ];

  // Filter menu items by active user role
  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#070b11] text-slate-100 font-sans antialiased relative overflow-hidden">
      <LaboratoryBackground />
      
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-60'} bg-[#0d131f]/80 backdrop-blur-md border-r border-[#1e293b] flex flex-col z-20 shrink-0 transition-all duration-300`}>
        {/* Brand Header */}
        {!isCollapsed ? (
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-2 rounded-lg text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)] animate-pulse">
                <Beaker className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-wider text-[#00f0ff] glow-cyan">CHEMLAB LIMS</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">CORE CONSOLE V4.2</span>
              </div>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-1 rounded bg-slate-900 border border-[#1e293b] text-slate-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-all cursor-pointer shadow-[0_0_5px_rgba(0,0,0,0.5)]"
              title="Réduire le menu"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="h-14 flex items-center justify-center border-b border-[#1e293b]">
            <button 
              onClick={toggleSidebar} 
              className="p-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all cursor-pointer relative group shadow-[0_0_10px_rgba(0,240,255,0.1)]"
            >
              <Beaker className="w-4 h-4 animate-pulse" />
              <span className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0d131f] border border-[#1e293b] text-[9px] text-[#00f0ff] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 shadow-2xl">
                Développer le menu
              </span>
            </button>
          </div>
        )}

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2 mb-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Main Modules
            </div>
          )}
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-lg text-xs font-bold transition-all duration-300 relative ${
                  isActive
                    ? 'bg-[#00f0ff] text-[#070b11] shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold'
                    : 'text-slate-400 hover:bg-[#151c2c] hover:text-[#00f0ff]'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0d131f] border border-[#1e293b] text-[9px] text-slate-200 font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 shadow-2xl">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout section */}
        <div className={`p-4 border-t border-[#1e293b] bg-[#090e18]/60 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={logout}
            className={`group flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 w-full rounded-lg text-xs font-bold text-slate-400 hover:bg-rose-500/10 hover:text-[#ff2e63] border border-transparent hover:border-[#ff2e63]/25 transition-all duration-300 cursor-pointer relative`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Déconnexion</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-3 px-2 py-1 rounded bg-[#0d131f] border border-[#1e293b] text-[9px] text-[#ff2e63] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 shadow-2xl">
                Déconnexion
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#0d131f]/75 backdrop-blur-md border-b border-[#1e293b] flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-mono font-bold text-[#00f0ff]/95 text-[10px] tracking-widest uppercase glow-cyan">
              LIMS INFOLAB OPERATING TERMINAL // ISO 17025
            </h2>
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#00f0ff]/5 border border-[#00f0ff]/20 font-mono text-[9px] text-[#00f0ff]/80">
              <Radio className="w-3 h-3 animate-pulse text-[#a3e635]" />
              <span>ONLINE // UPTIME: {systemUptime}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Notification alert bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 border border-[#1e293b] bg-[#131b2b]/50 text-slate-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 rounded-lg transition-all relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff2e63] rounded-full animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-24 top-11 w-80 bg-[#0d131f] rounded-lg shadow-2xl border border-[#1e293b] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 bg-[#131b2e] border-b border-[#1e293b] flex justify-between items-center">
                  <span className="font-mono font-bold text-[#00f0ff] text-[10px] uppercase tracking-wider">Alerts & Notifications ({unreadCount})</span>
                  <button onClick={() => setShowNotifications(false)} className="text-[9px] text-[#00f0ff] font-bold hover:underline">Fermer</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#1e293b]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 font-mono text-[10px]">Aucune télémesure d'alerte en cours.</div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = n.type.includes('critique') || n.type.includes('eleve') ? AlertCircle : CheckCircle2;
                      const iconColor = n.type.includes('critique') || n.type.includes('eleve') ? 'text-[#ff2e63] bg-[#ff2e63]/10 border border-[#ff2e63]/25' : 'text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/25';
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => !n.read_at && handleMarkAsRead(n.id)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-[#141b2a] transition-all ${!n.read_at ? 'bg-[#0f1523]' : 'opacity-50'}`}
                        >
                          <div className={`p-1.5 rounded shrink-0 mt-0.5 ${iconColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] leading-relaxed font-sans ${!n.read_at ? 'text-slate-100 font-bold' : 'text-slate-400'}`}>{n.message}</p>
                            <span className="text-[9px] font-mono text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Profile widget */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-[#1e293b]">
                <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] font-mono text-xs font-black shadow-[0_0_8px_rgba(0,240,255,0.15)]">
                  {getInitials(user.name)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-200 leading-none">{user.name}</span>
                  <span className="text-[9px] font-mono text-slate-500 font-semibold mt-1 tracking-wider leading-none uppercase">{user.role}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-grow overflow-hidden p-5 relative z-10 flex flex-col min-h-0">
          <div className="w-full max-w-[1500px] mx-auto flex-grow flex flex-col min-h-0 animate-in fade-in duration-300">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
