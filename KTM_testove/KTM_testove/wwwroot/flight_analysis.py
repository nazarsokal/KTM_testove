import pandas as pd
import numpy as np
from pymavlink import mavutil
import sys
import os
import json

if len(sys.argv) > 1:
    filename = sys.argv[1]
else:
    filename = '00000019.BIN'

clean_path = filename.replace('file:///', '').replace('file:', '')

search_candidates = [
    clean_path,                                      
    os.path.join('logs', clean_path),       
    clean_path + ".log",                      
    os.path.join('logs', clean_path + ".log") 
]

actual_path = None
for candidate in search_candidates:
    if os.path.exists(candidate):
        actual_path = candidate
        break

if not actual_path:
    print(json.dumps({"error": f"Файл не знайдено. Перевірено локально та в /logs: {clean_path}"}))
    sys.exit(1)

clean_path = actual_path 

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000 
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp, dl = np.radians(lat2-lat1), np.radians(lon2-lon1)
    a = np.sin(dp/2)**2 + np.cos(p1)*np.cos(p2)*np.sin(dl/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

def trapezoidal_integration(t_us, accel, initial_v=0.0, ref_v=None, alpha=0.98):
    v = [initial_v]
    t_sec = t_us / 1e6
    accel_clean = accel.fillna(0).values
    t_values = t_sec.values
    
    use_filter = ref_v is not None
    if use_filter:
        ref_v_vals = ref_v.ffill().bfill().values

    for i in range(1, len(t_values)):
        dt = t_values[i] - t_values[i-1]
        if 0 < dt < 1.0:
            dv = 0.5 * (accel_clean[i] + accel_clean[i-1]) * dt
            raw_v = v[-1] + dv
            if use_filter:
                corrected_v = (alpha * raw_v) + ((1.0 - alpha) * ref_v_vals[i])
                v.append(corrected_v)
            else:
                v.append(raw_v)
        else:
            v.append(v[-1])
    return np.array(v)

try:
    mlog = mavutil.mavlink_connection(clean_path)
except Exception as e:
    print(json.dumps({"error": f"Не вдалося відкрити потік файлу: {str(e)}"}))
    sys.exit(1)

imu_list, gps_list, att_list, sim_list = [], [], [], []
vehicle_type = "Unknown"

while True:
    msg = mlog.recv_match(type=['IMU', 'GPS', 'ATT', 'SIM', 'MSG'], blocking=False)
    if msg is None: break
    d = msg.to_dict()
    m_type = msg.get_type()
    
    if m_type == 'MSG':
        text = d.get('Message', '')
        if 'ArduCopter' in text: vehicle_type = 'Copter'
        elif 'ArduPlane' in text: vehicle_type = 'Plane'
        elif 'ArduRover' in text: vehicle_type = 'Rover'
        elif 'ArduSub' in text: vehicle_type = 'Sub'
        elif 'TheRocket' in text: vehicle_type = 'Rocket' 
    elif m_type == 'IMU':
        imu_list.append(d)
    elif m_type == 'GPS' and d.get('Lat', 0) != 0:
        if 'Lon' in d: d['Lng'] = d['Lon']
        d['Alt'] = d.get('Alt', d.get('AltMSL', 0))
        gps_list.append(d)
    elif m_type == 'ATT':
        att_list.append({
            'TimeUS': d.get('TimeUS'),
            'Roll': d.get('Roll', 0.0),
            'Pitch': d.get('Pitch', 0.0),
            'Yaw': d.get('Yaw', 0.0)
        })
    elif m_type == 'SIM':
        sim_list.append(d)

df_imu = pd.DataFrame(imu_list).sort_values('TimeUS') if imu_list else pd.DataFrame()
df_gps = pd.DataFrame(gps_list).sort_values('TimeUS') if gps_list else pd.DataFrame()
df_att = pd.DataFrame(att_list).sort_values('TimeUS') if att_list else pd.DataFrame()
df_sim = pd.DataFrame(sim_list).sort_values('TimeUS') if sim_list else pd.DataFrame()

if df_gps.empty or df_imu.empty:
    print(json.dumps({"error": "У файлі недостатньо даних IMU або GPS для аналізу."}))
    sys.exit(1)

if 'Yaw' in df_gps.columns:
    df_gps = df_gps.rename(columns={'Yaw': 'GPS_Yaw'})

scale = 1e7 if abs(df_gps['Lat'].iloc[0]) > 1000 else 1.0
df_gps['Lat'] /= scale
df_gps['Lng'] /= scale
df_gps['Alt'] = df_gps['Alt'].ffill().bfill()

jumps = [i for i in range(1, len(df_gps)) if haversine(df_gps.iloc[i-1]['Lat'], df_gps.iloc[i-1]['Lng'], df_gps.iloc[i]['Lat'], df_gps.iloc[i]['Lng']) > 500]
if jumps:
    valid_time = df_gps.iloc[jumps[-1]]['TimeUS']
    df_gps = df_gps[df_gps['TimeUS'] >= valid_time].reset_index(drop=True)
    if not df_imu.empty: df_imu = df_imu[df_imu['TimeUS'] >= valid_time].reset_index(drop=True)
    if not df_att.empty: df_att = df_att[df_att['TimeUS'] >= valid_time].reset_index(drop=True)

v_start_horizontal = df_gps.iloc[0]['Spd'] 
v_start_vertical = df_gps.iloc[0]['VZ']

if not df_imu.empty and not df_att.empty:
    df_imu_comp = pd.merge_asof(df_imu, df_att, on='TimeUS', direction='nearest')
    df_imu_comp = pd.merge_asof(df_imu_comp, df_gps[['TimeUS', 'Spd', 'VZ']], on='TimeUS', direction='nearest')
    
    df_imu['AccX_clean'] = df_imu['AccX'].rolling(10, min_periods=1).mean()
    df_imu['AccY_clean'] = df_imu['AccY'].rolling(10, min_periods=1).mean()
    
    r, p = np.radians(df_imu_comp['Roll']), np.radians(df_imu_comp['Pitch'])
    acc_z_earth = (df_imu_comp['AccX'] * np.sin(p) - 
                   df_imu_comp['AccY'] * np.sin(r) * np.cos(p) - 
                   df_imu_comp['AccZ'] * np.cos(r) * np.cos(p)) - 9.80665
    df_imu['AccZ_clean'] = acc_z_earth.fillna(0).rolling(10, min_periods=1).mean()

    vel_x = trapezoidal_integration(df_imu['TimeUS'], df_imu['AccX_clean'], initial_v=v_start_horizontal, ref_v=df_imu_comp['Spd'])
    vel_y = trapezoidal_integration(df_imu['TimeUS'], df_imu['AccY_clean'], initial_v=0.0, ref_v=(df_imu_comp['Spd']*0))
    vel_z = trapezoidal_integration(df_imu['TimeUS'], df_imu['AccZ_clean'], initial_v=v_start_vertical, ref_v=df_imu_comp['VZ'])

    df_imu['vel_raw'] = np.sqrt(vel_x**2 + vel_y**2 + vel_z**2)
    df_imu['acc_3d_mag'] = np.sqrt(df_imu['AccX']**2 + df_imu['AccY']**2 + df_imu['AccZ']**2)

df_flight = pd.merge_asof(df_gps, df_att, on='TimeUS', direction='nearest')

sim_alt = df_sim['Alt'].iloc[0] if not df_sim.empty else None
gps_low_spd = df_gps[df_gps['Spd'] < 1.0]['Alt']
ref_alt = sim_alt if sim_alt is not None else (gps_low_spd.median() if not gps_low_spd.empty else df_gps['Alt'].iloc[0])

ref_lat, ref_lon = df_gps.iloc[0]['Lat'], df_gps.iloc[0]['Lng']
max_alt_idx_raw = df_gps['Alt'].idxmax()
start_time = df_gps['TimeUS'].iloc[0]

trajectory, total_dist = [], 0.0
last_pos, is_landed = (0.0, 0.0, 0.0), False

landing_event = None
takeoff_event = None

for i in range(len(df_flight)):
    row = df_flight.iloc[i]
    t_rel = round((row['TimeUS'] - start_time) / 1e6, 2)
    cur_z = row['Alt'] - ref_alt
    h_spd, v_spd = row.get('Spd', 0), row.get('VZ', 0)

    if not is_landed:
        impact = i > max_alt_idx_raw and cur_z < -1.0
        soft_landing = i > max_alt_idx_raw and abs(v_spd) < 0.8 and h_spd < 0.8
        if impact or soft_landing: 
            is_landed = True
            landing_event = {"name": "Landing", "t": t_rel, "pos": [round(float(last_pos[0]), 2), round(float(last_pos[1]), 2), round(float(last_pos[2]), 2)]}

    if not is_landed:
        x = haversine(ref_lat, ref_lon, ref_lat, row['Lng']) * np.sign(row['Lng'] - ref_lon)
        y = haversine(ref_lat, ref_lon, row['Lat'], ref_lon) * np.sign(row['Lat'] - ref_lat)
        z = cur_z
        
        if takeoff_event is None and (h_spd > 1.0 or abs(v_spd) > 0.5):
            takeoff_event = {"name": "Takeoff", "t": t_rel, "pos": [round(float(x), 2), round(float(y), 2), round(float(z), 2)]}

        if i > 0:
            prev_row = df_flight.iloc[i-1]
            d2d = haversine(prev_row['Lat'], prev_row['Lng'], row['Lat'], row['Lng'])
            total_dist += np.sqrt(d2d**2 + (row['Alt'] - prev_row['Alt'])**2)
        
        idx_imu = np.abs(df_imu['TimeUS'] - row['TimeUS']).argmin() if not df_imu.empty else 0

        if takeoff_event is None:
            v_val = 0.0
        else:
            v_val = float(df_imu['vel_raw'].iloc[idx_imu]) if not df_imu.empty else np.sqrt(h_spd**2 + v_spd**2)
            
        last_pos = (x, y, z)
    else:
        x, y, z = last_pos
        v_val = 0.0

    trajectory.append({
        "t": t_rel,
        "pos": [round(float(x), 2), round(float(y), 2), round(float(z), 2)],
        "vel": round(float(abs(v_val)), 2),
        "distance": round(float(total_dist), 2), 
        "att": [
            round(float(np.radians(row.get('Roll', 0))), 4), 
            round(float(np.radians(row.get('Pitch', 0))), 4), 
            round(float(np.radians(row.get('Yaw', 0))), 4)
        ]
    })

events = []
if takeoff_event: events.append(takeoff_event)

def find_point(raw_df, idx):
    rel_t = round((raw_df.iloc[idx]['TimeUS'] - start_time) / 1e6, 2)
    for p in trajectory:
        if abs(p['t'] - rel_t) < 0.1: return p
    return trajectory[0]

events.append({"name": "Max Altitude", "t": find_point(df_gps, df_gps['Alt'].idxmax())['t'], "pos": find_point(df_gps, df_gps['Alt'].idxmax())['pos']})
events.append({"name": "Max Speed", "t": find_point(df_gps, df_gps['Spd'].idxmax())['t'], "pos": find_point(df_gps, df_gps['Spd'].idxmax())['pos']})

if not df_imu.empty:
    max_acc_point = find_point(df_imu, df_imu['acc_3d_mag'].idxmax())
    events.append({"name": "Max Acceleration", "t": max_acc_point['t'], "pos": max_acc_point['pos']})

if landing_event: events.append(landing_event)

output = {
    "metadata": {
        "mission_id": os.path.basename(clean_path),
        "vehicle_type": vehicle_type,
        "reference_wgs84": {"lat": float(ref_lat), "lon": float(ref_lon), "alt": round(float(ref_alt), 2)}
    },
    "summary": {
        "max_vertical_speed": round(float(df_gps['VZ'].abs().max()), 2),
        "max_horizontal_speed": round(float(df_gps['Spd'].max()), 2),
        "max_acceleration": round(float(df_imu['acc_3d_mag'].max()), 2) if not df_imu.empty else 0.0,
        "max_altitude": round(float((df_gps['Alt'] - ref_alt).max()), 2),
        "total_distance": round(float(total_dist), 2),
        "duration_seconds": float(trajectory[-1]['t'])
    },
    "events": events,
    "trajectory": trajectory
}

print(json.dumps(output))