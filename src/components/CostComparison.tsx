import React from 'react';
import {
  Coins,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';

export const CostComparison: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-3">
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          Transparência Total
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Por que este Bot é 100% Gratuito?
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Entenda as cotas e limites gratuitos oferecidos pelas próprias gigantes de tecnologia (Google e Meta) que tornam possível rodar seu atendimento com custo ZERO.
        </p>
      </div>

      {/* Main Cost Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-emerald-300 text-xs uppercase font-bold tracking-wider">
                Investimento Inicial & Mensal
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-white">R$ 0,00</span>
                <span className="text-emerald-200 text-sm">/ para sempre no plano gratuito</span>
              </div>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-emerald-200">
              Sem necessidade de cartão de crédito no Google AI Studio
            </div>
          </div>
        </div>

        {/* Detailed Rows */}
        <div className="divide-y divide-gray-100 text-sm">
          {/* Row 1: Gemini */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h4 className="font-bold text-gray-900">1. Cérebro IA (Google Gemini)</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Modelo Gemini 3.8 / 2.5 Flash</p>
            </div>
            <div className="md:col-span-5">
              <span className="text-xs font-semibold text-gray-700 block">
                Cota Gratuita do Google AI Studio:
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                Até <strong>15 requisições por minuto</strong> e até 1.500 requisições por dia gratuitamente no tier Free. Suficiente para centenas de atendimentos diários.
              </p>
            </div>
            <div className="md:col-span-3 text-right md:text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                GRÁTIS (R$ 0,00)
              </span>
            </div>
          </div>

          {/* Row 2: WhatsApp Cloud API */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50/50">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h4 className="font-bold text-gray-900">2. Conector WhatsApp (Meta)</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Meta WhatsApp Cloud API Oficial</p>
            </div>
            <div className="md:col-span-5">
              <span className="text-xs font-semibold text-gray-700 block">
                Cota Oficial Gratuita da Meta:
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                A Meta oferece <strong>1.000 conversas de serviço gratuitas todos os meses</strong> para cada conta comercial do WhatsApp. Uma conversa dura 24 horas com mensagens ilimitadas.
              </p>
            </div>
            <div className="md:col-span-3 text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                GRÁTIS (1.000/mês)
              </span>
            </div>
          </div>

          {/* Row 3: Conexão QR Code alternativa */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h4 className="font-bold text-gray-900">3. Alternativa QR Code (Evolution)</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Conexão direta no celular pessoal</p>
            </div>
            <div className="md:col-span-5">
              <span className="text-xs font-semibold text-gray-700 block">
                Código Aberto (Open Source):
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                Não cobra por conversa e não tem limite mensal de mensagens. Você conecta escaneando o QR Code no seu próprio WhatsApp.
              </p>
            </div>
            <div className="md:col-span-3 text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                GRÁTIS ILIMITADO
              </span>
            </div>
          </div>

          {/* Row 4: Hospedagem */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50/50">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="font-bold text-gray-900">4. Servidor de Hospedagem</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Render.com / Koyeb / Ngrok</p>
            </div>
            <div className="md:col-span-5">
              <span className="text-xs font-semibold text-gray-700 block">
                Planos Gratuitos em Nuvem:
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                Plataformas modernas de nuvem oferecem planos gratuitos para projetos pequenos e médios com certificado SSL (HTTPS) incluso.
              </p>
            </div>
            <div className="md:col-span-3 text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                GRÁTIS (R$ 0,00)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* When you scale */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 text-sm">
        <h3 className="font-bold text-emerald-950 text-base flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-emerald-700" />
          E se minha empresa crescer e passar de 1.000 clientes por mês?
        </h3>
        <p className="text-emerald-900 leading-relaxed text-xs sm:text-sm">
          Mesmo se você ultrapassar as 1.000 conversas gratuitas mensais da Meta, o custo continua irrisório: cada conversa de atendimento de 24 horas com mensagens ilimitadas custa cerca de <strong>$0,03 dólares (aproximadamente R$ 0,16 centavos de real)</strong>. Ou seja, atender 100 clientes a mais custaria menos de R$ 16,00!
          <br /><br />
          E se você usar a opção <strong>Evolution API / QR Code</strong>, você não paga absolutamente nada mesmo atendendo 10.000 pessoas!
        </p>
      </div>
    </div>
  );
};
