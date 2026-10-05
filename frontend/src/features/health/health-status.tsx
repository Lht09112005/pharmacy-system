'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api-client';

type State = { kind: 'loading' | 'ok' | 'error'; message: string };

export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: 'loading', message: 'Đang kiểm tra backend…' });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((result) => setState({ kind: 'ok', message: `${result.data.service}: ${result.data.status}` }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ kind: 'error', message: error instanceof Error ? error.message : 'Không gọi được backend.' });
      });
    return () => controller.abort();
  }, []);

  const label = state.kind === 'ok' ? 'Đã kết nối' : state.kind === 'error' ? 'Chưa kết nối' : 'Đang kiểm tra';
  return <div><div className="health-row"><span className={`health-dot ${state.kind}`} aria-hidden="true" /><strong>{label}</strong></div><p className="health-detail">{state.message}</p></div>;
}
