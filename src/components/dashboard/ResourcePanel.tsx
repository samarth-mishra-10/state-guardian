import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATES, SLIDERS, SliderConfig } from "@/lib/crimeData";
import { Shield } from "lucide-react";

interface ResourcePanelProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
}

function formatValue(value: number, unit: string): string {
  if (unit === "M") return `₹${value}M`;
  if (value >= 1000) return value.toLocaleString("en-IN");
  return `${value}${unit}`;
}

function ResourceSlider({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground font-display">{config.label}</span>
        <span className="font-mono text-sm neon-text">
          {formatValue(value, config.unit)}
        </span>
      </div>
      <Slider
        min={config.min}
        max={config.max}
        step={Math.round((config.max - config.min) / 100)}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground/50">
        <span>{formatValue(config.min, config.unit)}</span>
        <span>{formatValue(config.max, config.unit)}</span>
      </div>
    </div>
  );
}

export default function ResourcePanel({
  selectedState,
  onStateChange,
  sliderValues,
  onSliderChange,
}: ResourcePanelProps) {
  return (
    <div className="h-full flex flex-col glass-panel p-4 space-y-5 overflow-y-auto scanline">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary glow-pulse" />
        <h2 className="text-lg font-bold font-display tracking-wider uppercase neon-text">
          State Resource Simulator
        </h2>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Select Target State
        </label>
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger className="bg-secondary border-border font-display">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {STATES.map((s) => (
              <SelectItem key={s.name} value={s.name} className="font-display">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border/30 pt-3 space-y-5 flex-1">
        {SLIDERS.map((config) => (
          <ResourceSlider
            key={config.id}
            config={config}
            value={sliderValues[config.id]}
            onChange={(v) => onSliderChange(config.id, v)}
          />
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground/40 text-center uppercase tracking-widest pt-2 border-t border-border/20">
        Ministry of Home Affairs • Classified
      </div>
    </div>
  );
}
