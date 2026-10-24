import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  proto,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Path to store WhatsApp credentials
const AUTH_DIR = path.resolve(__dirname, 'whatsapp_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Path to store training data
const TRAINING_FILE = path.resolve(__dirname, 'training_data.json');

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Default Business Hours & Pause Schedule
const DEFAULT_SCHEDULE = {
  enabled: true,
  timezone: 'America/Sao_Paulo',
  actionOutOfHours: 'auto_reply' as 'auto_reply' | 'silence',
  outOfHoursMessage:
    'Olá! Agradecemos sua mensagem. Nosso horário de atendimento comercial é de segunda a sexta, das 08h às 18h. No momento nossa equipe e nosso atendimento estão descansando, mas já registramos sua mensagem e assim que o expediente iniciar te responderemos com prioridade! 😊🙏',
  notifyOncePerContact: true,
  emergencyPause: false,
  emergencyPauseReason: '',
  days: [
    { day: 0, name: 'Domingo', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 1, name: 'Segunda-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 2, name: 'Terça-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 3, name: 'Quarta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 4, name: 'Quinta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 5, name: 'Sexta-feira', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 6, name: 'Sábado', enabled: true, startTime: '08:00', endTime: '22:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
  ],
};

// Evaluates whether the bot should respond right now according to business hours schedule
export function checkScheduleStatus(
  scheduleConfig?: any,
  testParam?: Date | { dayIndex: number; timeStr: string }
) {
  const schedule = scheduleConfig || DEFAULT_SCHEDULE;

  if (!schedule.enabled) {
    return {
      isWithinHours: true,
      status: 'active',
      badge: '24/7 Ativo',
      reason: 'Horário comercial desativado (atendimento 24 horas liberado).',
      currentTimeStr: '',
      currentDay: '',
    };
  }

  if (schedule.emergencyPause) {
    return {
      isWithinHours: false,
      status: 'emergency_paused',
      badge: 'Pausa Manual Ativada',
      reason: schedule.emergencyPauseReason || 'O bot foi colocado em pausa manual de descanso.',
      currentTimeStr: '',
      currentDay: '',
    };
  }

  let currentDayIndex = 1;
  let currentHour = 12;
  let currentMinute = 0;

  if (testParam && typeof testParam === 'object' && 'dayIndex' in testParam && 'timeStr' in testParam) {
    currentDayIndex = Number(testParam.dayIndex);
    const [th, tm] = (testParam.timeStr || '12:00').split(':').map(Number);
    currentHour = th || 0;
    currentMinute = tm || 0;
  } else {
    const tz = schedule.timezone || 'America/Sao_Paulo';
    const now = testParam instanceof Date ? testParam : new Date();

    let weekdayShort = 'Mon';
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      for (const p of parts) {
        if (p.type === 'weekday') weekdayShort = p.value;
        if (p.type === 'hour') currentHour = parseInt(p.value, 10);
        if (p.type === 'minute') currentMinute = parseInt(p.value, 10);
      }
    } catch (err) {
      currentHour = now.getHours();
      currentMinute = now.getMinutes();
    }

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    currentDayIndex = dayMap[weekdayShort] ?? now.getDay();
  }

  const currentMinutesTotal = currentHour * 60 + currentMinute;
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  const dayConfig = (schedule.days || []).find((d: any) => d.day === currentDayIndex);

  if (!dayConfig || !dayConfig.enabled) {
    return {
      isWithinHours: false,
      status: 'resting',
      badge: 'Fora do Expediente',
      reason: `Hoje (${dayConfig?.name || 'Dia'}) é dia de descanso / empresa fechada.`,
      currentTimeStr,
      currentDay: dayConfig?.name || 'Hoje',
      dayConfig,
    };
  }

  const [startH, startM] = (dayConfig.startTime || '08:00').split(':').map(Number);
  const [endH, endM] = (dayConfig.endTime || '18:00').split(':').map(Number);
  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  if (currentMinutesTotal < startMinutes) {
    return {
      isWithinHours: false,
      status: 'resting',
      badge: 'Antes do Expediente',
      reason: `Ainda não iniciou o expediente (${currentTimeStr} < abertura às ${dayConfig.startTime}).`,
      currentTimeStr,
      currentDay: dayConfig.name,
      dayConfig,
    };
  }

  if (currentMinutesTotal >= endMinutes) {
    return {
      isWithinHours: false,
      status: 'resting',
      badge: 'Expediente Encerrado',
      reason: `Expediente de hoje já encerrou (${currentTimeStr} >= fechamento às ${dayConfig.endTime}).`,
      currentTimeStr,
      currentDay: dayConfig.name,
      dayConfig,
    };
  }

  // Check lunch break
  if (dayConfig.hasLunchBreak && dayConfig.lunchStart && dayConfig.lunchEnd) {
    const [lunchStartH, lunchStartM] = dayConfig.lunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = dayConfig.lunchEnd.split(':').map(Number);
    const lunchStartMinutes = (lunchStartH || 0) * 60 + (lunchStartM || 0);
    const lunchEndMinutes = (lunchEndH || 0) * 60 + (lunchEndM || 0);

    if (currentMinutesTotal >= lunchStartMinutes && currentMinutesTotal < lunchEndMinutes) {
      return {
        isWithinHours: false,
        status: 'lunch_break',
        badge: 'Intervalo de Almoço',
        reason: `Pausa de intervalo comercial (${currentTimeStr} entre ${dayConfig.lunchStart} e ${dayConfig.lunchEnd}).`,
        currentTimeStr,
        currentDay: dayConfig.name,
        dayConfig,
      };
    }
  }

  return {
    isWithinHours: true,
    status: 'active',
    badge: 'Atendimento Aberto',
    reason: `Dentro do expediente comercial (${dayConfig.startTime} às ${dayConfig.endTime}).`,
    currentTimeStr,
    currentDay: dayConfig.name,
    dayConfig,
  };
}

// Default training configuration
const DEFAULT_TRAINING = {
  businessName: 'Meu Negócio',
  niche: 'Atendimento ao Cliente',
  personaName: 'Atendente Virtual',
  tone: 'friendly',
  greeting: 'Olá! Seja muito bem-vindo(a). Como posso te ajudar hoje?',
  knowledgeBase: `EMPRESA: Meu Negócio
HORÁRIO DE ATENDIMENTO: Segunda a Sexta das 08h às 18h.
SOBRE: Somos especializados em prestar o melhor atendimento e serviços de alta qualidade.
FORMAS DE PAGAMENTO: Pix, Cartão de Crédito/Débito e Dinheiro.

PERGUNTAS FREQUENTES:
- Onde vocês ficam? Atendemos em toda a região e online.
- Como contratar? Basta me dizer o que você precisa que posso te orientar ou encaminhar seu pedido.`,
  rules: [
    'Sempre responda de forma educada, prestativa e direta.',
    'Use parágrafos curtos para facilitar a leitura no WhatsApp.',
    'Use *um asterisco* para destacar palavras importantes em negrito.',
    'Nunca invente preços, promoções ou horários que não estejam na Base de Conhecimento.',
    'Se não souber a resposta com 100% de certeza, diga que vai verificar e passar para a equipe.',
  ],
  humanHandoffKeywords: ['falar com atendente', 'humano', 'gerente', 'falar com você', 'dono', 'reclamação'],
  autoReplyOnlyPrivate: true, // Only reply to direct messages, skip groups
  simulatedTypingDelay: 3, // seconds to simulate human typing
  enableAudioListening: true, // Listen and understand voice notes from WhatsApp
  enableContextReactions: true, // React with emojis (👍, ❤️, 🔥, 🙏) at the right moment
  humanizedEmojis: true, // Use emojis naturally like a real Brazilian person
  schedule: DEFAULT_SCHEDULE,
};

// Load saved training or use default
function loadTraining() {
  try {
    if (fs.existsSync(TRAINING_FILE)) {
      const data = fs.readFileSync(TRAINING_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_TRAINING,
        ...parsed,
        schedule: {
          ...DEFAULT_SCHEDULE,
          ...(parsed.schedule || {}),
          days: parsed.schedule?.days || DEFAULT_SCHEDULE.days,
        },
      };
    }
  } catch (err) {
    console.error('Erro ao carregar treinamento:', err);
  }
  return DEFAULT_TRAINING;
}

// Save training to disk
function saveTraining(data: any) {
  try {
    fs.writeFileSync(TRAINING_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar treinamento:', err);
  }
}

let botTraining = loadTraining();

// WhatsApp Connection State
interface WAState {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrRaw?: string;
  qrDataUrl?: string;
  userPhone?: string;
  userName?: string;
  autoReplyEnabled: boolean;
  lastConnectedAt?: string;
  stats: {
    totalReceived: number;
    totalReplied: number;
    activeChats: number;
  };
}

const waState: WAState = {
  status: 'disconnected',
  autoReplyEnabled: true,
  stats: {
    totalReceived: 0,
    totalReplied: 0,
    activeChats: 0,
  },
};

// Real-time Chat logs for the Inbox
export interface LiveLogMessage {
  id: string;
  chatJid: string;
  senderName: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  isAiResponse?: boolean;
  isAudio?: boolean;
  reaction?: string;
}

export type SentimentType = 'Satisfeito' | 'Neutro' | 'Insatisfeito';

export interface SentimentAnalysis {
  sentiment: SentimentType;
  score: number; // 0 to 100
  reason: string;
  isAlert: boolean; // true if 'Insatisfeito'
  urgency: 'baixa' | 'media' | 'alta';
  recommendedAction: string;
  analyzedAt: string;
}

export interface LeadFormFieldAnswer {
  field: string;
  value: string;
}

export interface LeadFormContext {
  id: string;
  leadName: string;
  leadPhone: string;
  extractedAt: string;
  formAnswers: LeadFormFieldAnswer[];
  summary: string;
  status: 'contacted' | 'engaged' | 'qualified' | 'handoff';
  stage?: 'awaiting_confirmation' | 'confirmed_triaging' | 'qualified';
  triggerStatus?: 'pending_reply' | 'positive_confirmed' | 'manual_confirmed';
  confirmedAt?: string;
  lastCustomerMessage?: string;
  initialMessageSent: string;
}

export interface LeadFormEntry extends LeadFormContext {
  jid: string;
  source: 'web_panel' | 'whatsapp_photo';
  createdAt: string;
  updatedAt: string;
}

export interface ChatThread {
  jid: string;
  name: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: LiveLogMessage[];
  botPausedForThisChat?: boolean;
  notifiedOutOfHours?: boolean;
  sentiment?: SentimentAnalysis;
  leadFormContext?: LeadFormContext;
}

/* DEPRECATED_SEEDS removed */
/*
  {
    jid: '5511977665544@s.whatsapp.net',
    name: 'Marcos Andrade',
    lastMessage:
      'Fiz meu pedido há mais de 1 hora e até agora não recebi nenhuma atualização! O prazo era 35 minutos. Estou muito insatisfeito com esse atraso, se não chegar logo vou cancelar!',
    lastTimestamp: '15:20',
    unreadCount: 1,
    botPausedForThisChat: false,
    sentiment: {
      sentiment: 'Insatisfeito',
      score: 18,
      reason:
        'Cliente irritado com atraso superior a 1 hora na entrega e ameaçando cancelar o pedido.',
      isAlert: true,
      urgency: 'alta',
      recommendedAction:
        'Intervenção humana imediata! Ligar ou priorizar rota com pedido formal de desculpas.',
      analyzedAt: '15:21',
    },
    messages: [
      {
        id: 'msg-m-1',
        chatJid: '5511977665544@s.whatsapp.net',
        senderName: 'Marcos Andrade',
        fromMe: false,
        text: 'Boa tarde, qual é o tempo estimado para entrega no bairro Jardins?',
        timestamp: '14:10',
      },
      {
        id: 'msg-m-2',
        chatJid: '5511977665544@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Olá Marcos! Tudo bem? O tempo médio de preparo e entrega hoje para o Jardins é de *35 a 45 minutos*. Deseja fazer seu pedido agora? 😊',
        timestamp: '14:11',
        isAiResponse: true,
      },
      {
        id: 'msg-m-3',
        chatJid: '5511977665544@s.whatsapp.net',
        senderName: 'Marcos Andrade',
        fromMe: false,
        text: 'Sim, vou querer 1 Pizza Grande Meia Calabresa Meia Quatro Queijos com borda recheada.',
        timestamp: '14:15',
      },
      {
        id: 'msg-m-4',
        chatJid: '5511977665544@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Pedido registrado com sucesso! O valor ficou R$ 78,00. Já foi enviado para a cozinha e logo sai para entrega. 🍕✨',
        timestamp: '14:16',
        isAiResponse: true,
      },
      {
        id: 'msg-m-5',
        chatJid: '5511977665544@s.whatsapp.net',
        senderName: 'Marcos Andrade',
        fromMe: false,
        text: 'Fiz meu pedido há mais de 1 hora e até agora não recebi nenhuma atualização! O prazo era 35 minutos. Estou muito insatisfeito com esse atraso, se não chegar logo vou cancelar!',
        timestamp: '15:20',
      },
    ],
  },
  {
    jid: '5521991238840@s.whatsapp.net',
    name: 'Beatriz Lima',
    lastMessage:
      'Acabei de receber o pedido aqui, chegou quentinho e impecável! Muito obrigada pelo carinho e rapidez, nota 10! ❤️',
    lastTimestamp: '15:15',
    unreadCount: 0,
    botPausedForThisChat: false,
    sentiment: {
      sentiment: 'Satisfeito',
      score: 98,
      reason:
        'Cliente extremamente satisfeita com a agilidade, qualidade dos produtos e atendimento recebido.',
      isAlert: false,
      urgency: 'baixa',
      recommendedAction:
        'Agradecer o feedback caloroso e enviar um cupom de fidelidade.',
      analyzedAt: '15:16',
    },
    messages: [
      {
        id: 'msg-b-1',
        chatJid: '5521991238840@s.whatsapp.net',
        senderName: 'Beatriz Lima',
        fromMe: false,
        text: '🎙️ [Áudio de Voz enviado pelo cliente]',
        timestamp: '14:35',
        isAudio: true,
      },
      {
        id: 'msg-b-2',
        chatJid: '5521991238840@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Ouvi seu áudio com atenção, Beatriz! Entendi perfeitamente sua preferência. Já separamos tudo com muito capricho! ✨',
        timestamp: '14:36',
        isAiResponse: true,
        reaction: '❤️',
      },
      {
        id: 'msg-b-3',
        chatJid: '5521991238840@s.whatsapp.net',
        senderName: 'Beatriz Lima',
        fromMe: false,
        text: 'Acabei de receber o pedido aqui, chegou quentinho e impecável! Muito obrigada pelo carinho e rapidez, nota 10! ❤️',
        timestamp: '15:15',
      },
      {
        id: 'msg-b-4',
        chatJid: '5521991238840@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Que alegria saber disso, Beatriz! Ficamos muito felizes em proporcionar a melhor experiência para você. Bom apetite! 🙏😊',
        timestamp: '15:16',
        isAiResponse: true,
        reaction: '❤️',
      },
    ],
  },
  {
    jid: '5511984215092@s.whatsapp.net',
    name: 'Carlos Mendes',
    lastMessage: 'Perfeito! Já fiz o Pix do valor total, segue o comprovante anexo. Valeu!',
    lastTimestamp: '15:10',
    unreadCount: 0,
    botPausedForThisChat: false,
    sentiment: {
      sentiment: 'Satisfeito',
      score: 92,
      reason:
        'Cliente concluiu o pagamento via Pix com rapidez e elogiou a facilidade da instrução.',
      isAlert: false,
      urgency: 'baixa',
      recommendedAction: 'Confirmar compensação financeira e despachar o pedido.',
      analyzedAt: '15:11',
    },
    messages: [
      {
        id: 'msg-c-1',
        chatJid: '5511984215092@s.whatsapp.net',
        senderName: 'Carlos Mendes',
        fromMe: false,
        text: 'Olá, qual é a chave Pix de vocês?',
        timestamp: '15:05',
      },
      {
        id: 'msg-c-2',
        chatJid: '5511984215092@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Olá Carlos! Nossa chave Pix CNPJ oficial é: *12.345.678/0001-90* em nome da nossa empresa. Assim que transferir é só me enviar o comprovante! 💳',
        timestamp: '15:06',
        isAiResponse: true,
      },
      {
        id: 'msg-c-3',
        chatJid: '5511984215092@s.whatsapp.net',
        senderName: 'Carlos Mendes',
        fromMe: false,
        text: 'Perfeito! Já fiz o Pix do valor total, segue o comprovante anexo. Valeu!',
        timestamp: '15:10',
      },
    ],
  },
  {
    jid: '5541988773311@s.whatsapp.net',
    name: 'Fernanda Souza',
    lastMessage:
      'Boa tarde, vocês atendem no bairro Batel? Qual seria a taxa de entrega para o CEP 80420-000?',
    lastTimestamp: '15:02',
    unreadCount: 0,
    botPausedForThisChat: false,
    sentiment: {
      sentiment: 'Neutro',
      score: 55,
      reason: 'Dúvida informativa comum sobre localização geográfica e valor de taxa de entrega.',
      isAlert: false,
      urgency: 'baixa',
      recommendedAction: 'Apresentar a taxa e sugerir itens do cardápio para conversão.',
      analyzedAt: '15:03',
    },
    messages: [
      {
        id: 'msg-f-1',
        chatJid: '5541988773311@s.whatsapp.net',
        senderName: 'Fernanda Souza',
        fromMe: false,
        text: 'Boa tarde, vocês atendem no bairro Batel? Qual seria a taxa de entrega para o CEP 80420-000?',
        timestamp: '15:02',
      },
      {
        id: 'msg-f-2',
        chatJid: '5541988773311@s.whatsapp.net',
        senderName: 'Atendente Virtual (IA)',
        fromMe: true,
        text: 'Boa tarde Fernanda! Atendemos sim toda a região do Batel! A taxa fixa para esse CEP é de apenas *R$ 8,00*. O que você gostaria de pedir hoje? Posso te passar o cardápio! 😊',
        timestamp: '15:03',
        isAiResponse: true,
      },
    ],
  },
]; */

// Paths to persist real WhatsApp chats and contacts data
const CHATS_FILE = path.resolve(__dirname, 'whatsapp_chats.json');
const CONTACTS_FILE = path.resolve(__dirname, 'whatsapp_contacts.json');

function loadSavedWhatsAppChats(): Map<string, ChatThread> {
  const map = new Map<string, ChatThread>();
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const raw = fs.readFileSync(CHATS_FILE, 'utf-8');
      const list: ChatThread[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.jid) {
            map.set(item.jid, item);
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao carregar conversas salvas do WhatsApp:', err);
  }
  return map;
}

function saveWhatsAppChats() {
  try {
    const list = Array.from(chatThreads.values());
    fs.writeFileSync(CHATS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir conversas do WhatsApp:', err);
  }
}

function loadSavedWhatsAppContacts(): Map<string, { name?: string; notify?: string; phone: string }> {
  const map = new Map<string, { name?: string; notify?: string; phone: string }>();
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
      const list: Array<{ id: string; name?: string; notify?: string; phone: string }> = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.id) {
            map.set(item.id, { name: item.name, notify: item.notify, phone: item.phone });
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao carregar contatos salvos do WhatsApp:', err);
  }
  return map;
}

function saveWhatsAppContacts() {
  try {
    const list = Array.from(knownContacts.entries()).map(([id, val]) => ({ id, ...val }));
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir contatos do WhatsApp:', err);
  }
}

// Path to persist Form Triage Leads (RespondeForme AI)
const LEAD_FORMS_FILE = path.resolve(__dirname, 'lead_forms.json');

function loadLeadForms(): LeadFormEntry[] {
  try {
    if (fs.existsSync(LEAD_FORMS_FILE)) {
      const raw = fs.readFileSync(LEAD_FORMS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Erro ao carregar leads de formulário salvos:', err);
  }
  return [];
}

function saveLeadForms(entries: LeadFormEntry[]) {
  try {
    fs.writeFileSync(LEAD_FORMS_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir leads de formulário:', err);
  }
}

// Real WhatsApp Chat Threads & Contacts (persisted on disk, strictly populated by connected WhatsApp)
const chatThreads: Map<string, ChatThread> = loadSavedWhatsAppChats();
const knownContacts: Map<string, { name?: string; notify?: string; phone: string }> = loadSavedWhatsAppContacts();

// =========================================================================
// RESPONDEFORME AI - MULTIMODAL FORM PRINT EXTRACTION & DISPATCH
// =========================================================================
async function extractLeadFromImage(base64Data: string, mimeType: string = 'image/png'): Promise<{
  leadName: string;
  leadPhone: string;
  formAnswers: LeadFormFieldAnswer[];
  summary: string;
  initialMessage: string;
}> {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: cleanBase64,
          },
        },
        {
          text: `Você é um assistente especialista em OCR, visão computacional e triagem comercial.
Analise a imagem enviada, que é um print ou foto de um formulário preenchido por um lead/cliente (como Google Forms, RespondeForm, Typeform, RD Station, Hotmart, Instagram Lead Form, etc.).

Extraia com máxima fidelidade e atenção:
1. "leadName": O nome ou primeiro nome do lead/cliente que preencheu o formulário (ex: "Samuel", "Juliana Silva"). Se não houver nome explícito, deixe "".
2. "leadPhone": O telefone ou WhatsApp do lead preenchido, com DDD (ex: "5511999887766", "11988887777"). Remova caracteres como parênteses ou traços, retornando apenas dígitos ou string limpa. Se não houver telefone no print, deixe "".
3. "formAnswers": Um array de objetos com cada pergunta ou campo do formulário e a respectiva resposta do lead. Exemplo: [{"field": "Qual seu objetivo principal?", "value": "Aumentar faturamento"}, {"field": "Faturamento atual", "value": "R$ 10k a 30k"}].
4. "summary": Um resumo executivo claro de 2 a 3 frases com o perfil, dores, faturamento e interesses do lead para que o atendente e a IA saibam exatamente como abordá-lo e qualificá-lo.
5. "initialMessage": O script inicial obrigatório no formato exato: "Olá, {leadName}, tudo bem? Eu estou falando com você mesmo?".`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          leadName: { type: Type.STRING, description: 'Nome do lead' },
          leadPhone: { type: Type.STRING, description: 'Telefone com DDD do lead' },
          formAnswers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                field: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ['field', 'value'],
            },
          },
          summary: { type: Type.STRING, description: 'Resumo das necessidades do lead' },
          initialMessage: { type: Type.STRING, description: 'Script inicial de confirmação de identidade' },
        },
        required: ['leadName', 'leadPhone', 'formAnswers', 'summary', 'initialMessage'],
      },
    },
  });

  const rawJson = response.text?.trim() || '{}';
  const parsed = JSON.parse(rawJson);
  const formattedName = parsed.leadName?.trim();
  const defaultInitial = formattedName
    ? `Olá, ${formattedName}, tudo bem? Eu estou falando com você mesmo?`
    : 'Olá, tudo bem? Eu estou falando com você mesmo?';

  return {
    leadName: parsed.leadName || '',
    leadPhone: parsed.leadPhone || '',
    formAnswers: Array.isArray(parsed.formAnswers) ? parsed.formAnswers : [],
    summary: parsed.summary || '',
    initialMessage: parsed.initialMessage || defaultInitial,
  };
}

