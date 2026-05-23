import { Activity, AlertCircle, Beaker, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    total_analyses: 0,
    pending_validation: 0,
    conformity_rate: 0,
    active_samples: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState<{title: string, subtitle: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [kpisRes, chartsRes] = await Promise.all([
        api.get('/api/dashboard/kpis'),
        api.get('/api/dashboard/charts')
      ]);
      
      setKpis(kpisRes.data);
      setChartData(chartsRes.data.evolution || []);
      setRecentActivity(chartsRes.data.recent_activity || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const stats = [
    { 
      title: 'Analyses Totalisées', 
      value: kpis.total_analyses.toString(), 
      icon: Activity, 
      trend: '+12%', 
      color: 'text-[#00f0ff]', 
      borderColor: 'border-[#00f0ff]/30',
      glowClass: 'glow-cyan', 
      bg: 'bg-[#00f0ff]/5' 
    },
    { 
      title: 'Attente Validation', 
      value: kpis.pending_validation.toString(), 
      icon: AlertCircle, 
      trend: 'Action requise', 
      color: 'text-[#ff2e63]', 
      borderColor: 'border-[#ff2e63]/30',
      glowClass: 'glow-rose', 
      bg: 'bg-[#ff2e63]/5' 
    },
    { 
      title: 'Taux de Conformité', 
      value: `${kpis.conformity_rate}%`, 
      icon: CheckCircle2, 
      trend: '+2.4%', 
      color: 'text-[#a3e635]', 
      borderColor: 'border-[#a3e635]/30',
      glowClass: 'glow-lime', 
      bg: 'bg-[#a3e635]/5' 
    },
    { 
      title: 'Échantillons Actifs', 
      value: kpis.active_samples.toString(), 
      icon: Beaker, 
      trend: 'En cours', 
      color: 'text-[#f59e0b]', 
      borderColor: 'border-[#f59e0b]/30',
      glowClass: 'glow-orange', 
      bg: 'bg-[#f59e0b]/5' 
    },
  ];

  // Custom tool tip for the area chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-lg border border-[#1e293b] text-xs font-mono">
          <p className="text-slate-400 mb-1.5 uppercase font-bold tracking-wider">{`Index: ${label}`}</p>
          <p className="text-[#00f0ff] font-bold">
            <span className="inline-block w-2 h-2 rounded bg-[#00f0ff] mr-1.5" />
            {`Analyses: ${payload[0].value}`}
          </p>
          {payload[1] && (
            <p className="text-[#a3e635] font-bold mt-0.5">
              <span className="inline-block w-2 h-2 rounded bg-[#a3e635] mr-1.5" />
              {`Conformes: ${payload[1].value}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-100 tracking-wider uppercase glow-cyan">Console Principale de Télémesure</h1>
            <span className="px-2 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/25 font-mono text-[9px] text-[#00f0ff]">SYS.SECURE.ACTIVE</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">Supervision analytique et contrôle de conformité ISO 17025</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 border border-[#1e293b] bg-[#0d131f]/60 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 text-slate-400 rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-l border-[#1e293b]/70 pl-3">
            LOGS: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-[#0d131f]/30 border border-[#1e293b]/50 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]"></div>
          <span className="text-[10px] text-slate-500 font-mono uppercase mt-3 tracking-widest">Initialisation des modules...</span>
        </div>
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="glass-panel p-4.5 rounded-xl transition-all duration-300 relative overflow-hidden group hover:border-[#00f0ff]/40">
                {/* Tech grid light */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">{stat.title}</p>
                    <h3 className={`text-2xl font-black text-slate-100 ${stat.glowClass}`}>{stat.value}</h3>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg} border ${stat.borderColor} text-slate-100`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  <span className="flex items-center">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${stat.trend.startsWith('+') ? 'bg-[#a3e635]' : stat.trend.includes('requise') ? 'bg-[#ff2e63]' : 'bg-[#00f0ff]'}`} />
                    {stat.trend}
                  </span>
                  <span className="text-slate-500">telemetry feed</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Timelines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Evolution chart */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-xl min-h-[350px] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 border-b border-[#1e293b]/70 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00f0ff]" />
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Oscilloscope d'Activité Analytique</h3>
                </div>
                <div className="flex items-center gap-3.5 text-[9px] font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/40"></div>
                    <span className="text-slate-400">Analyses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-[#a3e635]/10 border border-[#a3e635]/40"></div>
                    <span className="text-slate-400">Conformes</span>
                  </div>
                </div>
              </div>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConformes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontFamily: 'monospace'}} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontFamily: 'monospace'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="analyses" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorAnalyses)" activeDot={{ r: 5, strokeWidth: 1, fill: '#070b11', stroke: '#00f0ff' }} />
                    <Area type="monotone" dataKey="conformes" stroke="#a3e635" strokeWidth={2} fillOpacity={1} fill="url(#colorConformes)" activeDot={{ r: 5, strokeWidth: 1, fill: '#070b11', stroke: '#a3e635' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Timeline */}
            <div className="glass-panel p-5 rounded-xl min-h-[350px] flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b]/70 pb-3">
                <Terminal className="w-4 h-4 text-[#a3e635]" />
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Journal des Événements</h3>
              </div>
              <div className="space-y-3.5 flex-grow overflow-y-auto max-h-[260px] pr-1">
                {recentActivity.length === 0 ? (
                  <p className="text-[10px] font-mono text-slate-500 italic">// Aucun log enregistré dans cette session.</p>
                ) : (
                  recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-3 items-start text-xs border-b border-[#1e293b]/30 pb-3 last:border-b-0 last:pb-0">
                      <div className="w-2 h-2 mt-1 rounded-sm bg-[#00f0ff] shadow-[0_0_5px_rgba(0,240,255,0.8)] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 font-mono text-[11px] leading-tight font-semibold tracking-wide">{activity.title}</p>
                        <p className="text-[9px] font-mono text-slate-500 mt-1 leading-relaxed uppercase tracking-wider">{activity.subtitle}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
