/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AnimatePresence, motion } from "motion/react";
import { Download, Image as ImageIcon, Loader2, Palette, RefreshCw, Settings, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Types
type ImageSize = "1K" | "2K" | "4K";

interface BannerState {
  title: string;
  titleSize: number;
  subtitle: string;
  subtitleSize: number;
  details: string;
  detailsSize: number;
  metric: string;
  metricSize: number;
  backgroundImage: string | null;
  backgroundOpacity: number;
  borderColor: string;
  showBorder: boolean;
  textColor: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [state, setState] = useState<BannerState>({
    title: "Architecture, Développement & Croissance Digitale",
    titleSize: 48,
    subtitle: "J’aide les startups à concevoir, développer et scaler leurs plateformes web.",
    subtitleSize: 26,
    details: "Full Stack Consultant | PHP • Laravel • WordPress • SEO",
    detailsSize: 22,
    metric: "+1000 projets",
    metricSize: 14,
    backgroundImage: null,
    backgroundOpacity: 0.4,
    borderColor: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)",
    showBorder: true,
    textColor: "#ffffff",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [hasApiKey, setHasApiKey] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const generateBackground = async () => {
    if (!hasApiKey) {
      await handleOpenKeyDialog();
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [
            {
              text: "A professional, ultra-high-quality, minimalist workspace photography. A sleek modern laptop and a high-end smartphone on a clean wooden or white desk. Soft, natural morning light, very sharp focus, elegant and gentle aesthetic, neutral professional colors. No text, no AI artifacts, 16:9 aspect ratio, cinematic lighting.",
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: imageSize,
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setState((prev) => ({ ...prev, backgroundImage: imageUrl }));
          break;
        }
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const drawBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // LinkedIn Banner dimensions: 1584 x 396
    canvas.width = 1584;
    canvas.height = 396;

    // Background
    if (state.backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = state.backgroundImage;
      img.onload = () => {
        // Draw image (cover style)
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Overlay for readability
        ctx.fillStyle = `rgba(0, 0, 0, ${state.backgroundOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderText(ctx);
        if (state.showBorder) renderBorder(ctx);
      };
    } else {
      // Default dark background
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderText(ctx);
      if (state.showBorder) renderBorder(ctx);
    }
  };

  const renderBorder = (ctx: CanvasRenderingContext2D) => {
    const borderSize = 0.5;
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(0.5, "#8b5cf6");
    gradient.addColorStop(1, "#ec4899");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = borderSize;
    ctx.strokeRect(borderSize / 2, borderSize / 2, ctx.canvas.width - borderSize, ctx.canvas.height - borderSize);
  };

  const renderText = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = state.textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const padding = 80;
    let currentY = 120;

    // Title
    ctx.font = `bold ${state.titleSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(state.title, padding, currentY);
    currentY += state.titleSize + 12;

    // Subtitle
    ctx.font = `300 ${state.subtitleSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(state.subtitle, padding, currentY);
    currentY += state.subtitleSize + 24;

    // Details
    ctx.font = `500 ${state.detailsSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(state.details, padding, currentY);

    // Metric (Right side)
    ctx.textAlign = "right";
    ctx.font = `600 ${state.metricSize}px Caveat, cursive`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(state.metric, ctx.canvas.width - padding, ctx.canvas.height / 2);
  };

  useEffect(() => {
    drawBanner();
  }, [state]);

  const downloadBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "linkedin-banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">LinkedIn Banner Designer</h1>
        </div>
        <div className="flex items-center gap-4">
          {!hasApiKey && (
            <button
              onClick={handleOpenKeyDialog}
              className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition-colors"
            >
              Connect API Key
            </button>
          )}
          <button
            onClick={downloadBanner}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Type className="w-5 h-5" />
              <h2 className="font-semibold">Text Content</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) => setState({ ...state, title: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="number"
                    value={state.titleSize}
                    onChange={(e) => setState({ ...state, titleSize: parseInt(e.target.value) || 0 })}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 transition-colors text-center"
                    placeholder="Size"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Subtitle</label>
                <div className="flex gap-2">
                  <textarea
                    value={state.subtitle}
                    onChange={(e) => setState({ ...state, subtitle: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none text-sm"
                  />
                  <input
                    type="number"
                    value={state.subtitleSize}
                    onChange={(e) => setState({ ...state, subtitleSize: parseInt(e.target.value) || 0 })}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 transition-colors text-center h-10 self-start"
                    placeholder="Size"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Details</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state.details}
                    onChange={(e) => setState({ ...state, details: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="number"
                    value={state.detailsSize}
                    onChange={(e) => setState({ ...state, detailsSize: parseInt(e.target.value) || 0 })}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 transition-colors text-center"
                    placeholder="Size"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Metric</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state.metric}
                    onChange={(e) => setState({ ...state, metric: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="number"
                    value={state.metricSize}
                    onChange={(e) => setState({ ...state, metricSize: parseInt(e.target.value) || 0 })}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 transition-colors text-center"
                    placeholder="Size"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Custom Background</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setState({ ...state, backgroundImage: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                  />
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/30">
                      <span>Overlay Opacity</span>
                      <span>{Math.round(state.backgroundOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.backgroundOpacity}
                      onChange={(e) => setState({ ...state, backgroundOpacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <ImageIcon className="w-5 h-5" />
              <h2 className="font-semibold">AI Background</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Image Quality</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["1K", "2K", "4K"] as ImageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        imageSize === size
                          ? "bg-purple-500/20 border-purple-500 text-purple-300"
                          : "bg-black/40 border-white/10 text-white/60 hover:border-white/20"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateBackground}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {isGenerating ? "Generating..." : "Generate New Background"}
              </button>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-400">
                <Palette className="w-5 h-5" />
                <h2 className="font-semibold">Style</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.showBorder}
                  onChange={(e) => setState({ ...state, showBorder: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                <span className="ml-3 text-sm font-medium text-white/60">Border</span>
              </label>
            </div>
          </section>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
            
            <div className="w-full max-w-[1584px] aspect-[1584/396] relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-white/10">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-blue-400 font-medium animate-pulse">Crafting your professional background...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 text-center space-y-2">
              <p className="text-white/40 text-sm">Preview (1584 x 396 px)</p>
              <p className="text-xs text-white/20 max-w-md">
                This is how your banner will look on LinkedIn. Use the controls on the left to customize the text and background.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="text-blue-400 font-bold mb-2">Pro Tip</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                LinkedIn profile pictures cover a small portion of the bottom-left area. We've positioned your text to ensure maximum visibility.
              </p>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-purple-400 font-bold mb-2">AI Generation</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Our AI generates minimalist, high-quality workspaces to keep your profile looking clean and professional.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 p-8 text-center text-white/20 text-sm">
        <p>© 2026 LinkedIn Banner Designer • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}
