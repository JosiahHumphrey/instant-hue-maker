import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Save, FolderOpen, Menu, Sliders, Palette } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { CanvasRenderer } from "./CanvasRenderer";
import { LeftSidebarContent, RightSidebarContent } from "./CanvasControls";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface CanvasState {
  points: GradientPoint[];
  blur: number;
  gradientSpread?: number;
  backgroundColor?: string;
  fadeEndpoint?: number;
}

type DitherMode = "none" | "floyd-steinberg" | "bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "atkinson";

interface SavedPreset {
  name: string;
  points: GradientPoint[];
  blur: number;
  gradientSpread: number;
  backgroundColor: string;
  fadeEndpoint: number;
  blendMode: GlobalCompositeOperation;
  noiseEnabled: boolean;
  noiseOpacity: number;
  noiseDensity: number;
  noiseSharpness: number;
  ditherMode: DitherMode;
  ditherIntensity: number;
  imageOpacity: number;
  ditherScale: number;
  ditherInvert: boolean;
  imageContrast: number;
  imageBrightness: number;
  imageMidtones: number;
  imageHighlights: number;
  imageLuminanceThreshold: number;
  imageHue: number;
  imageSaturation: number;
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
  const [points, setPoints] = useState<GradientPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [blur, setBlur] = useState(120);
  const [canvasSize, setCanvasSize] = useState(CANVAS_PRESETS[0]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Noise settings
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [noiseOpacity, setNoiseOpacity] = useState(20);
  const [noiseDensity, setNoiseDensity] = useState(20);
  const [noiseSharpness, setNoiseSharpness] = useState(2.0);
  
  // Blend mode
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>("source-over");
  
  // Edge control settings
  const [gradientSpread, setGradientSpread] = useState(0.6);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [fadeEndpoint, setFadeEndpoint] = useState(1.0);
  
  // Image & Dither settings
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [ditherMode, setDitherMode] = useState<DitherMode>("none");
  const [ditherIntensity, setDitherIntensity] = useState(128);
  const [imageOpacity, setImageOpacity] = useState(100);
  const [ditherScale, setDitherScale] = useState(1.0);
  const [ditherInvert, setDitherInvert] = useState(false);
  
  // Advanced image adjustments
  const [imageContrast, setImageContrast] = useState(0);
  const [imageBrightness, setImageBrightness] = useState(0);
  const [imageMidtones, setImageMidtones] = useState(0);
  const [imageHighlights, setImageHighlights] = useState(0);
  const [imageLuminanceThreshold, setImageLuminanceThreshold] = useState(127);
  const [imageHue, setImageHue] = useState(0);
  const [imageSaturation, setImageSaturation] = useState(0);
  
  // Zoom state
  const [zoom, setZoom] = useState(100);
  
  // Saved presets
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  
  // Undo/Redo state
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Mobile sheet states
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  // Track window width for tablet detection
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('gradientCanvasState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.points) setPoints(parsed.points);
        if (parsed.blur !== undefined) setBlur(parsed.blur);
        if (parsed.gradientSpread !== undefined) setGradientSpread(parsed.gradientSpread);
        if (parsed.backgroundColor) setBackgroundColor(parsed.backgroundColor);
        if (parsed.fadeEndpoint !== undefined) setFadeEndpoint(parsed.fadeEndpoint);
        if (parsed.blendMode) setBlendMode(parsed.blendMode);
        if (parsed.noiseEnabled !== undefined) setNoiseEnabled(parsed.noiseEnabled);
        if (parsed.noiseOpacity !== undefined) setNoiseOpacity(parsed.noiseOpacity);
        if (parsed.noiseDensity !== undefined) setNoiseDensity(parsed.noiseDensity);
        if (parsed.noiseSharpness !== undefined) setNoiseSharpness(parsed.noiseSharpness);
        toast.success("Previous session restored!");
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
    const stateToSave = {
      points,
      blur,
      gradientSpread,
      backgroundColor,
      fadeEndpoint,
      blendMode,
      noiseEnabled,
      noiseOpacity,
      noiseDensity,
      noiseSharpness,
    };
    localStorage.setItem('gradientCanvasState', JSON.stringify(stateToSave));
  }, [points, blur, gradientSpread, backgroundColor, fadeEndpoint, blendMode, noiseEnabled, noiseOpacity, noiseDensity, noiseSharpness]);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('gradientCanvasPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Save state to history
  const saveToHistory = useCallback((
    newPoints: GradientPoint[], 
    newBlur: number,
    newSpread?: number,
    newBgColor?: string,
    newFadeEnd?: number
  ) => {
    const newState: CanvasState = { 
      points: newPoints, 
      blur: newBlur,
      gradientSpread: newSpread ?? gradientSpread,
      backgroundColor: newBgColor ?? backgroundColor,
      fadeEndpoint: newFadeEnd ?? fadeEndpoint,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  }, [history, historyIndex, gradientSpread, backgroundColor, fadeEndpoint]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setPoints(state.points);
      setBlur(state.blur);
      if (state.gradientSpread !== undefined) setGradientSpread(state.gradientSpread);
      if (state.backgroundColor !== undefined) setBackgroundColor(state.backgroundColor);
      if (state.fadeEndpoint !== undefined) setFadeEndpoint(state.fadeEndpoint);
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
      if (state.gradientSpread !== undefined) setGradientSpread(state.gradientSpread);
      if (state.backgroundColor !== undefined) setBackgroundColor(state.backgroundColor);
      if (state.fadeEndpoint !== undefined) setFadeEndpoint(state.fadeEndpoint);
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




  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        toast.success("Image uploaded!");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);


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
    if (isDragging) {
      saveToHistory(points, blur);
      setIsDragging(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    const clickedPoint = points.find((p) => {
      const dx = Math.abs(p.x - x) * rect.width;
      const dy = Math.abs(p.y - y) * rect.height;
      return Math.sqrt(dx * dx + dy * dy) < 30; // 30px touch radius
    });

    if (clickedPoint) {
      setSelectedPoint(clickedPoint.id);
      setIsDragging(true);
    } else {
      setSelectedPoint(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

    setPoints((prev) =>
      prev.map((p) => (p.id === selectedPoint ? { ...p, x, y } : p))
    );
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      saveToHistory(points, blur);
      setIsDragging(false);
    }
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

  const updateGradientSpread = (value: number) => {
    setGradientSpread(value);
    saveToHistory(points, blur, value);
  };

  const updateBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    saveToHistory(points, blur, undefined, color);
  };

  const updateFadeEndpoint = (value: number) => {
    setFadeEndpoint(value);
    saveToHistory(points, blur, undefined, undefined, value);
  };

  const applyEdgePreset = (presetName: string) => {
    const preset = EDGE_PRESETS[presetName as keyof typeof EDGE_PRESETS];
    if (!preset) return;

    setGradientSpread(preset.spread);
    setBackgroundColor(preset.backgroundColor);
    setFadeEndpoint(preset.fadeEndpoint);
    saveToHistory(points, blur, preset.spread, preset.backgroundColor, preset.fadeEndpoint);
    toast.success(`Applied ${presetName} preset`);
  };

  const randomizePositions = () => {
    const newPoints = points.map((point) => ({
      ...point,
      x: Math.random(),
      y: Math.random(),
    }));

    setPoints(newPoints);
    saveToHistory(newPoints, blur);
    toast.success("Positions randomized!");
  };

  const saveCurrentPreset = () => {
    const presetName = prompt("Enter a name for this preset:");
    if (!presetName) return;

    const preset: SavedPreset = {
      name: presetName,
      points,
      blur,
      gradientSpread,
      backgroundColor,
      fadeEndpoint,
      blendMode,
      noiseEnabled,
      noiseOpacity,
      noiseDensity,
      noiseSharpness,
      ditherMode,
      ditherIntensity,
      imageOpacity,
      ditherScale,
      ditherInvert,
      imageContrast,
      imageBrightness,
      imageMidtones,
      imageHighlights,
      imageLuminanceThreshold,
      imageHue,
      imageSaturation,
    };

    setSavedPresets([...savedPresets, preset]);
    toast.success(`Preset "${presetName}" saved!`);
  };

  const loadPreset = (preset: SavedPreset) => {
    setPoints(preset.points);
    setBlur(preset.blur);
    setGradientSpread(preset.gradientSpread);
    setBackgroundColor(preset.backgroundColor);
    setFadeEndpoint(preset.fadeEndpoint);
    setBlendMode(preset.blendMode);
    setNoiseEnabled(preset.noiseEnabled);
    setNoiseOpacity(preset.noiseOpacity);
    setNoiseDensity(preset.noiseDensity);
    setNoiseSharpness(preset.noiseSharpness);
    setDitherMode(preset.ditherMode);
    setDitherIntensity(preset.ditherIntensity);
    setImageOpacity(preset.imageOpacity);
    setDitherScale(preset.ditherScale ?? 1.0);
    setDitherInvert(preset.ditherInvert ?? false);
    setImageContrast(preset.imageContrast ?? 0);
    setImageBrightness(preset.imageBrightness ?? 0);
    setImageMidtones(preset.imageMidtones ?? 0);
    setImageHighlights(preset.imageHighlights ?? 0);
    setImageLuminanceThreshold(preset.imageLuminanceThreshold ?? 127);
    setImageHue(preset.imageHue ?? 0);
    setImageSaturation(preset.imageSaturation ?? 0);
    saveToHistory(preset.points, preset.blur);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = (index: number) => {
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    toast.success("Preset deleted");
  };

  const exportPresetToFile = (preset: SavedPreset) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Preset exported!");
  };

  const importPresetFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const preset = JSON.parse(event.target?.result as string) as SavedPreset;
          setSavedPresets([...savedPresets, preset]);
          toast.success(`Imported preset "${preset.name}"`);
        } catch (error) {
          toast.error("Failed to import preset");
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Toolbar */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Colors & Layers</SheetTitle>
                </SheetHeader>
                <LeftSidebarContent />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-sm md:text-lg font-semibold">Gradient Canvas</h1>
          <div className="hidden md:flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Zoom Controls - Desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-20 text-center text-sm font-mono">{zoom}%</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(400, zoom + 25))}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(100)}
            title="Fit to View"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Export & Presets */}
        <div className="flex items-center gap-1 md:gap-2">
          {isMobile ? (
            <>
              <Button onClick={() => exportCanvas("png")} variant="default" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                <Sliders className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                  </SheetHeader>
                  <RightSidebarContent />
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button onClick={saveCurrentPreset} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
              <Button onClick={importPresetFromFile} variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => exportCanvas("png")} variant="default" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
              <Button onClick={() => exportCanvas("svg")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                SVG
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop only, hidden on tablet */}
        {!isMobile && !isTablet && (
          <div className="w-72 bg-card border-r border-border flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <LeftSidebarContent
                savedPresets={savedPresets}
                points={points}
                selectedPoint={selectedPoint}
                uploadedImage={uploadedImage}
                ditherMode={ditherMode}
                ditherIntensity={ditherIntensity}
                ditherScale={ditherScale}
                ditherInvert={ditherInvert}
                imageOpacity={imageOpacity}
                imageContrast={imageContrast}
                imageBrightness={imageBrightness}
                imageMidtones={imageMidtones}
                imageHighlights={imageHighlights}
                imageLuminanceThreshold={imageLuminanceThreshold}
                imageHue={imageHue}
                imageSaturation={imageSaturation}
                colorPalettes={COLOR_PALETTES}
                onLoadPreset={loadPreset}
                onExportPreset={exportPresetToFile}
                onDeletePreset={deletePreset}
                onApplyPalette={applyPalette}
                onRandomizePositions={randomizePositions}
                onSetSelectedPoint={setSelectedPoint}
                onUpdatePointColor={updatePointColor}
                onRemovePoint={removePoint}
                onAddPoint={addPoint}
                onImageUpload={handleImageUpload}
                onRemoveImage={() => { setUploadedImage(null); toast.success("Image removed"); }}
                onSetDitherMode={setDitherMode}
                onSetDitherIntensity={setDitherIntensity}
                onSetDitherScale={setDitherScale}
                onSetDitherInvert={setDitherInvert}
                onSetImageOpacity={setImageOpacity}
                onSetImageContrast={setImageContrast}
                onSetImageBrightness={setImageBrightness}
                onSetImageMidtones={setImageMidtones}
                onSetImageHighlights={setImageHighlights}
                onSetImageLuminanceThreshold={setImageLuminanceThreshold}
                onSetImageHue={setImageHue}
                onSetImageSaturation={setImageSaturation}
              />
            </div>
          </div>
        )}
        
        {/* Tablet Left Sheet Trigger */}
        {isTablet && (
          <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 top-20 z-10 bg-card border border-border shadow-lg"
              >
                <Palette className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Colors & Layers</SheetTitle>
              </SheetHeader>
                <LeftSidebarContent
                  savedPresets={savedPresets}
                  points={points}
                  selectedPoint={selectedPoint}
                  uploadedImage={uploadedImage}
                  ditherMode={ditherMode}
                  ditherIntensity={ditherIntensity}
                  ditherScale={ditherScale}
                  ditherInvert={ditherInvert}
                  imageOpacity={imageOpacity}
                  imageContrast={imageContrast}
                  imageBrightness={imageBrightness}
                  imageMidtones={imageMidtones}
                  imageHighlights={imageHighlights}
                  imageLuminanceThreshold={imageLuminanceThreshold}
                  imageHue={imageHue}
                  imageSaturation={imageSaturation}
                  colorPalettes={COLOR_PALETTES}
                  onLoadPreset={loadPreset}
                  onExportPreset={exportPresetToFile}
                  onDeletePreset={deletePreset}
                  onApplyPalette={applyPalette}
                  onRandomizePositions={randomizePositions}
                  onSetSelectedPoint={setSelectedPoint}
                  onUpdatePointColor={updatePointColor}
                  onRemovePoint={removePoint}
                  onAddPoint={addPoint}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={() => { setUploadedImage(null); toast.success("Image removed"); }}
                  onSetDitherMode={setDitherMode}
                  onSetDitherIntensity={setDitherIntensity}
                  onSetDitherScale={setDitherScale}
                  onSetDitherInvert={setDitherInvert}
                  onSetImageOpacity={setImageOpacity}
                  onSetImageContrast={setImageContrast}
                  onSetImageBrightness={setImageBrightness}
                  onSetImageMidtones={setImageMidtones}
                  onSetImageHighlights={setImageHighlights}
                  onSetImageLuminanceThreshold={setImageLuminanceThreshold}
                  onSetImageHue={setImageHue}
                  onSetImageSaturation={setImageSaturation}
                  isMobile={isMobile}
                  onCloseSheet={() => setLeftSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>
          )}

          {/* Center Canvas */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-hidden p-2 md:p-4 lg:p-8">
            <div 
              className="relative" 
              style={{ 
                transform: isMobile ? 'scale(1)' : `scale(${zoom / 100})`, 
                transformOrigin: 'center' 
              }}
            >
              <CanvasRenderer
                ref={canvasRef}
                points={points}
                blur={blur}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                backgroundColor={backgroundColor}
                gradientSpread={gradientSpread}
                fadeEndpoint={fadeEndpoint}
                blendMode={blendMode}
                noiseEnabled={noiseEnabled}
                noiseOpacity={noiseOpacity}
                noiseDensity={noiseDensity}
                noiseSharpness={noiseSharpness}
                uploadedImage={uploadedImage}
                ditherMode={ditherMode}
                ditherIntensity={ditherIntensity}
                imageOpacity={imageOpacity}
                ditherScale={ditherScale}
                ditherInvert={ditherInvert}
                imageContrast={imageContrast}
                imageBrightness={imageBrightness}
                imageMidtones={imageMidtones}
                imageHighlights={imageHighlights}
                imageLuminanceThreshold={imageLuminanceThreshold}
                imageHue={imageHue}
                imageSaturation={imageSaturation}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            {/* Point indicators */}
            {points.map((point) => (
              <div
                key={point.id}
                className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-transform pointer-events-none ${
                  selectedPoint === point.id ? "scale-125 ring-2 ring-primary" : ""
                }`}
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: point.color,
                }}
              />
            ))}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-mono">
              {canvasSize.width} × {canvasSize.height}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop only, hidden on tablet */}
        {!isMobile && !isTablet && (
          <div className="w-72 bg-card border-l border-border flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <RightSidebarContent
                canvasSize={canvasSize}
                canvasPresets={CANVAS_PRESETS}
                blur={blur}
                blendMode={blendMode}
                blendModes={BLEND_MODES}
                blendModeLabels={BLEND_MODE_LABELS}
                gradientSpread={gradientSpread}
                backgroundColor={backgroundColor}
                fadeEndpoint={fadeEndpoint}
                edgePresets={EDGE_PRESETS}
                noiseEnabled={noiseEnabled}
                noiseOpacity={noiseOpacity}
                noiseDensity={noiseDensity}
                noiseSharpness={noiseSharpness}
                onSetCanvasSize={setCanvasSize}
                onUpdateBlur={updateBlur}
                onSetBlendMode={setBlendMode}
                onUpdateGradientSpread={updateGradientSpread}
                onUpdateBackgroundColor={updateBackgroundColor}
                onUpdateFadeEndpoint={updateFadeEndpoint}
                onApplyEdgePreset={applyEdgePreset}
                onSetNoiseEnabled={setNoiseEnabled}
                onSetNoiseOpacity={setNoiseOpacity}
                onSetNoiseDensity={setNoiseDensity}
                onSetNoiseSharpness={setNoiseSharpness}
              />
            </div>
          </div>
        )}
        
        {/* Tablet Right Sheet Trigger */}
        {isTablet && (
          <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-20 z-10 bg-card border border-border shadow-lg"
              >
                <Sliders className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <RightSidebarContent />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};
