import React from 'react';
import { Clock, RotateCcw, Scale, Settings2, Shield, Users } from 'lucide-react';

interface ResourcePanelProps {
  targetYear: number;
  setTargetYear: (year: number) => void;
  levers: Record<string, number>;
  setLevers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onSimulate: () => void;
  onReset: () => void;
  loading: boolean;
  hasLeverChanges: boolean;
}

export default function ResourcePanel({
  targetYear,
  setTargetYear,
  levers,
  setLevers,
  onSimulate,
  onReset,
  loading,
  hasLeverChanges,
}: ResourcePanelProps) {
  const handleLeverChange = (key: string, value: number) => {
    // Optional: Add clamping logic here to ensure typed values don't exceed min/max bounds
    setLevers((prev) => ({ ...prev, [key]: value }));
  };

  const getSliderBackground = (value: number, min: number, max: number) => {
    const midpoint = ((0 - min) / (max - min)) * 100;
    const progress = ((value - min) / (max - min)) * 100;

    if (value < 0) {
      return {
        background: `linear-gradient(to right,
          rgba(245, 158, 11, 0.55) 0%,
          rgba(245, 158, 11, 0.35) ${progress}%,
          rgba(30, 41, 59, 0.9) ${progress}%,
          rgba(30, 41, 59, 0.9) ${midpoint}%,
          rgba(37, 99, 235, 0.18) ${midpoint}%,
          rgba(37, 99, 235, 0.28) 100%)`,
      };
    }

    return {
      background: `linear-gradient(to right,
        rgba(245, 158, 11, 0.22) 0%,
        rgba(245, 158, 11, 0.12) ${midpoint}%,
        rgba(59, 130, 246, 0.95) ${midpoint}%,
        rgba(59, 130, 246, 0.95) ${progress}%,
        rgba(30, 41, 59, 0.95) ${progress}%,
        rgba(30, 41, 59, 0.95) 100%)`,
    };
  };

  const SliderGroup = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="mb-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 shadow-inner">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-800/80 pb-2 text-blue-300">
        {icon}
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const LeverSlider = ({ id, label, min, max }: { id: string; label: string; min: number; max: number }) => (
    <div className="group rounded-lg border border-transparent p-1 transition-all hover:border-slate-800/60 hover:bg-slate-900/30">
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <label className="text-slate-300">{label}</label>
          {levers[id] !== 0 && (
            <button
              onClick={() => handleLeverChange(id, 0)}
              className="text-slate-500 opacity-0 transition-all hover:text-slate-300 group-hover:opacity-100"
              title="Reset to Neutral"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            value={levers[id] === 0 ? '' : levers[id]}
            placeholder="0"
            onChange={(e) => handleLeverChange(id, Number(e.target.value) || 0)}
            className={`w-14 rounded-md border border-slate-700 bg-slate-950/50 px-1 py-0.5 text-right font-mono text-sm outline-none transition-colors focus:border-blue-500 focus:bg-slate-900 ${
              levers[id] === 0 ? 'text-slate-500' : levers[id] > 0 ? 'text-emerald-300' : 'text-amber-300'
            }`}
          />
          <span className="text-slate-500">%</span>
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={levers[id]}
        onChange={(e) => handleLeverChange(id, Number(e.target.value))}
        style={getSliderBackground(levers[id], min, max)}
        className="policy-slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 outline-none transition-opacity hover:opacity-90"
      />
      
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <button onClick={() => handleLeverChange(id, min)} className="hover:text-amber-400 transition-colors">
          {min}%
        </button>
        <button onClick={() => handleLeverChange(id, 0)} className="hover:text-slate-300 transition-colors">
          Neutral
        </button>
        <button onClick={() => handleLeverChange(id, max)} className="hover:text-blue-400 transition-colors">
          +{max}%
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2">
        <Settings2 className="text-slate-400" />
        <h2 className="text-lg font-bold tracking-tight text-slate-100">Policy Sandbox</h2>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-400">
        Adjust levers and test realistic policy decisions before implementation.
      </p>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <SliderGroup title="Time Projection" icon={<Clock className="h-4 w-4" />}>
          <div className="p-1">
            <div className="mb-2 flex justify-between text-sm">
              <label className="text-slate-300">Target Simulation Year</label>
              <span className="font-mono font-bold text-blue-400">{targetYear}</span>
            </div>
            <input
              type="range"
              min="2014"
              max="2030"
              step="1"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="policy-slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 outline-none hover:opacity-90"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
              <button onClick={() => setTargetYear(2014)} className="hover:text-slate-300 transition-colors">2014</button>
              <span className="text-slate-400">Current view</span>
              <button onClick={() => setTargetYear(2030)} className="hover:text-slate-300 transition-colors">2030</button>
            </div>
          </div>
        </SliderGroup>

        <SliderGroup title="Enforcement & Infrastructure" icon={<Shield className="h-4 w-4" />}>
          <LeverSlider id="Police_Strength" label="Police Strength" min={-50} max={100} />
          <LeverSlider id="Fiscal_Budget_Proxy" label="Police Budget & Housing" min={-50} max={100} />
        </SliderGroup>

        <SliderGroup title="Judicial Effectiveness" icon={<Scale className="h-4 w-4" />}>
          <LeverSlider id="Prolonged_Trials" label="Prolonged Trials (>10 Yrs)" min={-50} max={100} />
          <LeverSlider id="Repeat_Offenders" label="Recidivism" min={-50} max={100} />
        </SliderGroup>

        <SliderGroup title="Socio-Economic Factors" icon={<Users className="h-4 w-4" />}>
          <LeverSlider id="Juveniles_Arrested" label="Juveniles Arrested" min={-50} max={100} />
          <LeverSlider id="Juveniles_Low_Income" label="Low-Income Demographics" min={-50} max={100} />
        </SliderGroup>
      </div>

      <div className="mt-4 flex gap-3 pt-2">
        <button
          onClick={onReset}
          disabled={loading || !hasLeverChanges}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          onClick={onSimulate}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>
    </div>
  );
}