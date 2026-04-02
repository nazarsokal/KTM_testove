import pandas as pd
import numpy as np
from pymavlink import mavutil
import sys
import os
import json

LOGS_DIR = 'logs'

if len(sys.argv) > 1:
    filename = sys.argv[1]
else:
    filename = '00000001.BIN'

flight_data = os.path.join(LOGS_DIR, filename)

if not os.path.exists(flight_data):
    print(f"Error: {flight_data} not found.")
    sys.exit(1)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp, dl = np.radians(lat2-lat1), np.radians(lon2-lon1)
    a = np.sin(dp/2)**2 + np.cos(p1)*np.cos(p2)*np.sin(dl/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

def trapezoidal_integration(t_us, accel):
    v = [0.0]
    for i in range(1, len(t_us)):
        dt = (t_us.iloc[i] - t_us.iloc[i-1]) / 1e6
        if 0 < dt < 1.0:
            dv = 0.5 * (accel.iloc[i] + accel.iloc[i-1]) * dt
            v.append(v[-1] + dv)
        else:
            v.append(v[-1])
    return np.array(v)

mlog = mavutil.mavlink_connection(flight_data)

imu_data = []
gps_data = []

print(f"Парсинг {filename}...")

while True:
    msg = mlog.recv_match(type=['IMU', 'GPS'], blocking=False)
    if msg is None: 
        break 
    
    d = msg.to_dict()

    if msg.get_type() == 'IMU':
        imu_data.append({
            'TimeUS': d['TimeUS'], 
            'AccX': d['AccX'], 
            'AccY': d['AccY'], 
            'AccZ': d['AccZ']
        })

    elif msg.get_type() == 'GPS' and d.get('Lat', 0) != 0:
        gps_data.append({
            'TimeUS': d['TimeUS'], 
            'Lat': d['Lat'], 
            'Lng': d['Lng'], 
            'Alt': d['Alt'], 
            'Spd': d.get('Spd', 0), 
            'VZ': d.get('VZ', 0)
        })

if not gps_data or not imu_data:
    print("Error: Недостатньо даних (GPS або IMU) у файлі.")
    sys.exit(1)

df_gps = pd.DataFrame(gps_data)
df_imu = pd.DataFrame(imu_data)

accel_mag = np.sqrt(df_imu['AccX']**2 + df_imu['AccY']**2 + df_imu['AccZ']**2)
bias = accel_mag.head(50).mean() 
accel_net = accel_mag - bias
df_imu['integrated_velocity'] = np.abs(trapezoidal_integration(df_imu['TimeUS'], accel_net))

total_dist_haversine = 0.0
for i in range(1, len(df_gps)):
    dh = haversine(
        df_gps['Lat'].iloc[i-1], 
        df_gps['Lng'].iloc[i-1], 
        df_gps['Lat'].iloc[i], 
        df_gps['Lng'].iloc[i]
    )
    if dh < 1000:
        total_dist_haversine += dh

start_row = df_gps.iloc[0]
ref_lat = start_row['Lat']
ref_lon = start_row['Lng']
ref_alt = start_row['Alt']
start_t = start_row['TimeUS']

trajectory = []
for i in range(len(df_gps)):
    curr = df_gps.iloc[i]
    t = round((curr['TimeUS'] - start_t) / 1e6, 2)
    
    x = haversine(ref_lat, ref_lon, ref_lat, curr['Lng']) * np.sign(curr['Lng'] - ref_lon)
    y = haversine(ref_lat, ref_lon, curr['Lat'], ref_lon) * np.sign(curr['Lat'] - ref_lat)
    z = curr['Alt'] - ref_alt
    
    imu_idx = np.abs(df_imu['TimeUS'] - curr['TimeUS']).argmin()
    vel = df_imu['integrated_velocity'].iloc[imu_idx]

    trajectory.append({
        "t": t,
        "pos": [
            round(x, 2), 
            round(y, 2), 
            round(z, 2)
        ],
        "vel": round(vel, 2) 
    })

output = {
    "metadata": {
        "mission_id": filename,
        "reference_wgs84": {
            "lat": ref_lat,
            "lon": ref_lon,
            "alt": ref_alt
        }
    },
    "summary": {
        "max_vertical_speed": round(df_gps['VZ'].abs().max(), 2),
        "max_horizontal_speed": round(df_gps['Spd'].max(), 2),
        "max_acceleration": round(accel_mag.max(), 2),
        "max_altitude": round(df_gps['Alt'].max() - ref_alt, 2),
        "total_distance": round(total_dist_haversine, 2),
        "duration_seconds": round(trajectory[-1]['t'], 2)
    },
    "trajectory": trajectory
}

output_filename = 'flight_analysis.json'
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=4)
    
print(f"Success: {output_filename} створено успішно.")