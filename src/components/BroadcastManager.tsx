import React, { useState, useEffect } from 'react';
import {
  Send,
  Users,
  ListPlus,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Phone,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Sliders,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface ContactItem {
  phone: string;
  name: string;
}

interface BroadcastStatus {
  status: 'idle' | 'running' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  delaySeconds: number;
  currentContact?: string;
  logs: Array<{
    phone: string;
    name: string;
    status: 'success' | 'failed';
    timestamp: string;
    error?: string;
  }>;
}

export const BroadcastManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'bulk' | 'single'>('bulk');
  const [rawContactsText, setRawContactsText] = useState(
    '5511999998888, João Silva\n5521988887777, Maria Oliveira\n5531977776666, Carlos Souza'
  );
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá {nome}! Tudo bem? 😊\n\nEstamos passando para compartilhar as novidades e condições especiais exclusivas que preparamos para você esta semana!'
  );
  const [includeListMenu, setIncludeListMenu] = useState(true);
  const [listOptions, setListOptions] = useState<string[]>([
    'Ver Tabela de Preços e Serviços',
    'Conhecer Promoções da Semana',
    'Horários de Atendimento & Agendamento',
    'Falar com um Atendente Humano',
  ]);
  const [newOptionText, setNewOptionText] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(6);

  // Single message state
  const [singlePhone, setSinglePhone] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleMessage, setSingleMessage] = useState('Olá! Como posso ajudar você hoje?');
  const [singleSending, setSingleSending] = useState(false);
  const [singleFeedback, setSingleFeedback] = useState<string | null>(null);

  // Status of running broadcast
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus>({
    status: 'idle',
    total: 0,
    sent: 0,
    failed: 0,
    delaySeconds: 5,
    logs: [],
  });

  // Poll broadcast status every 1.5 seconds
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/broadcast-status');
        if (res.ok && isMounted) {
          const data: BroadcastStatus = await res.json();
          setBroadcastStatus(data);
        }
      } catch {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Parse raw text into contact objects
  const parseContacts = (): ContactItem[] => {
    return rawContactsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        const phone = parts[0].replace(/\D/g, '');
        const name = parts[1] || 'Cliente';
        return { phone, name };
      })
      .filter((item) => item.phone.length >= 8);
  };

  const contactsList = parseContacts();

  const handleStartBroadcast = async () => {
    if (contactsList.length === 0) {
      alert('Insira pelo menos um número de telefone válido na lista de contatos.');
      return;
    }
    if (!messageTemplate.trim()) {
      alert('Digite o texto da mensagem a ser disparada.');
      return;
    }

    if (
      !confirm(
        `Deseja iniciar o disparo para ${contactsList.length} contatos com intervalo seguro de ${delaySeconds} segundos entre cada envio?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/broadcast-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contactsList,
          messageTemplate,
          includeListMenu,
          listOptions: includeListMenu ? listOptions : [],
          delaySeconds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Erro ao iniciar disparo: ${err.error || 'Verifique se o WhatsApp está conectado.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao iniciar disparo.');
    }
  };

  const handleCancelBroadcast = async () => {
    try {
      await fetch('/api/whatsapp/broadcast-cancel', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singlePhone.trim()) return;

    setSingleSending(true);
    setSingleFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/send-first-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: singlePhone,
          name: singleName || 'Cliente',
          message: singleMessage,
          includeListMenu: false,
        }),
      });

      if (res.ok) {
        setSingleFeedback('Mensagem inicial enviada com sucesso! Assim que o cliente responder, a IA assume.');
        setSinglePhone('');
        setSingleName('');
      } else {
        const err = await res.json();
        setSingleFeedback(`Erro: ${err.error || 'Não foi possível enviar.'}`);
      }
    } catch (err) {
      console.error(err);
      setSingleFeedback('Erro ao conectar com o servidor.');
    } finally {
      setSingleSending(false);
    }
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    setListOptions([...listOptions, newOptionText.trim()]);
    setNewOptionText('');
  };

  const handleRemoveOption = (index: number) => {
    setListOptions(listOptions.filter((_, idx) => idx !== index));
  };

  const progressPercent =
    broadcastStatus.total > 0
      ? Math.round(((broadcastStatus.sent + broadcastStatus.failed) / broadcastStatus.total) * 100)
      : 0;

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner in Arco CRM Dark Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Prospecção Ativa
            </span>
            <span className="text-[11px] font-bold text-[#34d399] bg-[#0a1b24] border border-[#065f46]/50 px-2 py-0.5 rounded-full uppercase">
              Follow-up Inteligente
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Disparador de Mensagem & Lista Interativa
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
            Envie a primeira mensagem para seus contatos. <strong>Assim que o cliente responder, a IA assume o atendimento automaticamente!</strong>
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-[#0e1628] border border-[#1a263d] p-1 rounded-full">
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
              activeSubTab === 'bulk'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Disparo em Lista ({contactsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('single')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
              activeSubTab === 'single'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Disparo Individual (1 Número)
          </button>
        </div>
      </div>

      {/* Progress Card when running or completed */}
      {broadcastStatus.status !== 'idle' && (
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    broadcastStatus.status === 'running'
                      ? 'bg-amber-400 animate-pulse'
                      : broadcastStatus.status === 'completed'
                      ? 'bg-[#10b981]'
                      : 'bg-rose-500'
                  }`}
                ></span>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {broadcastStatus.status === 'running'
                    ? 'Disparo em Andamento...'
                    : broadcastStatus.status === 'completed'
                    ? 'Disparo Concluído com Sucesso!'
                    : 'Disparo Cancelado'}
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {broadcastStatus.currentContact
                  ? `Enviando agora para: ${broadcastStatus.currentContact}`
                  : `Progresso: ${broadcastStatus.sent} enviados com sucesso, ${broadcastStatus.failed} falhas`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-white font-mono">{progressPercent}%</span>
              {broadcastStatus.status === 'running' && (
                <button
                  onClick={handleCancelBroadcast}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer"
                >
                  Pausar / Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#0b1220] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                broadcastStatus.status === 'completed' ? 'bg-[#10b981]' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Recent logs */}
          {broadcastStatus.logs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1a263d]">
              <span className="text-xs font-bold text-white block mb-2">
                Últimos Envios Realizados:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
                {broadcastStatus.logs.slice(0, 10).map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#0b1220] border border-[#1e293b]"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-semibold text-white">{log.name}</span>
                      <span className="text-[#64748b] text-[11px]">({log.phone})</span>
                    </div>
                    <span className="text-[10px] text-[#94a3b8]">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {activeSubTab === 'bulk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contact List */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1a263d]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Lista de Contatos
                </h3>
                <span className="text-[11px] font-mono text-[#34d399] bg-[#0a1b24] border border-[#065f46]/50 px-2 py-0.5 rounded-full">
                  {contactsList.length} identificados
                </span>
              </div>

              <p className="text-xs text-[#94a3b8] mb-2 leading-relaxed">
                Cole a lista no formato <code>telefone, Nome</code> (um por linha):
              </p>

              <textarea
                rows={9}
                value={rawContactsText}
                onChange={(e) => setRawContactsText(e.target.value)}
                placeholder="5511999998888, João Silva&#10;5521988887777, Maria Oliveira"
                className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 placeholder-[#64748b]"
              />

              {/* Safe Delay Selection */}
              <div className="mt-4 pt-3 border-t border-[#1a263d] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Intervalo Seguro entre Envios:
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    Evita bloqueios no WhatsApp simulando envio humano
                  </span>
                </div>
                <select
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="bg-[#0b1220] border border-[#1e293b] text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value={3}>3 segundos</option>
                  <option value={5}>5 segundos (Recomendado)</option>
                  <option value={8}>8 segundos (Muito seguro)</option>
                  <option value={12}>12 segundos (Máxima cautela)</option>
                </select>
              </div>
            </div>

            {/* Anti-spam tip card */}
            <div className="bg-[#0b1220] border border-[#1a263d] rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#34d399] shrink-0 mt-0.5" />
              <div className="text-xs text-[#94a3b8] leading-relaxed">
                <strong className="text-white block mb-0.5">Disparo Responsável:</strong>
                Recomendamos disparar para leads que já demonstraram interesse ou clientes da sua base. O intervalo automático protege o seu chip.
              </div>
            </div>
          </div>

          {/* Right Column: Message Template & Preview */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a263d]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Mensagem Inicial & Menu de Lista
                </h3>
                <span className="text-[11px] text-[#64748b]">
                  Tag disponível: <code className="text-blue-400">{"{nome}"}</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Texto da Mensagem:
                </label>
                <textarea
                  rows={4}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Escreva a mensagem que os clientes vão receber..."
                  className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 placeholder-[#64748b]"
                />
              </div>

              {/* List Menu Options Toggle */}
              <div className="bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-[#c084fc]" />
                    <span className="text-xs font-bold text-white">
                      Anexar Menu de Lista de Opções:
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeListMenu}
                    onChange={(e) => setIncludeListMenu(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {includeListMenu && (
                  <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                    <span className="text-[11px] text-[#94a3b8] block">
                      Opções numeradas enviadas junto da mensagem:
                    </span>
                    <div className="space-y-1.5">
                      {listOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#0e1628] border border-[#1e293b] px-3 py-1.5 rounded-lg text-xs"
                        >
                          <span className="text-white">
                            <strong className="text-blue-400 mr-1.5">[{idx + 1}]</strong>
                            {opt}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-[#64748b] hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                        placeholder="Ex: Tabela de Preços..."
                        className="flex-1 bg-[#0e1628] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Preview in WhatsApp Dark Bubble */}
              <div className="pt-2">
                <span className="text-xs font-bold text-white block mb-2">
                  Prévia da Mensagem no WhatsApp:
                </span>
                <div
                  className="p-4 rounded-xl border border-[#1a263d] bg-[#0c1317]"
                  style={{
                    backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                  }}
                >
                  <div className="bg-[#202c33] text-[#e9edef] border border-[#2a3942] rounded-2xl rounded-tl-none p-3.5 shadow-md max-w-sm text-xs leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {messageTemplate.replace(/\{nome\}/gi, 'João Silva')}
                    </div>

                    {includeListMenu && listOptions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#2a3942] space-y-1">
                        <strong className="block text-[#34d399] text-[11px]">
                          Escolha uma opção digitando o número:
                        </strong>
                        {listOptions.map((opt, idx) => (
                          <div key={idx} className="text-[#e9edef] text-[11px]">
                            <strong className="text-blue-400 mr-1">[{idx + 1}]</strong> {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Start Broadcast Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartBroadcast}
                  disabled={broadcastStatus.status === 'running' || contactsList.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-6 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {broadcastStatus.status === 'running'
                    ? 'Disparo em Andamento...'
                    : `Disparar para os ${contactsList.length} Contatos da Lista`}
                </button>
                <span className="text-[11px] text-[#64748b] text-center block mt-2">
                  Assim que qualquer cliente responder, o robô Gemini continuará o atendimento sozinho!
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single First Message Form */
        <div className="max-w-2xl mx-auto bg-[#0e1628] border border-[#1a263d] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-[#1a263d] mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Iniciar Conversa com um Número Específico
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Envie a primeira mensagem para um cliente novo. Quando ele responder, a IA assume.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendSingle} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Número do WhatsApp com DDD:
              </label>
              <input
                type="text"
                required
                value={singlePhone}
                onChange={(e) => setSinglePhone(e.target.value)}
                placeholder="Ex: 11999998888 ou 5511999998888"
                className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Nome do Cliente (Opcional):
              </label>
              <input
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Mensagem Inicial:
              </label>
              <textarea
                rows={4}
                value={singleMessage}
                onChange={(e) => setSingleMessage(e.target.value)}
                placeholder="Digite a mensagem..."
                className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-blue-500 placeholder-[#64748b]"
              />
            </div>

            {singleFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  singleFeedback.startsWith('Erro')
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                    : 'bg-[#0a1b24] text-[#34d399] border border-[#065f46]/50'
                }`}
              >
                {singleFeedback.startsWith('Erro') ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34d399]" />
                )}
                <span>{singleFeedback}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={singleSending || !singlePhone.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 px-6 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {singleSending ? 'Enviando...' : 'Enviar Primeira Mensagem Agora'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
