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
  Plus,
  Users,
  Smartphone,
  Trash2,
  X,
  Radio,
  Share2,
} from 'lucide-react';
import { SentimentType, SentimentAnalysis, SentimentOverview } from '../types';

interface LiveMessage {
  id: string;
  chatJid: string;
  senderName: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  timestampMs?: number;
  isAiResponse?: boolean;
  isAudio?: boolean;
  reaction?: string;
}

interface LeadFormFieldAnswer {
  field: string;
  value: string;
}

interface LeadFormContext {
  id: string;
  leadName: string;
  leadPhone: string;
  extractedAt: string;
  formAnswers: LeadFormFieldAnswer[];
  summary: string;
  status: 'contacted' | 'engaged' | 'qualified' | 'handoff';
  initialMessageSent: string;
}

interface ChatThread {
  jid: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
  lastMessageAt?: number;
  unreadCount: number;
  messages: LiveMessage[];
  botPausedForThisChat?: boolean;
  notifiedOutOfHours?: boolean;
  sentiment?: SentimentAnalysis;
  leadFormContext?: LeadFormContext;
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'direct' | 'group'>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [sentimentOverview, setSentimentOverview] = useState<SentimentOverview | null>(null);
  const [showSentimentPanel, setShowSentimentPanel] = useState(false);
  const [isSyncingChats, setIsSyncingChats] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Connection metadata
  const [isWaConnected, setIsWaConnected] = useState<boolean>(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<{
    activeChats: number;
    totalContacts: number;
    totalMessages: number;
  }>({ activeChats: 0, totalContacts: 0, totalMessages: 0 });

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatInitialMessage, setNewChatInitialMessage] = useState('Olá! Como posso ajudar você hoje?');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [createChatError, setCreateChatError] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/whatsapp/chats');
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        setAutoReplyEnabled(Boolean(data.autoReplyEnabled));
        setIsWaConnected(Boolean(data.isWaConnected));
        setConnectedPhone(data.userPhone || null);
        if (data.stats) {
          setStatsData({
            activeChats: data.stats.activeChats || (data.threads?.length || 0),
            totalContacts: data.stats.totalContacts || (data.threads?.length || 0),
            totalMessages: data.stats.totalMessages || 0,
          });
        }
        if (data.sentimentOverview) {
          setSentimentOverview(data.sentimentOverview);
        }

