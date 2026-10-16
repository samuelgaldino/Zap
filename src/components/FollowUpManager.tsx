import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Clock,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Search,
  Filter,
  Check,
  RefreshCw,
  Sliders,
  Calendar,
  MessageSquare,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import {
  FollowUpCadenceConfig,
  FollowUpStep,
  FollowUpContact,
  FollowUpStyle,
} from '../types';

export const FollowUpManager: React.FC = () => {
  const [config, setConfig] = useState<FollowUpCadenceConfig | null>(null);
  const [contacts, setContacts] = useState<FollowUpContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'builder'>('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchCadenceData = async () => {
    try {
      setIsLoading(true);
      const [resCadence, resQueue] = await Promise.all([
        fetch('/api/followup/cadences'),
        fetch('/api/followup/queue'),
      ]);
      if (resCadence.ok) {
        const data = await resCadence.json();
        setConfig(data.config);
      }
      if (resQueue.ok) {
        const queueData = await resQueue.json();
        setContacts(queueData.contacts || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de follow-up:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCadenceData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveCadence = async () => {
    if (!config) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/followup/cadences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        showNotification('Configuração da cadência salva com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao salvar cadência:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStep = () => {
    if (!config) return;
    const nextDays = (config.steps[config.steps.length - 1]?.daysAfter || 0) + 3;
    const newStep: FollowUpStep = {
      id: `step-${Date.now()}`,
      name: `D+${nextDays} - Nova Etapa`,
      daysAfter: nextDays,
      time: '11:00',
      messageStyle: 'conteudo_valor',
      template: 'Oi {{nome}}, tudo bem? Passando para te deixar um recado rápido!',
      enabled: true,
    };
    setConfig({
      ...config,
      steps: [...config.steps, newStep],
    });
  };

  const handleRemoveStep = (index: number) => {
    if (!config || config.steps.length <= 1) return;
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    setConfig({ ...config, steps: newSteps });
  };

  const handleTriggerMessage = async (contact: FollowUpContact) => {
    try {
      setSendingId(contact.id);
      const res = await fetch('/api/followup/queue/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(`Follow-up enviado para ${contact.name}!`);
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? data.contact : c))
        );
      }
    } catch (err) {
      console.error('Erro ao disparar follow-up:', err);
    } finally {
      setSendingId(null);
    }
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadPhone) return;
    try {
      const res = await fetch('/api/followup/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          notes: newLeadNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContacts((prev) => [data.contact, ...prev]);
        setShowAddModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadNotes('');
        showNotification('Lead adicionado à cadência com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao adicionar lead:', err);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.status === 'active') ||
      (statusFilter === 'completed' && c.status === 'completed');
    return matchesSearch && matchesStatus;
  });

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
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">
            <GitCommit className="w-4 h-4" />
            <span>Automação & Conversão</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cadência de Follow-Up ArcoZapp
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Acompanhe seus leads com mensagens programadas nos dias ideais, quebre objeções e aumente a conversão sem esforço manual.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0f172a] p-1 rounded-lg border border-[#1e293b] flex items-center">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Fila de Acompanhamento</span>
              <span className="ml-1 text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                {contacts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'builder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configurar Dias & Estilos</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Lead</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#94a3b8] text-sm animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Carregando cadência e contatos...</span>
        </div>
      ) : activeTab === 'queue' ? (
        /* ================= QUEUE VIEW ================= */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1527] border border-[#1e293b] p-3 rounded-xl">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar contato por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-lg border border-[#1e293b]">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-[11px] rounded ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 text-[11px] rounded ${
                    statusFilter === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 text-[11px] rounded ${
                    statusFilter === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Concluídos
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#94a3b8] self-end sm:self-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Fila pronta para disparo</span>
              </span>
              <button
                onClick={fetchCadenceData}
                className="hover:text-white transition p-1.5 hover:bg-[#1e293b] rounded cursor-pointer"
                title="Atualizar fila"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Queue List Table */}
          {filteredContacts.length === 0 ? (
            <div className="border border-[#1e293b] rounded-xl bg-[#0d1527] p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-[#475569] mx-auto" />
              <h3 className="text-base font-semibold text-white">Nenhum lead na fila de follow-up</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                Assim que seus contatos conversarem no WhatsApp ou forem adicionados manualmente, eles aparecerão aqui com a próxima mensagem programada.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Lead</span>
              </button>
            </div>
          ) : (
            <div className="border border-[#1e293b] rounded-xl bg-[#0d1527] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070b14] border-b border-[#1e293b] text-[#94a3b8] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Lead / Contato</th>
                      <th className="py-3 px-4">Etapa Atual</th>
                      <th className="py-3 px-4">Estilo & Mensagem Programada</th>
                      <th className="py-3 px-4">Próximo Disparo</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredContacts.map((contact) => {
                      const step =
                        config?.steps[contact.currentStepIndex] ||
                        config?.steps[0];
                      const isComplete = contact.status === 'completed';

                      return (
                        <tr
                          key={contact.id}
                          className="hover:bg-[#131f38] transition group"
                        >
                          <td className="py-3.5 px-4 font-medium text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/30">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100">
                                  {contact.name}
                                </div>
                                <div className="text-[11px] text-[#64748b] font-mono">
                                  +{contact.phone}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1e293b] text-blue-300 border border-[#334155]">
                              <span>{step?.name || `Etapa ${contact.currentStepIndex + 1}`}</span>
                            </div>
                            <div className="text-[10px] text-[#64748b] mt-0.5">
                              {contact.currentStepIndex + 1} de {config?.steps.length || 4} etapas
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-md">
                            <div className="text-[11px] text-[#cbd5e1] line-clamp-2 bg-[#070b14]/60 p-2 rounded border border-[#1e293b]">
                              {step?.template
                                ? step.template.replace(/\{\{nome\}\}/gi, contact.name.split(' ')[0])
                                : 'Mensagem automática de acompanhamento'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isComplete ? (
                              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Cadência Concluída</span>
                              </span>
                            ) : (
                              <div>
                                <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>{step?.time || '10:00'}</span>
                                </div>
                                <div className="text-[10px] text-[#64748b]">
                                  {step?.daysAfter ? `D+${step.daysAfter} do contato` : 'Amanhã'}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleTriggerMessage(contact)}
                              disabled={sendingId === contact.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                isComplete
                                  ? 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                              }`}
                            >
                              {sendingId === contact.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Disparar Agora</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= BUILDER VIEW ================= */
        <div className="space-y-6">
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Estrutura da Cadência de Mensagens
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  Personalize os intervalos em dias e o estilo de abordagem para cada mensagem do fluxo.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddStep}
                  className="bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Adicionar Nova Etapa</span>
                </button>

                <button
                  onClick={handleSaveCadence}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4 pt-2">
              {config?.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4.5 space-y-3 relative group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/40">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => {
                          if (!config) return;
                          const newSteps = [...config.steps];
                          newSteps[idx].name = e.target.value;
                          setConfig({ ...config, steps: newSteps });
                        }}
                        className="bg-transparent font-semibold text-sm text-white focus:outline-none border-b border-transparent focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                        <span>Enviar após:</span>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={step.daysAfter}
                          onChange={(e) => {
                            if (!config) return;
                            const newSteps = [...config.steps];
                            newSteps[idx].daysAfter = Number(e.target.value);
                            setConfig({ ...config, steps: newSteps });
                          }}
                          className="w-14 bg-[#0d1527] border border-[#1e293b] rounded px-2 py-1 text-center font-mono text-white text-xs"
                        />
                        <span>dias</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#94a3b8]">
                        <span>Horário:</span>
                        <input
                          type="time"
                          value={step.time}
                          onChange={(e) => {
                            if (!config) return;
                            const newSteps = [...config.steps];
                            newSteps[idx].time = e.target.value;
                            setConfig({ ...config, steps: newSteps });
                          }}
                          className="bg-[#0d1527] border border-[#1e293b] rounded px-2 py-1 font-mono text-white text-xs"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveStep(idx)}
                        disabled={config?.steps.length <= 1}
                        className="text-[#64748b] hover:text-rose-400 transition p-1 cursor-pointer disabled:opacity-30"
                        title="Remover etapa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Template Text */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#94a3b8] mb-1">
                      Modelo da Mensagem (use <code className="text-blue-400">{'{{nome}}'}</code> e <code className="text-blue-400">{'{{empresa}}'}</code> para personalizar):
                    </label>
                    <textarea
                      rows={3}
                      value={step.template}
                      onChange={(e) => {
                        if (!config) return;
                        const newSteps = [...config.steps];
                        newSteps[idx].template = e.target.value;
                        setConfig({ ...config, steps: newSteps });
                      }}
                      className="w-full bg-[#0d1527] border border-[#1e293b] rounded-lg p-3 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0d1527] border border-[#1e293b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                <span>Adicionar Lead na Cadência</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748b] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Nome do Lead / Prospect
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  WhatsApp com DDD (somente números) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 11987654321"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                  Observações / Produto de interesse (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pediu proposta comercial"
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
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
                  Cadastrar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
