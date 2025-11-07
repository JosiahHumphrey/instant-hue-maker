import { useEffect, useRef, useCallback, memo, forwardRef, useImperativeHandle } from "react";
import { useThrottledValue } from "@/hooks/useThrottledValue";

type DitherMode = "none" | "floyd-steinberg" | "bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "atkinson";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

export interface CanvasRendererProps {
  points: GradientPoint[];
  blur: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  gradientSpread: number;
  fadeEndpoint: number;
  blendMode: GlobalCompositeOperation;
  noiseEnabled: boolean;
  noiseOpacity: number;
  noiseDensity: number;
  noiseSharpness: number;
  uploadedImage: HTMLImageElement | null;
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
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseMove?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseUp?: React.MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLCanvasElement>;
  onTouchStart?: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchMove?: React.TouchEventHandler<HTMLCanvasElement>;
  onTouchEnd?: React.TouchEventHandler<HTMLCanvasElement>;
}

export const CanvasRenderer = memo(forwardRef<HTMLCanvasElement, CanvasRendererProps>(({ 
  points,
  blur,
  canvasWidth,
  canvasHeight,
  backgroundColor,
  gradientSpread,
  fadeEndpoint,
  blendMode,
  noiseEnabled,
  noiseOpacity,
  noiseDensity,
  noiseSharpness,
  uploadedImage,
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

  // Throttle heavy operations for canvas rendering
  const throttledBlur = useThrottledValue(blur, 50);
  const throttledGradientSpread = useThrottledValue(gradientSpread, 50);
  const throttledFadeEndpoint = useThrottledValue(fadeEndpoint, 50);
  const throttledNoiseOpacity = useThrottledValue(noiseOpacity, 50);
  const throttledNoiseDensity = useThrottledValue(noiseDensity, 50);
  const throttledNoiseSharpness = useThrottledValue(noiseSharpness, 50);
  const throttledDitherIntensity = useThrottledValue(ditherIntensity, 50);
  const throttledImageOpacity = useThrottledValue(imageOpacity, 50);
  const throttledDitherScale = useThrottledValue(ditherScale, 50);
  const throttledImageContrast = useThrottledValue(imageContrast, 50);
  const throttledImageBrightness = useThrottledValue(imageBrightness, 50);
  const throttledImageMidtones = useThrottledValue(imageMidtones, 50);
  const throttledImageHighlights = useThrottledValue(imageHighlights, 50);
  const throttledImageLuminanceThreshold = useThrottledValue(imageLuminanceThreshold, 50);
  const throttledImageHue = useThrottledValue(imageHue, 50);
  const throttledImageSaturation = useThrottledValue(imageSaturation, 50);

  // Generate noise texture
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const noiseCtx = noiseCanvas.getContext('2d')!;
    const imageData = noiseCtx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() * 100 < throttledNoiseDensity) {
        const noise = Math.random() * 255 * throttledNoiseSharpness;
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
      
      // Convert to HSL
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
      
      h = (h + throttledImageHue / 360) % 1;
      if (h < 0) h += 1;
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
      
      // Apply midtones
      const luminosity = (r + g + b) / 3;
      if (luminosity > 64 && luminosity < 192) {
        const midtoneFactor = 1 + (throttledImageMidtones / 100);
        r = Math.max(0, Math.min(255, r * midtoneFactor));
        g = Math.max(0, Math.min(255, g * midtoneFactor));
        b = Math.max(0, Math.min(255, b * midtoneFactor));
      }
      
      // Apply highlights
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

    const bayer2x2 = [[0, 2], [3, 1]];
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
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = getPixelIndex(x, y);
          const oldPixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = oldPixel - newPixel;

          data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

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
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = getPixelIndex(x, y);
          const oldPixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const newPixel = oldPixel < threshold ? 0 : 255;
          const error = (oldPixel - newPixel) / 8;

          data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

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

  // Main canvas rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If we have an uploaded image, use it as a mask
    if (uploadedImage) {
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

      const gradientData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
        
        let imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        imageData = applyImageAdjustments(imageData);
        tempCtx.putImageData(imageData, 0, 0);
        
        if (ditherMode !== "none") {
          const scaledWidth = Math.floor(canvas.width / throttledDitherScale);
          const scaledHeight = Math.floor(canvas.height / throttledDitherScale);
          
          const scaleCanvas = document.createElement('canvas');
          scaleCanvas.width = scaledWidth;
          scaleCanvas.height = scaledHeight;
          const scaleCtx = scaleCanvas.getContext('2d');
          
          if (scaleCtx) {
            scaleCtx.drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight);
            let scaledImageData = scaleCtx.getImageData(0, 0, scaledWidth, scaledHeight);
            scaledImageData = applyDither(scaledImageData, ditherMode, throttledDitherIntensity);
            scaleCtx.putImageData(scaledImageData, 0, 0);
            tempCtx.clearRect(0, 0, canvas.width, canvas.height);
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(scaleCanvas, 0, 0, canvas.width, canvas.height);
          }
        }
        
        if (ditherInvert) {
          const invertData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < invertData.data.length; i += 4) {
            invertData.data[i] = 255 - invertData.data[i];
            invertData.data[i + 1] = 255 - invertData.data[i + 1];
            invertData.data[i + 2] = 255 - invertData.data[i + 2];
          }
          tempCtx.putImageData(invertData, 0, 0);
        }
        
        const maskData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const finalData = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < maskData.data.length; i += 4) {
          const maskAlpha = (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) / (3 * 255);
          const opacity = throttledImageOpacity / 100;
          
          finalData.data[i] = gradientData.data[i];
          finalData.data[i + 1] = gradientData.data[i + 1];
          finalData.data[i + 2] = gradientData.data[i + 2];
          finalData.data[i + 3] = gradientData.data[i + 3] * maskAlpha * opacity;
        }
        
        ctx.putImageData(finalData, 0, 0);
      }
    } else {
      // No image - regular gradient
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

    // Apply noise if enabled
    if (noiseEnabled) {
      generateNoiseTexture(ctx, canvas.width, canvas.height);
    }
  }, [
    points,
    throttledBlur,
    canvasWidth,
    canvasHeight,
    backgroundColor,
    throttledGradientSpread,
    throttledFadeEndpoint,
    blendMode,
    noiseEnabled,
    throttledNoiseOpacity,
    throttledNoiseDensity,
    throttledNoiseSharpness,
    uploadedImage,
    ditherMode,
    throttledDitherIntensity,
    throttledImageOpacity,
    throttledDitherScale,
    ditherInvert,
    generateNoiseTexture,
    applyDither,
    applyImageAdjustments,
  ]);

  return <canvas 
    ref={canvasRef} 
    style={{ display: 'block', width: '100%', height: 'auto' }}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onMouseLeave={onMouseLeave}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  />;
}));

CanvasRenderer.displayName = "CanvasRenderer";
