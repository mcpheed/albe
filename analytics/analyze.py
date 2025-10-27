import sys, json, math
import pandas as pd

def clamp(v, lo, hi): 
    return max(lo, min(hi, v))

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error":"no_input"}))
        sys.exit(1)

    data = json.loads(raw)
    samples = data.get("samples", [])
    if not samples:
        print(json.dumps({"error":"no_samples"}))
        sys.exit(1)

    df = pd.DataFrame(samples)
    for col in ["timestamp","hr","ax","ay","az"]:
        if col not in df.columns:
            print(json.dumps({"error":f"missing_{col}"}))
            sys.exit(1)

    hr_avg = float(df["hr"].mean())

    ibi_ms = 60000.0 / df["hr"].clip(lower=1.0)
    hrv_sdnn_ms = float(ibi_ms.std(ddof=0))

    mag = (df["ax"]**2 + df["ay"]**2 + df["az"]**2) ** 0.5
    motion_rms = float((mag.pow(2).mean()) ** 0.5)

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

    print(json.dumps({ "summary": summary }))

if __name__ == "__main__":
    main()
