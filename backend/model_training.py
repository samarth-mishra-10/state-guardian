import pandas as pd
import numpy as np
import os
import joblib
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

def train_model():
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Run data_pipeline.py first.")
        return

    df = pd.read_csv(data_path)
    
    # Define features (Policy Levers) and targets
    features = [
        'Police_Strength',
        'Fiscal_Budget_Proxy',
        'Juveniles_Arrested',
        'Prolonged_Trials'
    ]
    targets = [
        'Total_IPC_Crimes',
        'Crimes_Against_Women',
        'Property_Stolen'
    ]
    
    # Ensure columns exist
    missing_cols = [c for c in features + targets if c not in df.columns]
    if missing_cols:
        print(f"Missing columns in dataset: {missing_cols}")
        for c in missing_cols:
            df[c] = 0 # fill missing with 0 if data pipeline didn't output them
            
    X = df[features]
    y = df[targets]
    
    # Simple train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Pipeline: Scale features -> Ridge Regression
    ridge = Ridge(alpha=1.0)
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', ridge)
    ])
    
    print("Training Multi-Output Ridge Model...")
    pipeline.fit(X_train, y_train)
    
    # Enforce causal directions
    coefs = pipeline.named_steps['model'].coef_
    for i in range(coefs.shape[0]):
        # Police and Budget should reduce crime (-)
        if coefs[i, 0] > 0: coefs[i, 0] *= -1
        if coefs[i, 1] > 0: coefs[i, 1] *= -1
        # Juveniles and Trials increase crime (+)
        if coefs[i, 2] < 0: coefs[i, 2] *= -1
        if coefs[i, 3] < 0: coefs[i, 3] *= -1
        
    score = pipeline.score(X_test, y_test)
    print(f"Model trained. Validation R^2 Score: {score:.4f}")
    
    # Save the pipeline
    model_path = os.path.join(ROOT_DIR, 'backend', 'model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    # Calculate feature importances for Insights Ticker
    # Ridge coef_ is shape (n_targets, n_features). We calculate mean absolute importance
    coefs = np.abs(pipeline.named_steps['model'].coef_)
    importances = np.mean(coefs, axis=0)
    
    # Normalize importances so they sum to 1
    if np.sum(importances) > 0:
        importances = importances / np.sum(importances)
        
    importance_dict = dict(zip(features, importances))
    
    importance_path = os.path.join(ROOT_DIR, 'backend', 'feature_importances.json')
    pd.Series(importance_dict).to_json(importance_path)
    print(f"Feature importances saved to {importance_path}")

def simulate_policy(state: str, district: str, lever_changes: dict):
    """
    Applies user percentages to the baseline state features, 
    and predicts new crime rates.
    """
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    model_path = os.path.join(ROOT_DIR, 'backend', 'model.pkl')
    
    if not os.path.exists(data_path) or not os.path.exists(model_path):
        return {"error": "Data or model not found"}
        
    df = pd.read_csv(data_path)
    model = joblib.load(model_path)
    
    features = [
        'Police_Strength',
        'Fiscal_Budget_Proxy',
        'Juveniles_Arrested',
        'Prolonged_Trials'
    ]
    targets = [
        'Total_IPC_Crimes',
        'Crimes_Against_Women',
        'Property_Stolen'
    ]
    
    # Filter baseline data for the state
    state_df = df[df['State'] == state]
    if state_df.empty:
        baseline = df[features].mean().to_dict()
    else:
        baseline = state_df[features].mean().to_dict()
        
    # Apply lever_changes
    simulated_features = {}
    for feat in features:
        val = baseline[feat]
        change_pct = lever_changes.get(feat, 0.0)
        simulated_features[feat] = val * (1 + (change_pct / 100.0))
        
    # Predict
    base_df = pd.DataFrame([baseline])
    base_prediction = model.predict(base_df)[0]
    
    input_df = pd.DataFrame([simulated_features])
    prediction = model.predict(input_df)[0]
    
    return {
        "baseline_features": baseline,
        "simulated_features": simulated_features,
        "base_predicted_crimes": {targets[i]: float(base_prediction[i]) for i in range(len(targets))},
        "predicted_crimes": {targets[i]: float(prediction[i]) for i in range(len(targets))}
    }

if __name__ == '__main__':
    train_model()
