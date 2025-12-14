import React from 'react';
import { ViewState } from '../types';
import { IconHome, IconScissors, IconBook, IconMessageCircle, IconZap } from './Icons';

interface NavBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.HOME, label: 'Home', icon: IconHome },
    { id: ViewState.GENERATOR, label: 'Pattern Gen', icon: IconScissors },
    { id: ViewState.LIBRARY, label: 'Materials', icon: IconBook },
    { id: ViewState.CHAT, label: 'Ask Volt', icon: IconMessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-slate-800/90 backdrop-blur-md border-t border-slate-700 md:relative md:top-0 md:border-t-0 md:border-b z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between md:justify-start md:gap-8 items-center h-16">
          
          {/* Logo - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center gap-2 cursor-pointer" onClick={() => setView(ViewState.HOME)}>
            <div className="p-2 bg-hot-wire-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.5)]">
               <IconZap className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Foam<span className="text-hot-wire-500">Forge</span></span>
          </div>

          {/* Nav Items */}
          <div className="flex w-full justify-around md:w-auto md:justify-start md:gap-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-hot-wire-400 bg-hot-wire-900/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-xs md:text-sm font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;