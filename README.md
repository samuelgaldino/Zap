# 🤖 ZapGemini - Bot de WhatsApp Autônomo com IA (100% Gratuito)

Este projeto conecta seu WhatsApp real escaneando um QR Code e responde mensagens de clientes de forma 100% autônoma utilizando a inteligência artificial do Google Gemini.

---

## 🚀 Como Subir no GitHub e Hospedar no Render.com (24h Online Grátis)

### ⚠️ Render vs Vercel (Importante!):
* **Render.com (RECOMENDADO):** O WhatsApp por QR Code (Baileys) precisa de uma conexão contínua de **WebSocket/TCP aberta 24 horas por dia** com os servidores do WhatsApp. O Render roda como um Web Service contínuo (não desliga), funcionando perfeitamente de forma gratuita!
* **Vercel (NÃO RECOMENDADO para Baileys):** A Vercel usa arquitetura *Serverless* (desliga as funções após alguns segundos de inatividade). Isso derruba a conexão do WhatsApp a cada minuto. **Use o Render!**

---

### Passo 1: Subir para o seu GitHub
Abra o terminal na pasta do projeto e execute:
```bash
git init
git add .
git commit -m "Meu Bot de WhatsApp Autônomo com IA Gemini"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/meu-bot-whatsapp.git
git push -u origin main
```

---

### Passo 2: Criar o Web Service no Render
1. Acesse **[dashboard.render.com](https://dashboard.render.com)** (faça login com o GitHub).
2. Clique no botão **New +** > **Web Service**.
3. Selecione o repositório que você acabou de criar no GitHub.
4. Preencha as configurações:
   * **Name:** `meu-bot-whatsapp`
   * **Language / Environment:** `Node`
   * **Region:** Ohio (US East) ou Oregon
   * **Branch:** `main`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free` (R$ 0,00)

---

### Passo 3: Adicionar a Chave da IA
Na seção **Environment Variables** (Variáveis de Ambiente), adicione:
* **Key:** `GEMINI_API_KEY`
* **Value:** Sua chave gratuita gerada em [aistudio.google.com](https://aistudio.google.com)

Clique em **Create Web Service**.

---

### Passo 4: Conectar o WhatsApp
1. O Render irá compilar e iniciar o projeto gerando uma URL (ex: `https://meu-bot-whatsapp.onrender.com`).
2. Abra essa URL no seu navegador.
3. O **QR Code** aparecerá na tela.
4. Abra o WhatsApp no seu celular > **Aparelhos Conectados** > **Conectar um aparelho** e escaneie o QR Code!
5. **Pronto!** O seu bot agora está online 24h por dia respondendo seus clientes no piloto automático!