        // Select first chat if none selected
        if (data.threads?.length > 0) {
          setSelectedJid((current) => current || data.threads[0].jid);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    }
  };

  const handleSyncChats = async () => {
    setIsSyncingChats(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/sync-chats', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.threads?.length > 0) {
          setSelectedJid((current) => current || data.threads[0].jid);
        }
        setSyncFeedback(
          data.message ||
            `${data.activeChats || 0} conversas e contatos reais sincronizados com sucesso!`
        );
        setTimeout(() => setSyncFeedback(null), 5000);
      }
    } catch (err) {
      console.error('Erro ao sincronizar chats:', err);
      setSyncFeedback('Erro ao conectar ao serviço de sincronização.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncingChats(false);
    }
  };

  // Poll chats and sentiments every 2.5 seconds
  useEffect(() => {
    let isMounted = true;
    fetchChats();
    const interval = setInterval(() => {
      if (isMounted) fetchChats();
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeThread = threads.find((t) => t.jid === selectedJid);

  const handleSelectThread = async (jid: string) => {
    setSelectedJid(jid);
    setThreads((current) =>
      current.map((thread) =>
        thread.jid === jid ? { ...thread, unreadCount: 0 } : thread
      )
    );

    try {
      const res = await fetch('/api/whatsapp/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid }),
      });
      if (!res.ok) throw new Error('Não foi possível marcar a conversa como lida.');
    } catch (err) {
      console.error('Erro ao marcar conversa como lida:', err);
    }
  };

  // Dissatisfied alerts
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
        fetchChats();
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
      fetchChats();
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

  const handleDeleteChat = async (e: React.MouseEvent, jid: string) => {
    e.stopPropagation();
    if (!confirm('Deseja remover esta conversa da visualização do Monitor?')) return;
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodeURIComponent(jid)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.jid !== jid));
        if (selectedJid === jid) {
          const remaining = threads.filter((t) => t.jid !== jid);
          setSelectedJid(remaining.length > 0 ? remaining[0].jid : null);
        }
      }
    } catch (err) {
      console.error('Erro ao remover conversa:', err);
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateChatError(null);
    if (!newChatPhone.trim()) {
      setCreateChatError('Informe o número de telefone com DDD (ex: 11999998888).');
      return;
    }

    setIsCreatingChat(true);
    try {
      const res = await fetch('/api/whatsapp/chats/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newChatPhone.trim(),
          name: newChatName.trim() || undefined,
          initialMessage: newChatInitialMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setThreads((prev) => {
            const exists = prev.some((t) => t.jid === data.thread.jid);
            return exists ? prev.map((t) => (t.jid === data.thread.jid ? data.thread : t)) : [data.thread, ...prev];
          });
          setSelectedJid(data.thread.jid);
        }
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
        setNewChatInitialMessage('Olá! Como posso ajudar você hoje?');
        fetchChats();
      } else {
        const errData = await res.json();
        setCreateChatError(errData.error || 'Erro ao criar conversa.');
      }
    } catch (err: any) {
      setCreateChatError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const placeholderMessages = [
    'Contato sincronizado da agenda',
    'Conversa sincronizada do WhatsApp',
    'Histórico sincronizado',
  ];
  const conversationThreads = threads.filter(
    (thread) =>
      thread.messages.length > 0 ||
      thread.unreadCount > 0 ||
      Boolean(thread.lastMessageAt) ||
      (Boolean(thread.lastMessage) &&
        !placeholderMessages.includes(thread.lastMessage) &&
        !thread.lastMessage.startsWith('Grupo com '))
  );

  const getLegacyTimeOfDay = (thread: ChatThread) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(thread.lastTimestamp || '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  };

  // Keep the list WhatsApp-like: active conversations only, unread first, newest next.
  const filteredThreads = conversationThreads
    .filter((t) => {
      const isGroup = t.jid.endsWith('@g.us');
      if (typeFilter === 'direct' && isGroup) return false;
      if (typeFilter === 'group' && !isGroup) return false;

      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.jid.includes(searchTerm);

      if (!matchesSearch) return false;
      if (sentimentFilter === 'all') return true;
      return t.sentiment?.sentiment === sentimentFilter;
    })
    .sort((a, b) => {
      const unreadDifference = Number(b.unreadCount > 0) - Number(a.unreadCount > 0);
      if (unreadDifference !== 0) return unreadDifference;

      const activityDifference = (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      if (activityDifference !== 0) return activityDifference;

      const messageDifference = Number(b.messages.length > 0) - Number(a.messages.length > 0);
      if (messageDifference !== 0) return messageDifference;

      const legacyTimeDifference = getLegacyTimeOfDay(b) - getLegacyTimeOfDay(a);
      if (legacyTimeDifference !== 0) return legacyTimeDifference;

      return a.name.localeCompare(b.name, 'pt-BR');
    });

  const formatConversationTime = (thread: ChatThread) => {
    if (!thread.lastMessageAt) return thread.lastTimestamp || '';

    const messageDate = new Date(thread.lastMessageAt);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfMessageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    ).getTime();
    const dayDifference = Math.round((startOfToday - startOfMessageDay) / 86_400_000);

    if (dayDifference === 0) {
      return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (dayDifference === 1) return 'Ontem';
    if (dayDifference > 1 && dayDifference < 7) {
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    }
    return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

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

  // Stats
  const satisfiedTotal = threads.filter((t) => t.sentiment?.sentiment === 'Satisfeito').length;
  const neutralTotal = threads.filter((t) => t.sentiment?.sentiment === 'Neutro').length;
  const dissatisfiedTotal = threads.filter((t) => t.sentiment?.sentiment === 'Insatisfeito').length;
  const directCount = conversationThreads.filter((t) => !t.jid.endsWith('@g.us')).length;
  const groupCount = conversationThreads.filter((t) => t.jid.endsWith('@g.us')).length;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Metrics in Arco CRM Dark Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-blue-400" />
              Monitor de Contatos Reais
            </span>
            {isWaConnected ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                WhatsApp Conectado {connectedPhone ? `(+${connectedPhone})` : ''}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-600/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                WhatsApp Desconectado (Dados Salvos)
              </span>
            )}
            <span className="text-[11px] font-bold text-[#c084fc] bg-[#1e153b] border border-[#7e22ce]/40 px-2.5 py-0.5 rounded-full uppercase">
              IA Gemini Multimodal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Monitor de Contatos & Histórico em Tempo Real
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-3xl">
            Sincronização direta com a sua conta do WhatsApp. Visualize conversas reais, contatos da agenda,
            grupos, áudios ouvidos e diagnóstico contínuo de sentimento por inteligência artificial.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-blue-600/25 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Conversa</span>
          </button>

          <button
            onClick={handleSyncChats}
            disabled={isSyncingChats}
            title="Sincronizar conversas e contatos do WhatsApp conectado"
            className="flex items-center gap-2 bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChats ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isSyncingChats ? 'Sincronizando...' : 'Sincronizar Contatos'}</span>
          </button>

          <button
            onClick={() => setShowSentimentPanel(!showSentimentPanel)}
            className="flex items-center gap-2 bg-[#0e1628] hover:bg-[#15223c] text-white border border-[#1a263d] px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>{showSentimentPanel ? 'Ocultar Métricas IA' : 'Métricas IA'}</span>
            {showSentimentPanel ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#64748b]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />
            )}
          </button>

          <div className="bg-[#0e1628] border border-[#1a263d] text-[#94a3b8] px-3 py-1.5 rounded-full text-xs font-mono">
            {threads.length} Contatos • {statsData.totalMessages} Mensagens
          </div>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="bg-[#10243e] border border-blue-500/50 text-blue-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-blue-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* WhatsApp Disconnected Notice Banner if user is not connected */}
      {!isWaConnected && (
        <div className="bg-gradient-to-r from-[#17130b] via-[#21190d] to-[#120e06] border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">WhatsApp desconectado no momento</h4>
              <p className="text-[11px] text-amber-200/80">
                Conecte seu WhatsApp escaneando o QR Code para sincronizar contatos e responder clientes em tempo real.
              </p>
            </div>
          </div>
          {onGoToConnect && (
            <button
              onClick={onGoToConnect}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Conectar com QR Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 🚨 CRITICAL SENTIMENT ALERT BANNER */}
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
                  {threads.length} conversas reais sob monitoramento
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                Painel Geral de Análise de Sentimento
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Classificação contínua do tom das conversas para identificar clientes satisfeitos, dúvidas e urgências.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReanalyzeSentiment()}
                disabled={isAnalyzingSentiment || threads.length === 0}
                className="flex items-center gap-1.5 bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingSentiment ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingSentiment ? 'Diagnosticando...' : 'Reanalisar Tudo com Gemini'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total */}
            <div
              onClick={() => setSentimentFilter('all')}
              className={`bg-[#0e1628] border rounded-2xl p-4 shadow-sm transition cursor-pointer ${
                sentimentFilter === 'all'
                  ? 'border-blue-500 bg-[#101b33]/60'
                  : 'border-[#1a263d] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total de Conversas
                </span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{threads.length}</div>
              <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">
                {directCount} contatos diretos • {groupCount} grupos
              </p>
            </div>

            {/* Satisfeitos */}
            <div
              onClick={() => setSentimentFilter('Satisfeito')}
              className={`bg-[#0e1628] border rounded-2xl p-4 shadow-sm transition cursor-pointer ${
                sentimentFilter === 'Satisfeito'
                  ? 'border-emerald-500 bg-[#082218]/60'
                  : 'border-[#1a263d] hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <SmilePlus className="w-4 h-4 text-emerald-400" />
                  Satisfeitos
                </span>
                <span className="text-xs font-bold text-emerald-400">😊</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                {satisfiedTotal}
                <span className="text-xs font-normal text-[#64748b] ml-1">
                  ({threads.length > 0 ? Math.round((satisfiedTotal / threads.length) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">
                Pagamentos confirmados e elogios
              </p>
            </div>

            {/* Neutros */}
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
                  ({threads.length > 0 ? Math.round((neutralTotal / threads.length) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1">Dúvidas gerais e consultas de preços</p>
            </div>

            {/* Insatisfeitos */}
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
                  Insatisfeitos
                </span>
                <span className="text-xs font-bold text-rose-400">🚨</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
                {dissatisfiedTotal}
                <span className="text-xs font-normal text-[#64748b] ml-1">
                  ({threads.length > 0 ? Math.round((dissatisfiedTotal / threads.length) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 mt-1 font-medium">Reclamações ou atrasos</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Inbox Interface */}
      <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[760px]">
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
                placeholder="Buscar por nome, telefone ou texto..."
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

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 border-b border-[#1a263d]/60 pb-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                }`}
              >
                Todos ({conversationThreads.length})
              </button>
              <button
                onClick={() => setTypeFilter('direct')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'direct'
                    ? 'bg-blue-600 text-white'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                }`}
              >
                <User className="w-3 h-3" />
                Privados ({directCount})
              </button>
              <button
                onClick={() => setTypeFilter('group')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'group'
                    ? 'bg-blue-600 text-white'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                }`}
              >
                <Users className="w-3 h-3" />
                Grupos ({groupCount})
              </button>
            </div>

            {/* Sentiment Quick Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setSentimentFilter('all')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'all' ? 'bg-slate-700 text-white' : 'text-[#64748b] hover:text-white'
                }`}
              >
                Qualquer Sentimento
              </button>
              <button
                onClick={() => setSentimentFilter('Satisfeito')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Satisfeito'
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#64748b] hover:text-emerald-300'
                }`}
              >
                😊 ({satisfiedTotal})
              </button>
              <button
                onClick={() => setSentimentFilter('Neutro')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Neutro'
                    ? 'bg-slate-700 text-white'
                    : 'text-[#64748b] hover:text-white'
                }`}
              >
                😐 ({neutralTotal})
              </button>
              <button
                onClick={() => setSentimentFilter('Insatisfeito')}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                  sentimentFilter === 'Insatisfeito'
                    ? 'bg-rose-600 text-white'
                    : 'text-[#64748b] hover:text-rose-300'
                }`}
              >
                🚨 ({dissatisfiedTotal})
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#131d33]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#101b33] border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Nenhum contato encontrado</h4>
                  <p className="text-xs leading-relaxed text-[#94a3b8] mt-1 max-w-xs mx-auto">
                    {conversationThreads.length === 0
                      ? 'Nenhuma conversa ativa no momento. Sincronize com seu WhatsApp ou inicie um novo contato.'
                      : 'Nenhuma conversa corresponde aos filtros selecionados.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                  <button
                    onClick={handleSyncChats}
                    disabled={isSyncingChats}
                    className="w-full bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/40 text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingChats ? 'animate-spin' : ''}`} />
                    <span>Sincronizar Contatos do WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar Nova Conversa</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.jid === selectedJid;
                const badge = getSentimentBadge(thread.sentiment?.sentiment);
                const isAlert = thread.sentiment?.sentiment === 'Insatisfeito';
                const isGroup = thread.jid.endsWith('@g.us');
                const cleanPhone = thread.jid.split('@')[0];

                return (
                  <div
                    key={thread.jid}
                    onClick={() => void handleSelectThread(thread.jid)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer group relative ${
                      isSelected
                        ? 'bg-[#101b33] border-l-4 border-blue-500 text-white'
                        : isAlert
                        ? 'bg-[#1c0d13]/70 hover:bg-[#261019] border-l-4 border-rose-500 text-slate-200'
                        : 'hover:bg-[#0e1628] text-slate-300'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border relative ${
                        isAlert
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : isGroup
                          ? 'bg-[#1e1b4b] border-indigo-500/40 text-indigo-300'
                          : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                      }`}
                    >
                      {isGroup ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        thread.name.charAt(0).toUpperCase()
                      )}
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-[#0b1220] ${badge.dot}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{thread.name}</span>
                          {isGroup && (
                            <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded uppercase">
                              Grupo
                            </span>
                          )}
                          {thread.botPausedForThisChat && (
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded uppercase">
                              Manual
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-[#64748b] font-mono shrink-0">
                          {formatConversationTime(thread)}
                        </span>
                      </div>

                      {/* Phone & Sentiment pill badge */}
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}
                          >
                            <span>{badge.emoji}</span>
                            <span>{thread.sentiment?.sentiment || 'Neutro'}</span>
                          </span>

                          {!isGroup && (
                            <span className="text-[10px] text-[#64748b] font-mono">
                              +{cleanPhone}
                            </span>
                          )}
                        </div>

                        {thread.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {thread.unreadCount}
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

                    {/* Delete action button on hover */}
                    <button
                      onClick={(e) => handleDeleteChat(e, thread.jid)}
                      title="Remover conversa do monitor"
                      className="opacity-0 group-hover:opacity-100 text-[#64748b] hover:text-rose-400 p-1 transition cursor-pointer self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                      activeThread.jid.endsWith('@g.us')
                        ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-200'
                        : 'bg-blue-600/30 border-blue-400/50 text-blue-200'
                    }`}
                  >
                    {activeThread.jid.endsWith('@g.us') ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      activeThread.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-white flex items-center gap-2 flex-wrap">
                      <span>{activeThread.name}</span>
                      {!activeThread.jid.endsWith('@g.us') && (
                        <span className="text-[10px] bg-[#1e293b] text-[#94a3b8] px-2 py-0.5 rounded-full font-mono border border-slate-700">
                          +{activeThread.jid.split('@')[0]}
                        </span>
                      )}
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

              {/* 📋 RESPONDEFORME AI FORM TRIAGE STRIP */}
              {activeThread.leadFormContext && (
                <div className="bg-[#0b1324] border-b border-[#1a2942] px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-500/40 shrink-0">
                      📋 RespondeForm AI
                    </span>
                    <span className="truncate text-slate-300 text-[11px]">
                      <strong>Perfil do Formulário:</strong> {activeThread.leadFormContext.summary || 'Respostas de formulário registradas'}
                    </span>
                  </div>
                  {activeThread.leadFormContext.formAnswers && activeThread.leadFormContext.formAnswers.length > 0 && (
                    <span className="text-[10px] text-slate-400 shrink-0 hidden md:inline ml-2 font-mono">
                      {activeThread.leadFormContext.formAnswers.length} perguntas respondidas
                    </span>
                  )}
                </div>
              )}

              {/* 🎯 AI SENTIMENT DIAGNOSTIC STRIP ON ACTIVE CHAT */}
              {activeThread.sentiment && (
                <div
                  className={`px-4 py-2.5 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner ${
                    activeThread.sentiment.sentiment === 'Insatisfeito'
                      ? 'bg-[#220d14] border-rose-500/40 text-rose-200'
                      : activeThread.sentiment.sentiment === 'Satisfeito'
                      ? 'bg-[#091f16] border-emerald-500/40 text-emerald-200'
                      : 'bg-[#0e1724] border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold shadow-md ${
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Sentimento: {activeThread.sentiment.sentiment}</span>
                        {activeThread.sentiment.score !== undefined && (
                          <span className="font-mono text-[10px] opacity-80">
                            ({activeThread.sentiment.score}% de satisfação)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-90 line-clamp-1">{activeThread.sentiment.reason}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReanalyzeSentiment(activeThread.jid)}
                    disabled={isAnalyzingSentiment}
                    className="text-[10px] font-semibold underline text-blue-400 hover:text-blue-300 shrink-0 cursor-pointer"
                  >
                    Atualizar Diagnóstico
                  </button>
                </div>
              )}

              {/* Chat Messages Body */}
              <div
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
                style={{ backgroundColor: '#0b141a' }}
              >
                {activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#8696a0] space-y-2 py-12">
                    <div className="w-12 h-12 rounded-full bg-[#111b21] flex items-center justify-center border border-[#222d34]">
                      <MessageSquare className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-xs text-[#94a3b8]">
                      Conversa aberta no WhatsApp. Envie uma mensagem manual abaixo ou aguarde a resposta do cliente.
                    </p>
                  </div>
                ) : (
                  activeThread.messages.map((msg) => {
                    const isMe = msg.fromMe;
                    const isAudio = msg.isAudio || msg.text?.includes('🎙️');

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-md relative ${
                            isMe
                              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                              : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                          }`}
                        >
                          {/* Sender name tag */}
                          <div className="text-[10px] font-bold mb-0.5 flex items-center justify-between gap-3 text-[#8696a0]">
                            <span>{msg.senderName}</span>
                            {msg.isAiResponse && (
                              <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1 rounded border border-emerald-500/30">
                                IA
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
                                  'Áudio ouvido e transcrito pela IA Gemini.'
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
                  })
                )}
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
                        ? 'Digite para responder diretamente ao cliente no WhatsApp (IA pausada)...'
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
                  Selecione uma conversa ao lado para acompanhar o atendimento em tempo real, ou sincronize seus contatos do WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center">
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
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-[#0e1628] hover:bg-[#162547] text-white border border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Novo Contato</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Iniciar Nova Conversa com Contato */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Iniciar Conversa no WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-[#64748b] hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {createChatError && (
              <div className="bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createChatError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewChat} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Telefone do WhatsApp *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#64748b] font-mono">+55</span>
                  <input
                    type="text"
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    placeholder="11999998888 ou 21988887777"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl pl-11 pr-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-[#64748b] mt-0.5">
                  Informe o DDD + número do cliente (com ou sem o dígito 9).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensagem Inicial (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newChatInitialMessage}
                  onChange={(e) => setNewChatInitialMessage(e.target.value)}
                  placeholder="Mensagem para iniciar o atendimento..."
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-[#64748b] mt-0.5">
                  {isWaConnected
                    ? 'A mensagem será enviada diretamente pelo WhatsApp conectado.'
                    : 'A conversa será adicionada ao Monitor e poderá ser enviada assim que o WhatsApp for conectado.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#131d33] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isCreatingChat && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Abrir Conversa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
