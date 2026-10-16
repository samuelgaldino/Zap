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
  Copy,
  CheckCircle2,
  FileType,
  FileCheck,
  ArrowRight,
  X,
  FileCode,
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

const PRESET_TEMPLATES = [
  {
    id: 'consultoria',
    label: 'Consultoria & Software B2B',
    icon: '💼',
    text: `EMPRESA: Nexus Tech Solutions
NICHO: Consultoria Empresarial e Software em Nuvem
SOBRE: Ajudamos empresas a automatizar processos e dobrar suas vendas através de inteligência artificial e CRM.
PLANOS & PREÇOS:
- Plano Starter: R$ 890,00/mês (até 3 atendentes)
- Plano Pro: R$ 1.890,00/mês (até 10 atendentes + integrações completas)
- Plano Enterprise: Sob consulta personalizada.
FORMAS DE PAGAMENTO: Pix (5% de desconto à vista), Boleto Bancário ou Cartão de Crédito em até 12x.
FAQ:
- Vocês oferecem demonstração? Sim! Demonstração ao vivo de 15 minutos no Google Meet com nosso especialista.
- Quanto tempo leva a implantação? Em menos de 48 horas sua operação já estará funcionando no WhatsApp.
REGRAS:
- Explicar o retorno sobre o investimento (ROI) antes de citar o valor final.
- Sempre convidar para agendar uma demonstração rápida de 15 minutos sem compromisso.
- Usar parágrafos curtos e tom consultivo e atencioso.`,
  },
  {
    id: 'pizzaria',
    label: 'Pizzaria & Delivery Artesanal',
    icon: '🍕',
    text: `EMPRESA: Fornalha D'Oro Pizzaria
NICHO: Gastronomia Artesanal e Delivery Noturno
HORÁRIO: De terça a domingo, das 18h às 23h30.
CARDÁPIO (Tamanho Grande 8 fatias):
- Calabresa Especial com Cebola Roxa: R$ 54,00
- Quatro Queijos Nobres: R$ 62,00
- Frango Desfiado com Catupiry Original: R$ 58,00
- Margherita Clássica com Manjericão Fresco: R$ 56,00
- Borda Recheada de Catupiry ou Cheddar: R$ 10,00 adicionais
BEBIDAS: Coca-Cola 2L (R$ 14,00), Guaraná Antarctica 2L (R$ 12,00), Cerveja Heineken Long Neck (R$ 11,00).
ENTREGA: Taxa fixa de R$ 7,00 para Centro e Jardins. Demais bairros sob consulta. Tempo médio: 35 a 45 min.
PAGAMENTO: Pix na chave celular, Cartão de Crédito/Débito na entrega ou Dinheiro com troco.
REGRAS:
- Sempre perguntar se o cliente deseja borda recheada ou bebida gelada para acompanhar.
- Confirmar o sabor, endereço completo e forma de pagamento antes de fechar o pedido.`,
  },
  {
    id: 'clinica',
    label: 'Clínica Odontológica & Estética',
    icon: '🦷',
    text: `EMPRESA: Clínica Dental Excellence
NICHO: Odontologia Estética, Implantes e Ortodontia Digital
HORÁRIO: Segunda a Sexta das 08h às 19h, Sábados das 08h às 13h.
PROCEDIMENTOS:
- Avaliação Odontológica Inicial com Câmera Intraoral: Gratuita no primeiro atendimento.
- Clareamento Dental a Laser: A partir de R$ 650,00.
- Implante Dentário Unitário: A partir de R$ 1.400,00 ou parcelado em até 12x no cartão.
- Alinhadores Invisíveis e Ortodontia Digital: Planos mensais a partir de R$ 190,00.
PAGAMENTO: Parcelamento em até 12x sem juros, Pix com 7% de desconto ou Carnê facilitado.
REGRAS:
- Nunca dar diagnóstico fechado pelo WhatsApp, sempre convidar para a avaliação presencial gratuita.
- Tratar com máxima empatia, carinho e acolhimento para tranquilizar o paciente.`,
  },
];

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

  // Script & Document Upload State
  const [scriptPastedText, setScriptPastedText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [fileMimeType, setFileMimeType] = useState('text/plain');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [previewTab, setPreviewTab] = useState<'prompt' | 'kb' | 'rules' | 'quickReplies'>('prompt');

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

  const processSelectedFile = (file: File) => {
    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setFileMimeType('application/pdf');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        setUploadedBase64(base64);
        setScriptPastedText(
          `[Documento PDF Carregado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n` +
          `O Gemini 3.8 Flash analisará diretamente as páginas, tabelas e tópicos do PDF para compor o prompt estruturado.`
        );
      };
      reader.readAsDataURL(file);
    } else {
      setFileMimeType('text/plain');
      setUploadedBase64('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setScriptPastedText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClearUploadedFile = () => {
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedBase64('');
    setFileMimeType('text/plain');
    setScriptPastedText('');
  };

  const handleProcessScript = async () => {
    if ((!scriptPastedText.trim() && !uploadedBase64) || isAnalyzingScript) return;
    setIsAnalyzingScript(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/training/import-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptPastedText,
          fileName: uploadedFileName || 'Documento Comercial',
          fileBase64: uploadedBase64 || undefined,
          mimeType: fileMimeType,
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
        alert(errData.error || 'Erro ao processar documento.');
      }
    } catch (err) {
      console.error('Falha ao importar documento:', err);
      alert('Erro na conexão ao analisar documento com IA.');
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  const handleCopyPrompt = () => {
    const promptToCopy =
      importResult?.structuredSystemPrompt ||
      `[PROMPT DO SISTEMA / AGENTE ARCOZAPP]
EMPRESA: ${training.businessName}
NICHO: ${training.niche}
ATENDENTE VIRTUAL: ${training.personaName}

SAUDAÇÃO INICIAL:
${training.greeting}

BASE DE CONHECIMENTO:
${training.knowledgeBase}

REGRAS DE CONVERSÃO:
${(training.rules || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

PALAVRAS DE TRANSFERÊNCIA HUMANA:
${(training.humanHandoffKeywords || []).join(', ')}`;

    navigator.clipboard.writeText(promptToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
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
            <span className="text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              Upload PDF/TXT com IA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Treinamento & Prompt Estruturado do Sistema
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
            Ensine seu bot enviando manuais, tabelas ou scripts em PDF/TXT. A IA do Gemini converte automaticamente todo o conteúdo em um prompt profissional de atendimento e vendas.
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

      {/* Sub Tabs */}
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
          <span>Base de Conhecimento & Regras</span>
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
          <span>Upload de Documentos (PDF / TXT)</span>
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
          {/* Main Upload Box */}
          <div className="bg-[#0e1628] rounded-3xl border border-[#1a263d] p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1a263d]">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Síntese Multimodal com Gemini 3.8 Flash</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  Upload de Documentos & Conversão Automática de Prompt
                </h2>
                <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl">
                  Faça o upload do seu <strong>PDF</strong> comercial, catálogo de produtos, tabela de preços, manual de atendimento ou arquivo <strong>TXT</strong>. A IA analisará todo o documento e montará as instruções estruturadas para o prompt do seu bot.
                </p>
              </div>

              {/* Sample Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#64748b] font-medium hidden sm:inline">Exemplos:</span>
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setScriptPastedText(tmpl.text);
                      setUploadedFileName(`Exemplo: ${tmpl.label}`);
                      setUploadedFileSize('1.2 KB');
                      setFileMimeType('text/plain');
                      setUploadedBase64('');
                    }}
                    className="text-[11px] bg-[#070b14] hover:bg-[#131d33] text-slate-300 border border-[#1e293b] hover:border-blue-500/40 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    title={`Carregar exemplo de ${tmpl.label}`}
                  >
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Upload Zone + Text Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`lg:col-span-5 border-2 border-dashed rounded-2xl p-6 text-center space-y-4 transition flex flex-col items-center justify-center relative ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-950/20 shadow-xl shadow-blue-500/10'
                    : 'border-[#1e293b] hover:border-blue-500/50 bg-[#070b14]/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
                  <FileUp className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Arraste seu arquivo PDF ou TXT aqui
                  </h4>
                  <p className="text-xs text-[#94a3b8] max-w-xs mx-auto">
                    Suporta arquivos <strong>.pdf</strong>, <strong>.txt</strong>, <strong>.docx</strong> e <strong>.md</strong> de até 20MB.
                  </p>
                </div>

                <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-600/25 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Selecionar Documento do Computador</span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Selected File Card */}
                {uploadedFileName && (
                  <div className="w-full bg-[#101b33] border border-blue-500/40 rounded-xl p-3 flex items-center justify-between text-left animate-fadeIn">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          fileMimeType === 'application/pdf'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {fileMimeType === 'application/pdf' ? 'PDF' : 'TXT'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[200px]">
                          {uploadedFileName}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">
                          {uploadedFileSize} • Pronto para análise com IA
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearUploadedFile}
                      className="text-[#64748b] hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Text Preview Area */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Conteúdo Extraído / Texto do Roteiro:</span>
                  </label>
                  <span className="text-[11px] text-[#64748b] font-mono">
                    {scriptPastedText.length} caracteres
                  </span>
                </div>

                <textarea
                  rows={8}
                  placeholder="Você também pode colar diretamente o conteúdo do manual, script de vendas, perguntas frequentes ou tabela de preços aqui..."
                  value={scriptPastedText}
                  onChange={(e) => setScriptPastedText(e.target.value)}
                  className="flex-1 w-full bg-[#070b14] border border-[#1e293b] rounded-2xl p-4 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500/80 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1a263d] pt-4">
              <div className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  O Gemini 3.8 Flash converterá o arquivo em instruções estruturadas de prompt para o bot.
                </span>
              </div>

              <button
                onClick={handleProcessScript}
                disabled={(!scriptPastedText.trim() && !uploadedBase64) || isAnalyzingScript}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition shrink-0"
              >
                {isAnalyzingScript ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analisando Documento & Estruturando Prompt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analisar com IA & Estruturar Prompt</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Comprehensive Structured Prompt Results */}
            {importResult && (
              <div className="bg-[#070b14] border border-emerald-500/40 rounded-3xl p-6 space-y-5 animate-fadeIn">
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1a263d]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>Documento Estruturado com Sucesso!</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
                          Pronto para Atendimento
                        </span>
                      </h3>
                      <p className="text-xs text-[#94a3b8]">
                        Instruções estruturadas para o prompt do sistema geradas e salvas no bot.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPrompt}
                      className="bg-[#101b33] hover:bg-[#162547] text-blue-300 border border-blue-500/40 text-xs font-semibold px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt'}</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0e1628] border border-[#1a263d] p-3 rounded-xl">
                    <span className="text-[#64748b] block text-[10px] uppercase font-bold">Empresa</span>
                    <span className="font-bold text-white text-sm">{importResult.businessName || 'Empresa'}</span>
                  </div>
                  <div className="bg-[#0e1628] border border-[#1a263d] p-3 rounded-xl">
                    <span className="text-[#64748b] block text-[10px] uppercase font-bold">Nicho de Atuação</span>
                    <span className="font-bold text-blue-300 text-sm">{importResult.niche || 'Geral'}</span>
                  </div>
                  <div className="bg-[#0e1628] border border-[#1a263d] p-3 rounded-xl">
                    <span className="text-[#64748b] block text-[10px] uppercase font-bold">Atendente Virtual</span>
                    <span className="font-bold text-emerald-300 text-sm">{importResult.personaName || 'Assistente'}</span>
                  </div>
                  <div className="bg-[#0e1628] border border-[#1a263d] p-3 rounded-xl">
                    <span className="text-[#64748b] block text-[10px] uppercase font-bold">Regras Convertidas</span>
                    <span className="font-bold text-[#c084fc] text-sm">
                      {Array.isArray(importResult.rules) ? importResult.rules.length : 5} Regras
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                {importResult.summary && (
                  <div className="bg-[#0e1628] border border-[#1a263d] p-3.5 rounded-2xl text-xs text-slate-300 italic flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>"{importResult.summary}"</span>
                  </div>
                )}

                {/* Preview Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#1a263d] pb-2">
                    <button
                      onClick={() => setPreviewTab('prompt')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        previewTab === 'prompt'
                          ? 'bg-blue-600 text-white'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Prompt Estruturado do Sistema</span>
                    </button>
                    <button
                      onClick={() => setPreviewTab('kb')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        previewTab === 'kb'
                          ? 'bg-blue-600 text-white'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Base de Conhecimento</span>
                    </button>
                    <button
                      onClick={() => setPreviewTab('rules')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        previewTab === 'rules'
                          ? 'bg-blue-600 text-white'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Regras Comerciais ({importResult.rules?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setPreviewTab('quickReplies')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        previewTab === 'quickReplies'
                          ? 'bg-blue-600 text-white'
                          : 'text-[#94a3b8] hover:text-white hover:bg-[#131d33]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Respostas Rápidas</span>
                    </button>
                  </div>

                  {/* Tab 1: Prompt Estruturado */}
                  {previewTab === 'prompt' && (
                    <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 font-mono text-xs text-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#64748b] border-b border-[#1e293b] pb-2">
                        <span>INSTRUÇÃO COMPLETA DO SISTEMA (SYSTEM PROMPT)</span>
                        <span>Pronto para o modelo Gemini 3.8 Flash</span>
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed text-[#e2e8f0] max-h-[300px] overflow-y-auto">
                        {importResult.structuredSystemPrompt ||
                          `[INSTRUÇÕES DO SISTEMA - ARCOZAPP]
VOCÊ É: ${importResult.personaName || 'Assistente'}, atendente virtual inteligente da empresa "${importResult.businessName}".
NICHO: ${importResult.niche}.

MISSÃO COMERCIAL:
Prestar um atendimento ultra-humanizado, acolhedor e esclarecedor pelo WhatsApp, convertendo dúvidas em vendas, orçamentos fechados ou reuniões de pré-call.

SAUDAÇÃO INICIAL:
${importResult.greeting}

BASE DE CONHECIMENTO COMPILADA:
${importResult.knowledgeBase}

DIRETRIZES E REGRAS DE CONVERSÃO:
${(importResult.rules || []).map((r: string, i: number) => `[${i + 1}] ${r}`).join('\n')}

TRANSFERÊNCIA HUMANA:
Palavras de gatilho para transição humana: ${(importResult.humanHandoffKeywords || []).join(', ')}.`}
                      </pre>
                    </div>
                  )}

                  {/* Tab 2: Base de Conhecimento */}
                  {previewTab === 'kb' && (
                    <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 text-xs space-y-2">
                      <div className="text-[11px] font-bold text-blue-400 uppercase">
                        Base de Conhecimento Estruturada
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
                        {importResult.knowledgeBase}
                      </pre>
                    </div>
                  )}

                  {/* Tab 3: Regras Comerciais */}
                  {previewTab === 'rules' && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {(importResult.rules || []).map((rule: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 text-xs text-slate-200 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-500/30">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{rule}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 4: Respostas Rápidas */}
                  {previewTab === 'quickReplies' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(importResult.quickReplies || [
                        '📦 Conhecer Produtos e Preços',
                        '💳 Formas de Pagamento e Pix',
                        '⏰ Horários de Atendimento',
                        '👨‍💼 Falar com Atendente Humano',
                      ]).map((reply: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#0b1220] border border-blue-500/30 rounded-xl p-3 text-xs text-white font-medium flex items-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{reply}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1a263d]">
                  <span className="text-xs text-[#94a3b8]">
                    Deseja testar as respostas deste prompt estruturado em tempo real?
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubTab('content')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Editar Parâmetros Manuais</span>
                      <span>→</span>
                    </button>
                  </div>
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
                    Reage automaticamente com 👍, ❤️, 🔥 ou 🙏 quando o cliente confirma o pedido, envia o comprovante Pix ou agradece.
                  </p>
                </div>
              </div>

              {/* Real Humanized Tone */}
              <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smile className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">3. Empatia & Zero Robô</span>
                    <input
                      type="checkbox"
                      checked={training.humanizedEmojis ?? true}
                      onChange={(e) =>
                        setTraining({ ...training, humanizedEmojis: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                    Respostas em parágrafos curtos e calorosos, com pausas simuladas para dar a impressão de digitação real.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Business Info & Persona */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Card */}
            <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1a263d]">
                <Building className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  Identidade do Negócio & Persona
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={training.businessName}
                    onChange={(e) => setTraining({ ...training, businessName: e.target.value })}
                    placeholder="Ex: Bella Forneria Pizzaria"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nicho / Ramo de Atuação
                  </label>
                  <input
                    type="text"
                    value={training.niche}
                    onChange={(e) => setTraining({ ...training, niche: e.target.value })}
                    placeholder="Ex: Pizzaria Artesanal & Delivery"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Atendente Virtual
                  </label>
                  <input
                    type="text"
                    value={training.personaName}
                    onChange={(e) => setTraining({ ...training, personaName: e.target.value })}
                    placeholder="Ex: Bella (Atendente Virtual)"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saudação Inicial no WhatsApp
                  </label>
                  <textarea
                    rows={3}
                    value={training.greeting}
                    onChange={(e) => setTraining({ ...training, greeting: e.target.value })}
                    placeholder="Olá! Seja bem-vindo(a). Como posso te ajudar hoje? 😊"
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Knowledge Base Card */}
            <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl space-y-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Base de Conhecimento Comercial
                  </h3>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {training.knowledgeBase.length} caracteres
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Preços, cardápio, produtos, prazos e perguntas frequentes:
                </label>
                <textarea
                  rows={10}
                  value={training.knowledgeBase}
                  onChange={(e) => setTraining({ ...training, knowledgeBase: e.target.value })}
                  placeholder="Descreva detalhadamente seus produtos, tabela de preços, forma de pagamento Pix, horário de funcionamento, prazos de entrega e dúvidas frequentes..."
                  className="w-full h-[calc(100%-25px)] bg-[#070b14] border border-[#1e293b] rounded-xl p-3.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Rules and Human Handoff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rules */}
            <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Regras de Ouro do Atendimento
                  </h3>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {training.rules?.length || 0} regras ativas
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {training.rules?.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <span className="flex-1 leading-relaxed">
                      <strong className="text-blue-400 mr-1.5">{idx + 1}.</strong>
                      {rule}
                    </span>
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="text-[#64748b] hover:text-rose-400 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                  placeholder="Adicionar nova regra de atendimento..."
                  className="flex-1 bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddRule}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Human Handoff */}
            <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-xs sm:text-sm text-white">
                    Palavras de Transição Humana
                  </h3>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {training.humanHandoffKeywords?.length || 0} gatilhos
                </span>
              </div>

              <p className="text-xs text-[#94a3b8]">
                Se o cliente enviar qualquer uma dessas palavras no WhatsApp, o bot pausa automaticamente e transfere para você:
              </p>

              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {training.humanHandoffKeywords?.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-[#101b33] border border-blue-500/40 text-blue-200 text-xs px-2.5 py-1 rounded-full font-mono"
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-blue-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Ex: falar com dono, cancelar pedido..."
                  className="flex-1 bg-[#070b14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddKeyword}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Simulator in Live Mode */}
          <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  Simulador de Conversa com IA em Tempo Real
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                Gemini 3.8 Flash Ativo
              </span>
            </div>

            <p className="text-xs text-[#94a3b8]">
              Faça perguntas de teste como se fosse um cliente para verificar como a IA reage, responde com empatia e utiliza a base de conhecimento:
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTestQuestion('Qual a chave Pix de vocês para pagamento?');
                  handleTestQuestion('Qual a chave Pix de vocês para pagamento?');
                }}
                className="text-[11px] bg-[#0b1220] hover:bg-[#101b33] border border-[#1e293b] hover:border-blue-500/50 text-slate-200 px-3 py-1.5 rounded-full transition cursor-pointer"
              >
                "Qual a chave Pix para pagamento?"
              </button>

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
        </>
      )}
    </div>
  );
};
