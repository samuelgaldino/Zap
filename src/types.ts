export type BotTone = 'friendly' | 'formal' | 'sales' | 'concise';

export interface DaySchedule {
  day: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  name: string; // 'Segunda-feira', etc.
  enabled: boolean;
  startTime: string; // '08:00'
  endTime: string; // '18:00'
  hasLunchBreak?: boolean;
  lunchStart?: string; // '12:00'
  lunchEnd?: string; // '13:00'
}

export interface BotScheduleConfig {
  enabled: boolean;
  timezone: string;
  actionOutOfHours: 'silence' | 'auto_reply';
  outOfHoursMessage: string;
  notifyOncePerContact: boolean;
  emergencyPause: boolean;
  emergencyPauseReason?: string;
  days: DaySchedule[];
}

export interface BotConfig {
  businessName: string;
  niche: string;
  personaName: string;
  tone: BotTone;
  greeting: string;
  quickReplies: string[];
  knowledgeBase: string;
  humanTransferKeywords: string[];
  customInstructions: string;
  schedule?: BotScheduleConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  handoffTriggered?: boolean;
  handoffReason?: string;
}

export interface BusinessPreset {
  id: string;
  title: string;
  icon: string;
  niche: string;
  config: BotConfig;
}

export type SystemLogActionType =
  | 'audio_processed'
  | 'reaction_sent'
  | 'reply_sent'
  | 'schedule_pause'
  | 'handoff'
  | 'broadcast'
  | 'connection'
  | 'system';

export interface SystemLogEntry {
  id: string;
  timestamp: string; // e.g. "15:24:02"
  fullDate?: string;
  type: SystemLogActionType;
  action: string; // 'Áudio processado', 'Emoji reagido', 'Resposta enviada'
  details: string;
  contact?: string;
  status: 'success' | 'warning' | 'info' | 'error';
  metadata?: {
    reactionEmoji?: string;
    charCount?: number;
    durationMs?: number;
    reason?: string;
    [key: string]: any;
  };
}

export type SentimentType = 'Satisfeito' | 'Neutro' | 'Insatisfeito';

export interface SentimentAnalysis {
  sentiment: SentimentType;
  score: number; // 0-100
  reason: string;
  isAlert: boolean; // true if 'Insatisfeito'
  urgency: 'baixa' | 'media' | 'alta';
  recommendedAction: string;
  analyzedAt: string;
}

export interface SentimentOverview {
  total: number;
  satisfiedCount: number;
  neutralCount: number;
  dissatisfiedCount: number;
  satisfactionRate: number;
  alertCount: number;
}

// ==========================================
// FOLLOW-UP CADENCE SYSTEM TYPES
// ==========================================
export type FollowUpStyle =
  | 'casual_amigavel'
  | 'urgencia_fechamento'
  | 'prova_social'
  | 'pergunta_direta'
  | 'conteudo_valor'
  | 'custom';

export interface FollowUpStep {
  id: string;
  name: string; // e.g. "D+1 - Checagem Inicial"
  daysAfter: number; // dias após o último contato
  time: string; // "10:00"
  messageStyle: FollowUpStyle;
  template: string;
  enabled: boolean;
}

export interface FollowUpContact {
  id: string;
  name: string;
  phone: string;
  jid: string;
  currentStepIndex: number; // 0 = D+1, 1 = D+3, etc.
  status: 'active' | 'paused' | 'responded' | 'completed' | 'cancelled';
  enteredAt: string;
  lastMessageSentAt?: string;
  nextScheduledAt?: string;
  notes?: string;
}

export interface FollowUpCadenceConfig {
  enabled: boolean;
  cadenceName: string;
  autoTriggerWhenNoReply: boolean;
  stopOnCustomerReply: boolean;
  steps: FollowUpStep[];
}

// ==========================================
// PRE-CALL REMINDERS & GROUPS SYSTEM TYPES
// ==========================================
export interface PreCallStage {
  id: string;
  label: string; // e.g. "24h antes", "2h antes", "15 min antes"
  hoursBefore: number; // 24, 2, 0.25 (15 min)
  template: string;
  enabled: boolean;
}

export interface PreCallMeeting {
  id: string;
  title: string;
  leadName: string;
  targetType: 'contact' | 'group';
  targetJid: string; // individual JID or WhatsApp group JID
  targetName: string; // Contact name or WhatsApp Group Name
  targetGroupLink?: string; // Group invite link or name
  meetingDateTime: string; // "YYYY-MM-DDTHH:mm"
  meetingLink: string; // Google Meet / Zoom link
  stagesSent: Record<string, boolean>; // e.g. { "24h": true, "2h": false, "15m": false }
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface PreCallConfig {
  enabled: boolean;
  defaultMeetLink: string;
  stages: PreCallStage[];
}

// ==========================================
// ADVANCED AGENT CONFIGURATION TYPES
// ==========================================
export interface AgentBehaviorSettings {
  simulatedTypingDelay: number; // 1 to 15 seconds
  humanizationLevel: 'ultra' | 'moderate' | 'formal';
  maxCharactersPerMessage: number; // 150 to 800
  splitLongMessages: boolean; // divide em balões menores
  enableAudioListening: boolean;
  enableContextReactions: boolean;
  humanizedEmojis: boolean;
  autoReplyOnlyPrivate: boolean;
  ignoreGroupMessages: boolean;
}

// ==========================================
// ANALYTICS & CONVERSION TYPES
// ==========================================
export interface AnalyticsSummary {
  activeContacts: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  responseRate: number;
  avgResponseTime: string;
  scheduledPreCalls: number;
  closedDeals: number;
  conversionRate: string;
  autonomousPercentage: string;
}

export interface AnalyticsTimeSeriesPoint {
  label: string;
  enviadas: number;
  recebidas: number;
  contatosAtivos: number;
  taxaResposta: number;
}

export interface FunnelStep {
  name: string;
  value: number;
  rate: string;
  color: string;
}

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface PeakHourItem {
  time: string;
  volume: number;
  taxa: number;
  status: string;
}

export interface AnalyticsData {
  success: boolean;
  period: '24h' | '7d' | '30d';
  summary: AnalyticsSummary;
  timeSeries: AnalyticsTimeSeriesPoint[];
  conversionFunnel: FunnelStep[];
  sentimentDistribution: DistributionItem[];
  messageTypes: DistributionItem[];
  peakHours: PeakHourItem[];
}


