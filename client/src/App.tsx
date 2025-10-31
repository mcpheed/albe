import { useEffect, useState } from 'react';
import { connectWS } from './lib/api';

type Sample = {
  ts_ms: number;
  hr_bpm?: number;
  temp_c?: number;
  motion_score?: number;
  ppg?: { ir?: number; red?: number };
};

export default function App() {
  const [status, setStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting');
  const [last, setLast] = useState<Sample | null>(null);

  useEffect(() => {
    const ws = connectWS((d) => setLast(d), setStatus);
    return () => ws && ws.close();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>ALBAE Live</h1>
      <p>Status: <b>{status}</b></p>
      {last ? (
        <div style={{display:'grid', gap:8}}>
          <div>ts: {new Date(last.ts_ms).toLocaleTimeString()}</div>
          <div>HR: {last.hr_bpm?.toFixed?.(1) ?? '—'} bpm</div>
          <div>Temp: {last.temp_c ?? '—'} °C</div>
          <div>Motion: {last.motion_score ?? '—'}</div>
          <div>IR: {last.ppg?.ir ?? '—'} | RED: {last.ppg?.red ?? '—'}</div>
        </div>
      ) : <p>No data yet…</p>}
    </div>
  );
}
