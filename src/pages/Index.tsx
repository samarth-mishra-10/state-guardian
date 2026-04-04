import { useState, useMemo } from "react";
import ResourcePanel from "@/components/dashboard/ResourcePanel";
import IndiaMap from "@/components/dashboard/IndiaMap";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import {
  STATES,
  SLIDERS,
  calculatePredictedTheft,
  getThreatLevel,
} from "@/lib/crimeData";

export default function Index() {
  const [selectedState, setSelectedState] = useState(STATES[0].name);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    () => Object.fromEntries(SLIDERS.map((s) => [s.id, s.defaultValue]))
  );

  const handleSliderChange = (id: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [id]: value }));
  };

  const predictedThefts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const state of STATES) {
      result[state.name] = calculatePredictedTheft(state.baseTheftCases, sliderValues);
    }
    return result;
  }, [sliderValues]);

  const threatLevels = useMemo(() => {
    const result: Record<string, "high" | "medium" | "low"> = {};
    for (const state of STATES) {
      result[state.name] = getThreatLevel(predictedThefts[state.name], state.baseTheftCases);
    }
    return result;
  }, [predictedThefts]);

  const currentState = STATES.find((s) => s.name === selectedState)!;

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-[1fr_2fr_1fr] gap-1 p-1 bg-background">
      <ResourcePanel
        selectedState={selectedState}
        onStateChange={setSelectedState}
        sliderValues={sliderValues}
        onSliderChange={handleSliderChange}
      />
      <IndiaMap
        selectedState={selectedState}
        threatLevels={threatLevels}
        predictedThefts={predictedThefts}
      />
      <AnalyticsPanel
        predictedTheft={predictedThefts[selectedState]}
        baseTheft={currentState.baseTheftCases}
        threatLevel={threatLevels[selectedState]}
        stateName={selectedState}
      />
    </div>
  );
}
