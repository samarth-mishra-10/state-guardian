import pandas as pd
import numpy as np
import os
import re

CRIME_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'crime')
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

def normalize_state_name(state: str) -> str:
    if pd.isna(state): return state
    state = str(state).upper().strip()
    state = re.sub(r'\s+', ' ', state) 
    mapping = {
        'ORISSA': 'ODISHA', 'UTTARANCHAL': 'UTTARAKHAND', 'PONDICHERRY': 'PUDUCHERRY',
        'A & N ISLANDS': 'ANDAMAN AND NICOBAR ISLANDS', 'D & N HAVELI': 'DADRA AND NAGAR HAVELI',
        'A&N ISLANDS': 'ANDAMAN AND NICOBAR ISLANDS', 'D&N HAVELI': 'DADRA AND NAGAR HAVELI',
        'DELHI UT': 'DELHI', 'JAMMU & KASHMIR': 'JAMMU AND KASHMIR'
    }
    return mapping.get(state, state)

def load_and_standardize(file_path, area_cols, year_col='Year'):
    if not os.path.exists(file_path): return pd.DataFrame()
    try: df = pd.read_csv(file_path, engine='python', on_bad_lines='skip')
    except Exception: return pd.DataFrame()
        
    for col in area_cols:
        if col in df.columns:
            df.rename(columns={col: 'State'}, inplace=True)
            break
            
    if 'State' in df.columns: df['State'] = df['State'].apply(normalize_state_name)
    
    for y_col in [year_col, 'YEAR', 'year']:
        if y_col in df.columns:
            df.rename(columns={y_col: 'Year'}, inplace=True)
            break
            
    if 'Year' in df.columns: df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
    return df

