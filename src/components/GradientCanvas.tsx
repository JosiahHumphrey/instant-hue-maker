import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Plus, X, Undo2, Redo2, Palette, Shuffle, Maximize2, Upload, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Save, FolderOpen, Menu, Settings, Sliders } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useThrottledValue } from "@/hooks/useThrottledValue";
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

  // Throttled values for canvas rendering (prevents slider drag from being interrupted)
  const throttledBlur = useThrottledValue(blur, 16);
  const throttledGradientSpread = useThrottledValue(gradientSpread, 16);
  const throttledFadeEndpoint = useThrottledValue(fadeEndpoint, 16);
  const throttledNoiseOpacity = useThrottledValue(noiseOpacity, 16);
  const throttledNoiseDensity = useThrottledValue(noiseDensity, 16);
  const throttledNoiseSharpness = useThrottledValue(noiseSharpness, 16);
  const throttledDitherIntensity = useThrottledValue(ditherIntensity, 16);
  const throttledImageOpacity = useThrottledValue(imageOpacity, 16);
  const throttledDitherScale = useThrottledValue(ditherScale, 16);
  const throttledImageContrast = useThrottledValue(imageContrast, 16);
  const throttledImageBrightness = useThrottledValue(imageBrightness, 16);
  const throttledImageMidtones = useThrottledValue(imageMidtones, 16);
  const throttledImageHighlights = useThrottledValue(imageHighlights, 16);
  const throttledImageLuminanceThreshold = useThrottledValue(imageLuminanceThreshold, 16);
  const throttledImageHue = useThrottledValue(imageHue, 16);
  const throttledImageSaturation = useThrottledValue(imageSaturation, 16);
  
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

  // Generate noise texture - fixed to use proper canvas compositing
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create temporary canvas for noise
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const noiseCtx = noiseCanvas.getContext('2d')!;
    const imageData = noiseCtx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Use density to control how many pixels get noise
      if (Math.random() * 100 < throttledNoiseDensity) {
        const noise = Math.random() * 255 * throttledNoiseSharpness;
        data[i] = noise;     // Red
        data[i + 1] = noise; // Green
        data[i + 2] = noise; // Blue
        data[i + 3] = 255;   // Full alpha
      } else {
        data[i + 3] = 0; // Transparent
      }
    }

    noiseCtx.putImageData(imageData, 0, 0);

    // Apply to main canvas with opacity
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = throttledNoiseOpacity / 100;
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.globalAlpha = previousAlpha;
  }, [throttledNoiseDensity, throttledNoiseOpacity, throttledNoiseSharpness]);

  // Advanced image processing
  const applyImageAdjustments = useCallback((imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Convert to HSL for hue and saturation adjustments
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      let h = 0;
      let s = 0;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r / 255:
            h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g / 255:
            h = ((b / 255 - r / 255) / d + 2) / 6;
            break;
          case b / 255:
            h = ((r / 255 - g / 255) / d + 4) / 6;
            break;
        }
      }
      
      // Apply hue shift
      h = (h + throttledImageHue / 360) % 1;
      if (h < 0) h += 1;
      
      // Apply saturation
      s = Math.max(0, Math.min(1, s + throttledImageSaturation / 100));
      
      // Convert back to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      if (s === 0) {
        r = g = b = l * 255;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3) * 255;
        g = hue2rgb(p, q, h) * 255;
        b = hue2rgb(p, q, h - 1/3) * 255;
      }
      
      // Apply brightness
      r = Math.max(0, Math.min(255, r + throttledImageBrightness));
      g = Math.max(0, Math.min(255, g + throttledImageBrightness));
      b = Math.max(0, Math.min(255, b + throttledImageBrightness));
      
      // Apply contrast
      const contrastFactor = (259 * (throttledImageContrast + 255)) / (255 * (259 - throttledImageContrast));
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
      
      // Apply midtones adjustment (affects mid-range luminosity)
      const luminosity = (r + g + b) / 3;
      if (luminosity > 64 && luminosity < 192) {
        const midtoneFactor = 1 + (throttledImageMidtones / 100);
        r = Math.max(0, Math.min(255, r * midtoneFactor));
        g = Math.max(0, Math.min(255, g * midtoneFactor));
        b = Math.max(0, Math.min(255, b * midtoneFactor));
      }
      
      // Apply highlights adjustment (affects bright areas)
      if (luminosity > throttledImageLuminanceThreshold) {
        const highlightFactor = 1 + (throttledImageHighlights / 100);
        r = Math.max(0, Math.min(255, r * highlightFactor));
        g = Math.max(0, Math.min(255, g * highlightFactor));
        b = Math.max(0, Math.min(255, b * highlightFactor));
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    return new ImageData(data, width, height);
  }, [throttledImageContrast, throttledImageBrightness, throttledImageMidtones, throttledImageHighlights, throttledImageLuminanceThreshold, throttledImageHue, throttledImageSaturation]);

  // Dithering algorithms
  const applyDither = useCallback((imageData: ImageData, mode: DitherMode, threshold: number): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    if (mode === "none") {
      return new ImageData(data, width, height);
    }

    // Bayer matrices
    const bayer2x2 = [
      [0, 2],
      [3, 1]
    ];

    const bayer4x4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    const bayer8x8 = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

    if (mode === "floyd-steinberg") {
      // Floyd-Steinberg dithering
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = getPixelIndex(x, y);
          
          // Convert to grayscale
          const oldPixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = oldPixel - newPixel;

          data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

          // Distribute error to neighboring pixels
          if (x + 1 < width) {
            const rightIdx = getPixelIndex(x + 1, y);
            data[rightIdx] = Math.min(255, Math.max(0, data[rightIdx] + error * 7 / 16));
            data[rightIdx + 1] = Math.min(255, Math.max(0, data[rightIdx + 1] + error * 7 / 16));
            data[rightIdx + 2] = Math.min(255, Math.max(0, data[rightIdx + 2] + error * 7 / 16));
          }
          if (x - 1 >= 0 && y + 1 < height) {
            const bottomLeftIdx = getPixelIndex(x - 1, y + 1);
            data[bottomLeftIdx] = Math.min(255, Math.max(0, data[bottomLeftIdx] + error * 3 / 16));
            data[bottomLeftIdx + 1] = Math.min(255, Math.max(0, data[bottomLeftIdx + 1] + error * 3 / 16));
            data[bottomLeftIdx + 2] = Math.min(255, Math.max(0, data[bottomLeftIdx + 2] + error * 3 / 16));
          }
          if (y + 1 < height) {
            const bottomIdx = getPixelIndex(x, y + 1);
            data[bottomIdx] = Math.min(255, Math.max(0, data[bottomIdx] + error * 5 / 16));
            data[bottomIdx + 1] = Math.min(255, Math.max(0, data[bottomIdx + 1] + error * 5 / 16));
            data[bottomIdx + 2] = Math.min(255, Math.max(0, data[bottomIdx + 2] + error * 5 / 16));
          }
          if (x + 1 < width && y + 1 < height) {
            const bottomRightIdx = getPixelIndex(x + 1, y + 1);
            data[bottomRightIdx] = Math.min(255, Math.max(0, data[bottomRightIdx] + error * 1 / 16));
            data[bottomRightIdx + 1] = Math.min(255, Math.max(0, data[bottomRightIdx + 1] + error * 1 / 16));
            data[bottomRightIdx + 2] = Math.min(255, Math.max(0, data[bottomRightIdx + 2] + error * 1 / 16));
          }
        }
      }
    } else if (mode === "atkinson") {
      // Atkinson dithering (similar to Floyd-Steinberg but different error distribution)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = getPixelIndex(x, y);
          const oldPixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = (oldPixel - newPixel) / 8;

          data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

          // Atkinson error distribution
          const distribute = (dx: number, dy: number) => {
            if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
              const targetIdx = getPixelIndex(x + dx, y + dy);
              data[targetIdx] = Math.min(255, Math.max(0, data[targetIdx] + error));
              data[targetIdx + 1] = Math.min(255, Math.max(0, data[targetIdx + 1] + error));
              data[targetIdx + 2] = Math.min(255, Math.max(0, data[targetIdx + 2] + error));
            }
          };

          distribute(1, 0);
          distribute(2, 0);
          distribute(-1, 1);
          distribute(0, 1);
          distribute(1, 1);
          distribute(0, 2);
        }
      }
    } else {
      // Bayer matrix dithering
      let matrix = bayer2x2;
      let matrixSize = 2;
      let divisor = 4;

      if (mode === "bayer-4x4") {
        matrix = bayer4x4;
        matrixSize = 4;
        divisor = 16;
      } else if (mode === "bayer-8x8") {
        matrix = bayer8x8;
        matrixSize = 8;
        divisor = 64;
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = getPixelIndex(x, y);
          const grayscale = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          const bayerValue = matrix[y % matrixSize][x % matrixSize];
          const adjustedThreshold = threshold + (bayerValue / divisor - 0.5) * 255;
          
          const newValue = grayscale < adjustedThreshold ? 0 : 255;
          data[idx] = data[idx + 1] = data[idx + 2] = newValue;
        }
      }
    }

    return new ImageData(data, width, height);
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

  // Draw gradient on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If we have an uploaded image, use it as a mask for the gradient
    if (uploadedImage) {
      // Step 1: Draw the gradient first
      ctx.globalCompositeOperation = blendMode;
      ctx.filter = `blur(${throttledBlur}px)`;

      points.forEach((point) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        const radius = Math.max(canvas.width, canvas.height) * throttledGradientSpread;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(throttledFadeEndpoint, point.color + "00");
        if (throttledFadeEndpoint < 1) {
          gradient.addColorStop(1, point.color + "00");
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";

      // Step 2: Get the gradient we just drew
      const gradientData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Step 3: Process the dithered image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw the image at full size
        tempCtx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
        
        // Apply image adjustments before dithering
        let imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        imageData = applyImageAdjustments(imageData);
        tempCtx.putImageData(imageData, 0, 0);
        
        if (ditherMode !== "none") {
          // Apply dither scale by downsampling, dithering, then upsampling
          const ditherWidth = Math.max(1, Math.floor(canvas.width / throttledDitherScale));
          const ditherHeight = Math.max(1, Math.floor(canvas.height / throttledDitherScale));
          
          // Create downsampled canvas
          const downsampleCanvas = document.createElement('canvas');
          downsampleCanvas.width = ditherWidth;
          downsampleCanvas.height = ditherHeight;
          const downsampleCtx = downsampleCanvas.getContext('2d');
          
          if (downsampleCtx) {
            // Downsample the image
            downsampleCtx.drawImage(tempCanvas, 0, 0, ditherWidth, ditherHeight);
            
            // Apply dithering to downsampled image
            let downsampledData = downsampleCtx.getImageData(0, 0, ditherWidth, ditherHeight);
            const dithered = applyDither(downsampledData, ditherMode, throttledDitherIntensity);
            downsampleCtx.putImageData(dithered, 0, 0);
            
            // Upscale back to original size
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.clearRect(0, 0, canvas.width, canvas.height);
            tempCtx.drawImage(downsampleCanvas, 0, 0, canvas.width, canvas.height);
          }
        }
        
        const ditherData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 4: Combine - blacks get gradient color, whites stay white (with optional invert)
        const finalData = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < ditherData.data.length; i += 4) {
          let ditherValue = ditherData.data[i]; // Grayscale, so R = G = B
          
          // Apply invert if enabled
          if (ditherInvert) {
            ditherValue = 255 - ditherValue;
          }
          
          if (ditherValue < 128) {
            // Black pixel - use gradient color with opacity control
            const alpha = throttledImageOpacity / 100;
            finalData.data[i] = gradientData.data[i] * alpha + ditherValue * (1 - alpha);
            finalData.data[i + 1] = gradientData.data[i + 1] * alpha + ditherValue * (1 - alpha);
            finalData.data[i + 2] = gradientData.data[i + 2] * alpha + ditherValue * (1 - alpha);
            finalData.data[i + 3] = 255;
          } else {
            // White pixel - keep it pure white
            finalData.data[i] = 255;
            finalData.data[i + 1] = 255;
            finalData.data[i + 2] = 255;
            finalData.data[i + 3] = 255;
          }
        }
        
        // Clear and draw final result
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(finalData, 0, 0);
      }
    } else {
      // No image - just draw gradient normally
      ctx.globalCompositeOperation = blendMode;
      ctx.filter = `blur(${throttledBlur}px)`;

      points.forEach((point) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        const radius = Math.max(canvas.width, canvas.height) * throttledGradientSpread;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(throttledFadeEndpoint, point.color + "00");
        if (throttledFadeEndpoint < 1) {
          gradient.addColorStop(1, point.color + "00");
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";
    }

    // Add noise texture
    if (noiseEnabled) {
      generateNoiseTexture(ctx, canvas.width, canvas.height);
    }
  }, [points, throttledBlur, canvasSize, noiseEnabled, generateNoiseTexture, blendMode, throttledGradientSpread, backgroundColor, throttledFadeEndpoint, uploadedImage, ditherMode, throttledDitherIntensity, throttledImageOpacity, throttledDitherScale, ditherInvert, applyDither, applyImageAdjustments, throttledNoiseOpacity, throttledNoiseDensity, throttledNoiseSharpness, throttledImageContrast, throttledImageBrightness, throttledImageMidtones, throttledImageHighlights, throttledImageLuminanceThreshold, throttledImageHue, throttledImageSaturation]);

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

  // Sidebar content components for reuse
  const LeftSidebarContent = () => (
    <div className="p-4 space-y-6">
      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
            Saved Presets
          </h2>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {savedPresets.map((preset, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 group"
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-xs"
                  onClick={() => {
                    loadPreset(preset);
                    if (isMobile) setLeftSheetOpen(false);
                  }}
                >
                  {preset.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => exportPresetToFile(preset)}
                  title="Export to file"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deletePreset(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Palette */}
      <div>
        <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
          <Palette className="h-4 w-4" />
          Color Palette
        </label>
        <Select onValueChange={applyPalette}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose preset..." />
          </SelectTrigger>
          <SelectContent className="max-h-80 bg-popover">
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

      {/* Gradient Layers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Gradient Layers
          </h2>
          <Button
            onClick={randomizePositions}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Randomize positions"
          >
            <Shuffle className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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

      {/* Image & Dither */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Image & Dither</h3>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-2">
            Upload Image
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="flex-1">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadedImage ? "Change" : "Upload"}
                </span>
              </Button>
            </label>
            {uploadedImage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploadedImage(null);
                  toast.success("Image removed");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {uploadedImage && (
          <div className="space-y-3 mt-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-2">
                Dither Effect
              </label>
              <Select value={ditherMode} onValueChange={(value) => setDitherMode(value as DitherMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="floyd-steinberg">Floyd-Steinberg</SelectItem>
                  <SelectItem value="atkinson">Atkinson</SelectItem>
                  <SelectItem value="bayer-2x2">Bayer 2×2</SelectItem>
                  <SelectItem value="bayer-4x4">Bayer 4×4</SelectItem>
                  <SelectItem value="bayer-8x8">Bayer 8×8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ditherMode !== "none" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Threshold: {ditherIntensity}
                  </label>
                  <Slider
                    value={[ditherIntensity]}
                    onValueChange={(v) => setDitherIntensity(v[0])}
                    min={0}
                    max={255}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Pattern Resolution: {ditherScale.toFixed(2)}x
                  </label>
                  <Slider
                    value={[ditherScale]}
                    onValueChange={(v) => setDitherScale(v[0])}
                    min={0.5}
                    max={8.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                 <div className="flex items-center justify-between">
                   <label className="text-xs text-muted-foreground">
                     Invert Colors
                   </label>
                   <Button
                     variant={ditherInvert ? "default" : "outline"}
                     size="sm"
                     onClick={() => setDitherInvert(!ditherInvert)}
                     className="h-7 px-3 text-xs"
                   >
                     {ditherInvert ? "On" : "Off"}
                   </Button>
                 </div>
               </>
             )}

             <div className="space-y-3 pt-3 border-t">
               <div className="text-xs font-medium text-muted-foreground">
                 Image Adjustments
               </div>
               
               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Contrast: {imageContrast}
                 </label>
                 <Slider
                   value={[imageContrast]}
                   onValueChange={(v) => setImageContrast(v[0])}
                   min={-100}
                   max={100}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Brightness: {imageBrightness}
                 </label>
                 <Slider
                   value={[imageBrightness]}
                   onValueChange={(v) => setImageBrightness(v[0])}
                   min={-100}
                   max={100}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Midtones: {imageMidtones}
                 </label>
                 <Slider
                   value={[imageMidtones]}
                   onValueChange={(v) => setImageMidtones(v[0])}
                   min={-100}
                   max={100}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Highlights: {imageHighlights}
                 </label>
                 <Slider
                   value={[imageHighlights]}
                   onValueChange={(v) => setImageHighlights(v[0])}
                   min={-100}
                   max={100}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Luminance Threshold: {imageLuminanceThreshold}
                 </label>
                 <Slider
                   value={[imageLuminanceThreshold]}
                   onValueChange={(v) => setImageLuminanceThreshold(v[0])}
                   min={0}
                   max={255}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Hue: {imageHue}°
                 </label>
                 <Slider
                   value={[imageHue]}
                   onValueChange={(v) => setImageHue(v[0])}
                   min={-180}
                   max={180}
                   step={1}
                   className="w-full"
                 />
               </div>

               <div>
                 <label className="text-xs text-muted-foreground block mb-2">
                   Saturation: {imageSaturation}
                 </label>
                 <Slider
                   value={[imageSaturation]}
                   onValueChange={(v) => setImageSaturation(v[0])}
                   min={-100}
                   max={100}
                   step={1}
                   className="w-full"
                 />
               </div>
             </div>

             <div>
               <label className="text-xs text-muted-foreground block mb-2">
                 Opacity: {imageOpacity}%
               </label>
               <Slider
                 value={[imageOpacity]}
                 onValueChange={(v) => setImageOpacity(v[0])}
                 min={0}
                 max={100}
                 step={1}
                 className="w-full"
               />
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const RightSidebarContent = () => (
    <div className="p-4 space-y-6">
      {/* Canvas Size */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
          Canvas Size
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {CANVAS_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant={canvasSize.name === preset.name ? "default" : "outline"}
              onClick={() => setCanvasSize(preset)}
              className="font-mono text-xs"
              size="sm"
            >
              {preset.name}
            </Button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
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
              className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm mt-1"
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
              className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div className="pt-4 border-t border-border">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Effects</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
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

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Blend Mode
            </label>
            <Select value={blendMode} onValueChange={(value) => setBlendMode(value as GlobalCompositeOperation)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {BLEND_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {BLEND_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Edge Control */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Edge Control</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Presets
            </label>
            <Select onValueChange={applyEdgePreset}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose preset..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {Object.keys(EDGE_PRESETS).map((presetName) => (
                  <SelectItem key={presetName} value={presetName}>
                    {presetName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Spread: {gradientSpread.toFixed(1)}
            </label>
            <Slider
              value={[gradientSpread]}
              onValueChange={(v) => updateGradientSpread(v[0])}
              min={0.3}
              max={1.5}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Background
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => updateBackgroundColor(e.target.value)}
                className="w-12 h-9 rounded cursor-pointer border border-border"
              />
              <div className="flex-1 grid grid-cols-4 gap-1">
                {["#ffffff", "#000000", "#f5f5f5", "#1a1a1a"].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBackgroundColor(color)}
                    className="h-9 rounded border-2 transition-all hover:scale-105"
                    style={{
                      backgroundColor: color,
                      borderColor: backgroundColor === color ? "hsl(var(--primary))" : "hsl(var(--border))"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Fade: {fadeEndpoint.toFixed(2)}
            </label>
            <Slider
              value={[fadeEndpoint]}
              onValueChange={(v) => updateFadeEndpoint(v[0])}
              min={0.3}
              max={1.0}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Noise Texture */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Noise Texture</h3>
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
          <div className="space-y-3">
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
  );

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
              <LeftSidebarContent />
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
              <LeftSidebarContent />
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
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = (touch.clientX - rect.left) / rect.width;
                  const y = (touch.clientY - rect.top) / rect.height;
                  handleCanvasClick({ nativeEvent: { offsetX: x * rect.width, offsetY: y * rect.height } } as any);
                }
              }}
              className="rounded-lg shadow-2xl cursor-crosshair border border-border bg-background touch-none"
              style={{ 
                maxWidth: '100%', 
                maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
                width: isMobile ? '100%' : 'auto',
                height: isMobile ? 'auto' : 'auto'
              }}
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
              <RightSidebarContent />
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
                <Settings className="h-5 w-5" />
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
