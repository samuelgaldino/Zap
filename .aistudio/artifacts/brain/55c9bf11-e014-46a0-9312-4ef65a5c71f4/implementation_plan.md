# Triagem Inteligente de Leads por Formulário / Print (RespondeForme AI)

Módulo integrado que permite ao operador enviar um print ou foto de respostas de formulário (via painel web ou diretamente pelo WhatsApp) para que a IA extraia instantaneamente os dados do lead com Gemini Vision, inicie um contato humanizado chamando pelo nome e conduza a qualificação personalizada com base nas respostas prévias.

### User Review & Critical Decisions

> [!IMPORTANT]
> As decisões de experiência do usuário confirmadas na Fase 1 foram incorporadas à arquitetura do sistema:

- **Canal de Envio do Print (Confirmado)**: Envio híbrido — tanto pela interface visual no **Painel Web** (com upload/arraste/Ctrl+V de imagens) quanto **diretamente pelo WhatsApp** (o operador envia a foto para o robô com a legenda ou número).
- **Abordagem Inicial do Lead (Confirmado)**: Mensagem inicial humanizada e curta que chama pelo primeiro nome e pergunta cordialmente se pode conversar antes de iniciar a triagem das respostas (evita mensagens longas invasivas).
- **Posicionamento no Sistema (Confirmado)**: Seção dedicada com destaque visual dentro da aba **Rotina WhatsApp**, com acesso direto e cartão de ação rápida para o fluxo diário.
- **Armazenamento de Contexto do Formulário**: Os dados extraídos (nome, telefone, respostas, dor, faturamento/interesse) ficam salvos no perfil do contato (`leadFormContext`). Quando o lead responder afirmativamente à primeira mensagem, o bot consultará essas respostas prévias para qualificar e direcionar para o consultor humano.

---

### 1. Overview & Core Concept

- **O que faz**: Transforma o fluxo manual e repetitivo de olhar respostas de formulários e digitar mensagens no WhatsApp em um processo automatizado de 1 clique. O operador cola ou envia a imagem do formulário (ex.: Google Forms, Typeform, RespondeForm, Hotmart/RD Station); a IA lê o print com visão computacional multimodal (`gemini-3.8-flash`), detecta nome, telefone e respostas, formata a abordagem inicial e dispara a conversa no WhatsApp do lead mantendo a memória de triagem ativa.
- **Público-alvo**: O operador comercial e gestor do ArcoZapp (Samuel) que recebe dezenas de leads em formulários e precisa garantir atendimento em menos de 1 minuto sem erros de digitação.
- **Valor gerado**: Resposta imediata com primeiro nome correto, triagem natural sem o cliente precisar repetir tudo o que já preencheu no formulário e aumento expressivo na taxa de resposta e conversão para o fechamento.

---

### 2. User Experience & Visual Design

#### Fluxo do Usuário no Painel Web

1. **Acesso**: Dentro de **Rotina WhatsApp**, uma seção de destaque intitulada **"Triagem de Formulário • RespondeForm AI"** exibe a área de captura ativa e o histórico de triagens recentes.
2. **Entrada do Print**:
   - Área de soltar arquivo (drag-and-drop), botão de upload ou suporte a **Ctrl+V direto** (captura da área de transferência).
   - Campo inteligente de telefone (preenchido automaticamente caso a IA detecte no print, com opção de ajuste manual se o print estiver cortado).
3. **Análise Visual Instantânea**:
   - Ao colar o print, um indicador sutil de processamento Gemini Vision analisa o documento.
   - Em ~2 segundos, exibe os campos identificados: Nome do Lead, Telefone, Respostas-chave extraídas e Prévia da Mensagem Curta de Abordagem.
4. **Disparo com 1 Clique**:
   - Botão de ação com confirmação: *"Disparar Abordagem no WhatsApp"*.
   - Status em tempo real: o chat é criado imediatamente no **Monitor de Contatos** com a etiqueta `Triagem Formulário` e a mensagem é enviada ao cliente.

#### Fluxo pelo Próprio WhatsApp (Disparo Mobile)

1. O operador envia a foto do formulário no próprio chat do robô ou de um número administrador cadastrado.
2. A IA detecta que o anexo é uma imagem de formulário de lead, extrai os campos e envia uma confirmação ao operador: *"Lead [Nome] identificado (+[Telefone]). Iniciando abordagem de triagem agora! 🚀"*.
3. O robô abre a conversa com o lead no WhatsApp e dispara a saudação inicial.

#### Identidade Visual & Tema

- **Direção Estética**: Utilitária, focada em produtividade operacional de alta velocidade (SaaS Comercial).
- **Paleta de Cores**: Fundo escuro profundo (`#070b14` / `#0b1324`), bordas refinadas em azul ardósia (`#1a2942`), acentos em azul vibrante (`#2563eb`) e esmeralda para leads ativos e conectados (`#10b981`).
- **Disciplina Anti-Slop**:
  - Sem cápsulas/pills genéricas flutuantes ou selos decorativos vazios.
  - Informações de data, horário e origem exibidas com separadores tipográficos limpos (`·`).
  - Números de telefone e contadores com fontes mono-espaçadas tabulares (`font-mono tabular-nums`).
