from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import pandas as pd
import json
import os
from .model_training import simulate_policy

app = FastAPI(title="India Crime & Policy Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

class SimulateRequest(BaseModel):
    state: str
    district: Optional[str] = None
    lever_changes: Dict[str, float]

class SafetyProfileRequest(BaseModel):
    state: str
    age_group: str
    sex: str
    
@app.get("/api/baseline")
def get_baseline():
    """Returns the baseline features for all states to populate the map initially."""
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Data not found")
        
    df = pd.read_csv(data_path)
    # Average across years for baseline
    numeric_cols = df.select_dtypes(include=['number']).columns
    df_base = df.groupby('State')[numeric_cols].mean().reset_index()
    
    # Also load feature importances
    importance_path = os.path.join(ROOT_DIR, 'backend', 'feature_importances.json')
    importances = {}
    if os.path.exists(importance_path):
        with open(importance_path, 'r') as f:
            importances = json.load(f)
            
    return {
        "states": df_base.to_dict(orient="records"),
        "feature_importances": importances
    }

@app.post("/api/simulate")
def simulate(request: SimulateRequest):
    """Predicts modified crime outcomes based on lever changes."""
    result = simulate_policy(request.state, request.district or "All", request.lever_changes)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/safety-profile")
def get_safety_profile(request: SafetyProfileRequest):
    """
    Infers safety profile based on demographic data.
    Uses target metrics scaled by demographic risk factors.
    """
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    df = pd.read_csv(data_path)
    
    state_data = df[df['State'] == request.state]
    if state_data.empty:
        raise HTTPException(status_code=404, detail="State not found in baseline")
        
    latest_crimes = state_data.sort_values('Year', ascending=False).iloc[0]
    total_crimes = latest_crimes.get('Total_IPC_Crimes', 1)
    crimes_women = latest_crimes.get('Crimes_Against_Women', 1)
    
    # Calculate a proxy risk index based on demographics
    # If women, index heavily relates to crimes against women.
    # If young (e.g. 18-30), different factors apply...
    
    risk_score = 0.5  # Baseline risk
    
    if request.sex.lower() == 'female':
        risk_score += (crimes_women / (total_crimes + 0.001)) * 2.0
    else:
        risk_score += 0.1
        
    # Standardize a safety rating between 0 (very unsafe) and 100 (very safe)
    # A simple heuristic normal distribution approximation
    safety_rating = max(10, min(100, 100 - (risk_score * 50)))
    
    return {
        "state": request.state,
        "demographic": f"{request.sex}, {request.age_group}",
        "safety_rating": round(safety_rating, 2),
        "notes": "Safety rating inferred from specialized crime ratios."
    }
