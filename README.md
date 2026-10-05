# Hệ thống quản lý nhà thuốc

Đồ án môn Phân tích thiết kế hệ thống thông tin — nhóm 3 thành viên, một nhà thuốc.

**Trạng thái:** Nền dữ liệu/migration, session auth, phân quyền backend, shell đăng nhập và quản lý nhân viên đã được triển khai. Thuốc, nhập kho, tồn, kiểm kê, khách hàng, đơn thuốc, bán hàng, hóa đơn và báo cáo vẫn đang phát triển.

## Công nghệ

| Thành phần | Phiên bản/cấu hình |
|---|---|
| Frontend | Next.js 16.3.7, React 19.2.8 |
| Backend | NestJS 12, TypeScript |
| CSDL | PostgreSQL 17 |
| ORM | Prisma 6.12 |
| Package manager | npm, lockfile riêng cho frontend/backend |
| Node.js | `^22.22.3` hoặc `>=24.15.0` |

## Chạy local

Từ repo, tạo file môi trường nếu chưa có:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Trong file local `backend/.env`, tự đặt một giá trị `SEED_DEMO_PASSWORD` dài 8–128 ký tự. Giá trị này chỉ dùng khi seed; không chia sẻ hoặc commit file môi trường. Ba tài khoản demo dùng chính mật khẩu bạn tự đặt.

Khởi động PostgreSQL và cài dependency từ lockfile:

```powershell
docker compose up -d postgres
Set-Location backend
npm ci
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run db:seed
npm run start:dev
```

Ở terminal khác:

```powershell
Set-Location frontend
npm ci
npm run dev
```

- Frontend: <http://localhost:3000>
- Backend liveness: <http://localhost:3001/api/v1/health>
- Backend readiness: <http://localhost:3001/api/v1/health/ready>
- Tài khoản demo sau khi seed: `manager.demo`, `warehouse.demo`, `sales.demo`.

Seed chỉ chạy ở development/test; không tạo tồn kho, hóa đơn, bệnh nhân hay chứng từ giả. Chạy lại seed không đổi mật khẩu, trạng thái, vai trò hoặc dữ liệu demo hiện có.

Nếu đổi cổng frontend, cập nhật `FRONTEND_ORIGIN` trong `backend/.env`. POST/PUT/PATCH/DELETE yêu cầu trình duyệt gửi Origin đúng origin này; curl cần tự đặt `Origin` hoặc `Referer` cùng origin.

## API nền

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- `GET/POST /api/v1/users`, `PATCH /api/v1/users/:employeeId`, `PUT /api/v1/users/:employeeId/roles`
- `GET /api/v1/roles`

Session nằm trong PostgreSQL; cookie HttpOnly có thời hạn cố định 8 giờ. Trong production cookie cần HTTPS cùng site. Không có API xóa account, reset mật khẩu hoặc refresh session.

## Kiểm tra

```powershell
Set-Location backend
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run db:seed
npm run typecheck
npm run lint
npm test
npm run db:test:migrate
npm run test:e2e
npm run build

Set-Location ../frontend
npm run typecheck
npm run lint
npm run build
```

E2E bắt buộc có `TEST_DATABASE_URL` trỏ đến PostgreSQL riêng có tên database chứa `test` hoặc `ci`; không fallback sang `DATABASE_URL`. Ví dụ PowerShell:

```powershell
$env:TEST_DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/pharmacy_test?schema=public"
npm run db:test:migrate
npm run test:e2e
```

Tạo database test riêng nếu cần; không dùng lệnh reset/truncate trên database người dùng. CI chạy PostgreSQL 17 service riêng cho job.

## Tài liệu

- [01 — Tổng quan](docs/01-project-overview.md)
- [02 — Quy tắc nghiệp vụ](docs/02-business-rules.md)
- [03 — Thiết kế CSDL](docs/03-database-design.md)
- [04 — Hợp đồng API](docs/04-api-contract.md)
- [05 — Kế hoạch nhóm](docs/05-task-plan.md)
- [06 — Hướng dẫn phát triển](docs/06-development-guide.md)
- [08 — Nhật ký quyết định](docs/08-decisions.md)
- [10 — Tổng hợp rà soát](docs/10-review-summary.md)
- [11 — Bàn giao Người 1](docs/11-person-1-handoff.md)
- [ERD](docs/diagrams/erd.mmd)
