import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Plus, X, Undo2, Redo2, Palette } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface CanvasState {
  points: GradientPoint[];
  blur: number;
}

const COLOR_PALETTES = {
  "Lavender Mist": ["#ffc2d1", "#ffd4e5", "#a78bfa", "#60a5fa", "#f472b6"],
  "Sunset Blaze": ["#ff6b6b", "#ff8e53", "#ffd93d", "#fcbf49", "#f77f00"],
  "Ocean Depths": ["#0077b6", "#00b4d8", "#90e0ef", "#caf0f8", "#48cae4"],
  "Forest Dream": ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
  "Purple Haze": ["#7209b7", "#b185db", "#f72585", "#4cc9f0", "#4361ee"],
  "Warm Autumn": ["#d4a373", "#bc6c25", "#dda15e", "#fefae0", "#faedcd"],
  "Cool Mint": ["#06ffa5", "#00d9ff", "#5eead4", "#99f6e4", "#2dd4bf"],
  "Cosmic Night": ["#1e1b4b", "#4c1d95", "#7c3aed", "#a78bfa", "#c4b5fd"],
};

const CANVAS_PRESETS = [
  { name: "16:9", width: 1600, height: 900 },
  { name: "1:1", width: 1000, height: 1000 },
  { name: "4:3", width: 1200, height: 900 },
  { name: "21:9", width: 2100, height: 900 },
  { name: "9:16", width: 900, height: 1600 },
  { name: "3:4", width: 900, height: 1200 },
];

const DEFAULT_COLORS = [
  "#ffc2d1",
  "#ffd4e5",
  "#a78bfa",
  "#60a5fa",
  "#f472b6",
  "#c084fc",
  "#818cf8",
];

