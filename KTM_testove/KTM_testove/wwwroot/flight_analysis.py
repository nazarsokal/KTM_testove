import pandas as pd
import numpy as np
from pymavlink import mavutil
import sys
import os
import json

# 1. Налаштування вхідного файлу
if len(sys.argv) > 1:
    # Отримуємо шлях від C#
    filename = sys.argv[1]
else:
    filename = '00000001.BIN'

# 2. Очищення шляху та перевірка існування
# Видаляємо можливі префікси, які могли залишитися від попередніх спроб
clean_path = filename.replace('file:///', '').replace('file:', '')

if not os.path.exists(clean_path):
    print(json.dumps({"error": f"Файл не знайдено за шляхом: {clean_path}"}))
    sys.exit(1)

# 3. Функції розрахунків
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

# --- ВИПРАВЛЕННЯ: ВІДКРИТТЯ ЛОГУ ---
try:
    # Передаємо звичайний рядок (шлях) до pymavlink
    # Бібліотека сама відкриє файл у потрібному режимі
    mlog = mavutil.mavlink_connection(clean_path)
except Exception as e:
    print(json.dumps({"error": f"Не вдалося відкрити потік файлу: {str(e)}"}))
    sys.exit(1)

imu_data = []
gps_data = []

# 4. Збір даних з логу
while True:
    # Шукаємо повідомлення типів IMU (акселерометр) та GPS
    msg = mlog.recv_match(type=['IMU', 'GPS'], blocking=False)
    if msg is None:
        break

    d = msg.to_dict()
    msg_type = msg.get_type()

    if msg_type == 'IMU':
        if all(k in d for k in ['TimeUS', 'AccX', 'AccY', 'AccZ']):
            imu_data.append({
                'TimeUS': d['TimeUS'],
                'AccX': d['AccX'],
                'AccY': d['AccY'],
                'AccZ': d['AccZ']
            })

    elif msg_type == 'GPS':
        # Перевіряємо наявність координат і відсікаємо нульові точки (помилки фіксації)
        if d.get('Lat') is not None and d.get('Lat') != 0:
            gps_data.append({
                'TimeUS': d['TimeUS'],
                'Lat': d['Lat'],
                'Lng': d['Lng'],
                'Alt': d['Alt'],
                'Spd': d.get('Spd', 0),
                'VZ': d.get('VZ', 0)
            })

# 5. Перевірка наявності даних
if not gps_data or not imu_data:
    print(json.dumps({"error": "У файлі недостатньо даних IMU або GPS для аналізу."}))
    sys.exit(1)

# 6. Обробка даних через Pandas
df_gps = pd.DataFrame(gps_data)
df_imu = pd.DataFrame(imu_data)

# Розрахунок модуля прискорення та очищення від гравітаційного шуму (простий bias)
accel_mag = np.sqrt(df_imu['AccX']**2 + df_imu['AccY']**2 + df_imu['AccZ']**2)
bias = accel_mag.head(50).mean() if len(accel_mag) > 50 else accel_mag.mean()
accel_net = accel_mag - bias
df_imu['integrated_velocity'] = np.abs(trapezoidal_integration(df_imu['TimeUS'], accel_net))

# Розрахунок загальної дистанції
total_dist_haversine = 0.0
for i in range(1, len(df_gps)):
    dh = haversine(
        df_gps['Lat'].iloc[i-1],
        df_gps['Lng'].iloc[i-1],
        df_gps['Lat'].iloc[i],
        df_gps['Lng'].iloc[i]
    )
    if dh < 1000: # Фільтр аномальних стрибків GPS
        total_dist_haversine += dh

# Визначення точки відліку (старт)
start_row = df_gps.iloc[0]
ref_lat, ref_lon, ref_alt = start_row['Lat'], start_row['Lng'], start_row['Alt']
start_t = start_row['TimeUS']

# Формування траєкторії польоту
trajectory = []
for i in range(len(df_gps)):
    curr = df_gps.iloc[i]
    t = round((curr['TimeUS'] - start_t) / 1e6, 2)

    # Перерахунок у метри відносно старту
    x = haversine(ref_lat, ref_lon, ref_lat, curr['Lng']) * np.sign(curr['Lng'] - ref_lon)
    y = haversine(ref_lat, ref_lon, curr['Lat'], ref_lon) * np.sign(curr['Lat'] - ref_lat)
    z = curr['Alt'] - ref_alt

    # Пошук найближчого значення швидкості з IMU (інтегрованої)
    imu_idx = np.abs(df_imu['TimeUS'] - curr['TimeUS']).argmin()
    vel = df_imu['integrated_velocity'].iloc[imu_idx]

    trajectory.append({
        "t": t,
        "pos": [round(float(x), 2), round(float(y), 2), round(float(z), 2)],
        "vel": round(float(vel), 2)
    })

# 7. Формування фінального результату
output = {
    "metadata": {
        "mission_id": os.path.basename(clean_path),
        "reference_wgs84": {
            "lat": float(ref_lat), "lon": float(ref_lon), "alt": float(ref_alt)
        }
    },
    "summary": {
        "max_vertical_speed": round(float(df_gps['VZ'].abs().max()), 2),
        "max_horizontal_speed": round(float(df_gps['Spd'].max()), 2),
        "max_acceleration": round(float(accel_mag.max()), 2),
        "max_altitude": round(float(df_gps['Alt'].max() - ref_alt), 2),
        "total_distance": round(float(total_dist_haversine), 2),
        "duration_seconds": round(float(trajectory[-1]['t']), 2)
    },
    "trajectory": trajectory
}

# 8. Вивід результату
print(json.dumps(output))