import React, { useState } from 'react';
import NavBar from './components/NavBar';
import Home from './components/Home';
import PatternGenerator from './components/PatternGenerator';
import MaterialLibrary from './components/MaterialLibrary';
import ChatAssistant from './components/ChatAssistant';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home setView={setCurrentView} />;
      case ViewState.GENERATOR:
        return <PatternGenerator />;
      case ViewState.LIBRARY:
        return <MaterialLibrary />;
      case ViewState.CHAT:
        return <ChatAssistant />;
      default:
        return <Home setView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-hot-wire-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
          <NavBar currentView={currentView} setView={setCurrentView} />
          
          <main className="flex-1 flex flex-col p-4 md:p-8">
             {renderView()}
          </main>

          <footer className="p-6 text-center text-slate-600 text-sm border-t border-slate-800">
            <p>&copy; {new Date().getFullYear()} FoamForge. Build responsibly.</p>
          </footer>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes progress {
           0% { transform: translateX(-100%); }
           100% { transform: translateX(100%); }
        }
        .animate-progress {
           animation: progress 1s infinite linear;
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards 0.2s; 
            opacity: 0; 
        }
      `}</style>
    </div>
  );
};

export default App;