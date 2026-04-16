import React, { memo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// Highly stable GeoJSON for Indian States
const INDIA_GEO_JSON = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";

interface IndiaMapProps {
  selectedState: string;
  onSelectState: (state: string) => void;
}

const IndiaMap = ({ selectedState, onSelectState }: IndiaMapProps) => {
  const [hoveredState, setHoveredState] = React.useState('');

  const normalizeForMatch = (name: string) => {
    if (!name) return "";
    const clean = name.toUpperCase().replace(/&/g, 'AND');
    if (clean.includes('ANDAMAN')) return 'ANDAMAN AND NICOBAR ISLANDS';
    if (clean.includes('DELHI')) return 'DELHI';
    return clean;
  };

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1000, center: [80, 22] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={INDIA_GEO_JSON}>
          {({ geographies, error }) => {
            if (error) {
              return <text x="50%" y="50%" textAnchor="middle" fill="white">Error loading map shapes.</text>;
            }
            if (!geographies || geographies.length === 0) {
               return <text x="50%" y="50%" textAnchor="middle" fill="white">Loading Map...</text>;
            }

            return geographies.map((geo) => {
              const stateName = normalizeForMatch(geo.properties.NAME_1);
              const isSelected = stateName === selectedState;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onSelectState(stateName)}
                  onMouseEnter={() => setHoveredState(stateName)}
                  onMouseLeave={() => setHoveredState('')}
                  style={{
                    default: {
                      fill: isSelected ? "#3b82f6" : "#1e293b",
                      stroke: "#0f172a",
                      strokeWidth: 1,
                      outline: "none",
                    },
                    hover: {
                      fill: isSelected ? "#3b82f6" : "#60a5fa",
                      stroke: "#0f172a",
                      strokeWidth: 1,
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: {
                      fill: "#2563eb",
                      outline: "none",
                    },
                  }}
                />
              );
            });
          }}
        </Geographies>
      </ComposableMap>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/90 px-2 py-1 text-xs text-slate-200">
        {hoveredState || selectedState}
      </div>
    </div>
  );
};

export default memo(IndiaMap);