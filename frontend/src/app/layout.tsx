import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { navigationItems } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Hệ thống quản lý nhà thuốc",
  description: "Bộ khung ứng dụng quản lý một nhà thuốc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-mark">NT</span>
              <div><strong>Nhà thuốc</strong><small>Quản lý nội bộ</small></div>
            </div>
            <nav aria-label="Điều hướng chính">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>
              ))}
            </nav>
          </aside>
          <div className="content-shell">
            <header className="topbar">
              <div><strong>Hệ thống quản lý nhà thuốc</strong><span>Bộ khung phát triển</span></div>
            </header>
            <main className="page-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
