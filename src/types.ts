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

