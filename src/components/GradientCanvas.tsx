import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

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
  }, []);

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
  }, [points, blur, canvasSize]);

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

    setPoints([...points, newPoint]);
    toast.success("Gradient point added");
  };

  const removePoint = (id: string) => {
    if (points.length <= 1) {
      toast.error("At least one gradient point required");
      return;
    }

    setPoints(points.filter((p) => p.id !== id));
    setSelectedPoint(null);
    toast.success("Gradient point removed");
  };

  const updatePointColor = (id: string, color: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
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
            onValueChange={(v) => setBlur(v[0])}
            min={0}
            max={300}
            step={1}
            className="w-full"
          />
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
          <p>💡 Click and drag to move gradient points</p>
          <p>🎨 Click color swatches to change colors</p>
          <p>➕ Add up to 10 gradient layers</p>
        </div>
      </div>
    </div>
  );
};
