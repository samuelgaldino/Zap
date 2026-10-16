import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Sliders,
  Check,
  Plus,
  Trash2,
  Clock,
  ShieldAlert,
  Send,
  Bot,
  User,
  RotateCcw,
  Building,
  Save,
  MessageSquare,
  HelpCircle,
  Headphones,
  ThumbsUp,
  Smile,
  Heart,
  Flame,
  Volume2,
  Zap,
  Activity,
  FileUp,
  FileText,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { BotScheduleSettings } from './BotScheduleSettings';

interface TrainingData {
  businessName: string;
  niche: string;
  personaName: string;
  tone: string;
  greeting: string;
  knowledgeBase: string;
  rules: string[];
  humanHandoffKeywords: string[];
  autoReplyOnlyPrivate: boolean;
  simulatedTypingDelay: number;
  enableAudioListening?: boolean;
  enableContextReactions?: boolean;
  humanizedEmojis?: boolean;
}

interface TrainingStudioProps {
  onGoToConnect: () => void;
  onGoToInbox: () => void;
  onGoToSettings?: () => void;
}

export const TrainingStudio: React.FC<TrainingStudioProps> = ({
  onGoToConnect,
  onGoToInbox,
  onGoToSettings,
}) => {
  const [training, setTraining] = useState<TrainingData>({
    businessName: '',
    niche: '',
    personaName: '',
    tone: 'friendly',
    greeting: '',
    knowledgeBase: '',
    rules: [],
    humanHandoffKeywords: [],
    autoReplyOnlyPrivate: true,
    simulatedTypingDelay: 3,
    enableAudioListening: true,
    enableContextReactions: true,
    humanizedEmojis: true,
  });

  const [activeSubTab, setActiveSubTab] = useState<'content' | 'importScript' | 'schedule'>('content');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Script import state
  const [scriptPastedText, setScriptPastedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Test prompt simulator state
  const [testQuestion, setTestQuestion] = useState('');
  const [testAnswer, setTestAnswer] = useState('');
  const [testReaction, setTestReaction] = useState<string | null>(null);
  const [testingAi, setTestingAi] = useState(false);

  // Load existing training from server
  useEffect(() => {
    fetch('/api/whatsapp/training')
      .then((res) => res.json())
      .then((data) => {
        setTraining({
          enableAudioListening: true,
          enableContextReactions: true,
          humanizedEmojis: true,
          ...data,
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(training),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar treinamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setScriptPastedText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessScript = async () => {
    if (!scriptPastedText.trim() || isAnalyzingScript) return;
    setIsAnalyzingScript(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/training/import-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptPastedText,
          fileName: uploadedFileName || 'Texto colado',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data.data);
        if (data.training) {
          setTraining(data.training);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao processar script.');
      }
    } catch (err) {
      console.error('Falha ao importar script:', err);
      alert('Erro na conexão ao analisar script.');
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  const handleTestQuestion = async (customQ?: string) => {
    const q = customQ || testQuestion;
    if (!q.trim() || testingAi) return;

    setTestingAi(true);
    setTestAnswer('');
    setTestReaction(null);
    try {
      const res = await fetch('/api/whatsapp/test-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          customTraining: training,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestAnswer(data.reply);
        setTestReaction(data.reaction || null);
      }
    } catch (err) {
      console.error(err);
      setTestAnswer('Erro ao testar com a IA.');
    } finally {
      setTestingAi(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setTraining({
      ...training,
      rules: [...(training.rules || []), newRule.trim()],
    });
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setTraining({
      ...training,
      rules: training.rules.filter((_, idx) => idx !== index),
    });
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setTraining({
      ...training,
      humanHandoffKeywords: [
        ...(training.humanHandoffKeywords || []),
        newKeyword.trim().toLowerCase(),
      ],
    });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    setTraining({
      ...training,
      humanHandoffKeywords: training.humanHandoffKeywords.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header in Arco CRM Dark Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Treinamento & IA Humanizada
            </span>
            <span className="text-[11px] font-bold text-[#c084fc] bg-[#1e153b] border border-[#7e22ce]/40 px-2 py-0.5 rounded-full uppercase">
              Zero Robô
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Ensine seu Bot a Agir e Conversar como uma Pessoa
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
            A IA ouve áudios de voz, reage com emojis no momento certo (como 👍, ❤️, 🔥, 🙏) e conversa com simpatia natural sem parecer um robô tradicional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Treinamento'}
          </button>
        </div>
      </div>

      {/* Sub Tabs: Treinamento vs Importar Script vs Horários de Pausa */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1a263d] pb-3">
        <button
          onClick={() => setActiveSubTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'content'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-[#0e1628] text-[#94a3b8] hover:text-white border border-[#1a263d]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Base de Conhecimento & Treinamento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('importScript')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'importScript'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-[#0e1628] text-[#94a3b8] hover:text-white border border-[#1a263d]'
          }`}
        >
          <FileUp className="w-4 h-4 text-emerald-400" />
          <span>Importar Script / Documento</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
            IA Gemini
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-[#0e1628] text-[#94a3b8] hover:text-white border border-[#1a263d]'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Horários de Pausa & Descanso</span>
        </button>
      </div>

      {activeSubTab === 'schedule' ? (
        <BotScheduleSettings />
      ) : activeSubTab === 'importScript' ? (
        <div className="space-y-6">
          <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-6 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Síntese Automática com Gemini 3.8 Flash</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Envie seu Script Comercial ou Manual de Vendas
              </h2>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl">
                Você não precisa digitar regra por regra! Envie seu PDF, DOCX, TXT ou cole o roteiro abaixo. A inteligência artificial extrairá a proposta de valor, regras de ouro, dúvidas frequentes e montará o prompt ideal para você.
              </p>
            </div>

            {/* Upload Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-[#1e293b] hover:border-blue-500/50 rounded-xl p-6 text-center space-y-3 bg-[#070b14]/50 transition flex flex-col items-center justify-center">
                <FileUp className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {uploadedFileName ? uploadedFileName : 'Clique para selecionar arquivo de script'}
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">
                    Suporta .txt, .docx, .pdf, .md
                  </div>
                </div>
                <label className="bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition">
                  <span>Procurar Documento</span>
                  <input
                    type="file"
                    accept=".txt,.md,.doc,.docx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste Text Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Ou cole o texto do roteiro / documento aqui:
                </label>
                <textarea
                  rows={6}
                  placeholder="Cole aqui seu script de vendas, perguntas frequentes, tabela de preços, regras de atendimento ou manual da empresa..."
                  value={scriptPastedText}
                  onChange={(e) => setScriptPastedText(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl p-3.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between border-t border-[#1a263d] pt-4">
              <div className="text-xs text-[#64748b]">
                {scriptPastedText.length > 0 && `${scriptPastedText.length} caracteres detectados`}
              </div>

              <button
                onClick={handleProcessScript}
                disabled={!scriptPastedText.trim() || isAnalyzingScript}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition"
              >
                {isAnalyzingScript ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>IA Analisando Script & Montando Prompt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analisar com IA & Configurar Bot</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Preview Card */}
            {importResult && (
              <div className="bg-[#070b14] border border-emerald-500/40 rounded-xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Check className="w-5 h-5 bg-emerald-500/20 rounded-full p-0.5" />
                  <span>Script Comercial Integrado com Sucesso!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#0e1628] p-3 rounded-lg border border-[#1a263d]">
                  <div>
                    <span className="text-[#64748b] block text-[10px] uppercase">Empresa:</span>
                    <span className="font-semibold text-white">{importResult.businessName}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px] uppercase">Nicho:</span>
                    <span className="font-semibold text-white">{importResult.niche}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px] uppercase">Atendente:</span>
                    <span className="font-semibold text-white">{importResult.personaName}</span>
                  </div>
                </div>

                {importResult.summary && (
                  <p className="text-xs text-[#94a3b8] italic bg-[#0e1628] p-3 rounded-lg border border-[#1a263d]">
                    "{importResult.summary}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#94a3b8]">
                    As regras e base de conhecimento já foram salvas no ArcoZapp.
                  </span>
                  <button
                    onClick={() => setActiveSubTab('content')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Base de Conhecimento Gerada</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {saveSuccess && (
            <div className="bg-[#0a1b24] border border-[#065f46]/50 text-[#34d399] px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-md animate-fadeIn">
              <Check className="w-4 h-4 text-[#10b981]" />
              <span>Treinamento salvo com sucesso! O bot no seu WhatsApp já está atualizado com as novas instruções.</span>
            </div>
          )}

          {/* Humanization Highlights Card */}
          <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Tecnologias de Humanização Multimodal Ativas no WhatsApp
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Transforme o atendimento em uma conversa viva, calorosa e contextual.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Audio Listening */}
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">1. Ouvir Áudios de Voz</span>
                <input
                  type="checkbox"
                  checked={training.enableAudioListening ?? true}
                  onChange={(e) =>
                    setTraining({ ...training, enableAudioListening: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                Quando o cliente mandar áudio no WhatsApp, a IA escuta, transcreve e compreende a intenção do cliente instantaneamente!
              </p>
            </div>
          </div>

          {/* Context Reactions */}
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">2. Reações com Emojis</span>
                <input
                  type="checkbox"
                  checked={training.enableContextReactions ?? true}
                  onChange={(e) =>
                    setTraining({ ...training, enableContextReactions: e.target.checked })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                Reage à mensagem do cliente: ❤️ para gentileza/Pix, 👍 para confirmação, 🔥 para pedidos fechados, 🙏 para agradecimentos.
              </p>
            </div>
          </div>

          {/* Natural Emojis */}
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-[#34d399] flex items-center justify-center shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">3. Emojis Expressivos</span>
                <input
                  type="checkbox"
                  checked={training.humanizedEmojis ?? true}
                  onChange={(e) =>
                    setTraining({ ...training, humanizedEmojis: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                Usa emojis calorosos e naturais do dia a dia brasileiro (😉, ✨, 👏, 😊) de forma espontânea, sem mensagens engessadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business & Behavior Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Identity card */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-[#1a263d]">
              <Building className="w-4 h-4 text-blue-400" />
              Identidade do Atendimento
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nome do Negócio / Empresa:
                </label>
                <input
                  type="text"
                  value={training.businessName}
                  onChange={(e) => setTraining({ ...training, businessName: e.target.value })}
                  placeholder="Ex: Minha Empresa"
                  className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Ramo / Nicho:
                </label>
                <input
                  type="text"
                  value={training.niche}
                  onChange={(e) => setTraining({ ...training, niche: e.target.value })}
                  placeholder="Ex: Consultoria, Loja Virtual, Salão, Restaurante"
                  className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Nome do Atendente:
                  </label>
                  <input
                    type="text"
                    value={training.personaName}
                    onChange={(e) => setTraining({ ...training, personaName: e.target.value })}
                    placeholder="Ex: Sofia, Lucas, Bia"
                    className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Tom de Voz:
                  </label>
                  <select
                    value={training.tone}
                    onChange={(e) => setTraining({ ...training, tone: e.target.value })}
                    className="w-full bg-[#0b1220] border border-[#1e293b] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="friendly">Amigável & Simpático</option>
                    <option value="formal">Formal & Corporativo</option>
                    <option value="sales">Focado em Vendas</option>
                    <option value="concise">Objetivo & Rápido</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Rules */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2 pb-3 border-b border-[#1a263d]">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Regras Humanizadas & Condutas
            </h3>
            <p className="text-xs text-[#94a3b8] mb-3">
              Instruções de como agir, responder e o que NUNCA fazer no WhatsApp:
            </p>

            <div className="space-y-2 mb-3">
              {(training.rules || []).map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 bg-[#0b1220] p-2.5 rounded-xl border border-[#1e293b] text-xs text-slate-200"
                >
                  <span>
                    <strong className="text-blue-400">•</strong> {rule}
                  </span>
                  <button
                    onClick={() => handleRemoveRule(idx)}
                    className="text-[#64748b] hover:text-rose-400 transition shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                placeholder="Ex: Seja muito acolhedor, use emojis e chame o cliente pelo nome..."
                className="flex-1 bg-[#0b1220] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Autonomous WhatsApp Settings */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#1a263d]">
              <Sliders className="w-4 h-4 text-purple-400" />
              Pausas Humanizadas & Transbordo
            </h3>

            {/* Delay slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                <span>Tempo de Digitação Humana no WhatsApp:</span>
                <span className="text-blue-400 font-mono font-bold">{training.simulatedTypingDelay || 3} segundos</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={training.simulatedTypingDelay || 3}
                onChange={(e) =>
                  setTraining({ ...training, simulatedTypingDelay: Number(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[11px] text-[#64748b] block mt-0.5">
                O cliente verá o status "digitando..." durante este tempo para parecer 100% natural.
              </span>
            </div>

            {/* Ignore groups toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Responder Apenas Mensagens Privadas
                </span>
                <span className="text-[11px] text-[#64748b] block">
                  Ignora grupos do WhatsApp para evitar spam.
                </span>
              </div>
              <input
                type="checkbox"
                checked={training.autoReplyOnlyPrivate}
                onChange={(e) =>
                  setTraining({ ...training, autoReplyOnlyPrivate: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Human handoff keywords */}
            <div className="pt-2 border-t border-[#1a263d]">
              <span className="text-xs font-semibold text-white block mb-1">
                Palavras que Pausam o Bot para Você Assumir:
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(training.humanHandoffKeywords || []).map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-[#1f1322] border border-[#831843]/50 text-[#f472b6] px-2.5 py-0.5 rounded-full"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-[#f472b6] hover:text-white transition cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="Ex: falar com você, gerente..."
                  className="flex-1 bg-[#0b1220] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-[#1f1322] hover:bg-[#2d1b32] text-[#f472b6] border border-[#831843]/60 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  + Incluir
                </button>
              </div>
            </div>

            {/* Business Hours & Pause schedule card */}
            <div className="pt-3 border-t border-[#1a263d]">
              <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Horário Comercial & Pausas
                    </span>
                    <span className="text-[10px] text-[#64748b] block">
                      Descanso da IA fora do expediente
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('schedule')}
                  className="text-xs bg-[#17233d] hover:bg-blue-600 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-[#223558] transition cursor-pointer font-semibold shrink-0"
                >
                  Configurar →
                </button>
              </div>
            </div>

            {/* System Logs Quick Access Card */}
            <div className="pt-2">
              <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Logs do Sistema (Ao Vivo)
                    </span>
                    <span className="text-[10px] text-[#64748b] block">
                      Últimas 50 ações executadas pelo bot
                    </span>
                  </div>
                </div>
                {onGoToSettings && (
                  <button
                    type="button"
                    onClick={onGoToSettings}
                    className="text-xs bg-[#0f241d] hover:bg-[#163629] text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition cursor-pointer font-semibold shrink-0"
                  >
                    Ver Logs →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Knowledge Base & Sandbox Testing */}
        <div className="lg:col-span-7 space-y-6">
          {/* Knowledge Base Editor */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a263d] mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Base de Conhecimento (Tudo o que seu bot sabe)
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Insira o cardápio, tabela de preços, serviços, horários, endereço, formas de pagamento e perguntas frequentes.
                </p>
              </div>
              <span className="text-[11px] bg-[#0b1220] border border-[#1e293b] text-[#94a3b8] px-2.5 py-1 rounded-full font-mono">
                {training.knowledgeBase?.length || 0} caracteres
              </span>
            </div>

            <textarea
              rows={14}
              value={training.knowledgeBase}
              onChange={(e) => setTraining({ ...training, knowledgeBase: e.target.value })}
              placeholder="Digite todas as informações do seu negócio aqui..."
              className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 text-xs font-mono leading-relaxed text-slate-100 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 resize-y placeholder-[#64748b]"
            />
          </div>

          {/* Training Test Sandbox with Reactions & Audio preview */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                Simulador de Teste: Veja as Reações com Emojis e a Resposta
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8] mb-3">
              Clique em um dos exemplos rápidos abaixo ou digite qualquer mensagem para ver como a IA reage e responde:
            </p>

            {/* Test prompt chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setTestQuestion('Acabei de fazer o Pix! Muito obrigado pelo atendimento ❤️');
                  handleTestQuestion('Acabei de fazer o Pix! Muito obrigado pelo atendimento ❤️');
                }}
                className="text-[11px] bg-[#0b1220] hover:bg-[#101b33] border border-[#1e293b] hover:border-blue-500/50 text-slate-200 px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                "Fiz o Pix! Muito obrigado ❤️"
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestQuestion('Confirmado, pode fechar o pedido para mim!');
                  handleTestQuestion('Confirmado, pode fechar o pedido para mim!');
                }}
                className="text-[11px] bg-[#0b1220] hover:bg-[#101b33] border border-[#1e293b] hover:border-blue-500/50 text-slate-200 px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                "Confirmado, pode fechar o pedido!"
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestQuestion('🎙️ [Mensagem de Áudio enviada pelo cliente]: "Oi boa tarde, vocês têm horário livre hoje às 16h?"');
                  handleTestQuestion('🎙️ [Mensagem de Áudio enviada pelo cliente]: "Oi boa tarde, vocês têm horário livre hoje às 16h?"');
                }}
                className="text-[11px] bg-[#0b1220] hover:bg-[#101b33] border border-[#1e293b] hover:border-blue-500/50 text-slate-200 px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#34d399]" />
                Simular Áudio de Voz 🎙️
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTestQuestion();
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  placeholder="Ex: Acabei de pagar o Pix, como funciona agora?"
                  className="flex-1 bg-[#0b1220] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500/80"
                />
                <button
                  type="submit"
                  disabled={testingAi}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  {testingAi ? 'Processando...' : 'Testar'}
                </button>
              </div>

              {testAnswer && (
                <div className="mt-3 bg-[#0b1220] text-slate-100 rounded-2xl p-4 shadow-inner border border-[#1e293b] animate-fadeIn text-xs leading-relaxed space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1a263d]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#34d399]">
                      <Bot className="w-3.5 h-3.5" />
                      <span>{training.personaName || 'IA'} respondeu:</span>
                    </div>

                    {testReaction && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#1f2c34] text-white border border-[#2a3942] px-2.5 py-0.5 rounded-full shadow-md animate-bounce">
                        Reagiu com: {testReaction}
                      </span>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap text-[#e9edef] text-[13px] leading-relaxed">
                    {testAnswer}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
