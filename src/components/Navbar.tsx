import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  Sun,
  Users,
  CheckSquare,
  Clock,
  Settings,
  GitCommit,
  BellRing,
  Activity,
  MessageSquare,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

export type ActiveTab =
  | 'connect'
  | 'form_triage'
  | 'inbox'
  | 'analytics'
  | 'followup'
  | 'reminders'
  | 'broadcast'
  | 'training'
  | 'schedule'
  | 'code';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  businessName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, businessName }) => {
  const [waConnected, setWaConnected] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [realLeadsCount, setRealLeadsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          setWaConnected(data.status === 'connected');
          setUserPhone(data.userPhone || null);
          if (data.stats?.activeChats !== undefined) {
            setRealLeadsCount(data.stats.activeChats);
          }
        }

        const resSched = await fetch('/api/whatsapp/schedule/status');
        if (resSched.ok) {
          const schedData = await resSched.json();
          setIsResting(!schedData.status?.isWithinHours);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'connect' as ActiveTab,
      label: 'Rotina WhatsApp',
      icon: Sun,
      countBadge: waConnected ? undefined : '1',
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    },
    {
      id: 'form_triage' as ActiveTab,
      label: 'RespondeForm AI',
      icon: FileSpreadsheet,
      countBadge: 'IA',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    },
    {
      id: 'inbox' as ActiveTab,
      label: 'Monitor de Contatos',
      icon: MessageSquare,
      countBadge: realLeadsCount > 0 ? String(realLeadsCount) : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Métricas & Conversão',
      icon: BarChart3,
      countBadge: 'BI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'followup' as ActiveTab,
      label: 'Follow-Up',
      icon: GitCommit,
    },
    {
      id: 'reminders' as ActiveTab,
      label: 'Lembretes Pré-Call',
      icon: BellRing,
    },
    {
      id: 'broadcast' as ActiveTab,
      label: 'Disparo de Lista',
      icon: Users,
    },
    {
      id: 'training' as ActiveTab,
      label: 'Treinamento IA',
      icon: CheckSquare,
    },
    {
      id: 'schedule' as ActiveTab,
      label: 'Horário & Pausa',
      icon: Clock,
      countBadge: isResting ? 'Pausa' : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    },
    {
      id: 'code' as ActiveTab,
      label: 'Configurações',
      icon: Settings,
      countBadge: 'Logs',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
  ];

  return (
    <header className="bg-[#070b14] border-b border-[#131d33] sticky top-0 z-50 shadow-2xl">
      {/* Top Bar */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">
                  ArcoZapp
                </span>
                <span className="bg-[#1e153b] text-[#c084fc] border border-[#7e22ce]/40 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Search bar with Ctrl+K shortcut */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="w-full relative flex items-center bg-[#0d1527] border border-[#1e293b] rounded-full px-3.5 py-1.5 focus-within:border-blue-500/60 transition">
              <Search className="w-4 h-4 text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Buscar contatos, tarefas, reuniões... (Ctrl+K)"
                className="w-full bg-transparent text-xs text-white placeholder-[#64748b] px-2.5 focus:outline-none"
              />
              <span className="text-[10px] text-[#64748b] bg-[#17233d] px-1.5 py-0.5 rounded border border-[#223558] font-mono">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Action Elements */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real Leads / Contacts pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#0a1b24] border border-[#065f46]/50 text-[#34d399] px-3.5 py-1.5 rounded-full text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${waConnected ? 'bg-[#10b981] animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{waConnected ? `${realLeadsCount} contatos sincronizados` : 'WhatsApp desconectado'}</span>
              <span className="text-[#059669]">•</span>
              <span className="text-[#94a3b8] font-mono text-[11px]">{currentTime}</span>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setActiveTab('reminders')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Pré-Call</span>
            </button>
          </div>
        </div>

        {/* Second Row: Navigation Pill Tabs */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto py-2.5 scrollbar-none border-t border-[#131d33]/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101b33] text-[#60a5fa] border border-[#3b82f6]/60 shadow-sm shadow-blue-500/10'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#60a5fa]' : 'text-[#64748b]'}`} />
                <span>{item.label}</span>
                {item.countBadge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
