import React from 'react';
import { BrandIdentity, ColorPalette } from '../types';

interface AnalysisViewProps {
  data: BrandIdentity;
  onGenerateAsset: (type: 'logo' | 'social' | 'mockup') => void;
  isGenerating: boolean;
}

const ColorCard: React.FC<{ color: ColorPalette }> = ({ color }) => (
  <div className="flex flex-col gap-2 group cursor-pointer">
    <div 
      className="h-24 w-full rounded-xl shadow-lg transition-transform group-hover:scale-105 border border-white/10"
      style={{ backgroundColor: color.hex }}
    />
    <div className="flex justify-between items-start text-xs">
      <div>
        <p className="font-bold text-gray-200">{color.name}</p>
        <p className="text-gray-500">{color.usage}</p>
      </div>
      <p className="font-mono text-gray-400 uppercase">{color.hex}</p>
    </div>
  </div>
);

export const AnalysisView: React.FC<AnalysisViewProps> = ({ data, onGenerateAsset, isGenerating }) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in space-y-8">
      
      {/* Header Section */}
      <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-purple-500">
        <h2 className="text-sm font-mono text-purple-400 mb-2 uppercase tracking-widest">Analysis Complete</h2>
        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-6">
          {data.vibeDescription.split('.')[0]}.
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">
          {data.vibeDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Brand DNA */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 space-y-6">
          {data.thinkingLog && (
            <div className="mb-6 pb-6 border-b border-white/10">
               <h3 className="text-xs font-mono text-purple-400 uppercase mb-3">Creative Rationale</h3>
               <p className="text-sm text-gray-300 italic leading-relaxed">"{data.thinkingLog}"</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">Brand Voice</h3>
            <p className="text-xl font-medium text-white">{data.brandVoice}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">Typography System</h3>
            <div className="p-3 bg-black/30 rounded border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">Heading</span>
              <span className="text-lg font-bold">{data.typographyHeading}</span>
            </div>
            <div className="p-3 bg-black/30 rounded border border-white/5">
              <span className="text-xs text-gray-500 block mb-1">Body</span>
              <span className="text-base">{data.typographyBody}</span>
            </div>
          </div>
          <div>
             <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">Directives</h3>
             <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
               {data.designDirectives.map((d, i) => (
                 <li key={i}>{d}</li>
               ))}
             </ul>
          </div>
        </div>

        {/* Color Palette */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-xs font-mono text-gray-500 uppercase mb-6">Chromatic Signature</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.colors.map((color, idx) => (
              <ColorCard key={idx} color={color} />
            ))}
          </div>
        </div>
      </div>

      {/* Action Deck */}
      <div className="border-t border-white/10 pt-8">
        <h3 className="text-center text-xl font-light mb-6 text-gray-300">Generate High-Fidelity Assets</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            disabled={isGenerating}
            onClick={() => onGenerateAsset('logo')}
            className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? 'Fabricating...' : 'Generate Logo Mark'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => onGenerateAsset('social')}
            className="px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 text-white rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Social Canvas
          </button>
          <button 
             disabled={isGenerating}
            onClick={() => onGenerateAsset('mockup')}
            className="px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 text-white rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Product Mockup
          </button>
        </div>
      </div>

    </div>
  );
};