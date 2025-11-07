import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Palette, Shuffle, Maximize2, Upload, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DitherMode = "none" | "floyd-steinberg" | "bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "atkinson";

interface GradientPoint {
  id: string;
  x: number;
  y: number;
  color: string;
}

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

interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

interface CanvasControlsProps {
  // Left sidebar props
  savedPresets: SavedPreset[];
  points: GradientPoint[];
  selectedPoint: string | null;
  uploadedImage: HTMLImageElement | null;
  ditherMode: DitherMode;
  ditherIntensity: number;
  ditherScale: number;
  ditherInvert: boolean;
  imageOpacity: number;
  imageContrast: number;
  imageBrightness: number;
  imageMidtones: number;
  imageHighlights: number;
  imageLuminanceThreshold: number;
  imageHue: number;
  imageSaturation: number;
  
  // Right sidebar props
  canvasSize: CanvasPreset;
  canvasPresets: CanvasPreset[];
  blur: number;
  blendMode: GlobalCompositeOperation;
  blendModes: GlobalCompositeOperation[];
  blendModeLabels: Record<GlobalCompositeOperation, string>;
  gradientSpread: number;
  backgroundColor: string;
  fadeEndpoint: number;
  edgePresets: Record<string, any>;
  noiseEnabled: boolean;
  noiseOpacity: number;
  noiseDensity: number;
  noiseSharpness: number;
  colorPalettes: Record<string, string[]>;
  
  // Callbacks
  onLoadPreset: (preset: SavedPreset) => void;
  onExportPreset: (preset: SavedPreset) => void;
  onDeletePreset: (index: number) => void;
  onApplyPalette: (paletteName: string) => void;
  onRandomizePositions: () => void;
  onSetSelectedPoint: (id: string) => void;
  onUpdatePointColor: (id: string, color: string) => void;
  onRemovePoint: (id: string) => void;
  onAddPoint: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSetDitherMode: (mode: DitherMode) => void;
  onSetDitherIntensity: (value: number) => void;
  onSetDitherScale: (value: number) => void;
  onSetDitherInvert: (value: boolean) => void;
  onSetImageOpacity: (value: number) => void;
  onSetImageContrast: (value: number) => void;
  onSetImageBrightness: (value: number) => void;
  onSetImageMidtones: (value: number) => void;
  onSetImageHighlights: (value: number) => void;
  onSetImageLuminanceThreshold: (value: number) => void;
  onSetImageHue: (value: number) => void;
  onSetImageSaturation: (value: number) => void;
  onSetCanvasSize: (preset: CanvasPreset) => void;
  onUpdateBlur: (value: number) => void;
  onSetBlendMode: (mode: GlobalCompositeOperation) => void;
  onUpdateGradientSpread: (value: number) => void;
  onUpdateBackgroundColor: (color: string) => void;
  onUpdateFadeEndpoint: (value: number) => void;
  onApplyEdgePreset: (presetName: string) => void;
  onSetNoiseEnabled: (enabled: boolean) => void;
  onSetNoiseOpacity: (value: number) => void;
  onSetNoiseDensity: (value: number) => void;
  onSetNoiseSharpness: (value: number) => void;
  isMobile?: boolean;
  onCloseSheet?: () => void;
}

