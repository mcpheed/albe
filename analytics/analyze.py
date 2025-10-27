#!/usr/bin/env python3
import sys, json, math, statistics

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error":"no_input"}))
        sys.exit(1)

    try:
        data = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error":"bad_json","detail":str(e)}))
        sys.exit(1)

    samples = data.get("samples", [])
    if not isinstance(samples, list) or not samples:
        print(json.dumps({"error":"no_samples"}))
        sys.exit(1)

    # Ensure required fields exist and are numeric
    cleaned = []
    for s in samples:
        try:
            ts = float(s["timestamp"])
            hr = float(s["hr"])
            ax = float(s["ax"]); ay = float(s["ay"]); az = float(s["az"])
            cleaned.append((ts, hr, ax, ay, az))
        except Exception:
            # skip bad rows
            continue

    if not cleaned:
        print(json.dumps({"error":"no_valid_samples"}))
        sys.exit(1)

    n = len(cleaned)
    hrs = [x[1] for x in cleaned]

    # HR average
    hr_avg = sum(hrs) / n

    # Naive HRV proxy: SDNN over IBI derived from HR (ms)
    ibis = []
    for hr in hrs:
        if hr > 0.1:
            ibis.append(60000.0 / hr)
    if len(ibis) >= 2:
        hrv_sdnn_ms = statistics.pstdev(ibis)
    else:
        hrv_sdnn_ms = 0.0

    # Motion RMS from accel magnitude
    mags2 = []
    for _, _, ax, ay, az in cleaned:
        mags2.append(ax*ax + ay*ay + az*az)
    motion_rms = math.sqrt(sum(mags2) / len(mags2))

    # Toy sleep score (0–100)
    hr_norm = clamp((hr_avg - 40.0) / (90.0 - 40.0), 0.0, 1.0)
    hrv_norm = clamp((hrv_sdnn_ms - 20.0) / (120.0 - 20.0), 0.0, 1.0)
    motion_norm = clamp((motion_rms - 0.05) / (0.5 - 0.05), 0.0, 1.0)
    score = (0.40 * (1.0 - hr_norm)) + (0.40 * hrv_norm) + (0.20 * (1.0 - motion_norm))
    sleep_score = int(round(100.0 * clamp(score, 0.0, 1.0)))

    summary = {
        "hr_avg": round(hr_avg, 2),
        "hrv_sdnn_ms": round(hrv_sdnn_ms, 2),
        "motion_rms": round(motion_rms, 4),
        "sleep_score": sleep_score
    }

    # Always print JSON to STDOUT
    print(json.dumps({"summary": summary}))

if __name__ == "__main__":
    main()

