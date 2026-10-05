# 06 — Hướng dẫn phát triển

## Yêu cầu môi trường

- Node.js `^22.22.3` hoặc `>=24.15.0`; npm `>=11.9.0`.
- PostgreSQL 17 để chạy migration, seed và e2e; Docker Compose hiện cung cấp PostgreSQL local.
- Hai ứng dụng có `package-lock.json` riêng; dùng `npm ci` từ đúng thư mục ứng dụng.

## Cấu hình local

Tạo file nếu chưa có:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

- Root `.env`: cổng và mật khẩu PostgreSQL Compose.
- `backend/.env`: `DATABASE_URL`, `NODE_ENV`, `PORT`, `FRONTEND_ORIGIN`, `APP_TIMEZONE`; đặt `SEED_DEMO_PASSWORD` riêng tại local nếu chạy seed.
- `TEST_DATABASE_URL` chỉ dành cho migration/e2e test, không cần để API chạy.
- `frontend/.env.local`: `NEXT_PUBLIC_API_BASE_URL`; không để thông tin bí mật trong biến `NEXT_PUBLIC_*`.
- `NODE_ENV` nhận `development`, `test`, `production`, mặc định `development`. API không yêu cầu seed password.
- `FRONTEND_ORIGIN` phải là một origin HTTP/HTTPS hợp lệ, gồm scheme/host/port và không có path. CORS dùng đúng origin này cùng credentials.

Giá trị `SEED_DEMO_PASSWORD` không được ghi trong repo/tài liệu/log. Seed từ chối production, dùng cùng helper scrypt với auth và không đổi dữ liệu tài khoản demo đã có.

## PostgreSQL và migration

```powershell
docker compose up -d postgres
docker compose ps
docker compose exec -T postgres pg_isready -U pharmacy -d pharmacy
```

Không xóa volume hoặc reset database để xử lý lỗi. Migration đầu nằm ở `backend/prisma/migrations/20261005000000_initial/`. Với DB local đã cấu hình:

```powershell
Set-Location backend
npm ci
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run db:seed
```

Tạo migration mới trong môi trường developer bằng `npx prisma migrate dev --name <ten_migration>`; review SQL trước khi chia sẻ. Không sửa/xóa migration đã áp dụng và không dùng `prisma db push` thay migration.

Seed cần `SEED_DEMO_PASSWORD` dài 8–128 ký tự trong env local/test. Các username được tạo là `manager.demo`, `warehouse.demo`, `sales.demo`. Mật khẩu là giá trị do người chạy seed tự đặt.

## CSDL riêng cho e2e

Tạo database PostgreSQL riêng, ví dụ `pharmacy_test`, bằng công cụ PostgreSQL của bạn. Không trỏ biến test sang database phát triển. PowerShell:

```powershell
Set-Location backend
$env:TEST_DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/pharmacy_test?schema=public"
npm run db:test:migrate
npm run test:e2e
```

Các script bắt buộc `TEST_DATABASE_URL`, xác nhận protocol PostgreSQL và tên database có `test` hoặc `ci`, rồi mới gán làm `DATABASE_URL`. Không fallback về URL phát triển, không reset/truncate DB. Fixture có username/tên riêng và cleanup theo khóa fixture. E2E auth/users dùng app bootstrap, guard và Prisma thật.

GitHub Actions dùng service PostgreSQL 17/database `pharmacy_ci`, apply migration trước khi chạy test. `DATABASE_URL` và `TEST_DATABASE_URL` cùng trỏ vào database CI dùng một lần.

## Chạy ứng dụng

```powershell
Set-Location backend
npm run start:dev
```

Terminal khác:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Frontend mặc định ở `http://localhost:3000`; backend ở `http://localhost:3001`. Liveness là `GET /api/v1/health` (không cần DB/session); readiness `GET /api/v1/health/ready` kiểm tra CSDL và trả 503 theo error contract nếu chưa sẵn sàng.

Nếu dùng cổng frontend khác, cập nhật `FRONTEND_ORIGIN` trong `backend/.env` cho khớp. Trình duyệt tự gửi Origin cho request ghi; curl/script phải gửi Origin khớp hoặc Referer cùng origin. CORS không thay việc backend xác thực Origin/Referer.

Cookie production có cờ Secure; môi trường triển khai cần HTTPS cùng site. Cross-site production chưa thuộc phạm vi.

## Lệnh kiểm tra

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

Frontend typecheck gọi `next typegen` trước TypeScript; không phụ thuộc build trước đó. Auth/staff e2e cần PostgreSQL riêng. Browser smoke cần runtime trình duyệt, không được coi HTTP 200 là kiểm tra đầy đủ giao diện.

## Kết quả chạy tại môi trường cập nhật ngày 05/10/2026

- `npm ci`: thành công cho cả backend/frontend. Frontend install báo 5 cảnh báo audit high; không chạy auto-fix/nâng dependency trong phạm vi này. Backend install báo 0 vulnerability.
- Đạt: frontend typecheck khi artifact Next cũ vắng mặt, lint/build; backend Prisma generate/validate, typecheck/lint, 8 unit tests/build; PostgreSQL migration mới và deploy lần hai không còn migration chờ.
- PostgreSQL 17 chạy bằng Podman Compose của repo. DB test riêng `pharmacy_test` và `pharmacy_ci` đã migrate; hai lượt e2e đều đạt 3 file/11 test. Seed local chạy hai lần, từ chối production; browser smoke đã thử login/reload/logout, phân quyền trực tiếp vào `/staff`, và luồng tạo/gán/sửa/khóa nhân viên.
- Smoke HTTP khi PostgreSQL bật: liveness 200, readiness 200. Khi DB tắt: liveness 200, readiness 503 theo error contract.
- Kết quả remote GitHub Actions chưa được xác minh vì chưa push theo yêu cầu. Service `pharmacy-postgres` của repo hiện còn chạy; các database và việc kiểm tra chi tiết nằm trong [docs/11-person-1-handoff.md](11-person-1-handoff.md).

Xem chi tiết từng bước chưa chạy và bàn giao cho Người 2/3 ở [docs/11-person-1-handoff.md](11-person-1-handoff.md).
