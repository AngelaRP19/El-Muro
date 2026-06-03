import { useEffect, useState } from 'react';

const AUTH_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';

interface GoogleCallbackProps {
  onSuccess: (token: string, user: { nombre: string; correo: string; role: string }) => void;
  onError: (msg: string) => void;
}

export default function GoogleCallback({ onSuccess, onError }: GoogleCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setErrorMsg('No se encontró el código de autorización de Google.');
      setStatus('error');
      onError('No authorization code');
      return;
    }

    const exchange = async () => {
      try {
        const res = await fetch(`${AUTH_BASE}/api/auth/google/callback`, {
          cache: 'no-store',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Error ${res.status}`);
        }

        const data = await res.json();
        const token: string = data.token;
        const user = data.user ?? { nombre: data.nombre, correo: data.correo, role: data.role };

        sessionStorage.setItem('elmuro_token', token);

        window.history.replaceState({}, '', '/');

        onSuccess(token, user);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setErrorMsg(msg);
        setStatus('error');
        onError(msg);
      }
    };

    exchange();
  }, [onSuccess, onError]);

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card animate-slide-up" style={{ textAlign: 'center' }}>
        {status === 'loading' ? (
          <>
            <div className="oauth-spinner" />
            <h2 style={{ marginTop: 24 }}>Autenticando con Google…</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Por favor espera un momento.
            </p>
          </>
        ) : (
          <>
            <i className="ph ph-warning-circle" style={{ fontSize: '3rem', color: '#ff4d6d' }} />
            <h2 style={{ marginTop: 16 }}>Error de autenticación</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{errorMsg}</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  );
}