import React from 'react';
import { GeneratedAsset } from '../types';

interface AssetGalleryProps {
  assets: GeneratedAsset[];
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({ assets }) => {
  if (assets.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 mt-12 animate-fade-in-up">
      <h3 className="text-xs font-mono text-gray-500 uppercase mb-6 border-b border-white/10 pb-2">Generated Artifacts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group relative overflow-hidden rounded-xl bg-gray-900 border border-white/10">
            <img 
              src={asset.imageUrl} 
              alt={asset.type} 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <span className="text-xs font-mono text-purple-400 uppercase">{asset.type}</span>
              <p className="text-xs text-gray-400 truncate">{new Date(asset.timestamp).toLocaleTimeString()}</p>
              <a 
                href={asset.imageUrl} 
                download={`omni-vibe-${asset.type}-${asset.id}.png`}
                className="mt-2 text-white text-sm font-bold underline decoration-purple-500"
              >
                Download Asset
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};