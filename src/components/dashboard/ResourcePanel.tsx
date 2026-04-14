import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Coins, Users } from "lucide-react";

interface ResourcePanelProps {
  selectedState: string;
  statesList: string[];
  onStateChange: (state: string) => void;
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
  isSimulating: boolean;
}

function PercentSlider({
  label,
  value,
  onChange,
  description
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  description: string;
}) {
  return (
    <div className="space-y-3 py-3 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className={`font-mono text-sm px-2 py-0.5 rounded ${value > 0 ? "bg-green-500/20 text-green-400" : value < 0 ? "bg-red-500/20 text-red-400" : "bg-secondary text-muted-foreground"}`}>
          {value > 0 ? "+" : ""}{value}%
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
      <Slider
        min={-50}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer py-2"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60 uppercase tracking-wider font-mono">
        <span>-50%</span>
        <span>Baseline</span>
        <span>+100%</span>
      </div>
    </div>
  );
}

export default function ResourcePanel({
  selectedState,
  statesList,
  onStateChange,
  sliderValues,
  onSliderChange,
  isSimulating
}: ResourcePanelProps) {
  return (
    <div className="h-full flex flex-col bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-5 space-y-6 overflow-y-auto shadow-lg relative">
      {isSimulating && (
        <div className="absolute top-5 right-5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
        </div>
      )}
      
      <div className="flex items-center gap-3 border-b border-border/30 pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Policy Simulator
          </h2>
          <p className="text-xs text-muted-foreground/80 mt-0.5">Adjust variables to forecast crime outcomes</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground ml-1">
          Target Jurisdiction
        </label>
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger className="w-full bg-background/50 h-11 border-border/50 hover:bg-background transition-colors font-medium">
            <SelectValue placeholder="Select a State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {statesList.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 pt-2">
        <Tabs defaultValue="enforcement" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-background/50 p-1 rounded-lg">
            <TabsTrigger value="enforcement" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Shield className="w-3.5 h-3.5 mr-1.5 hidden sm:block"/>Police</TabsTrigger>
            <TabsTrigger value="fiscal" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Coins className="w-3.5 h-3.5 mr-1.5 hidden sm:block"/>Fiscal</TabsTrigger>
            <TabsTrigger value="social" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Users className="w-3.5 h-3.5 mr-1.5 hidden sm:block"/>Social</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 flex-1">
            <TabsContent value="enforcement" className="m-0 focus-visible:outline-none">
              <PercentSlider 
                label="Active Police Strength" 
                description="Modifies the number of operational police officers relative to the baseline sanctioned strength."
                value={sliderValues["Police_Strength"] || 0} 
                onChange={(v) => onSliderChange("Police_Strength", v)} 
              />
            </TabsContent>
            
            <TabsContent value="fiscal" className="m-0 focus-visible:outline-none">
              <PercentSlider 
                label="Resource & Infrastructure Fund" 
                description="Shifts dedicated financial budgets, modelled via police mobility and housing proxies."
                value={sliderValues["Fiscal_Budget_Proxy"] || 0} 
                onChange={(v) => onSliderChange("Fiscal_Budget_Proxy", v)} 
              />
            </TabsContent>

            <TabsContent value="social" className="m-0 space-y-4 focus-visible:outline-none">
              <PercentSlider 
                label="Juvenile Intervention" 
                description="Increases social resources directed at at-risk youth and education."
                value={sliderValues["Juveniles_Arrested"] || 0} 
                onChange={(v) => onSliderChange("Juveniles_Arrested", v)} 
              />
              <PercentSlider 
                label="Judicial Efficiency" 
                description="Decreasing prolonged trials implies faster courts and reduced case backlog."
                value={sliderValues["Prolonged_Trials"] || 0} 
                onChange={(v) => onSliderChange("Prolonged_Trials", v)} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
