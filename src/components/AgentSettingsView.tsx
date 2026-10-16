import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Activity,
  Clock,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Check,
  RefreshCw,
  Zap,
  Volume2,
  Users,
  Smile,
  Split,
  Bot,
} from 'lucide-react';
import { AgentBehaviorSettings } from '../types';
import { SystemLogsSection } from './SystemLogsSection';

export const AgentSettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'behavior' | 'logs'>('behavior');
  const [settings, setSettings] = useState<AgentBehaviorSettings>({
    simulatedTypingDelay: 4,
    humanizationLevel: 'ultra',
    maxCharactersPerMessage: 280,
    splitLongMessages: true,
    enableAudioListening: true,
    enableContextReactions: true,
    humanizedEmojis: true,
    autoReplyOnlyPrivate: true,
    ignoreGroupMessages: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/whatsapp/agent-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error('Erro ao buscar configurações:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/whatsapp/agent-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar configurações do agente:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
            <Sliders className="w-4 h-4" />
            <span>Configurações Operacionais ArcoZapp</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Configurações do Agente & Logs
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Ajuste fino da velocidade de digitação, nível de naturalidade humana, tamanho das mensagens e auditoria em tempo real das ações do robô.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0f172a] p-1 rounded-lg border border-[#1e293b] flex items-center">
            <button
              onClick={() => setActiveSubTab('behavior')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'behavior'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Comportamento do Agente</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Logs do Sistema</span>
              <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
                50 Ações
              </span>
            </button>
          </div>

          {activeSubTab === 'behavior' && (
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Salvar Parâmetros</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-md animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Configurações do agente salvas com sucesso no ArcoZapp!</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-[#94a3b8] text-sm animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Carregando parâmetros do agente...</span>
        </div>
      ) : activeSubTab === 'behavior' ? (
        /* ================= BEHAVIOR SETTINGS ================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Tempo de Resposta & Digitação */}
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                Tempo de Resposta & Simulação de Digitação
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-semibold text-slate-200">
                    Delay antes do envio (Segundos):
                  </label>
                  <span className="font-mono text-blue-400 font-bold bg-[#070b14] px-2 py-0.5 rounded border border-[#1e293b]">
                    {settings.simulatedTypingDelay} segundos
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={settings.simulatedTypingDelay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      simulatedTypingDelay: Number(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-[#64748b] mt-1">
                  O bot exibe o status de <strong>"digitando..."</strong> no WhatsApp durante esse período, simulando que uma pessoa está redigindo a resposta.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-semibold text-slate-200">
                    Limite Máximo de Caracteres por Balão:
                  </label>
                  <span className="font-mono text-emerald-400 font-bold bg-[#070b14] px-2 py-0.5 rounded border border-[#1e293b]">
                    {settings.maxCharactersPerMessage} chars
                  </span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="600"
                  step="20"
                  value={settings.maxCharactersPerMessage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxCharactersPerMessage: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-[#64748b] mt-1">
                  Respostas curtas têm até <strong>3.4x mais leitura</strong> do que textões no WhatsApp.
                </p>
              </div>

              {/* Split Long Messages Switch */}
              <div className="flex items-center justify-between bg-[#070b14] p-3.5 rounded-xl border border-[#1e293b]">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Split className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dividir Mensagens Longas em Múltiplos Balões</span>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Se o texto for extenso, quebra em 2 balões curtos com pausa de 1.5s entre eles, igual a uma conversa real.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.splitLongMessages}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      splitLongMessages: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Nível de Humanização & Estilo */}
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">
                Nível de Humanização & Naturalidade da IA
              </h2>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                Postura Conversacional:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'ultra',
                    title: 'Ultra-Humanizado',
                    desc: 'Caloroso, empático, com emojis naturais e ritmo de WhatsApp.',
                    badge: 'Recomendado',
                  },
                  {
                    id: 'moderate',
                    title: 'Equilibrado',
                    desc: 'Atencioso e simpático com pontuação e linguagem formal padrão.',
                    badge: 'Corporativo',
                  },
                  {
                    id: 'formal',
                    title: 'Formal Direto',
                    desc: 'Respostas concisas e institucionais sem gírias ou emojis informais.',
                    badge: 'Direto',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        humanizationLevel: item.id as any,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      settings.humanizationLevel === item.id
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-[#070b14] border-[#1e293b] text-[#94a3b8] hover:border-[#334155]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#64748b] line-clamp-3">
                        {item.desc}
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-blue-400 mt-2">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Emojis Reativos */}
              <div className="flex items-center justify-between bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reações com Emojis Nativos (❤️, 👍, 🔥, 🙏)</span>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    A IA reage às mensagens do WhatsApp no momento oportuno para validar elogios e confirmações.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableContextReactions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableContextReactions: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Escuta de Áudio Multimodal */}
              <div className="flex items-center justify-between bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Compreensão de Áudios de Voz do Cliente</span>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Baixa e decodifica áudios de voz enviados por clientes via Gemini 3.8 Flash para responder com precisão.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAudioListening}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableAudioListening: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Apenas Conversas Privadas */}
              <div className="flex items-center justify-between bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ignorar Respostas em Grupos (Apenas Privado)</span>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Evita que o bot responda de forma intrusiva em grupos em que você está inserido.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoReplyOnlyPrivate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoReplyOnlyPrivate: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SYSTEM LOGS VIEW ================= */
        <SystemLogsSection />
      )}
    </div>
  );
};
