import { HealthStatus } from "@/features/health/health-status";

export default function Home() {
  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Tổng quan</p>
        <h1>Bộ khung đã sẵn sàng</h1>
        <p>Đăng nhập, phân quyền nền và quản lý nhân viên đã sẵn sàng. Các module thuốc, nhập kho, bán hàng, kiểm kê và báo cáo vẫn đang phát triển.</p>
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