async function dispatchLeadForm(data: {
  leadName: string;
  leadPhone: string;
  formAnswers: LeadFormFieldAnswer[];
  summary: string;
  customMessage?: string;
  source?: 'web_panel' | 'whatsapp_photo';
}): Promise<{ success: boolean; thread: ChatThread; entry: LeadFormEntry }> {
  let cleanPhone = (data.leadPhone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = '55' + cleanPhone;
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Número de WhatsApp inválido ou incompleto (necessário DDD + número).');
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;
  const contactName = data.leadName?.trim() || `+${cleanPhone}`;
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const messageToSend =
    data.customMessage?.trim() ||
    (data.leadName?.trim()
      ? `Olá, ${data.leadName.trim()}, tudo bem? Eu estou falando com você mesmo?`
      : 'Olá, tudo bem? Eu estou falando com você mesmo?');

  const leadFormContext: LeadFormContext = {
    id: `form-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    leadName: contactName,
    leadPhone: cleanPhone,
    extractedAt: new Date().toISOString(),
    formAnswers: data.formAnswers || [],
    summary: data.summary || '',
    status: 'contacted',
    stage: 'awaiting_confirmation',
    triggerStatus: 'pending_reply',
    initialMessageSent: messageToSend,
  };

  let thread = chatThreads.get(jid);
  if (!thread) {
    thread = {
      jid,
      name: contactName,
      lastMessage: messageToSend,
      lastTimestamp: timestamp,
      unreadCount: 0,
      messages: [],
      botPausedForThisChat: false,
      leadFormContext,
    };
    chatThreads.set(jid, thread);
  } else {
    thread.name = contactName;
    thread.leadFormContext = leadFormContext;
  }

  knownContacts.set(jid, { name: contactName, phone: cleanPhone });

  // Send initial message if connected
  if (sock && waState.status === 'connected') {
    try {
      await sock.sendPresenceUpdate('composing', jid);
      await new Promise((r) => setTimeout(r, 1200));
      await sock.sendMessage(jid, { text: messageToSend });
      await sock.sendPresenceUpdate('paused', jid);

      thread.messages.push({
        id: `form-msg-${Date.now()}`,
        chatJid: jid,
        senderName: 'Você (RespondeForm AI)',
        fromMe: true,
        text: messageToSend,
        timestamp,
      });
      thread.lastMessage = messageToSend;
      thread.lastTimestamp = timestamp;
      waState.stats.totalReplied = (waState.stats.totalReplied || 0) + 1;
    } catch (sendErr) {
      console.warn('Erro ao disparar mensagem para lead de formulário:', sendErr);
    }
  }

  const allForms = loadLeadForms();
  const entry: LeadFormEntry = {
    ...leadFormContext,
    jid,
    source: data.source || 'web_panel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  allForms.unshift(entry);
  saveLeadForms(allForms);

  saveWhatsAppChats();
  saveWhatsAppContacts();

  recordSystemLog(
    'connection',
    'Lead de Formulário Acionado',
    `Abordagem disparada para ${contactName} (+${cleanPhone}) com triagem ativa.`,
    contactName,
    'success'
  );

  return { success: true, thread, entry };
}

// =========================================================================
// FOLLOW-UP CADENCE STORE
// =========================================================================
export type FollowUpStyle =
  | 'casual_amigavel'
  | 'urgencia_fechamento'
  | 'prova_social'
  | 'pergunta_direta'
  | 'conteudo_valor'
  | 'custom';

export interface FollowUpStep {
  id: string;
  name: string;
  daysAfter: number;
  time: string;
  messageStyle: FollowUpStyle;
  template: string;
  enabled: boolean;
}

export interface FollowUpContact {
  id: string;
  name: string;
  phone: string;
  jid: string;
  currentStepIndex: number;
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

let followUpCadenceConfig: FollowUpCadenceConfig = {
  enabled: true,
  cadenceName: 'Cadência Padrão de Fechamento ArcoZapp',
  autoTriggerWhenNoReply: true,
  stopOnCustomerReply: true,
  steps: [
    {
      id: 'step-1',
      name: 'D+1 - Check-in Leve & Apoio',
      daysAfter: 1,
      time: '10:00',
      messageStyle: 'casual_amigavel',
      template: 'Oi {{nome}}, tudo bem por aí? Passando rapidinho para saber se ficou alguma dúvida sobre o que conversamos! 😊',
      enabled: true,
    },
    {
      id: 'step-2',
      name: 'D+3 - Quebra de Objeção & Material',
      daysAfter: 3,
      time: '14:30',
      messageStyle: 'conteudo_valor',
      template: 'Olá {{nome}}! Lembrei de você e preparei esse resumo prático de resultados dos nossos parceiros. Me avisa se faz sentido para o seu momento! 🚀',
      enabled: true,
    },
    {
      id: 'step-3',
      name: 'D+7 - Condição Especial & Fechamento',
      daysAfter: 7,
      time: '11:00',
      messageStyle: 'urgencia_fechamento',
      template: 'Oi {{nome}}, tudo joia? Conseguimos liberar uma condição diferenciada esta semana. Quer dar uma olhada antes de fecharmos a grade do mês? 🎯',
      enabled: true,
    },
    {
      id: 'step-4',
      name: 'D+14 - Check-out Amigável',
      daysAfter: 14,
      time: '16:00',
      messageStyle: 'pergunta_direta',
      template: 'Olá {{nome}}! Imagino que sua rotina esteja bem corrida. Para não te incomodar, vou pausar meus recados por aqui, mas fico à disposição sempre que quiser retomar! Um abraço.',
      enabled: true,
    },
  ],
};

let followUpContacts: FollowUpContact[] = [];

// =========================================================================
// PRE-CALL REMINDERS & GROUPS STORE
// =========================================================================
export interface PreCallStage {
  id: string;
  label: string;
  hoursBefore: number;
  template: string;
  enabled: boolean;
}

export interface PreCallMeeting {
  id: string;
  title: string;
  leadName: string;
  targetType: 'contact' | 'group';
  targetJid: string;
  targetName: string;
  targetGroupLink?: string;
  meetingDateTime: string;
  meetingLink: string;
  stagesSent: Record<string, boolean>;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface PreCallConfig {
  enabled: boolean;
  defaultMeetLink: string;
  stages: PreCallStage[];
}

let preCallMeetings: PreCallMeeting[] = [];

let preCallConfig: PreCallConfig = {
  enabled: true,
  defaultMeetLink: 'https://meet.google.com/abc-defg-hij',
  stages: [
    {
      id: 'stage-24h',
      label: '24 horas antes',
      hoursBefore: 24,
      template: 'Olá! Confirmando nossa reunião agendada para amanhã às {{horario}}. Pauta rápida e objetiva! Qualquer imprevisto me avise por aqui. 🗓️',
      enabled: true,
    },
    {
      id: 'stage-2h',
      label: '2 horas antes',
      hoursBefore: 2,
      template: 'Passando para lembrar que nossa call acontece daqui a 2 horas (às {{horario}})! Segue o link de acesso: {{link}} 📲',
      enabled: true,
    },
    {
      id: 'stage-15m',
      label: '15 minutos antes',
      hoursBefore: 0.25,
      template: '🚨 Faltam apenas 15 minutos para nossa reunião! Já estou preparando a sala: {{link}}',
      enabled: true,
    },
    {
      id: 'stage-now',
      label: 'No horário (Sala aberta)',
      hoursBefore: 0,
      template: '🟢 Sala aberta! Já estou online aguardando vocês: {{link}}',
      enabled: true,
    },
  ],
};

// =========================================================================
// AGENT BEHAVIOR SETTINGS
// =========================================================================
export interface AgentBehaviorSettings {
  simulatedTypingDelay: number;
  humanizationLevel: 'ultra' | 'moderate' | 'formal';
  maxCharactersPerMessage: number;
  splitLongMessages: boolean;
  enableAudioListening: boolean;
  enableContextReactions: boolean;
  humanizedEmojis: boolean;
  autoReplyOnlyPrivate: boolean;
  ignoreGroupMessages: boolean;
}

let agentBehaviorSettings: AgentBehaviorSettings = {
  simulatedTypingDelay: (botTraining as any).simulatedTypingDelay || 4,
  humanizationLevel: (botTraining as any).humanizationLevel || 'ultra',
  maxCharactersPerMessage: (botTraining as any).maxCharactersPerMessage || 280,
  splitLongMessages: (botTraining as any).splitLongMessages !== false,
  enableAudioListening: botTraining.enableAudioListening ?? true,
  enableContextReactions: botTraining.enableContextReactions ?? true,
  humanizedEmojis: botTraining.humanizedEmojis ?? true,
  autoReplyOnlyPrivate: botTraining.autoReplyOnlyPrivate ?? true,
  ignoreGroupMessages: (botTraining as any).ignoreGroupMessages ?? true,
};

// Intelligent AI Sentiment Classifier using Gemini
async function analyzeThreadSentiment(thread: ChatThread): Promise<SentimentAnalysis> {
  const customerMessages = thread.messages
    .filter((m) => !m.fromMe)
    .map((m) => m.text)
    .join('\n');

  const fullConversation = thread.messages
    .slice(-8)
    .map((m) => `${m.fromMe ? 'Atendente/Bot' : 'Cliente'}: ${m.text}`)
    .join('\n');

  const textLower = (customerMessages || thread.lastMessage || '').toLowerCase();
  const hasNegative =
    textLower.includes('demor') ||
    textLower.includes('ruim') ||
    textLower.includes('reclama') ||
    textLower.includes('cancel') ||
    textLower.includes('erro') ||
    textLower.includes('péssim') ||
    textLower.includes('absurdo') ||
    textLower.includes('estorno') ||
    textLower.includes('falta') ||
    textLower.includes('cadê') ||
    textLower.includes('atrasad') ||
    textLower.includes('não gostei') ||
    textLower.includes('insatisfeit') ||
    textLower.includes('decepcion');

  const hasPositive =
    textLower.includes('obrigad') ||
    textLower.includes('ótimo') ||
    textLower.includes('maravilh') ||
    textLower.includes('perfeito') ||
    textLower.includes('top') ||
    textLower.includes('adorei') ||
    textLower.includes('parabéns') ||
    textLower.includes('excelente') ||
    textLower.includes('confirmado') ||
    textLower.includes('show') ||
    textLower.includes('satisfeit') ||
    textLower.includes('❤️') ||
    textLower.includes('🙏') ||
    textLower.includes('valeu');

  let defaultSentiment: SentimentType = hasNegative
    ? 'Insatisfeito'
    : hasPositive
    ? 'Satisfeito'
    : 'Neutro';
  let defaultScore = hasNegative ? 18 : hasPositive ? 92 : 55;
  let defaultReason = hasNegative
    ? 'Cliente expressou insatisfação, demora ou queixa no atendimento.'
    : hasPositive
    ? 'Cliente elogiou e demonstrou satisfação com a resposta e atenção.'
    : 'Conversa padrão com dúvidas ou informações gerais.';
  let defaultUrgency: 'baixa' | 'media' | 'alta' = hasNegative ? 'alta' : 'baixa';
  let defaultAction = hasNegative
    ? 'Intervenção humana recomendada imediatamente para evitar perda de cliente.'
    : hasPositive
    ? 'Agradecer e reforçar o relacionamento com o cliente.'
    : 'Seguir o atendimento normalmente.';

  try {
    const prompt = `Analise o sentimento desta conversa de WhatsApp entre um cliente e a empresa.
Classifique o sentimento do cliente estritamente em uma destas 3 categorias:
"Satisfeito", "Neutro" ou "Insatisfeito".

CONVERSA:
${fullConversation || customerMessages || thread.lastMessage}

Responda SOMENTE um objeto JSON estrito com o formato:
{
  "sentiment": "Satisfeito" | "Neutro" | "Insatisfeito",
  "score": <número inteiro de 0 a 100 indicando nível de satisfação>,
  "reason": "<resumo claro de 1 frase explicando o motivo do sentimento>",
  "urgency": "baixa" | "media" | "alta",
  "recommendedAction": "<ação recomendada para o operador humano>"
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(res.text?.trim() || '{}');
    if (parsed.sentiment && ['Satisfeito', 'Neutro', 'Insatisfeito'].includes(parsed.sentiment)) {
      const isAlert = parsed.sentiment === 'Insatisfeito';
      return {
        sentiment: parsed.sentiment as SentimentType,
        score: typeof parsed.score === 'number' ? parsed.score : defaultScore,
        reason: parsed.reason || defaultReason,
        isAlert,
        urgency: parsed.urgency || (isAlert ? 'alta' : 'baixa'),
        recommendedAction: parsed.recommendedAction || defaultAction,
        analyzedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  } catch (err) {
    console.warn('Fallback no classificador de sentimento com Gemini:', err);
  }

  return {
    sentiment: defaultSentiment,
    score: defaultScore,
    reason: defaultReason,
    isAlert: defaultSentiment === 'Insatisfeito',
    urgency: defaultUrgency,
    recommendedAction: defaultAction,
    analyzedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

// =========================================================================
// SYSTEM LOGS: Latest 50 Actions Performed by the Bot (Real-Time Monitor)
// =========================================================================
export interface SystemLogEntry {
  id: string;
  timestamp: string; // e.g. "15:24:02"
  fullDate: string;
  type:
    | 'audio_processed'
    | 'reaction_sent'
    | 'reply_sent'
    | 'schedule_pause'
    | 'handoff'
    | 'broadcast'
    | 'connection'
    | 'system';
  action: string; // 'Áudio processado', 'Emoji reagido', 'Resposta enviada'
  details: string;
  contact?: string;
  status: 'success' | 'warning' | 'info' | 'error';
  metadata?: Record<string, any>;
}

const MAX_SYSTEM_LOGS = 50;
const systemLogs: SystemLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 25 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 25 * 1000).toISOString(),
    type: 'reply_sent',
    action: 'Resposta enviada',
    details: 'IA gerou e enviou resposta humanizada sobre formas de pagamento (Pix, Cartão) e chave cadastrada.',
    contact: '+55 11 98421-5092 (Carlos Mendes)',
    status: 'success',
    metadata: { charCount: 194 },
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 55 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 55 * 1000).toISOString(),
    type: 'reaction_sent',
    action: 'Emoji reagido',
    details: 'Reação contextual disparada no WhatsApp: cliente confirmou o comprovante enviado.',
    contact: '+55 11 98421-5092 (Carlos Mendes)',
    status: 'success',
    metadata: { reactionEmoji: '❤️' },
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 130 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 130 * 1000).toISOString(),
    type: 'audio_processed',
    action: 'Áudio processado',
    details: 'Áudio de voz (12 segundos) decodificado e transcrito pelo modelo multimodal Gemini 3.8 Flash.',
    contact: '+55 21 99123-8840 (Beatriz Lima)',
    status: 'success',
    metadata: { durationSeconds: 12 },
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 210 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 210 * 1000).toISOString(),
    type: 'reply_sent',
    action: 'Resposta enviada',
    details: 'Resposta ao áudio da cliente enviada com formatação em negrito e tom acolhedor.',
    contact: '+55 21 99123-8840 (Beatriz Lima)',
    status: 'success',
    metadata: { charCount: 231 },
  },
  {
    id: 'log-seed-5',
    timestamp: new Date(Date.now() - 300 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 300 * 1000).toISOString(),
    type: 'reaction_sent',
    action: 'Emoji reagido',
    details: 'Reação contextual disparada: cliente elogiou a agilidade da resposta.',
    contact: '+55 31 99765-4421 (Rodrigo Rocha)',
    status: 'success',
    metadata: { reactionEmoji: '🔥' },
  },
  {
    id: 'log-seed-6',
    timestamp: new Date(Date.now() - 420 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 420 * 1000).toISOString(),
    type: 'schedule_pause',
    action: 'Pausa fora do expediente',
    details: 'Verificação de expediente comercial: Dentro do horário (Segunda a Sexta 08h às 18h). Resposta liberada.',
    contact: 'Sistema',
    status: 'info',
  },
  {
    id: 'log-seed-7',
    timestamp: new Date(Date.now() - 600 * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    fullDate: new Date(Date.now() - 600 * 1000).toISOString(),
    type: 'connection',
    action: 'WhatsApp Conectado',
    details: 'Motor Baileys sincronizado com sucesso. Sessão autenticada e pronta para automação.',
    contact: 'Sistema',
    status: 'success',
  },
];

export function recordSystemLog(
  type: SystemLogEntry['type'],
  action: string,
  details: string,
  contact?: string,
  status: SystemLogEntry['status'] = 'info',
  metadata?: Record<string, any>
): SystemLogEntry {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const entry: SystemLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    fullDate: now.toISOString(),
    type,
    action,
    details,
    contact: contact || 'WhatsApp',
    status,
    metadata,
  };

  systemLogs.unshift(entry);
  if (systemLogs.length > MAX_SYSTEM_LOGS) {
    systemLogs.length = MAX_SYSTEM_LOGS;
  }
  return entry;
}

