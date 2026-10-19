import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  MessageSquare,
  Smartphone,
  Copy,
  Check,
  User,
  Phone,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCheck,
  UserCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Radio,
  RotateCcw,
} from 'lucide-react';

interface FormAnswer {
  field: string;
  value: string;
}

interface ExtractedLeadData {
  leadName: string;
  leadPhone: string;
  formAnswers: FormAnswer[];
  summary: string;
  initialMessage: string;
}

export interface LeadFormEntry extends ExtractedLeadData {
  id: string;
  jid: string;
  status: 'contacted' | 'engaged' | 'qualified' | 'handoff';
  stage?: 'awaiting_confirmation' | 'confirmed_triaging' | 'qualified';
  triggerStatus?: 'pending_reply' | 'positive_confirmed' | 'manual_confirmed';
  confirmedAt?: string;
  lastCustomerMessage?: string;
  lastMessage?: string;
  lastTimestamp?: string;
  messagesCount?: number;
  hasReplied?: boolean;
  initialMessageSent?: string;
  source: 'web_panel' | 'whatsapp_photo';
  createdAt: string;
  updatedAt: string;
}

export interface PendingNameConfirmationListProps {
  leads: LeadFormEntry[];
  onConfirmTrigger: (id: string) => Promise<void>;
  onResendTrigger: (id: string) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onGoToInbox?: () => void;
  actionLoadingId: string | null;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onRefresh: () => void;
  isLoadingList: boolean;
}

