import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Plus, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { GradientLayer } from "@/types";

export interface LayerControlsProps {
  layers: GradientLayer[];
  activeLayerId: string | null;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onLayerOrderChange: (newOrder: GradientLayer[]) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onRenameLayer: (layerId: string, newName: string) => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onSelectLayer,
  onLayerOrderChange,
  onDuplicateLayer,
  onToggleVisibility,
  onRenameLayer,
}) => {

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === layerId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(index, 1);
    newLayers.splice(newIndex, 0, movedLayer);
    onLayerOrderChange(newLayers);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onAddLayer} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" /> Add Layer
      </Button>
      <ScrollArea className="h-64 w-full rounded-md border p-2">
        {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              className={`mb-2 flex items-center gap-1 rounded-md p-1.5 transition-colors cursor-pointer ${
                layer.id === activeLayerId ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
              >
                {layer.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <div className="flex-grow">
                <Input
                  type="text"
                  value={layer.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    onRenameLayer(layer.id, e.target.value);
                  }}
                  className="h-8 border-none bg-transparent focus:ring-0 text-sm"
                />
              </div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
      </ScrollArea>
    </div>
  );
};
