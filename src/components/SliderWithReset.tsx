import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";

interface SliderWithResetProps {
  label: string;
  value: number;
  defaultValue: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
}

export const SliderWithReset = ({
  label,
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  formatValue,
}: SliderWithResetProps) => {
  const displayValue = formatValue ? formatValue(value) : value;
  const isDefault = value === defaultValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-muted-foreground">
          {label}: {displayValue}
        </label>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-50 hover:opacity-100"
          onClick={() => onChange(defaultValue)}
          disabled={isDefault}
          title="Reset to default"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
};
