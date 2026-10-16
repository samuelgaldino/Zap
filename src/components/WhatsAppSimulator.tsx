import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  CheckCheck,
  Bot,
  User,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  Paperclip,
  Smile,
  Mic,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { BotConfig, ChatMessage } from '../types';

interface WhatsAppSimulatorProps {
  botConfig: BotConfig;
  onOpenConfig: () => void;
  onOpenCode: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  botConfig,
  onOpenConfig,
  onOpenCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [handoffActive, setHandoffActive] = useState(false);
  const [handoffReason, setHandoffReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with bot greeting when botConfig changes or on mount
  useEffect(() => {
    resetChat();
  }, [botConfig.businessName, botConfig.greeting]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const resetChat = () => {
    const initialMessage: ChatMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content: botConfig.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };
    setMessages([initialMessage]);
    setHandoffActive(false);
    setHandoffReason('');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          botConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta da IA');
      }

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        handoffTriggered: data.handoffTriggered,
        handoffReason: data.handoffReason,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.handoffTriggered) {
        setHandoffActive(true);
        setHandoffReason(data.handoffReason || 'Solicitação de atendente humano');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu uma instabilidade momentânea no processamento da IA. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format WhatsApp style bold text: *word* -> <strong>word</strong>
  const renderWhatsAppFormatted = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Split by *bold* tags
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <span key={lineIdx} className="block min-h-[1.2rem]">
          {parts.map((part, partIdx) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return (
                <strong key={partIdx} className="font-semibold text-gray-900">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Intro banner */}
      <div className="mb-6 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border border-emerald-700/60 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-emerald-950 font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              Simulador em Tempo Real
            </span>
            <span className="text-xs text-emerald-300">Modelo Gemini 3.8 Flash Ativo</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">
            Teste como seu Bot do WhatsApp responderá aos seus clientes
          </h2>
          <p className="text-sm text-emerald-100/80 max-w-2xl mt-0.5">
            Interaja com o chat abaixo. A IA utiliza a Base de Conhecimento e a Persona configuradas para responder exatamente como no WhatsApp oficial.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenConfig}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl border border-emerald-600/50 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-emerald-300" />
            Editar Dados da Empresa
          </button>
          <button
            onClick={onOpenCode}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Exportar Código Grátis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context Card & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Bot Info */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-inner">
                {botConfig.businessName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900 text-base">{botConfig.businessName}</h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                </div>
                <p className="text-xs text-gray-500">{botConfig.niche}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Bot className="w-3 h-3" /> {botConfig.personaName}
                  </span>
                  <span className="text-[11px] text-gray-500 uppercase font-mono">
                    Tom: {botConfig.tone}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Prompts / Customer Scenarios */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
                Simulações Rápidas de Clientes:
              </span>
              <div className="space-y-1.5">
                {[
                  'Olá! Gostaria de saber os horários e como funciona.',
                  'Qual é a tabela de preços e quais opções vocês têm?',
                  'Quero fazer um pedido / agendar um horário para amanhã.',
                  'Preciso falar urgente com um atendente humano!',
                ].map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(scenario)}
                    disabled={isLoading}
                    className="w-full text-left text-xs bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-lg p-2.5 transition flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <span className="truncate pr-2">"{scenario}"</span>
                    <Send className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Voice Note Simulation */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
                Simular Áudio de Cliente 🎙️
              </span>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <p className="mb-2 text-emerald-800">
                  No WhatsApp real, clientes mandam áudio. Com a API Gemini você pode transcrever o áudio gratuitamente com <code>gemini-3.5-transcribe</code>!
                </p>
                <button
                  onClick={() => {
                    handleSendMessage('🎙️ [Mensagem de Áudio Transcrita]: "Oi boa tarde! Queria saber onde vocês ficam e se tem como pagar no Pix?"');
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-3.5 h-3.5" />
                  Simular Envio de Áudio pelo Cliente
                </button>
              </div>
            </div>

            {/* Reset chat button */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Histórico de teste: {messages.length} mensagens</span>
              <button
                onClick={resetChat}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Conversa
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Authentic WhatsApp Web Interface */}
        <div className="lg:col-span-8">
          <div className="bg-[#efeae2] rounded-2xl shadow-xl overflow-hidden border border-gray-300 flex flex-col h-[650px] relative">
            {/* WhatsApp Header */}
            <div className="bg-[#005c4b] text-white px-4 py-3 flex items-center justify-between shadow z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 border border-emerald-400 flex items-center justify-center text-white font-bold text-base shadow">
                    {botConfig.businessName.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#005c4b] rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight text-white flex items-center gap-1">
                      {botConfig.businessName}
                      <span className="text-[10px] bg-emerald-600/80 text-emerald-100 px-1.5 py-0.2 rounded font-normal">
                        Oficial
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    {isLoading ? (
                      <span className="italic font-medium animate-pulse text-emerald-100">
                        {botConfig.personaName} está digitando...
                      </span>
                    ) : (
                      'online • conta comercial com IA'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-emerald-200">
                <button
                  onClick={resetChat}
                  title="Reiniciar chat"
                  className="hover:text-white transition p-1.5 rounded-full hover:bg-emerald-800/60 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Human Handoff Notification Banner */}
            {handoffActive && (
              <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-sm border-b border-amber-600 animate-fadeIn z-10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0" />
                  <span>
                    <strong>Transbordo Humano Acionado:</strong> O cliente solicitou um atendente ou suporte avançado ({handoffReason}).
                  </span>
                </div>
                <button
                  onClick={() => setHandoffActive(false)}
                  className="bg-amber-900 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-amber-950 transition cursor-pointer"
                >
                  Dispensar
                </button>
              </div>
            )}

            {/* Chat Messages Screen */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]"
              style={{
                backgroundImage: `radial-gradient(#d3c8b7 0.75px, transparent 0.75px)`,
                backgroundSize: '16px 16px',
              }}
            >
              {/* Security info box */}
              <div className="flex justify-center my-2">
                <div className="bg-[#ffeecd] text-[#54656f] text-[11px] px-3 py-1.5 rounded-lg shadow-sm text-center max-w-md border border-[#fed99b]/60 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    As mensagens são processadas em tempo real pela IA Gemini (API oficial).
                  </span>
                </div>
              </div>

              {/* Message bubbles */}
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm relative leading-relaxed ${
                        isUser
                          ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                          : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {/* Assistant name tag if bot */}
                      {!isUser && (
                        <div className="text-[11px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                          <Bot className="w-3 h-3 text-emerald-600" />
                          <span>{botConfig.personaName}</span>
                          <span className="text-[10px] font-normal text-gray-500">
                            ({botConfig.businessName})
                          </span>
                        </div>
                      )}

                      {/* Content with WhatsApp markdown parser */}
                      <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-gray-800">
                        {renderWhatsAppFormatted(message.content)}
                      </div>

                      {/* Handoff chip in bubble */}
                      {message.handoffTriggered && (
                        <div className="mt-2 pt-2 border-t border-amber-200/80 text-[11px] font-semibold text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chamado transferido para equipe humana</span>
                        </div>
                      )}

                      {/* Timestamp & read receipts */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500">
                        <span>{message.timestamp}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></div>
                    <span className="text-xs text-gray-500 ml-1 italic">
                      {botConfig.personaName} está digitando...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies chips */}
            {botConfig.quickReplies && botConfig.quickReplies.length > 0 && (
              <div className="bg-[#f0f2f5] px-3 py-2 border-t border-gray-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-semibold text-gray-500 shrink-0 uppercase tracking-wider">
                  Sugestões:
                </span>
                {botConfig.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply)}
                    disabled={isLoading}
                    className="shrink-0 text-xs bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300/80 hover:border-emerald-500 rounded-full px-3 py-1 font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Bar */}
            <div className="bg-[#f0f2f5] p-3 border-t border-gray-200 flex items-center gap-2">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-1.5 transition"
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-1.5 transition hidden sm:block"
                title="Anexar arquivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex-1 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Digite uma mensagem como cliente..."
                  disabled={isLoading}
                  className="flex-1 bg-white text-gray-900 text-sm rounded-lg px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />

                {inputText.trim() ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition shadow cursor-pointer disabled:opacity-50 shrink-0"
                    title="Enviar"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleSendMessage('Olá! Gostaria de tirar uma dúvida sobre seus serviços.');
                    }}
                    disabled={isLoading}
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow cursor-pointer disabled:opacity-50 shrink-0"
                    title="Simular mensagem"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
