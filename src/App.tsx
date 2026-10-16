import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { WhatsAppConnect } from './components/WhatsAppConnect';
import { BroadcastManager } from './components/BroadcastManager';
import { TrainingStudio } from './components/TrainingStudio';
import { LiveInbox } from './components/LiveInbox';
import { RenderDeployGuide } from './components/RenderDeployGuide';
import { CodeExporter } from './components/CodeExporter';
import { BotScheduleSettings } from './components/BotScheduleSettings';
import { BotConfig } from './types';
import { BUSINESS_PRESETS } from './data/presets';
import { Smartphone, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('connect');
  const [botConfig, setBotConfig] = useState<BotConfig>(BUSINESS_PRESETS[0].config);

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col font-sans text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        businessName={botConfig.businessName}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-12">
        {activeTab === 'connect' && (
          <WhatsAppConnect
            onGoToTraining={() => setActiveTab('training')}
            onGoToInbox={() => setActiveTab('inbox')}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastManager />
        )}

        {activeTab === 'training' && (
          <TrainingStudio
            onGoToConnect={() => setActiveTab('connect')}
            onGoToInbox={() => setActiveTab('inbox')}
            onGoToSettings={() => setActiveTab('code')}
          />
        )}

        {activeTab === 'schedule' && (
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-6">
            <BotScheduleSettings onGoToLogs={() => setActiveTab('code')} />
          </div>
        )}

        {activeTab === 'inbox' && (
          <LiveInbox />
        )}

        {activeTab === 'deploy' && (
          <RenderDeployGuide />
        )}

        {activeTab === 'code' && (
          <CodeExporter
            botConfig={botConfig}
            onGoToTraining={() => setActiveTab('training')}
            onGoToInbox={() => setActiveTab('inbox')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#070b14] border-t border-[#131d33] py-6 text-xs text-[#64748b]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-blue-600/30">
              A
            </div>
            <span className="font-semibold text-slate-200">arco wpp</span>
            <span className="text-[#64748b] hidden sm:inline">•</span>
            <span className="text-[#94a3b8]">IA Humanizada, Áudios, Reações e WhatsApp Autônomo Conectado</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveTab('connect')}
              className="hover:text-blue-400 transition cursor-pointer text-[#94a3b8]"
            >
              Conexão WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className="hover:text-blue-400 transition cursor-pointer text-[#94a3b8]"
            >
              Treinamento IA
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="hover:text-blue-400 transition cursor-pointer text-[#94a3b8]"
            >
              Logs do Sistema
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className="hover:text-blue-400 transition cursor-pointer text-[#94a3b8]"
            >
              Monitor Ao Vivo
            </button>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition flex items-center gap-1 text-[#94a3b8]"
            >
              Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
