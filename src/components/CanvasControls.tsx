import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Palette, Shuffle, Upload, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { LayerControls, LayerControlsProps } from "./LayerControls";
import { DitherMode, GradientLayer, Preset } from "../types";
import { ChangeEvent, useEffect, useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

interface LeftSidebarProps extends LayerControlsProps {
  savedPresets: Preset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (name: string) => void;
}

export function LeftSidebarContent({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onLayerOrderChange,
  onDuplicateLayer,
  onToggleVisibility,
  onRenameLayer,
  savedPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: LeftSidebarProps) {
  const layerControls = (
    <LayerControls
      layers={layers}
      activeLayerId={activeLayerId}
      onAddLayer={onAddLayer}
      onDeleteLayer={onDeleteLayer}
      onSelectLayer={onSelectLayer}
      onLayerOrderChange={onLayerOrderChange}
      onDuplicateLayer={onDuplicateLayer}
      onToggleVisibility={onToggleVisibility}
      onRenameLayer={onRenameLayer}
    />
  );

  const [presetName, setPresetName] = useState("");

  return (
    <div className="p-4 space-y-6">
      <Accordion type="multiple" defaultValue={['layers', 'presets']} className="w-full">
        <AccordionItem value="layers">
          <AccordionTrigger className="text-sm font-semibold">Layers</AccordionTrigger>
          <AccordionContent className="pt-2">
            {layerControls}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="presets">
          <AccordionTrigger className="text-sm font-semibold">Presets</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="h-9"
              />
              <Button onClick={() => {
                onSavePreset(presetName);
                setPresetName("");
              }} className="h-9">
                Save
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedPresets.map((preset) => (
                <div key={preset.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span className="text-sm cursor-pointer" onClick={() => onLoadPreset(preset)}>
                    {preset.name}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeletePreset(preset.name)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

interface RightSidebarProps {
  activeLayer: GradientLayer | undefined;
  updateActiveLayer: (props: Partial<GradientLayer>) => void;
  onSave: () => void;
  selectedPointId: string | null;
  onPointColorChange: (color: string) => void;
  selectedPointColor?: string;
  onDeletePoint: () => void;
  onAddPoint: () => void;
  onClearPoints: () => void;
  onRandomize: () => void;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onApplyPalette: (palette: string[]) => void;
  colorPalettes: Record<string, string[]>;
}

export function RightSidebarContent({
  activeLayer,
  updateActiveLayer,
  onSave,
  selectedPointId,
  onPointColorChange,
  selectedPointColor,
  onDeletePoint,
  onAddPoint,
  onClearPoints,
  onRandomize,
  onImageUpload,
  onApplyPalette,
  colorPalettes,
}: RightSidebarProps) {
  const [color, setColor] = useState(selectedPointColor || "#000000");

  useEffect(() => {
    if (selectedPointColor) {
      setColor(selectedPointColor);
    }
  }, [selectedPointColor]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onPointColorChange(newColor);
  };

  if (!activeLayer) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a layer to see its properties.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <Accordion type="multiple" defaultValue={['points', 'layer', 'gradient']} className="w-full">
        <AccordionItem value="points">
          <AccordionTrigger className="text-sm font-semibold">Color Points</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {selectedPointId && (
              <div className="space-y-2">
                <Label>Selected Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    onBlur={onSave}
                    className="p-0 h-9 w-12"
                  />
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    onBlur={onSave}
                    className="h-9"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onAddPoint} variant="outline"><Plus className="h-4 w-4 mr-2" /> Add</Button>
              <Button onClick={onDeletePoint} variant="outline" disabled={!selectedPointId}><X className="h-4 w-4 mr-2" /> Remove</Button>
              <Button onClick={onClearPoints} variant="outline" className="col-span-2"><X className="h-4 w-4 mr-2" /> Clear All</Button>
              <Button onClick={onRandomize} variant="outline" className="col-span-2"><Shuffle className="h-4 w-4 mr-2" /> Randomize</Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="palettes">
          <AccordionTrigger className="text-sm font-semibold">Color Palettes</AccordionTrigger>
          <AccordionContent className="pt-2">
            <ScrollArea className="h-60">
              <div className="space-y-2 pr-3">
                {Object.entries(colorPalettes).map(([name, colors]) => (
                  <div key={name} onClick={() => onApplyPalette(colors)} className="p-2 rounded-md hover:bg-muted cursor-pointer">
                    <p className="text-sm font-medium">{name}</p>
                    <div className="flex mt-1">
                      {colors.map((c, i) => (
                        <div key={i} style={{ backgroundColor: c }} className="h-4 flex-1 first:rounded-l-sm last:rounded-r-sm" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layer">
          <AccordionTrigger className="text-sm font-semibold">Layer Properties</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div>
              <Label>Opacity</Label>
              <Slider
                value={[activeLayer.opacity * 100]}
                onValueChange={([val]) => updateActiveLayer({ opacity: val / 100 })}
                onPointerUp={onSave}
                max={100}
                step={1}
              />
            </div>
            <div>
              <Label>Blend Mode</Label>
              <Select
                value={activeLayer.blendMode}
                onValueChange={(val) => {
                  updateActiveLayer({ blendMode: val as GlobalCompositeOperation });
                  onSave();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blend mode" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLEND_MODE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="gradient">
          <AccordionTrigger className="text-sm font-semibold">Gradient</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div>
              <Label>Blur</Label>
              <Slider
                value={[activeLayer.blur]}
                onValueChange={([val]) => updateActiveLayer({ blur: val })}
                onPointerUp={onSave}
                max={300}
                step={1}
              />
            </div>
            <div>
              <Label>Spread</Label>
              <Slider
                value={[activeLayer.gradientSpread]}
                onValueChange={([val]) => updateActiveLayer({ gradientSpread: val })}
                onPointerUp={onSave}
                min={0.01}
                max={2}
                step={0.01}
              />
            </div>
            <div>
              <Label>Fade to Background</Label>
              <Slider
                value={[activeLayer.fadeEndpoint]}
                onValueChange={([val]) => updateActiveLayer({ fadeEndpoint: val })}
                onPointerUp={onSave}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <Input
                type="color"
                value={activeLayer.backgroundColor}
                onChange={(e) => updateActiveLayer({ backgroundColor: e.target.value })}
                onBlur={onSave}
                className="w-full"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="image">
          <AccordionTrigger className="text-sm font-semibold">Image Adjustments</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <Button asChild variant="outline">
              <label htmlFor="image-upload-input" className="cursor-pointer w-full">
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </label>
            </Button>
            {activeLayer.uploadedImage && (
              <>
                <div>
                  <Label>Opacity</Label>
                  <Slider
                    value={[activeLayer.imageOpacity]}
                    onValueChange={([val]) => updateActiveLayer({ imageOpacity: val })}
                    onPointerUp={onSave}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Contrast</Label>
                  <Slider
                    value={[activeLayer.imageContrast]}
                    onValueChange={([val]) => updateActiveLayer({ imageContrast: val })}
                    onPointerUp={onSave}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Brightness</Label>
                  <Slider
                    value={[activeLayer.imageBrightness]}
                    onValueChange={([val]) => updateActiveLayer({ imageBrightness: val })}
                    onPointerUp={onSave}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Saturation</Label>
                  <Slider
                    value={[activeLayer.imageSaturation]}
                    onValueChange={([val]) => updateActiveLayer({ imageSaturation: val })}
                    onPointerUp={onSave}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Hue</Label>
                  <Slider
                    value={[activeLayer.imageHue]}
                    onValueChange={([val]) => updateActiveLayer({ imageHue: val })}
                    onPointerUp={onSave}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dither">
          <AccordionTrigger className="text-sm font-semibold">Dither</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div>
              <Label>Dither Mode</Label>
              <Select
                value={activeLayer.ditherMode}
                onValueChange={(val) => {
                  updateActiveLayer({ ditherMode: val as DitherMode });
                  onSave();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dither mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="floyd-steinberg">Floyd-Steinberg</SelectItem>
                  <SelectItem value="atkinson">Atkinson</SelectItem>
                  <SelectItem value="bayer-2x2">Bayer 2x2</SelectItem>
                  <SelectItem value="bayer-4x4">Bayer 4x4</SelectItem>
                  <SelectItem value="bayer-8x8">Bayer 8x8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeLayer.ditherMode !== 'none' && (
              <>
                <div>
                  <Label>Intensity</Label>
                  <Slider
                    value={[activeLayer.ditherIntensity]}
                    onValueChange={([val]) => updateActiveLayer({ ditherIntensity: val })}
                    onPointerUp={onSave}
                    min={2}
                    max={32}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Luminance Threshold</Label>
                  <Slider
                    value={[activeLayer.imageLuminanceThreshold]}
                    onValueChange={([val]) => updateActiveLayer({ imageLuminanceThreshold: val })}
                    onPointerUp={onSave}
                    min={0}
                    max={255}
                    step={1}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Invert Dither</Label>
                  <Switch
                    checked={activeLayer.ditherInvert}
                    onCheckedChange={(checked) => {
                      updateActiveLayer({ ditherInvert: checked });
                      onSave();
                    }}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="noise">
          <AccordionTrigger className="text-sm font-semibold">Noise</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Noise</Label>
              <Switch
                checked={activeLayer.noiseEnabled}
                onCheckedChange={(checked) => {
                  updateActiveLayer({ noiseEnabled: checked });
                  onSave();
                }}
              />
            </div>
            {activeLayer.noiseEnabled && (
              <>
                <div>
                  <Label>Opacity</Label>
                  <Slider
                    value={[activeLayer.noiseOpacity]}
                    onValueChange={([val]) => updateActiveLayer({ noiseOpacity: val })}
                    onPointerUp={onSave}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Density</Label>
                  <Slider
                    value={[activeLayer.noiseDensity]}
                    onValueChange={([val]) => updateActiveLayer({ noiseDensity: val })}
                    onPointerUp={onSave}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Sharpness</Label>
                  <Slider
                    value={[activeLayer.noiseSharpness]}
                    onValueChange={([val]) => updateActiveLayer({ noiseSharpness: val })}
                    onPointerUp={onSave}
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

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
  "hue": "Hue",
  "saturation": "Saturation",
  "color": "Color",
  "luminosity": "Luminosity",
  "source-in": "Source In",
  "source-out": "Source Out",
  "source-atop": "Source Atop",
  "destination-in": "Destination In",
  "destination-out": "Destination Out",
  "destination-over": "Destination Over",
  "destination-atop": "Destination Atop",
  "lighter": "Lighter",
  "copy": "Copy",
  "xor": "XOR",
};

interface CanvasControlsProps {
  layers: GradientLayer[];
  activeLayer: GradientLayer | undefined;
  activeLayerId: string | null;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onLayerOrderChange: (newOrder: GradientLayer[]) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  updateActiveLayer: (props: Partial<GradientLayer>) => void;
  onSave: () => void;
  onAddPoint: () => void;
  onDeletePoint: () => void;
  onClearPoints: () => void;
  onRandomize: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  savedPresets: Preset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (name: string) => void;
  onDownloadImage: () => void;
  selectedPointId: string | null;
  onPointColorChange: (color: string) => void;
  selectedPointColor?: string;
  onApplyPalette: (palette: string[]) => void;
  colorPalettes: Record<string, string[]>;
}

export function CanvasControls({
  layers,
  activeLayer,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onLayerOrderChange,
  onDuplicateLayer,
  onToggleVisibility,
  onRenameLayer,
  updateActiveLayer,
  onSave,
  onAddPoint,
  onDeletePoint,
  onClearPoints,
  onRandomize,
  onImageUpload,
  savedPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onDownloadImage,
  selectedPointId,
  onPointColorChange,
  selectedPointColor,
  onApplyPalette,
  colorPalettes,
}: CanvasControlsProps) {
  return (
    <>
      <LeftSidebarContent
        layers={layers}
        activeLayerId={activeLayerId}
        onAddLayer={onAddLayer}
        onDeleteLayer={onDeleteLayer}
        onSelectLayer={onSelectLayer}
        onLayerOrderChange={onLayerOrderChange}
        onDuplicateLayer={onDuplicateLayer}
        onToggleVisibility={onToggleVisibility}
        onRenameLayer={onRenameLayer}
        savedPresets={savedPresets}
        onSavePreset={onSavePreset}
        onLoadPreset={onLoadPreset}
        onDeletePreset={onDeletePreset}
      />
      <RightSidebarContent
        activeLayer={activeLayer}
        updateActiveLayer={updateActiveLayer}
        onSave={onSave}
        selectedPointId={selectedPointId}
        onPointColorChange={onPointColorChange}
        selectedPointColor={selectedPointColor}
        onDeletePoint={onDeletePoint}
        onAddPoint={onAddPoint}
        onClearPoints={onClearPoints}
        onRandomize={onRandomize}
        onImageUpload={onImageUpload}
        onApplyPalette={onApplyPalette}
        colorPalettes={colorPalettes}
      />
    </>
  );
}
