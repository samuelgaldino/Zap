# ArcoZapp - Central Inteligente de Atendimento, Follow-Up e Lembretes

Transformação da plataforma no **ArcoZapp**: um ecossistema operacional de alta conversão para WhatsApp, eliminando tutoriais e dados fictícios, integrando sincronização direta de contatos e histórico do WhatsApp conectado, cadências personalizáveis de follow-up, automação modular de lembretes de pré-call em grupos, importador de scripts por IA e controle granular de humanização do agente.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário na etapa de alinhamento:
> - **Navegação**: A aba "Pipeline Ao Vivo" passa a se chamar **"Monitor de Contatos"**.
> - **Execução de Follow-Up e Lembretes**: Fila visual operacional com disparo automatizado e opção de envio manual com 1 clique.
> - **Gestão de Lembretes Pré-Call**: Cadastro manual e flexível por nome ou link do grupo, com parametrização modular dos tempos de disparo (ex: 24h, 2h, 15min antes).
> - **Branding**: Atualização do nome da plataforma para **ArcoZapp** e remoção da frase *"Foco em processos, follow-up, reuniões e alta conversão comercial"*.
> - **Privacidade & Limpeza de Código**: Ocultação/remoção de tutoriais, n8n e exportadores de código que não pertencem à rotina do operador; foco em funcionalidades 100% ativas no sistema.
> - **Leads Reais**: Remoção completa de leads mock/fictícios, exibindo exclusivamente contatos e histórico reais do WhatsApp conectado via Baileys.

---

## 1. Overview & Core Concept

O **ArcoZapp** é uma plataforma corporativa de automação conversacional humanizada para WhatsApp, desenhada para fechar vendas, nutrir leads e garantir o comparecimento em reuniões (pré-call). 

A plataforma conecta-se diretamente a uma sessão real do WhatsApp (via Baileys/WebSockets) e utiliza inteligência artificial **Gemini 3.8 Flash** para ler mensagens, processar áudios de voz, reagir com emojis contextuais e responder com naturalidade humana configurável.

### Principais Pilares da Versão:
1. **Identidade ArcoZapp**: Interface limpa, profissional, sem códigos expostos ou tutoriais técnicos.
2. **Monitor de Contatos (Ex-Pipeline)**: Exibição exclusiva de contatos e conversas reais do WhatsApp sincronizado, com filtros, análise de sentimento em tempo real e histórico de mensagens.
3. **Módulo de Follow-Up com Cadência Flexível**: Criação de sequências com intervalos de dias customizáveis, estilos de mensagem e tags dinâmicas.
4. **Módulo de Lembretes Pré-Call em Grupos**: Agendamento modular para avisar participantes de reuniões em intervalos estratégicos (24h, 2h, 15min antes), com link da sala e status de entrega.
5. **Importador de Scripts por IA no Treinamento**: Upload de documentos (.txt, .pdf, .docx) ou inserção de scripts de vendas, convertidos automaticamente pelo Gemini em regras de atendimento e prompts de alta conversão.
6. **Configurações Comportamentais do Agente**: Ajuste de delay de digitação (simulação de digitação), nível de humanização (erros naturais, pontuação leve), limite de caracteres por mensagem e envio de áudios automáticos.

---

## 2. User Experience & Visual Design

### A. Estrutura de Navegação Superior (Navbar)
- **Marca**: Ícone "A" estilizado com logotipo **ArcoZapp**, tag "PRO / BUSINESS" discreta.
- **Abas Funcionais Atualizadas**:
  1. `Rotina WhatsApp`: Conexão por QR Code, status da sessão, bateria e sinal.
  2. `Monitor de Contatos`: Caixa de entrada e histórico real sincronizado, sentimento IA e controle manual/autônomo.
  3. `Follow-Up`: Gestão de cadências, regras de dias (D+1, D+3, D+7), estilos e fila de disparos.
  4. `Lembretes Pré-Call`: Gestão modular de reuniões agendadas, grupos do WhatsApp e lembretes automáticos.
  5. `Disparo de Lista`: Transmissão em lote com pausas humanizadas anti-ban.
  6. `Treinamento IA`: Importação de scripts por documento, base de conhecimento e editor de prompt.
  7. `Configurações & Agente`: Ajustes comportamentais do agente (delay, humanização, caracteres), horários de atendimento e Logs do Sistema (50 últimas ações).