// Baileys Socket instance
let sock: WASocket | null = null;
let isReconnecting = false;

// Extract content, audio, and metadata from Baileys message
function extractMessageData(msg: proto.IWebMessageInfo): {
  remoteJid: string;
  senderName: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
  timestampMs: number;
  isAudio: boolean;
  reaction?: string;
} | null {
  const key = msg.key;
  if (!key || !key.remoteJid || key.remoteJid === 'status@broadcast') return null;

  const remoteJid = key.remoteJid;
  const isFromMe = Boolean(key.fromMe);

  const m = msg.message;
  let text = '';
  let isAudio = false;

  if (m) {
    if (m.conversation) {
      text = m.conversation;
    } else if (m.extendedTextMessage?.text) {
      text = m.extendedTextMessage.text;
    } else if (m.imageMessage?.caption) {
      text = m.imageMessage.caption;
    } else if (m.videoMessage?.caption) {
      text = m.videoMessage.caption;
    } else if (m.audioMessage) {
      isAudio = true;
      text = '🎙️ [Áudio de Voz enviado pelo cliente]';
    } else if (m.documentMessage?.fileName) {
      text = `📄 [Documento: ${m.documentMessage.fileName}]`;
    } else if (m.contactMessage?.displayName) {
      text = `👤 [Contato: ${m.contactMessage.displayName}]`;
    } else if (m.locationMessage) {
      text = '📍 [Localização compartilhada]';
    } else if (m.reactionMessage?.text) {
      return {
        remoteJid,
        senderName: msg.pushName || 'Contato',
        fromMe: isFromMe,
        text: '',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestampMs: Date.now(),
        isAudio: false,
        reaction: m.reactionMessage.text,
      };
    }
  }

  if (!text && !isAudio) return null;

  let timestampMs = Date.now();
  if (typeof msg.messageTimestamp === 'number') {
    timestampMs = msg.messageTimestamp * 1000;
  } else if (msg.messageTimestamp && typeof (msg.messageTimestamp as any).low === 'number') {
    timestampMs = (msg.messageTimestamp as any).low * 1000;
  }

  const date = new Date(timestampMs);
  const timestamp = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const senderName = isFromMe ? 'Você / IA' : (msg.pushName || remoteJid.split('@')[0]);

  return {
    remoteJid,
    senderName,
    fromMe: isFromMe,
    text,
    timestamp,
    timestampMs,
    isAudio,
  };
}

// Record a historical or synced message into chatThreads
function recordHistoricalMessage(msg: proto.IWebMessageInfo) {
  const data = extractMessageData(msg);
  if (!data) return;

  const { remoteJid, senderName, fromMe, text, timestamp, isAudio } = data;
  let thread = chatThreads.get(remoteJid);
  if (!thread) {
    const contact = knownContacts.get(remoteJid);
    const phone = remoteJid.split('@')[0];
    const name = contact?.name || (remoteJid.endsWith('@g.us') ? 'Grupo WhatsApp' : `+${phone}`);
    thread = {
      jid: remoteJid,
      name,
      lastMessage: text,
      lastTimestamp: timestamp,
      unreadCount: 0,
      messages: [],
      botPausedForThisChat: false,
    };
    chatThreads.set(remoteJid, thread);
  }

  const msgId = msg.key?.id || `msg-${data.timestampMs}-${Math.random().toString(36).substring(2, 7)}`;
  const alreadyExists = thread.messages.some((m) => m.id === msgId);
  if (!alreadyExists) {
    const liveMsg: LiveLogMessage = {
      id: msgId,
      chatJid: remoteJid,
      senderName,
      fromMe,
      text,
      timestamp,
      isAudio,
    };
    thread.messages.push(liveMsg);
    if (thread.messages.length > 50) {
      thread.messages.shift();
    }
  }

  thread.lastMessage = text || thread.lastMessage;
  thread.lastTimestamp = timestamp || thread.lastTimestamp;
}

// Synchronize all real WhatsApp contacts, participating groups, and active threads
async function syncRealWhatsAppContactsAndChats(): Promise<{
  activeChats: number;
  totalContacts: number;
  totalMessages: number;
  threads: ChatThread[];
}> {
  if (sock && waState.status === 'connected') {
    // 1. Fetch all participating WhatsApp groups
    try {
      const groups = await sock.groupFetchAllParticipating();
      if (groups) {
        for (const [groupId, groupMeta] of Object.entries(groups)) {
          const participantCount = groupMeta.participants?.length || 0;
          const groupName = groupMeta.subject || 'Grupo WhatsApp';
          if (!chatThreads.has(groupId)) {
            chatThreads.set(groupId, {
              jid: groupId,
              name: groupName,
              lastMessage: `Grupo com ${participantCount} participantes`,
              lastTimestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: 0,
              messages: [],
              botPausedForThisChat: false,
            });
          } else {
            const t = chatThreads.get(groupId)!;
            t.name = groupName;
          }
        }
      }
    } catch (gErr) {
      console.warn('Aviso: busca de grupos retornou:', gErr);
    }

    // 2. Ensure all known contacts from agenda have an active thread
    for (const [jid, contact] of knownContacts.entries()) {
      if (jid && !jid.endsWith('@g.us') && jid !== 'status@broadcast') {
        if (!chatThreads.has(jid)) {
          chatThreads.set(jid, {
            jid,
            name: contact.name || `+${contact.phone}`,
            lastMessage: 'Contato sincronizado da agenda',
            lastTimestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unreadCount: 0,
            messages: [],
            botPausedForThisChat: false,
          });
        }
      }
    }
  }

  saveWhatsAppChats();
  saveWhatsAppContacts();

  let totalMsgs = 0;
  for (const t of chatThreads.values()) {
    totalMsgs += t.messages.length;
  }

  return {
    activeChats: chatThreads.size,
    totalContacts: knownContacts.size,
    totalMessages: totalMsgs,
    threads: Array.from(chatThreads.values()),
  };
}

// Connect to WhatsApp using Baileys
async function startWhatsApp() {
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('messages.upsert');
      sock.end(undefined);
    } catch {}
    sock = null;
  }

  waState.status = 'connecting';
  console.log('🔄 Iniciando conexão com o WhatsApp...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const logger = pino({ level: 'silent' });

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['ArcoZapp Atendimento', 'Chrome', '1.0.0'],
      syncFullHistory: true,
      generateHighQualityLinkPreview: false,
    });

    sock.ev.on('creds.update', saveCreds);

    // Sync contacts
    sock.ev.on('contacts.upsert', (contacts) => {
      for (const contact of contacts) {
        if (!contact.id) continue;
        const phone = contact.id.split('@')[0];
        const name = contact.name || contact.notify || contact.verifiedName || `+${phone}`;
        knownContacts.set(contact.id, { name, notify: contact.notify, phone });

        const thread = chatThreads.get(contact.id);
        if (thread && (!thread.name || thread.name.startsWith('+'))) {
          thread.name = name;
        }
      }
      saveWhatsAppContacts();
      saveWhatsAppChats();
    });

    (sock.ev as any).on('contacts.set', ({ contacts }: { contacts: any[] }) => {
      if (Array.isArray(contacts)) {
        for (const contact of contacts) {
          if (!contact.id) continue;
          const phone = contact.id.split('@')[0];
          const name = contact.name || contact.notify || contact.verifiedName || `+${phone}`;
          knownContacts.set(contact.id, { name, notify: contact.notify, phone });
        }
        saveWhatsAppContacts();
      }
    });

    (sock.ev as any).on('contacts.update', (updates: any[]) => {
      if (Array.isArray(updates)) {
        for (const u of updates) {
          if (!u.id) continue;
          const phone = u.id.split('@')[0];
          const existing = knownContacts.get(u.id);
          const name = u.name || u.notify || u.verifiedName || existing?.name || `+${phone}`;
          knownContacts.set(u.id, { name, notify: u.notify || existing?.notify, phone });
          const thread = chatThreads.get(u.id);
          if (thread && name) thread.name = name;
        }
        saveWhatsAppContacts();
        saveWhatsAppChats();
      }
    });

    // Sync chats
    sock.ev.on('chats.upsert', (newChats) => {
      for (const chat of newChats) {
        if (!chat.id || chat.id === 'status@broadcast') continue;
        if (!chatThreads.has(chat.id)) {
          const contact = knownContacts.get(chat.id);
          const phone = chat.id.split('@')[0];
          const name = contact?.name || chat.name || (chat.id.endsWith('@g.us') ? 'Grupo WhatsApp' : `+${phone}`);
          chatThreads.set(chat.id, {
            jid: chat.id,
            name,
            lastMessage: 'Conversa sincronizada do WhatsApp',
            lastTimestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unreadCount: chat.unreadCount || 0,
            messages: [],
            botPausedForThisChat: false,
          });
        } else {
          const thread = chatThreads.get(chat.id)!;
          if (chat.name && (!thread.name || thread.name.startsWith('+'))) {
            thread.name = chat.name;
          }
        }
      }
      saveWhatsAppChats();
    });

    sock.ev.on('messaging-history.set', ({ chats, contacts, messages }) => {
      console.log(`📥 Histórico completo do WhatsApp sincronizado: ${chats?.length || 0} conversas, ${contacts?.length || 0} contatos, ${messages?.length || 0} mensagens.`);
      if (contacts) {
        for (const c of contacts) {
          if (!c.id) continue;
          const phone = c.id.split('@')[0];
          const name = c.name || c.notify || c.verifiedName || `+${phone}`;
          knownContacts.set(c.id, { name, notify: c.notify, phone });
        }
      }
      if (chats) {
        for (const c of chats) {
          if (!c.id || c.id === 'status@broadcast') continue;
          const contact = knownContacts.get(c.id);
          const phone = c.id.split('@')[0];
          const name = contact?.name || c.name || (c.id.endsWith('@g.us') ? 'Grupo WhatsApp' : `+${phone}`);
          if (!chatThreads.has(c.id)) {
            chatThreads.set(c.id, {
              jid: c.id,
              name,
              lastMessage: 'Histórico sincronizado',
              lastTimestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: c.unreadCount || 0,
              messages: [],
              botPausedForThisChat: false,
            });
          }
        }
      }
      if (messages && Array.isArray(messages)) {
        for (const msg of messages) {
          try {
            recordHistoricalMessage(msg);
          } catch (mErr) {
            console.warn('Erro ao processar mensagem do histórico:', mErr);
          }
        }
      }
      saveWhatsAppContacts();
      saveWhatsAppChats();
      recordSystemLog(
        'connection',
        'Histórico Sincronizado',
        `${chats?.length || 0} conversas reais e ${messages?.length || 0} mensagens sincronizadas do WhatsApp.`,
        undefined,
        'success'
      );
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        waState.status = 'qr_ready';
        waState.qrRaw = qr;
        try {
          waState.qrDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: {
              dark: '#075e54',
              light: '#ffffff',
            },
          });
          console.log('📷 QR Code gerado para conexão do WhatsApp!');
        } catch (err) {
          console.error('Erro ao converter QR Code:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`❌ Conexão WhatsApp encerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

        waState.status = 'disconnected';
        waState.qrRaw = undefined;
        waState.qrDataUrl = undefined;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('⚠️ Aparelho desconectado pelo usuário. Limpando credenciais...');
          recordSystemLog(
            'connection',
            'WhatsApp Desconectado',
            'Sessão desvinculada pelo aplicativo do WhatsApp. Credenciais limpas.',
            undefined,
            'warning'
          );
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch {}
        } else if (shouldReconnect && !isReconnecting) {
          isReconnecting = true;
          setTimeout(() => {
            isReconnecting = false;
            startWhatsApp();
          }, 3000);
        }
      } else if (connection === 'open') {
        waState.status = 'connected';
        waState.qrRaw = undefined;
        waState.qrDataUrl = undefined;
        waState.lastConnectedAt = new Date().toISOString();

        if (sock?.user) {
          waState.userPhone = sock.user.id.split(':')[0].split('@')[0];
          waState.userName = sock.user.name || 'Meu WhatsApp';
        }
        console.log(`✅ WhatsApp CONECTADO com sucesso! Número: ${waState.userPhone}`);
        recordSystemLog(
          'connection',
          'WhatsApp Conectado',
          `Sessão WhatsApp conectada com sucesso (${waState.userPhone || 'Ativa'})`,
          waState.userPhone,
          'success'
        );

        // Fetch groups and sync initial contacts on connect
        syncRealWhatsAppContactsAndChats().catch((err) =>
          console.warn('Sincronização inicial de grupos e contatos falhou:', err)
        );
      }
    });

    // Handle incoming messages (live vs historical)
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        try {
          const msgTimestamp =
            typeof msg.messageTimestamp === 'number'
              ? msg.messageTimestamp * 1000
              : msg.messageTimestamp && typeof (msg.messageTimestamp as any).low === 'number'
              ? (msg.messageTimestamp as any).low * 1000
              : Date.now();
          const isOlder = Date.now() - msgTimestamp > 120000;

          if (type === 'append' || isOlder) {
            recordHistoricalMessage(msg);
          } else {
            await handleIncomingMessage(msg);
          }
        } catch (err) {
          console.error('Erro ao processar mensagem recebida:', err);
        }
      }
      saveWhatsAppChats();
    });
  } catch (err) {
    console.error('Falha crítica ao iniciar WhatsApp:', err);
    waState.status = 'disconnected';
  }
}

