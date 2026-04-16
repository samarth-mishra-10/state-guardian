import React, { useMemo, useState } from 'react';
import ResourcePanel from './components/dashboard/ResourcePanel';
import IndiaMap from './components/dashboard/IndiaMap';
import AnalyticsPanel from './components/dashboard/AnalyticsPanel';
import { Activity, Loader2, MapPinned, ShieldAlert, Sparkles } from 'lucide-react';

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

  const hasLeverChanges = useMemo(
    () => Object.values(levers).some((value) => value !== 0),
    [levers]
  );

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
        throw new Error(data.detail || 'Server error occurred');
      }

      setResults(data);
    } catch (error: unknown) {
      console.error('Simulation failed:', error);
      setApiError(error instanceof Error ? error.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setTargetYear(2025);
    setLevers({
      Police_Strength: 0,
      Fiscal_Budget_Proxy: 0,
      Juveniles_Arrested: 0,
      Juveniles_Low_Income: 0,
      Prolonged_Trials: 0,
      Repeat_Offenders: 0,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/70 p-5 shadow-[0_0_80px_-40px_rgba(59,130,246,0.7)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-blue-400" />
                <h1 className="text-2xl font-bold tracking-tight">State Guardian</h1>
              </div>
              <p className="text-sm text-slate-300">
                Plan data-backed public safety scenarios with state-specific projections and actionable insights.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Causal Engine Online
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5">
                <MapPinned className="h-3.5 w-3.5 text-blue-400" />
                {selectedState}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-700/60 bg-blue-500/10 px-3 py-1.5 text-blue-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running simulation
                </span>
              )}
            </div>
          </div>
        </header>

        {apiError && (
          <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
            API error: {apiError}
          </div>
        )}

        <main className="grid items-start gap-5 xl:grid-cols-12">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_20px_80px_-60px_rgba(59,130,246,0.7)] md:p-5 xl:col-span-3 xl:sticky xl:top-4">
            <ResourcePanel
              targetYear={targetYear}
              setTargetYear={setTargetYear}
              levers={levers}
              setLevers={setLevers}
              onSimulate={runSimulation}
              onReset={resetScenario}
              loading={loading}
              hasLeverChanges={hasLeverChanges}
            />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_20px_80px_-60px_rgba(59,130,246,0.45)] md:p-5 xl:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pick a State</h2>
                <p className="text-sm text-slate-400">
                  Select any region and run a custom policy scenario.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                Interactive map
              </span>
            </div>
            <div className="h-[420px] md:h-[520px]">
              <IndiaMap selectedState={selectedState} onSelectState={setSelectedState} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_20px_80px_-60px_rgba(59,130,246,0.45)] md:p-5 xl:col-span-5">
            <AnalyticsPanel state={selectedState} results={results} loading={loading} />
          </section>
        </main>
        <div className="mt-5 text-center text-xs text-slate-500">
          Tip: tweak 1-2 levers at a time to understand causal impact clearly.
        </div>
      </div>
    </div>
  );
}