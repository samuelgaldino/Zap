import React from 'react';
import {
  Sun,
  Zap,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Target,
  Sparkles,
} from 'lucide-react';

interface DashboardBannerProps {
  userName?: string;
  totalReceived?: number;
  totalReplied?: number;
  activeChats?: number;
  onQuickAction?: (action: string) => void;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({
  userName = 'Samuel Galdino',
  totalReceived = 218,
  totalReplied = 2,
  activeChats = 1,
  onQuickAction,
}) => {
  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 pt-6 pb-2 space-y-4">
      {/* Hero Banner Card */}
      <div className="bg-[#0b1324] border border-[#1a263d] rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#60a5fa] mb-2">
            <Sun className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span>Rotina Comercial Prioritária • ArcoZapp</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Bom dia, {userName}! 🚀
          </h1>

          <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 max-w-2xl leading-relaxed">
            Foco no fechamento e na cadência de follow-up. Aqui está a lista ordenada por urgência do que você precisa executar para bater a meta do mês.
          </p>
        </div>

        {/* Right Goal Card */}
        <div className="bg-[#0e182e] border border-[#1e2e4f] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-6 shrink-0 shadow-inner">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] block mb-1">
              META SAUDÁVEL DO MÊS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#34d399]">
                {totalReplied} <span className="text-slate-400 text-lg font-normal">/ 12</span>
              </span>
              <span className="text-xs text-[#94a3b8]">vendas pagas</span>
            </div>
          </div>

          <div className="bg-[#06241a] border border-[#10b981]/50 text-[#34d399] px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide">
            17%
          </div>
        </div>
      </div>

      {/* KPI Cards Row (6 exact metric cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Leads Novos */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Leads Novos</span>
            <Zap className="w-4 h-4 text-[#a855f7]" />
          </div>
          <div className="text-2xl font-extrabold text-white">218</div>
          <span className="text-[11px] text-[#64748b] block mt-0.5">Sem 1º contato</span>
        </div>

        {/* Card 2: Tarefas Atrasadas (Highlighted in Red) */}
        <div className="bg-[#160d1b] border-2 border-[#f43f5e]/50 rounded-2xl p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#fb7185]">Tarefas Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-[#fb7185]" />
          </div>
          <div className="text-2xl font-extrabold text-[#fb7185]">1</div>
          <span className="text-[11px] text-[#fb7185]/80 font-medium block mt-0.5">
            Urgente resolver
          </span>
        </div>

        {/* Card 3: Follow-ups Hoje */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Follow-ups Hoje</span>
            <Clock className="w-4 h-4 text-[#60a5fa]" />
          </div>
          <div className="text-2xl font-extrabold text-[#60a5fa]">0</div>
          <span className="text-[11px] text-[#64748b] block mt-0.5">Agendados p/ hoje</span>
        </div>

        {/* Card 4: Reuniões Hoje */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Reuniões Hoje</span>
            <Calendar className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div className="text-2xl font-extrabold text-[#fbbf24]">0</div>
          <span className="text-[11px] text-[#64748b] block mt-0.5">Calls agendadas</span>
        </div>

        {/* Card 5: Propostas Abertas */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Propostas Abertas</span>
            <DollarSign className="w-4 h-4 text-[#34d399]" />
          </div>
          <div className="text-2xl font-extrabold text-[#34d399]">2</div>
          <span className="text-[11px] text-[#64748b] block mt-0.5">Aguardando decisão</span>
        </div>

        {/* Card 6: Sem Próxima Ação */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Sem Próxima Ação</span>
            <Target className="w-4 h-4 text-[#f43f5e]" />
          </div>
          <div className="text-2xl font-extrabold text-[#f43f5e]">228</div>
          <span className="text-[11px] text-[#64748b] block mt-0.5">Risco de perda</span>
        </div>
      </div>
    </div>
  );
};
