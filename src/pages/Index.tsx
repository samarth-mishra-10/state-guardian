import { useState, useEffect, useMemo } from "react";
import ResourcePanel from "@/components/dashboard/ResourcePanel";
import IndiaMap from "@/components/dashboard/IndiaMap";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import { toast } from "sonner";

export interface SimulatorStateData {
  State: string;
  Year: number;
  Police_Strength: number;
  Fiscal_Budget_Proxy: number;
  Juveniles_Arrested: number;
  Prolonged_Trials: number;
  Total_IPC_Crimes: number;
  Crimes_Against_Women: number;
  Property_Stolen: number;
}

export default function Index() {
  const [states, setStates] = useState<SimulatorStateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [featuresImportances, setFeaturesImportances] = useState<Record<string, number>>({});
  
  // Slider values represent % change, from -100 to 100
  const [leverChanges, setLeverChanges] = useState<Record<string, number>>({
    Police_Strength: 0,
    Fiscal_Budget_Proxy: 0,
    Juveniles_Arrested: 0,
    Prolonged_Trials: 0
  });

  const [simulatedResults, setSimulatedResults] = useState<Record<string, any>>({});
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Fetch baseline data
    fetch("http://localhost:8000/api/baseline")
      .then(res => res.json())
      .then(data => {
        setStates(data.states);
        setFeaturesImportances(data.feature_importances);
        if (data.states && data.states.length > 0) {
          // Set to a default state, preferably one that isn't completely zero
          const defaultState = data.states.find((s:any) => s.Total_IPC_Crimes > 0)?.State || data.states[0].State;
          setSelectedState(defaultState);
        }
      })
      .catch(err => {
        console.error("Failed to fetch baseline:", err);
        toast.error("Failed to connect to backend simulation engine.");
      });
  }, []);

  const handleSliderChange = (id: string, value: number) => {
    setLeverChanges((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (!selectedState) return;
    
    // Check if any levers changed from 0
    const hasChanges = Object.values(leverChanges).some(v => v !== 0);
    if (!hasChanges) {
      setSimulatedResults({});
      return;
    }

    // Call simulate API
    const runSimulation = async () => {
      setIsSimulating(true);
      try {
        const response = await fetch("http://localhost:8000/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: selectedState,
            lever_changes: leverChanges
          })
        });
        const result = await response.json();
        setSimulatedResults((prev) => ({
          ...prev,
          [selectedState]: result
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSimulating(false);
      }
    };

    // Debounce simulation slightly
    const timeoutId = setTimeout(runSimulation, 500);
    return () => clearTimeout(timeoutId);
  }, [leverChanges, selectedState]);

  const currentStateBaseline = useMemo(() => {
    return states.find(s => s.State === selectedState);
  }, [states, selectedState]);

  if (!states.length) {
    return <div className="h-screen w-screen flex items-center justify-center neon-text">Initializing ICPA Engine...</div>;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:grid md:grid-cols-[300px_1fr_300px] gap-4 p-4 bg-background relative">
      <div className="absolute inset-0 scanline pointer-events-none z-50"></div>
      <ResourcePanel
        selectedState={selectedState}
        statesList={states.map(s => s.State)}
        onStateChange={setSelectedState}
        sliderValues={leverChanges}
        onSliderChange={handleSliderChange}
        isSimulating={isSimulating}
      />
      <IndiaMap
        selectedState={selectedState}
        statesData={states}
        simulatedResults={simulatedResults}
      />
      <AnalyticsPanel
        baseline={currentStateBaseline}
        simulation={simulatedResults[selectedState]}
        stateName={selectedState}
        featureImportances={featuresImportances}
      />
    </div>
  );
}
