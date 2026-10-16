import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Video,
  Users,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Link as LinkIcon,
  MessageSquare,
} from 'lucide-react';
import { PreCallMeeting, PreCallConfig, PreCallStage } from '../types';

export const PreCallReminders: React.FC = () => {
  const [meetings, setMeetings] = useState<PreCallMeeting[]>([]);
  const [config, setConfig] = useState<PreCallConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'meetings' | 'templates'>('meetings');
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [leadName, setLeadName] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetGroupLink, setTargetGroupLink] = useState('');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/new');
  const [notes, setNotes] = useState('');

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reminders/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
        setConfig(data.config || null);
      }
    } catch (err) {
      console.error('Erro ao carregar pré-calls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !meetingDateTime) return;

    try {
      const res = await fetch('/api/reminders/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting: {
            leadName,
            targetName: targetName || `Grupo Pré-Call ${leadName}`,
            targetGroupLink,
            targetType: 'group',
            meetingDateTime,
            meetingLink,
            notes,
            stagesSent: {},
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMeetings((prev) => [data.meeting, ...prev]);
        setShowAddModal(false);
        setLeadName('');
        setTargetName('');
        setTargetGroupLink('');
        setMeetingDateTime('');
        setNotes('');
        showNotification('Pré-Call agendada com lembretes modulares ativados!');
      }
    } catch (err) {
      console.error('Erro ao agendar reunião:', err);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/meetings/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        showNotification('Reunião removida com sucesso.');
      }
    } catch (err) {
      console.error('Erro ao excluir reunião:', err);
    }
  };

  const handleTriggerStage = async (meetingId: string, stageId: string) => {
    const key = `${meetingId}-${stageId}`;
    try {
      setSendingKey(key);
      const res = await fetch('/api/reminders/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, stageId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings((prev) =>
          prev.map((m) => (m.id === meetingId ? data.meeting : m))
        );
        showNotification('Lembrete disparado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao disparar lembrete:', err);
    } finally {
      setSendingKey(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification('Link copiado para a área de transferência!');
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">
            <Bell className="w-4 h-4" />
            <span>Engajamento & Presença em Reuniões</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Lembretes Pré-Call em Grupos ArcoZapp
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Garanta taxa máxima de comparecimento nas reuniões com lembretes automáticos e modulares (24h, 2h, 15 min e no horário).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#0f172a] p-1 rounded-lg border border-[#1e293b] flex items-center">
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'meetings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reuniões Agendadas</span>
              <span className="ml-1 text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                {meetings.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modelos Modulares</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Pré-Call</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#94a3b8] text-sm animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Carregando reuniões e configurações...</span>
        </div>
      ) : activeTab === 'meetings' ? (
        /* ================= MEETINGS LIST VIEW ================= */
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <div className="border border-[#1e293b] rounded-xl bg-[#0d1527] p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#475569] mx-auto" />
              <h3 className="text-base font-semibold text-white">Nenhuma reunião pré-call agendada</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                Cadastre o grupo de WhatsApp da reunião e o horário agendado. O ArcoZapp cuidará de avisar os participantes nos momentos certos.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar Primeira Pré-Call</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting) => {
                const meetingDate = new Date(meeting.meetingDateTime);
                const isPast = meetingDate.getTime() < Date.now();
                const formattedDate = meetingDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const formattedTime = meetingDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={meeting.id}
                    className="bg-[#0d1527] border border-[#1e293b] rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-blue-500/40 transition group"
                  >
                    <div>
                      {/* Top meeting card header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400 uppercase tracking-wider">
                            <Users className="w-3 h-3" />
                            <span>{meeting.targetName || 'Grupo de WhatsApp'}</span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-0.5">
                            {meeting.leadName}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-[#64748b] hover:text-rose-400 transition p-1 cursor-pointer"
                          title="Excluir reunião"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Date & Time pill */}
                      <div className="flex items-center gap-2 mt-3 bg-[#070b14] p-2.5 rounded-lg border border-[#1e293b] text-xs">
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="flex-1 font-mono">
                          <span className="text-white font-semibold">{formattedDate}</span>
                          <span className="text-[#64748b] mx-1.5">•</span>
                          <span className="text-emerald-400 font-semibold">{formattedTime}</span>
                        </div>
                        {isPast && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                            Passada
                          </span>
                        )}
                      </div>

                      {/* Meeting Room Link */}
                      <div className="flex items-center justify-between gap-2 mt-2.5 text-xs text-[#94a3b8] bg-[#070b14]/60 px-3 py-1.5 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate text-slate-300 font-mono text-[11px]">
                            {meeting.meetingLink}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(meeting.meetingLink, meeting.id)}
                          className="hover:text-white transition cursor-pointer p-1"
                          title="Copiar link"
                        >
                          {copiedId === meeting.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {meeting.targetGroupLink && (
                        <div className="mt-2 text-[11px] text-[#94a3b8] flex items-center gap-1 truncate">
                          <LinkIcon className="w-3 h-3 text-[#64748b]" />
                          <span className="truncate font-mono">{meeting.targetGroupLink}</span>
                        </div>
                      )}
                    </div>

                    {/* Modular Stages Buttons */}
                    <div className="border-t border-[#1e293b] pt-3.5 space-y-2">
                      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                        Disparo Modular de Lembretes:
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {config?.stages.map((stage) => {
                          const isSent = Boolean(meeting.stagesSent[stage.id]);
                          const isTriggering = sendingKey === `${meeting.id}-${stage.id}`;

                          return (
                            <button
                              key={stage.id}
                              onClick={() => handleTriggerStage(meeting.id, stage.id)}
                              disabled={isTriggering}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition cursor-pointer border ${
                                isSent
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-[#1e293b] border-[#334155] text-slate-200 hover:border-blue-500/60'
                              }`}
                            >
                              <span className="truncate">{stage.label}</span>
                              {isTriggering ? (
                                <RefreshCw className="w-3 h-3 animate-spin shrink-0 ml-1" />
                              ) : isSent ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                              ) : (
                                <Send className="w-3 h-3 text-[#64748b] group-hover:text-blue-400 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= TEMPLATES VIEW ================= */
        <div className="space-y-4">
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Modelos de Mensagens Modulares
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Textos pré-configurados que são enviados aos grupos e participantes nos intervalos da call.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {config?.stages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{stage.label}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Ativo na esteira
                    </span>
                  </div>

                  <p className="text-xs text-[#cbd5e1] font-mono bg-[#0d1527] p-3 rounded-lg border border-[#1e293b]">
                    {stage.template}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Pre-Call Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>Agendar Nova Pré-Call</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748b] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Nome do Prospect / Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Matheus Oliveira"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Nome do Grupo no WhatsApp (ou identificador)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pré-Call | ArcoZapp & Matheus"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Link de Convite do Grupo ou Telefone
                </label>
                <input
                  type="text"
                  placeholder="Ex: https://chat.whatsapp.com/xyz123 ou 11999998888"
                  value={targetGroupLink}
                  onChange={(e) => setTargetGroupLink(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Data e Horário da Call *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingDateTime}
                    onChange={(e) => setMeetingDateTime(e.target.value)}
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Link da Sala (Google Meet / Zoom)
                  </label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Pauta / Observações da Reunião (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Apresentar proposta comercial e tirar dúvidas de implementação"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-[#94a3b8] hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cadastrar Reunião
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
