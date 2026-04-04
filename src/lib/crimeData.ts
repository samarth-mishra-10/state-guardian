export interface StateData {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  baseTheftCases: number;
}

export const STATES: StateData[] = [
  { name: "Uttar Pradesh", coordinates: [80.9, 26.8], baseTheftCases: 45200 },
  { name: "Maharashtra", coordinates: [75.7, 19.7], baseTheftCases: 38700 },
  { name: "Tamil Nadu", coordinates: [78.6, 11.1], baseTheftCases: 29400 },
  { name: "West Bengal", coordinates: [87.8, 22.9], baseTheftCases: 31800 },
  { name: "Karnataka", coordinates: [75.7, 15.3], baseTheftCases: 26500 },
];

export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  unit: string;
  weight: number; // how much this affects prediction
}

export const SLIDERS: SliderConfig[] = [
  { id: "civilPolice", label: "State Civil Police Force", min: 50000, max: 300000, defaultValue: 120000, unit: "", weight: 0.35 },
  { id: "patrolFleet", label: "State Patrol Fleet", min: 1000, max: 15000, defaultValue: 5000, unit: " vehicles", weight: 0.2 },
  { id: "auxiliaryGuards", label: "Auxiliary/Home Guards", min: 10000, max: 100000, defaultValue: 35000, unit: "", weight: 0.15 },
  { id: "policeStations", label: "Operational Police Stations", min: 500, max: 3000, defaultValue: 1200, unit: "", weight: 0.2 },
  { id: "housingBudget", label: "Police Housing Budget", min: 10, max: 500, defaultValue: 100, unit: "M", weight: 0.1 },
];

export function calculatePredictedTheft(
  baseTheft: number,
  sliderValues: Record<string, number>
): number {
  let reductionFactor = 0;

  for (const slider of SLIDERS) {
    const value = sliderValues[slider.id] ?? slider.defaultValue;
    const normalizedPosition = (value - slider.min) / (slider.max - slider.min);
    reductionFactor += normalizedPosition * slider.weight;
  }

  // reductionFactor ranges 0..1. At max resources, reduce theft by ~65%
  const predicted = baseTheft * (1 - reductionFactor * 0.65);
  return Math.round(predicted);
}

export function getThreatLevel(predicted: number, base: number): "high" | "medium" | "low" {
  const ratio = predicted / base;
  if (ratio > 0.7) return "high";
  if (ratio > 0.45) return "medium";
  return "low";
}

export function getThreatColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    case "low": return "#22c55e";
  }
}

export const PIE_DATA = [
  { name: "Auto Theft", value: 40, fill: "hsl(199, 89%, 48%)" },
  { name: "Residential Burglary", value: 35, fill: "hsl(199, 89%, 35%)" },
  { name: "Commercial", value: 15, fill: "hsl(199, 60%, 60%)" },
  { name: "Other", value: 10, fill: "hsl(220, 30%, 40%)" },
];

export const BAR_DATA = [
  { ageGroup: "18-24", arrests: 3400 },
  { ageGroup: "25-34", arrests: 5200 },
  { ageGroup: "35-44", arrests: 3800 },
  { ageGroup: "45-54", arrests: 2100 },
  { ageGroup: "55+", arrests: 900 },
];
