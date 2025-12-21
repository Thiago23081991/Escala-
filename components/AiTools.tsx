
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { ImageSize, AspectRatio } from '../types';
import { ImageIcon, Video, Send, Loader2, Key, Download, Sparkles, Wand2, Music2 } from 'lucide-react';

const AiTools: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const checkAndRun = async (fn: () => Promise<void>) => {
    try {
      setIsLoading(true);
      await fn();
    } catch (error: any) {
      if (error.message === 'API_KEY_REQUIRED') {
        const aistudio = (window as any).aistudio;
        if (aistudio && typeof aistudio.openSelectKey === 'function') {
          await aistudio.openSelectKey();
          setHasApiKey(true);
        }
        try { await fn(); } catch (e) { alert("Erro ao processar: " + (e as Error).message); }
      } else {
        alert("Erro: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (mode: 'image' | 'video', text: string, ratio?: AspectRatio) => {
    setActiveMode(mode);
    setPrompt(text);
    if (ratio) setSelectedRatio(ratio);
    setResultUrl(null);
  };

  const handleGenerateImage = async () => {
    await checkAndRun(async () => {
      const url = await GeminiService.generateImage(prompt, selectedSize);
      setResultUrl(url);
    });
  };

  const handleAnimateImage = async () => {
    if (!uploadImage) return alert("Selecione uma imagem primeiro!");
    await checkAndRun(async () => {
      const url = await GeminiService.animateImage(prompt, uploadImage, selectedRatio);
      setResultUrl(url);
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (hasApiKey === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <Key className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Chave de API Necessária</h3>
          <p className="text-slate-600">
            Para utilizar a geração de imagens em alta resolução (Gemini 3 Pro) e animação de vídeos (Veo), é necessário selecionar uma chave de API vinculada a um projeto Google Cloud pago.
          </p>
        </div>
        <button
          onClick={handleOpenKey}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Selecionar Minha Chave de API
        </button>
        <p className="text-xs text-slate-400">
          Acesse a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-600">documentação de faturamento</a> para mais detalhes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Criação com IA</h2>
        <p className="text-slate-600">
          Crie artes para os cultos ou anime fotos dos membros usando as tecnologias mais avançadas do Google.
        </p>
      </div>

      <div className="flex justify-center p-1 bg-slate-200 rounded-xl w-fit mx-auto">
        <button
          onClick={() => { setActiveMode('image'); setResultUrl(null); }}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 transition ${activeMode === 'image' ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-600'}`}
        >
          <ImageIcon className="w-4 h-4" />
          Gerar Imagem
        </button>
        <button
          onClick={() => { setActiveMode('video'); setResultUrl(null); }}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 transition ${activeMode === 'video' ? 'bg-white shadow-sm font-bold text-indigo-600' : 'text-slate-600'}`}
        >
          <Video className="w-4 h-4" />
          Animar Foto (Veo)
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {activeMode === 'video' && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-2">Selecione a Imagem base</label>
              <input type="file" onChange={onFileChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {uploadImage && (
                <div className="relative mt-4">
                  <img src={uploadImage} className="h-40 w-full object-cover rounded-lg border border-slate-100" alt="Preview" />
                  <button onClick={() => setUploadImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"><Sparkles className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700">Instrução (Prompt)</label>
              <Wand2 className="w-4 h-4 text-indigo-400" />
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={activeMode === 'image' ? "Ex: Uma arte moderna para culto de jovens, luzes neon, instrumentos musicais..." : "Ex: Faça a pessoa na foto cantar e sorrir suavemente..."}
              className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
            />
            
            {/* Presets Section */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-full mb-1">Modelos rápidos:</span>
              {activeMode === 'video' ? (
                <button 
                  onClick={() => applyPreset('video', "Pessoa sorrindo e cantando suavemente, iluminação cinematográfica de adoração, fundo com luzes quentes e desfoque suave, atmosfera espiritual de gratidão.", '9:16')}
                  className="text-[11px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1.5 transition font-medium"
                >
                  <Music2 className="w-3 h-3" />
                  Membro Cantando (9:16)
                </button>
              ) : (
                <button 
                  onClick={() => applyPreset('image', "Arte minimalista para fundo de projeção de igreja, cruz abstrata, cores suaves azul e roxo, luz volumétrica, alta qualidade, estilo contemporâneo.")}
                  className="text-[11px] bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full border border-slate-100 hover:bg-slate-100 flex items-center gap-1.5 transition font-medium"
                >
                  <ImageIcon className="w-3 h-3" />
                  Background de Culto
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {activeMode === 'image' ? (
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Qualidade</label>
                <select 
                  value={selectedSize} 
                  onChange={e => setSelectedSize(e.target.value as ImageSize)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  <option value="1K">1K (Redes Sociais)</option>
                  <option value="2K">2K (Projeção)</option>
                  <option value="4K">4K (Impressão/Banner)</option>
                </select>
              </div>
            ) : (
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Formato do Vídeo</label>
                <select 
                  value={selectedRatio} 
                  onChange={e => setSelectedRatio(e.target.value as AspectRatio)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  <option value="16:9">Landscape (YouTube/TV)</option>
                  <option value="9:16">Portrait (Reels/Stories)</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-3 border border-amber-100">
            <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Criações avançadas utilizam o <b>Gemini 3 Pro</b> ou <b>Veo</b>, requerendo sua chave de API pessoal.
            </p>
          </div>

          <button
            onClick={activeMode === 'image' ? handleGenerateImage : handleAnimateImage}
            disabled={isLoading || !prompt}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoading ? "Processando com IA..." : (activeMode === 'image' ? "Criar Arte" : "Gerar Animação")}
          </button>
        </div>

        {/* Result Panel */}
        <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="text-center space-y-4 p-8">
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-lg">Inspirando a IA...</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Isso pode levar alguns minutos dependendo da complexidade do vídeo.</p>
              </div>
            </div>
          ) : resultUrl ? (
            <div className="w-full h-full flex flex-col animate-in zoom-in duration-500 p-4">
              <div className="flex-1 flex items-center justify-center">
                {activeMode === 'image' ? (
                  <img src={resultUrl} className="max-w-full max-h-[500px] rounded-lg shadow-2xl border-4 border-white" alt="IA Result" />
                ) : (
                  <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-[500px] rounded-lg shadow-2xl border-4 border-white" />
                )}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-slate-400 italic">Geração concluída com sucesso!</p>
                <a href={resultUrl} download="arte-louvor" className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-md font-semibold text-sm">
                  <Download className="w-4 h-4" />
                  Baixar Arquivo
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-4">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Pronto para criar?</p>
                <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Seu conteúdo gerado por IA aparecerá aqui em instantes.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTools;
