import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Sun,
  GitFork,
  Users,
  CheckSquare,
  Calendar,
  DollarSign,
  BarChart3,
  Send,
  MessageSquare,
  Settings,
  Shield,
  Smartphone,
  Bot,
  Inbox,
  BookOpen,
  Code2,
  Sparkles,
  Clock,
} from 'lucide-react';

export type ActiveTab = 'connect' | 'broadcast' | 'training' | 'schedule' | 'inbox' | 'deploy' | 'code';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  businessName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, businessName }) => {
  const [waConnected, setWaConnected] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [currentTime, setCurrentTime] = useState('18:54:16');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll status to reflect live indicator
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          setWaConnected(data.status === 'connected');
          setUserPhone(data.userPhone || null);
        }

        const schedRes = await fetch('/api/whatsapp/schedule/status');
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          setIsResting(!schedData.status?.isWithinHours);
        }
      } catch {}
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
      id: 'inbox' as ActiveTab,
      label: 'Pipeline Ao Vivo',
      icon: GitFork,
      countBadge: '218',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
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
      countBadge: '1',
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
    },
    {
      id: 'schedule' as ActiveTab,
      label: 'Horário & Pausa',
      icon: Clock,
      countBadge: isResting ? 'Pausa' : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    },
    {
      id: 'deploy' as ActiveTab,
      label: 'Templates & Deploy',
      icon: MessageSquare,
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
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight lowercase">
                  arco wpp
                </span>
                <span className="bg-[#1e153b] text-[#c084fc] border border-[#7e22ce]/40 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  MASTER
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] hidden md:block">
                Foco em processos, follow-up, reuniões e alta conversão comercial
              </p>
            </div>
          </div>

          {/* Search bar with Ctrl+K shortcut */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="w-full relative flex items-center bg-[#0d1527] border border-[#1e293b] rounded-full px-3.5 py-1.5 focus-within:border-blue-500/60 transition">
              <Search className="w-4 h-4 text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Buscar leads, tarefas, reuniões... (Ctrl+K)"
                className="w-full bg-transparent text-xs text-white placeholder-[#64748b] px-2.5 focus:outline-none"
              />
              <span className="text-[10px] text-[#64748b] bg-[#17233d] px-1.5 py-0.5 rounded border border-[#223558] font-mono">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Action Elements */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Lembretes pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#1f1322] border border-[#831843]/50 text-[#f472b6] px-3 py-1.5 rounded-full text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              <span>1 Lembretes</span>
            </div>

            {/* Leads Counter pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#0a1b24] border border-[#065f46]/50 text-[#34d399] px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span>246 leads</span>
              <span className="text-[#059669]">•</span>
              <span className="text-[#94a3b8] font-mono text-[11px]">{currentTime}</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setActiveTab('broadcast')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg shadow-blue-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Lead</span>
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 bg-[#0d1527] border border-[#1e293b] rounded-full px-2.5 py-1 cursor-pointer hover:border-slate-700 transition">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                S
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-white block">Samuel Galdino</span>
                <span className="text-[9px] text-[#64748b] font-mono uppercase tracking-wider block">
                  MASTER
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-[#64748b]" />
            </div>
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
