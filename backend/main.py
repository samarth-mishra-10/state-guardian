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
    target_year: int = 2014

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
        "states": df_base.to_dict(orient='records'),
        "importances": importances
    }

@app.post("/api/simulate")
def run_simulation(request: SimulateRequest):
    """
    Runs the policy simulation based on user inputs.
    """
    try:
        result = simulate_policy(
            state=request.state.upper(), 
            lever_changes=request.lever_changes,
            target_year=request.target_year
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/safety-profile")
def get_safety_profile(request: SafetyProfileRequest):
    """
    Infers safety profile based on demographic data.
    Uses target metrics scaled by demographic risk factors.
    """
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    df = pd.read_csv(data_path)
    
    state_data = df[df['State'] == request.state.upper()]
    if state_data.empty:
        raise HTTPException(status_code=404, detail="State not found in baseline")
        
    latest_crimes = state_data.sort_values('Year', ascending=False).iloc[0]
    total_crimes = latest_crimes.get('Total_IPC_Crimes', 1)
    crimes_women = latest_crimes.get('Crimes_Against_Women', 1)
    
    risk_score = 0.5 
    
    if request.sex.lower() == 'female':
        risk_score += (crimes_women / (total_crimes + 0.001)) * 2.0
    else:
        risk_score += 0.1
        
    safety_rating = max(10, min(100, 100 - (risk_score * 20)))
    
    return {
        "safety_score": round(safety_rating),
        "primary_risk_factors": ["High regional property crime", "Low clearance rates in area"] if safety_rating < 50 else ["Generally safe demographics"]
    }