def build_data_pipeline():
    print("Extracting Enforcement Lever Data...")
    df_police = load_and_standardize(os.path.join(CRIME_DIR, '12_Police_strength_actual_and_sanctioned.csv'), ['Area_Name'])
    if not df_police.empty:
        df_police = df_police[df_police['Sub_Group_Name'].str.contains('Total', na=False, case=False) | df_police['Rank_All_Ranks_Total'].notna()]
        df_police = df_police.groupby(['State', 'Year']).agg({'Rank_All_Ranks_Total': 'sum'}).reset_index().rename(columns={'Rank_All_Ranks_Total': 'Police_Strength'})

    print("Extracting Fiscal Lever Data...")
    df_housing = load_and_standardize(os.path.join(CRIME_DIR, '36_Police_housing.csv'), ['Area_Name'])
    if not df_housing.empty:
        df_housing = df_housing.groupby(['State', 'Year']).agg({'PH_Sanctioned_Strength': 'sum'}).reset_index().rename(columns={'PH_Sanctioned_Strength': 'Fiscal_Budget_Proxy'})

    print("Extracting Judicial Lever Data...")
    df_trials = load_and_standardize(os.path.join(CRIME_DIR, '29_Period_of_trials_by_courts.csv'), ['Area_Name'])
    if not df_trials.empty and 'PT_Over_10_Years' in df_trials.columns:
        df_trials = df_trials.groupby(['State', 'Year']).agg({'PT_Over_10_Years': 'sum'}).reset_index().rename(columns={'PT_Over_10_Years': 'Prolonged_Trials'})

    print("Extracting Socio-Economic Levers...")
    df_edu = load_and_standardize(os.path.join(CRIME_DIR, '18_01_Juveniles_arrested_Education.csv'), ['Area_Name'])
    if not df_edu.empty and 'Education_Total' in df_edu.columns:
        df_edu = df_edu.groupby(['State', 'Year']).agg({'Education_Total': 'sum'}).reset_index().rename(columns={'Education_Total': 'Juveniles_Arrested'})

    df_econ = load_and_standardize(os.path.join(CRIME_DIR, '18_02_Juveniles_arrested_Economic_setup.csv'), ['Area_Name'])
    if not df_econ.empty and 'Low_Income' in df_econ.columns:
        df_econ = df_econ.groupby(['State', 'Year']).agg({'Low_Income': 'sum'}).reset_index().rename(columns={'Low_Income': 'Juveniles_Low_Income'})
    elif not df_econ.empty:
        numeric_cols = df_econ.select_dtypes(include=[np.number]).columns.drop('Year', errors='ignore')
        df_econ = df_econ.groupby(['State', 'Year'])[numeric_cols].sum().sum(axis=1).reset_index(name='Juveniles_Low_Income')

    print("Extracting Recidivism Data...")
    df_recidivism = load_and_standardize(os.path.join(CRIME_DIR, '22_Persons_arrested_under_recidivism.csv'), ['Area_Name'])
    if not df_recidivism.empty:
        past_conv_cols = [c for c in df_recidivism.columns if 'convicted' in str(c).lower() or 'past' in str(c).lower()]
        if past_conv_cols:
            df_recidivism = df_recidivism.groupby(['State', 'Year']).agg({past_conv_cols[0]: 'sum'}).reset_index().rename(columns={past_conv_cols[0]: 'Repeat_Offenders'})
        else:
            numeric_cols = df_recidivism.select_dtypes(include=[np.number]).columns.drop('Year', errors='ignore')
            df_recidivism = df_recidivism.groupby(['State', 'Year'])[numeric_cols].sum().sum(axis=1).reset_index(name='Repeat_Offenders')

    print("Extracting Targets Data (Crimes)...")
    targets = []
    for file_name in [
        '01_District_wise_crimes_committed_IPC_2001_2012.csv',
        '01_District_wise_crimes_committed_IPC_2013.csv',
        '01_District_wise_crimes_committed_IPC_2014.csv'
    ]:
        df_t = load_and_standardize(os.path.join(CRIME_DIR, file_name), ['STATE/UT', 'States/UTs', 'Area_Name'])
        if not df_t.empty:
            col_total = [c for c in df_t.columns if 'Total Cognizable IPC crimes' in c or 'TOTAL IPC CRIMES' in c.upper()]
            col_women = [c for c in df_t.columns if c.strip().upper() == 'RAPE']
            col_prop = [c for c in df_t.columns if c.strip().upper() == 'THEFT']
            
            rename_map = {}
            if col_total: rename_map[col_total[0]] = 'Total_IPC_Crimes'
            if col_women: rename_map[col_women[0]] = 'Crimes_Against_Women'
            if col_prop: rename_map[col_prop[0]] = 'Property_Stolen'
            
            df_t.rename(columns=rename_map, inplace=True)
            if all(col in df_t.columns for col in ['State', 'Year', 'Total_IPC_Crimes', 'Crimes_Against_Women', 'Property_Stolen']):
                df_t = df_t[['State', 'Year', 'Total_IPC_Crimes', 'Crimes_Against_Women', 'Property_Stolen']]
                targets.append(df_t)
            
    df_targets_agg = pd.DataFrame()
    if targets:
        df_targets = pd.concat(targets, ignore_index=True)
        df_targets_agg = df_targets.groupby(['State', 'Year']).sum().reset_index()

    print("Merging DataFrames...")
    dfs = [df_police, df_housing, df_trials, df_edu, df_econ, df_recidivism, df_targets_agg]
    dfs = [d for d in dfs if not d.empty and 'State' in d.columns]
    
    if dfs:
        master = dfs[0]
        for idx in range(1, len(dfs)):
            master = pd.merge(master, dfs[idx], on=['State', 'Year'], how='outer')
            
        print("Performing Imputation & Feature Engineering...")
        master = master.sort_values(by=['State', 'Year'])
        states = master['State']
        
        # Replace deprecated ffill/bfill with ffill() and bfill() methods
        master = master.groupby('State').apply(lambda group: group.ffill().bfill()).reset_index(drop=True)
        
        master['State'] = states
        master.fillna(0, inplace=True)

        out_path = os.path.join(ROOT_DIR, 'backend', 'processed_master.csv')
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        master.to_csv(out_path, index=False)
        print(f"Saved processed_master.csv to {out_path}")

if __name__ == '__main__':
    build_data_pipeline()