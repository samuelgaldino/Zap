import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Headphones,
  Sparkles,
  Send,
  Clock,
  UserCheck,
  Radio,
  Wifi,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Check,
  Copy,
  AlertTriangle,
  Play,
  Pause,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Volume2,
  Zap,
} from 'lucide-react';
import { SystemLogEntry, SystemLogActionType } from '../types';

interface SystemLogsSectionProps {
  onGoToTraining?: () => void;
  onGoToInbox?: () => void;
}

export const SystemLogsSection: React.FC<SystemLogsSectionProps> = ({
  onGoToTraining,
  onGoToInbox,
}) => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    audioCount: 0,
    reactionCount: 0,
    replyCount: 0,
    pauseCount: 0,
    handoffCount: 0,
    broadcastCount: 0,
    connectionCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [testActionLoading, setTestActionLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/system-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.stats) {
          setStats(data.stats);
        }
        setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      }
    } catch (err) {
      console.warn('Erro ao carregar logs do sistema:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Real-time polling every 2.5 seconds when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza que deseja limpar o histórico de logs do sistema?')) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/system-logs/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Erro ao limpar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTestAction = async (
    actionType: 'audio' | 'reaction' | 'reply' | 'pause' | 'handoff'
  ) => {
    try {
      setTestActionLoading(true);
      const res = await fetch('/api/whatsapp/system-logs/test-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.entry) {
          setLogs((prev) => [data.entry, ...prev.slice(0, 49)]);
        }
        fetchLogs(true);
      }
    } catch (err) {
      console.error('Erro ao disparar teste de ação:', err);
    } finally {
      setTestActionLoading(false);
    }
  };

  const handleCopyLogs = () => {
    const textToCopy = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.action.toUpperCase()}] (${l.contact || 'Geral'}) - ${l.details}`
      )
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter logs by search & category
  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all') {
      if (filterType === 'reply' && log.type !== 'reply_sent') return false;
      if (filterType === 'audio' && log.type !== 'audio_processed') return false;
      if (filterType === 'reaction' && log.type !== 'reaction_sent') return false;
      if (filterType === 'pause' && log.type !== 'schedule_pause') return false;
      if (filterType === 'handoff' && log.type !== 'handoff') return false;
      if (
        filterType === 'other' &&
        log.type !== 'broadcast' &&
        log.type !== 'connection' &&
        log.type !== 'system'
      )
        return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.contact && log.contact.toLowerCase().includes(q))
    );
  });

  const getActionBadge = (log: SystemLogEntry) => {
    switch (log.type) {
      case 'audio_processed':
        return {
          icon: Headphones,
          label: 'Áudio processado',
          color: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          dotColor: 'bg-purple-400',
        };
      case 'reaction_sent':
        return {
          icon: Sparkles,
          label: log.metadata?.reactionEmoji ? `Emoji reagido ${log.metadata.reactionEmoji}` : 'Emoji reagido',
          color: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          dotColor: 'bg-amber-400',
        };
      case 'reply_sent':
        return {
          icon: Send,
          label: log.action.includes('Manual') ? 'Resposta Manual' : 'Resposta enviada',
          color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          dotColor: 'bg-emerald-400',
        };
      case 'schedule_pause':
        return {
          icon: Clock,
          label: log.action || 'Pausa de Expediente',
          color: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
          dotColor: 'bg-blue-400',
        };
      case 'handoff':
        return {
          icon: UserCheck,
          label: 'Transbordo Humano',
          color: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
          dotColor: 'bg-rose-400',
        };
      case 'broadcast':
        return {
          icon: Radio,
          label: 'Disparo de Lista',
          color: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
          dotColor: 'bg-cyan-400',
        };
      case 'connection':
        return {
          icon: Wifi,
          label: log.action,
          color: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
          dotColor: 'bg-teal-400',
        };
      default:
        return {
          icon: Activity,
          label: log.action,
          color: 'bg-slate-700/50 text-slate-300 border border-slate-600',
          dotColor: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Live Monitor Header */}
      <div className="bg-[#0b1220] border border-[#1a263d] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-3 py-0.5 rounded-full">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Monitoramento Operacional
              </span>

              {autoRefresh ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-3 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Em Tempo Real (Ao Vivo)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-[#291b07] border border-amber-500/40 px-3 py-0.5 rounded-full">
                  <Pause className="w-3 h-3 text-amber-400" />
                  Pausado
                </span>
              )}

              {lastUpdated && (
                <span className="text-[11px] text-[#64748b]">
                  Última leitura: {lastUpdated}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Logs do Sistema
              <span className="text-xs font-semibold text-[#94a3b8] bg-[#131d33] border border-[#1e293b] px-2.5 py-0.5 rounded-full">
                Últimas 50 ações
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl leading-relaxed">
              Acompanhe com precisão cada ação tomada pela IA autônoma no WhatsApp (áudios ouvidos,
              reações com emojis enviadas, respostas formuladas, pausas fora de expediente e
              transbordos) diretamente por aqui, sem precisar consultar o terminal do servidor.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                autoRefresh
                  ? 'bg-[#0f241d] text-emerald-300 border-emerald-500/40 hover:bg-[#133027]'
                  : 'bg-[#151c2c] text-[#94a3b8] border-[#223049] hover:bg-[#1b253b]'
              }`}
              title={autoRefresh ? 'Pausar atualização automática' : 'Retomar atualização em tempo real'}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pausar Polling
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Ativar Ao Vivo
                </>
              )}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0e1628] hover:bg-[#152037] text-white border border-[#1e293b] px-3.5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              Atualizar
            </button>

            {/* Copy Logs */}
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#0e1628] hover:bg-[#152037] text-slate-200 border border-[#1e293b] px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />
                  Copiar Logs
                </>
              )}
            </button>

            {/* Clear Logs */}
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#211116] hover:bg-[#331720] text-rose-300 border border-rose-500/30 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Limpar
            </button>
          </div>
        </div>

        {/* Quick Test Action Generator Bar */}
        <div className="mt-5 pt-4 border-t border-[#1a263d] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">Disparar ação de teste:</span>
            <span className="hidden sm:inline text-[11px] text-[#64748b]">
              Gere uma ação simulada para validar o fluxo e ver a entrada em tempo real:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={testActionLoading}
              onClick={() => handleTriggerTestAction('reply')}
              className="text-xs font-medium bg-[#0f241d] hover:bg-[#143026] text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              💬 + Resposta enviada
            </button>
            <button
              disabled={testActionLoading}
              onClick={() => handleTriggerTestAction('reaction')}
              className="text-xs font-medium bg-[#291b07] hover:bg-[#3d270b] text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              ✨ + Emoji reagido
            </button>
            <button
              disabled={testActionLoading}
              onClick={() => handleTriggerTestAction('audio')}
              className="text-xs font-medium bg-[#1d1230] hover:bg-[#2b1b47] text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              🎧 + Áudio processado
            </button>
            <button
              disabled={testActionLoading}
              onClick={() => handleTriggerTestAction('pause')}
              className="text-xs font-medium bg-[#0d1e38] hover:bg-[#142c52] text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              ⏰ + Pausa comercial
            </button>
            <button
              disabled={testActionLoading}
              onClick={() => handleTriggerTestAction('handoff')}
              className="text-xs font-medium bg-[#2a131b] hover:bg-[#3d1926] text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              👤 + Transbordo
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {logs.length}
            <span className="text-xs font-normal text-[#64748b]"> / 50</span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Buffer rotativo</p>
        </div>

        {/* Card 2: Respostas */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Respostas</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-300">
            {stats.replyCount || logs.filter((l) => l.type === 'reply_sent').length}
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Respostas enviadas</p>
        </div>

        {/* Card 3: Emojis */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Reações</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-300">
            {stats.reactionCount || logs.filter((l) => l.type === 'reaction_sent').length}
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Emojis reagidos</p>
        </div>

        {/* Card 4: Áudios */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Voz / Áudio</span>
            <Headphones className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-300">
            {stats.audioCount || logs.filter((l) => l.type === 'audio_processed').length}
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Áudios processados</p>
        </div>

        {/* Card 5: Pausas */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Expediente</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-300">
            {stats.pauseCount || logs.filter((l) => l.type === 'schedule_pause').length}
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Pausas comerciais</p>
        </div>

        {/* Card 6: Handoff */}
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between text-[#64748b] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Transbordo</span>
            <UserCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-300">
            {stats.handoffCount || logs.filter((l) => l.type === 'handoff').length}
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">Para atendente humano</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0b1220] border border-[#1a263d] p-3 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
            }`}
          >
            Todos ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('reply')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'reply'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-[#94a3b8] hover:text-emerald-300 hover:bg-[#131d33]'
            }`}
          >
            💬 Respostas ({logs.filter((l) => l.type === 'reply_sent').length})
          </button>
          <button
            onClick={() => setFilterType('reaction')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'reaction'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-[#94a3b8] hover:text-amber-300 hover:bg-[#131d33]'
            }`}
          >
            ✨ Emojis ({logs.filter((l) => l.type === 'reaction_sent').length})
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'audio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-[#94a3b8] hover:text-purple-300 hover:bg-[#131d33]'
            }`}
          >
            🎧 Áudios ({logs.filter((l) => l.type === 'audio_processed').length})
          </button>
          <button
            onClick={() => setFilterType('pause')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'pause'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#94a3b8] hover:text-indigo-300 hover:bg-[#131d33]'
            }`}
          >
            ⏰ Pausas ({logs.filter((l) => l.type === 'schedule_pause').length})
          </button>
          <button
            onClick={() => setFilterType('handoff')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              filterType === 'handoff'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-[#94a3b8] hover:text-rose-300 hover:bg-[#131d33]'
            }`}
          >
            👤 Transbordo ({logs.filter((l) => l.type === 'handoff').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por contato ou palavra..."
            className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748b] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Log Feed List */}
      <div className="bg-[#0b1220] border border-[#1a263d] rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#1a263d] flex items-center justify-between bg-[#0e1628]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Fluxo Cronológico de Ações
            </h3>
          </div>

          <span className="text-xs text-[#94a3b8]">
            Exibindo <strong className="text-white">{filteredLogs.length}</strong> de{' '}
            <strong className="text-white">{logs.length}</strong> registros
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#131d33] border border-[#1e293b] flex items-center justify-center mx-auto text-[#64748b]">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Nenhum log encontrado para este filtro</h4>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
              Experimente alterar os filtros de busca ou clique abaixo para simular uma ação e
              validar o funcionamento.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleTriggerTestAction('reply')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-blue-600/30"
              >
                Gerar Ação de Teste
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#131d33]">
            {filteredLogs.map((log, index) => {
              const badge = getActionBadge(log);
              const BadgeIcon = badge.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-[#0e172a]/60 transition group flex flex-col gap-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Badge and Title */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-[#64748b] bg-[#070b14] px-2 py-0.5 rounded-md border border-[#1e293b]">
                        {log.timestamp}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${badge.color}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      {log.contact && (
                        <span className="text-xs font-medium text-slate-300 bg-[#131d33] border border-[#1e293b] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {log.contact}
                        </span>
                      )}

                      {index === 0 && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase">
                          Mais recente
                        </span>
                      )}
                    </div>

                    {/* Metadata summary & Expand toggle */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {log.metadata?.charCount && (
                        <span className="text-[11px] text-[#64748b]">
                          {log.metadata.charCount} caracteres
                        </span>
                      )}

                      {log.metadata?.durationSeconds && (
                        <span className="text-[11px] text-purple-300 font-medium">
                          ⏱ {log.metadata.durationSeconds}s de voz
                        </span>
                      )}

                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-xs text-[#64748b] hover:text-white flex items-center gap-1 p-1 rounded hover:bg-[#131d33] transition"
                        title="Ver detalhes técnicos"
                      >
                        {isExpanded ? (
                          <>
                            Menos <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Detalhes <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Details Description */}
                  <div className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-normal pl-0 sm:pl-1">
                    {log.details}
                  </div>

                  {/* Expanded Technical Inspector */}
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-[#070b14] border border-[#1e293b] rounded-xl text-xs font-mono text-[#94a3b8] space-y-1 animate-fadeIn">
                      <div className="flex items-center justify-between pb-1 border-b border-[#131d33]">
                        <span className="text-slate-400 font-bold">ID do Registro: {log.id}</span>
                        <span>{log.fullDate || log.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <strong className="text-slate-300">Ação:</strong> {log.action}
                        </div>
                        <div>
                          <strong className="text-slate-300">Tipo:</strong> {log.type}
                        </div>
                        <div>
                          <strong className="text-slate-300">Contato:</strong> {log.contact || 'N/A'}
                        </div>
                        <div>
                          <strong className="text-slate-300">Status:</strong> {log.status}
                        </div>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="pt-2 text-[11px]">
                          <strong className="text-slate-300">Metadados:</strong>{' '}
                          <code className="text-emerald-400">
                            {JSON.stringify(log.metadata, null, 2)}
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful Operational Guide */}
      <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-5 text-xs text-[#94a3b8] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm">
              Como o bot decide e registra as ações?
            </h4>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              Cada mensagem recebida pelo WhatsApp conectado passa pela validação de horário
              comercial, filtro de palavras de transbordo e geração multimodal pelo Gemini 3.8 Flash.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onGoToTraining && (
            <button
              onClick={onGoToTraining}
              className="bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/30 font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer text-xs"
            >
              Ajustar Regras da IA
            </button>
          )}
          {onGoToInbox && (
            <button
              onClick={onGoToInbox}
              className="bg-[#131d33] hover:bg-[#1b2a47] text-slate-200 border border-[#223049] font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer text-xs"
            >
              Ver Conversas no Inbox
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
