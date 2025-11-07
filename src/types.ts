export type DitherMode = "none" | "floyd-steinberg" | "bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "atkinson";

export interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface GradientLayer {
  id: string;
  name: string;
  points: GradientPoint[];
  blur: number;
  gradientSpread: number;
  backgroundColor: string;
  fadeEndpoint: number;
  blendMode: GlobalCompositeOperation;
  opacity: number;
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
  uploadedImage?: string; // Store image as data URL
  isVisible: boolean;
}

export interface Preset {
  name: string;
  layers: GradientLayer[];
}
