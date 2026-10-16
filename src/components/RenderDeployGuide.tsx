import React, { useState } from 'react';
import {
  Github,
  Server,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Terminal,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const RenderDeployGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header in Arco CRM Dark Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-[#101b33] border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Hospedagem 24 Horas
            </span>
            <span className="text-[11px] font-bold text-[#34d399] bg-[#0a1b24] border border-[#065f46]/50 px-2 py-0.5 rounded-full uppercase">
              Custo R$ 0,00
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Como Subir para o GitHub e Hospedar no Render (onrender.com)
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 max-w-2xl">
            Entenda por que o <strong>Render</strong> mantém o WhatsApp conectado 24h enquanto a Vercel desliga a conexão, e veja o guia de publicação em 5 minutos.
          </p>
        </div>

        <a
          href="https://dashboard.render.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition cursor-pointer"
        >
          <span>Abrir Render.com</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Render vs Vercel Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Render Card */}
        <div className="bg-[#0e1628] border-2 border-blue-500/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                R
              </span>
              <h3 className="font-bold text-white text-base">Render (onrender.com)</h3>
            </div>
            <span className="text-[10px] font-bold bg-[#0a1b24] text-[#34d399] border border-[#065f46]/50 px-2.5 py-0.5 rounded-full uppercase">
              100% Recomendado ✅
            </span>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
            O WhatsApp por QR Code precisa de um <strong>processo contínuo (WebSocket ativo 24h)</strong> para receber as mensagens instantaneamente. O Render oferece <strong>Web Service contínuo gratuito</strong> que mantém seu robô sempre ligado!
          </p>

          <ul className="text-xs text-slate-200 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
              <span>Conexão WebSocket contínua com os servidores do WhatsApp</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
              <span>Plano Free: Custo R$ 0,00 para sempre</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0" />
              <span>Deploy automático a cada git push no seu GitHub</span>
            </li>
          </ul>
        </div>

        {/* Vercel Card */}
        <div className="bg-[#0e1628] border border-rose-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#160d1b] border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-sm">
                ▲
              </span>
              <h3 className="font-bold text-white text-base">Vercel</h3>
            </div>
            <span className="text-[10px] font-bold bg-[#1f1322] text-[#f472b6] border border-[#831843]/50 px-2.5 py-0.5 rounded-full uppercase">
              Não Recomendado ❌
            </span>
          </div>

          <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
            A Vercel é uma plataforma <strong>Serverless</strong> (funções lambda que desligam após 10 a 60 segundos de inatividade). Ela <strong>mata o processo do WhatsApp</strong> assim que o cliente para de falar.
          </p>

          <div className="bg-[#160d1b] border border-rose-500/40 rounded-xl p-3 text-xs text-[#fb7185] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Por que não usar a Vercel para QR Code?</strong> Como a função serverless entra em repouso ("hiberna"), o WhatsApp do seu celular acusará que o aparelho foi desconectado. <strong>Use o Render!</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Guide to Deploy on Render */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          Passo a Passo para Subir no Render em 5 Minutos
        </h2>

        {/* Passo 1 */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
              1
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Subir este Projeto para o seu GitHub
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Crie um repositório no seu GitHub (ex: <code>meu-bot-whatsapp</code>) e execute no seu terminal:
              </p>

              <div className="mt-3 bg-[#070b14] border border-[#1e293b] rounded-xl p-4 font-mono text-xs relative">
                <button
                  onClick={() =>
                    copyText(
                      'git init\ngit add .\ngit commit -m "Meu bot de WhatsApp com Gemini"\ngit branch -M main\ngit remote add origin https://github.com/SEU-USUARIO/meu-bot-whatsapp.git\ngit push -u origin main',
                      'git-cmd'
                    )
                  }
                  className="absolute top-3 right-3 flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'git-cmd' ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <pre className="text-blue-300">
{`git init
git add .
git commit -m "Meu bot de WhatsApp com Gemini"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/meu-bot-whatsapp.git
git push -u origin main`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
              2
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Criar o Web Service no Render.com
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Acesse <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold hover:underline">dashboard.render.com</a>, faça login com sua conta do GitHub e clique em <strong>New +</strong> &gt; <strong>Web Service</strong>.
              </p>

              <div className="mt-4 bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-white block mb-2">
                  Preencha exatamente esses campos no painel do Render:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-[#64748b] block text-[10px]">Build Command:</span>
                    <span className="font-bold text-blue-400">npm install && npm run build</span>
                  </div>

                  <div className="bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-[#64748b] block text-[10px]">Start Command:</span>
                    <span className="font-bold text-blue-400">npm start</span>
                  </div>

                  <div className="bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-[#64748b] block text-[10px]">Environment:</span>
                    <span className="font-bold text-[#34d399]">Node</span>
                  </div>

                  <div className="bg-[#070b14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-[#64748b] block text-[10px]">Plan:</span>
                    <span className="font-bold text-[#34d399]">Free ($0.00)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
              3
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Adicionar a Chave da IA (Variável de Ambiente)
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Na tela de configuração do Render, vá até <strong>Environment Variables</strong> e adicione:
              </p>

              <div className="mt-3 bg-[#070b14] border border-[#1e293b] rounded-xl p-3.5 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Key: </span>
                  <span className="text-[#c084fc] font-bold">GEMINI_API_KEY</span>
                  <span className="text-[#64748b] block text-[11px] mt-0.5 font-sans">
                    Value: Sua chave gratuita gerada em aistudio.google.com
                  </span>
                </div>
                <button
                  onClick={() => copyText('GEMINI_API_KEY', 'env-key')}
                  className="text-blue-400 hover:text-blue-300 text-[11px] font-sans font-semibold cursor-pointer"
                >
                  {copiedKey === 'env-key' ? 'Copiado!' : 'Copiar Nome'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 4 */}
        <div className="bg-[#0e1628] border border-[#1a263d] rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-md shadow-blue-600/30">
              4
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Ler o QR Code gerado pelo Render UMA ÚNICA VEZ
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                O Render criará sua URL (exemplo: <code>https://meu-bot-whatsapp.onrender.com</code>).
              </p>
              <p className="text-xs text-slate-200 mt-2">
                Abra esse link no navegador, aponte o WhatsApp do celular para o QR Code da tela e pronto! Ele ficará <strong>conectado para sempre</strong>, respondendo seus clientes 24h por dia mesmo se seu computador estiver desligado!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
