import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { Map, AlertTriangle } from "lucide-react";
import { SimulatorStateData } from "@/pages/Index";
import { Switch } from "@/components/ui/switch";

interface IndiaMapProps {
  selectedState: string;
  statesData: SimulatorStateData[];
  simulatedResults: Record<string, any>;
}

const INDIA_GEO_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

function blendHexColors(col1: string, col2: string, ratio: number) {
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  
  // Clean standard hex cols
  if (col1.length === 4) col1 = "#" + col1[1]+col1[1] + col1[2]+col1[2] + col1[3]+col1[3];
  if (col2.length === 4) col2 = "#" + col2[1]+col2[1] + col2[2]+col2[2] + col2[3]+col2[3];
  
  const h1 = parseInt(col1.replace('#', ''), 16);
  const h2 = parseInt(col2.replace('#', ''), 16);
  
  const r1 = (h1 >> 16) & 255, g1 = (h1 >> 8) & 255, b1 = h1 & 255;
  const r2 = (h2 >> 16) & 255, g2 = (h2 >> 8) & 255, b2 = h2 & 255;
  
  const r = Math.round(r1 * ratio + r2 * (1 - ratio));
  const g = Math.round(g1 * ratio + g2 * (1 - ratio));
  const b = Math.round(b1 * ratio + b2 * (1 - ratio));
  
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default function IndiaMap({ selectedState, statesData, simulatedResults }: IndiaMapProps) {
  const [hexbinMode, setHexbinMode] = useState(false);

  const colorScale = scaleQuantile<string>()
    .domain(statesData.map(s => s.Total_IPC_Crimes || 0))
    .range([
      "#15803d", // low (darker green)
      "#65a30d",
      "#ca8a04", // medium (amber)
      "#ea580c",
      "#dc2626", // high (red)
    ]);

  // Determine highest crime state for hotspot highlighting
  const hotspotState = useMemo(() => {
    let highest = 0;
    let sname = "";
    statesData.forEach(s => {
      let cur = s.Total_IPC_Crimes || 0;
      if (simulatedResults[s.State]) {
        cur = simulatedResults[s.State].predicted_crimes?.Total_IPC_Crimes || cur;
      }
      if (cur > highest) {
        highest = cur;
        sname = s.State;
      }
    });
    return sname;
  }, [statesData, simulatedResults]);

  return (
    <div className="h-full flex flex-col glass-panel p-4 relative overflow-hidden group">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary glow-pulse" />
          <h2 className="text-lg font-bold font-display tracking-wider uppercase text-foreground">
            Geospatial Intel
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-2 bg-secondary/80 backdrop-blur-md rounded-md p-2 border border-border">
          <Switch 
            checked={hexbinMode}
            onCheckedChange={setHexbinMode}
            id="hexbin-mode"
          />
          <label htmlFor="hexbin-mode" className="text-[10px] uppercase font-mono text-muted-foreground cursor-pointer flex items-center gap-1">
            Hexbin Grid Overlay
          </label>
        </div>
      </div>

      {hotspotState && (
        <div className="absolute top-4 right-4 z-10 bg-destructive/10 border border-destructive/30 px-3 py-2 rounded flex items-center gap-2 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-xs font-mono text-destructive tracking-widest uppercase">
            Active Hotspot: {hotspotState}
          </span>
        </div>
      )}

      <div className="flex-1 w-full relative h-[80vh]">
        {/* Background grid effect */}
        <div className="absolute inset-0 futuristic-grid opacity-20 pointer-events-none" />

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1000,
            center: [80, 22],
          }}
          className="w-full h-full stroke-background outline-none drop-shadow-md"
        >
          <defs>
            <pattern id="hex-pattern" width="10" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
              <path d="M5 0 L10 2.886 L10 8.66 L5 11.547 L0 8.66 L0 2.886 Z" fill="transparent" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1"/>
            </pattern>
          </defs>
          <Geographies geography={INDIA_GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoNameId = geo.properties?.NAME_1 || geo.properties?.name || geo.properties?.ST_NM;
                const stateNameUpper = geoNameId ? geoNameId.toUpperCase() : "";
                
                const sData = statesData.find((s) => stateNameUpper.includes(s.State) || s.State.includes(stateNameUpper));
                
                let curValue = sData ? sData.Total_IPC_Crimes : 0;
                let baseColor = sData ? colorScale(sData.Total_IPC_Crimes) : "#1a1f2e";
                let overrideColor = baseColor;
                
                if (sData && sData.State === selectedState && simulatedResults[selectedState]) {
                  const simVal = simulatedResults[selectedState].predicted_crimes?.Total_IPC_Crimes;
                  const basePredict = simulatedResults[selectedState].base_predicted_crimes?.Total_IPC_Crimes;
                  
                  if (simVal !== undefined && basePredict !== undefined) {
                    curValue = simVal;
                    const origVal = basePredict;
                    const pctChange = ((origVal - simVal) / origVal) * 100;
                    
                    if (Math.abs(pctChange) > 0.1) {
                        const intensity = Math.min(Math.abs(pctChange) * 0.05, 0.9); // max 90% blend
                        const mixColor = pctChange > 0 ? '#39ff14' : '#ff073a'; // green if reduced, red if increased
                        overrideColor = blendHexColors(mixColor, baseColor, intensity);
                    }
                  }
                }

                const isSelected = sData && selectedState === sData.State;
                const isHotspot = sData && sData.State === hotspotState;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={hexbinMode ? `url(#hex-pattern)` : overrideColor}
                    stroke={isHotspot ? "#ef4444" : isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth={isHotspot ? 1.5 : isSelected ? 1.5 : 0.5}
                    style={{
                      default: { 
                        outline: "none",
                        fill: hexbinMode ? "url(#hex-pattern)" : overrideColor,
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: "hsl(199, 89%, 48%)",
                        outline: "none",
                        cursor: "crosshair",
                        filter: isHotspot ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))" : "drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))",
                      },
                      pressed: { outline: "none" },
                    }}
                    className={isHotspot ? "glow-pulse" : "transition-all duration-300"}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="absolute bottom-6 left-4 z-10 glass-panel p-4 min-w-[240px] rounded-lg">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-mono border-b border-border/50 pb-2">
          Threat Matrix Legend (Total IPC)
        </h3>
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2">
          <span>Low Risk</span>
          <span>Max Risk</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-green-700 via-yellow-500 to-red-600" />
      </div>
    </div>
  );
}
