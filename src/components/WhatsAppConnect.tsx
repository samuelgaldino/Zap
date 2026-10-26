import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Power,
  Zap,
  ShieldCheck,
  Clock,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Moon,
  FileSpreadsheet,
} from 'lucide-react';

interface WAStatusResponse {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrDataUrl?: string;
  userPhone?: string;
  userName?: string;
  autoReplyEnabled: boolean;
  businessName?: string;
  personaName?: string;
  stats?: {
    totalReceived: number;
    totalReplied: number;
    activeChats: number;
  };
}

interface WhatsAppConnectProps {
  onGoToTraining: () => void;
  onGoToInbox: () => void;
  onGoToFormTriage?: () => void;
}

export const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({
  onGoToTraining,
  onGoToInbox,
  onGoToFormTriage,
}) => {
  const [waStatus, setWaStatus] = useState<WAStatusResponse>({
    status: 'disconnected',
    autoReplyEnabled: true,
  });
  const [scheduleStatus, setScheduleStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const autoConnectAttempted = useRef(false);

  const handleConnect = async () => {
    setLoading(true);
    setConnectError(null);
    setWaStatus((prev) => ({ ...prev, status: 'connecting', qrDataUrl: undefined }));
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Não foi possível iniciar a conexão com o WhatsApp.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao gerar o QR Code.';
      setConnectError(message);
      setWaStatus((prev) => ({ ...prev, status: 'disconnected', qrDataUrl: undefined }));
      console.error('Erro ao gerar QR Code do WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate the first QR automatically when this screen is opened.
  useEffect(() => {
    if (waStatus.status !== 'disconnected' || autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;
    void handleConnect();
  }, [waStatus.status]);

  // Poll status every 2 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok && isMounted) {
          const data: WAStatusResponse = await res.json();
          setWaStatus(data);
        }

        const schedRes = await fetch('/api/whatsapp/schedule/status');
        if (schedRes.ok && isMounted) {
          const sData = await schedRes.json();
          setScheduleStatus(sData.status);
        }
      } catch (err) {
        console.error('Erro ao consultar status do WhatsApp:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o seu número de WhatsApp do bot?')) return;
    setLoading(true);
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        setWaStatus(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoReply = async () => {
    try {
      const res = await fetch('/api/whatsapp/toggle-autoreply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !waStatus.autoReplyEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus((prev) => ({ ...prev, autoReplyEnabled: data.autoReplyEnabled }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Diagnóstico em 4 Cards Dark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Item 1 */}
        <div className="bg-[#0e1628] p-4 rounded-2xl border border-[#1a263d] shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white block text-xs">1. Inteligência Artificial</span>
            <span className="text-[#34d399] font-bold block text-[11px] mt-0.5">✅ 100% CONECTADA</span>
            <p className="text-[#64748b] text-[11px] mt-0.5">
              API Google Gemini 3.8 Flash pronta para atender.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 transition-all ${
          waStatus.status === 'connected'
            ? 'bg-[#0e1628] border-emerald-500/50'
            : 'bg-[#160d1b] border-rose-500/50'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            waStatus.status === 'connected'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
          }`}>
            {waStatus.status === 'connected' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-bold text-white block text-xs">2. Seu WhatsApp</span>
            <span className={`font-bold block text-[11px] mt-0.5 ${
              waStatus.status === 'connected' ? 'text-[#34d399]' : 'text-[#fb7185]'
            }`}>
              {waStatus.status === 'connected'
                ? `✅ CONECTADO (+${waStatus.userPhone})`
                : '👉 FALTA LER O QR CODE'}
            </span>
            <p className="text-[#94a3b8] text-[11px] mt-0.5">
              {waStatus.status === 'connected'
                ? 'Respondendo mensagens automaticamente.'
                : 'Aponte a câmera do seu celular no código abaixo.'}
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-[#0e1628] p-4 rounded-2xl border border-[#1a263d] shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white block text-xs">3. Treinamento da IA</span>
            <span className="text-[#c084fc] font-bold block text-[11px] mt-0.5">📝 PERSONALIZADO</span>
            <p className="text-[#64748b] text-[11px] mt-0.5">
              Preços, regras, áudios e reações configurados.
            </p>
          </div>
        </div>

        {/* Item 4: Horário & Pausas */}
        <div className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 transition-all ${
          scheduleStatus?.isWithinHours
            ? 'bg-[#0e1628] border-emerald-500/50'
            : 'bg-[#101426] border-indigo-500/50'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            scheduleStatus?.isWithinHours
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
          }`}>
            {scheduleStatus?.isWithinHours ? (
              <Clock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-300" />
            )}
          </div>
          <div>
            <span className="font-bold text-white block text-xs">4. Horário & Pausas</span>
            <span className={`font-bold block text-[11px] mt-0.5 ${
              scheduleStatus?.isWithinHours ? 'text-[#34d399]' : 'text-indigo-300'
            }`}>
              {scheduleStatus?.isWithinHours ? '🟢 NO EXPEDIENTE' : '🌙 EM DESCANSO'}
            </span>
            <p className="text-[#94a3b8] text-[11px] mt-0.5">
              {scheduleStatus?.isWithinHours
                ? 'Respondendo dentro do horário.'
                : 'Pausado para respeitar expediente.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Connection Card */}
      <div className="bg-[#0e1628] rounded-2xl border border-[#1a263d] shadow-xl overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#0b1220] px-6 py-4 border-b border-[#1a263d] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0b1220] ${
                  waStatus.status === 'connected'
                    ? 'bg-[#10b981] animate-pulse'
                    : waStatus.status === 'qr_ready'
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#64748b]'
                }`}
              ></span>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                {waStatus.status === 'connected'
                  ? 'WhatsApp Conectado e Operando'
                  : waStatus.status === 'qr_ready'
                  ? 'Pronto para Conectar: Escaneie o QR Code'
                  : waStatus.status === 'connecting'
                  ? 'Iniciando Conexão...'
                  : 'WhatsApp Desconectado'}
              </h3>
              <p className="text-xs text-[#64748b]">
                {waStatus.status === 'connected'
                  ? `Número ativo: +${waStatus.userPhone || 'Seu WhatsApp'} (${waStatus.userName || 'Online'})`
                  : 'Conecte seu WhatsApp pessoal ou comercial para responder no piloto automático'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {waStatus.status === 'connected' ? (
              <>
                <button
                  onClick={handleToggleAutoReply}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shadow cursor-pointer ${
                    waStatus.autoReplyEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {waStatus.autoReplyEnabled ? 'Piloto Automático: LIGADO' : 'Piloto Automático: PAUSADO'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {waStatus.status === 'disconnected' ? 'Gerar QR Code' : 'Recarregar QR Code'}
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {waStatus.status === 'connected' ? (
            /* Connected View */
            <div className="space-y-6">
              <div className="bg-[#0b1324] border border-emerald-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-[#34d399] flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-lg shadow-emerald-500/20">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d399] bg-[#06241a] border border-[#10b981]/40 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      Online & Atendendo
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      Seu WhatsApp está pronto e respondendo clientes!
                    </h2>
                    <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-xl">
                      Mensagens e áudios enviados para <strong>+{waStatus.userPhone}</strong> estão sendo ouvidos e respondidos pela IA com emojis e reações contextualizadas.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                  {onGoToFormTriage && (
                    <button
                      onClick={onGoToFormTriage}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Triagem de Formulários
                    </button>
                  )}
                  <button
                    onClick={onGoToTraining}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Editar Treinamento
                  </button>
                  <button
                    onClick={onGoToInbox}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#121c33] hover:bg-[#182645] text-white border border-[#223558] font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Monitor de Contatos
                  </button>
                </div>
              </div>

              {/* Form Triage Quick Card */}
              <div className="bg-[#0b1324] border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-md">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      RespondeForm AI Ativo
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Triagem Instantânea por Print de Formulário
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      Cole o print das respostas de qualquer formulário (ou envie a foto no seu WhatsApp) para a IA iniciar a abordagem com uma mensagem curta e qualificar o lead automaticamente.
                    </p>
                  </div>
                </div>

                {onGoToFormTriage && (
                  <button
                    onClick={onGoToFormTriage}
                    className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/25"
                  >
                    Abrir Triagem por Print
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Disconnected / QR Code View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* QR Code Container */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-2xl relative flex flex-col items-center">
                  {waStatus.qrDataUrl ? (
                    <img
                      src={waStatus.qrDataUrl}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 rounded-xl"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-300">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                      <p className="text-xs font-bold text-slate-800">Gerando QR Code...</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Aguarde a inicialização do socket do WhatsApp.
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    QR Code atualiza automaticamente
                  </div>
                </div>

                {connectError && (
                  <div className="mt-3 max-w-sm rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-center text-xs text-rose-200">
                    {connectError}
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="mt-4 text-xs text-[#94a3b8] hover:text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Não apareceu? Clique para gerar novo código
                </button>
              </div>

              {/* Instructions */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  Como conectar seu WhatsApp agora:
                </h3>

                <ol className="space-y-3 text-xs sm:text-sm text-[#94a3b8]">
                  <li className="flex items-start gap-3 bg-[#0b1220] p-3.5 rounded-xl border border-[#1a263d]">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Abra o WhatsApp</strong> no seu celular (pessoal ou WhatsApp Business).
                    </div>
                  </li>

                  <li className="flex items-start gap-3 bg-[#0b1220] p-3.5 rounded-xl border border-[#1a263d]">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
                      2
                    </span>
                    <div>
                      Toque no menu de <strong className="text-white">3 pontinhos ⋮</strong> (Android) ou em <strong className="text-white">Configurações ⚙️</strong> (iPhone).
                    </div>
                  </li>

                  <li className="flex items-start gap-3 bg-[#0b1220] p-3.5 rounded-xl border border-[#1a263d]">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
                      3
                    </span>
                    <div>
                      Selecione <strong className="text-white">Aparelhos conectados</strong> e toque no botão <strong className="text-white">Conectar um aparelho</strong>.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 bg-[#0b1220] p-3.5 rounded-xl border border-[#1a263d]">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
                      4
                    </span>
                    <div>
                      <strong className="text-white">Aponte a câmera para o QR Code</strong> ao lado. A tela mudará para conectado no mesmo segundo!
                    </div>
                  </li>
                </ol>

                <div className="bg-[#0b1527] border border-blue-500/30 rounded-xl p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Conexão Segura & Oficial:</strong> Protocolo multi-dispositivo seguro. Suas conversas continuam criptografadas e você pode desconectar pelo celular quando quiser.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
