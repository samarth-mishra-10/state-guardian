import React from 'react';
import { Settings2, Clock, Shield, Scale, Users } from 'lucide-react';

interface ResourcePanelProps {
  targetYear: number;
  setTargetYear: (year: number) => void;
  levers: Record<string, number>;
  setLevers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onSimulate: () => void;
  loading: boolean;
}

export default function ResourcePanel({ targetYear, setTargetYear, levers, setLevers, onSimulate, loading }: ResourcePanelProps) {
  
  const handleLeverChange = (key: string, value: number) => {
    setLevers(prev => ({ ...prev, [key]: value }));
  };

  const SliderGroup = ({ title, icon, children }: any) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 text-blue-400 border-b border-slate-800 pb-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );

  const LeverSlider = ({ id, label, min, max }: { id: string, label: string, min: number, max: number }) => (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <label className="text-slate-300">{label}</label>
        <span className="text-slate-400 font-mono">{levers[id] > 0 ? '+' : ''}{levers[id]}%</span>
      </div>
      <input 
        type="range" min={min} max={max} step="5"
        value={levers[id]}
        onChange={(e) => handleLeverChange(id, parseInt(e.target.value))}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="text-slate-400" />
        <h2 className="text-xl font-bold">Policy Sandbox</h2>
      </div>

      <div className="flex-1 pr-2">
        {/* Time Projection */}
        <SliderGroup title="Time Projection" icon={<Clock className="h-4 w-4"/>}>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300">Target Simulation Year</label>
              <span className="text-blue-400 font-bold font-mono">{targetYear}</span>
            </div>
            <input 
              type="range" min="2014" max="2030" step="1"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </SliderGroup>

        {/* Enforcement */}
        <SliderGroup title="Enforcement & Infrastructure" icon={<Shield className="h-4 w-4"/>}>
          <LeverSlider id="Police_Strength" label="Police Strength" min={-50} max={100} />
          <LeverSlider id="Fiscal_Budget_Proxy" label="Police Budget & Housing" min={-50} max={100} />
        </SliderGroup>

        {/* Judicial */}
        <SliderGroup title="Judicial Effectiveness" icon={<Scale className="h-4 w-4"/>}>
          <LeverSlider id="Prolonged_Trials" label="Prolonged Trials (>10 Yrs)" min={-50} max={100} />
          <LeverSlider id="Repeat_Offenders" label="Recidivism (Repeat Offenders)" min={-50} max={100} />
        </SliderGroup>

        {/* Socio-Economic */}
        <SliderGroup title="Socio-Economic Factors" icon={<Users className="h-4 w-4"/>}>
          <LeverSlider id="Juveniles_Arrested" label="Total Juveniles Arrested" min={-50} max={100} />
          <LeverSlider id="Juveniles_Low_Income" label="Low-Income Demographics" min={-50} max={100} />
        </SliderGroup>
      </div>

      <button 
        onClick={onSimulate}
        disabled={loading}
        className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Simulating...' : 'Run Simulation'}
      </button>
    </div>
  );
}