- **Sem poluição**: Remoção da aba técnica de deploy/tutoriais (`RenderDeployGuide`) e exportação de código bruto.

### B. Módulo: Follow-Up & Cadência Flexível
- **Visualizador de Cadências**:
  - Cards de etapas com badges de dias (Ex: *Etapa 1: 1 dia após contato*, *Etapa 2: 3 dias após sem resposta*, *Etapa 3: 7 dias pós-proposta*).
  - Estilos de mensagem configuráveis: *Abordagem Leve*, *Gatilho de Urgência*, *Material de Apoio*, *Quebra de Objeção*, *Check-in Amigável*.
  - Variáveis dinâmicas: `{{nome}}`, `{{empresa}}`, `{{data}}`.
- **Fila Operacional**:
  - Tabela com contatos elegíveis para follow-up, próxima etapa, preview da mensagem gerada e botão de disparo manual ou ativação automática.

### C. Módulo: Lembretes Pré-Call (Grupos de Reunião)
- **Cadastro Modular de Pré-Call**:
  - Nome do Lead / Prospect.
  - Nome ou link do grupo de WhatsApp da call.
  - Data e horário da reunião agendada.
  - Link da reunião (Google Meet / Zoom).
- **Trilhas de Lembretes Modulares (Toggles on/off)**:
  - *24 horas antes*: Confirmação de agenda e pauta preliminar.
  - *2 horas antes*: Lembrete de preparação e link da sala.
  - *15 minutos antes*: Chamada final ("Estamos entrando na sala!").
  - *No horário*: "Sala aberta, aguardando você".
- **Status em Tempo Real**: Fila de lembretes pendentes, enviados e falhas com registro em log.

### D. Módulo de Treinamento: Importação de Scripts por IA
- **Área de Importação**:
  - Zona de upload de arquivo ou colagem direta de texto do script/manual comercial.
  - Botão de ação: *"Analisar com IA & Gerar Instruções do ArcoZapp"*.
  - Processamento inteligente com feedback visual: extrai proposta de valor, tom de voz, objeções comuns, preços e tabela de serviços.
  - Aplicação instantânea ao prompt mestre do bot.

### E. Módulo: Configurações Comportamentais do Agente
- **Tempo de Resposta**: Slider de delay de 3 a 30 segundos com simulação de "digitando..." no WhatsApp.
- **Nível de Humanização**: Baixo (corporativo formal), Médio (atendimento amigável e empático), Alto (uso de gírias suaves, abreviações naturais como "vc", "obg", correções espontâneas).
- **Tamanho Máximo de Caracteres**: Limite de 120 a 500 caracteres, com quebra automática em múltiplos balões curtos.
- **Modo Áudio**: Opção de responder dúvidas frequentes por áudio humanizado ou apenas texto.

---

## 3. Technical Architecture & Data Strategy

### Diagrama de Arquitetura do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ARCOZAPP UI                               │
├─────────────────┬───────────────────┬────────────────┬─────────────────┤
│ Monitor Contatos│   Follow-Up Hub   │ Lembretes Call │ Treinamento IA  │
│  (Leads Reais)  │ (Cadência / Fila) │ (Grupos / Pre) │(Importar Script)│
└────────┬────────┴─────────┬─────────┴────────┬───────┴────────┬────────┘
         │                  │                  │                │
         ▼                  ▼                  ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ARCOZAPP BACKEND SERVER                         │
├────────────────────────────────────────────────────────────────────────┤
│  REST Endpoints:                                                       │
│  • /api/whatsapp/chats (Apenas contatos reais & histórico sincronizado) │
│  • /api/followup/cadences & /api/followup/queue                        │
│  • /api/reminders/meetings & /api/reminders/trigger                    │
│  • /api/training/import-script (Processamento via Gemini 3.8 Flash)    │
│  • /api/whatsapp/agent-settings (Humanização, delay, max caracteres)   │
│  • /api/whatsapp/system-logs (Últimas 50 ações em tempo real)          │
├────────────────────────────────┬───────────────────────────────────────┤
│     GEMINI 3.8 FLASH SDK       │             BAILEYS ENGINE            │
│  • Análise de Script Comercial │  • Sincronização de Contatos Reais    │
│  • Resposta e Sentimento       │  • Histórico de Mensagens Baileys     │
│  • Síntese de Prompts          │  • Envio Humanizado de Mensagens      │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Estruturas de Dados Chave (`src/types.ts`)

