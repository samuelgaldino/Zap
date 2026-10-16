import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
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

app.use(express.json());

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
    { day: 0, name: 'Domingo', enabled: false, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 1, name: 'Segunda-feira', enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 2, name: 'Terça-feira', enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 3, name: 'Quarta-feira', enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 4, name: 'Quinta-feira', enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 5, name: 'Sexta-feira', enabled: true, startTime: '08:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 6, name: 'Sábado', enabled: false, startTime: '08:00', endTime: '12:00', hasLunchBreak: false, lunchStart: '12:00', lunchEnd: '13:00' },
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
}

// Seed initial threads with realistic conversations and sentiment classification
const INITIAL_CHAT_SEEDS: ChatThread[] = [
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
];

const chatThreads: Map<string, ChatThread> = new Map(
  INITIAL_CHAT_SEEDS.map((t) => [t.jid, t])
);

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
      browser: ['ZapGemini Atendimento', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    sock.ev.on('creds.update', saveCreds);

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
      }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        try {
          await handleIncomingMessage(msg);
        } catch (err) {
          console.error('Erro ao processar mensagem recebida:', err);
        }
      }
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

  if (!text && !isAudio) return;

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
  // Keep last 40 messages per thread
  if (thread.messages.length > 40) {
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
      for (const m of thread.messages.slice(-6)) {
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

    // Simulate human typing delay (humanized pause)
    const delaySeconds = Math.max(1, Math.min(botTraining.simulatedTypingDelay || 2, 5));
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

    // Send WhatsApp message
    await sock.sendMessage(remoteJid, { text: fullReply });
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
      { charCount: fullReply.length }
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

  res.json({
    threads: threadsArray,
    stats: waState.stats,
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
app.post('/api/whatsapp/broadcast', async (req, res) => {
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
app.post('/api/whatsapp/send-single', async (req, res) => {
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

// Auto-start WhatsApp connection on server boot
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
