import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Bot,
  RefreshCw,
  Power,
  ShieldCheck,
  CheckCheck,
  Clock,
  Sparkles,
  Phone,
  Search,
  Mic,
  Smile,
  Volume2,
  Play,
  Pause,
  ThumbsUp,
  Heart,
  Flame,
  Zap,
  AlertTriangle,
  AlertCircle,
  BellRing,
  Check,
  Activity,
  SmilePlus,
  Frown,
  Meh,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserX,
  UserCheck,
} from 'lucide-react';
import { SentimentType, SentimentAnalysis, SentimentOverview } from '../types';

interface LiveMessage {
  id: string;
  chatJid: string;
  senderName: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  isAiResponse?: boolean;
  isAudio?: boolean;
  reaction?: string;
}

interface ChatThread {
  jid: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: LiveMessage[];
  botPausedForThisChat?: boolean;
  notifiedOutOfHours?: boolean;
  sentiment?: SentimentAnalysis;
}

export interface LiveInboxProps {
  onGoToConnect?: () => void;
}

export const LiveInbox: React.FC<LiveInboxProps> = ({ onGoToConnect }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | SentimentType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [sentimentOverview, setSentimentOverview] = useState<SentimentOverview | null>(null);
  const [showSentimentPanel, setShowSentimentPanel] = useState(true);
  const [isSimulatingSentiment, setIsSimulatingSentiment] = useState(false);
  const [isSyncingChats, setIsSyncingChats] = useState(false);

  const handleSyncChats = async () => {
    setIsSyncingChats(true);
    try {
      const res = await fetch('/api/whatsapp/sync-chats', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.threads?.length > 0 && !selectedJid) {
          setSelectedJid(data.threads[0].jid);
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar chats:', err);
    } finally {
      setIsSyncingChats(false);
    }
  };

  // Poll chats and sentiments every 2.5 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchChats = async () => {
      try {
        const res = await fetch('/api/whatsapp/chats');
        if (res.ok && isMounted) {
          const data = await res.json();
          setThreads(data.threads || []);
          setAutoReplyEnabled(data.autoReplyEnabled);
          if (data.sentimentOverview) {
            setSentimentOverview(data.sentimentOverview);
          }

          // Select first chat if none selected
          if (!selectedJid && data.threads?.length > 0) {
            setSelectedJid(data.threads[0].jid);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar conversas:', err);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedJid]);

  const activeThread = threads.find((t) => t.jid === selectedJid);

  // Identify all dissatisfied customer chats for real-time alerting
  const alertThreads = threads.filter(
    (t) => t.sentiment?.sentiment === 'Insatisfeito'
  );

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedJid || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: selectedJid,
          text: replyText.trim(),
        }),
      });

      if (res.ok) {
        setReplyText('');
      } else {
        alert('Não foi possível enviar a mensagem. Verifique se o WhatsApp está conectado.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!selectedJid || !activeThread || activeThread.messages.length === 0) return;

    try {
      await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: selectedJid,
          text: `[Reagiu com ${emoji}]`,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReanalyzeSentiment = async (jid?: string) => {
    setIsAnalyzingSentiment(true);
    try {
      const res = await fetch('/api/whatsapp/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sentiment && jid) {
          setThreads((prev) =>
            prev.map((t) => (t.jid === jid ? { ...t, sentiment: data.sentiment } : t))
          );
        }
      }
    } catch (err) {
      console.error('Erro ao reanalisar sentimento:', err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const handleSimulateSentiment = async (targetSentiment?: SentimentType) => {
    if (!selectedJid) return;
    setIsSimulatingSentiment(true);
    try {
      const res = await fetch('/api/whatsapp/sentiment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jid: selectedJid,
          targetSentiment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sentiment) {
          setThreads((prev) =>
            prev.map((t) => (t.jid === selectedJid ? { ...t, sentiment: data.sentiment } : t))
          );
        }
      }
    } catch (err) {
      console.error('Erro ao simular sentimento:', err);
    } finally {
      setIsSimulatingSentiment(false);
    }
  };

  const handleToggleChatBot = async () => {
    if (!selectedJid) return;
    try {
      const res = await fetch('/api/whatsapp/toggle-chat-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid: selectedJid }),
      });
      if (res.ok) {
        const data = await res.json();
        setThreads((prev) =>
          prev.map((t) =>
            t.jid === selectedJid ? { ...t, botPausedForThisChat: data.botPausedForThisChat } : t
          )
        );
      }
    } catch (err) {
      console.error('Erro ao alternar pausa do bot no chat:', err);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.jid.includes(searchTerm);

    if (!matchesSearch) return false;
    if (sentimentFilter === 'all') return true;
    return t.sentiment?.sentiment === sentimentFilter;
  });

  const getSentimentBadge = (sentiment?: SentimentType) => {
    switch (sentiment) {
      case 'Satisfeito':
        return {
          icon: SmilePlus,
          label: 'Satisfeito',
          color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          dot: 'bg-emerald-400',
          emoji: '😊',
        };
      case 'Neutro':
        return {
          icon: Meh,
          label: 'Neutro',
          color: 'bg-slate-700/50 text-slate-300 border border-slate-600',
          dot: 'bg-slate-400',
          emoji: '😐',
        };
      case 'Insatisfeito':
        return {
          icon: Frown,
          label: 'Insatisfeito',
          color: 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950',
          dot: 'bg-rose-500 animate-pulse',
          emoji: '🚨',
        };
      default:
        return {
          icon: Meh,
          label: 'Neutro',
          color: 'bg-slate-700/40 text-slate-400 border border-slate-700',
          dot: 'bg-slate-400',
          emoji: '😐',
        };
    }
  };

  // Stats calculation
  const satisfiedTotal = threads.filter((t) => t.sentiment?.sentiment === 'Satisfeito').length;
  const neutralTotal = threads.filter((t) => t.sentiment?.sentiment === 'Neutro').length;
  const dissatisfiedTotal = threads.filter((t) => t.sentiment?.sentiment === 'Insatisfeito').length;
  const satisfactionRate =
    threads.length > 0 ? Math.round((satisfiedTotal / threads.length) * 100) : 100;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Metrics in Arco CRM Dark Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Monitor de Contatos
            </span>
            <span className="text-[11px] font-bold text-[#c084fc] bg-[#1e153b] border border-[#7e22ce]/40 px-2 py-0.5 rounded-full uppercase">
              IA Gemini Multimodal
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              Análise de Sentimento Ativa
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Monitor de Contatos & Sentimento em Tempo Real
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-3xl">
            Acompanhe a IA ouvindo áudios, reagindo com emojis e classificando o sentimento de cada
            cliente em <strong>Satisfeito</strong>, <strong>Neutro</strong> ou{' '}
            <strong className="text-rose-400">Insatisfeito</strong> com alertas automáticos em caso
            de risco.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSyncChats}
            disabled={isSyncingChats}
            className="flex items-center gap-2 bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChats ? 'animate-spin' : ''}`} />
            <span>{isSyncingChats ? 'Sincronizando...' : 'Sincronizar Contatos'}</span>
          </button>

          <button
            onClick={() => setShowSentimentPanel(!showSentimentPanel)}
            className="flex items-center gap-2 bg-[#0e1628] hover:bg-[#15223c] text-white border border-[#1a263d] px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>{showSentimentPanel ? 'Ocultar Painel IA' : 'Mostrar Painel IA'}</span>
            {showSentimentPanel ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />
            )}
          </button>

          <div className="flex items-center gap-2 bg-[#0a1b24] border border-[#065f46]/50 text-[#34d399] px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>
              {autoReplyEnabled ? 'Piloto Automático Conectado' : 'Piloto Automático Pausado'}
            </span>
          </div>

          <div className="bg-[#0e1628] border border-[#1a263d] text-[#94a3b8] px-3 py-1.5 rounded-full text-xs font-mono">
            {threads.length} Contatos Reais
          </div>
        </div>
      </div>

      {/* 🚨 CRITICAL SENTIMENT ALERT BANNER (If any dissatisfied customer exists) */}
      {alertThreads.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-[#2a0e17] to-[#14060b] border-2 border-rose-500/70 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-rose-950/50 animate-pulse relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/30 border border-rose-500/50 px-2.5 py-0.5 rounded-full">
                    🚨 ALERTA DE CLIENTE INSATISFEITO DETECTADO
                  </span>
                  <span className="text-xs text-rose-200/80 font-medium">
                    {alertThreads.length === 1
                      ? '1 conversa crítica necessita de atenção imediata'
                      : `${alertThreads.length} conversas críticas identificadas`}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-200 leading-relaxed font-normal">
                  <strong className="text-white font-bold">{alertThreads[0].name}:</strong>{' '}
                  <span className="text-rose-200">
                    "{alertThreads[0].sentiment?.reason || alertThreads[0].lastMessage}"
                  </span>
                </div>

                <p className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Ação recomendada pela IA:{' '}
                    <strong className="text-amber-300">
                      {alertThreads[0].sentiment?.recommendedAction ||
                        'Intervenção humana imediata para evitar cancelamento!'}
                    </strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                onClick={() => {
                  setSelectedJid(alertThreads[0].jid);
                  setSentimentFilter('Insatisfeito');
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-rose-600/40 transition cursor-pointer flex items-center gap-2"
              >
                <span>Atender {alertThreads[0].name.split(' ')[0]} Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDABLE SENTIMENT DASHBOARD PANEL */}
      {showSentimentPanel && (
        <div className="bg-[#0b1220] border border-[#1a263d] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fadeIn relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-[#082218] border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Classificação com Gemini 3.8 Flash
                </span>
                <span className="text-xs text-[#64748b]">
                  {threads.length} conversas sob monitoramento
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Painel Geral de Análise de Sentimento
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Classificação contínua do tom das conversas para identificar clientes satisfeitos,
                solicitações neutras e alertas de insatisfação em tempo hábil.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleReanalyzeSentiment()}
                disabled={isAnalyzingSentiment}
                className="flex items-center gap-2 bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isAnalyzingSentiment ? 'animate-spin text-blue-400' : ''}`}
                />
                <span>
                  {isAnalyzingSentiment ? 'Classificando com Gemini...' : 'Reanalisar Todas com IA'}
                </span>
              </button>
            </div>
          </div>

          {/* Sentiment KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Índice Geral de Satisfação */}
            <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Índice de Satisfação
                </span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {satisfactionRate}%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Geral Positivo</span>
              </div>

              {/* Multi-segment progress bar */}
              <div className="w-full h-2 bg-[#070b14] rounded-full overflow-hidden flex mt-2.5 border border-[#1e293b]">
                <div
                  style={{ width: `${(satisfiedTotal / (threads.length || 1)) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Satisfeitos: ${satisfiedTotal}`}
                />
                <div
                  style={{ width: `${(neutralTotal / (threads.length || 1)) * 100}%` }}
                  className="bg-blue-500 transition-all"
                  title={`Neutros: ${neutralTotal}`}
                />
                <div
                  style={{ width: `${(dissatisfiedTotal / (threads.length || 1)) * 100}%` }}
                  className="bg-rose-500 transition-all"
                  title={`Insatisfeitos: ${dissatisfiedTotal}`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#64748b] mt-1.5">
                <span className="text-emerald-400 font-medium">😊 {satisfiedTotal}</span>
                <span className="text-blue-400 font-medium">😐 {neutralTotal}</span>
                <span className="text-rose-400 font-medium">🚨 {dissatisfiedTotal}</span>
              </div>
            </div>

            {/* Card 2: Satisfeitos */}
            <div
              onClick={() => setSentimentFilter('Satisfeito')}
              className={`bg-[#0e1628] border rounded-2xl p-4 shadow-sm transition cursor-pointer ${
                sentimentFilter === 'Satisfeito'
                  ? 'border-emerald-500 bg-[#082218]/40'
                  : 'border-[#1a263d] hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <SmilePlus className="w-4 h-4 text-emerald-400" />
                  Satisfeito
                </span>
                <span className="text-xs font-bold text-emerald-400">😊</span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                {satisfiedTotal}
                <span className="text-xs font-normal text-[#64748b] ml-1">
                  (
                  {threads.length > 0
                    ? Math.round((satisfiedTotal / threads.length) * 100)
                    : 0}
                  %)
                </span>
              </div>

              <p className="text-[11px] text-[#94a3b8] mt-1">
                Elogios, agradecimentos e fechamento de pedidos
              </p>
            </div>

            {/* Card 3: Neutros */}
            <div
              onClick={() => setSentimentFilter('Neutro')}
              className={`bg-[#0e1628] border rounded-2xl p-4 shadow-sm transition cursor-pointer ${
                sentimentFilter === 'Neutro'
                  ? 'border-blue-500 bg-[#0d1e38]/40'
                  : 'border-[#1a263d] hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Meh className="w-4 h-4 text-blue-400" />
                  Neutro
                </span>
                <span className="text-xs font-bold text-blue-400">😐</span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-blue-300">
                {neutralTotal}
                <span className="text-xs font-normal text-[#64748b] ml-1">
                  (
                  {threads.length > 0 ? Math.round((neutralTotal / threads.length) * 100) : 0}
                  %)
                </span>
              </div>

              <p className="text-[11px] text-[#94a3b8] mt-1">
                Dúvidas sobre frete, cardápio, horários e FAQ
              </p>
            </div>

            {/* Card 4: Insatisfeitos (Alerta) */}
            <div
              onClick={() => setSentimentFilter('Insatisfeito')}
              className={`bg-[#0e1628] border rounded-2xl p-4 shadow-sm transition cursor-pointer relative ${
                sentimentFilter === 'Insatisfeito'
                  ? 'border-rose-500 bg-[#2b1019]/60'
                  : 'border-[#1a263d] hover:border-rose-500/50'
              }`}
            >
              {dissatisfiedTotal > 0 && (
                <span className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-md">
                  Alerta Ativo
                </span>
              )}

              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Frown className="w-4 h-4 text-rose-400" />
                  Insatisfeito
                </span>
                <span className="text-xs font-bold text-rose-400">🚨</span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
                {dissatisfiedTotal}
                <span className="text-xs font-normal text-[#64748b] ml-1">
                  (
                  {threads.length > 0
                    ? Math.round((dissatisfiedTotal / threads.length) * 100)
                    : 0}
                  %)
                </span>
              </div>

              <p className="text-[11px] text-rose-300/80 mt-1 font-medium">
                Reclamações, atrasos ou risco de cancelamento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Inbox Interface */}
      <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[750px]">
        {/* Left list of chats */}
        <div className="md:col-span-4 border-r border-[#1a263d] flex flex-col h-full bg-[#0b1220]">
          {/* Search Contacts in Left Panel */}
          <div className="p-3 border-b border-[#1a263d] bg-[#0e1628] space-y-2.5">
            <div className="relative flex items-center bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 focus-within:border-blue-500/60 transition">
              <Search className="w-4 h-4 text-[#64748b] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente ou mensagem..."
                className="w-full bg-transparent text-xs text-white placeholder-[#64748b] px-2.5 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-[#64748b] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sentiment Quick Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setSentimentFilter('all')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                }`}
              >
                Todos ({threads.length})
              </button>

              <button
                onClick={() => setSentimentFilter('Satisfeito')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Satisfeito'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-[#94a3b8] hover:text-emerald-300 hover:bg-[#131d33]'
                }`}
              >
                😊 Satisfeito ({satisfiedTotal})
              </button>

              <button
                onClick={() => setSentimentFilter('Neutro')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Neutro'
                    ? 'bg-slate-700 text-white'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                }`}
              >
                😐 Neutro ({neutralTotal})
              </button>

              <button
                onClick={() => setSentimentFilter('Insatisfeito')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Insatisfeito'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-[#94a3b8] hover:text-rose-300 hover:bg-[#131d33]'
                }`}
              >
                🚨 Insatisfeito ({dissatisfiedTotal})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#131d33]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#101b33] border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Nenhuma conversa encontrada</h4>
                <p className="text-xs leading-relaxed text-[#94a3b8]">
                  Tente alterar os filtros de busca ou aguarde novas mensagens no WhatsApp.
                </p>
                {sentimentFilter !== 'all' && (
                  <button
                    onClick={() => setSentimentFilter('all')}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    Limpar filtro de sentimento
                  </button>
                )}
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.jid === selectedJid;
                const badge = getSentimentBadge(thread.sentiment?.sentiment);
                const isAlert = thread.sentiment?.sentiment === 'Insatisfeito';

                return (
                  <button
                    key={thread.jid}
                    onClick={() => setSelectedJid(thread.jid)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#101b33] border-l-4 border-blue-500 text-white'
                        : isAlert
                        ? 'bg-[#1c0d13]/70 hover:bg-[#261019] border-l-4 border-rose-500 text-slate-200'
                        : 'hover:bg-[#0e1628] text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border relative ${
                        isAlert
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                      }`}
                    >
                      {thread.name.charAt(0).toUpperCase()}
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-[#0b1220] ${badge.dot}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{thread.name}</span>
                          {thread.botPausedForThisChat && (
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded uppercase">
                              Manual
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-[#64748b] font-mono shrink-0">
                          {thread.lastTimestamp}
                        </span>
                      </div>

                      {/* Sentiment pill badge */}
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}
                        >
                          <span>{badge.emoji}</span>
                          <span>{thread.sentiment?.sentiment || 'Neutro'}</span>
                          {thread.sentiment?.score !== undefined && (
                            <span className="font-mono opacity-80">
                              ({thread.sentiment.score}%)
                            </span>
                          )}
                        </span>

                        {isAlert && (
                          <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider animate-pulse bg-rose-500/20 px-1.5 py-0.5 rounded">
                            Atenção
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#94a3b8] truncate flex items-center gap-1">
                        {thread.lastMessage.startsWith('🎙️') && (
                          <Mic className="w-3 h-3 text-[#34d399] shrink-0" />
                        )}
                        <span>{thread.lastMessage}</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right chat message view with WhatsApp authentic Dark Theme */}
        <div className="md:col-span-8 flex flex-col h-full bg-[#0c1317] relative">
          {activeThread ? (
            <>
              {/* Header */}
              <div className="bg-[#111b21] border-b border-[#222d34] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-200 font-bold text-sm">
                    {activeThread.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-white flex items-center gap-2 flex-wrap">
                      {activeThread.name}
                      <span className="text-[10px] bg-[#1e293b] text-[#94a3b8] px-2 py-0.5 rounded-full font-mono border border-slate-700">
                        +{activeThread.jid.split('@')[0]}
                      </span>
                      {activeThread.botPausedForThisChat && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/40">
                          IA Pausada para este contato
                        </span>
                      )}
                    </h3>

                    <p className="text-[11px] text-[#34d399] flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                      <span>
                        {activeThread.botPausedForThisChat
                          ? 'Atendimento Humano em Andamento (Você no controle)'
                          : 'IA Gemini Autônoma • Áudios e Reações Ativos'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quick Actions & Reaction Buttons Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Take over button */}
                  <button
                    onClick={handleToggleChatBot}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      activeThread.botPausedForThisChat
                        ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500'
                        : 'bg-[#1f2c34] text-amber-300 border-[#2a3942] hover:bg-[#273842]'
                    }`}
                    title={
                      activeThread.botPausedForThisChat
                        ? 'Retomar respostas automáticas da IA'
                        : 'Pausar IA e assumir o atendimento manualmente'
                    }
                  >
                    {activeThread.botPausedForThisChat ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        Retomar IA
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Assumir Chat
                      </>
                    )}
                  </button>

                  <div className="hidden sm:flex items-center gap-1 bg-[#1f2c34] px-2.5 py-1 rounded-full border border-[#2a3942]">
                    <span className="text-[10px] text-[#8696a0] mr-1">Reagir:</span>
                    {['👍', '❤️', '🔥', '🙏', '😂', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleSendReaction(emoji)}
                        className="hover:scale-125 transition text-sm cursor-pointer p-0.5"
                        title={`Reagir com ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🎯 AI SENTIMENT DIAGNOSTIC STRIP ON ACTIVE CHAT */}
              {activeThread.sentiment && (
                <div
                  className={`px-4 py-3 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner ${
                    activeThread.sentiment.sentiment === 'Insatisfeito'
                      ? 'bg-[#220d14] border-rose-500/40 text-rose-200'
                      : activeThread.sentiment.sentiment === 'Satisfeito'
                      ? 'bg-[#091f16] border-emerald-500/40 text-emerald-200'
                      : 'bg-[#0e1724] border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base font-bold shadow-md ${
                        activeThread.sentiment.sentiment === 'Insatisfeito'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : activeThread.sentiment.sentiment === 'Satisfeito'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {activeThread.sentiment.sentiment === 'Insatisfeito'
                        ? '🚨'
                        : activeThread.sentiment.sentiment === 'Satisfeito'
                        ? '😊'
                        : '😐'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold uppercase tracking-wide text-white">
                          Sentimento: {activeThread.sentiment.sentiment}
                        </span>

                        <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                          Score: {activeThread.sentiment.score}/100
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            activeThread.sentiment.urgency === 'alta'
                              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          Urgência: {activeThread.sentiment.urgency}
                        </span>

                        <span className="text-[10px] text-[#64748b]">
                          Analisado às {activeThread.sentiment.analyzedAt}
                        </span>
                      </div>

                      <p className="text-[11px] mt-0.5 text-slate-200">
                        <strong>Diagnóstico da IA:</strong> {activeThread.sentiment.reason}
                      </p>

                      <p className="text-[11px] text-[#94a3b8] mt-0.5">
                        <strong>Ação sugerida:</strong> {activeThread.sentiment.recommendedAction}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleReanalyzeSentiment(activeThread.jid)}
                      disabled={isAnalyzingSentiment}
                      className="text-xs bg-black/40 hover:bg-black/60 text-slate-200 border border-white/10 px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium disabled:opacity-50"
                      title="Solicitar nova análise de sentimento à IA Gemini"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isAnalyzingSentiment ? 'animate-spin' : ''}`}
                      />
                      <span>Reanalisar</span>
                    </button>

                    <button
                      onClick={() => handleSimulateSentiment()}
                      disabled={isSimulatingSentiment}
                      className="text-xs bg-black/40 hover:bg-black/60 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 font-medium disabled:opacity-50"
                      title="Alternar sentimento para testar os alertas"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Testar Alerta</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Screen */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              >
                {activeThread.messages.map((msg) => {
                  const isMe = msg.fromMe;
                  const isAudio = msg.isAudio || msg.text.includes('🎙️');
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-md relative leading-relaxed ${
                          isMe
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]'
                        }`}
                      >
                        {/* Header tag */}
                        <div className="text-[11px] font-bold mb-1 flex items-center justify-between gap-2">
                          {isMe ? (
                            msg.isAiResponse ? (
                              <span className="text-[#34d399] flex items-center gap-1">
                                <Bot className="w-3 h-3 text-[#34d399]" /> IA Gemini (Humanizada)
                              </span>
                            ) : (
                              <span className="text-[#60a5fa] flex items-center gap-1">
                                <User className="w-3 h-3 text-[#60a5fa]" /> Você (Manual)
                              </span>
                            )
                          ) : (
                            <span className="text-[#00a884] font-semibold">
                              {msg.senderName}
                            </span>
                          )}
                        </div>

                        {/* Audio Voice Note Bubble Preview */}
                        {isAudio ? (
                          <div className="space-y-1.5 py-1">
                            <div className="flex items-center gap-3 bg-black/25 p-2 rounded-xl border border-white/5">
                              <button
                                onClick={() =>
                                  setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                                }
                                className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 cursor-pointer shadow hover:scale-105 transition"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-1 h-4">
                                  {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 35, 95, 60, 40].map(
                                    (h, i) => (
                                      <span
                                        key={i}
                                        style={{ height: `${h}%` }}
                                        className={`w-1 rounded-full ${
                                          playingAudioId === msg.id
                                            ? 'bg-[#00a884] animate-pulse'
                                            : 'bg-[#8696a0]'
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[#8696a0] mt-1">
                                  <span>0:14</span>
                                  <span className="text-[#34d399] font-mono">1x</span>
                                </div>
                              </div>
                              <Mic className="w-4 h-4 text-[#00a884] shrink-0" />
                            </div>
                            <p className="text-[12px] text-[#e9edef] mt-1 italic">
                              {msg.text.replace(
                                '🎙️ [Áudio de Voz enviado pelo cliente]',
                                'Áudio ouvido e compreendido pela IA Gemini.'
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#e9edef]">
                            {msg.text}
                          </div>
                        )}

                        {/* WhatsApp Reaction Badge Pill */}
                        {msg.reaction && (
                          <div className="absolute -bottom-2.5 right-2 bg-[#1f2c34] border border-[#2a3942] shadow-lg rounded-full px-2 py-0.5 text-xs flex items-center gap-1.5 text-white">
                            <span className="text-sm">{msg.reaction}</span>
                            <span className="text-[9px] text-[#8696a0] font-mono">reagiu</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]">
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual reply bar in dark style */}
              <div className="bg-[#111b21] p-3 border-t border-[#222d34]">
                <form onSubmit={handleSendManualMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      activeThread.botPausedForThisChat
                        ? 'Digite para responder diretamente ao cliente (IA em pausa)...'
                        : 'Digite para responder manualmente a este cliente no WhatsApp...'
                    }
                    className="flex-1 bg-[#202c33] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2a3942] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 placeholder-[#8696a0]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-40 shrink-0"
                    title="Enviar resposta manual"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#64748b] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#101b33] border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Nenhum contato selecionado</h3>
                <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                  A base de dados fictícia foi zerada. Suas conversas reais do WhatsApp aparecerão automaticamente assim que sincronizadas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {onGoToConnect && (
                  <button
                    onClick={onGoToConnect}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/25"
                  >
                    Conectar WhatsApp
                  </button>
                )}
                <button
                  onClick={handleSyncChats}
                  disabled={isSyncingChats}
                  className="bg-[#15223c] hover:bg-[#1e2f52] text-blue-300 border border-blue-500/40 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChats ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Contatos Reais</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
