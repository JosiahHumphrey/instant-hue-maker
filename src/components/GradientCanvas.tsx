import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Save, FolderOpen, Menu, Sliders, Palette } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { CanvasRenderer } from "./CanvasRenderer";
import { ModeToggle } from "./mode-toggle";
import { LeftSidebarContent, RightSidebarContent } from "./CanvasControls";
import { GradientLayer, GradientPoint, DitherMode } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedPreset {
  name: string;
  layers: GradientLayer[];
}

const COLOR_PALETTES = {
  // Original Favorites
  "Lavender Mist": ["#ffc2d1", "#ffd4e5", "#a78bfa", "#60a5fa", "#f472b6"],
  "Sunset Blaze": ["#ff6b6b", "#ff8e53", "#ffd93d", "#fcbf49", "#f77f00"],
  "Ocean Depths": ["#0077b6", "#00b4d8", "#90e0ef", "#caf0f8", "#48cae4"],
  "Forest Dream": ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"],
  "Purple Haze": ["#7209b7", "#b185db", "#f72585", "#4cc9f0", "#4361ee"],
  "Warm Autumn": ["#d4a373", "#bc6c25", "#dda15e", "#fefae0", "#faedcd"],
  "Cool Mint": ["#06ffa5", "#00d9ff", "#5eead4", "#99f6e4", "#2dd4bf"],
  "Cosmic Night": ["#1e1b4b", "#4c1d95", "#7c3aed", "#a78bfa", "#c4b5fd"],
  
  // Nature & Earth
  "Desert Sand": ["#e4a672", "#f4e1d2", "#bc6c25", "#dda15e", "#fefae0"],
  "Tropical Paradise": ["#06d6a0", "#118ab2", "#073b4c", "#ffd166", "#ef476f"],
  "Mountain Mist": ["#778da9", "#9db4c0", "#c2dfe3", "#e0fbfc", "#5e6472"],
  "Cherry Blossom": ["#ffb3c6", "#ff8fab", "#fb6f92", "#c9184a", "#ffc2d1"],
  "Emerald Forest": ["#1b4332", "#2d6a4f", "#52b788", "#95d5b2", "#d8f3dc"],
  "Coral Reef": ["#ff6b9d", "#fec5bb", "#fcd5ce", "#f8edeb", "#e8e8e4"],
  "Golden Hour": ["#f4a261", "#e76f51", "#e9c46a", "#2a9d8f", "#264653"],
  "Arctic Ice": ["#d0e1f9", "#9fc3e8", "#7ab8e8", "#4d9de0", "#3685b5"],
  "Jungle Canopy": ["#1a4d2e", "#2e7d32", "#4caf50", "#81c784", "#a5d6a7"],
  "Autumn Leaves": ["#8b0000", "#d2691e", "#ff8c00", "#ffd700", "#daa520"],
  
  // Sky & Weather
  "Stormy Clouds": ["#36454f", "#4a5568", "#718096", "#a0aec0", "#cbd5e0"],
  "Clear Sky": ["#87ceeb", "#4a90e2", "#0077be", "#006ba6", "#003f5c"],
  "Sunrise Glow": ["#ff6b35", "#f7931e", "#fdc500", "#ffe74c", "#fff275"],
  "Twilight Hour": ["#4a148c", "#6a1b9a", "#8e24aa", "#9c27b0", "#ab47bc"],
  "Northern Lights": ["#00ff87", "#60efff", "#a78bfa", "#f72585", "#4cc9f0"],
  "Rainy Day": ["#546e7a", "#607d8b", "#78909c", "#90a4ae", "#b0bec5"],
  "Moonlight": ["#191970", "#2e3192", "#483d8b", "#6a5acd", "#7b68ee"],
  "Cotton Candy": ["#ffafcc", "#ffc8dd", "#cdb4db", "#bde0fe", "#a2d2ff"],
  
  // Seasons
  "Spring Meadow": ["#90ee90", "#98fb98", "#7cfc00", "#adff2f", "#9acd32"],
  "Summer Breeze": ["#ffeb3b", "#ffc107", "#ff9800", "#00bcd4", "#4dd0e1"],
  "Fall Harvest": ["#8b4513", "#a0522d", "#d2691e", "#cd853f", "#daa520"],
  "Winter Frost": ["#e0f2f7", "#b2ebf2", "#80deea", "#4dd0e1", "#26c6da"],
  
  // Moods & Emotions
  "Romantic Blush": ["#ff69b4", "#ff1493", "#db7093", "#c71585", "#ffc0cb"],
  "Peaceful Zen": ["#d4e7c5", "#bfd8bd", "#99c1b2", "#8e9aaf", "#cbc5ea"],
  "Energetic Burst": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
  "Melancholic Blue": ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8"],
  "Joyful Bright": ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"],
  "Calm Waters": ["#caf0f8", "#90e0ef", "#00b4d8", "#0077b6", "#03045e"],
  "Warm Embrace": ["#f4978e", "#f8ad9d", "#fbc4ab", "#ffdab9", "#ffe5d9"],
  "Cool Refresh": ["#06ffa5", "#06d6a0", "#00a8cc", "#0091ad", "#006d77"],
  
  // Food & Drink
  "Strawberry Cream": ["#ff6b9d", "#ff8fab", "#ffb3c6", "#ffc2d1", "#ffd4e5"],
  "Mint Chocolate": ["#3d2e1f", "#654321", "#06ffa5", "#00d9ff", "#5eead4"],
  "Peach Sorbet": ["#ffb347", "#ffa07a", "#ff8c69", "#ff7f50", "#ff6347"],
  "Blueberry Jam": ["#191970", "#4169e1", "#6495ed", "#87ceeb", "#b0c4de"],
  "Lemon Drop": ["#fff44f", "#ffed4e", "#ffea00", "#fdd835", "#fbc02d"],
  "Grape Crush": ["#4b0082", "#6a0dad", "#8a2be2", "#9370db", "#ba55d3"],
  "Orange Juice": ["#ff8c00", "#ffa500", "#ffb347", "#ffc478", "#ffd699"],
  "Raspberry Swirl": ["#e30b5d", "#ff006e", "#ff1493", "#ff69b4", "#ffb6c1"],
  
  // Gemstones & Minerals
  "Ruby Red": ["#9b111e", "#e0115f", "#ff0033", "#ff033e", "#ff1744"],
  "Sapphire Blue": ["#0f52ba", "#0067a5", "#007ba7", "#0e86d4", "#4a9eff"],
  "Emerald Green": ["#046307", "#0c7c59", "#50c878", "#5edc94", "#90ee90"],
  "Amethyst Purple": ["#9966cc", "#a37ab5", "#b19cd9", "#c5b4e3", "#d8bfd8"],
  "Topaz Gold": ["#ffb347", "#ffc04d", "#ffd700", "#ffe135", "#ffed4e"],
  "Turquoise Dream": ["#30d5c8", "#40e0d0", "#48d1cc", "#7fffd4", "#afeeee"],
  "Rose Quartz": ["#f4c2c2", "#ffc0cb", "#ffb6c1", "#ffaac0", "#ff9ebf"],
  "Onyx Black": ["#0f0f0f", "#1a1a1a", "#2d2d2d", "#404040", "#595959"],
  
  // Art Movements
  "Impressionist": ["#9bc1bc", "#5ca4a9", "#e6ebe0", "#f0b67f", "#fe5f55"],
  "Pop Art": ["#ff006e", "#00f5ff", "#ffbe0b", "#fb5607", "#8338ec"],
  "Art Deco": ["#1a1a1d", "#c3073f", "#950740", "#6f2232", "#4e4e50"],
  "Abstract Express": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
  "Minimalist": ["#ffffff", "#f5f5f5", "#e0e0e0", "#bdbdbd", "#9e9e9e"],
  "Surrealist": ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5", "#ffbe0b"],
  "Renaissance": ["#8b4513", "#cd853f", "#daa520", "#b8860b", "#8b7355"],
  
  // Time of Day
  "Dawn Breaking": ["#ff6b35", "#f7931e", "#fdc500", "#ffe74c", "#fff8dc"],
  "High Noon": ["#ffeb3b", "#ffc107", "#ff9800", "#87ceeb", "#4a90e2"],
  "Dusk Falling": ["#ff4e50", "#fc913a", "#f9d423", "#e05e6f", "#c94e50"],
  "Midnight Hour": ["#000080", "#191970", "#0c0c44", "#0e0e2c", "#1a1a3e"],
  "Blue Hour": ["#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
  "Golden Afternoon": ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
  
  // Geographic & Cultural
  "Sahara Desert": ["#c19a6b", "#d2b48c", "#deb887", "#f5deb3", "#ffe4b5"],
  "Amazon Rainforest": ["#013220", "#006400", "#228b22", "#32cd32", "#90ee90"],
  "Arctic Tundra": ["#e0f2f7", "#b2ebf2", "#80deea", "#ffffff", "#f0f8ff"],
  "Mediterranean": ["#0077be", "#1e90ff", "#00ced1", "#f0e68c", "#ff6347"],
  "Asian Spice": ["#ff0000", "#ffa500", "#ffd700", "#8b0000", "#ff4500"],
  "Caribbean Splash": ["#00ced1", "#40e0d0", "#48d1cc", "#afeeee", "#7fffd4"],
  "Nordic Cool": ["#2d4059", "#ea5455", "#f07b3f", "#ffd460", "#ffffff"],
  "African Sunset": ["#ff6b35", "#f7931e", "#fdc500", "#8b4513", "#d2691e"],
  
  // Abstract & Conceptual
  "Neon Nights": ["#ff006e", "#fb5607", "#ffbe0b", "#00f5ff", "#8338ec"],
  "Cyberpunk": ["#ff006e", "#00f5ff", "#8338ec", "#3a0ca3", "#4cc9f0"],
  "Vaporwave": ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96"],
  "Retro Gaming": ["#ff6b35", "#f7931e", "#00d9ff", "#8338ec", "#fb5607"],
  "Steampunk": ["#8b4513", "#cd853f", "#daa520", "#b8860b", "#666666"],
  "Pastel Dream": ["#ffcccb", "#ffb3ba", "#bae1ff", "#ffffba", "#baffc9"],
  "Monochrome": ["#000000", "#404040", "#808080", "#c0c0c0", "#ffffff"],
  "Iridescent": ["#ff006e", "#fb5607", "#ffbe0b", "#00f5ff", "#8338ec"],
  
  // Brand Inspired
  "Tech Blue": ["#0066cc", "#0080ff", "#0099ff", "#00b3ff", "#00ccff"],
  "Corporate Gray": ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7"],
  "Startup Energy": ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
  "Luxury Gold": ["#ffd700", "#ffdf00", "#ffed4e", "#fff44f", "#fff9c4"],
  "Eco Green": ["#2e7d32", "#388e3c", "#43a047", "#4caf50", "#66bb6a"],
  
  // Florals
  "Rose Garden": ["#ff1744", "#ff5252", "#ff6e7f", "#ff8a9b", "#ffa8b8"],
  "Lavender Field": ["#967bb6", "#b695c0", "#c8a2c8", "#dda0dd", "#e6e6fa"],
  "Sunflower": ["#ffb700", "#ffc300", "#ffd000", "#ffdd00", "#ffea00"],
  "Orchid Bloom": ["#da70d6", "#dda0dd", "#ee82ee", "#ff00ff", "#ff1493"],
  "Tulip Festival": ["#ff1744", "#ff6e40", "#ffab40", "#ffea00", "#ff5252"],
  "Jasmine White": ["#fffff0", "#fffafa", "#faf0e6", "#faebd7", "#f5f5dc"],
  
  // Metals & Metallics
  "Silver Shine": ["#c0c0c0", "#d3d3d3", "#dcdcdc", "#e8e8e8", "#f5f5f5"],
  "Bronze Age": ["#cd7f32", "#d2942b", "#daa520", "#e0a342", "#ecb159"],
  "Copper Glow": ["#b87333", "#c27c53", "#cc8866", "#d4957d", "#dda394"],
  "Platinum Luxury": ["#e5e4e2", "#eaeaea", "#f0f0f0", "#f5f5f5", "#fafafa"],
  "Iron Gray": ["#545454", "#696969", "#7d7d7d", "#919191", "#a6a6a6"],
  
  // Candy & Sweets
  "Bubblegum Pink": ["#ff69b4", "#ff85c1", "#ffa0ce", "#ffb8db", "#ffd0e8"],
  "Candy Apple": ["#ff0800", "#ff1744", "#ff5252", "#ff6b6b", "#ff8282"],
  "Cotton Candy Sky": ["#ffb3d9", "#ffc2e0", "#ffd1e8", "#ffe0f0", "#fff0f8"],
  "Jelly Bean": ["#ff006e", "#fb5607", "#ffbe0b", "#00f5ff", "#8338ec"],
  "Licorice Mix": ["#000000", "#1a1a1a", "#4b0082", "#8a2be2", "#9370db"],
  
  // Sports & Teams
  "Athletic Red": ["#c8102e", "#dc143c", "#e21b3c", "#ff1744", "#ff4569"],
  "Team Blue": ["#0051ba", "#0066cc", "#007acc", "#1e90ff", "#4a9eff"],
  "Victory Gold": ["#ffc72c", "#ffd700", "#ffe135", "#ffed4e", "#fff44f"],
  "Championship": ["#000000", "#ffd700", "#c0c0c0", "#cd7f32", "#ffffff"],
  
  // Elements
  "Fire": ["#ff0000", "#ff4500", "#ff6347", "#ff7f50", "#ffa500"],
  "Water": ["#0077be", "#00a8cc", "#00b4d8", "#48cae4", "#90e0ef"],
  "Earth": ["#8b4513", "#a0522d", "#cd853f", "#d2691e", "#daa520"],
  "Air": ["#87ceeb", "#add8e6", "#b0e0e6", "#e0f6ff", "#f0f8ff"],
  "Lightning": ["#ffff00", "#ffed4e", "#fff44f", "#fffacd", "#ffffff"],
  
  // Mythical & Fantasy
  "Dragon Fire": ["#8b0000", "#dc143c", "#ff4500", "#ff6347", "#ffa500"],
  "Unicorn Magic": ["#ff69b4", "#dda0dd", "#9370db", "#ba55d3", "#ffffff"],
  "Mermaid Scales": ["#00ced1", "#40e0d0", "#48d1cc", "#7fffd4", "#afeeee"],
  "Phoenix Flame": ["#ff0000", "#ff4500", "#ff8c00", "#ffa500", "#ffd700"],
  "Fairy Dust": ["#ffb3d9", "#dda0dd", "#9370db", "#00ced1", "#fffacd"],
  
  // Cinema & Film
  "Film Noir": ["#000000", "#1a1a1a", "#2d2d2d", "#404040", "#808080"],
  "Technicolor": ["#ff006e", "#fb5607", "#ffbe0b", "#00f5ff", "#8338ec"],
  "Sepia Tone": ["#704214", "#8b6914", "#a0825c", "#b8977a", "#d2b48c"],
  "Hollywood Gold": ["#ffd700", "#ffe135", "#ffed4e", "#fff44f", "#fffacd"],
  
  // Music Genres
  "Jazz Blues": ["#191970", "#4169e1", "#6495ed", "#b0c4de", "#f0e68c"],
  "Rock & Roll": ["#000000", "#8b0000", "#dc143c", "#ff0000", "#ff4500"],
  "Classical": ["#2e2e2e", "#4a4a4a", "#696969", "#8b8b8b", "#d3d3d3"],
  "Electronic": ["#00f5ff", "#00d9ff", "#8338ec", "#ff006e", "#ffbe0b"],
  "Reggae Vibes": ["#006400", "#ffd700", "#ff0000", "#ffa500", "#228b22"],
};

const createNewLayer = (name: string, existingLayers: GradientLayer[]): GradientLayer => {
  const defaultPoints: GradientPoint[] = [
    { id: `p${Date.now()}-1`, x: 0.25, y: 0.3, color: DEFAULT_COLORS[0] },
    { id: `p${Date.now()}-2`, x: 0.5, y: 0.15, color: DEFAULT_COLORS[1] },
    { id: `p${Date.now()}-3`, x: 0.75, y: 0.5, color: DEFAULT_COLORS[3] },
  ];

  return {
    id: `layer-${Date.now()}-${existingLayers.length}`,
    name: name,
    points: defaultPoints,
    blur: 120,
    gradientSpread: 0.6,
    backgroundColor: "#ffffff",
    fadeEndpoint: 1.0,
    blendMode: "source-over",
    opacity: 1,
    noiseEnabled: true,
    noiseOpacity: 20,
    noiseDensity: 20,
    noiseSharpness: 2.0,
    ditherMode: "none",
    ditherIntensity: 128,
    imageOpacity: 100,
    ditherScale: 1.0,
    ditherInvert: false,
    imageContrast: 0,
    imageBrightness: 0,
    imageMidtones: 0,
    imageHighlights: 0,
    imageLuminanceThreshold: 127,
    imageHue: 0,
    imageSaturation: 0,
    isVisible: true,
  };
};

const CANVAS_PRESETS = [
  { name: "16:9", width: 1600, height: 900 },
  { name: "1:1", width: 1000, height: 1000 },
  { name: "4:3", width: 1200, height: 900 },
  { name: "21:9", width: 2100, height: 900 },
  { name: "9:16", width: 900, height: 1600 },
  { name: "3:4", width: 900, height: 1200 },
];

const EDGE_PRESETS = {
  "Full Coverage": { spread: 1.2, fadeEndpoint: 0.7, backgroundColor: "#ffffff" },
  "Soft & Airy": { spread: 0.5, fadeEndpoint: 1.0, backgroundColor: "#ffffff" },
  "Bold & Vibrant": { spread: 0.9, fadeEndpoint: 0.5, backgroundColor: "#000000" },
  "Organic Blend": { spread: 0.7, fadeEndpoint: 0.8, backgroundColor: "#ffffff" },
  "Minimal Edges": { spread: 0.4, fadeEndpoint: 0.9, backgroundColor: "#f5f5f5" },
};

const DEFAULT_COLORS = [
  "#ffc2d1",
  "#ffd4e5",
  "#a78bfa",
  "#60a5fa",
  "#f472b6",
  "#c084fc",
  "#818cf8",
];

const BLEND_MODES: GlobalCompositeOperation[] = [
  "source-over",     // Normal
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
];

const BLEND_MODE_LABELS: Record<GlobalCompositeOperation, string> = {
  "source-over": "Normal",
  "multiply": "Multiply",
  "screen": "Screen",
  "overlay": "Overlay",
  "darken": "Darken",
  "lighten": "Lighten",
  "color-dodge": "Color Dodge",
  "color-burn": "Color Burn",
  "hard-light": "Hard Light",
  "soft-light": "Soft Light",
  "difference": "Difference",
  "exclusion": "Exclusion",
  "source-atop": "Source Atop",
  "source-in": "Source In",
  "source-out": "Source Out",
  "destination-over": "Destination Over",
  "destination-atop": "Destination Atop",
  "destination-in": "Destination In",
  "destination-out": "Destination Out",
  "lighter": "Lighter",
  "copy": "Copy",
  "xor": "XOR",
  "hue": "Hue",
  "saturation": "Saturation",
  "color": "Color",
  "luminosity": "Luminosity",
};

export const GradientCanvas = () => {
  const isMobile = useIsMobile();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isTablet = windowWidth >= 768 && windowWidth < 1280;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [layers, setLayers] = useState<GradientLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(CANVAS_PRESETS[0]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  
  // Saved presets
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  
  // Undo/Redo state
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas Resolution
  const [canvasWidth, setCanvasWidth] = useState(1600);
  const [canvasHeight, setCanvasHeight] = useState(900);

  // Mobile sheet states
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  const saveToHistory = useCallback((
    newLayers: GradientLayer[],
    newActiveLayerId: string | null
  ) => {
    const newState = { 
      layers: newLayers,
      activeLayerId: newActiveLayerId
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const onSave = useCallback(() => {
    saveToHistory(layers, activeLayerId);
  }, [layers, activeLayerId, saveToHistory]);

  const updateLayer = (layerId: string, updater: (layer: GradientLayer) => GradientLayer) => {
    setLayers(currentLayers => currentLayers.map(l => l.id === layerId ? updater(l) : l));
  };

  const updateActiveLayer = (props: Partial<GradientLayer>) => {
    if (!activeLayerId) return;
    updateLayer(activeLayerId, l => ({ ...l, ...props }));
  };

  // Track window width for tablet detection
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize with a default layer
  useEffect(() => {
    if (layers.length > 0) return;
    const defaultLayer = createNewLayer("Background", []);
    setLayers([defaultLayer]);
    setActiveLayerId(defaultLayer.id);
    saveToHistory([defaultLayer], defaultLayer.id);
  }, []);


  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('gradientCanvasState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.layers && parsed.layers.length > 0) {
          setLayers(parsed.layers);
          setActiveLayerId(parsed.activeLayerId || parsed.layers[0].id);
          // Set initial history state after loading
          saveToHistory(parsed.layers, parsed.activeLayerId || parsed.layers[0].id);
          toast.success("Previous session restored!");
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }

    const savedPresetsData = localStorage.getItem('gradientCanvasPresets');
    if (savedPresetsData) {
      try {
        setSavedPresets(JSON.parse(savedPresetsData));
      } catch (e) {
        console.error("Failed to load saved presets", e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (historyIndex < 1) return; // Don't save initial state from load
    const stateToSave = {
      layers,
      activeLayerId,
    };
    localStorage.setItem('gradientCanvasState', JSON.stringify(stateToSave));
  }, [layers, activeLayerId]);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('gradientCanvasPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setLayers(state.layers);
      setActiveLayerId(state.activeLayerId);
      toast.info("Undone");
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setLayers(state.layers);
      setActiveLayerId(state.activeLayerId);
      toast.info("Redone");
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

  /*
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
  */

  const downloadImage = () => {
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const link = document.createElement('a');
      link.download = 'instant-hue.png';
      link.href = mainCanvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded!");
    } else {
      toast.error("Canvas not available for download.");
    }
  };

  const savePreset = (name: string) => {
    if (!name) {
      toast.error("Please enter a name for the preset.");
      return;
    }
    const newPreset: SavedPreset = { name, layers };
    setSavedPresets(prev => [...prev, newPreset]);
    toast.success(`Preset "${name}" saved!`);
  };

  const loadPreset = (preset: SavedPreset) => {
    setLayers(preset.layers);
    setActiveLayerId(preset.layers[0]?.id || null);
    onSave();
    toast.success(`Preset "${preset.name}" loaded!`);
  };

  const deletePreset = (name: string) => {
    setSavedPresets(prev => prev.filter(p => p.name !== name));
    toast.success(`Preset "${name}" deleted.`);
  };


  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeLayerId) {
      toast.error("Please select a layer first.");
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageUrl = event.target.result as string;
          updateLayer(activeLayerId, l => ({ ...l, uploadedImage: imageUrl }));
          toast.success("Image uploaded successfully!");
          onSave();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }, [activeLayerId, onSave]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.buttons === 1 && (e.metaKey || e.ctrlKey || e.altKey)) { // check for spacebar alternative
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
      return;
    }
    if (!canvasRef.current || !activeLayer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    for (const point of activeLayer.points) {
      const dx = x - point.x;
      const dy = y - point.y;
      if (Math.sqrt(dx * dx + dy * dy) < (isMobile ? 0.05 : 0.02)) { // Larger hit area on mobile
        setSelectedPointId(point.id);
        setIsDragging(true);
        return;
      }
    }
    setSelectedPointId(null);
  }, [activeLayer, isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      
      setPanOffset(prev => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        
        // Add boundary checks here if you want to constrain panning
        
        return { x: newX, y: newY };
      });
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDragging || !selectedPointId || !canvasRef.current || !activeLayerId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    updateLayer(activeLayerId, l => ({
      ...l,
      points: l.points.map((p) =>
        p.id === selectedPointId ? { ...p, x, y } : p
      ),
    }));
  }, [isDragging, selectedPointId, activeLayerId, isPanning]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    }
    if (isDragging) {
      setIsDragging(false);
      onSave();
    }
  }, [isDragging, onSave, isPanning]);

  const centerCanvas = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(100);
    toast.success("Canvas centered");
  };

  const handleAddLayer = () => {
    const newLayer = createNewLayer(`Layer ${layers.length + 1}`, layers);
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
    onSave();
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) {
      toast.error("Cannot delete the last layer.");
      return;
    }
    const newLayers = layers.filter(l => l.id !== layerId);
    setLayers(newLayers);
    if (activeLayerId === layerId) {
      setActiveLayerId(newLayers[0]?.id || null);
    }
    onSave();
  };

  const handleSelectLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  const handleLayerOrderChange = (newOrder: GradientLayer[]) => {
    setLayers(newOrder);
    onSave();
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layerToDuplicate = layers.find(l => l.id === layerId);
    if (!layerToDuplicate) return;
    const newLayer = {
      ...layerToDuplicate,
      id: `layer-${Date.now()}`,
      name: `${layerToDuplicate.name} Copy`,
    };
    const index = layers.findIndex(l => l.id === layerId);
    const newLayers = [...layers];
    newLayers.splice(index + 1, 0, newLayer);
    setLayers(newLayers);
    setActiveLayerId(newLayer.id);
    onSave();
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    updateLayer(layerId, l => ({ ...l, isVisible: !l.isVisible }));
    onSave();
  };

  const handleRenameLayer = (layerId: string, newName: string) => {
    updateLayer(layerId, l => ({ ...l, name: newName }));
    onSave();
  };

  const handleAddPoint = () => {
    if (!activeLayerId) return;
    const newPoint: GradientPoint = {
      id: `p${Date.now()}`,
      x: Math.random() * 0.8 + 0.1,
      y: Math.random() * 0.8 + 0.1,
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    };
    updateLayer(activeLayerId, l => ({ ...l, points: [...l.points, newPoint] }));
    onSave();
  };

  const handleDeletePoint = () => {
    if (!activeLayerId || !selectedPointId) return;
    updateLayer(activeLayerId, (layer) => {
      const newPoints = layer.points.filter((p) => p.id !== selectedPointId);
      return { ...layer, points: newPoints };
    });
    setSelectedPointId(null);
    onSave();
  };

  const handleClearPoints = () => {
    if (!activeLayerId) return;
    updateLayer(activeLayerId, l => ({ ...l, points: [] }));
    onSave();
  };

  const handleRandomize = () => {
    if (!activeLayerId) return;
    const randomPaletteName = Object.keys(COLOR_PALETTES)[Math.floor(Math.random() * Object.keys(COLOR_PALETTES).length)];
    const randomPalette = COLOR_PALETTES[randomPaletteName as keyof typeof COLOR_PALETTES];
    
    updateLayer(activeLayerId, l => ({
      ...l,
      points: l.points.map(p => ({
        ...p,
        color: randomPalette[Math.floor(Math.random() * randomPalette.length)],
        x: Math.random(),
        y: Math.random(),
      })),
      blur: Math.random() * 200 + 50,
      gradientSpread: Math.random() * 0.8 + 0.2,
    }));
    onSave();
    toast.success(`Randomized with ${randomPaletteName} palette!`);
  };

  const handlePointColorChange = (color: string) => {
    if (!activeLayerId || !selectedPointId) return;
    updateLayer(activeLayerId, l => ({
      ...l,
      points: l.points.map(p => p.id === selectedPointId ? { ...p, color } : p),
    }));
    // No saveToHistory here, it's called on color picker close
  };

  const handleApplyPalette = (palette: string[]) => {
    if (!activeLayerId) return;
    updateLayer(activeLayerId, l => ({
      ...l,
      points: l.points.map((p, i) => ({
        ...p,
        color: palette[i % palette.length],
      })),
    }));
    onSave();
    toast.success("Palette applied!");
  };

  const selectedPointColor = activeLayer?.points.find(p => p.id === selectedPointId)?.color;

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b z-20 glassmorphic-header">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                <ScrollArea className="h-full">
                  <LeftSidebarContent
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onAddLayer={handleAddLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onSelectLayer={handleSelectLayer}
                    onLayerOrderChange={handleLayerOrderChange}
                    onDuplicateLayer={handleDuplicateLayer}
                    onToggleVisibility={handleToggleLayerVisibility}
                    onRenameLayer={handleRenameLayer}
                    savedPresets={savedPresets}
                    onSavePreset={savePreset}
                    onLoadPreset={loadPreset}
                    onDeletePreset={deletePreset}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-lg font-bold tracking-tighter">Instant Hue</h1>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 p-1 glassmorphic-controls rounded-lg">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}><Undo2 className="h-4 w-4" /> <span className="ml-2">Undo</span></Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 className="h-4 w-4" /> <span className="ml-2">Redo</span></Button>
          <Button variant="ghost" size="sm" onClick={downloadImage}><Download className="h-4 w-4" /> <span className="ml-2">Download</span></Button>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {isMobile && (
            <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Sliders /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <ScrollArea className="h-full">
                  {activeLayer ? (
                    <RightSidebarContent
                      activeLayer={activeLayer}
                      updateActiveLayer={updateActiveLayer}
                      onSave={onSave}
                      selectedPointId={selectedPointId}
                      onPointColorChange={handlePointColorChange}
                      selectedPointColor={selectedPointColor}
                      onDeletePoint={handleDeletePoint}
                      onAddPoint={handleAddPoint}
                      onClearPoints={handleClearPoints}
                      onRandomize={handleRandomize}
                      onImageUpload={handleImageUpload}
                      onApplyPalette={handleApplyPalette}
                      colorPalettes={COLOR_PALETTES}
                    />
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">Select a layer to edit its properties.</div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Sidebar */}
        {!isMobile && (
          <aside className="w-[300px] border-r p-0 glassmorphic-sidebar-l">
            <ScrollArea className="h-full">
              <LeftSidebarContent
                layers={layers}
                activeLayerId={activeLayerId}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onSelectLayer={handleSelectLayer}
                onLayerOrderChange={handleLayerOrderChange}
                onDuplicateLayer={handleDuplicateLayer}
                onToggleVisibility={handleToggleLayerVisibility}
                onRenameLayer={handleRenameLayer}
                savedPresets={savedPresets}
                onSavePreset={savePreset}
                onLoadPreset={loadPreset}
                onDeletePreset={deletePreset}
              />
            </ScrollArea>
          </aside>
        )}

        {/* Canvas */}
        <div ref={canvasContainerRef} className="flex-1 flex items-center justify-center bg-grid p-4 overflow-hidden" onMouseUp={handleMouseUp}>
          <div className="overflow-auto">
            <CanvasRenderer
              ref={canvasRef}
              layers={layers.filter(l => l.isVisible)}
              activeLayerId={activeLayerId}
              selectedPointId={selectedPointId}
              containerRef={canvasContainerRef}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              zoom={zoom}
              panOffset={panOffset}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        {!isMobile && (
          <aside className="w-[350px] border-l p-0 glassmorphic-sidebar-r">
            <ScrollArea className="h-full">
              {activeLayer ? (
                <RightSidebarContent
                  activeLayer={activeLayer}
                  updateActiveLayer={updateActiveLayer}
                  onSave={onSave}
                  selectedPointId={selectedPointId}
                  onPointColorChange={handlePointColorChange}
                  selectedPointColor={selectedPointColor}
                  onDeletePoint={handleDeletePoint}
                  onAddPoint={handleAddPoint}
                  onClearPoints={handleClearPoints}
                  onRandomize={handleRandomize}
                  onImageUpload={handleImageUpload}
                  onApplyPalette={handleApplyPalette}
                  colorPalettes={COLOR_PALETTES}
                />
              ) : (
                <div className="p-6 text-center text-muted-foreground">Select a layer to edit its properties.</div>
              )}
            </ScrollArea>
          </aside>
        )}
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-between px-4 border-t z-10 glassmorphic-footer">
        <div className="flex items-center gap-2">
          {activeLayer && (
            <div className="text-sm text-muted-foreground">
              Editing: <span className="font-semibold text-foreground">{activeLayer.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(10, z - 10))}><ZoomOut className="h-4 w-4" /></Button>
          <div className="w-16 text-center text-sm">{zoom}%</div>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(200, z + 10))}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={centerCanvas}><Maximize className="h-4 w-4" /></Button>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Canvas: {canvasWidth} x {canvasHeight}
          </div>
        </div>
      </footer>
    </div>
  );
};
