import { BotConfig } from '../types';

export function getMetaCloudApiCode(config: BotConfig): string {
  return `/**
 * Bot de WhatsApp com IA Google Gemini (100% Gratuito)
 * Integrado à API Oficial da Meta (WhatsApp Cloud API)
 * 
 * 1. Obtenha sua API Key grátis em: https://aistudio.google.com
 * 2. Crie seu App de WhatsApp grátis em: https://developers.facebook.com
 * 3. Instale as dependências: npm install express @google/genai dotenv
 * 4. Execute: node bot.js
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'meu_token_secreto_zap';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Inicializa a IA Gemini (Google AI Studio)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' }
  }
});

// Configurações do seu bot: "${config.businessName}"
const SYSTEM_PROMPT = \`
Você é ${config.personaName}, o assistente virtual de inteligência artificial de "${config.businessName}".
Nicho: ${config.niche}
Tom de voz: ${config.tone}

DIRETRIZES PARA O WHATSAPP:
- Responda em parágrafos curtos (1 a 3 frases por mensagem).
- Use a formatação do WhatsApp: use *um asterisco* para negrito.
- Use emojis amigáveis.
- Nunca invente preços ou horários que não estejam na Base de Conhecimento.

BASE DE CONHECIMENTO:
${config.knowledgeBase.replace(/`/g, '\\`')}

INSTRUÇÕES EXTRAS:
${config.customInstructions.replace(/`/g, '\\`')}

TRANSBORDO HUMANO:
Se o cliente pedir atendimento humano explicitamente ou tiver uma reclamação grave, inclua ao final: [TRANSBORDO_HUMANO].
\`;

// 1. Rota de Validação do Webhook pelo Facebook/Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado com sucesso pela Meta!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Rota que recebe mensagens enviadas pelos clientes no WhatsApp
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Responde imediatamente à Meta para não reenviar

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Ignora se não for mensagem de texto enviada por usuário
    if (!message || message.type !== 'text') return;

    const fromNumber = message.from; // Número de WhatsApp do cliente
    const userText = message.text.body; // Mensagem digitada pelo cliente

    console.log(\`📩 Mensagem de \${fromNumber}: "\${userText}"\`);

    // Envia o prompt para a IA Gemini
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const replyText = geminiResponse.text || 'Olá! Poderia repetir por gentileza?';

    // Envia a resposta de volta ao WhatsApp do cliente
    await sendWhatsAppMessage(fromNumber, replyText);
    console.log(\`🚀 Resposta enviada com sucesso para \${fromNumber}!\`);
  } catch (error) {
    console.error('❌ Erro ao processar mensagem do WhatsApp:', error);
  }
});

// Função para enviar mensagem de volta usando a Graph API da Meta
async function sendWhatsAppMessage(to, text) {
  const url = \`https://graph.facebook.com/v21.0/\${PHONE_NUMBER_ID}/messages\`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${ACCESS_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(JSON.stringify(errData));
  }
}

app.listen(PORT, () => {
  console.log(\`🤖 Bot rodando na porta \${PORT}\`);
  console.log(\`👉 Configure seu Webhook no Meta Developers com a URL: https://seu-dominio.com/webhook\`);
});
`;
}

export function getEvolutionApiCode(config: BotConfig): string {
  return `/**
 * Bot de WhatsApp com IA Gemini via Evolution API (Open-Source / QR Code)
 * 100% Grátis: Conecte qualquer número pessoal ou WhatsApp Business lendo QR Code!
 * 
 * Requisitos:
 * 1. Uma instância Evolution API rodando (grátis no Koyeb/Render ou no seu PC via Docker)
 * 2. API Key Gemini grátis: https://aistudio.google.com
 * 
 * Instalação: npm install express @google/genai dotenv
 * Execução: node bot-evolution.js
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'minha_chave_evolution';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'atendimento';

// Inicializa a IA Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const SYSTEM_PROMPT = \`
Você é ${config.personaName}, o assistente virtual de inteligência artificial de "${config.businessName}".
Nicho: ${config.niche}

BASE DE CONHECIMENTO:
${config.knowledgeBase.replace(/`/g, '\\`')}

