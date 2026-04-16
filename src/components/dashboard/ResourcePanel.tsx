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
    setLevers(prev => ({ ...prev, [key]: value }));
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
    <div className="mb-6 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-blue-300">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const LeverSlider = ({ id, label, min, max }: { id: string, label: string, min: number, max: number }) => (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/55 p-3">
      <div className="mb-2 flex justify-between text-sm">
        <label className="text-slate-300">{label}</label>
        <span className={`font-mono ${levers[id] === 0 ? 'text-slate-500' : levers[id] > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
          {levers[id] > 0 ? '+' : ''}
          {levers[id]}%
        </span>
      </div>
      <input
        type="range" min={min} max={max} step="1"
        value={levers[id]}
        onChange={(e) => handleLeverChange(id, parseInt(e.target.value))}
        style={getSliderBackground(levers[id], min, max)}
        className="policy-slider w-full cursor-pointer"
      />
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-slate-500">
        <span>{min}%</span>
        <span className="text-slate-400">Neutral</span>
        <span>+{max}%</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="text-slate-400" />
        <h2 className="text-xl font-bold">Policy Sandbox</h2>
      </div>
      <p className="mb-5 text-sm leading-6 text-slate-400">
        Adjust levers and test realistic policy decisions before implementation.
      </p>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        <SliderGroup title="Time Projection" icon={<Clock className="h-4 w-4"/>}>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/55 p-3">
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300">Target Simulation Year</label>
              <span className="text-blue-400 font-bold font-mono">{targetYear}</span>
            </div>
            <input
              type="range" min="2014" max="2030" step="1"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="policy-slider w-full cursor-pointer"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <span>2014</span>
              <span className="text-slate-400">Current view</span>
              <span>2030</span>
            </div>
          </div>
        </SliderGroup>

        <SliderGroup title="Enforcement & Infrastructure" icon={<Shield className="h-4 w-4"/>}>
          <LeverSlider id="Police_Strength" label="Police Strength" min={-50} max={100} />
          <LeverSlider id="Fiscal_Budget_Proxy" label="Police Budget & Housing" min={-50} max={100} />
        </SliderGroup>

        <SliderGroup title="Judicial Effectiveness" icon={<Scale className="h-4 w-4"/>}>
          <LeverSlider id="Prolonged_Trials" label="Prolonged Trials (>10 Yrs)" min={-50} max={100} />
          <LeverSlider id="Repeat_Offenders" label="Recidivism (Repeat Offenders)" min={-50} max={100} />
        </SliderGroup>

        <SliderGroup title="Socio-Economic Factors" icon={<Users className="h-4 w-4"/>}>
          <LeverSlider id="Juveniles_Arrested" label="Total Juveniles Arrested" min={-50} max={100} />
          <LeverSlider id="Juveniles_Low_Income" label="Low-Income Demographics" min={-50} max={100} />
        </SliderGroup>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onReset}
          disabled={loading || !hasLeverChanges}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          onClick={onSimulate}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Simulating...' : 'Run simulation'}
        </button>
      </div>
    </div>
  );
}