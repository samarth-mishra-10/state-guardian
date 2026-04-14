import pandas as pd
import numpy as np
import os
import re

# Base paths
CRIME_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'crime')
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

def normalize_state_name(state: str) -> str:
    """Normalize State/UT names to a standard format."""
    if pd.isna(state):
        return state
    # General cleanup
    state = str(state).upper().strip()
    state = re.sub(r'\s+', ' ', state) # remove multiple spaces
    
    mapping = {
        'ORISSA': 'ODISHA',
        'UTTARANCHAL': 'UTTARAKHAND',
        'PONDICHERRY': 'PUDUCHERRY',
        'A & N ISLANDS': 'ANDAMAN AND NICOBAR ISLANDS',
        'D & N HAVELI': 'DADRA AND NAGAR HAVELI',
        'A&N ISLANDS': 'ANDAMAN AND NICOBAR ISLANDS',
        'D&N HAVELI': 'DADRA AND NAGAR HAVELI',
        'DELHI UT': 'DELHI',
        'JAMMU & KASHMIR': 'JAMMU AND KASHMIR'
    }
    return mapping.get(state, state)

def load_and_standardize(file_path, area_cols, year_col='Year'):
    """Load a CSV and standardize basic columns."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return pd.DataFrame()
    
    try:
        df = pd.read_csv(file_path, engine='python', on_bad_lines='skip')
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return pd.DataFrame()
        
    # Standardize area column to 'State'
    for col in area_cols:
        if col in df.columns:
            df.rename(columns={col: 'State'}, inplace=True)
            break
            
    if 'State' in df.columns:
        df['State'] = df['State'].apply(normalize_state_name)
    
    for y_col in [year_col, 'YEAR', 'year']:
        if y_col in df.columns:
            df.rename(columns={y_col: 'Year'}, inplace=True)
            break
            
    if 'Year' in df.columns:
        # Convert year to numeric
        try:
            df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
        except:
            pass
            
    return df

def build_data_pipeline():
    print("Extracting Enforcement Lever Data...")
    df_police = load_and_standardize(
        os.path.join(CRIME_DIR, '12_Police_strength_actual_and_sanctioned.csv'), 
        ['Area_Name']
    )
    if not df_police.empty:
        df_police = df_police[df_police['Sub_Group_Name'].str.contains('Total', na=False, case=False) | df_police['Rank_All_Ranks_Total'].notna()]
        # Aggregate to State/Year level
        df_police = df_police.groupby(['State', 'Year']).agg({
            'Rank_All_Ranks_Total': 'sum' # we can assume this acts as a proxy for strength
        }).reset_index().rename(columns={'Rank_All_Ranks_Total': 'Police_Strength'})

    print("Extracting Fiscal Lever Data...")
    df_housing = load_and_standardize(
        os.path.join(ROOT_DIR, '36_Police_housing.csv'),
        ['Area_Name']
    )
    if not df_housing.empty:
        df_housing = df_housing.groupby(['State', 'Year']).agg({
            'PH_Sanctioned_Strength': 'sum'
        }).reset_index().rename(columns={'PH_Sanctioned_Strength': 'Fiscal_Budget_Proxy'})

    print("Extracting Social Lever Data...")
    df_edu = load_and_standardize(
        os.path.join(CRIME_DIR, '18_01_Juveniles_arrested_Education.csv'),
        ['Area_Name']
    )
    if not df_edu.empty:
        df_edu = df_edu.groupby(['State', 'Year']).agg({
            'Education_Total': 'sum'
        }).reset_index().rename(columns={'Education_Total': 'Juveniles_Arrested'})

    print("Extracting Judicial Lever Data...")
    df_trials = load_and_standardize(
        os.path.join(ROOT_DIR, '29_Period_of_trials_by_courts.csv'),
        ['Area_Name']
    )
    if not df_trials.empty:
        # Number of trials over 10 years as a simple metric
        if 'PT_Over_10_Years' in df_trials.columns:
            df_trials = df_trials.groupby(['State', 'Year']).agg({
                'PT_Over_10_Years': 'sum'
            }).reset_index().rename(columns={'PT_Over_10_Years': 'Prolonged_Trials'})
        else:
            df_trials = pd.DataFrame(columns=['State', 'Year', 'Prolonged_Trials'])

    print("Extracting Targets Data (Crimes)...")
    # Combining the IPC crimes (2001-2012, 2013, 2014) target variables
    targets = []
    for file_name in [
        '01_District_wise_crimes_committed_IPC_2001_2012.csv',
        '01_District_wise_crimes_committed_IPC_2013.csv',
        '01_District_wise_crimes_committed_IPC_2014.csv'
    ]:
        df_t = load_and_standardize(os.path.join(CRIME_DIR, file_name), ['STATE/UT', 'States/UTs', 'Area_Name'])
        if not df_t.empty:
            targets.append(df_t)
            
    if targets:
        df_targets = pd.concat(targets, ignore_index=True)
        # We need Total IPC, Crimes Against Women, Property Stolen
        # 1. Total IPC
        col_total = [c for c in df_targets.columns if 'Total Cognizable IPC crimes' in c or 'TOTAL IPC CRIMES' in c.upper()]
        total_col = col_total[0] if col_total else None
        
        # 2. Crimes Against Women -> we use Rape as proxy or if there's a aggregate field
        col_women = [c for c in df_targets.columns if 'Rape' in c or 'Rape_Total' in c]
        women_col = col_women[0] if col_women else None
        
        # 3. Property (Theft, Auto Theft)
        col_prop = [c for c in df_targets.columns if 'Theft' in c or 'Auto Theft' in c]
        prop_col = col_prop[0] if col_prop else None

        agg_dict = {}
        if total_col: agg_dict[total_col] = 'sum'
        if women_col: agg_dict[women_col] = 'sum'
        if prop_col: agg_dict[prop_col] = 'sum'
        
        df_targets_agg = df_targets.groupby(['State', 'Year']).agg(agg_dict).reset_index()
        # Rename them properly
        rename_map = {}
        if total_col: rename_map[total_col] = 'Total_IPC_Crimes'
        if women_col: rename_map[women_col] = 'Crimes_Against_Women'
        if prop_col: rename_map[prop_col] = 'Property_Stolen'
        df_targets_agg.rename(columns=rename_map, inplace=True)
    else:
        df_targets_agg = pd.DataFrame(columns=['State', 'Year', 'Total_IPC_Crimes', 'Crimes_Against_Women', 'Property_Stolen'])

    print("Merging DataFrames...")
    # Initialize master
    master = pd.DataFrame()
    dfs = [df_police, df_housing, df_edu, df_trials, df_targets_agg]
    dfs = [d for d in dfs if not d.empty]
    
    if dfs:
        master = dfs[0]
        for idx in range(1, len(dfs)):
            master = pd.merge(master, dfs[idx], on=['State', 'Year'], how='outer')
            
    # Forward-fill / state-median imputation for missing data
    print("Performing Imputation...")
    # First, sort to ensure chronologically filling
    if not master.empty and 'Year' in master.columns:
        master = master.sort_values(by=['State', 'Year'])
        states = master['State']
        master = master.groupby('State').ffill().bfill() # ffill then bfill for remaining
        master['State'] = states
        
        # Any totally empty column per state, fill with global median
        for col in master.columns:
            if col not in ['State', 'Year']:
                if master[col].dtype == object:
                    # Attempt to convert to numeric if it happens to be string
                    master[col] = pd.to_numeric(master[col], errors='coerce')
                master[col] = master[col].fillna(master[col].median())
                master[col] = master[col].fillna(0) # Ultimate fallback

        out_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
        master.to_csv(out_path, index=False)
        print(f"Saved processed_master.csv to {out_path}")
    else:
        print("Master DataFrame is empty, nothing to save.")

if __name__ == '__main__':
    build_data_pipeline()