1. **FollowUpCadence & FollowUpStep**:
   - `id`, `name`, `active`, `steps: FollowUpStep[]`
   - `FollowUpStep`: `dayOffset` (dias após evento), `style` (amigável, quebra de objeção, oferta), `template` (texto dinâmico), `includeAudioPrompt` (boolean).

2. **PreCallMeeting & PreCallReminder**:
   - `id`, `clientName`, `groupNameOrLink`, `groupJid`, `meetingTime`, `meetUrl`, `notes`.
   - `remindersConfig`: `{ reminder24h: boolean, reminder2h: boolean, reminder15m: boolean, reminderAtCall: boolean }`.
   - `status`: `'agendado' | 'em_andamento' | 'concluido' | 'cancelado'`.

3. **AgentBehaviorSettings**:
   - `responseDelayMin`: number (segundos)
   - `responseDelayMax`: number (segundos)
   - `humanizationLevel`: `'formal' | 'natural' | 'ultra_humanizado'`
   - `maxCharacters`: number (ex: 280)
   - `splitLongMessages`: boolean
   - `audioReplyEnabled`: boolean

4. **ChatThread (Leads Reais WhatsApp)**:
   - Zerado de mocks estáticos; preenchido estritamente pelos contatos e mensagens recebidas/armazenadas na sessão ativa do WhatsApp.

---

## 4. Plano de Implementação por Etapas

1. **Limpeza e Branding Global**:
   - Atualizar referências de nome para "ArcoZapp" em cabeçalhos, títulos e rodapés.
   - Remover a frase *"Foco em processos, follow-up, reuniões e alta conversão comercial"*.
   - Renomear a aba de atendimento para *"Monitor de Contatos"*.
   - Eliminar os componentes e guias de tutoriais/código exportado (`RenderDeployGuide`, exportações n8n).

2. **Eliminação de Fake Leads e Sincronização Real**:
   - Remover arrays estáticos `INITIAL_CHAT_SEEDS` do `server.ts`.
   - Implementar persistência e escuta de eventos reais de chats (`chats.upsert`, `messages.upsert`, `contacts.upsert`) na sessão Baileys.
   - Adicionar estado visual de zero contatos com instrução para conectar o WhatsApp real.

3. **Novo Módulo: Follow-Up & Cadências**:
   - Criar `src/components/FollowUpManager.tsx` com interface para construir cadências em múltiplos dias e estilos de mensagem.
   - Adicionar fila visual de acompanhamento com botão de disparo manual e opção de envio automático.
   - Adicionar endpoints `/api/followup/*` no `server.ts`.

4. **Novo Módulo: Lembretes Pré-Call em Grupos**:
   - Criar `src/components/PreCallReminders.tsx` para cadastro de reuniões por grupo, link de sala e configuração modular de tempos de aviso.
   - Adicionar cron/timer de verificação periódica no servidor para envio pontual dos lembretes aos grupos.
   - Adicionar endpoints `/api/reminders/*` no `server.ts`.

5. **Importador de Scripts no Treinamento**:
   - Adicionar aba no `TrainingStudio.tsx` com suporte a drag-and-drop de arquivos de script (.txt, .pdf, .docx) ou colagem de texto.
   - Criar endpoint `/api/training/import-script` com chamada ao Gemini 3.8 Flash para ler o documento e extrair regras de atendimento e sintetizar o prompt do bot.

6. **Painel de Configurações Comportamentais do Agente**:
   - Criar sub-aba ou controles dedicados para tempo de resposta (delay em segundos), nível de humanização, limite de caracteres e quebra de mensagens.
   - Integrar esses parâmetros no fluxo de geração de resposta no `server.ts`.

7. **Validação e Compilação**:
   - Executar `compile_applet` para garantir zero erros de TypeScript e build perfeito.
