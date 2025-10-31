type Status = 'connecting' | 'open' | 'closed' | 'error';

export function connectWS(
  onMessage: (data: any) => void,
  onStatus?: (s: Status) => void
) {
  const url = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:4000/ws';
  onStatus?.('connecting');
  const ws = new WebSocket(url);

  ws.onopen = () => onStatus?.('open');
  ws.onclose = () => onStatus?.('closed');
  ws.onerror = () => onStatus?.('error');
  ws.onmessage = (ev) => {
    try { onMessage(JSON.parse(ev.data as string)); } catch {}
  };

  return ws;
}
