import pandas as pd
import numpy as np
import os
import joblib
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

def train_model():
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Run data_pipeline.py first.")
        return

    df = pd.read_csv(data_path)
    
    # Feature list matching our exact causal constraint order
    features = [
        'Year',                
        'Police_Strength', 
        'Fiscal_Budget_Proxy', 
        'Juveniles_Arrested',
        'Juveniles_Low_Income', 
        'Repeat_Offenders', 
        'Prolonged_Trials'
    ]
    targets = ['Total_IPC_Crimes', 'Crimes_Against_Women', 'Property_Stolen']
    
    missing_cols = [c for c in features + targets if c not in df.columns]
    for c in missing_cols: df[c] = 0 
            
    # TIME-SERIES SPLIT
    train_df = df[df['Year'] <= 2012]
    test_df = df[df['Year'] > 2012]
    
    X_train, y_train = train_df[features], train_df[targets]
    X_test, y_test = test_df[features], test_df[targets]

    # Causal constraints: 1 (Positive), -1 (Negative), 0 (Unconstrained)
    monotone_constraints = (0, -1, -1, 1, 1, 1, 1)

    xgb_estimator = XGBRegressor(
        n_estimators=150, 
        learning_rate=0.05, 
        max_depth=5,
        monotone_constraints=monotone_constraints,
        random_state=42
    )
    
    model = MultiOutputRegressor(xgb_estimator)
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', model)
    ])
    
    print("Training Causal-Constrained XGBoost Model...")
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    score = r2_score(y_test, y_pred)
    print(f"Model trained. Time-Series Validation R^2 Score: {score:.4f}")
    
    model_path = os.path.join(ROOT_DIR, 'backend', 'model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    importances = np.mean([
        est.feature_importances_ for est in pipeline.named_steps['model'].estimators_
    ], axis=0)
    
    if np.sum(importances) > 0:
        importances = importances / np.sum(importances)
        
    importance_dict = dict(zip(features, importances))
    importance_path = os.path.join(ROOT_DIR, 'backend', 'feature_importances.json')
    pd.Series(importance_dict).to_json(importance_path)

def simulate_policy(state: str, lever_changes: dict, target_year: int = 2014):
    data_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
    model_path = os.path.join(ROOT_DIR, 'backend', 'model.pkl')
    
    if not os.path.exists(data_path) or not os.path.exists(model_path):
        return {"error": "Data or model not found"}
        
    df = pd.read_csv(data_path)
    model = joblib.load(model_path)
    
    features = [
        'Year', 'Police_Strength', 'Fiscal_Budget_Proxy', 'Juveniles_Arrested',
        'Juveniles_Low_Income', 'Repeat_Offenders', 'Prolonged_Trials'
    ]
    targets = ['Total_IPC_Crimes', 'Crimes_Against_Women', 'Property_Stolen']
    
    state_df = df[(df['State'] == state) & (df['Year'] == df['Year'].max())]
    if state_df.empty: baseline = df[features].mean().to_dict()
    else: baseline = state_df[features].iloc[0].to_dict()
        
    simulated_features = baseline.copy()
    
    # Apply Time Projection
    simulated_features['Year'] = target_year
    
    # Apply Policy Levers
    for feat in features:
        if feat in lever_changes and feat != 'Year':
            change_pct = lever_changes.get(feat, 0.0)
            simulated_features[feat] = baseline[feat] * (1 + (change_pct / 100.0))
            
    base_df = pd.DataFrame([baseline])
    input_df = pd.DataFrame([simulated_features])
    
    base_prediction = model.predict(base_df)[0]
    prediction = model.predict(input_df)[0]
    
    return {
        "baseline_features": baseline,
        "simulated_features": simulated_features,
        "base_predicted_crimes": {targets[i]: float(base_prediction[i]) for i in range(len(targets))},
        "predicted_crimes": {targets[i]: float(prediction[i]) for i in range(len(targets))}
    }

if __name__ == '__main__':
    train_model()