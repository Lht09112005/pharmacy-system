import { HealthStatus } from "@/features/health/health-status";

export default function Home() {
  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Tổng quan</p>
        <h1>Bộ khung đã sẵn sàng</h1>
        <p>Các module nghiệp vụ hiện chỉ có cấu trúc. Chưa có chức năng nhập kho, bán hàng, kiểm kê, đăng nhập hoặc phân quyền.</p>
      </div>
      <div className="dashboard-grid">
        <article className="card"><h2>Kết nối hệ thống</h2><HealthStatus /></article>
        <article className="card">
          <h2>Trạng thái triển khai</h2>
          <dl className="status-list">
            <div><dt>Frontend</dt><dd>Next.js App Router</dd></div>
            <div><dt>Backend</dt><dd>NestJS + Prisma</dd></div>
            <div><dt>Nghiệp vụ</dt><dd>Đang phát triển</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
