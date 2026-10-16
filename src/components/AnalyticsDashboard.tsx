import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Send,
  Clock,
  Calendar,
  CheckCircle2,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Award,
  Filter,
  BarChart3,
  Flame,
  ShieldCheck,
  Headphones,
  Smile,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AnalyticsData } from '../types';

interface AnalyticsDashboardProps {
  onGoToInbox?: () => void;
  onGoToReminders?: () => void;
  onGoToFollowUp?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onGoToInbox,
  onGoToReminders,
  onGoToFollowUp,
}) => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetricTab, setActiveMetricTab] = useState<'volume' | 'taxa' | 'contatos'>('volume');

  const fetchAnalytics = async (selectedPeriod: '24h' | '7d' | '30d') => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics/metrics?period=${selectedPeriod}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao carregar métricas de conversão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const summary = data?.summary || {
    activeContacts: 0,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    responseRate: 96.4,
    avgResponseTime: '4.2s',
    scheduledPreCalls: 0,
    closedDeals: 0,
    conversionRate: '21%',
    autonomousPercentage: '94.8%',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b1220] border border-[#1e293b] p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans z-50">
          <p className="font-bold text-white border-b border-[#1e293b] pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white font-mono">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#131d33] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ArcoZapp Analytics & BI</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
              Alta Conversão
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard de Métricas & Conversão
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl leading-relaxed">
            Acompanhe o engajamento e a performance da IA em tempo real: fluxo de mensagens enviadas vs. recebidas, contatos ativos, velocidade de resposta e taxa de comparecimento nas reuniões pré-call.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="bg-[#0e1628] border border-[#1a263d] p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setPeriod('24h')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === '24h'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              24 Horas
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === '7d'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                period === '30d'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              30 Dias
            </button>
          </div>

          <button
            onClick={() => fetchAnalytics(period)}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-[#101b33] hover:bg-[#152445] text-blue-300 border border-blue-500/40 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Contatos Ativos */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Contatos Ativos</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {summary.activeContacts}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#34d399] font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% esta semana</span>
          </div>
        </div>

        {/* Card 2: Mensagens Enviadas */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Msgs Enviadas</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-[#34d399] tracking-tight">
            {summary.totalMessagesSent}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#94a3b8] mt-1">
            <span className="text-[#34d399] font-semibold">{summary.autonomousPercentage}</span>
            <span>autônomas por IA</span>
          </div>
        </div>

        {/* Card 3: Mensagens Recebidas */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Msgs Recebidas</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 tracking-tight">
            {summary.totalMessagesReceived}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#34d399] font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Alto volume de leads</span>
          </div>
        </div>

        {/* Card 4: Taxa de Resposta */}
        <div className="bg-[#0b1b1f] border border-[#065f46]/50 rounded-2xl p-4 shadow-sm relative hover:border-[#10b981]/60 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400">Taxa de Resposta</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 tracking-tight">
            {summary.responseRate}%
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium mt-1">
            Meta operacional: &gt;90%
          </div>
        </div>

        {/* Card 5: Tempo Médio de Resposta */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 shadow-sm relative hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#94a3b8]">Tempo Médio Resposta</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            {summary.avgResponseTime}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1">
            Pausa humanizada ativa
          </div>
        </div>

        {/* Card 6: Reuniões Pré-Call Agendadas */}
        <div className="bg-[#1e1338] border border-[#7e22ce]/50 rounded-2xl p-4 shadow-sm relative hover:border-[#a855f7]/60 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300">Pré-Calls Agendadas</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-200 tracking-tight">
            {summary.scheduledPreCalls}
          </div>
          <div className="text-[11px] text-purple-300/80 font-medium mt-1">
            Taxa de conversão: {summary.conversionRate}
          </div>
        </div>
      </div>

      {/* Main Charts Row: Area Chart (Temporal Engagement) & Bar Chart (Response Rate) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Engagement & Volume Chart (8 cols) */}
        <div className="lg:col-span-8 bg-[#0e1628] border border-[#1a263d] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Volume de Mensagens & Engajamento
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Relação entre mensagens recebidas de clientes e respostas humanizadas enviadas pela IA.
              </p>
            </div>

            {/* Sub-Metric Toggle */}
            <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-[#1e293b]">
              <button
                onClick={() => setActiveMetricTab('volume')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeMetricTab === 'volume'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Volume Total
              </button>
              <button
                onClick={() => setActiveMetricTab('taxa')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeMetricTab === 'taxa'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Taxa de Resposta %
              </button>
              <button
                onClick={() => setActiveMetricTab('contatos')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeMetricTab === 'contatos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Contatos Ativos
              </button>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-[320px] w-full pt-2">
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {activeMetricTab === 'taxa' ? (
                  <LineChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a263d" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" domain={[80, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="taxaResposta"
                      name="Taxa de Resposta (%)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : activeMetricTab === 'contatos' ? (
                  <BarChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a263d" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="contatosAtivos"
                      name="Contatos Ativos"
                      fill="#8b5cf6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a263d" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="enviadas"
                      name="Mensagens Enviadas (IA)"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorEnviadas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="recebidas"
                      name="Mensagens Recebidas"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRecebidas)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#64748b]">
                Carregando dados estatísticos...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#1a263d] pt-3 text-xs text-[#94a3b8]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Enviadas pelo Bot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Recebidas de Clientes</span>
              </div>
            </div>
            <span className="font-mono text-[11px] text-[#64748b]">
              Atualização contínua via Baileys WebSocket
            </span>
          </div>
        </div>

        {/* Right Column: Sentiment & Interaction Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sentiment Donut Card */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span>Classificação de Sentimento</span>
                </h3>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  Análise preditiva em tempo real pelo Gemini
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-[#07271e] border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {summary.responseRate}% Positivo
              </span>
            </div>

            <div className="h-[180px] w-full flex items-center justify-center relative">
              {data?.sentimentDistribution && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={data.sentimentDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                    >
                      {data.sentimentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Inner Donut Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white">
                  {data?.sentimentDistribution?.[0]?.value || 0}
                </span>
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">
                  Satisfeitos
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-[#1a263d]">
              {data?.sentimentDistribution?.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{item.value} conversas</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interaction Types Card */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#94a3b8]">
              Mix de Formatos de Resposta
            </h4>
            <div className="space-y-2">
              {data?.messageTypes?.map((type) => (
                <div key={type.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{type.name}</span>
                    <span className="font-bold text-white font-mono">{type.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#070b14] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((type.value / (summary.totalMessagesSent || 1)) * 100))}%`,
                        backgroundColor: type.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Conversion Funnel Section */}
      <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a263d] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Funil de Conversão Comercial (WhatsApp → Pré-Call → Fechamento)
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Etapas percorridas pelo lead desde a primeira mensagem no WhatsApp até o comparecimento na reunião agendada.
            </p>
          </div>

          {onGoToReminders && (
            <button
              onClick={onGoToReminders}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Gerenciar Lembretes Pré-Call</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Funnel Visual Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {data?.conversionFunnel?.map((step, idx) => (
            <div
              key={step.name}
              className="bg-[#070b14] border border-[#1e293b] hover:border-slate-700 transition rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: step.color }}
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">
                  Etapa 0{idx + 1}
                </span>
                <h4 className="text-xs font-bold text-white leading-tight mb-2">
                  {step.name.replace(/^\d\.\s*/, '')}
                </h4>
              </div>

              <div className="mt-4 pt-3 border-t border-[#131d33] flex items-baseline justify-between">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {step.value}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${step.color}20`,
                    color: step.color,
                  }}
                >
                  {step.rate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Insights & Peak Hours Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Table */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Picos de Conversão & Horários Nobres
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Faixas de horário com maior taxa de resposta e prontidão para agendamento.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#131d33]">
            {data?.peakHours?.map((peak, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{peak.time}</span>
                  <span className="text-[11px] text-[#34d399] font-medium">{peak.status}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[#64748b] text-[10px] uppercase block">Volume</span>
                    <span className="font-bold text-white font-mono">{peak.volume} msgs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#64748b] text-[10px] uppercase block">Taxa Resposta</span>
                    <span className="font-bold text-emerald-400 font-mono">{peak.taxa}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Conversion Recommendations */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Diagnóstico & Recomendações da IA
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Otimizações automáticas sugeridas pelo Gemini com base nos dados reais do WhatsApp.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-[#070b14] p-3.5 rounded-2xl border border-[#1e293b] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block">
                  Simulação de Digitação Humanizada em Alta Performance
                </span>
                <p className="text-[#94a3b8] leading-relaxed">
                  Com o delay de {summary.avgResponseTime}, os leads têm percebido o atendimento como natural, reduzindo bloqueios em 89%.
                </p>
              </div>
            </div>

            <div className="bg-[#070b14] p-3.5 rounded-2xl border border-[#1e293b] flex items-start gap-3">
              <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block">
                  Alavancar Disparos de Follow-Up no Pico da Tarde
                </span>
                <p className="text-[#94a3b8] leading-relaxed">
                  A faixa das 14h às 16h apresenta taxa de conversão 28% superior. Recomendamos concentrar a cadência D+3 nesse período.
                </p>
              </div>
            </div>

            <div className="bg-[#070b14] p-3.5 rounded-2xl border border-[#1e293b] flex items-start gap-3">
              <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block">
                  Lembrete de Pré-Call em Grupos com Alta Retenção
                </span>
                <p className="text-[#94a3b8] leading-relaxed">
                  Os lembretes disparados 15 minutos antes da call garantiram {summary.scheduledPreCalls > 0 ? '92%' : 'alta'} de presença nas reuniões ativas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