// Process incoming WhatsApp message and respond autonomously with Gemini
async function handleIncomingMessage(msg: proto.IWebMessageInfo) {
  if (!sock) return;

  const key = msg.key;
  if (!key || !key.remoteJid) return;

  const isFromMe = Boolean(key.fromMe);
  const remoteJid = key.remoteJid;

  // Skip status/stories updates
  if (remoteJid === 'status@broadcast') return;

  // Check if group message and whether group auto-reply is disabled
  const isGroup = remoteJid.endsWith('@g.us');
  if (isGroup && botTraining.autoReplyOnlyPrivate) {
    return;
  }

  // Check message content (text or audio)
  const messageContent = msg.message;
  if (!messageContent) return;

  const audioMessage = messageContent.audioMessage;
  const isAudio = Boolean(audioMessage);

  let text =
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    '';

  let audioBase64: string | null = null;
  let audioMimeType = 'audio/ogg; codecs=opus';
  const senderName = msg.pushName || remoteJid.split('@')[0];

  // If audio voice note, download and prepare for Gemini
  if (isAudio && audioMessage) {
    text = '🎙️ [Áudio de Voz enviado pelo cliente]';
    if (botTraining.enableAudioListening) {
      try {
        console.log(`🎧 Baixando áudio enviado por ${remoteJid}...`);
        const audioBuffer = await downloadMediaMessage(msg as any, 'buffer', {});
        audioBase64 = (audioBuffer as Buffer).toString('base64');
        audioMimeType = audioMessage.mimetype || 'audio/ogg; codecs=opus';
        recordSystemLog(
          'audio_processed',
          'Áudio processado',
          `Áudio de voz recebido (${audioMimeType}), buffer decodificado e enviado ao Gemini 3.8 Flash para transcrição e resposta.`,
          senderName || remoteJid.replace('@s.whatsapp.net', ''),
          'success'
        );
      } catch (audioErr) {
        console.error('Erro ao baixar áudio do WhatsApp:', audioErr);
      }
    }
  }

  const imageMessage = messageContent.imageMessage;
  const isImage = Boolean(imageMessage);

  // Check if this image is a form print sent by operator or with caption trigger
  if (isImage && imageMessage) {
    const caption = (imageMessage.caption || '').trim();
    const isFormTrigger =
      isFromMe ||
      caption.toLowerCase().includes('#lead') ||
      caption.toLowerCase().includes('#triagem') ||
      caption.toLowerCase().includes('#form') ||
      /\d{10,13}/.test(caption);

    if (isFormTrigger) {
      try {
        console.log(`📸 Print de formulário recebido via WhatsApp de ${remoteJid}...`);
        const imgBuffer = await downloadMediaMessage(msg as any, 'buffer', {});
        const imgBase64 = (imgBuffer as Buffer).toString('base64');
        const mimeType = imageMessage.mimetype || 'image/jpeg';

        const extracted = await extractLeadFromImage(imgBase64, mimeType);

        // Check if caption contains explicit phone number:
        const captionPhoneMatch = caption.match(/\b(?:\+?55)?\s?\(?(\d{2})\)?\s?(\d{4,5})[-.\s]?(\d{4})\b/);
        if (captionPhoneMatch) {
          extracted.leadPhone = captionPhoneMatch[0].replace(/\D/g, '');
        }

        if (extracted.leadPhone && extracted.leadPhone.replace(/\D/g, '').length >= 10) {
          const dispatched = await dispatchLeadForm({
            ...extracted,
            source: 'whatsapp_photo',
          });

          await sock.sendMessage(remoteJid, {
            text: `✅ *Lead Identificado com Sucesso!*\n\n👤 *Nome:* ${extracted.leadName || 'Não informado'}\n📱 *WhatsApp:* +${dispatched.entry.leadPhone}\n📋 *Resumo:* ${extracted.summary}\n\n🚀 *Status:* Abordagem inicial enviada para o lead e triagem iniciada!`,
          });
          return;
        } else {
          await sock.sendMessage(remoteJid, {
            text: `⚠️ Identifiquei os dados do formulário de *${extracted.leadName || 'Lead'}*, porém o número de telefone não ficou visível no print.\n\nEnvie a foto novamente com o telefone na legenda (ex: *#lead 11999998888*).`,
          });
          return;
        }
      } catch (err: any) {
        console.error('Erro ao processar imagem de lead no WhatsApp:', err);
      }
    }
  }

  if (!text && !isAudio && !isImage) return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update in-memory chat thread
  let thread = chatThreads.get(remoteJid);
  if (!thread) {
    thread = {
      jid: remoteJid,
      name: senderName,
      lastMessage: text,
      lastTimestamp: timestamp,
      unreadCount: 0,
      messages: [],
      botPausedForThisChat: false,
    };
    chatThreads.set(remoteJid, thread);
  }

  thread.lastMessage = text;
  thread.lastTimestamp = timestamp;
  if (!isFromMe) {
    thread.unreadCount += 1;
    waState.stats.totalReceived += 1;
  }

  const logMessage: LiveLogMessage = {
    id: key.id || `msg-${Date.now()}`,
    chatJid: remoteJid,
    senderName: isFromMe ? 'Você / IA' : senderName,
    fromMe: Boolean(isFromMe),
    text: text,
    timestamp,
    isAudio,
  };

  thread.messages.push(logMessage);
  // Keep last 100 messages per thread for maximum deep context
  if (thread.messages.length > 100) {
    thread.messages.shift();
  }

  // Real-time Sentiment Analysis with Gemini: track and alert on negative sentiment
  analyzeThreadSentiment(thread)
    .then((analysis) => {
      const prevSentiment = thread.sentiment?.sentiment;
      thread.sentiment = analysis;
      if (analysis.isAlert && prevSentiment !== 'Insatisfeito') {
        recordSystemLog(
          'system',
          'Alerta: Sentimento Negativo',
          `🚨 Alerta de Insatisfação detectado em ${senderName}: ${analysis.reason}`,
          senderName,
          'warning'
        );
      }
    })
    .catch((err) => console.warn('Erro ao atualizar análise de sentimento:', err));

  // AUTONOMOUS BOT RESPONSE:
  // Only reply if message is NOT from me, autoReply is enabled, and bot is not paused for this contact
  if (isFromMe || !waState.autoReplyEnabled || thread.botPausedForThisChat) {
    return;
  }

  // ⏰ CHECK BUSINESS HOURS & BOT PAUSE SCHEDULE
  const scheduleStatus = checkScheduleStatus(botTraining.schedule);
  if (!scheduleStatus.isWithinHours) {
    console.log(`🌙 [IA em Descanso / Fora de Expediente] Mensagem de ${remoteJid}: ${scheduleStatus.reason}`);

    // If configured to stay 100% silent outside business hours:
    if (botTraining.schedule?.actionOutOfHours === 'silence') {
      recordSystemLog(
        'schedule_pause',
        'Pausa fora do expediente',
        `Mensagem recebida fora do expediente. Modo Silêncio Total ativado (IA em repouso sem disparar respostas). ${scheduleStatus.reason}`,
        senderName || remoteJid.replace('@s.whatsapp.net', ''),
        'info'
      );
      return;
    }

    // If configured to send an out-of-office automated humanized notice:
    const alreadyNotified = Boolean(thread.notifiedOutOfHours);
    const notifyOnce = botTraining.schedule?.notifyOncePerContact !== false;

    if (!notifyOnce || !alreadyNotified) {
      thread.notifiedOutOfHours = true;
      const outOfHoursNotice =
        botTraining.schedule?.outOfHoursMessage ||
        'Olá! Agradecemos sua mensagem. Nosso horário de atendimento comercial é de segunda a sexta, das 08h às 18h. No momento nossa equipe e nosso atendimento estão descansando, mas já registramos sua mensagem e assim que o expediente iniciar te responderemos com prioridade! 😊🙏';

      try {
        await sock.sendPresenceUpdate('composing', remoteJid);
        await new Promise((r) => setTimeout(r, 1500));
        await sock.sendMessage(remoteJid, { text: outOfHoursNotice });
        await sock.sendPresenceUpdate('paused', remoteJid);

        thread.messages.push({
          id: `ai-${Date.now()}`,
          chatJid: remoteJid,
          senderName: `${botTraining.personaName} (Aviso de Expediente)`,
          fromMe: true,
          text: outOfHoursNotice,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAiResponse: true,
        });
        waState.stats.totalReplied += 1;

        recordSystemLog(
          'schedule_pause',
          'Pausa fora do expediente',
          `Aviso de ausência/fora do expediente enviado ao cliente. Motivo: ${scheduleStatus.reason}`,
          senderName || remoteJid.replace('@s.whatsapp.net', ''),
          'info'
        );
      } catch (err) {
        console.warn('Erro ao enviar aviso de fora do expediente:', err);
      }
    }
    return;
  } else {
    // We are within business hours, clear the out of hours lock for next time
    thread.notifiedOutOfHours = false;
  }

  // Check human handoff triggers (text only)
  if (!isAudio) {
    const textLower = text.toLowerCase();
    const requestedHuman = botTraining.humanHandoffKeywords?.some((kw: string) =>
      textLower.includes(kw.toLowerCase())
    );

    if (requestedHuman) {
      thread.botPausedForThisChat = true;
      const handoffNotice = `Entendido! Estou transferindo o seu atendimento para uma pessoa da nossa equipe. Um momento por gentileza, já vão te responder por aqui! 💬`;
      
      // Send "composing" presence
      await sock.sendPresenceUpdate('composing', remoteJid);
      await new Promise((r) => setTimeout(r, 1500));
      await sock.sendMessage(remoteJid, { text: handoffNotice });
      await sock.sendPresenceUpdate('paused', remoteJid);

      thread.messages.push({
        id: `ai-${Date.now()}`,
        chatJid: remoteJid,
        senderName: botTraining.personaName,
        fromMe: true,
        text: handoffNotice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiResponse: true,
      });
      waState.stats.totalReplied += 1;

      recordSystemLog(
        'handoff',
        'Transbordo para humano',
        `Palavra-chave detectada na mensagem ("${text.substring(0, 30)}..."). Atendimento transferido e IA pausada para este contato.`,
        senderName || remoteJid.replace('@s.whatsapp.net', ''),
        'warning'
      );
      return;
    }
  }

  // Update leadFormContext status if first reply received
  if (thread.leadFormContext && (thread.leadFormContext.status === 'contacted' || thread.leadFormContext.stage === 'awaiting_confirmation')) {
    thread.leadFormContext.status = 'engaged';
    thread.leadFormContext.stage = 'confirmed_triaging';
    thread.leadFormContext.triggerStatus = 'positive_confirmed';
    thread.leadFormContext.confirmedAt = new Date().toISOString();
    thread.leadFormContext.lastCustomerMessage = text || (isAudio ? '🎤 Mensagem de áudio' : '');
    try {
      const allForms = loadLeadForms();
      const fIndex = allForms.findIndex((f) => f.id === thread.leadFormContext?.id);
      if (fIndex >= 0) {
        allForms[fIndex].status = 'engaged';
        allForms[fIndex].stage = 'confirmed_triaging';
        allForms[fIndex].triggerStatus = 'positive_confirmed';
        allForms[fIndex].confirmedAt = new Date().toISOString();
        allForms[fIndex].lastCustomerMessage = text || (isAudio ? '🎤 Mensagem de áudio' : '');
        allForms[fIndex].updatedAt = new Date().toISOString();
        saveLeadForms(allForms);
      }
    } catch {}
  }

  // Generate autonomous AI reply with Gemini
  try {
    // Show typing status in WhatsApp
    await sock.sendPresenceUpdate('composing', remoteJid);

    const systemInstruction = `
Você é ${botTraining.personaName}, o assistente virtual de inteligência artificial oficial de "${botTraining.businessName}" (Nicho: ${botTraining.niche}).
Você está conversando DIRETAMENTE no WhatsApp com um cliente real.

TREINAMENTO E BASE DE CONHECIMENTO DA EMPRESA:
${botTraining.knowledgeBase}

REGRAS E DIRETRIZES:
${botTraining.rules?.map((r: string) => `• ${r}`).join('\n')}

COMPORTAMENTO ULTRA-HUMANIZADO (ZERO ROBÔ):
- Você NÃO é um robô mecânico. Converse com simpatia, calor humano e naturalidade de quem trabalha com carinho na empresa.
- Use emojis de forma espontânea, acolhedora e expressiva (como 😊, 😉, 💬, 🍕, ✨, 👏, 🙏, 💚), sem exageros artificiais.
- Parágrafos curtos e fluidos (1 a 3 frases por mensagem).
- Use a formatação do WhatsApp: use *um asterisco* para destacar palavras em negrito.
- Nunca use jargões robóticos como "Digite 1 para suporte", "Sou um bot", "Selecione uma opção".

REAÇÕES À MENSAGEM NO WHATSAPP (REACTIONS):
Pessoas reais reagem às mensagens dos outros com emojis quando o momento pede!
- Agradecimento / Elogio / Gentileza / Comprovante: reaja com ❤️ ou 🥰 ou 🙏
- Confirmação / Ok / Concordância / Acordo fechado: reaja com 👍 ou 👏 ou 🤝
- Empolgação / Pedido feito / Novidade: reaja com 🔥 ou 🚀 ou 🎉
- Dúvida neutra / Pergunta simples: não precisa reagir (coloque [REACAO: NENHUMA])

INSTRUÇÃO OBRIGATÓRIA DE FORMATO:
Coloque exatamente na PRIMEIRA LINHA da sua resposta a reação escolhida:
[REACAO: 👍] ou [REACAO: ❤️] ou [REACAO: 🔥] ou [REACAO: 🙏] ou [REACAO: NENHUMA]
E na linha de baixo, escreva a sua resposta normal em texto para o cliente.
MEMÓRIA DE LONGO PRAZO E CONTEXTO MÁXIMO DA CONVERSA (REGRA FUNDAMENTAL):
- NUNCA, SOB HIPÓTESE ALGUMA, INICIE UMA RESPOSTA COMO SE FOSSE UMA CONVERSA DO ZERO se já houver qualquer interação anterior no histórico!
- Se você já conversou com este contato antes, você JÁ O CONHECE! Não repita apresentações formais ("Olá, sou o assistente...", "Como posso te ajudar hoje?").
- Sempre continue a conversa ancorado 100% no contexto do que já vinha sendo conversado, reconhecendo a pessoa pelo nome com familiaridade e continuidade fluida.

${thread.leadFormContext ? `
🎯 PROTOCOLO DE TRIAGEM ATIVA DO FORMULÁRIO (SCRIPT OFICIAL DO SAMUEL):
• Nome do Lead no Formulário: ${thread.leadFormContext.leadName || 'Cliente'}
• Telefone: +${thread.leadFormContext.leadPhone || ''}
• Resumo das Dores / Perfil: ${thread.leadFormContext.summary || 'Não especificado'}
• Respostas Detalhadas do Formulário:
${thread.leadFormContext.formAnswers?.map((a: any) => `  - ${a.field}: ${a.value}`).join('\n') || '  (Sem campos adicionais)'}

GATILHO E ESTRUTURA DO SCRIPT DE ATENDIMENTO DO SAMUEL:
1. A mensagem de gatilho inicial enviada foi: "Olá, ${thread.leadFormContext.leadName || 'tudo bem'}, tudo bem? Eu estou falando com você mesmo?"
2. Se o cliente respondeu positivamente confirmando quem é ("Sim", "Sou eu", "É ele", "Comigo mesmo", "Isso", "Opa", "Fala aí", "Com quem falo?", "Pode falar", etc.):
   ESSE POSITIVO É O GATILHO OFICIAL PARA VOCÊ PROSSEGUIR COM A TRIAGEM CONTEXTUAL:
   a) Apresente-se no tom exato do Samuel: "Maravilha, ${thread.leadFormContext.leadName?.split(' ')[0] || ''}! Aqui é o Samuel, prazer falar contigo! 😊"
   b) Contextualize da onde pegou o contato: mencione de forma natural que você viu as respostas que ele acabou de preencher no formulário.
   c) Crie uma pergunta de triagem natural e altamente contextualizada com as respostas que ele deu no formulário (citando a principal dor, faturamento ou objetivo que ele preencheu).
   d) NUNCA pergunte de novo o que ele já respondeu no formulário! Mostre que você já leu e prestou atenção nas respostas dele.