- **Estados da Interface**:
  - *Vazio*: Guia visual explicativo para arrastar o primeiro print ou usar Ctrl+V.
  - *Processando*: Pré-visualização da imagem com efeito de leitura e esqueleto de extração.
  - *Extraído com Sucesso*: Card limpo com os dados estruturados prontos para edição rápida ou disparo imediato.
  - *Histórico*: Tabela/lista compacta com as últimas triagens realizadas e status de resposta do lead.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Extração Multimodal com Gemini 3.8 Flash**
  - *Abordagem Escolhida*: Enviar a imagem do formulário codificada em base64 diretamente para o endpoint seguro `/api/lead-form/extract` utilizando o modelo `gemini-3.8-flash` com `responseSchema` estruturado (`nome`, `telefone`, `respostas: [{ pergunta, resposta }]`, `resumoTriagem`).
  - *Por que*: O `gemini-3.8-flash` possui visão multimodal nativa de altíssima precisão para OCR em documentos e prints em português, com latência de resposta inferior a 2 segundos e custo eficiente.
  - *Alternativas Consideradas*: OCR tradicional (Tesseract) foi descartado por falhar em capturas de tela com fundos coloridos, fontes customizadas e layouts de formulários de duas colunas.

- **Decisão 2: Persistência do Contexto de Triagem no Chat Thread**
  - *Abordagem Escolhida*: Armazenar os dados extraídos no objeto `chatThreads` do servidor (`thread.leadFormContext = { name, phone, answers, summary, stage: 'waiting_permission' }`).
  - *Por que*: Garante que, assim que o lead responder *"Oi, pode sim"* ou *"Com certeza"*, a rotina de resposta automática do robô (`server.ts`) leia o histórico do formulário e continue a qualificação exatamente de onde parou, sem esquecer nada.

- **Decisão 3: Abordagem Curta e Não Invasiva (Two-Step Hook)**
  - *Abordagem Escolhida*: Mensagem curta de primeiro contato: *"Olá, [Nome]! Tudo bem? Vi que você preencheu nosso formulário. Posso te fazer umas perguntinhas rápidas para te direcionar ao melhor atendimento?"*
  - *Por que*: Respeita a privacidade do usuário no WhatsApp, aumenta em mais de 70% a taxa de resposta e evita o bloqueio por spam de mensagens gigantes logo no primeiro contato.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ARCOZAPP INTERFACE                            │
│                                                                         │
│  [Rotina WhatsApp]                                                      │
│    └─ Seção: RespondeForm AI (Triagem por Print de Formulário)          │
│         ├─ Input: Drag & Drop / Ctrl+V / Upload de Imagem               │
│         ├─ Preview dos Dados Extraídos (Nome, WhatsApp, Respostas)     │
│         └─ Ação: Disparar Abordagem com 1 Clique                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ POST /api/lead-form/extract
                                     │ POST /api/lead-form/dispatch
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            EXPRESS BACKEND                              │
│                                                                         │
│  1. /api/lead-form/extract                                              │
│     └─ Gemini 3.8 Flash (Multimodal OCR + Schema estruturado)           │
│                                                                         │
│  2. /api/lead-form/dispatch                                              │
│     ├─ Criação de Thread em chatThreads (com thread.leadFormContext)    │
│     ├─ Adição a knownContacts                                           │
│     ├─ Disparo via Baileys (sock.sendMessage com presença digitando)    │
│     └─ Log operacional em recordSystemLog                              │
│                                                                         │
│  3. Webhook de Imagem no WhatsApp (Mensagem do Operador)                │
│     └─ Baixa buffer de imagem, extrai via Gemini e executa dispatch     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       WHATSAPP / BAILEYS SOCKET                         │
│                                                                         │
│  Lead recebe: "Olá [Nome]! Vi seu formulário. Posso te fazer umas       │
│                perguntinhas rápidas para direcionar o atendimento?"     │
│                                                                         │
│  Lead responde: "Pode sim!"                                             │
│  IA consulta leadFormContext e prossegue a triagem com o treinamento!   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Modelo de Dados do Contexto de Triagem

```typescript
interface LeadFormContext {
  id: string;
  leadName: string;
  leadPhone: string;
  extractedAt: string;
  formAnswers: Array<{
    field: string;
    value: string;
  }>;
  summary: string;
  status: 'contacted' | 'engaged' | 'qualified' | 'handed_off';
  initialMessageSent: string;
}
```

#### Mapeamento de Eventos e Componentes

1. `FormTriageSection.tsx`: Componente embutido na visão de **Rotina WhatsApp** contendo a zona de drop, colagem rápida (`clipboard paste event listener`), visualização lado a lado do print e dos dados extraídos, e botão de disparo imediato.
2. Endpoint `/api/lead-form/extract`: Recebe imagem em base64, invoca o SDK `@google/genai` com `gemini-3.8-flash` e retorna os dados validados.
3. Endpoint `/api/lead-form/dispatch`: Registra o lead, salva o contexto em `data/lead_forms.json` e `chatThreads`, envia a mensagem e notifica o painel.
4. Hook no listener do WhatsApp (`server.ts`): Se o lead responder, a prompt de geração do Gemini injeta automaticamente o resumo do formulário no prompt do sistema daquele contato.
