import { useEffect, useRef, useCallback, memo, forwardRef, useImperativeHandle } from "react";

// Keep DitherMode and GradientPoint as they are used in GradientLayer
type DitherMode = "none" | "floyd-steinberg" | "bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "atkinson";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

// Define the GradientLayer which is now the primary data structure
interface GradientLayer {
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
  uploadedImage?: string; // Data URL of the image
  isVisible: boolean;
}

export interface CanvasRendererProps {
  layers: GradientLayer[];
  activeLayerId: string | null;
  selectedPointId: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panOffset: { x: number; y: number };
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseMove?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseUp?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLCanvasElement>;
  onTouchStart?: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchMove?: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchEnd?: React.TouchEventHandler<HTMLCanvasElement>;
}

export const CanvasRenderer = memo(forwardRef<HTMLCanvasElement, CanvasRendererProps>(({ 
  layers,
  activeLayerId,
  selectedPointId,
  containerRef,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => canvasRef.current!);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Preload images
  useEffect(() => {
    layers.forEach(layer => {
      if (layer.uploadedImage && !imageCache.current.has(layer.id)) {
        const img = new Image();
        img.onload = () => {
          imageCache.current.set(layer.id, img);
          // Force a re-render by calling the main render function again
          renderCanvas();
        };
        img.src = layer.uploadedImage;
      } else if (!layer.uploadedImage && imageCache.current.has(layer.id)) {
        imageCache.current.delete(layer.id);
      }
    });
  }, [layers]);


  // The main render function, wrapped in useCallback
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const effectiveWidth = canvasWidth * (zoom / 100);
    const effectiveHeight = canvasHeight * (zoom / 100);
    
    // Sync canvas resolution and display size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${effectiveWidth}px`;
    canvas.style.height = `${effectiveHeight}px`;
    canvas.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render each layer
    layers.forEach(layer => {
      if (!layer.isVisible) return;

      // Create a temporary canvas for this layer
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = canvasWidth;
      layerCanvas.height = canvasHeight;
      const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
      if (!layerCtx) return;

      // Draw gradient on the temporary canvas
      layerCtx.fillStyle = layer.backgroundColor;
      layerCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      layerCtx.filter = `blur(${layer.blur}px)`;

      layer.points.forEach((point) => {
        const x = point.x * canvasWidth;
        const y = point.y * canvasHeight;
        const radius = Math.max(canvasWidth, canvasHeight) * layer.gradientSpread;

        const gradient = layerCtx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(layer.fadeEndpoint, `${point.color}00`);
        if (layer.fadeEndpoint < 1) {
          gradient.addColorStop(1, `${point.color}00`);
        }

        layerCtx.fillStyle = gradient;
        layerCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      });
      
      layerCtx.filter = 'none';

      // Handle uploaded image and dithering for this layer
      const uploadedImage = imageCache.current.get(layer.id);
      if (uploadedImage) {
          const ditheredData = applyDitherAndImageEffects(layerCtx, uploadedImage, layer);
          layerCtx.putImageData(ditheredData, 0, 0);
      }
      
      // Apply noise to the layer if enabled
      if (layer.noiseEnabled) {
        generateNoiseTexture(layerCtx, canvasWidth, canvasHeight, layer);
      }

      // Draw the temporary layer canvas onto the main canvas with blend mode and opacity
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layerCanvas, 0, 0);
    });

    // Reset composite operations
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Draw anchor points for the active layer on top
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (activeLayer) {
      activeLayer.points.forEach(point => {
        const x = point.x * canvasWidth;
        const y = point.y * canvasHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = point.id === selectedPointId ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = point.color;
        ctx.fill();
      });
    }

  }, [layers, activeLayerId, selectedPointId, containerRef, canvasWidth, canvasHeight, zoom, panOffset]);

  // Effect to trigger re-render
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Re-implement the full dithering and image effects logic
  const applyDitherAndImageEffects = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, layer: GradientLayer): ImageData => {
    const { width, height } = ctx.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return ctx.getImageData(0, 0, width, height);

    // 1. Draw the base gradient from the original context
    tempCtx.drawImage(ctx.canvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 2. Prepare and draw the uploaded image with effects
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = width;
    imageCanvas.height = height;
    const imageCtx = imageCanvas.getContext('2d', { willReadFrequently: true });
    if (!imageCtx) return imageData;
    
    imageCtx.filter = `
      contrast(${100 + layer.imageContrast}%) 
      brightness(${100 + layer.imageBrightness}%) 
      saturate(${100 + layer.imageSaturation}%) 
      hue-rotate(${layer.imageHue}deg)
    `;
    imageCtx.drawImage(image, 0, 0, width, height);
    const imagePixelData = imageCtx.getImageData(0, 0, width, height).data;

    // 3. Dithering and Image Compositing Logic
    const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
    const findClosest = (val: number, palette: number[]) => palette.reduce((a, b) => Math.abs(b - val) < Math.abs(a - val) ? b : a);
    const palette = Array.from({ length: Math.round(layer.ditherIntensity) || 2 }, (_, i) => (255 * i) / (Math.round(layer.ditherIntensity) - 1 || 1));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const imgR = imagePixelData[i], imgG = imagePixelData[i+1], imgB = imagePixelData[i+2], imgA = imagePixelData[i+3];

      // Blend image with gradient based on image opacity
      const opacity = layer.imageOpacity / 100;
      const blendedR = r * (1 - opacity) + imgR * opacity;
      const blendedG = g * (1 - opacity) + imgG * opacity;
      const blendedB = b * (1 - opacity) + imgB * opacity;
      
      let finalR = blendedR, finalG = blendedG, finalB = blendedB;

      if (layer.ditherMode !== 'none' && imgA > 0) {
        const luminance = lum(blendedR, blendedG, blendedB);
        if (luminance < layer.imageLuminanceThreshold) {
            const oldVal = layer.ditherInvert ? 255 - luminance : luminance;
            const newVal = findClosest(oldVal, palette);
            const ratio = oldVal === 0 ? 0 : newVal / oldVal;
            finalR = blendedR * ratio;
            finalG = blendedG * ratio;
            finalB = blendedB * ratio;
        }
      }
      
      data[i] = finalR;
      data[i+1] = finalG;
      data[i+2] = finalB;
    }

    return new ImageData(new Uint8ClampedArray(data), width, height);
  };

  // Placeholder for noise generation
  const generateNoiseTexture = (ctx: CanvasRenderingContext2D, width: number, height: number, layer: GradientLayer) => {
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = width;
      noiseCanvas.height = height;
      const noiseCtx = noiseCanvas.getContext('2d')!;
      const imageData = noiseCtx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
          if (Math.random() * 100 < layer.noiseDensity) {
              const noise = Math.random() * 255 * layer.noiseSharpness;
              data[i] = noise;
              data[i + 1] = noise;
              data[i + 2] = noise;
              data[i + 3] = 255;
          } else {
              data[i + 3] = 0;
          }
      }

      noiseCtx.putImageData(imageData, 0, 0);
      const previousAlpha = ctx.globalAlpha;
      ctx.globalAlpha = layer.noiseOpacity / 100;
      ctx.drawImage(noiseCanvas, 0, 0);
      ctx.globalAlpha = previousAlpha;
  };


  return (
    <canvas
      ref={canvasRef}
      className="absolute"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  );
}));

CanvasRenderer.displayName = "CanvasRenderer";
