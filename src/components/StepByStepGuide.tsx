import React, { useState } from 'react';
import {
  Key,
  Smartphone,
  Server,
  Code2,
  ExternalLink,
  CheckCircle,
  Copy,
  Sparkles,
  HelpCircle,
  Shield,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface StepByStepGuideProps {
  onGoToSimulator: () => void;
  onGoToCode: () => void;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  onGoToSimulator,
  onGoToCode,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Guia Definitivo Custo Zero (R$ 0,00)
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
          Como Criar um Bot no WhatsApp com o Gemini Grátis
        </h1>
        <p className="mt-3 text-base text-gray-600 leading-relaxed">
          Para ter um bot de atendimento com inteligência artificial rodando no WhatsApp sem gastar nenhum centavo, você só precisa conectar <strong>3 peças gratuitas</strong>. Veja como tudo funciona abaixo:
        </p>
      </div>

      {/* The 3 Pillars Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold mb-3">
            <Key className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Pilar 1 • O Cérebro (IA)
          </span>
          <h3 className="text-base font-bold text-gray-900 mb-1.5">
            Google AI Studio (Gemini)
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Fornece o modelo <strong>Gemini 3.8 Flash</strong> de forma 100% gratuita com até <strong>15 requisições por minuto</strong>, sem precisar cadastrar cartão de crédito!
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold">Custo: R$ 0,00</span>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              Criar chave <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Pilar 2 • A Conexão WhatsApp
          </span>
          <h3 className="text-base font-bold text-gray-900 mb-1.5">
            Meta Cloud API ou Evolution API
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Meta Oficial:</strong> 1.000 conversas grátis/mês concedidas pela Meta.<br />
            <strong>Evolution/Baileys:</strong> Conecta lendo QR Code no seu próprio celular sem burocracia.
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold">Custo: R$ 0,00</span>
            <span className="text-gray-500 text-[11px]">1.000 conv/mês</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold mb-3">
            <Server className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
            Pilar 3 • A Hospedagem
          </span>
          <h3 className="text-base font-bold text-gray-900 mb-1.5">
            Render / Koyeb / Ngrok
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Onde seu código roda para receber mensagens e responder: hospede de graça no <strong>Render.com</strong>, no <strong>Koyeb</strong> ou rode direto no seu computador via <strong>Ngrok</strong>.
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold">Custo: R$ 0,00</span>
            <span className="text-gray-500 text-[11px]">Servidor Gratuito</span>
          </div>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="space-y-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>Passo a Passo Prático para Fazer Acontecer</span>
        </h2>

        {/* Passo 1 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Obtenha sua Chave Gratuita da API do Gemini
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                O Google AI Studio oferece acesso gratuito à API do Gemini para desenvolvedores.
              </p>

              <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside bg-gray-50 p-4 rounded-xl border border-gray-200">
                <li>
                  Acesse <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">aistudio.google.com</a> e faça login com sua conta do Google (Gmail).
                </li>
                <li>
                  No menu lateral, clique em <strong>"Get API key"</strong> (Obter Chave de API).
                </li>
                <li>
                  Clique em <strong>"Create API key"</strong> e selecione ou crie um projeto gratuito.
                </li>
                <li>
                  Copie a chave gerada (ela começa com <code>AIzaSy...</code>). Guarde-a com segurança.
                </li>
              </ol>

              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Vantagem do Gemini:</strong> O tier gratuito do Gemini permite até 15 requisições por minuto com o modelo <strong>gemini-3.8-flash</strong>, o que atende perfeitamente pequenas e médias empresas sem pagar nada.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 2 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Escolha como Conectar ao WhatsApp (2 Opções Grátis)
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Você pode optar pela API Oficial da Meta ou por conexão via QR Code:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Opção A */}
                <div className="border-2 border-emerald-500/60 bg-emerald-50/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">
                      Recomendado Oficial
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm">Opção A: Meta Cloud API Oficial</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                    <li>1.000 conversas de serviço gratuitas todo mês.</li>
                    <li>Risco 0 de banimento do número pela Meta.</li>
                    <li>Configurado em <strong>developers.facebook.com</strong>.</li>
                    <li>A Meta fornece um número de teste imediato com mensagens de teste grátis.</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 font-medium">
                    👉 Ideal se você quer estabilidade oficial e conformidade.
                  </div>
                </div>

                {/* Opção B */}
                <div className="border border-gray-300 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase bg-gray-700 text-white px-2 py-0.5 rounded">
                      Open-Source
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm">Opção B: Evolution API (QR Code)</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                    <li>Conecta escaneando o QR Code pelo aplicativo do WhatsApp do celular.</li>
                    <li>Usa seu próprio número atual sem precisar de aprovação da Meta.</li>
                    <li>Software 100% de código aberto e gratuito.</li>
                    <li>Requer rodar o container da Evolution API (no Docker ou Koyeb).</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] text-gray-600 font-medium">
                    👉 Ideal para testes rápidos ou números pessoais.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Baixe o Código Pronto e Configure o Servidor
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Você não precisa programar do zero. Já geramos o código completo do bot com o cérebro do Gemini integrado com a sua empresa!
              </p>

              <div className="mt-4 bg-gray-950 text-gray-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between text-gray-400 mb-2 pb-2 border-b border-gray-800">
                  <span>Comandos no Terminal para Iniciar</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'mkdir meu-bot-whatsapp\ncd meu-bot-whatsapp\nnpm init -y\nnpm install express @google/genai dotenv',
                        'terminal'
                      )
                    }
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'terminal' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-emerald-300">
{`# 1. Crie uma pasta para seu bot
mkdir meu-bot-whatsapp
cd meu-bot-whatsapp

# 2. Instale as bibliotecas gratuitas
npm init -y
npm install express @google/genai dotenv

# 3. Crie os arquivos bot.js e .env com o código gerado no arco wpp
# 4. Inicie o bot:
node bot.js`}
                </pre>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={onGoToCode}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer shadow"
                >
                  <Code2 className="w-4 h-4" />
                  Ver e Exportar Código Gerado
                </button>
                <button
                  onClick={onGoToSimulator}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Testar no Simulador Primeiro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passo 4 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              4
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Onde Hospedar Grátis (Colocar o Bot Online 24 Horas)
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Para que o bot responda mesmo quando seu computador estiver desligado:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <div className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Render.com
                  </div>
                  <p className="text-gray-600">
                    Plano Free com URL pública HTTPS automática. Basta conectar seu repositório do GitHub e ele fica online.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <div className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Koyeb
                  </div>
                  <p className="text-gray-600">
                    Excelente plano gratuito para containers Docker ou Node.js com baixa latência em servidores globais.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <div className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Ngrok (Para Testes)
                  </div>
                  <p className="text-gray-600">
                    Rode <code>ngrok http 3000</code> no seu terminal para gerar uma URL pública instantânea e testar no seu PC sem hospedar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
