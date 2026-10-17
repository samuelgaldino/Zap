import React, { useState, useEffect } from 'react';
import {
  Clock,
  Moon,
  Sun,
  ShieldCheck,
  Check,
  Save,
  AlertTriangle,
  Play,
  Pause,
  Coffee,
  Calendar,
  Sparkles,
  MessageSquare,
  HelpCircle,
  VolumeX,
  Volume2,
  RefreshCw,
  Zap,
  Activity,
} from 'lucide-react';
import { BotScheduleConfig, DaySchedule } from '../types';

const DEFAULT_DAYS: DaySchedule[] = [
  { day: 0, name: 'Domingo', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 1, name: 'Segunda-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 2, name: 'Terça-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 3, name: 'Quarta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 4, name: 'Quinta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 5, name: 'Sexta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 6, name: 'Sábado', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
];

export const DEFAULT_SCHEDULE_CONFIG: BotScheduleConfig = {
  enabled: true,
  timezone: 'America/Sao_Paulo',
  actionOutOfHours: 'auto_reply',
  outOfHoursMessage:
    'Olá! Agradecemos sua mensagem. Nosso horário de atendimento comercial é de segunda a sexta, das 08h às 18h. No momento nossa equipe e nosso atendimento estão descansando, mas já registramos sua mensagem e assim que o expediente iniciar te responderemos com prioridade! 😊🙏',
  notifyOncePerContact: true,
  emergencyPause: false,
  emergencyPauseReason: '',
  days: DEFAULT_DAYS,
};

interface ScheduleStatusResponse {
  isWithinHours: boolean;
  status: 'active' | 'resting' | 'lunch_break' | 'emergency_paused';
  badge: string;
  reason: string;
  currentTimeStr: string;
  currentDay: string;
  dayConfig?: any;
}

interface BotScheduleSettingsProps {
  schedule?: BotScheduleConfig;
  onSaveSchedule?: (newSchedule: BotScheduleConfig) => void;
  onGoToLogs?: () => void;
}

export const BotScheduleSettings: React.FC<BotScheduleSettingsProps> = ({
  schedule: initialSchedule,
  onSaveSchedule,
  onGoToLogs,
}) => {
  const [schedule, setSchedule] = useState<BotScheduleConfig>(
    initialSchedule || DEFAULT_SCHEDULE_CONFIG
  );
  const [liveStatus, setLiveStatus] = useState<ScheduleStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Prevents recurring interval from wiping out user edits
  const hasLoadedRef = React.useRef(false);

  // Simulator State
  const [simDay, setSimDay] = useState<number>(0); // Sunday
  const [simTime, setSimTime] = useState<string>('21:30');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    status: ScheduleStatusResponse;
    sampleReply: string;
    simulatedDay: string;
    simulatedTime: string;
  } | null>(null);

  // Immediate persistence helper: saves instantly to disk and server
  const persistSchedule = async (newSchedule: BotScheduleConfig) => {
    setSchedule(newSchedule);
    try {
      await fetch('/api/whatsapp/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule }),
      });
      fetch('/api/whatsapp/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule }),
      }).catch(() => {});
      if (onSaveSchedule) onSaveSchedule(newSchedule);
      fetchStatus(false);
    } catch (err) {
      console.error('Erro ao persistir horário:', err);
    }
  };

  // Load from backend without wiping out user changes
  const fetchStatus = async (forceUpdate = false) => {
    try {
      const res = await fetch('/api/whatsapp/schedule/status');
      if (res.ok) {
        const data = await res.json();
        // Only overwrite local schedule on initial mount or when forced
        if (data.schedule && (!hasLoadedRef.current || forceUpdate)) {
          setSchedule(data.schedule);
          hasLoadedRef.current = true;
        }
        if (data.status) {
          setLiveStatus(data.status);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar status do horário:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Recurring polling ONLY updates live evaluation badges, NEVER overwrites schedule edits
    const interval = setInterval(() => fetchStatus(false), 4000);
    return () => clearInterval(interval);
  }, []);

  // Live Clock (Horário de Brasília)
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setCurrentTimeStr(timeFormatted);
      } catch {
        setCurrentTimeStr(new Date().toLocaleTimeString());
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await persistSchedule(schedule);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar horários:', err);
      alert('Erro ao salvar configurações de horário.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmergency = async () => {
    setEmergencyLoading(true);
    try {
      const res = await fetch('/api/whatsapp/schedule/toggle-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: schedule.emergencyPause
            ? ''
            : 'Pausa manual de descanso ativada pelo operador.',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule((prev) => ({
          ...prev,
          emergencyPause: data.emergencyPause,
        }));
        setLiveStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Quick 7-days active action: activates all 7 days with custom hours or 24/7
  const activate7DaysAllWeek = () => {
    const newDays = schedule.days.map((d: DaySchedule) => ({
      ...d,
      enabled: true,
      startTime: '00:00',
      endTime: '23:59',
      hasLunchBreak: false,
    }));
    const newSchedule: BotScheduleConfig = {
      ...schedule,
      enabled: false, // Disabling restriction gives 24/7 freedom
      days: newDays,
    };
    persistSchedule(newSchedule);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const activate7DaysStandard = () => {
    const newDays = schedule.days.map((d: DaySchedule) => ({
      ...d,
      enabled: true,
      startTime: '08:00',
      endTime: '22:00',
      hasLunchBreak: false,
    }));
    const newSchedule: BotScheduleConfig = {
      ...schedule,
      enabled: true,
      days: newDays,
    };
    persistSchedule(newSchedule);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const applyPreset = (presetType: 'commercial' | 'retail' | 'restaurant' | '247') => {
    let newDays = JSON.parse(JSON.stringify(DEFAULT_DAYS));

    if (presetType === 'commercial') {
      newDays = newDays.map((d: DaySchedule) => {
        if (d.day >= 1 && d.day <= 5) {
          return { ...d, enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false };
        }
        return { ...d, enabled: false };
      });
    } else if (presetType === 'retail') {
      newDays = newDays.map((d: DaySchedule) => {
        if (d.day >= 1 && d.day <= 6) {
          return {
            ...d,
            enabled: true,
            startTime: '09:00',
            endTime: d.day === 6 ? '18:00' : '19:00',
            hasLunchBreak: false,
          };
        }
        return { ...d, enabled: false };
      });
    } else if (presetType === 'restaurant') {
      newDays = newDays.map((d: DaySchedule) => {
        return { ...d, enabled: true, startTime: '18:00', endTime: '23:30', hasLunchBreak: false };
      });
    } else if (presetType === '247') {
      newDays = newDays.map((d: DaySchedule) => ({
        ...d,
        enabled: true,
        startTime: '00:00',
        endTime: '23:59',
        hasLunchBreak: false,
      }));
    }

    const newSchedule: BotScheduleConfig = {
      ...schedule,
      enabled: presetType !== '247',
      days: newDays,
    };
    persistSchedule(newSchedule);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/whatsapp/schedule/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayIndex: simDay,
          timeStr: simTime,
          customSchedule: schedule,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    const updatedDays = schedule.days.map((d) => (d.day === dayIndex ? { ...d, [field]: value } : d));
    const newSchedule: BotScheduleConfig = {
      ...schedule,
      days: updatedDays,
    };
    persistSchedule(newSchedule);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Controle de Expediente & Descanso
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-[#062c20] border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Anti-Perturbação
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Horários de Pausa & Descanso da IA
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
            Defina os dias e horários comerciais da sua empresa. Fora do expediente, o bot
            automaticamente entra em descanso, silenciando ou enviando um aviso humanizado de ausência.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleEmergency}
            disabled={emergencyLoading}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition cursor-pointer border ${
              schedule.emergencyPause
                ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/50'
                : 'bg-[#162137] hover:bg-[#1e2d4d] text-slate-200 border-[#2b3a5a]'
            }`}
          >
            {schedule.emergencyPause ? (
              <>
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Retomar Atendimento</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                <span>Pausa Rápida / Férias</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-[#0a1b24] border border-[#065f46]/50 text-[#34d399] px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-md animate-fadeIn">
          <Check className="w-4 h-4 text-[#10b981]" />
          <span>
            Horários e pausas salvos com sucesso! O bot no WhatsApp já está sincronizado com a nova
            grade de atendimento.
          </span>
        </div>
      )}

      {/* Real-time Status Banner */}
      <div
        className={`rounded-2xl border p-5 shadow-2xl transition-all ${
          schedule.emergencyPause
            ? 'bg-gradient-to-r from-[#200c15] via-[#16080e] to-[#0e1628] border-rose-900/60'
            : liveStatus?.isWithinHours
            ? 'bg-gradient-to-r from-[#061d18] via-[#09221d] to-[#0e1628] border-emerald-800/50'
            : 'bg-gradient-to-r from-[#11162b] via-[#0d1424] to-[#0e1628] border-blue-900/50'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                schedule.emergencyPause
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : liveStatus?.isWithinHours
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              }`}
            >
              {schedule.emergencyPause ? (
                <Pause className="w-6 h-6 animate-pulse text-rose-400" />
              ) : liveStatus?.isWithinHours ? (
                <Sun className="w-6 h-6 text-emerald-400" />
              ) : (
                <Moon className="w-6 h-6 text-indigo-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                    schedule.emergencyPause
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : liveStatus?.isWithinHours
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {schedule.emergencyPause
                    ? 'Pausa Manual Ativada'
                    : liveStatus?.isWithinHours
                    ? '🟢 Atendimento Aberto (No Expediente)'
                    : '🌙 IA em Descanso Comercial'}
                </span>

                <span className="text-[11px] text-[#64748b] hidden sm:inline">
                  • Fuso: Horário de Brasília (UTC-3)
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {schedule.emergencyPause
                  ? 'O Bot está pausado manualmente e não responderá nenhuma mensagem.'
                  : liveStatus?.isWithinHours
                  ? 'A IA está ativa e respondendo mensagens normalmente no WhatsApp.'
                  : schedule.actionOutOfHours === 'silence'
                  ? 'Fora do expediente: Bot em silêncio absoluto (não incomoda clientes).'
                  : 'Fora do expediente: Bot envia aviso amigável de horário e descansa.'}
              </h3>

              <p className="text-xs text-[#94a3b8] mt-0.5">
                {schedule.emergencyPause
                  ? 'Clique em "Retomar Atendimento" para religar o bot a qualquer instante.'
                  : liveStatus?.reason ||
                    'Calculando diagnóstico de expediente conforme relógio ao vivo...'}
              </p>
            </div>
          </div>

          {/* Live Clock Pill */}
          <div className="bg-[#070b14]/80 border border-[#1e293b] rounded-2xl px-5 py-3 flex md:flex-col items-center md:items-end justify-between shrink-0">
            <span className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wider">
              Relógio de Brasília
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-tight">
                {currentTimeStr || '18:00:00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General Rules & Out of Hours Behavior */}
        <div className="lg:col-span-5 space-y-6">
          {/* Master Enable Card */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1a263d]">
              <div>
                <span className="font-bold text-sm text-white block">
                  Controle Automático de Horário Comercial
                </span>
                <span className="text-xs text-[#94a3b8] mt-0.5 block">
                  Se desativado, o bot responderá clientes 24 horas por dia, 7 dias por semana sem
                  nenhuma pausa.
                </span>
                <div className="mt-2">
                  {schedule.enabled ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Horário Comercial Ativo (Conforme grade abaixo)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Atendimento 24/7 Total Liberado (Sem pausas)
                    </span>
                  )}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    persistSchedule({ ...schedule, enabled: isChecked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1a263d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quick 7-Day Actions */}
            <div className="pt-4 border-b border-[#1a263d] pb-4">
              <span className="text-xs font-semibold text-white block mb-2">
                Atalhos Rápidos de 7 Dias:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={activate7DaysAllWeek}
                  className="flex items-center justify-between bg-gradient-to-r from-emerald-950/60 to-[#0e1628] hover:from-emerald-900/60 border border-emerald-500/40 p-3 rounded-xl transition cursor-pointer text-left"
                >
                  <div>
                    <span className="text-xs font-extrabold text-emerald-300 block flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      7 Dias / 24 Horas Direto
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                      Responde 24h sem nenhuma pausa
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={activate7DaysStandard}
                  className="flex items-center justify-between bg-gradient-to-r from-blue-950/60 to-[#0e1628] hover:from-blue-900/60 border border-blue-500/40 p-3 rounded-xl transition cursor-pointer text-left"
                >
                  <div>
                    <span className="text-xs font-extrabold text-blue-300 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      7 Dias (08h às 22h)
                    </span>
                    <span className="text-[10px] text-blue-400/80 block mt-0.5">
                      Seg a Dom com pausa noturna
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-4">
              <span className="text-xs font-semibold text-white block mb-2">
                Outras Predefinições Rápidas:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('commercial')}
                  className="text-left bg-[#0b1220] hover:bg-[#131d33] border border-[#1e293b] hover:border-blue-500/50 p-2.5 rounded-xl transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-white block">🏢 Escritório / B2B</span>
                  <span className="text-[10px] text-[#94a3b8] block">Seg-Sex: 08h às 18h</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('retail')}
                  className="text-left bg-[#0b1220] hover:bg-[#131d33] border border-[#1e293b] hover:border-blue-500/50 p-2.5 rounded-xl transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-white block">🛍️ Loja & Varejo</span>
                  <span className="text-[10px] text-[#94a3b8] block">Seg-Sáb: 09h às 19h</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('restaurant')}
                  className="text-left bg-[#0b1220] hover:bg-[#131d33] border border-[#1e293b] hover:border-blue-500/50 p-2.5 rounded-xl transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-white block">🍕 Delivery & Bar</span>
                  <span className="text-[10px] text-[#94a3b8] block">Todos os dias: 18h às 23h30</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('247')}
                  className="text-left bg-[#0b1220] hover:bg-[#131d33] border border-[#1e293b] hover:border-blue-500/50 p-2.5 rounded-xl transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-white block">🌐 24 Horas / 7 Dias</span>
                  <span className="text-[10px] text-[#94a3b8] block">Sem descanso</span>
                </button>
              </div>
            </div>
          </div>

          {/* Out of hours behavior */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#1a263d]">
              <Moon className="w-4 h-4 text-indigo-400" />
              Comportamento Fora do Expediente
            </h3>

            {/* Radio Mode Selection */}
            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  schedule.actionOutOfHours === 'auto_reply'
                    ? 'bg-blue-600/10 border-blue-500/50'
                    : 'bg-[#0b1220] border-[#1e293b]'
                }`}
              >
                <input
                  type="radio"
                  name="actionOutOfHours"
                  checked={schedule.actionOutOfHours === 'auto_reply'}
                  onChange={() => setSchedule({ ...schedule, actionOutOfHours: 'auto_reply' })}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      Mensagem Humanizada de Ausência (Recomendado)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-semibold">
                      Ideal
                    </span>
                  </div>
                  <span className="text-[11px] text-[#94a3b8] block mt-0.5">
                    O bot envia uma mensagem carinhosa explicando o horário comercial e garantindo
                    prioridade no retorno.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  schedule.actionOutOfHours === 'silence'
                    ? 'bg-blue-600/10 border-blue-500/50'
                    : 'bg-[#0b1220] border-[#1e293b]'
                }`}
              >
                <input
                  type="radio"
                  name="actionOutOfHours"
                  checked={schedule.actionOutOfHours === 'silence'}
                  onChange={() => setSchedule({ ...schedule, actionOutOfHours: 'silence' })}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    Silêncio Total (Não Responder Nada)
                  </span>
                  <span className="text-[11px] text-[#94a3b8] block mt-0.5">
                    O bot fica 100% mudo fora do horário de atendimento. As mensagens são apenas
                    guardadas no seu Pipeline/Inbox.
                  </span>
                </div>
              </label>
            </div>

            {/* Custom Message input if auto_reply */}
            {schedule.actionOutOfHours === 'auto_reply' && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-white">
                  Mensagem Automática de Fora de Expediente:
                </label>
                <textarea
                  rows={4}
                  value={schedule.outOfHoursMessage}
                  onChange={(e) => setSchedule({ ...schedule, outOfHoursMessage: e.target.value })}
                  placeholder="Digite a mensagem amigável que o cliente receberá fora do expediente..."
                  className="w-full bg-[#0b1220] border border-[#1e293b] rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed placeholder-[#64748b]"
                />
                <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>Dica: Use emojis e negrito (*texto*) para soar acolhedor.</span>
                  <span>{schedule.outOfHoursMessage?.length || 0} caracteres</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#1a263d]">
                  <input
                    type="checkbox"
                    id="notifyOnce"
                    checked={schedule.notifyOncePerContact}
                    onChange={(e) =>
                      setSchedule({ ...schedule, notifyOncePerContact: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="notifyOnce" className="text-xs text-slate-300 cursor-pointer">
                    Enviar aviso de ausência <strong>apenas 1 vez por contato</strong> (evita enviar
                    mensagens repetidas caso o cliente mande vários textos de madrugada).
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Schedule Grid & Sandbox Simulator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Weekly Days Editor */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a263d] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Grade Semanal de Expediente & Pausas (7 Dias)
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Marque os dias em que a IA deve atender clientes. Desmarque apenas se quiser que a IA pause o atendimento.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const updated = schedule.days.map((d) => ({ ...d, enabled: true }));
                    persistSchedule({ ...schedule, days: updated });
                  }}
                  className="bg-[#101b33] hover:bg-[#16274e] border border-blue-500/40 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ativar Todos os 7 Dias</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {schedule.days.map((day) => (
                <div
                  key={day.day}
                  className={`p-3.5 rounded-xl border transition ${
                    day.enabled
                      ? 'bg-[#0b1220] border-[#1e293b]'
                      : 'bg-[#080d17]/60 border-[#141d2e] opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Day name and toggle */}
                    <div className="flex items-center gap-3 w-40">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => updateDay(day.day, 'enabled', e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            day.enabled ? 'text-white' : 'text-[#64748b]'
                          }`}
                        >
                          {day.name}
                        </span>
                        <span className="text-[10px] text-[#64748b]">
                          {day.enabled ? 'Em atendimento' : 'Descanso total'}
                        </span>
                      </div>
                    </div>

                    {/* Time fields */}
                    {day.enabled ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1 justify-start sm:justify-end">
                        <div className="flex items-center gap-1.5 bg-[#070b14] border border-[#1a263d] rounded-lg px-2.5 py-1 text-xs">
                          <span className="text-[10px] text-[#64748b]">Das</span>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => updateDay(day.day, 'startTime', e.target.value)}
                            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                          />
                          <span className="text-[10px] text-[#64748b]">às</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => updateDay(day.day, 'endTime', e.target.value)}
                            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                          />
                        </div>

                        {/* Lunch break toggle & inputs */}
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-[#070b14] border border-[#1a263d] rounded-lg px-2.5 py-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={day.hasLunchBreak || false}
                              onChange={(e) =>
                                updateDay(day.day, 'hasLunchBreak', e.target.checked)
                              }
                              className="accent-blue-600 rounded"
                            />
                            <Coffee className="w-3 h-3 text-amber-400" />
                            <span>Almoço</span>
                          </label>

                          {day.hasLunchBreak && (
                            <div className="flex items-center gap-1 bg-[#141124] border border-[#4c1d95]/40 rounded-lg px-2 py-1 text-xs">
                              <input
                                type="time"
                                value={day.lunchStart || '12:00'}
                                onChange={(e) => updateDay(day.day, 'lunchStart', e.target.value)}
                                className="bg-transparent text-indigo-300 font-mono text-xs focus:outline-none"
                              />
                              <span className="text-[10px] text-[#64748b]">-</span>
                              <input
                                type="time"
                                value={day.lunchEnd || '13:00'}
                                onChange={(e) => updateDay(day.day, 'lunchEnd', e.target.value)}
                                className="bg-transparent text-indigo-300 font-mono text-xs focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748b] italic flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-[#64748b]" /> Fechado para atendimento o dia
                        todo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulator & Sandbox */}
          <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[#1a263d]">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Simulador de Comportamento de Expediente
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Teste o que a IA fará caso um cliente envie mensagem em um dia ou horário específico.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Dia da Semana:</label>
                <select
                  value={simDay}
                  onChange={(e) => setSimDay(Number(e.target.value))}
                  className="w-full bg-[#0b1220] border border-[#1e293b] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={0}>Domingo</option>
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira</option>
                  <option value={5}>Sexta-feira</option>
                  <option value={6}>Sábado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Horário:</label>
                <input
                  type="time"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  className="w-full bg-[#0b1220] border border-[#1e293b] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="w-full bg-[#162137] hover:bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl border border-[#26375c] hover:border-blue-500 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  {simulating ? 'Simulando...' : 'Testar Resposta'}
                </button>
              </div>
            </div>

            {simResult && (
              <div className="mt-4 p-4 rounded-xl border bg-[#0b1220] border-[#1e293b] space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        simResult.status.isWithinHours
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {simResult.status.badge}
                    </span>
                    <span className="text-xs text-white font-semibold">
                      {simResult.simulatedDay} às {simResult.simulatedTime}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#94a3b8]">{simResult.status.reason}</span>
                </div>

                <div className="bg-[#070b14] border border-[#1a263d] rounded-xl p-3 text-xs">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold block mb-1">
                    Mensagem que o cliente verá no WhatsApp:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans italic">
                    "{simResult.sampleReply}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time System Logs Banner */}
      <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Quer verificar se o bot está respeitando os horários?
            </h4>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              Acesse a seção <strong>Logs do Sistema</strong> nas configurações para acompanhar em
              tempo real todas as pausas, áudios processados e respostas disparadas pela IA.
            </p>
          </div>
        </div>

        {onGoToLogs && (
          <button
            type="button"
            onClick={onGoToLogs}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/30 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Abrir Logs do Sistema →
          </button>
        )}
      </div>
    </div>
  );
};
