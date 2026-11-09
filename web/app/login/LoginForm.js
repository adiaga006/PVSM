'use client';
import { useEffect, useRef, useState } from 'react';

export default function LoginForm() {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const themeBtn = useRef(null);
  useEffect(() => { window.pvsmTheme?.paint(themeBtn.current); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: f.get('username'), password: f.get('password') }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Đăng nhập thất bại');
      window.location.href = '/';
    } catch (x) {
      setErr(x.message); setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h1>PVSM · Track Record</h1>
        <button ref={themeBtn} type="button" className="theme-btn" style={{ width: 'auto', height: 34 }} aria-label="Giao diện">◐</button>
      </div>
      <form className="card" onSubmit={submit}>
        <label className="f">Tên đăng nhập<input name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus /></label>
        <label className="f">Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label>
        {err && <div className="chip over msg">{err}</div>}
        <button className="pri" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <p className="mu" style={{ margin: '12px 0 0' }}>Chưa có tài khoản hoặc quên mật khẩu: liên hệ Admin.</p>
      </form>
    </div>
  );
}