export const PendingNameConfirmationList: React.FC<PendingNameConfirmationListProps> = ({
  leads,
  onConfirmTrigger,
  onResendTrigger,
  onDeleteLead,
  onGoToInbox,
  actionLoadingId,
  copiedId,
  onCopy,
  onRefresh,
  isLoadingList,
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '--';
    const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Há ${days} d`;
  };

  const isPending = (lead: LeadFormEntry) => {
    if (lead.stage === 'awaiting_confirmation') return true;
    if (lead.triggerStatus === 'pending_reply') return true;
    if (lead.status === 'contacted' && !lead.hasReplied && lead.triggerStatus !== 'positive_confirmed' && lead.triggerStatus !== 'manual_confirmed') {
      return true;
    }
    return false;
  };

  const isConfirmed = (lead: LeadFormEntry) => {
    return !isPending(lead);
  };

  const pendingLeads = leads.filter(isPending);
  const confirmedLeads = leads.filter(isConfirmed);

  const displayedLeads = leads.filter((lead) => {
    // Status filter
    if (filterMode === 'pending' && !isPending(lead)) return false;
    if (filterMode === 'confirmed' && !isConfirmed(lead)) return false;

    // Search filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.leadName?.toLowerCase().includes(term) ||
      lead.leadPhone?.includes(term) ||
      lead.summary?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-[#0b1324] border border-[#131d33] rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header and Statistics */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#131d33] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Gatilho de Identidade & Triagem
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">·</span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              Script Oficial de Confirmação de Nome
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Leads Pendentes de Confirmação de Nome
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            Acompanhe em tempo real o status do gatilho inicial: <span className="text-slate-200 italic font-mono">&quot;Olá, [Nome], tudo bem? Eu estou falando com você mesmo?&quot;</span>. Assim que o cliente der a resposta positiva (&quot;Sim&quot;, &quot;Sou eu&quot;), a IA assume de imediato com o script contextual do Samuel!
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{pendingLeads.length} Aguardando Resposta</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{confirmedLeads.length} Confirmados</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoadingList}
            className="p-2 bg-[#070b14] border border-[#1a2942] hover:bg-[#121c33] text-slate-300 rounded-xl transition cursor-pointer"
            title="Atualizar status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#070b14] p-1 rounded-xl border border-[#1a2942] shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-amber-500 text-black shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendentes ({pendingLeads.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              filterMode === 'confirmed'
                ? 'bg-emerald-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Confirmados ({confirmedLeads.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#182645] text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({leads.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full bg-[#070b14] border border-[#1a2942] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* List of Cards */}
      {displayedLeads.length === 0 ? (
        <div className="py-14 text-center text-slate-500 space-y-3 bg-[#070b14]/50 rounded-2xl border border-[#131d33]">
          {filterMode === 'pending' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Nenhum lead pendente de confirmação!</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Todos os contatos abordados já responderam ou foram confirmados. Novos prints de formulário aparecerão aqui aguardando a resposta positiva.
              </p>
            </>
          ) : (
            <>
              <User className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Nenhum contato encontrado neste filtro.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedLeads.map((lead) => {
            const pending = isPending(lead);
            const isActionLoading = actionLoadingId === lead.id;
            const isExpanded = expandedId === lead.id;
            const leadInitial = lead.leadName ? lead.leadName.charAt(0).toUpperCase() : '?';

            return (
              <div
                key={lead.id}
                className={`rounded-2xl border p-5 transition space-y-4 shadow-lg ${
                  pending
                    ? 'bg-[#090f1e] border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-[#070c18] border-[#182645] hover:border-emerald-500/30'
                }`}
              >
                {/* Top Row: Lead Identity + Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
                        pending
                          ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                          : 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      {leadInitial}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base tracking-tight">
                          {lead.leadName || 'Lead Sem Nome'}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800/80 text-slate-300 border-slate-700">
                          {lead.source === 'whatsapp_photo' ? '📱 WhatsApp' : '💻 Painel Web'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span className="font-mono text-slate-300">+{lead.leadPhone}</span>
                        <button
                          onClick={() => onCopy(`+${lead.leadPhone}`, lead.id)}
                          className="text-slate-500 hover:text-white transition cursor-pointer"
                          title="Copiar WhatsApp"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatRelativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gatilho Status Pill */}
                  <div className="shrink-0">
                    {pending ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Aguardando Resposta Positiva (&quot;Sim&quot;, &quot;Sou eu&quot;)
                      </span>
                    ) : lead.triggerStatus === 'manual_confirmed' ? (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-500/40 flex items-center gap-2 shadow-sm">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        Confirmado Manualmente • Triagem Liberada
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-sm">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Nome Confirmado • IA no Script do Samuel
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Box: Trigger Script & Current Response Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Sent Script */}
                  <div className="bg-[#070b14] border border-[#1a2942] rounded-xl p-3.5 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      Script Inicial Disparado pelo Robô:
                    </span>
                    <p className="text-slate-200 font-medium italic bg-[#0b1324] p-2.5 rounded-lg border border-[#131d33] leading-relaxed">
                      &quot;{lead.initialMessageSent || `Olá, ${lead.leadName || 'tudo bem'}, tudo bem? Eu estou falando com você mesmo?`}&quot;
                    </p>
                  </div>

                  {/* Customer Status */}
                  <div className="bg-[#070b14] border border-[#1a2942] rounded-xl p-3.5 text-xs space-y-1.5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      Status da Resposta do Cliente:
                    </span>

                    {lead.lastCustomerMessage || lead.hasReplied ? (
                      <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Resposta Recebida no WhatsApp:</span>
                        </div>
                        <p className="text-white font-semibold">
                          &quot;{lead.lastCustomerMessage || 'Mensagem confirmada'}&quot;
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          A IA já iniciou o script do Samuel com a contextualização do formulário.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <span className="text-[11px]">
                          Aguardando o lead responder positivamente para ativar a triagem comercial.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Answers Accordion */}
                <div className="bg-[#070b14]/70 border border-[#1a2942] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-[#121c33]/40 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      Respostas do Formulário / Dores Identificadas ({lead.formAnswers?.length || 0} respostas)
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-blue-400">
                      {isExpanded ? 'Ocultar detalhes' : 'Ver respostas'}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-[#1a2942] space-y-3 bg-[#050811]">
                      {lead.summary && (
                        <div className="bg-[#0b1324] border border-[#131d33] p-3 rounded-lg space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                            Resumo do Perfil & Dores (Usado pela IA na conversa):
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">{lead.summary}</p>
                        </div>
                      )}

                      {lead.formAnswers && lead.formAnswers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lead.formAnswers.map((ans, aIdx) => (
                            <div
                              key={aIdx}
                              className="bg-[#0b1324] border border-[#131d33] p-2.5 rounded-lg text-xs"
                            >
                              <p className="text-slate-400 text-[11px] font-medium">{ans.field}:</p>
                              <p className="text-white font-semibold mt-0.5">{ans.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Nenhum campo tabular explícito. A IA conduz a triagem baseada no resumo acima.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#131d33]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Confirm Button */}
                    <button
                      type="button"
                      disabled={isActionLoading || !pending}
                      onClick={() => onConfirmTrigger(lead.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow ${
                        pending
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 opacity-60 cursor-not-allowed'
                      }`}
                      title={
                        pending
                          ? 'Confirmar manualmente se o lead já respondeu por áudio ou de outra forma'
                          : 'Nome já confirmado'
                      }
                    >
                      {isActionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      {pending ? 'Confirmar Nome (Liberar IA)' : 'Nome Já Confirmado'}
                    </button>

                    {/* Resend Trigger Button */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => onResendTrigger(lead.id)}
                      className="px-3.5 py-2 bg-[#121c33] hover:bg-[#182645] border border-[#223558] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                      title="Reenviar a mensagem de confirmação para o WhatsApp do lead"
                    >
                      {isActionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      Reenviar Gatilho
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onGoToInbox && (
                      <button
                        type="button"
                        onClick={onGoToInbox}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Abrir no Monitor
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                      title="Remover lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface FormTriageSectionProps {
  onGoToInbox?: () => void;
  onGoToConnect?: () => void;
}

export const FormTriageSection: React.FC<FormTriageSectionProps> = ({
  onGoToInbox,
  onGoToConnect,
}) => {
  // State for image input
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Extracted lead state (editable)
  const [extractedLead, setExtractedLead] = useState<ExtractedLeadData | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // History / recent list
  const [leadsList, setLeadsList] = useState<LeadFormEntry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // WhatsApp connection status
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check WA status
  const checkWaStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWaConnected(data.status === 'connected');
        setWaPhone(data.userPhone || null);
      }
    } catch {}
  };

  // Fetch recent form leads
  const fetchLeadsList = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/lead-form/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leads)) {
          setLeadsList(data.leads);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar lista de leads de formulário:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    checkWaStatus();
    fetchLeadsList();
    const interval = setInterval(() => {
      checkWaStatus();
      fetchLeadsList();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Global Ctrl+V clipboard paste listener for quick screenshot triage
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process selected image file
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Por favor, selecione um arquivo de imagem válido (PNG, JPEG, WebP).');
      return;
    }

    setAnalysisError(null);
    setDispatchSuccess(null);
    setDispatchError(null);
    setImageMime(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      analyzeImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Call Gemini Vision endpoint
  const analyzeImage = async (base64String: string, mime: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setExtractedLead(null);

    try {
      const res = await fetch('/api/lead-form/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: mime,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao extrair informações do print.');
      }

      const extracted: ExtractedLeadData = {
        leadName: data.leadName || '',
        leadPhone: data.leadPhone || '',
        formAnswers: Array.isArray(data.formAnswers) ? data.formAnswers : [],
        summary: data.summary || '',
        initialMessage: data.initialMessage || '',
      };

      setExtractedLead(extracted);
      setCustomMessage(
        extracted.initialMessage ||
          (extracted.leadName
            ? `Olá, ${extracted.leadName}, tudo bem? Eu estou falando com você mesmo?`
            : 'Olá, tudo bem? Eu estou falando com você mesmo?')
      );
    } catch (err: any) {
      console.error('Falha ao analisar imagem:', err);
      setAnalysisError(err.message || 'Não foi possível ler as respostas do print.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dispatch message and start triage
  const handleDispatch = async () => {
    if (!extractedLead) return;
    if (!extractedLead.leadPhone || extractedLead.leadPhone.replace(/\D/g, '').length < 10) {
      setDispatchError('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    setIsDispatching(true);
    setDispatchError(null);
    setDispatchSuccess(null);

    try {
      const res = await fetch('/api/lead-form/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: extractedLead.leadName,
          leadPhone: extractedLead.leadPhone,
          formAnswers: extractedLead.formAnswers,
          summary: extractedLead.summary,
          customMessage: customMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao disparar mensagem para o lead.');
      }

      setDispatchSuccess(
        `Abordagem disparada com sucesso para ${extractedLead.leadName || 'o lead'}! A triagem com IA está pronta para responder assim que o cliente responder.`
      );

      // Refresh list
      fetchLeadsList();
    } catch (err: any) {
      setDispatchError(err.message || 'Erro no envio da mensagem.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Action loading and toast states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirm trigger manually (advances lead to active triage)
  const handleConfirmTrigger = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/lead-form/confirm-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao confirmar gatilho');
      }
      setActionToast({
        type: 'success',
        message: 'Nome do lead confirmado com sucesso! A triagem com IA está liberada para este contato.',
      });
      fetchLeadsList();
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Erro ao confirmar gatilho.',
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionToast(null), 5000);
    }
  };

  // Resend initial confirmation trigger message
  const handleResendTrigger = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/lead-form/resend-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao reenviar gatilho');
      }
      setActionToast({
        type: 'success',
        message: 'Gatilho de confirmação reenviado no WhatsApp com sucesso!',
      });
      fetchLeadsList();
    } catch (err: any) {
      setActionToast({
        type: 'error',
        message: err.message || 'Erro ao reenviar gatilho.',
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionToast(null), 5000);
    }
  };

  // Delete lead from list
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Deseja remover este lead do histórico de triagens?')) return;
    try {
      const res = await fetch(`/api/lead-form/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeadsList((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leadsList.filter((lead) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.leadName?.toLowerCase().includes(term) ||
      lead.leadPhone?.includes(term) ||
      lead.summary?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Header Card */}
      <div className="bg-[#0b1324] border border-[#131d33] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              RespondeForm AI • Visão Multimodal
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">·</span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              Abordagem Humanizada & Triagem de Formulários
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Triagem Instantânea por Print de Formulário
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Tire um print das respostas do seu formulário (Google Forms, Typeform, RespondeForm, RD Station ou Hotmart) e aperte <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + V</strong> em qualquer lugar da tela. A IA lê o nome, telefone e respostas, inicia o contato com uma abordagem curta e conduz toda a triagem!
          </p>
        </div>

        {/* WhatsApp Connection Status Badge & Quick Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
              waConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                waConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <div className="text-xs">
              <p className="font-bold">
                {waConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {waConnected ? `+${waPhone || 'Ativo'}` : 'Escaneie o QR Code para disparar'}
              </p>
            </div>
          </div>

          {onGoToInbox && (
            <button
              onClick={onGoToInbox}
              className="px-4 py-2.5 bg-[#121c33] hover:bg-[#182645] border border-[#223558] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Monitor de Contatos
            </button>
          )}
        </div>
      </div>

      {/* Main Operational Workspace: Left Upload / Right Extracted Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Drop / Upload Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0b1324] border border-[#131d33] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                1. Print do Formulário
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Suporta PNG / JPEG / WebP</span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition relative overflow-hidden ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : imagePreview
                  ? 'border-[#223558] bg-[#070b14]'
                  : 'border-[#1a2942] hover:border-blue-500/60 bg-[#070b14]/60 hover:bg-[#070b14]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {imagePreview ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="relative max-h-72 w-full rounded-lg overflow-hidden border border-[#1a2942] group">
                    <img
                      src={imagePreview}
                      alt="Print do Formulário"
                      className="w-full h-auto object-contain max-h-72 bg-black/40"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-lg shadow">
                        Clique para trocar imagem
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Print carregado</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setExtractedLead(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 ml-2 underline cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Arraste ou cole o print aqui (<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-200">Ctrl + V</kbd>)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ou clique para escolher o print nos seus arquivos
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Loading State */}
            {isAnalyzing && (
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold">Lendo documento com Gemini 3.8 Flash Vision...</p>
                  <p className="text-[11px] text-blue-400/80">
                    Identificando nome, WhatsApp, perguntas e respostas do formulário.
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Erro na leitura do print</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">{analysisError}</p>
                </div>
              </div>
            )}

            {/* Mobile / WhatsApp Tip */}
            <div className="bg-[#070b14] border border-[#1a2942] rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Como disparar direto pelo seu celular:
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Você também pode enviar o print direto no seu WhatsApp! Basta mandar a foto no chat do robô ou colocar o telefone na legenda (ex: <code className="text-emerald-400 font-mono">#lead 11999998888</code>). A IA lê a imagem e dispara a abordagem na hora!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Review Extracted Lead & 1-Click Dispatch */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0b1324] border border-[#131d33] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#131d33] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  2. Dados Extraídos & Triagem Personalizada
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revise as informações identificadas antes de iniciar o contato com o cliente
                </p>
              </div>

              {extractedLead && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  IA Estruturada
                </span>
              )}
            </div>

            {!extractedLead && !isAnalyzing ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-400">
                  Nenhum print carregado no momento
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Envie ou cole a imagem do formulário ao lado para a inteligência artificial extrair o nome, número e respostas automaticamente.
                </p>
              </div>
            ) : extractedLead ? (
              <div className="space-y-5">
                {/* Contact Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Nome do Lead
                    </label>
                    <input
                      type="text"
                      value={extractedLead.leadName}
                      onChange={(e) =>
                        setExtractedLead({ ...extractedLead, leadName: e.target.value })
                      }
                      placeholder="Ex: Samuel Galdino"
                      className="w-full bg-[#070b14] border border-[#1a2942] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Telefone / WhatsApp (com DDD)
                    </label>
                    <input
                      type="text"
                      value={extractedLead.leadPhone}
                      onChange={(e) =>
                        setExtractedLead({ ...extractedLead, leadPhone: e.target.value })
                      }
                      placeholder="Ex: 5511999998888 ou 11988887777"
                      className="w-full bg-[#070b14] border border-[#1a2942] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-600 outline-none transition"
                    />
                  </div>
                </div>

                {/* Summary Card */}
                {extractedLead.summary && (
                  <div className="bg-[#070b14] border border-[#1a2942] rounded-xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Resumo das Necessidades (Visão Executiva)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {extractedLead.summary}
                    </p>
                  </div>
                )}

                {/* Extracted Form Answers */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Respostas Identificadas no Formulário ({extractedLead.formAnswers.length})</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      A IA usará estas respostas para triar o cliente
                    </span>
                  </span>

                  <div className="bg-[#070b14] border border-[#1a2942] rounded-xl divide-y divide-[#131d33] max-h-56 overflow-y-auto">
                    {extractedLead.formAnswers.length > 0 ? (
                      extractedLead.formAnswers.map((item, idx) => (
                        <div key={idx} className="p-3 text-xs space-y-0.5">
                          <p className="text-slate-400 font-medium">{item.field}:</p>
                          <p className="text-white font-semibold">{item.value}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-slate-500 text-center">
                        Nenhuma resposta tabular extraída diretamente. O resumo acima será utilizado para conduzir a conversa.
                      </div>
                    )}
                  </div>
                </div>

                {/* Approach Message Preview (Editable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      Gatilho Inicial de Disparo (Script Obrigatório do Samuel)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMessage(
                          extractedLead.leadName
                            ? `Olá, ${extractedLead.leadName}, tudo bem? Eu estou falando com você mesmo?`
                            : 'Olá, tudo bem? Eu estou falando com você mesmo?'
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Restaurar padrão
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-[#070b14] border border-[#1a2942] focus:border-blue-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none transition resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 <strong>Gatilho Inicial do Formulário:</strong> O robô dispara: &quot;Olá, {extractedLead.leadName || '[Nome]'}, tudo bem? Eu estou falando com você mesmo?&quot;. Assim que o usuário der a <strong>resposta positiva</strong> (&quot;Sim&quot;, &quot;Sou eu&quot;, etc.), <strong>a IA assume no script do Samuel:</strong> &quot;Maravilha, aqui é o Samuel...&quot;, contextualiza o formulário e avança para a triagem com as respostas prévias!
                  </p>
                </div>

                {/* Feedback Alerts */}
                {dispatchError && (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{dispatchError}</span>
                  </div>
                )}

                {dispatchSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dispatchSuccess}</span>
                    </div>
                    {onGoToInbox && (
                      <button
                        onClick={onGoToInbox}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow transition"
                      >
                        Ver no Monitor
                      </button>
                    )}
                  </div>
                )}

                {/* Dispatch Button */}
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={handleDispatch}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Disparando no WhatsApp...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Disparar Abordagem no WhatsApp (1 Clique)
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionToast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-xl transition animate-in fade-in slide-in-from-top-2 ${
            actionToast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{actionToast.message}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Componente de Interface Dedicado: Lista de Leads Pendentes de Confirmação de Nome */}
      <PendingNameConfirmationList
        leads={leadsList}
        onConfirmTrigger={handleConfirmTrigger}
        onResendTrigger={handleResendTrigger}
        onDeleteLead={handleDeleteLead}
        onGoToInbox={onGoToInbox}
        actionLoadingId={actionLoadingId}
        copiedId={copiedId}
        onCopy={copyToClipboard}
        onRefresh={fetchLeadsList}
        isLoadingList={isLoadingList}
      />

      {/* History & Dispatched Form Leads Table */}
      <div className="bg-[#0b1324] border border-[#131d33] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#131d33] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Histórico de Leads Triados por Formulário ({leadsList.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Leads capturados via print ou WhatsApp e encaminhados para a triagem da IA
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar lead ou telefone..."
                className="w-full bg-[#070b14] border border-[#1a2942] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={fetchLeadsList}
              disabled={isLoadingList}
              className="p-2 bg-[#070b14] border border-[#1a2942] hover:bg-[#121c33] text-slate-300 rounded-xl transition cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <User className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400">Nenhum lead de formulário registrado ainda.</p>
            <p className="text-[11px] text-slate-600">
              Cole o primeiro print acima para disparar o atendimento autônomo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#131d33] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Resumo da Triagem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131d33] text-xs">
                {filteredLeads.map((lead) => {
                  const dateStr = lead.createdAt
                    ? new Date(lead.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--';

                  const statusConfig = {
                    contacted: { label: 'Abordado', color: 'bg-blue-950/60 text-blue-300 border-blue-500/30' },
                    engaged: { label: 'Em Conversa', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' },
                    qualified: { label: 'Qualificado', color: 'bg-purple-950/60 text-purple-300 border-purple-500/30' },
                    handoff: { label: 'Transbordo', color: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
                  }[lead.status] || { label: 'Abordado', color: 'bg-blue-950/60 text-blue-300 border-blue-500/30' };

                  return (
                    <tr key={lead.id} className="hover:bg-[#070b14]/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{lead.leadName || 'Sem nome'}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>+{lead.leadPhone}</span>
                          <button
                            onClick={() => copyToClipboard(`+${lead.leadPhone}`, lead.id)}
                            className="text-slate-500 hover:text-white transition"
                            title="Copiar número"
                          >
                            {copiedId === lead.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800/80 text-slate-300 border-slate-700">
                          {lead.source === 'whatsapp_photo' ? '📱 WhatsApp' : '💻 Painel Web'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                          {lead.summary || 'Sem resumo'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onGoToInbox && (
                            <button
                              onClick={onGoToInbox}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              title="Abrir no Monitor de Contatos"
                            >
                              Abrir Chat
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remover do histórico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
