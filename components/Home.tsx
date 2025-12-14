import React from 'react';
import { ViewState } from '../types';
import { IconScissors, IconBook } from './Icons';

interface HomeProps {
  setView: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="max-w-4xl mx-auto w-full pt-10 pb-20 px-4 space-y-16 animate-fade-in">
      
      {/* Hero */}
      <div className="text-center space-y-6">
        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-hot-wire-500 to-amber-500 mb-4 animate-float">
           <span className="block px-4 py-1 bg-slate-900 rounded-full text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-hot-wire-400 to-amber-400 uppercase">
             AI-Powered Cutting
           </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight">
          Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-hot-wire-500 to-amber-500 neon-text">Hot Wire</span> Design
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transform your ideas into continuous foam-cutting paths instantly. 
          Whether you're building RC wings, cosplay props, or architectural models, FoamForge is your digital workshop.
        </p>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
          <button 
            onClick={() => setView(ViewState.GENERATOR)}
            className="px-8 py-4 bg-hot-wire-600 hover:bg-hot-wire-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <IconScissors className="w-5 h-5" />
            Start Cutting
          </button>
          <button 
            onClick={() => setView(ViewState.LIBRARY)}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 hover:border-slate-500 transition-all flex items-center justify-center gap-2"
          >
            <IconBook className="w-5 h-5" />
            Materials Guide
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 pt-10">
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 hover:border-hot-wire-500/30 transition-all group">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AI Path Generation</h3>
          <p className="text-slate-400 text-sm">Convert natural language descriptions into clean, continuous SVG paths ready for CNC or manual template printing.</p>
        </div>

        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 hover:border-hot-wire-500/30 transition-all group">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Volt Assistant</h3>
          <p className="text-slate-400 text-sm">Expert advice on wire gauge, current settings, and feed rates for XPS, EPS, and EPP foams.</p>
        </div>

        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 hover:border-hot-wire-500/30 transition-all group">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <span className="text-2xl">📐</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Material Data</h3>
          <p className="text-slate-400 text-sm">Quick reference guide for densities, melting points, and optimal handling techniques.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;