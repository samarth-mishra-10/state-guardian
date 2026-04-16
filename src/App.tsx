import React, { useState, useEffect } from 'react';
import ResourcePanel from './components/dashboard/ResourcePanel';
import IndiaMap from './components/dashboard/IndiaMap';
import AnalyticsPanel from './components/dashboard/AnalyticsPanel';
import { Activity, ShieldAlert } from 'lucide-react';

export type SimulationResults = {
  baseline_features: Record<string, number>;
  simulated_features: Record<string, number>;
  base_predicted_crimes: Record<string, number>;
  predicted_crimes: Record<string, number>;
};

export default function App() {
  const [selectedState, setSelectedState] = useState<string>('MAHARASHTRA');
  const [targetYear, setTargetYear] = useState<number>(2025);
  const [levers, setLevers] = useState<Record<string, number>>({
    Police_Strength: 0,
    Fiscal_Budget_Proxy: 0,
    Juveniles_Arrested: 0,
    Juveniles_Low_Income: 0,
    Prolonged_Trials: 0,
    Repeat_Offenders: 0,
  });
  
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: selectedState,
          target_year: targetYear,
          lever_changes: levers,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Server error occurred");
      }
      
      setResults(data);
    } catch (error: any) {
      console.error("Simulation failed:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [selectedState]);

  // Locked the height to the screen, preventing infinite scrolling
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-blue-500 h-6 w-6" />
          <h1 className="text-xl font-bold tracking-tight">Crime Prediction & Policy Simulator</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><Activity className="h-4 w-4 text-green-500"/> XGBoost Causal Engine Active</span>
        </div>
      </header>

      {apiError && (
        <div className="bg-red-500/20 border border-red-500 text-red-100 px-6 py-3 m-6 mb-0 rounded-lg font-mono text-sm shrink-0">
          🚨 API Error: {apiError}
        </div>
      )}

      {/* Added min-h-0 to force grid children to respect parent bounds */}
      <main className="flex-1 min-h-0 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        <section className="col-span-3 min-h-0 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <ResourcePanel 
            targetYear={targetYear}
            setTargetYear={setTargetYear}
            levers={levers} 
            setLevers={setLevers} 
            onSimulate={runSimulation}
            loading={loading}
          />
        </section>

        <section className="col-span-5 min-h-0 bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-2 shrink-0">Regional Selection</h2>
          <p className="text-sm text-slate-400 mb-4 shrink-0">Click a state to set it as the active baseline for simulation.</p>
          <div className="flex-1 relative min-h-0">
             <IndiaMap selectedState={selectedState} onSelectState={setSelectedState} />
          </div>
        </section>

        <section className="col-span-4 min-h-0 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-4">
           <AnalyticsPanel state={selectedState} results={results} loading={loading} />
        </section>

      </main>
    </div>
  );
}