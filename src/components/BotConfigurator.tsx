import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Sliders,
  Check,
  Building,
  UserCheck,
  MessageSquare,
  HelpCircle,
  Tag,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { BotConfig, BotTone } from '../types';
import { BUSINESS_PRESETS } from '../data/presets';

interface BotConfiguratorProps {
  botConfig: BotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  onSaveAndSimulate: () => void;
  onGoToCode: () => void;
}

export const BotConfigurator: React.FC<BotConfiguratorProps> = ({
  botConfig,
  setBotConfig,
  onSaveAndSimulate,
  onGoToCode,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pizzaria');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPromptName, setAiPromptName] = useState('');
  const [aiPromptNiche, setAiPromptNiche] = useState('');
  const [newQuickReply, setNewQuickReply] = useState('');
  const [newHandoffKeyword, setNewHandoffKeyword] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const applyPreset = (presetId: string) => {
    const found = BUSINESS_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(presetId);
      setBotConfig(found.config);
      showNotice();
    }
  };

  const showNotice = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleGenerateWithGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptName.trim() || !aiPromptNiche.trim()) return;

    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/generate-business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: aiPromptName,
          niche: aiPromptNiche,
        }),
      });

      if (!res.ok) throw new Error('Falha ao gerar perfil');

      const data = await res.json();
      setBotConfig((prev) => ({
        ...prev,
        businessName: aiPromptName,
        niche: aiPromptNiche,
        personaName: data.personaName || 'Assistente Virtual',
        greeting: data.greeting || prev.greeting,
        quickReplies: data.quickReplies || prev.quickReplies,
        knowledgeBase: data.knowledgeBase || prev.knowledgeBase,
        humanTransferKeywords: data.humanTransferKeywords || prev.humanTransferKeywords,
        customInstructions: data.customInstructions || prev.customInstructions,
      }));

      setShowAiModal(false);
      showNotice();
    } catch (error) {
      console.error('Erro ao gerar com IA:', error);
      alert('Não foi possível gerar com a IA no momento. Tente novamente.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddQuickReply = () => {
    if (!newQuickReply.trim()) return;
    setBotConfig((prev) => ({
      ...prev,
      quickReplies: [...prev.quickReplies, newQuickReply.trim()],
    }));
    setNewQuickReply('');
  };

  const handleRemoveQuickReply = (idx: number) => {
    setBotConfig((prev) => ({
      ...prev,
      quickReplies: prev.quickReplies.filter((_, i) => i !== idx),
    }));
  };

  const handleAddHandoffKeyword = () => {
    if (!newHandoffKeyword.trim()) return;
    setBotConfig((prev) => ({
      ...prev,
      humanTransferKeywords: [...prev.humanTransferKeywords, newHandoffKeyword.trim().toLowerCase()],
    }));
    setNewHandoffKeyword('');
  };

  const handleRemoveHandoffKeyword = (keyword: string) => {
    setBotConfig((prev) => ({
      ...prev,
      humanTransferKeywords: prev.humanTransferKeywords.filter((k) => k !== keyword),
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
            Personalização do Bot
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Configure a Inteligência do seu WhatsApp
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Defina o nome da sua empresa, a personalidade do assistente e ensine tudo sobre seus produtos e serviços na Base de Conhecimento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            Gerar Meu Negócio com IA
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Configurações salvas com sucesso! O simulador já foi atualizado com as novas instruções.</span>
        </div>
      )}

      {/* Preset Selector Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-3">
          Carregar Exemplo Pré-Configurado de Negócio:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BUSINESS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                botConfig.businessName === preset.config.businessName
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{preset.icon}</span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-gray-500 truncate max-w-[140px]">{preset.niche}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Identity & Persona */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Building className="w-4 h-4 text-emerald-600" />
              Identidade da Empresa
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome da sua Empresa / Negócio:
                </label>
                <input
                  type="text"
                  value={botConfig.businessName}
                  onChange={(e) => setBotConfig({ ...botConfig, businessName: e.target.value })}
                  placeholder="Ex: Pizzaria Bella, Clínica Sorriso"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ramo / Nicho de Atuação:
                </label>
                <input
                  type="text"
                  value={botConfig.niche}
                  onChange={(e) => setBotConfig({ ...botConfig, niche: e.target.value })}
                  placeholder="Ex: Delivery de Alimentos, Consultório Dentário"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome da Atendente Virtual:
                  </label>
                  <input
                    type="text"
                    value={botConfig.personaName}
                    onChange={(e) => setBotConfig({ ...botConfig, personaName: e.target.value })}
                    placeholder="Ex: Sofia, Bia, Léo"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tom de Voz:
                  </label>
                  <select
                    value={botConfig.tone}
                    onChange={(e) => setBotConfig({ ...botConfig, tone: e.target.value as BotTone })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="friendly">Amigável & Acolhedor</option>
                    <option value="formal">Profissional & Formal</option>
                    <option value="sales">Vendedor & Persuasivo</option>
                    <option value="concise">Objetivo & Rápido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mensagem Inicial de Boas-Vindas (WhatsApp):
                </label>
                <textarea
                  rows={3}
                  value={botConfig.greeting}
                  onChange={(e) => setBotConfig({ ...botConfig, greeting: e.target.value })}
                  placeholder="Mensagem enviada logo que o cliente manda o primeiro 'Oi'"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Dica: use <code>*palavra*</code> para colocar em negrito como no WhatsApp real.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Replies chips editor */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Botões de Respostas Rápidas Sugeridas
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {botConfig.quickReplies.map((reply, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-full"
                >
                  <span>{reply}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuickReply(idx)}
                    className="text-emerald-700 hover:text-red-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newQuickReply}
                onChange={(e) => setNewQuickReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuickReply())}
                placeholder="Ex: Ver Preços, Horários..."
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddQuickReply}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Human handoff keywords */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2 pb-3 border-b border-gray-100">
              <UserCheck className="w-4 h-4 text-amber-600" />
              Palavras de Transbordo Humano
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Quando o cliente digitar estas palavras ou pedir atendimento de uma pessoa, a IA aciona a transferência para sua equipe humana:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {botConfig.humanTransferKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-0.5 rounded-full"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHandoffKeyword(kw)}
                    className="text-amber-800 hover:text-red-600 transition cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHandoffKeyword}
                onChange={(e) => setNewHandoffKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHandoffKeyword())}
                placeholder="Ex: financeiro, falar com dono..."
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddHandoffKeyword}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                + Incluir
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Knowledge Base & Instructions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  Base de Conhecimento da Empresa
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tudo o que a IA Gemini sabe sobre seus produtos, cardápio, preços, endereço e regras.
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                {botConfig.knowledgeBase.length} caracteres
              </span>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Conteúdo da Base de Conhecimento (Textos, Listas, Tabela de Preços):
              </label>
              <textarea
                rows={14}
                value={botConfig.knowledgeBase}
                onChange={(e) => setBotConfig({ ...botConfig, knowledgeBase: e.target.value })}
                placeholder="Insira aqui o cardápio, horários, endereço, tabela de preços, perguntas frequentes, políticas de cancelamento, etc."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-xs font-mono leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y shadow-inner"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Instruções Comportamentais Específicas (Regras do Negócio):
              </label>
              <textarea
                rows={3}
                value={botConfig.customInstructions}
                onChange={(e) => setBotConfig({ ...botConfig, customInstructions: e.target.value })}
                placeholder="Ex: Peça sempre o CEP antes de passar o frete. Ofereça 10% de desconto no Pix. Nunca prometa entrega em menos de 30 minutos."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Bottom action bar */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                Sincronizado automaticamente com o Simulador
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onSaveAndSimulate}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Testar no Simulador
                </button>
                <button
                  type="button"
                  onClick={onGoToCode}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Exportar Código <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Gerar Meu Bot com IA Gemini
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Basta nos informar o nome e o ramo da sua empresa. A inteligência do <strong>Gemini</strong> escreverá automaticamente toda a Base de Conhecimento, persona e boas-vindas para você!
            </p>

            <form onSubmit={handleGenerateWithGemini} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome da Empresa:
                </label>
                <input
                  type="text"
                  required
                  value={aiPromptName}
                  onChange={(e) => setAiPromptName(e.target.value)}
                  placeholder="Ex: Auto Mecânica Veloz, Studio Hair Bela"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ramo / O que você vende ou atende:
                </label>
                <input
                  type="text"
                  required
                  value={aiPromptNiche}
                  onChange={(e) => setAiPromptNiche(e.target.value)}
                  placeholder="Ex: Troca de óleo e mecânica geral de carros"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 px-3 py-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAiGenerating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gerando com Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Criar Agora
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
