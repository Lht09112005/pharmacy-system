'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';
import { navigationItems, roleLabels } from '@/lib/navigation';
import { useAuth } from '@/features/auth/auth-provider';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, error, logout, retryMe } = useAuth();
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    if (pathname === '/login' && status === 'authenticated') router.replace('/');
    if (pathname !== '/login' && status === 'anonymous') router.replace('/login');
  }, [pathname, status, router]);

  if (pathname === '/login') {
    if (status === 'authenticated') return <main className="auth-wait">Đang mở ứng dụng…</main>;
    return <>{children}</>;
  }
  if (status === 'checking') return <main className="auth-wait">Đang kiểm tra phiên đăng nhập…</main>;
  if (status === 'anonymous') return <main className="auth-wait">Đang chuyển đến đăng nhập…</main>;
  if (status === 'error') {
    return (
      <main className="auth-message" role="alert">
        <h1>Không thể kết nối</h1>
        <p>{error}</p>
        <button type="button" onClick={() => void retryMe()}>Thử lại</button>
        <Link href="/login">Mở trang đăng nhập</Link>
      </main>
    );
  }
  if (!user) return null;

  const current = navigationItems.find((item) => item.href === pathname);
  const hasRouteAccess =
    !current || current.roles.length === 0 || current.roles.some((role) => user.roles.includes(role));
  const visibleItems = navigationItems.filter(
    (item) => item.roles.length === 0 || item.roles.some((role) => user.roles.includes(role)),
  );
  const performLogout = async () => {
    setLogoutError('');
    try {
      await logout();
    } catch (cause) {
      setLogoutError(cause instanceof ApiError ? cause.message : 'Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">NT</span>
          <div><strong>Nhà thuốc</strong><small>Quản lý nội bộ</small></div>
        </div>
        <nav aria-label="Điều hướng chính">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${pathname === item.href ? ' active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <div><strong>Hệ thống quản lý nhà thuốc</strong><span>{user.name} · {user.roles.map((role) => roleLabels[role]).join(', ')}</span></div>
          <button className="secondary-button" type="button" onClick={() => void performLogout()}>Đăng xuất</button>
        </header>
        {logoutError && <p className="inline-error" role="alert">{logoutError}</p>}
        <main className="page-content">
          {hasRouteAccess ? children : (
            <section className="auth-message" role="alert">
              <h1>Không đủ quyền</h1>
              <p>Tài khoản hiện tại không có quyền mở trang này.</p>
              <Link href="/">Về tổng quan</Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
