import { useState } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const API = 'http://localhost:4000';

export default function App() {
  const [sessionId, setSessionId] = useState('');
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const pushLog = (m) => setLog(x => [new Date().toLocaleTimeString() + ' ' + m, ...x].slice(0, 6));

  const seed = async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/api/demo/seed`);
      setSessionId(data.sessionId);
      setSummary(null);
      setSeries([]);
      pushLog(`Seeded session ${data.sessionId} with ${data.inserted} samples`);
    } catch (e) {
      alert('Seed failed');
    } finally { setBusy(false); }
  };

  const analyze = async () => {
    if (!sessionId) return alert('Seed or provide a sessionId first.');
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/api/analyze/${sessionId}`);
      setSummary(data.summary);
      const decorated = data.series.map(p => ({ ...p, tLabel: new Date(p.t).toLocaleTimeString() }));
      setSeries(decorated);
      pushLog('Analysis complete.');
    } catch (e) {
      alert('Analyze failed');
    } finally { setBusy(false); }
  };

  const fetchReport = async () => {
    if (!sessionId) return alert('Seed or provide a sessionId first.');
    setBusy(true);
    try {
      const { data } = await axios.get(`${API}/api/report/${sessionId}`);
      setSummary(data.summary);
      pushLog('Fetched stored report.');
    } catch (e) {
      alert('Fetch report failed');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <h1>Albe — Sleep Tracker (Demo)</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={seed} disabled={busy}>Seed Demo Data</button>
        <button onClick={analyze} disabled={busy || !sessionId}>Analyze</button>
        <button onClick={fetchReport} disabled={busy || !sessionId}>Fetch Report</button>
        <span style={{ marginLeft: 12, opacity: 0.8 }}>
          Session: <code>{sessionId || '—'}</code>
        </span>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Metric label="HR Avg (bpm)" value={summary?.hr_avg} />
        <Metric label="HRV SDNN (ms)" value={summary?.hrv_sdnn_ms} />
        <Metric label="Motion RMS" value={summary?.motion_rms} />
        <Metric label="Sleep Score" value={summary?.sleep_score} />
      </div>

      <div style={{ height: 320, marginTop: 16, padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tLabel" />
            <YAxis dataKey="hr" />
            <Tooltip />
            <Line type="monotone" dataKey="hr" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Recent actions</h3>
        <ul>
          {log.map((m, i) => <li key={i} style={{ fontSize: 13 }}>{m}</li>)}
        </ul>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value ?? '—'}</div>
    </div>
  )
}


