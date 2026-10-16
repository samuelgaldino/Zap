import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ExternalLink,
  Award,
  ArrowRight,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
  badge?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'key',
    title: '1. Obter a Chave Gratuita da API do Gemini',
    description: 'Acesse o Google AI Studio com sua conta Google e gere sua API Key gratuita para alimentar o cérebro da IA.',
    linkText: 'Abrir Google AI Studio',
    linkUrl: 'https://aistudio.google.com',
    badge: 'Grátis',
  },
  {
    id: 'config',
    title: '2. Customizar a Empresa e Base de Conhecimento',
    description: 'No arco wpp, defina o nome do seu negócio, cardápio, tabela de preços, horários de atendimento e regras.',
    badge: 'Aqui no App',
  },
  {
    id: 'test',
    title: '3. Testar no Simulador WhatsApp em Tempo Real',
    description: 'Faça perguntas difíceis no simulador para validar se o bot responde com clareza, empatia e sem inventar dados.',
    badge: 'Aqui no App',
  },
  {
    id: 'whatsapp_account',
    title: '4. Criar App no Meta for Developers (ou Evolution API)',
    description: 'Crie seu app do tipo Empresa no developers.facebook.com para obter o Phone Number ID e o Token de acesso gratuito.',
    linkText: 'Abrir Meta for Developers',
    linkUrl: 'https://developers.facebook.com',
    badge: 'Meta Oficial',
  },
  {
    id: 'export_code',
    title: '5. Baixar o Código Pronto no Gerador de Código',
    description: 'Copie ou baixe o arquivo bot-meta.js e o .env prontos gerados com as suas configurações da empresa.',
    badge: '1 Clique',
  },
  {
    id: 'hosting',
    title: '6. Subir o Servidor Grátis no Render.com ou Ngrok',
    description: 'Hospede seu bot no Render.com para ficar online 24h ou rode no seu computador com o comando ngrok http 3000 para testes rápidos.',
    linkText: 'Abrir Render.com',
    linkUrl: 'https://render.com',
    badge: 'Nuvem Grátis',
  },
  {
    id: 'webhook',
    title: '7. Vincular a URL do Webhook no WhatsApp',
    description: 'Cole a URL gerada (ex: https://meu-bot.onrender.com/webhook) no painel de Webhooks da Meta ou da Evolution API.',
    badge: 'Conexão Final',
  },
  {
    id: 'first_hello',
    title: '8. Enviar o Primeiro "Oi" no WhatsApp Real!',
    description: 'Pegue seu celular, mande uma mensagem para o número configurado e veja a mágica da inteligência artificial responder automaticamente.',
    badge: 'Sucesso 🎉',
  },
];

interface SetupChecklistProps {
  onGoToSimulator: () => void;
  onGoToCode: () => void;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  onGoToSimulator,
  onGoToCode,
}) => {
  const [completedItems, setCompletedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zapgemini_checklist');
      return saved ? JSON.parse(saved) : ['config', 'test'];
    } catch {
      return ['config', 'test'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('zapgemini_checklist', JSON.stringify(completedItems));
    } catch {}
  }, [completedItems]);

  const toggleItem = (id: string) => {
    setCompletedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progressPercentage = Math.round(
    (completedItems.length / CHECKLIST_ITEMS.length) * 100
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white mb-8 shadow-md border border-emerald-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Progresso do seu Lançamento
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              Checklist para Lançar seu Bot no WhatsApp
            </h2>
            <p className="text-xs text-emerald-200 mt-1">
              Siga cada etapa na ordem para ter seu bot no ar sem surpresas nem custos.
            </p>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-3xl font-extrabold text-white">{progressPercentage}%</span>
            <span className="text-xs text-emerald-300 block">
              {completedItems.length} de {CHECKLIST_ITEMS.length} concluídos
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-emerald-950/80 rounded-full h-3 mt-4 overflow-hidden border border-emerald-700/40">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist items list */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = completedItems.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
              }`}
            >
              <button
                type="button"
                className={`mt-0.5 shrink-0 transition ${
                  isDone ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`text-sm sm:text-base font-bold ${
                      isDone ? 'text-emerald-950 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-emerald-800/80' : 'text-gray-600'}`}>
                  {item.description}
                </p>

                {item.linkText && item.linkUrl && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      {item.linkText} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Trophy Card */}
      {progressPercentage === 100 && (
        <div className="mt-8 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 p-6 rounded-2xl shadow-lg border border-amber-300 flex items-center gap-4 animate-fadeIn">
          <Award className="w-12 h-12 text-amber-900 shrink-0" />
          <div>
            <h3 className="text-lg font-bold">Parabéns! Seu Bot está Pronto para o Mundo! 🚀</h3>
            <p className="text-xs text-amber-950/90 mt-0.5">
              Você configurou com sucesso um bot completo de atendimento profissional no WhatsApp com inteligência artificial de ponta sem gastar nada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
