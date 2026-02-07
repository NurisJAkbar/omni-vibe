import React, { useState, useRef, useEffect } from 'react';
import { analyzeVibe, generateAsset } from './services/geminiService';
import { BrandIdentity, GeneratedAsset, AppState } from './types';
import { AnalysisView } from './components/AnalysisView';
import { AssetGallery } from './components/AssetGallery';

const App: React.FC = () => {
  // Application State
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Data State
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize: Check localStorage for existing key ONLY.
  // We strictly ignore process.env.API_KEY to force manual entry as requested.
  useEffect(() => {
    const storedKey = localStorage.getItem('omni_vibe_api_key');

    if (storedKey && storedKey.length > 10) {
      setApiKey(storedKey);
      setIsKeySet(true);
    } 
  }, []);

  const handleSaveKey = () => {
    const cleanedKey = apiKey.trim();
    if (cleanedKey.length > 10 && cleanedKey.startsWith('AIza')) {
      localStorage.setItem('omni_vibe_api_key', cleanedKey);
      setApiKey(cleanedKey);
      setIsKeySet(true);
    } else {
      alert("Invalid Key Format. Gemini API Keys typically start with 'AIza'.");
    }
  };

  const handleClearKey = () => {
    if (confirm("Are you sure you want to remove your API Key and reset?")) {
      localStorage.removeItem('omni_vibe_api_key');
      setApiKey('');
      setIsKeySet(false);
      reset();
    }
  };

  // Helper to handle API errors and force re-auth if needed
  const handleApiError = (error: any) => {
    console.error("API Error detected:", error);
    let msg = "An unexpected error occurred.";
    
    // Auth Errors
    if (error.message.includes("403") || error.message.includes("API Key is missing") || error.message.includes("PERMISSION_DENIED")) {
      msg = "Authentication Failed: Your API Key is invalid or expired.";
      alert(msg);
      localStorage.removeItem('omni_vibe_api_key'); // Clear bad key
      setApiKey('');
      setIsKeySet(false);
      reset();
      return;
    }

    // Server Errors
    if (error.message.includes("503") || error.message.includes("Overloaded")) {
      msg = "Service Overloaded: The AI model is currently busy. Please retry in a moment.";
    } else if (error.message.includes("404")) {
      msg = "Model Not Found: The selected model is not available for this key/region.";
    } else {
      msg = `Error: ${error.message}`;
    }

    alert(msg);
  };

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

  const handleAnalyze = async () => {
    if ((!selectedFile && !inputPrompt) || !isKeySet) return;
    
    setAppState(AppState.ANALYZING);
    try {
      const identity = await analyzeVibe(apiKey, selectedFile, inputPrompt);
      setBrandData(identity);
      setAppState(AppState.REVIEW);
    } catch (error: any) {
      handleApiError(error);
      setAppState(AppState.IDLE);
    }
  };

  const handleGenerateAsset = async (type: 'logo' | 'social' | 'mockup') => {
    if (!brandData || !isKeySet) return;
    
    setAppState(AppState.GENERATING_ASSET);
    try {
      // Pass the selectedFile (original input) as a reference for the image generation
      const base64Image = await generateAsset(apiKey, type, brandData, selectedFile);
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
      handleApiError(error);
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

  // -----------------------------------------------------------------------
  // RENDER: GATEWAY SCREEN (No API Key)
  // -----------------------------------------------------------------------
  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-white/10 shadow-2xl shadow-purple-900/20 text-center animate-fade-in relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Access Required</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            OmniVibe Studio uses advanced Gemini 3 models. Please enter your API key to initialize the autonomous agent.
          </p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste Gemini API Key (AIza...)"
              className="w-full bg-black/40 border border-white/20 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm text-center"
            />
            
            <button
              onClick={handleSaveKey}
              className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Initialize Studio</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-1"
            >
              <span>Don't have a key? Get one from Google AI Studio</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // RENDER: MAIN APP
  // -----------------------------------------------------------------------
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
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
              </div>
              
              <button 
                onClick={handleClearKey}
                className="group p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Disconnect / Reset API Key"
              >
                <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
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
                className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Begin Analysis</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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