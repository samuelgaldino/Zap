import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  FileText,
  Workflow,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Activity,
  Sliders,
} from 'lucide-react';
import { BotConfig } from '../types';
import {
  getMetaCloudApiCode,
  getEvolutionApiCode,
  getPythonFastApiCode,
  getN8nWorkflowJson,
  getEnvExampleContent,
} from '../data/codeTemplates';
import { SystemLogsSection } from './SystemLogsSection';

interface CodeExporterProps {
  botConfig: BotConfig;
  onGoToTraining?: () => void;
  onGoToInbox?: () => void;
  defaultSubTab?: 'logs' | 'export';
}

type SettingsSubTab = 'logs' | 'export';
type CodeTab = 'meta-node' | 'evolution-node' | 'fastapi-python' | 'n8n' | 'env';

export const CodeExporter: React.FC<CodeExporterProps> = ({
  botConfig,
  onGoToTraining,
  onGoToInbox,
  defaultSubTab = 'logs',
}) => {
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>(defaultSubTab);
  const [activeTab, setActiveTab] = useState<CodeTab>('meta-node');
  const [copied, setCopied] = useState(false);

  const getActiveCode = (): { code: string; filename: string; language: string } => {
    switch (activeTab) {
      case 'meta-node':
        return {
          code: getMetaCloudApiCode(botConfig),
          filename: 'bot-meta.js',
          language: 'javascript',
        };
      case 'evolution-node':
        return {
          code: getEvolutionApiCode(botConfig),
          filename: 'bot-evolution.js',
          language: 'javascript',
        };
      case 'fastapi-python':
        return {
          code: getPythonFastApiCode(botConfig),
          filename: 'main.py',
          language: 'python',
        };
      case 'n8n':
        return {
          code: getN8nWorkflowJson(botConfig),
          filename: 'workflow-n8n.json',
          language: 'json',
        };
      case 'env':
        return {
          code: getEnvExampleContent(),
          filename: '.env',
          language: 'shell',
        };
      default:
        return {
          code: '',
          filename: 'code.txt',
          language: 'text',
        };
    }
  };

  const current = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Settings Sub-Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1a263d]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsSubTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settingsSubTab === 'logs'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#0b1220] text-[#94a3b8] hover:text-white hover:bg-[#131d33] border border-[#1a263d]'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Logs do Sistema</span>
            <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo
            </span>
          </button>

          <button
            onClick={() => setSettingsSubTab('export')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              settingsSubTab === 'export'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#0b1220] text-[#94a3b8] hover:text-white hover:bg-[#131d33] border border-[#1a263d]'
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-300" />
            <span>Exportação de Código & APIs</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748b]">
          <span>Central de Configurações do Bot</span>
          <span>•</span>
          <span className="text-[#94a3b8] font-mono">arco wpp</span>
        </div>
      </div>

      {/* View 1: Real-time System Logs */}
      {settingsSubTab === 'logs' && (
        <SystemLogsSection onGoToTraining={onGoToTraining} onGoToInbox={onGoToInbox} />
      )}

      {/* View 2: Code Exporter */}
      {settingsSubTab === 'export' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header in Arco CRM Dark Style */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                  Configurações & Exportação
                </span>
                <span className="text-[11px] font-bold text-[#c084fc] bg-[#1e153b] border border-[#7e22ce]/40 px-2 py-0.5 rounded-full uppercase">
                  100% Open Source
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Código Completo do seu Bot de WhatsApp
              </h1>
              <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
                Exporte o código completo com as regras, base de conhecimento e integrações para
                rodar no seu próprio servidor ou máquina.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Código
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-[#0e1628] hover:bg-[#131d33] text-white border border-[#1a263d] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar {current.filename}
              </button>
            </div>
          </div>

          {/* Code Tabs */}
          <div className="flex space-x-2 border-b border-[#1a263d] pb-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('meta-node')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'meta-node'
                  ? 'bg-[#101b33] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628]'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Node.js (Meta Cloud API Oficial)
            </button>

            <button
              onClick={() => setActiveTab('evolution-node')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'evolution-node'
                  ? 'bg-[#101b33] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628]'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Node.js (Evolution API / QR Code)
            </button>

            <button
              onClick={() => setActiveTab('fastapi-python')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'fastapi-python'
                  ? 'bg-[#101b33] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628]'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Python (FastAPI + Gemini)
            </button>

            <button
              onClick={() => setActiveTab('n8n')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'n8n'
                  ? 'bg-[#101b33] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628]'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Fluxo n8n (Sem Código / JSON)
            </button>

            <button
              onClick={() => setActiveTab('env')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'env'
                  ? 'bg-[#101b33] text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#0e1628]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Arquivo .env
            </button>
          </div>

          {/* Code Display Container */}
          <div className="bg-[#070b14] rounded-2xl overflow-hidden border border-[#1a263d] shadow-2xl">
            {/* Editor Top Bar */}
            <div className="bg-[#0b1220] px-4 py-3 border-b border-[#1a263d] flex items-center justify-between text-xs text-[#94a3b8]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-2 font-mono text-white font-semibold">
                  {current.filename}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#64748b] font-mono uppercase">
                  {current.language}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre className="p-5 text-xs font-mono leading-relaxed text-blue-200/90 overflow-x-auto max-h-[550px] scrollbar-thin">
              <code>{current.code}</code>
            </pre>
          </div>

          {/* Deployment & Execution Instructions */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-blue-400" />
              Como Executar este Código no seu Computador
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4">
              <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e293b]">
                <span className="font-bold text-blue-400 block mb-1">Passo 1: Instalação</span>
                <p className="text-[#94a3b8] mb-2">Instale as dependências via npm:</p>
                <code className="bg-[#070b14] text-[#34d399] p-2 rounded-lg block font-mono text-[11px] border border-[#1e293b]">
                  npm install express @google/genai dotenv
                </code>
              </div>

              <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e293b]">
                <span className="font-bold text-blue-400 block mb-1">Passo 2: Chaves no .env</span>
                <p className="text-[#94a3b8] mb-2">
                  Configure o arquivo <code>.env</code> com sua chave do Google AI Studio:
                </p>
                <code className="bg-[#070b14] text-[#34d399] p-2 rounded-lg block font-mono text-[11px] border border-[#1e293b]">
                  GEMINI_API_KEY="sua_chave_aqui"
                </code>
              </div>

              <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e293b]">
                <span className="font-bold text-blue-400 block mb-1">Passo 3: Iniciar o Bot</span>
                <p className="text-[#94a3b8] mb-2">
                  Inicie o servidor para começar a escutar as mensagens:
                </p>
                <code className="bg-[#070b14] text-[#34d399] p-2 rounded-lg block font-mono text-[11px] border border-[#1e293b]">
                  node bot-meta.js
                </code>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1a263d] flex items-center justify-between text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1.5 text-[#34d399]">
                <ShieldCheck className="w-4 h-4" />
                Código 100% de código aberto, sem bloqueios ou taxas de terceiros.
              </span>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 font-medium hover:underline flex items-center gap-1"
              >
                Documentação da Meta Cloud API <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
