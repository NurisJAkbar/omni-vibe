import React, { useState, useRef } from 'react';
import { analyzeVibe, generateAsset } from './services/geminiService';
import { BrandIdentity, GeneratedAsset, AppState } from './types';
import { AnalysisView } from './components/AnalysisView';
import { AssetGallery } from './components/AssetGallery';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ensureApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !inputPrompt) return;
    
    await ensureApiKey();

    setAppState(AppState.ANALYZING);
    try {
      const identity = await analyzeVibe(selectedFile!, inputPrompt);
      setBrandData(identity);
      setAppState(AppState.REVIEW);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
      setAppState(AppState.IDLE);
    }
  };

  const handleGenerateAsset = async (type: 'logo' | 'social' | 'mockup') => {
    if (!brandData) return;
    
    await ensureApiKey();

    setAppState(AppState.GENERATING_ASSET);
    try {
      // Pass the selectedFile (original input) as a reference for the image generation
      const base64Image = await generateAsset(type, brandData, selectedFile);
      const newAsset: GeneratedAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        imageUrl: base64Image,
        promptUsed: type,
        timestamp: Date.now()
      };
      
      setGeneratedAssets(prev => [newAsset, ...prev]);
      setAppState(AppState.REVIEW); 
    } catch (error: any) {
      console.error("Asset generation failed:", error);
      
      // Handle fatal errors that couldn't be solved by fallback
      if (error.status === 403 || error.message?.includes("PERMISSION_DENIED")) {
        alert("Permission denied. Please select a valid API key.");
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            await aistudio.openSelectKey();
        }
      } else {
        alert("Failed to generate asset. Please try again.");
      }
      setAppState(AppState.REVIEW);
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setBrandData(null);
    setGeneratedAssets([]);
    setSelectedFile(null);
    setFilePreview(null);
    setInputPrompt("");
  };

  return (
    <div className="min-h-screen pb-20 bg-[#050505] text-white selection:bg-purple-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse-slow"></div>
            <span className="font-bold tracking-widest text-sm">OMNI-VIBE</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono text-gray-500 hidden md:block">
               {appState === AppState.IDLE && 'SYSTEM READY'}
               {appState === AppState.ANALYZING && 'REASONING ENGINE: ACTIVE'}
               {appState === AppState.GENERATING_ASSET && 'IMAGE MODEL: GENERATING'}
               {appState === AppState.REVIEW && 'INTERACTIVE MODE'}
            </div>
            
            {appState !== AppState.IDLE && (
              <button 
                onClick={reset}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 px-4 md:px-8">
        
        {/* IDLE STATE: INPUT */}
        {appState === AppState.IDLE && (
          <div className="max-w-3xl mx-auto mt-12 md:mt-24 space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
                Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Creative Director</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Upload raw visual data. Our Gemini-powered engine analyzes aesthetics, plans a brand system, and generates high-fidelity assets instantly.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl shadow-purple-900/20">
              
              {/* File Upload - input_media */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-64 w-full border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden"
              >
                {filePreview ? (
                  <>
                     {selectedFile?.type.startsWith('video') ? (
                       <video src={filePreview} className="absolute inset-0 w-full h-full object-cover opacity-60" autoPlay loop muted />
                     ) : (
                       <img src={filePreview} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Preview" />
                     )}
                     <div className="relative z-10 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                       <span className="text-sm font-medium">Change File</span>
                     </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 font-medium">Upload Your Inspiration (Photo/Video/Sketch)</p>
                    <p className="text-gray-500 text-xs mt-2">Supports JPG, PNG, MP4</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Text Prompt - target_vibe */}
              <div className="mt-6">
                <label className="text-xs font-mono text-gray-500 uppercase mb-2 block">What vibe are you going for? (e.g. Luxury, Retro, Cyberpunk, Minimalist)</label>
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Describe your visual vision..."
                  className="w-full bg-black/30 border border-gray-800 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile && !inputPrompt}
                className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Analysis
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-t-4 border-blue-500 rounded-full animate-spin-slow"></div>
            </div>
            <h2 className="mt-8 text-2xl font-light tracking-wide">Deconstructing Vibe...</h2>
            <p className="text-gray-500 mt-2 font-mono text-sm">Gemini 3 Pro Thinking Model is actively reasoning.</p>
          </div>
        )}
        
        {/* GENERATING ASSET STATE OVERLAY */}
         {appState === AppState.GENERATING_ASSET && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
             <h2 className="text-2xl font-bold">Rendering Asset</h2>
             <p className="text-gray-400 mt-2">High-fidelity generation in progress...</p>
           </div>
         )}

        {/* REVIEW STATE */}
        {(appState === AppState.REVIEW || appState === AppState.GENERATING_ASSET) && brandData && (
          <>
            <AnalysisView 
              data={brandData} 
              onGenerateAsset={handleGenerateAsset} 
              isGenerating={appState === AppState.GENERATING_ASSET}
            />
            <AssetGallery assets={generatedAssets} />
          </>
        )}

      </main>
    </div>
  );
};

export default App;