export const GradientCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<GradientPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [blur, setBlur] = useState(120);
  const [canvasSize, setCanvasSize] = useState(CANVAS_PRESETS[0]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Noise settings
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [noiseOpacity, setNoiseOpacity] = useState(60);
  const [noiseDensity, setNoiseDensity] = useState(42);
  const [noiseSharpness, setNoiseSharpness] = useState(2.0);
  
  // Undo/Redo state
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save state to history
  const saveToHistory = useCallback((newPoints: GradientPoint[], newBlur: number) => {
    const newState: CanvasState = { points: newPoints, blur: newBlur };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPoints(state.points);
      setBlur(state.blur);
      toast.success("Undone");
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPoints(state.points);
      setBlur(state.blur);
      toast.success("Redone");
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Initialize with default gradient points
  useEffect(() => {
    const initialPoints: GradientPoint[] = [
      { id: "1", x: 0.25, y: 0.3, color: DEFAULT_COLORS[0] },
      { id: "2", x: 0.5, y: 0.15, color: DEFAULT_COLORS[1] },
      { id: "3", x: 0.75, y: 0.5, color: DEFAULT_COLORS[3] },
      { id: "4", x: 0.4, y: 0.7, color: DEFAULT_COLORS[4] },
      { id: "5", x: 0.6, y: 0.85, color: DEFAULT_COLORS[6] },
    ];
    setPoints(initialPoints);
    saveToHistory(initialPoints, 120);
  }, []);

  // Generate noise texture
  const generateNoiseTexture = useCallback((width: number, height: number): ImageData => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Use density to control how many pixels get noise
      if (Math.random() * 100 < noiseDensity) {
        const noise = Math.random() * 255 * noiseSharpness;
        data[i] = noise;     // Red
        data[i + 1] = noise; // Green
        data[i + 2] = noise; // Blue
        data[i + 3] = noiseOpacity * 2.55; // Alpha
      } else {
        data[i + 3] = 0; // Transparent
      }
    }

    return imageData;
  }, [noiseDensity, noiseOpacity, noiseSharpness]);

  // Draw gradient on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply blur using filter
    ctx.filter = `blur(${blur}px)`;

    // Draw each gradient point
    points.forEach((point) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      const radius = Math.max(canvas.width, canvas.height) * 0.5;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, point.color);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    ctx.filter = "none";

    // Add noise texture
    if (noiseEnabled) {
      const noiseTexture = generateNoiseTexture(canvas.width, canvas.height);
      ctx.putImageData(noiseTexture, 0, 0);
    }
  }, [points, blur, canvasSize, noiseEnabled, generateNoiseTexture]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Check if clicked near existing point
    const clickedPoint = points.find((p) => {
      const dx = Math.abs(p.x - x) * rect.width;
      const dy = Math.abs(p.y - y) * rect.height;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedPoint) {
      setSelectedPoint(clickedPoint.id);
    } else {
      setSelectedPoint(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickedPoint = points.find((p) => {
      const dx = Math.abs(p.x - x) * rect.width;
      const dy = Math.abs(p.y - y) * rect.height;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    });

    if (clickedPoint) {
      setSelectedPoint(clickedPoint.id);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setPoints((prev) =>
      prev.map((p) => (p.id === selectedPoint ? { ...p, x, y } : p))
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addPoint = () => {
    if (points.length >= 10) {
      toast.error("Maximum 10 gradient points allowed");
      return;
    }

    const newPoint: GradientPoint = {
      id: Date.now().toString(),
      x: 0.5,
      y: 0.5,
      color: DEFAULT_COLORS[points.length % DEFAULT_COLORS.length],
    };

    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    saveToHistory(newPoints, blur);
    toast.success("Gradient point added");
  };

  const removePoint = (id: string) => {
    if (points.length <= 1) {
      toast.error("At least one gradient point required");
      return;
    }

    const newPoints = points.filter((p) => p.id !== id);
    setPoints(newPoints);
    setSelectedPoint(null);
    saveToHistory(newPoints, blur);
    toast.success("Gradient point removed");
  };

  const updatePointColor = (id: string, color: string) => {
    const newPoints = points.map((p) => (p.id === id ? { ...p, color } : p));
    setPoints(newPoints);
    saveToHistory(newPoints, blur);
  };

  const applyPalette = (paletteName: string) => {
    const colors = COLOR_PALETTES[paletteName as keyof typeof COLOR_PALETTES];
    if (!colors) return;

    const newPoints = points.map((point, index) => ({
      ...point,
      color: colors[index % colors.length],
    }));

    setPoints(newPoints);
    saveToHistory(newPoints, blur);
    toast.success(`Applied ${paletteName} palette`);
  };

  const updateBlur = (value: number) => {
    setBlur(value);
    saveToHistory(points, value);
  };

  const exportCanvas = async (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "png") {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gradient-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PNG downloaded!");
      });
    } else {
      // SVG export - create gradient definitions
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize.width}" height="${canvasSize.height}">
        <defs>
          ${points
            .map(
              (p, i) => `
            <radialGradient id="grad${i}" cx="${p.x * 100}%" cy="${p.y * 100}%">
              <stop offset="0%" style="stop-color:${p.color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${p.color};stop-opacity:0" />
            </radialGradient>
          `
            )
            .join("")}
        </defs>
        <rect width="100%" height="100%" fill="white"/>
        ${points
          .map(
            (p, i) => `
          <rect width="100%" height="100%" fill="url(#grad${i})" filter="blur(${blur}px)"/>
        `
          )
          .join("")}
      </svg>`;

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gradient-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("SVG downloaded!");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-card border-r border-border p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Gradient Canvas
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="h-8 w-8"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Palette className="h-4 w-4" />
            Color Palette
          </label>
          <Select onValueChange={applyPalette}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose preset..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(COLOR_PALETTES).map((paletteName) => (
                <SelectItem key={paletteName} value={paletteName}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {COLOR_PALETTES[paletteName as keyof typeof COLOR_PALETTES]
                        .slice(0, 5)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </div>
                    {paletteName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground">
            Color Layers
          </h2>
          <div className="space-y-2">
            {points.map((point) => (
              <div
                key={point.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                  selectedPoint === point.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPoint(point.id)}
              >
                <input
                  type="color"
                  value={point.color}
                  onChange={(e) => updatePointColor(point.id, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <div className="flex-1 text-xs font-mono">{point.color}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePoint(point.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={addPoint}
            variant="outline"
            className="w-full mt-3"
            disabled={points.length >= 10}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Layer
          </Button>
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-3 block">
            Blur: {blur}px
          </label>
          <Slider
            value={[blur]}
            onValueChange={(v) => updateBlur(v[0])}
            min={0}
            max={300}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-muted-foreground">
              Noise Texture
            </label>
            <Button
              variant={noiseEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setNoiseEnabled(!noiseEnabled)}
              className="h-7 px-3 text-xs"
            >
              {noiseEnabled ? "On" : "Off"}
            </Button>
          </div>

          {noiseEnabled && (
            <div className="space-y-3 pl-1">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Opacity: {noiseOpacity}%
                </label>
                <Slider
                  value={[noiseOpacity]}
                  onValueChange={(v) => setNoiseOpacity(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Density: {noiseDensity}
                </label>
                <Slider
                  value={[noiseDensity]}
                  onValueChange={(v) => setNoiseDensity(v[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Sharpness: {noiseSharpness.toFixed(1)}
                </label>
                <Slider
                  value={[noiseSharpness]}
                  onValueChange={(v) => setNoiseSharpness(v[0])}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="rounded-xl shadow-2xl cursor-crosshair max-w-full max-h-[80vh] border border-border"
            style={{ width: "auto", height: "auto" }}
          />
          {/* Point indicators */}
          {points.map((point) => (
            <div
              key={point.id}
              className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform pointer-events-none ${
                selectedPoint === point.id ? "scale-125" : ""
              }`}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: point.color,
              }}
            />
          ))}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
            {canvasSize.width} × {canvasSize.height}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-card border-l border-border p-6 space-y-6 overflow-y-auto">
        <div>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground">
            Canvas Size
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {CANVAS_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant={
                  canvasSize.name === preset.name ? "default" : "outline"
                }
                onClick={() => setCanvasSize(preset)}
                className="font-mono text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Width</label>
                <input
                  type="number"
                  value={canvasSize.width}
                  onChange={(e) =>
                    setCanvasSize({
                      ...canvasSize,
                      width: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Height</label>
                <input
                  type="number"
                  value={canvasSize.height}
                  onChange={(e) =>
                    setCanvasSize({
                      ...canvasSize,
                      height: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-input border border-border rounded px-3 py-2 text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground">
            Export Format
          </h2>
          <div className="space-y-2">
            <Button
              onClick={() => exportCanvas("png")}
              className="w-full justify-start"
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              PNG (Max Quality)
            </Button>
            <Button
              onClick={() => exportCanvas("svg")}
              className="w-full justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              SVG (Vector)
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-2">
          <p>💡 Drag points to move gradients</p>
          <p>🎨 Click swatches to change colors</p>
          <p>⌨️ Ctrl+Z to undo, Ctrl+Y to redo</p>
          <p>🎭 Try different color palettes</p>
        </div>
      </div>
    </div>
  );
};