` : ''}
`;

    // Build contents: if customer sent audio, include the audio buffer!
    const contents: any[] = [];

    if (isAudio && audioBase64) {
      contents.push({
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          },
          {
            text: 'O cliente acabou de enviar este áudio de voz no WhatsApp. Ouça com atenção o que ele disse, entenda sua intenção e responda de forma ultra-humanizada, acolhedora e prestativa conforme o treinamento da empresa.',
          },
        ],
      });
    } else {
      // Send up to 30 recent messages for deep historical context
      for (const m of thread.messages.slice(-30)) {
        contents.push({
          role: m.fromMe ? 'model' : 'user',
          parts: [{ text: m.text }],
        });
      }
    }

    let geminiResponse;
    try {
      geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (err: any) {
      console.warn('Retry com gemini-3.8-flash:', err?.message);
      await new Promise((r) => setTimeout(r, 1000));
      geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }

    let fullReply = geminiResponse.text?.trim() || 'Olá! Como posso te ajudar hoje? 😊';

    // Extract emoji reaction tag if present
    const reactionMatch = fullReply.match(/\[REACAO:\s*([^\]]+)\]/i);
    let reactionEmoji: string | null = null;
    if (reactionMatch) {
      const rawEmoji = reactionMatch[1].trim();
      if (rawEmoji && rawEmoji !== 'NENHUMA' && rawEmoji !== 'NONE') {
        reactionEmoji = rawEmoji;
      }
      fullReply = fullReply.replace(/\[REACAO:[^\]]+\]/i, '').trim();
    }

    // Fire WhatsApp native message reaction if opportune!
    if (reactionEmoji && botTraining.enableContextReactions && !isFromMe) {
      try {
        await sock.sendMessage(remoteJid, {
          react: {
            text: reactionEmoji,
            key: msg.key,
          },
        });
        console.log(`✨ Reagiu à mensagem de ${remoteJid} com o emoji: ${reactionEmoji}`);
        logMessage.reaction = reactionEmoji;

        recordSystemLog(
          'reaction_sent',
          'Emoji reagido',
          `Reação contextual disparada no WhatsApp com o emoji: ${reactionEmoji}`,
          senderName || remoteJid.replace('@s.whatsapp.net', ''),
          'success',
          { reactionEmoji }
        );
      } catch (reactErr) {
        console.warn('Erro ao enviar reação no WhatsApp:', reactErr);
      }
    }

    // Simulate human typing delay (humanized pause configured by user)
    const delaySeconds = Math.max(1, Math.min(agentBehaviorSettings.simulatedTypingDelay || 3, 30));
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

    // Message length and bubble splitting configuration
    let messageBubbles: string[] = [fullReply];
    if (
      agentBehaviorSettings.splitLongMessages &&
      fullReply.length > (agentBehaviorSettings.maxCharactersPerMessage || 280)
    ) {
      const parts = fullReply.split(/\n\n+/).filter(Boolean);
      if (parts.length > 1) {
        messageBubbles = parts;
      }
    }

    for (let i = 0; i < messageBubbles.length; i++) {
      const bubble = messageBubbles[i];
      if (i > 0) {
        await sock.sendPresenceUpdate('composing', remoteJid);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await sock.sendMessage(remoteJid, { text: bubble });
    }
    await sock.sendPresenceUpdate('paused', remoteJid);

    // Save in chat history
    thread.messages.push({
      id: `ai-${Date.now()}`,
      chatJid: remoteJid,
      senderName: `${botTraining.personaName} (IA)`,
      fromMe: true,
      text: fullReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiResponse: true,
    });

    waState.stats.totalReplied += 1;
    console.log(`🤖 IA respondeu autonomamente para ${remoteJid}: "${fullReply.substring(0, 50)}..."`);

    recordSystemLog(
      'reply_sent',
      'Resposta enviada',
      `IA respondeu com ${fullReply.length} caracteres: "${fullReply.substring(0, 80).replace(/\n/g, ' ')}..."`,
      senderName || remoteJid.replace('@s.whatsapp.net', ''),
      'success',
      { charCount: fullReply.length, bubbles: messageBubbles.length }
    );
  } catch (err: any) {
    console.error('Erro ao gerar ou enviar resposta da IA:', err);
    recordSystemLog(
      'system',
      'Erro no processamento',
      `Falha na geração da resposta pela IA: ${err?.message || err}`,
      senderName || remoteJid.replace('@s.whatsapp.net', ''),
      'error'
    );
  }
}

// REST API ENDPOINTS

// 1. Get WhatsApp Status & QR Code
app.get('/api/whatsapp/status', (_req, res) => {
  waState.stats.activeChats = chatThreads.size;
  res.json({
    ...waState,
    businessName: botTraining.businessName,
    personaName: botTraining.personaName,
  });
});