export const LeftSidebarContent = ({
  savedPresets,
  points,
  selectedPoint,
  uploadedImage,
  ditherMode,
  ditherIntensity,
  ditherScale,
  ditherInvert,
  imageOpacity,
  imageContrast,
  imageBrightness,
  imageMidtones,
  imageHighlights,
  imageLuminanceThreshold,
  imageHue,
  imageSaturation,
  colorPalettes,
  onLoadPreset,
  onExportPreset,
  onDeletePreset,
  onApplyPalette,
  onRandomizePositions,
  onSetSelectedPoint,
  onUpdatePointColor,
  onRemovePoint,
  onAddPoint,
  onImageUpload,
  onRemoveImage,
  onSetDitherMode,
  onSetDitherIntensity,
  onSetDitherScale,
  onSetDitherInvert,
  onSetImageOpacity,
  onSetImageContrast,
  onSetImageBrightness,
  onSetImageMidtones,
  onSetImageHighlights,
  onSetImageLuminanceThreshold,
  onSetImageHue,
  onSetImageSaturation,
  isMobile,
  onCloseSheet,
}: Partial<CanvasControlsProps>) => (
  <div className="p-4 space-y-6">
    {savedPresets && savedPresets.length > 0 && (
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Saved Presets</h2>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {savedPresets.map((preset, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 group">
              <Button
                variant="ghost"
                className="flex-1 justify-start text-xs"
                onClick={() => {
                  onLoadPreset?.(preset);
                  if (isMobile && onCloseSheet) onCloseSheet();
                }}
              >
                {preset.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => onExportPreset?.(preset)}
                title="Export to file"
              >
                <Upload className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDeletePreset?.(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )}

    <div>
      <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
        <Palette className="h-4 w-4" />
        Color Palette
      </label>
      <Select onValueChange={onApplyPalette}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose preset..." />
        </SelectTrigger>
        <SelectContent className="max-h-80 bg-popover">
          {colorPalettes && Object.keys(colorPalettes).map((paletteName) => (
            <SelectItem key={paletteName} value={paletteName}>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {colorPalettes[paletteName]
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Gradient Layers</h2>
        <Button
          onClick={onRandomizePositions}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Randomize positions"
        >
          <Shuffle className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {points?.map((point) => (
          <div
            key={point.id}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
              selectedPoint === point.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSetSelectedPoint?.(point.id)}
          >
            <input
              type="color"
              value={point.color}
              onChange={(e) => onUpdatePointColor?.(point.id, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <div className="flex-1 text-xs font-mono">{point.color}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemovePoint?.(point.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={onAddPoint}
        variant="outline"
        className="w-full mt-3"
        disabled={points && points.length >= 10}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Layer
      </Button>
    </div>

    <div className="pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">Image & Dither</h3>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-2">Upload Image</label>
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
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
            <Button variant="ghost" size="icon" onClick={onRemoveImage}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {uploadedImage && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Dither Effect</label>
            <Select value={ditherMode} onValueChange={(value) => onSetDitherMode?.(value as DitherMode)}>
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
                  value={[ditherIntensity || 128]}
                  onValueChange={(v) => onSetDitherIntensity?.(v[0])}
                  min={0}
                  max={255}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Pattern Resolution: {(ditherScale || 1).toFixed(2)}x
                </label>
                <Slider
                  value={[ditherScale || 1]}
                  onValueChange={(v) => onSetDitherScale?.(v[0])}
                  min={0.5}
                  max={8.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Invert Colors</label>
                <Button
                  variant={ditherInvert ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetDitherInvert?.(!ditherInvert)}
                >
                  {ditherInvert ? "On" : "Off"}
                </Button>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Image Adjustments</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Contrast: {imageContrast}
                </label>
                <Slider
                  value={[imageContrast || 0]}
                  onValueChange={(v) => onSetImageContrast?.(v[0])}
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
                  value={[imageBrightness || 0]}
                  onValueChange={(v) => onSetImageBrightness?.(v[0])}
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
                  value={[imageMidtones || 0]}
                  onValueChange={(v) => onSetImageMidtones?.(v[0])}
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
                  value={[imageHighlights || 0]}
                  onValueChange={(v) => onSetImageHighlights?.(v[0])}
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
                  value={[imageLuminanceThreshold || 127]}
                  onValueChange={(v) => onSetImageLuminanceThreshold?.(v[0])}
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
                  value={[imageHue || 0]}
                  onValueChange={(v) => onSetImageHue?.(v[0])}
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
                  value={[imageSaturation || 0]}
                  onValueChange={(v) => onSetImageSaturation?.(v[0])}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-2 mt-3">
                Opacity: {imageOpacity}%
              </label>
              <Slider
                value={[imageOpacity || 100]}
                onValueChange={(v) => onSetImageOpacity?.(v[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const RightSidebarContent = ({
  canvasSize,
  canvasPresets,
  blur,
  blendMode,
  blendModes,
  blendModeLabels,
  gradientSpread,
  backgroundColor,
  fadeEndpoint,
  edgePresets,
  noiseEnabled,
  noiseOpacity,
  noiseDensity,
  noiseSharpness,
  onSetCanvasSize,
  onUpdateBlur,
  onSetBlendMode,
  onUpdateGradientSpread,
  onUpdateBackgroundColor,
  onUpdateFadeEndpoint,
  onApplyEdgePreset,
  onSetNoiseEnabled,
  onSetNoiseOpacity,
  onSetNoiseDensity,
  onSetNoiseSharpness,
}: Partial<CanvasControlsProps>) => (
  <div className="p-4 space-y-6">
    <div>
      <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Canvas Size</h2>
      <div className="grid grid-cols-3 gap-2">
        {canvasPresets?.map((preset) => (
          <Button
            key={preset.name}
            variant={canvasSize?.name === preset.name ? "default" : "outline"}
            onClick={() => onSetCanvasSize?.(preset)}
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
            value={canvasSize?.width}
            onChange={(e) =>
              onSetCanvasSize?.({
                ...canvasSize!,
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
            value={canvasSize?.height}
            onChange={(e) =>
              onSetCanvasSize?.({
                ...canvasSize!,
                height: parseInt(e.target.value) || 1,
              })
            }
            className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm mt-1"
          />
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-border">
      <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Effects</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-2">
            Blur: {blur}px
          </label>
          <Slider
            value={[blur || 0]}
            onValueChange={(v) => onUpdateBlur?.(v[0])}
            min={0}
            max={300}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-2">Blend Mode</label>
          <Select value={blendMode} onValueChange={(value) => onSetBlendMode?.(value as GlobalCompositeOperation)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {blendModes?.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {blendModeLabels?.[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <Maximize2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">Edge Control</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Presets</label>
          <Select onValueChange={onApplyEdgePreset}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose preset..." />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {edgePresets && Object.keys(edgePresets).map((presetName) => (
                <SelectItem key={presetName} value={presetName}>
                  {presetName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-2">
            Spread: {(gradientSpread || 1).toFixed(1)}
          </label>
          <Slider
            value={[gradientSpread || 1]}
            onValueChange={(v) => onUpdateGradientSpread?.(v[0])}
            min={0.3}
            max={1.5}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-2">Background</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onUpdateBackgroundColor?.(e.target.value)}
              className="w-12 h-9 rounded cursor-pointer border border-border"
            />
            <div className="flex-1 grid grid-cols-4 gap-1">
              {["#ffffff", "#000000", "#f5f5f5", "#1a1a1a"].map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateBackgroundColor?.(color)}
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
            Fade: {(fadeEndpoint || 1).toFixed(2)}
          </label>
          <Slider
            value={[fadeEndpoint || 1]}
            onValueChange={(v) => onUpdateFadeEndpoint?.(v[0])}
            min={0.3}
            max={1.0}
            step={0.05}
            className="w-full"
          />
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Noise Texture</h3>
        <Button
          variant={noiseEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onSetNoiseEnabled?.(!noiseEnabled)}
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
              value={[noiseOpacity || 0]}
              onValueChange={(v) => onSetNoiseOpacity?.(v[0])}
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
              value={[noiseDensity || 0]}
              onValueChange={(v) => onSetNoiseDensity?.(v[0])}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">
              Sharpness: {(noiseSharpness || 1).toFixed(1)}
            </label>
            <Slider
              value={[noiseSharpness || 1]}
              onValueChange={(v) => onSetNoiseSharpness?.(v[0])}
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
