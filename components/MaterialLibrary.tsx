import React from 'react';
import { MaterialInfo } from '../types';

const materials: MaterialInfo[] = [
  {
    id: 'eps',
    name: 'Expanded Polystyrene (EPS)',
    density: 'Low (15-30 kg/m³)',
    meltPoint: '~240°C',
    bestFor: 'Prototyping, Scenery, Large volumes',
    cuttingSpeed: 'Fast',
    wireTemp: 'Low to Medium'
  },
  {
    id: 'xps',
    name: 'Extruded Polystyrene (XPS)',
    density: 'Medium (25-45 kg/m³)',
    meltPoint: '~90-100°C (Softens)',
    bestFor: 'RC Wings, Detailed props, Structural core',
    cuttingSpeed: 'Medium',
    wireTemp: 'Medium'
  },
  {
    id: 'epp',
    name: 'Expanded Polypropylene (EPP)',
    density: 'Medium-High',
    meltPoint: '~165°C',
    bestFor: 'Crash-resistant RC planes, Bumpers',
    cuttingSpeed: 'Slow',
    wireTemp: 'High'
  },
];

const MaterialLibrary: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto w-full p-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Material Intelligence</h2>
        <p className="text-slate-400">Calibrate your cutter for different foam types.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {materials.map((mat) => (
          <div key={mat.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-hot-wire-500/50 transition-all duration-300 group">
            <div className="h-2 bg-gradient-to-r from-hot-wire-600 to-hot-wire-400 w-0 group-hover:w-full transition-all duration-500"></div>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-white group-hover:text-hot-wire-400 transition-colors">{mat.name}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Best For</span>
                  <span className="text-sm text-slate-300 font-medium text-right max-w-[60%]">{mat.bestFor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Density</span>
                  <span className="text-sm text-slate-300 font-medium">{mat.density}</span>
                </div>
                 <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Melt Point</span>
                  <span className="text-sm text-slate-300 font-medium">{mat.meltPoint}</span>
                </div>
                
                <div className="pt-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Speed</span>
                        <span className={mat.cuttingSpeed === 'Fast' ? 'text-green-400' : mat.cuttingSpeed === 'Slow' ? 'text-red-400' : 'text-yellow-400'}>{mat.cuttingSpeed}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full ${mat.cuttingSpeed === 'Fast' ? 'bg-green-500 w-3/4' : mat.cuttingSpeed === 'Slow' ? 'bg-red-500 w-1/4' : 'bg-yellow-500 w-1/2'}`}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Wire Temp</span>
                        <span className={mat.wireTemp === 'High' ? 'text-red-400' : 'text-blue-400'}>{mat.wireTemp}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                         <div 
                            className={`h-1.5 rounded-full ${mat.wireTemp === 'High' ? 'bg-red-500 w-3/4' : 'bg-blue-400 w-1/2'}`}
                        ></div>
                    </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-700 text-center">
         <p className="text-slate-400 text-sm">Always cut in a well-ventilated area. Melting plastics releases toxic fumes.</p>
      </div>
    </div>
  );
};

export default MaterialLibrary;