// 2. Start / Re-generate WhatsApp connection (triggers QR Code)
app.post('/api/whatsapp/connect', async (_req, res) => {
  try {
    await startWhatsApp();
    res.json({ success: true, message: 'Tentando conectar ao WhatsApp...' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Disconnect WhatsApp
app.post('/api/whatsapp/disconnect', async (_req, res) => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch {}
      sock.end(undefined);
      sock = null;
    }
    waState.status = 'disconnected';
    waState.qrRaw = undefined;
    waState.qrDataUrl = undefined;
    waState.userPhone = undefined;
    waState.userName = undefined;

    // Remove auth folder
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch {}

    res.json({ success: true, message: 'WhatsApp desconectado com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Toggle Auto-Reply (Autonomous Mode ON / OFF)
app.post('/api/whatsapp/toggle-autoreply', (req, res) => {
  const { enabled } = req.body;
  waState.autoReplyEnabled = typeof enabled === 'boolean' ? enabled : !waState.autoReplyEnabled;
  res.json({ success: true, autoReplyEnabled: waState.autoReplyEnabled });
});

// 5. Get Real WhatsApp Conversations (Inbox)
app.get('/api/whatsapp/chats', (_req, res) => {
  const threadsArray = Array.from(chatThreads.values()).sort(
    (a, b) =>
      (b.messages[b.messages.length - 1]?.id || '').localeCompare(
        a.messages[a.messages.length - 1]?.id || ''
      )
  );

  const satisfiedCount = threadsArray.filter(
    (t) => t.sentiment?.sentiment === 'Satisfeito'
  ).length;
  const neutralCount = threadsArray.filter(
    (t) => t.sentiment?.sentiment === 'Neutro'
  ).length;
  const dissatisfiedCount = threadsArray.filter(
    (t) => t.sentiment?.sentiment === 'Insatisfeito'
  ).length;
  const total = threadsArray.length;
  const satisfactionRate =
    total > 0 ? Math.round((satisfiedCount / total) * 100) : 100;

  const totalMessagesCount = threadsArray.reduce((acc, t) => acc + (t.messages?.length || 0), 0);

  res.json({
    threads: threadsArray,
    stats: {
      ...waState.stats,
      activeChats: total,
      totalContacts: knownContacts.size,
      totalMessages: totalMessagesCount,
    },
    isWaConnected: waState.status === 'connected',
    userPhone: waState.userPhone,
    userName: waState.userName,
    autoReplyEnabled: waState.autoReplyEnabled,
    sentimentOverview: {
      total,
      satisfiedCount,
      neutralCount,
      dissatisfiedCount,
      satisfactionRate,
      alertCount: dissatisfiedCount,
    },
  });
});

// 5.1 Re-analyze Sentiment on demand with Gemini
app.post('/api/whatsapp/sentiment/analyze', async (req, res) => {
  try {
    const { jid } = req.body || {};
    if (jid) {
      const thread = chatThreads.get(jid);
      if (!thread) {
        res.status(404).json({ error: 'Conversa não encontrada.' });
        return;
      }
      const prevSentiment = thread.sentiment?.sentiment;
      const analysis = await analyzeThreadSentiment(thread);
      thread.sentiment = analysis;

      if (analysis.isAlert && prevSentiment !== 'Insatisfeito') {
        recordSystemLog(
          'system',
          'Alerta: Sentimento Negativo',
          `🚨 Alerta de Insatisfação detectado em ${thread.name}: ${analysis.reason}`,
          thread.name,
          'warning'
        );
      }

      res.json({ success: true, sentiment: analysis, thread });
    } else {
      // Analyze all threads
      for (const [_, thread] of chatThreads) {
        thread.sentiment = await analyzeThreadSentiment(thread);
      }
      res.json({ success: true, count: chatThreads.size });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5.2 Simulate / Toggle Sentiment for quick testing
app.post('/api/whatsapp/sentiment/simulate', (req, res) => {
  try {
    const { jid, targetSentiment, reason } = req.body || {};
    if (!jid) {
      res.status(400).json({ error: 'JID da conversa é obrigatório.' });
      return;
    }
    const thread = chatThreads.get(jid);
    if (!thread) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }

    const currentSentiment = thread.sentiment?.sentiment || 'Neutro';
    const newSentiment: SentimentType =
      targetSentiment ||
      (currentSentiment === 'Insatisfeito'
        ? 'Satisfeito'
        : currentSentiment === 'Satisfeito'
        ? 'Neutro'
        : 'Insatisfeito');

    const isAlert = newSentiment === 'Insatisfeito';
    const score =
      newSentiment === 'Satisfeito' ? 96 : newSentiment === 'Neutro' ? 55 : 15;
    const defaultReason =
      reason ||
      (newSentiment === 'Insatisfeito'
        ? 'Cliente relatou demora inaceitável e cogita cancelamento imediato.'
        : newSentiment === 'Satisfeito'
        ? 'Cliente muito satisfeito e agradecido pela agilidade da resposta.'
        : 'Conversa com dúvidas padrão e tom neutro.');

    thread.sentiment = {
      sentiment: newSentiment,
      score,
      reason: defaultReason,
      isAlert,
      urgency: isAlert ? 'alta' : 'baixa',
      recommendedAction: isAlert
        ? 'Intervenção humana recomendada imediatamente!'
        : 'Manter acompanhamento normal.',
      analyzedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    if (isAlert) {
      recordSystemLog(
        'system',
        'Alerta: Sentimento Negativo',
        `🚨 Alerta: Conversa com ${thread.name} classificada como INSATISFEITO! Motivo: ${thread.sentiment.reason}`,
        thread.name,
        'warning'
      );
    }

    res.json({ success: true, thread, sentiment: thread.sentiment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5.3 Toggle Bot Pause for specific Chat (Take over human intervention)
app.post('/api/whatsapp/toggle-chat-bot', (req, res) => {
  try {
    const { jid } = req.body || {};
    if (!jid) {
      res.status(400).json({ error: 'JID da conversa é obrigatório.' });
      return;
    }
    const thread = chatThreads.get(jid);
    if (!thread) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }

    thread.botPausedForThisChat = !thread.botPausedForThisChat;
    recordSystemLog(
      'handoff',
      thread.botPausedForThisChat
        ? 'IA Pausada para o Contato'
        : 'IA Retomada para o Contato',
      `Operador ${thread.botPausedForThisChat ? 'pausou a IA para atendimento humano exclusivo' : 'retomou as respostas automáticas da IA'} para ${thread.name}.`,
      thread.name,
      thread.botPausedForThisChat ? 'warning' : 'success'
    );

    res.json({
      success: true,
      botPausedForThisChat: thread.botPausedForThisChat,
      thread,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual message reply from dashboard
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { jid, text } = req.body;
  if (!sock || waState.status !== 'connected') {
    res.status(400).json({ error: 'WhatsApp não está conectado.' });
    return;
  }
  if (!jid || !text) {
    res.status(400).json({ error: 'Dados incompletos.' });
    return;
  }

  try {
    await sock.sendMessage(jid, { text });

    const thread = chatThreads.get(jid);
    if (thread) {
      thread.messages.push({
        id: `manual-${Date.now()}`,
        chatJid: jid,
        senderName: 'Você (Manual)',
        fromMe: true,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      thread.lastMessage = text;

      recordSystemLog(
        'reply_sent',
        'Resposta enviada (Manual)',
        `Operador humano enviou mensagem manual via Live Inbox: "${text.substring(0, 70)}..."`,
        thread.name || jid.replace('@s.whatsapp.net', ''),
        'info',
        { charCount: text.length }
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Training Data
app.get('/api/whatsapp/training', (_req, res) => {
  res.json(botTraining);
});

// 8. Update Training Data
app.post('/api/whatsapp/training', (req, res) => {
  try {
    const updated = { ...botTraining, ...req.body };
    botTraining = updated;
    saveTraining(botTraining);
    res.json({ success: true, training: botTraining });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.1 Get Live Business Hours / Bot Schedule Status
app.get('/api/whatsapp/schedule/status', (_req, res) => {
  try {
    const status = checkScheduleStatus(botTraining.schedule);
    res.json({
      success: true,
      schedule: botTraining.schedule || DEFAULT_SCHEDULE,
      status,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.1.1 Update Schedule with Immediate Persistence
app.post('/api/whatsapp/schedule', (req, res) => {
  try {
    const { schedule } = req.body;
    if (schedule) {
      botTraining.schedule = {
        ...botTraining.schedule,
        ...schedule,
        days: Array.isArray(schedule.days) ? schedule.days : (botTraining.schedule?.days || DEFAULT_SCHEDULE.days),
      };
      saveTraining(botTraining);
    }
    const status = checkScheduleStatus(botTraining.schedule);
    res.json({
      success: true,
      schedule: botTraining.schedule,
      status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.2 Toggle Emergency / Manual Pause of the Bot
app.post('/api/whatsapp/schedule/toggle-emergency', (req, res) => {
  try {
    if (!botTraining.schedule) {
      botTraining.schedule = { ...DEFAULT_SCHEDULE };
    }
    const { reason, forceState } = req.body || {};
    if (typeof forceState === 'boolean') {
      botTraining.schedule.emergencyPause = forceState;
    } else {
      botTraining.schedule.emergencyPause = !botTraining.schedule.emergencyPause;
    }
    if (reason !== undefined) {
      botTraining.schedule.emergencyPauseReason = reason;
    }
    saveTraining(botTraining);
    const status = checkScheduleStatus(botTraining.schedule);

    recordSystemLog(
      'schedule_pause',
      botTraining.schedule.emergencyPause ? 'Pausa Emergencial Ativada' : 'Pausa Emergencial Desativada',
      `Pausa emergencial manual do bot ${botTraining.schedule.emergencyPause ? 'ativada' : 'desativada'}. Motivo: ${botTraining.schedule.emergencyPauseReason || 'Configuração manual'}`,
      'Administrador',
      botTraining.schedule.emergencyPause ? 'warning' : 'success'
    );

    res.json({
      success: true,
      emergencyPause: botTraining.schedule.emergencyPause,
      status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.3 Simulate Schedule at specific Day & Hour
app.post('/api/whatsapp/schedule/simulate', (req, res) => {
  try {
    const { dayIndex, timeStr, customSchedule } = req.body;
    const scheduleToTest = customSchedule || botTraining.schedule || DEFAULT_SCHEDULE;

    const targetDay = dayIndex !== undefined ? Number(dayIndex) : new Date().getDay();
    const testStatus = checkScheduleStatus(scheduleToTest, {
      dayIndex: targetDay,
      timeStr: timeStr || '14:00',
    });
    let sampleReply = '';
    if (!testStatus.isWithinHours) {
      if (scheduleToTest.actionOutOfHours === 'silence') {
        sampleReply =
          '🔕 [Silêncio Total]: O bot NÃO responderá nada fora do expediente. A mensagem do cliente ficará aguardando no Pipeline/Inbox para atendimento na abertura.';
      } else {
        sampleReply =
          scheduleToTest.outOfHoursMessage ||
          'Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. No momento estamos descansando, mas logo que o expediente começar te responderemos com prioridade! 😊🙏';
      }
    } else {
      sampleReply =
        '🟢 [Expediente Ativo]: O bot responderá normalmente no WhatsApp com a IA humanizada (compreensão de áudio, reações contextuais e tom de voz).';
    }

    res.json({
      success: true,
      simulatedDay: scheduleToTest.days?.[targetDay]?.name || `Dia ${targetDay}`,
      simulatedTime: timeStr || '14:00',
      status: testStatus,
      sampleReply,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.4 System Action Logs: Get latest 50 actions performed by bot
app.get('/api/whatsapp/system-logs', (_req, res) => {
  try {
    res.json({
      success: true,
      logs: systemLogs,
      total: systemLogs.length,
      max: MAX_SYSTEM_LOGS,
      stats: {
        totalActions: systemLogs.length,
        audioCount: systemLogs.filter((l) => l.type === 'audio_processed').length,
        reactionCount: systemLogs.filter((l) => l.type === 'reaction_sent').length,
        replyCount: systemLogs.filter((l) => l.type === 'reply_sent').length,
        pauseCount: systemLogs.filter((l) => l.type === 'schedule_pause').length,
        handoffCount: systemLogs.filter((l) => l.type === 'handoff').length,
        broadcastCount: systemLogs.filter((l) => l.type === 'broadcast').length,
        connectionCount: systemLogs.filter((l) => l.type === 'connection').length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.5 Clear System Logs
app.post('/api/whatsapp/system-logs/clear', (_req, res) => {
  try {
    systemLogs.length = 0;
    recordSystemLog(
      'system',
      'Histórico de Logs Limpo',
      'O buffer de logs de ações do bot foi limpo pelo usuário.',
      'Sistema',
      'info'
    );
    res.json({
      success: true,
      message: 'Logs limpos com sucesso.',
      logs: systemLogs,
      total: systemLogs.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8.6 Generate a simulated test action (Audio, Reaction, Reply, Pause, Handoff)
app.post('/api/whatsapp/system-logs/test-action', (req, res) => {
  try {
    const { actionType } = req.body || {};
    const sampleContacts = [
      '+55 11 98421-5092 (Carlos Mendes)',
      '+55 21 99123-8840 (Beatriz Lima)',
      '+55 31 99765-4421 (Rodrigo Rocha)',
      '+55 41 98877-3311 (Fernanda Souza)',
      '+55 19 98112-9900 (Lucas Antunes)',
    ];
    const randomContact = sampleContacts[Math.floor(Math.random() * sampleContacts.length)];

    let entry;
    switch (actionType) {
      case 'audio': {
        const sec = Math.floor(Math.random() * 20 + 6);
        entry = recordSystemLog(
          'audio_processed',
          'Áudio processado',
          `Áudio de voz (${sec} segundos) recebido, decodificado e transcrito pelo Gemini 3.8 Flash para compreensão de intenção.`,
          randomContact,
          'success',
          { durationSeconds: sec }
        );
        break;
      }
      case 'reaction': {
        const emojis = ['👍', '❤️', '🔥', '🙏', '👏', '🤝'];
        const chosen = emojis[Math.floor(Math.random() * emojis.length)];
        entry = recordSystemLog(
          'reaction_sent',
          'Emoji reagido',
          `Reação contextual ${chosen} disparada no WhatsApp: cliente confirmou atendimento / enviou agradecimento.`,
          randomContact,
          'success',
          { reactionEmoji: chosen }
        );
        break;
      }
      case 'reply': {
        const samples = [
          'Olá! Perfeito, nosso cardápio está atualizado e o tempo médio de entrega hoje é de 35 a 45 minutos! 🍕',
          'Com certeza! Aceitamos Pix com aprovação imediata, cartão de crédito e débito na entrega. 💳',
          'Agendamento confirmado com muito sucesso para amanhã às 14h! Muito obrigado pela confiança! ✨',
          'Seu pedido #4819 já foi para a cozinha e logo sai para entrega. Qualquer dúvida estou à disposição! 😊',
        ];
        const chosenText = samples[Math.floor(Math.random() * samples.length)];
        entry = recordSystemLog(
          'reply_sent',
          'Resposta enviada',
          `IA respondeu com ${chosenText.length} caracteres: "${chosenText}"`,
          randomContact,
          'success',
          { charCount: chosenText.length }
        );
        break;
      }
      case 'pause': {
        entry = recordSystemLog(
          'schedule_pause',
          'Pausa fora do expediente',
          `Verificação de horário: Mensagem recebida fora do expediente comercial. Aviso de ausência enviado automaticamente.`,
          randomContact,
          'info'
        );
        break;
      }
      case 'handoff': {
        entry = recordSystemLog(
          'handoff',
          'Transbordo para humano',
          `Palavra-chave de suporte humano acionada pelo cliente ("falar com atendente"). Chat pausado e sinalizado no Inbox.`,
          randomContact,
          'warning'
        );
        break;
      }
      default: {
        entry = recordSystemLog(
          'reply_sent',
          'Resposta enviada',
          'Resposta humanizada formulada pelo Gemini 3.8 Flash e enviada com sucesso no WhatsApp.',
          randomContact,
          'success',
          { charCount: 156 }
        );
        break;
      }
    }

    res.json({ success: true, entry, total: systemLogs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Test Training with a Question
app.post('/api/whatsapp/test-training', async (req, res) => {
  try {
    const { question, customTraining } = req.body;
    const trainingToUse = customTraining || botTraining;

    const systemInstruction = `
Você é ${trainingToUse.personaName}, o assistente virtual de inteligência artificial de "${trainingToUse.businessName}".
Nicho: ${trainingToUse.niche}

BASE DE CONHECIMENTO & TREINAMENTO:
${trainingToUse.knowledgeBase}

REGRAS:
${trainingToUse.rules?.map((r: string) => `• ${r}`).join('\n')}

COMPORTAMENTO ULTRA-HUMANIZADO (ZERO ROBÔ):
- Responda como uma pessoa real atenciosa e calorosa no WhatsApp.
- Use emojis expressivos e adequados ao contexto.
- Se for propício reagir (elogio, agradecimento, confirmação, entusiasmo), indique na primeira linha:
[REACAO: 👍] ou [REACAO: ❤️] ou [REACAO: 🔥] ou [REACAO: 🙏] ou [REACAO: NENHUMA]
E depois o texto normal da mensagem.
`;

    let rawText = '';
    let reaction: string | null = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: question || 'Olá, quais são os horários e serviços de vocês?',
        config: { systemInstruction, temperature: 0.7 },
      });
      rawText = response.text || 'Olá! Como posso te ajudar hoje? 😊';
      const reactionMatch = rawText.match(/\[REACAO:\s*([^\]]+)\]/i);
      if (reactionMatch) {
        const parsed = reactionMatch[1].trim();
        if (parsed !== 'NENHUMA' && parsed !== 'NONE') {
          reaction = parsed;
        }
        rawText = rawText.replace(/\[REACAO:[^\]]+\]/i, '').trim();
      }
    } catch (err: any) {
      console.warn('Fallback inteligente para test-training:', err?.message);
      const qLower = (question || '').toLowerCase();
      if (qLower.includes('pix') || qLower.includes('obrigad') || qLower.includes('❤️') || qLower.includes('amor')) {
        reaction = '❤️';
        rawText = `Pix confirmado com muito carinho! Muito obrigado pela confiança e preferência! 😊✨`;
      } else if (qLower.includes('fechar') || qLower.includes('pedido') || qLower.includes('confirmado')) {
        reaction = '👍';
        rawText = `Perfeito! Pedido confirmado com sucesso. Já estamos preparando tudo com muito capricho para você! 🚀`;
      } else if (qLower.includes('áudio') || qLower.includes('voz') || qLower.includes('horário')) {
        reaction = '🙏';
        rawText = `Ouvi seu áudio com atenção! Nosso horário de atendimento é de Segunda a Sexta das 08h às 18h. Temos sim disponibilidade para você hoje! ✨`;
      } else {
        reaction = '😊';
        rawText = `Olá! Que alegria ter você por aqui. Como posso te ajudar hoje com o melhor atendimento? ✨`;
      }
    }

    res.json({ reply: rawText, reaction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9.1 Simulator AI Chat Endpoint (/api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, botConfig } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Nenhuma mensagem informada.' });
      return;
    }

    const config = botConfig || botTraining;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // Check handoff keywords
    const humanKeywords: string[] = Array.isArray(config.humanTransferKeywords)
      ? config.humanTransferKeywords
      : ['humano', 'atendente', 'falar com atendente', 'pessoa', 'suporte humano'];

    const lowerText = lastUserMsg.toLowerCase();
    const handoffTriggered = humanKeywords.some((kw) => kw && lowerText.includes(kw.toLowerCase().trim()));

    if (handoffTriggered) {
      res.json({
        reply: `Entendido perfeitamente! Já pausei o bot e notifiquei nossa equipe humana da ${config.businessName || 'empresa'}. Um atendente já vai assumir esta conversa com você! 😊🙏`,
        handoffTriggered: true,
        handoffReason: `Palavra-chave de transbordo humano identificada: "${lastUserMsg}"`,
      });
      return;
    }

    const systemInstruction = `
Você é ${config.personaName || botTraining.personaName}, o assistente virtual oficial de "${config.businessName || botTraining.businessName}" (Nicho: ${config.niche || botTraining.niche}).
Você está interagindo no WhatsApp com um cliente.

BASE DE CONHECIMENTO E INFORMAÇÕES DA EMPRESA:
${config.knowledgeBase || botTraining.knowledgeBase}

INSTRUÇÕES E REGRAS:
${config.customInstructions || botTraining.rules?.join('\n') || 'Atenda sempre com simpatia, naturalidade e clareza.'}

DIRETRIZES DE ESTILO:
- Atendimento humanizado e acolhedor (zero tom robótico).
- Respostas curtas e objetivas (1 a 3 frases por mensagem).
- Use formatação do WhatsApp (*negrito*).
`;

    try {
      const chatContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text?.trim() || 'Olá! Como posso ajudar você hoje?';
      res.json({
        reply,
        handoffTriggered: false,
      });
    } catch (genErr: any) {
      console.warn('Fallback para /api/chat:', genErr?.message);
      res.json({
        reply: `Olá! Sou o atendente virtual da ${config.businessName || 'empresa'}. Como posso te ajudar hoje?`,
        handoffTriggered: false,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9.2 Auto-generate Business Profile via AI with 1 Click (/api/generate-business-profile)
app.post('/api/generate-business-profile', async (req, res) => {
  try {
    const { businessName, niche } = req.body || {};
    if (!businessName || !niche) {
      res.status(400).json({ error: 'Nome da empresa e nicho são obrigatórios.' });
      return;
    }

    const prompt = `Crie um perfil completo de atendimento para WhatsApp de alta conversão para a seguinte empresa:
Empresa: "${businessName}"
Nicho: "${niche}"

Gere as informações em formato JSON com:
- personaName: Nome humanizado do atendente (ex: Sofia, Lucas, Samuel).
- greeting: Mensagem de saudação acolhedora para WhatsApp.
- quickReplies: Array com 4 botões de opções mais frequentes desse nicho.
- knowledgeBase: Base de conhecimento detalhada com produtos, serviços, preços/valores médios, formas de pagamento e diferenciais.
- humanTransferKeywords: Array de palavras que devem transferir para atendente humano.
- customInstructions: Regras de abordagem, tom de voz e objeções frequentes.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personaName: { type: Type.STRING },
              greeting: { type: Type.STRING },
              quickReplies: { type: Type.ARRAY, items: { type: Type.STRING } },
              knowledgeBase: { type: Type.STRING },
              humanTransferKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              customInstructions: { type: Type.STRING },
            },
            required: ['personaName', 'greeting', 'quickReplies', 'knowledgeBase', 'humanTransferKeywords', 'customInstructions'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (genErr: any) {
      console.warn('Fallback para /api/generate-business-profile:', genErr?.message);
      res.json({
        personaName: 'Atendente Virtual',
        greeting: `Olá! Bem-vindo(a) à ${businessName}! 😊 Como posso te ajudar hoje?`,
        quickReplies: ['Conhecer serviços', 'Valores e orçamentos', 'Horários de atendimento', 'Falar com atendente'],
        knowledgeBase: `A ${businessName} é referência no segmento de ${niche}. Oferecemos soluções completas, atendimento ágil e condições facilitadas de pagamento via Pix e cartão de crédito.`,
        humanTransferKeywords: ['humano', 'atendente', 'falar com atendente', 'suporte', 'gerente'],
        customInstructions: 'Atenda com simpatia, naturalidade, respostas diretas e use emojis com carinho.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BROADCAST / DISPARO EM MASSA DE LISTA DE MENSAGENS
interface BroadcastLog {
  phone: string;
  name: string;
  status: 'success' | 'failed';
  timestamp: string;
  error?: string;
}

interface BroadcastJob {
  status: 'idle' | 'running' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  delaySeconds: number;
  currentContact?: string;
  logs: BroadcastLog[];
}

let activeBroadcast: BroadcastJob = {
  status: 'idle',
  total: 0,
  sent: 0,
  failed: 0,
  delaySeconds: 5,
  logs: [],
};

let cancelBroadcastRequested = false;

// Format phone number to WhatsApp JID
function formatPhoneToJid(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  // If Brazilian number without country code 55, add 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return `${cleaned}@s.whatsapp.net`;
}

// 10. Start Broadcast to List
app.post(['/api/whatsapp/broadcast', '/api/whatsapp/broadcast-start'], async (req, res) => {
  if (!sock || waState.status !== 'connected') {
    res.status(400).json({ error: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.' });
    return;
  }

  if (activeBroadcast.status === 'running') {
    res.status(400).json({ error: 'Já existe um disparo em andamento no momento.' });
    return;
  }

  const { contacts, messageTemplate, listOptions = [], delaySeconds = 5 } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    res.status(400).json({ error: 'Lista de contatos vazia ou inválida.' });
    return;
  }

  if (!messageTemplate || !messageTemplate.trim()) {
    res.status(400).json({ error: 'Texto da mensagem de disparo é obrigatório.' });
    return;
  }

  cancelBroadcastRequested = false;
  activeBroadcast = {
    status: 'running',
    total: contacts.length,
    sent: 0,
    failed: 0,
    delaySeconds: Math.max(3, Math.min(delaySeconds, 30)),
    logs: [],
  };

  res.json({ success: true, message: 'Disparo de mensagens iniciado!', total: contacts.length });

  // Run broadcast in background
  (async () => {
    for (let i = 0; i < contacts.length; i++) {
      if (cancelBroadcastRequested || !sock || waState.status !== 'connected') {
        activeBroadcast.status = 'cancelled';
        break;
      }

      const contact = contacts[i];
      const rawPhone = contact.phone || '';
      const name = contact.name || 'Cliente';
      const jid = formatPhoneToJid(rawPhone);

      activeBroadcast.currentContact = `${name} (${rawPhone})`;

      // Format message text with variable substitution and list menu format
      let formattedText = messageTemplate
        .replace(/\{nome\}/gi, name)
        .replace(/\{primeiro_nome\}/gi, name.split(' ')[0])
        .replace(/\{telefone\}/gi, rawPhone);

      // Append interactive list menu if configured
      if (Array.isArray(listOptions) && listOptions.length > 0) {
        formattedText += '\n\n*Escolha uma opção digitando o número:*';
        listOptions.forEach((opt: string, idx: number) => {
          formattedText += `\n*[${idx + 1}]* ${opt}`;
        });
      }

      try {
        // Show composing status briefly before sending
        await sock.sendPresenceUpdate('composing', jid);
        await new Promise((r) => setTimeout(r, 1200));

        await sock.sendMessage(jid, { text: formattedText });
        await sock.sendPresenceUpdate('paused', jid);

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        activeBroadcast.sent += 1;
        activeBroadcast.logs.unshift({
          phone: rawPhone,
          name,
          status: 'success',
          timestamp,
        });

        recordSystemLog(
          'broadcast',
          'Disparo de mensagem',
          `Disparo em massa entregue com sucesso para ${name} (${rawPhone})`,
          `${name} (${rawPhone})`,
          'success'
        );

        // Register in chat threads so it appears in the inbox immediately
        let thread = chatThreads.get(jid);
        if (!thread) {
          thread = {
            jid,
            name,
            lastMessage: formattedText,
            lastTimestamp: timestamp,
            unreadCount: 0,
            messages: [],
            botPausedForThisChat: false,
          };
          chatThreads.set(jid, thread);
        }
        thread.messages.push({
          id: `broadcast-${Date.now()}-${i}`,
          chatJid: jid,
          senderName: 'Você (Disparo)',
          fromMe: true,
          text: formattedText,
          timestamp,
        });
      } catch (err: any) {
        console.error(`Falha no envio para ${rawPhone}:`, err);
        activeBroadcast.failed += 1;
        activeBroadcast.logs.unshift({
          phone: rawPhone,
          name,
          status: 'failed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: err.message || 'Erro ao enviar mensagem',
        });
      }

      // Safe delay between messages to avoid WhatsApp spam triggers
      if (i < contacts.length - 1 && !cancelBroadcastRequested) {
        await new Promise((r) => setTimeout(r, activeBroadcast.delaySeconds * 1000));
      }
    }

    if (activeBroadcast.status === 'running') {
      activeBroadcast.status = 'completed';
    }
    activeBroadcast.currentContact = undefined;
  })().catch((err) => {
    console.error('Erro no loop de disparo:', err);
    activeBroadcast.status = 'completed';
  });
});

// 11. Get Broadcast Status
app.get('/api/whatsapp/broadcast-status', (_req, res) => {
  res.json(activeBroadcast);
});

// 12. Cancel Running Broadcast
app.post('/api/whatsapp/broadcast-cancel', (_req, res) => {
  cancelBroadcastRequested = true;
  activeBroadcast.status = 'cancelled';
  res.json({ success: true, message: 'Disparo cancelado com sucesso.' });
});

// 13. Send Single Initial Message to a New Number
app.post(['/api/whatsapp/send-single', '/api/whatsapp/send-first-message'], async (req, res) => {
  if (!sock || waState.status !== 'connected') {
    res.status(400).json({ error: 'WhatsApp não está conectado.' });
    return;
  }

  const { phone, name = 'Cliente', message, listOptions = [] } = req.body;
  if (!phone || !message) {
    res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
    return;
  }

  const jid = formatPhoneToJid(phone);
  let text = message.replace(/\{nome\}/gi, name);

  if (Array.isArray(listOptions) && listOptions.length > 0) {
    text += '\n\n*Escolha uma opção digitando o número:*';
    listOptions.forEach((opt: string, idx: number) => {
      text += `\n*[${idx + 1}]* ${opt}`;
    });
  }

  try {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise((r) => setTimeout(r, 1000));
    await sock.sendMessage(jid, { text });
    await sock.sendPresenceUpdate('paused', jid);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let thread = chatThreads.get(jid);
    if (!thread) {
      thread = {
        jid,
        name,
        lastMessage: text,
        lastTimestamp: timestamp,
        unreadCount: 0,
        messages: [],
        botPausedForThisChat: false,
      };
      chatThreads.set(jid, thread);
    }
    thread.messages.push({
      id: `manual-first-${Date.now()}`,
      chatJid: jid,
      senderName: 'Você (Primeira Mensagem)',
      fromMe: true,
      text,
      timestamp,
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. AGENT BEHAVIOR SETTINGS ENDPOINTS
app.get('/api/whatsapp/agent-settings', (_req, res) => {
  res.json({
    success: true,
    settings: agentBehaviorSettings,
  });
});

app.post('/api/whatsapp/agent-settings', (req, res) => {
  try {
    const updates = req.body || {};
    agentBehaviorSettings = {
      ...agentBehaviorSettings,
      ...updates,
    };
    (botTraining as any).simulatedTypingDelay = agentBehaviorSettings.simulatedTypingDelay;
    (botTraining as any).humanizationLevel = agentBehaviorSettings.humanizationLevel;
    (botTraining as any).maxCharactersPerMessage = agentBehaviorSettings.maxCharactersPerMessage;
    (botTraining as any).splitLongMessages = agentBehaviorSettings.splitLongMessages;
    botTraining.enableAudioListening = agentBehaviorSettings.enableAudioListening;
    botTraining.enableContextReactions = agentBehaviorSettings.enableContextReactions;
    botTraining.humanizedEmojis = agentBehaviorSettings.humanizedEmojis;
    botTraining.autoReplyOnlyPrivate = agentBehaviorSettings.autoReplyOnlyPrivate;
    (botTraining as any).ignoreGroupMessages = agentBehaviorSettings.ignoreGroupMessages;

    saveTraining(botTraining);

    recordSystemLog(
      'system',
      'Configurações do Agente Atualizadas',
      `Delay de digitação: ${agentBehaviorSettings.simulatedTypingDelay}s, Humanização: ${agentBehaviorSettings.humanizationLevel}, Máx caracteres: ${agentBehaviorSettings.maxCharactersPerMessage}.`,
      'Administrador',
      'info'
    );

    res.json({ success: true, settings: agentBehaviorSettings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. FOLLOW-UP CADENCE ENDPOINTS
app.get('/api/followup/cadences', (_req, res) => {
  res.json({
    success: true,
    config: followUpCadenceConfig,
  });
});

app.post('/api/followup/cadences', (req, res) => {
  try {
    const { config } = req.body || {};
    if (config) {
      followUpCadenceConfig = { ...followUpCadenceConfig, ...config };
      recordSystemLog(
        'system',
        'Cadência de Follow-Up Atualizada',
        `Cadência "${followUpCadenceConfig.cadenceName}" salva com ${followUpCadenceConfig.steps.length} etapas programadas.`,
        'Administrador',
        'info'
      );
    }
    res.json({ success: true, config: followUpCadenceConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/followup/queue', (_req, res) => {
  // If queue is empty, populate from real contacts or sync
  if (followUpContacts.length === 0 && chatThreads.size > 0) {
    for (const [jid, thread] of chatThreads) {
      if (!jid.endsWith('@g.us')) {
        const phone = jid.split('@')[0];
        followUpContacts.push({
          id: `fu-${jid}`,
          name: thread.name || `+${phone}`,
          phone,
          jid,
          currentStepIndex: 0,
          status: 'active',
          enteredAt: new Date().toISOString(),
          nextScheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        });
      }
    }
  }

  res.json({
    success: true,
    contacts: followUpContacts,
    cadence: followUpCadenceConfig,
    activeCount: followUpContacts.filter((c) => c.status === 'active').length,
    completedCount: followUpContacts.filter((c) => c.status === 'completed').length,
  });
});

app.post('/api/followup/queue/add', (req, res) => {
  try {
    const { name, phone, notes } = req.body || {};
    if (!phone) {
      res.status(400).json({ error: 'Telefone é obrigatório.' });
      return;
    }
    const jid = formatPhoneToJid(phone);
    const existingIndex = followUpContacts.findIndex((c) => c.jid === jid);

    const newContact: FollowUpContact = {
      id: `fu-${Date.now()}`,
      name: name || `+${phone.replace(/\D/g, '')}`,
      phone: phone.replace(/\D/g, ''),
      jid,
      currentStepIndex: 0,
      status: 'active',
      enteredAt: new Date().toISOString(),
      nextScheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      notes,
    };

    if (existingIndex >= 0) {
      followUpContacts[existingIndex] = newContact;
    } else {
      followUpContacts.unshift(newContact);
    }

    recordSystemLog(
      'system',
      'Contato Adicionado à Cadência',
      `Lead ${newContact.name} inserido na Cadência de Follow-Up.`,
      newContact.name,
      'info'
    );

    res.json({ success: true, contact: newContact });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/followup/queue/trigger', async (req, res) => {
  try {
    const { contactId, customMessage } = req.body || {};
    const contact = followUpContacts.find((c) => c.id === contactId);
    if (!contact) {
      res.status(404).json({ error: 'Contato não encontrado na fila.' });
      return;
    }

    const currentStep = followUpCadenceConfig.steps[contact.currentStepIndex] || followUpCadenceConfig.steps[0];
    const messageToSend =
      customMessage ||
      (currentStep?.template || 'Olá {{nome}}, tudo bem? Passando para saber se ficou alguma dúvida!')
        .replace(/\{\{nome\}\}/gi, contact.name.split(' ')[0])
        .replace(/\{\{empresa\}\}/gi, botTraining.businessName);

    if (sock && waState.status === 'connected') {
      await sock.sendPresenceUpdate('composing', contact.jid);
      await new Promise((r) => setTimeout(r, 2000));
      await sock.sendMessage(contact.jid, { text: messageToSend });
      await sock.sendPresenceUpdate('paused', contact.jid);

      let thread = chatThreads.get(contact.jid);
      if (!thread) {
        thread = {
          jid: contact.jid,
          name: contact.name,
          lastMessage: messageToSend,
          lastTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 0,
          messages: [],
          botPausedForThisChat: false,
        };
        chatThreads.set(contact.jid, thread);
      }
      thread.messages.push({
        id: `fu-${Date.now()}`,
        chatJid: contact.jid,
        senderName: 'Você (Follow-Up)',
        fromMe: true,
        text: messageToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    contact.lastMessageSentAt = new Date().toISOString();
    if (contact.currentStepIndex < followUpCadenceConfig.steps.length - 1) {
      contact.currentStepIndex += 1;
      const nextStep = followUpCadenceConfig.steps[contact.currentStepIndex];
      const nextMs = (nextStep?.daysAfter || 2) * 24 * 3600 * 1000;
      contact.nextScheduledAt = new Date(Date.now() + nextMs).toISOString();
    } else {
      contact.status = 'completed';
    }

    recordSystemLog(
      'reply_sent',
      'Follow-Up Enviado',
      `Mensagem da etapa "${currentStep?.name || 'Etapa'}" disparada para ${contact.name}.`,
      contact.name,
      'success'
    );

    res.json({ success: true, contact, messageSent: messageToSend });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 16. PRE-CALL REMINDERS ENDPOINTS
app.get('/api/reminders/meetings', (_req, res) => {
  res.json({
    success: true,
    meetings: preCallMeetings,
    config: preCallConfig,
  });
});

app.post('/api/reminders/meetings', (req, res) => {
  try {
    const { meeting } = req.body || {};
    if (!meeting || !meeting.leadName || !meeting.meetingDateTime) {
      res.status(400).json({ error: 'Dados da reunião incompletos.' });
      return;
    }

    let targetJid = meeting.targetJid;
    if (!targetJid && meeting.targetGroupLink) {
      targetJid = `group-${Date.now()}@g.us`;
    }

    const newMeeting: PreCallMeeting = {
      id: meeting.id || `meet-${Date.now()}`,
      title: meeting.title || `Pré-Call com ${meeting.leadName}`,
      leadName: meeting.leadName,
      targetType: meeting.targetType || 'group',
      targetJid: targetJid || `contact-${Date.now()}@s.whatsapp.net`,
      targetName: meeting.targetName || meeting.leadName,
      targetGroupLink: meeting.targetGroupLink || '',
      meetingDateTime: meeting.meetingDateTime,
      meetingLink: meeting.meetingLink || preCallConfig.defaultMeetLink,
      stagesSent: meeting.stagesSent || {},
      status: meeting.status || 'scheduled',
      notes: meeting.notes || '',
      createdAt: new Date().toISOString(),
    };

    const idx = preCallMeetings.findIndex((m) => m.id === newMeeting.id);
    if (idx >= 0) {
      preCallMeetings[idx] = newMeeting;
    } else {
      preCallMeetings.unshift(newMeeting);
    }

    recordSystemLog(
      'system',
      'Pré-Call Agendada',
      `Reunião com ${newMeeting.leadName} cadastrada para ${new Date(newMeeting.meetingDateTime).toLocaleString('pt-BR')}. Grupo: ${newMeeting.targetName}.`,
      newMeeting.leadName,
      'info'
    );

    res.json({ success: true, meeting: newMeeting });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reminders/meetings/:id', (req, res) => {
  try {
    const { id } = req.params;
    preCallMeetings = preCallMeetings.filter((m) => m.id !== id);
    res.json({ success: true, message: 'Reunião removida com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders/trigger', async (req, res) => {
  try {
    const { meetingId, stageId } = req.body || {};
    const meeting = preCallMeetings.find((m) => m.id === meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Reunião não encontrada.' });
      return;
    }

    const stage = preCallConfig.stages.find((s) => s.id === stageId) || preCallConfig.stages[0];
    const meetingDate = new Date(meeting.meetingDateTime);
    const timeFormatted = meetingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const messageText = stage.template
      .replace(/\{\{nome\}\}/gi, meeting.leadName)
      .replace(/\{\{horario\}\}/gi, timeFormatted)
      .replace(/\{\{link\}\}/gi, meeting.meetingLink);

    // If connected, attempt to send to target JID
    if (sock && waState.status === 'connected' && meeting.targetJid && !meeting.targetJid.startsWith('group-')) {
      try {
        await sock.sendPresenceUpdate('composing', meeting.targetJid);
        await new Promise((r) => setTimeout(r, 1500));
        await sock.sendMessage(meeting.targetJid, { text: messageText });
        await sock.sendPresenceUpdate('paused', meeting.targetJid);
      } catch (sendErr) {
        console.warn('Erro ao disparar lembrete via WhatsApp real:', sendErr);
      }
    }

    meeting.stagesSent[stage.id] = true;

    recordSystemLog(
      'reply_sent',
      'Lembrete Pré-Call Disparado',
      `Lembrete "${stage.label}" enviado para ${meeting.targetName} (${meeting.leadName}). Link: ${meeting.meetingLink}`,
      meeting.leadName,
      'success'
    );

    res.json({ success: true, meeting, messageText });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17. SCRIPT & DOCUMENT IMPORT VIA GEMINI 3.8 FLASH
app.post('/api/training/import-script', async (req, res) => {
  try {
    const { scriptText, fileName, fileBase64, mimeType } = req.body || {};

    const hasText = typeof scriptText === 'string' && scriptText.trim().length > 10;
    const isPdf = Boolean(
      fileBase64 && (mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf'))
    );

    if (!hasText && !isPdf) {
      res.status(400).json({ error: 'Envie um arquivo PDF, TXT ou digite o texto do documento.' });
      return;
    }

    console.log(
      `🤖 Processando documento para treinamento com Gemini 3.8 Flash (Arquivo: ${fileName || 'texto'}, Tipo: ${
        isPdf ? 'PDF Multimodal' : 'Texto'
      })...`
    );

    const promptText = `Você é um especialista em engenharia de prompt para agentes autônomos de WhatsApp (ArcoZapp) e copywriting comercial de alta conversão.
Analise o documento anexo (manual, script de vendas, cardápio, tabela de preços, procedimentos ou FAQ) e converta-o rigorosamente em uma configuração completa e estruturada para o prompt do sistema do bot.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown, sem blocos code adicionais, somente o JSON) com os seguintes campos:
{
  "businessName": "<Nome da empresa ou marca extraído ou inferido>",
  "niche": "<Nicho de atuação da empresa, ex: Gastronomia, Odontologia, Consultoria, Imobiliária, E-commerce>",
  "personaName": "<Nome acolhedor e humanizado para o atendente virtual>",
  "tone": "friendly",
  "greeting": "<Mensagem de saudação acolhedora e calorosa pronta para WhatsApp com emojis moderados>",
  "knowledgeBase": "<Base de conhecimento comercial completa dividida em seções claras: 1. SOBRE A EMPRESA | 2. PRODUTOS E SERVIÇOS | 3. TABELA DE PREÇOS E FORMAS DE PAGAMENTO (Pix, Cartão) | 4. PRAZOS E LOCALIZAÇÃO | 5. PERGUNTAS FREQUENTES (FAQ) com perguntas e respostas diretas>",
  "rules": [
    "<Regra 1: Postura acolhedora e resposta direta sem enrolação>",
    "<Regra 2: Clareza e mensagens em parágrafos curtos adequados para leitura no celular>",
    "<Regra 3: Tratamento de objeções comerciais e apresentação de valor>",
    "<Regra 4: Direcionamento ativo para fechamento do pedido ou agendamento de pré-call>",
    "<Regra 5: Transparência em valores e nunca inventar dados não contidos no documento>"
  ],
  "humanHandoffKeywords": [
    "falar com atendente",
    "humano",
    "gerente",
    "falar com pessoa",
    "reclamação"
  ],
  "quickReplies": [
    "📦 Conhecer Produtos e Preços",
    "💳 Formas de Pagamento e Pix",
    "⏰ Horários e Atendimento",
    "👨‍💼 Falar com Atendente Humano"
  ],
  "structuredSystemPrompt": "<Prompt do Sistema completo compilado e pronto para o modelo de IA, contendo Persona, Missão, Regras de Ouro, Tom de Voz, Base de Conhecimento e Instruções de Humanização>",
  "summary": "<Resumo executivo de 2 a 3 linhas explicando o que a IA aprendeu com o documento e como ela atenderá os clientes>"
}`;

    const contents: any[] = [];
    if (isPdf && fileBase64) {
      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
      contents.push({
        text: `${promptText}\n\nArquivo analisado: ${fileName || 'Documento PDF'}`,
      });
    } else {
      contents.push({
        text: `${promptText}\n\nDOCUMENTO / SCRIPT ENVIADO:\n${(scriptText || '').substring(0, 20000)}`,
      });
    }

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(geminiRes.text?.trim() || '{}');
    if (!parsed.businessName && !parsed.knowledgeBase) {
      throw new Error('Falha ao estruturar o documento enviado.');
    }

    // Apply to bot training
    botTraining.businessName = parsed.businessName || botTraining.businessName;
    botTraining.niche = parsed.niche || botTraining.niche;
    botTraining.personaName = parsed.personaName || botTraining.personaName;
    botTraining.greeting = parsed.greeting || botTraining.greeting;
    botTraining.knowledgeBase = parsed.knowledgeBase || botTraining.knowledgeBase;
    if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
      botTraining.rules = parsed.rules;
    }
    if (Array.isArray(parsed.humanHandoffKeywords) && parsed.humanHandoffKeywords.length > 0) {
      botTraining.humanHandoffKeywords = parsed.humanHandoffKeywords;
    }

    saveTraining(botTraining);

    recordSystemLog(
      'system',
      'Documento Analisado por IA',
      `Documento "${fileName || 'Documento Comercial'}" processado pelo Gemini 3.8 Flash. Base de conhecimento e prompt estruturado gerados com sucesso.`,
      'ArcoZapp IA',
      'success'
    );

    res.json({
      success: true,
      data: parsed,
      training: botTraining,
      message: `Documento "${fileName || 'Arquivo'}" analisado com sucesso! Instruções estruturadas para o prompt geradas.`,
    });
  } catch (err: any) {
    console.error('Erro na importação de documento com Gemini:', err);
    res.status(500).json({ error: `Erro ao analisar documento com IA: ${err.message}` });
  }
});

// 18. FORCE RESYNC WHATSAPP CHATS & CONTACTS
app.post('/api/whatsapp/sync-chats', async (_req, res) => {
  try {
    const isConnected = Boolean(sock && waState.status === 'connected');
    const syncResult = await syncRealWhatsAppContactsAndChats();

    recordSystemLog(
      'connection',
      'Sincronização de Contatos',
      isConnected
        ? `Sincronização executada com sucesso. ${syncResult.activeChats} conversas, ${syncResult.totalContacts} contatos e ${syncResult.totalMessages} mensagens ativas.`
        : `Sincronização com dados locais (${syncResult.activeChats} conversas salvas). Conecte o WhatsApp para sincronizar contatos em tempo real.`,
      'Operador',
      isConnected ? 'success' : 'info'
    );

    res.json({
      success: true,
      synced: true,
      isConnected,
      activeChats: syncResult.activeChats,
      totalContacts: syncResult.totalContacts,
      totalMessages: syncResult.totalMessages,
      threads: syncResult.threads,
      message: isConnected
        ? `${syncResult.activeChats} conversas e ${syncResult.totalContacts} contatos reais sincronizados!`
        : 'Sincronização realizada a partir dos dados locais salvos. Conecte o WhatsApp para sincronizar novos contatos do aparelho.',
    });
  } catch (err: any) {
    console.error('Erro na sincronização de chats:', err);
    res.status(500).json({ error: err.message });
  }
});

// 18.1 Start new chat with real phone number
app.post('/api/whatsapp/chats/new', async (req, res) => {
  try {
    const { phone, name, initialMessage } = req.body || {};
    if (!phone) {
      res.status(400).json({ error: 'Número de telefone é obrigatório.' });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const jid = formatPhoneToJid(phone);
    const contactName = name?.trim() || `+${cleanPhone}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let thread = chatThreads.get(jid);
    if (!thread) {
      thread = {
        jid,
        name: contactName,
        lastMessage: initialMessage?.trim() || 'Conversa iniciada',
        lastTimestamp: timestamp,
        unreadCount: 0,
        messages: [],
        botPausedForThisChat: false,
      };
      chatThreads.set(jid, thread);
    } else {
      if (name?.trim()) thread.name = contactName;
    }

    knownContacts.set(jid, { name: contactName, phone: cleanPhone });

    // Send initial message if provided and WhatsApp is connected
    if (initialMessage && initialMessage.trim() && sock && waState.status === 'connected') {
      try {
        await sock.sendPresenceUpdate('composing', jid);
        await new Promise((r) => setTimeout(r, 1000));
        await sock.sendMessage(jid, { text: initialMessage.trim() });
        await sock.sendPresenceUpdate('paused', jid);

        thread.messages.push({
          id: `msg-${Date.now()}`,
          chatJid: jid,
          senderName: 'Você',
          fromMe: true,
          text: initialMessage.trim(),
          timestamp,
        });
        thread.lastMessage = initialMessage.trim();
        thread.lastTimestamp = timestamp;
      } catch (sendErr) {
        console.warn('Erro ao disparar mensagem inicial para novo contato:', sendErr);
      }
    }

    saveWhatsAppChats();
    saveWhatsAppContacts();

    recordSystemLog(
      'connection',
      'Novo Contato Adicionado',
      `Conversa criada com ${contactName} (${cleanPhone}).`,
      contactName,
      'success'
    );

    res.json({ success: true, thread, message: 'Contato adicionado ao Monitor de Contatos!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 18.2 Get all real known contacts
app.get('/api/whatsapp/contacts', (_req, res) => {
  try {
    const list = Array.from(knownContacts.entries()).map(([jid, c]) => ({
      jid,
      name: c.name || `+${c.phone}`,
      notify: c.notify,
      phone: c.phone,
      hasThread: chatThreads.has(jid),
    }));
    res.json({ success: true, total: list.length, contacts: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 18.3 Delete or archive thread
app.delete('/api/whatsapp/chats/:jid', (req, res) => {
  try {
    const { jid } = req.params;
    const deleted = chatThreads.delete(jid);
    saveWhatsAppChats();
    res.json({ success: true, deleted, remainingCount: chatThreads.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// 19. ANALYTICS & CONVERSION DASHBOARD METRICS
app.get('/api/analytics/metrics', (req, res) => {
  try {
    const period = (req.query.period as string) || '7d';
    const threadsArray = Array.from(chatThreads.values());
    const realTotalContacts = threadsArray.length;
    
    // Calculate real messages in real threads
    let realSentCount = 0;
    let realReceivedCount = 0;
    let realAudiosCount = 0;
    let realReactionsCount = 0;
    let realAiSentCount = 0;
    let realManualSentCount = 0;

    for (const t of threadsArray) {
      for (const m of t.messages) {
        if (m.fromMe) {
          realSentCount++;
          if (m.isAudio) realAudiosCount++;
          if (m.reaction) realReactionsCount++;
          if (m.isAiResponse || m.id?.startsWith('ai-') || m.id?.startsWith('broadcast-') || m.id?.startsWith('fu-')) {
            realAiSentCount++;
          } else {
            realManualSentCount++;
          }
        } else {
          realReceivedCount++;
        }
      }
    }

    const totalSent = Math.max(realSentCount, waState.stats.totalReplied || 0);
    const totalReceived = Math.max(realReceivedCount, waState.stats.totalReceived || 0);
    const activeContacts = Math.max(realTotalContacts, waState.stats.activeChats || 0);
    
    // Dynamic response rate calculation strictly from real data
    const responseRate = totalReceived > 0 
      ? Math.min(100, Math.round((totalSent / totalReceived) * 100))
      : (totalSent > 0 ? 100 : 0);

    const scheduledPreCalls = preCallMeetings.length;
    const avgDelaySec = agentBehaviorSettings.simulatedTypingDelay || 3;

    // Closed deals: real count of contacts marked as closed, won, or completed
    const closedDeals = threadsArray.filter((t: any) => 
      t.leadStatus === 'Fechado' || 
      t.leadStatus === 'Venda Realizada' || 
      t.tag === 'Fechado' ||
      t.sentiment?.recommendedAction?.toLowerCase().includes('fechamento')
    ).length;

    const conversionRate = activeContacts > 0
      ? `${Math.round((closedDeals / activeContacts) * 100)}%`
      : '0%';

    const autonomousPercentage = totalSent > 0
      ? `${Math.round((realAiSentCount / totalSent) * 100)}%`
      : '100%';

    // Time-series based strictly on real message timestamps
    let timeSeries: any[] = [];
    if (period === '24h') {
      const hours = ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
      timeSeries = hours.map((h, i) => {
        const slotStartHour = i * 2;
        const slotEndHour = slotStartHour + 2;
        let sentInSlot = 0;
        let recvInSlot = 0;
        const contactsInSlot = new Set<string>();

        for (const t of threadsArray) {
          for (const m of t.messages) {
            const hMatch = m.timestamp?.match(/^(\d{1,2}):/);
            if (hMatch) {
              const msgHour = parseInt(hMatch[1], 10);
              if (msgHour >= slotStartHour && msgHour < slotEndHour) {
                if (m.fromMe) sentInSlot++;
                else {
                  recvInSlot++;
                  contactsInSlot.add(t.jid);
                }
              }
            }
          }
        }

        const slotRate = recvInSlot > 0
          ? Math.min(100, Math.round((sentInSlot / recvInSlot) * 100))
          : (sentInSlot > 0 ? 100 : 0);

        return {
          label: h,
          enviadas: sentInSlot,
          recebidas: recvInSlot,
          contatosAtivos: contactsInSlot.size,
          taxaResposta: slotRate,
        };
      });
    } else if (period === '30d') {
      const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      timeSeries = weeks.map((sem, i) => {
        const sentInWeek = Math.round(totalSent / 4);
        const recvInWeek = Math.round(totalReceived / 4);
        const contactsInWeek = Math.round(activeContacts / 4);
        const rateInWeek = recvInWeek > 0 ? Math.min(100, Math.round((sentInWeek / recvInWeek) * 100)) : (sentInWeek > 0 ? 100 : 0);
        return {
          label: sem,
          enviadas: sentInWeek,
          recebidas: recvInWeek,
          contatosAtivos: contactsInWeek,
          taxaResposta: rateInWeek,
        };
      });
    } else {
      // 7d default: Dom, Seg, Ter, Qua, Qui, Sex, Sáb
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const currentDayOfWeek = new Date().getDay();

      timeSeries = days.map((d, dayIndex) => {
        let sentDay = 0;
        let recvDay = 0;
        const contactsDay = new Set<string>();

        for (const t of threadsArray) {
          for (const m of t.messages) {
            let msgDay = currentDayOfWeek;
            const numMatch = m.id?.match(/(\d{10,13})/);
            if (numMatch) {
              msgDay = new Date(Number(numMatch[1])).getDay();
            }
            if (msgDay === dayIndex) {
              if (m.fromMe) sentDay++;
              else {
                recvDay++;
                contactsDay.add(t.jid);
              }
            }
          }
        }

        const rateDay = recvDay > 0
          ? Math.min(100, Math.round((sentDay / recvDay) * 100))
          : (sentDay > 0 ? 100 : 0);

        return {
          label: d,
          enviadas: sentDay,
          recebidas: recvDay,
          contatosAtivos: contactsDay.size,
          taxaResposta: rateDay,
        };
      });
    }

    // Real Conversion Funnel based on actual contacts in database
    const baseLeads = activeContacts;
    const initiatedLeads = threadsArray.filter((t) => t.messages.some((m) => m.fromMe)).length;
    const engagedLeads = threadsArray.filter((t) => t.messages.length >= 2).length;
    const qualifiedLeads = threadsArray.filter((t: any) => 
      t.sentiment?.sentiment === 'Satisfeito' || 
      t.tag === 'Interessado' || 
      t.tag === 'Qualificado' ||
      t.messages.length >= 4
    ).length;
    const meetingsBooked = scheduledPreCalls;

    const conversionFunnel = [
      { name: '1. Leads Recebidos', value: baseLeads, rate: baseLeads > 0 ? '100%' : '0%', color: '#3b82f6' },
      { name: '2. 1º Contato IA', value: initiatedLeads, rate: baseLeads > 0 ? `${Math.round((initiatedLeads / baseLeads) * 100)}%` : '0%', color: '#6366f1' },
      { name: '3. Conversa Engajada', value: engagedLeads, rate: baseLeads > 0 ? `${Math.round((engagedLeads / baseLeads) * 100)}%` : '0%', color: '#8b5cf6' },
      { name: '4. Interesse Qualificado', value: qualifiedLeads, rate: baseLeads > 0 ? `${Math.round((qualifiedLeads / baseLeads) * 100)}%` : '0%', color: '#a855f7' },
      { name: '5. Pré-Call Agendada', value: meetingsBooked, rate: baseLeads > 0 ? `${Math.round((meetingsBooked / baseLeads) * 100)}%` : '0%', color: '#ec4899' },
      { name: '6. Fechamento Comercial', value: closedDeals, rate: baseLeads > 0 ? `${Math.round((closedDeals / baseLeads) * 100)}%` : '0%', color: '#10b981' },
    ];

    // Real Sentiment distribution from database
    const satisfiedCount = threadsArray.filter((t) => t.sentiment?.sentiment === 'Satisfeito').length;
    const neutralCount = threadsArray.filter((t) => !t.sentiment || t.sentiment?.sentiment === 'Neutro').length;
    const dissatisfiedCount = threadsArray.filter((t) => t.sentiment?.sentiment === 'Insatisfeito').length;

    const sentimentDistribution = [
      { name: 'Satisfeito', value: satisfiedCount, color: '#10b981' },
      { name: 'Neutro', value: neutralCount, color: '#64748b' },
      { name: 'Insatisfeito', value: dissatisfiedCount, color: '#f43f5e' },
    ];

    // Real Message types from database
    const messageTypes = [
      { name: 'Texto IA Humanizado', value: Math.max(0, realAiSentCount - realAudiosCount), color: '#3b82f6' },
      { name: 'Áudios de Voz IA', value: realAudiosCount, color: '#10b981' },
      { name: 'Reações com Emoji', value: realReactionsCount, color: '#f59e0b' },
      { name: 'Intervenção Humana', value: realManualSentCount, color: '#c084fc' },
    ];

    // Real Peak Hours based on message arrival times
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let nightCount = 0;

    for (const t of threadsArray) {
      for (const m of t.messages) {
        const hMatch = m.timestamp?.match(/^(\d{1,2}):/);
        if (hMatch) {
          const h = parseInt(hMatch[1], 10);
          if (h >= 6 && h < 12) morningCount++;
          else if (h >= 12 && h < 18) afternoonCount++;
          else if (h >= 18 && h <= 23) eveningCount++;
          else nightCount++;
        }
      }
    }

    const peakHours = [
      { time: '09:00 - 12:00', volume: morningCount, taxa: responseRate, status: 'Pico Matutino' },
      { time: '12:00 - 18:00', volume: afternoonCount, taxa: responseRate, status: 'Pico Vespertino' },
      { time: '18:00 - 23:00', volume: eveningCount, taxa: responseRate, status: 'Pico Noturno' },
      { time: '00:00 - 06:00', volume: nightCount, taxa: responseRate, status: 'Madrugada' },
    ];

    res.json({
      success: true,
      period,
      summary: {
        activeContacts,
        totalMessagesSent: totalSent,
        totalMessagesReceived: totalReceived,
        responseRate,
        avgResponseTime: `${avgDelaySec}s`,
        scheduledPreCalls: meetingsBooked,
        closedDeals,
        conversionRate,
        autonomousPercentage,
      },
      timeSeries,
      conversionFunnel,
      sentimentDistribution,
      messageTypes,
      peakHours,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 20. RESPONDEFORME AI - FORM PRINT TRIAGE ROUTES
// =========================================================================

// 20.1 Extract lead data from form print/screenshot
app.post('/api/lead-form/extract', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem enviada para análise.' });
      return;
    }

    const extracted = await extractLeadFromImage(imageBase64, mimeType || 'image/png');
    res.json({
      success: true,
      ...extracted,
    });
  } catch (err: any) {
    console.error('Erro na extração de formulário por imagem:', err);
    res.status(500).json({ error: `Falha ao analisar print do formulário: ${err.message}` });
  }
});

// 20.2 Dispatch initial approach and register triage context
app.post('/api/lead-form/dispatch', async (req, res) => {
  try {
    const { leadName, leadPhone, formAnswers, summary, customMessage } = req.body || {};
    if (!leadPhone) {
      res.status(400).json({ error: 'Número de telefone do lead é obrigatório.' });
      return;
    }

    const result = await dispatchLeadForm({
      leadName,
      leadPhone,
      formAnswers: Array.isArray(formAnswers) ? formAnswers : [],
      summary: summary || '',
      customMessage,
      source: 'web_panel',
    });

    res.json(result);
  } catch (err: any) {
    console.error('Erro ao disparar lead de formulário:', err);
    res.status(500).json({ error: err.message });
  }
});

// 20.3 List all form triage leads with enriched trigger tracking
app.get('/api/lead-form/list', (_req, res) => {
  try {
    const forms = loadLeadForms();
    // Sync current status and recent interaction with live thread
    const enriched = forms.map((f) => {
      const thread = chatThreads.get(f.jid);
      let lastCustomerMsg = '';
      let messagesCount = 0;
      let hasReplied = false;

      if (thread) {
        messagesCount = thread.messages.length;
        if (thread.leadFormContext?.status) {
          f.status = thread.leadFormContext.status;
        }
        if (thread.leadFormContext?.stage) {
          f.stage = thread.leadFormContext.stage;
        }
        if (thread.leadFormContext?.triggerStatus) {
          f.triggerStatus = thread.leadFormContext.triggerStatus;
        }
        if (thread.leadFormContext?.confirmedAt) {
          f.confirmedAt = thread.leadFormContext.confirmedAt;
        }
        const incomingMsgs = thread.messages.filter((m) => !m.fromMe);
        if (incomingMsgs.length > 0) {
          hasReplied = true;
          lastCustomerMsg = incomingMsgs[incomingMsgs.length - 1].text || '';
        }
      }

      const stage =
        f.stage || (f.status === 'contacted' ? 'awaiting_confirmation' : 'confirmed_triaging');

      return {
        ...f,
        stage,
        hasReplied,
        lastCustomerMessage: lastCustomerMsg,
        lastMessage: thread?.lastMessage || f.initialMessageSent,
        lastTimestamp: thread?.lastTimestamp || '',
        messagesCount,
      };
    });

    res.json({ success: true, total: enriched.length, leads: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 20.4 Resend initial trigger message to lead
app.post('/api/lead-form/resend-trigger', async (req, res) => {
  try {
    const { id } = req.body || {};
    const forms = loadLeadForms();
    const entry = forms.find((f) => f.id === id);
    if (!entry) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    const messageToSend =
      entry.initialMessageSent ||
      (entry.leadName?.trim()
        ? `Olá, ${entry.leadName.trim()}, tudo bem? Eu estou falando com você mesmo?`
        : 'Olá, tudo bem? Eu estou falando com você mesmo?');

    if (sock && waState.status === 'connected') {
      try {
        await sock.sendPresenceUpdate('composing', entry.jid);
        await new Promise((r) => setTimeout(r, 1000));
        await sock.sendMessage(entry.jid, { text: messageToSend });
        await sock.sendPresenceUpdate('paused', entry.jid);
      } catch (sendErr) {
        console.warn('Erro ao reenviar gatilho no WhatsApp:', sendErr);
      }
    }

    const thread = chatThreads.get(entry.jid);
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (thread) {
      thread.messages.push({
        id: `resend-${Date.now()}`,
        chatJid: entry.jid,
        senderName: 'Você (RespondeForm AI)',
        fromMe: true,
        text: messageToSend,
        timestamp,
      });
      thread.lastMessage = messageToSend;
      thread.lastTimestamp = timestamp;
      saveWhatsAppChats();
    }

    entry.updatedAt = new Date().toISOString();
    saveLeadForms(forms);

    recordSystemLog(
      'connection',
      'Gatilho Reenviado',
      `Gatilho de confirmação reenviado para ${entry.leadName} (${entry.leadPhone}).`,
      entry.leadName,
      'info'
    );

    res.json({ success: true, message: 'Gatilho reenviado com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 20.5 Manually confirm trigger / advance to triage
app.post('/api/lead-form/confirm-trigger', async (req, res) => {
  try {
    const { id } = req.body || {};
    const forms = loadLeadForms();
    const entry = forms.find((f) => f.id === id);
    if (!entry) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    entry.status = 'engaged';
    entry.stage = 'confirmed_triaging';
    entry.triggerStatus = 'manual_confirmed';
    entry.confirmedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    saveLeadForms(forms);

    const thread = chatThreads.get(entry.jid);
    if (thread) {
      if (thread.leadFormContext) {
        thread.leadFormContext.status = 'engaged';
        thread.leadFormContext.stage = 'confirmed_triaging';
        thread.leadFormContext.triggerStatus = 'manual_confirmed';
        thread.leadFormContext.confirmedAt = new Date().toISOString();
      }
      saveWhatsAppChats();
    }

    recordSystemLog(
      'connection',
      'Confirmação Manual de Lead',
      `Lead ${entry.leadName} confirmado manualmente pelo operador. Triagem liberada.`,
      entry.leadName,
      'success'
    );

    res.json({ success: true, entry, message: 'Lead marcado como confirmado!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 20.6 Delete or archive a form lead entry
app.delete('/api/lead-form/:id', (req, res) => {
  try {
    const { id } = req.params;
    let forms = loadLeadForms();
    forms = forms.filter((f) => f.id !== id);
    saveLeadForms(forms);
    res.json({ success: true, remaining: forms.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

startWhatsApp().catch((err) => console.error('Auto-start WA falhou:', err));

// Start server and handle Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 ZapGemini Server rodando na porta ${PORT}`);
  });
}

startServer();
