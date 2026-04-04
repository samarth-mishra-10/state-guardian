import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { STATES, StateData, getThreatColor } from "@/lib/crimeData";
import { useState } from "react";

const INDIA_TOPO =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface IndiaMapProps {
  selectedState: string;
  threatLevels: Record<string, "high" | "medium" | "low">;
  predictedThefts: Record<string, number>;
}

export default function IndiaMap({
  selectedState,
  threatLevels,
  predictedThefts,
}: IndiaMapProps) {
  const [tooltip, setTooltip] = useState<{
    state: StateData;
    x: number;
    y: number;
  } | null>(null);

  const selectedData = STATES.find((s) => s.name === selectedState);
  const center: [number, number] = selectedData
    ? selectedData.coordinates
    : [78.9, 22.5];
  const zoom = selectedData ? 5.5 : 3.8;

  return (
    <div className="relative h-full w-full glass-panel overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-lg font-bold font-display tracking-wider uppercase neon-text">
          Live State-Level Threat Prediction
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          PAN-INDIA TACTICAL OVERVIEW • REAL-TIME
        </p>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 800, center: [78.9, 22.5] }}
        className="w-full h-full"
        style={{ background: "transparent" }}
      >
        <ZoomableGroup center={center} zoom={zoom} minZoom={2} maxZoom={10}>
          <Geographies geography={INDIA_TOPO}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(220, 30%, 12%)"
                  stroke="hsl(220, 30%, 20%)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "hsl(220, 30%, 16%)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {STATES.map((state) => {
            const level = threatLevels[state.name] || "medium";
            const color = getThreatColor(level);
            const isSelected = state.name === selectedState;
            const predicted = predictedThefts[state.name] ?? state.baseTheftCases;

            return (
              <Marker
                key={state.name}
                coordinates={state.coordinates}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      state,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Outer glow */}
                <circle
                  r={isSelected ? 8 : 5}
                  fill={color}
                  opacity={0.2}
                  className={isSelected ? "glow-pulse" : ""}
                />
                {/* Inner marker */}
                <circle
                  r={isSelected ? 4.5 : 3}
                  fill={color}
                  stroke={isSelected ? "white" : color}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  opacity={0.9}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="absolute z-20 glass-panel p-3 pointer-events-none min-w-[180px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-display font-bold text-sm neon-text">
            {tooltip.state.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Est. Theft Cases:{" "}
            <span className="text-foreground">
              {(predictedThefts[tooltip.state.name] ?? tooltip.state.baseTheftCases).toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      )}

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-30" />
    </div>
  );
}
