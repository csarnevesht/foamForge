import React, { useState } from 'react';
import { generatePattern } from '../services/geminiService';
import { GeneratedPattern } from '../types';
import { IconDownload, IconLoader, IconZap } from './Icons';

const PatternGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [pattern, setPattern] = useState<GeneratedPattern | null>(null);
  const [scale, setScale] = useState(1);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPattern(null);
    try {
      const result = await generatePattern(prompt);
      setPattern(result);
    } catch (e) {
      alert("Failed to generate pattern. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pattern) return;
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="${pattern.svgPath}" fill="none" stroke="black" stroke-width="0.5" />
      </svg>
    `;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern.name.replace(/\s+/g, '_').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">AI Pattern Generator</h2>
        <p className="text-slate-400">Describe a shape, wing profile, or letter, and we'll generate a continuous cut path.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        
        {/* Input Section */}
        <div className="space-y-6 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-hot-wire-500 focus:border-transparent outline-none transition-all resize-none h-32"
              placeholder="e.g. A futuristic sword handle with finger grooves..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className={`w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
              ${loading || !prompt 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-hot-wire-600 to-hot-wire-500 hover:from-hot-wire-500 hover:to-hot-wire-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5'
              }`}
          >
            {loading ? <IconLoader className="animate-spin" /> : <IconZap />}
            {loading ? 'Generating Path...' : 'Ignite Generator'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-slate-900 rounded-2xl border-2 border-slate-700 border-dashed flex items-center justify-center relative overflow-hidden group">
            {pattern ? (
              <div className="relative w-full h-full p-8 transition-all duration-500 ease-out transform">
                 {/* Grid Background */}
                 <div className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                 </div>
                 
                 {/* The Generated SVG */}
                 <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
                    <path 
                      d={pattern.svgPath} 
                      fill="none" 
                      stroke="#fb923c" 
                      strokeWidth="0.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="animate-[dash_3s_ease-in-out_forwards]"
                    />
                 </svg>
              </div>
            ) : (
              <div className="text-center text-slate-600">
                <IconZap className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Preview Area</p>
              </div>
            )}
            
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                   <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-hot-wire-500 animate-progress"></div>
                   </div>
                   <span className="text-xs text-hot-wire-400 font-mono animate-pulse">CALCULATING VECTORS...</span>
                </div>
              </div>
            )}
          </div>

          {pattern && (
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-fade-in-up">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-white">{pattern.name}</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">{pattern.difficulty}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">{pattern.estimatedCutTime}</span>
                        </div>
                    </div>
                    <button onClick={handleDownload} className="p-2 hover:bg-slate-700 rounded-lg text-hot-wire-400 hover:text-hot-wire-300 transition-colors" title="Download SVG">
                        <IconDownload />
                    </button>
                </div>
                <p className="text-sm text-slate-400">{pattern.description}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternGenerator;