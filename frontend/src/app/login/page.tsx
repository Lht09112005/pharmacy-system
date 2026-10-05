'use client';

import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/features/auth/auth-provider';

export default function LoginPage() {
  const { login, status, error: sessionError, retryMe } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(username, password);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Quản lý nội bộ</p>
        <h1>Đăng nhập nhà thuốc</h1>
        <p className="muted">Dùng tài khoản nhân viên để tiếp tục.</p>
        {status === 'error' && (
          <div className="inline-error" role="alert">
            <p>{sessionError}</p>
            <button type="button" className="text-button" onClick={() => void retryMe()}>Thử kiểm tra phiên lại</button>
          </div>
        )}
        <form onSubmit={submit} className="stack-form">
          <label>Tên đăng nhập
            <input autoComplete="username" required maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>Mật khẩu
            <input type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        </form>
      </section>
    </main>
  );
}