FORMATO WHATSAPP:
- Respostas curtas e acolhedoras.
- Destaques com *um asterisco*.
- Emojis adequados.
\`;

// Webhook da Evolution API para novas mensagens
app.post('/webhook/evolution', async (req, res) => {
  res.sendStatus(200);

  try {
    const event = req.body.event;
    if (event !== 'messages.upsert') return;

    const data = req.body.data;
    const isFromMe = data.key?.fromMe;
    if (isFromMe) return; // Não responder a si mesmo

    const remoteJid = data.key?.remoteJid;
    const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text;

    if (!remoteJid || !messageText) return;

    console.log(\`📩 Recebido de \${remoteJid}: "\${messageText}"\`);

    // Pergunta ao Gemini
    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: messageText,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const reply = geminiRes.text || 'Obrigado pela mensagem!';

    // Envia mensagem via Evolution API
    await fetch(\`\${EVOLUTION_URL}/message/sendText/\${INSTANCE_NAME}\`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: remoteJid.replace('@s.whatsapp.net', ''),
        text: reply,
      }),
    });

    console.log(\`✅ Resposta enviada para \${remoteJid}\`);
  } catch (err) {
    console.error('Erro:', err);
  }
});

app.listen(PORT, () => {
  console.log(\`🤖 Evolution Bot escutando na porta \${PORT}\`);
});
`;
}

export function getPythonFastApiCode(config: BotConfig): string {
  return `"""
Bot de Atendimento WhatsApp com Gemini e FastAPI (Python)
100% Gratuito

Dependências:
pip install fastapi uvicorn google-genai httpx python-dotenv

Como rodar:
uvicorn main:app --reload --port 3000
"""

import os
import httpx
from fastapi import FastAPI, Request, Response
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Inicializa Gemini Client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"headers": {"User-Agent": "aistudio-build"}}
)

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "meu_token_secreto_zap")
ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

SYSTEM_PROMPT = """
Você é ${config.personaName}, assistente virtual de "${config.businessName}".
Nicho: ${config.niche}

BASE DE CONHECIMENTO:
${config.knowledgeBase}

Instruções para WhatsApp: Seja amigável, use parágrafos curtos e *negrito* do WhatsApp.
"""

@app.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    return Response(status_code=403)

@app.post("/webhook")
async def receive_message(request: Request):
    data = await request.json()
    
    try:
        entry = data.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages or messages[0].get("type") != "text":
            return {"status": "ignored"}
            
        from_number = messages[0]["from"]
        user_text = messages[0]["text"]["body"]
        
        # Chama a IA Gemini
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=user_text,
            config={"system_instruction": SYSTEM_PROMPT}
        )
        
        reply_text = response.text or "Olá, como posso ajudar?"
        
        # Envia de volta para a API da Meta
        async with httpx.AsyncClient() as http_client:
            await http_client.post(
                f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages",
                headers={
                    "Authorization": f"Bearer {ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                json={
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": from_number,
                    "type": "text",
                    "text": {"body": reply_text}
                }
            )
            
    except Exception as e:
        print(f"Erro ao processar: {e}")
        
    return {"status": "ok"}
`;
}

export function getEnvExampleContent(): string {
  return `# Chave de API Gratuita do Google Gemini (pegue em https://aistudio.google.com)
GEMINI_API_KEY=AIzaSy...

# Dados da Meta WhatsApp Cloud API (pegue em https://developers.facebook.com)
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_zap
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=109283746501928

# Configuração de Porta
PORT=3000
`;
}

export function getN8nWorkflowJson(config: BotConfig): string {
  return JSON.stringify(
    {
      name: `Bot WhatsApp Gemini - ${config.businessName}`,
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: 'webhook-whatsapp',
            responseMode: 'responseNode',
          },
          id: '1',
          name: 'Webhook WhatsApp',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [100, 300],
        },
        {
          parameters: {
            model: 'gemini-3.8-flash',
            prompt: `={{ $json.body.entry[0].changes[0].value.messages[0].text.body }}`,
            systemInstruction: `Você é ${config.personaName} da empresa ${config.businessName}.\n\nBase:\n${config.knowledgeBase}`,
          },
          id: '2',
          name: 'Google Gemini',
          type: '@n8n/n8n-nodes-langchain.openAiOrGemini',
          position: [350, 300],
        },
        {
          parameters: {
            method: 'POST',
            url: 'https://graph.facebook.com/v21.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}',
                },
              ],
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: 'messaging_product', value: 'whatsapp' },
                {
                  name: 'to',
                  value: '={{ $json.body.entry[0].changes[0].value.messages[0].from }}',
                },
                {
                  name: 'text',
                  value: '={"body": $json.output }',
                },
              ],
            },
          },
          id: '3',
          name: 'Enviar Resposta WhatsApp',
          type: 'n8n-nodes-base.httpRequest',
          position: [600, 300],
        },
      ],
      connections: {
        'Webhook WhatsApp': {
          main: [[{ node: 'Google Gemini', type: 'main', index: 0 }]],
        },
        'Google Gemini': {
          main: [[{ node: 'Enviar Resposta WhatsApp', type: 'main', index: 0 }]],
        },
      },
    },
    null,
    2
  );
}
