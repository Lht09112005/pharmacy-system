# 06 — Hướng dẫn chuẩn bị và phát triển

## Yêu cầu môi trường

- Node.js `^22.22.3` hoặc `>=24.15.0`.
- npm 11.9.0 hoặc tương thích với lockfile.
- Docker Desktop/Engine và Docker Compose để chạy PostgreSQL cục bộ, hoặc PostgreSQL tương đương đã có sẵn.
- Các phiên bản framework/ORM thực tế được ghi trong README và D20.

Máy khởi tạo dùng Node.js 24.14.0 và npm 11.9.0. Các kiểm tra build đã thành công nhưng dependency của Nest CLI cảnh báo Node 24.14.0 thấp hơn 24.15.0; không dùng cảnh báo này làm chuẩn cho máy thành viên khác.

File `.nvmrc` cố định phiên bản khuyến nghị 22.22.3 cho công cụ quản lý Node hỗ trợ NVM. GitHub Actions cũng đọc file này để dùng cùng phiên bản.

## Chuẩn bị biến môi trường

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

| File | Biến |
|---|---|
| `.env` | `POSTGRES_PORT`, `POSTGRES_PASSWORD` cho Compose |
| `backend/.env` | `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, `APP_TIMEZONE` |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` |

`NEXT_PUBLIC_*` là biến công khai phía trình duyệt, không được chứa mật khẩu/token. Không commit các file môi trường thật.

## PostgreSQL

Docker daemon phải đang chạy:

```powershell
docker compose up -d postgres
docker compose ps
docker compose exec -T postgres pg_isready -U pharmacy -d pharmacy
docker compose exec -T postgres psql -U pharmacy -d pharmacy -tAc "SELECT 1"
```

Compose dùng image `postgres:17-alpine` và volume được đặt tên theo Compose project. Dừng container bằng `docker compose stop postgres`; không dùng `docker compose down -v` hoặc xóa volume để xử lý lỗi.

Các lệnh trên đã chạy thành công trên máy khởi tạo: container `pharmacy-postgres` đạt trạng thái `healthy`, `pg_isready` chấp nhận kết nối và truy vấn `SELECT 1` trả kết quả thành công. Không tạo schema hoặc migration nghiệp vụ trong lần kiểm tra này.

## Backend

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run start:dev
```

Lần xác minh kết nối thực tế đã build rồi chạy backend bằng:

```powershell
npm run build
npm run start:prod
```

- Liveness: `GET http://localhost:3001/api/v1/health` — không phụ thuộc CSDL.
- Readiness: `GET http://localhost:3001/api/v1/health/ready` — chạy `SELECT 1`, trả 503 theo định dạng lỗi chung nếu PostgreSQL chưa sẵn sàng.
- `prisma/schema.prisma` hiện chưa có model nghiệp vụ và chưa có migration.
- Các module auth, users, roles, medicines, suppliers, inventory, goods-receipts, stocktakes, customers, prescriptions, sales, reports mới chỉ là NestJS module rỗng.

## Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Frontend dùng App Router, CSS thuần, layout/menu chung và gọi liveness API qua `NEXT_PUBLIC_API_BASE_URL`. Các trang nghiệp vụ đều ghi “Đang phát triển” và chưa có API nghiệp vụ.

Nếu cổng 3000 đã bị tiến trình khác chiếm, dùng cổng thay thế và cập nhật origin local tương ứng trước khi khởi động backend:

```powershell
# backend/.env
FRONTEND_ORIGIN=http://localhost:3002

Set-Location frontend
npm run dev -- --port 3002
```

Đây chỉ là cấu hình local; `.env.example` vẫn dùng cổng chuẩn 3000.

## Kiểm tra

Workflow `.github/workflows/ci.yml` tự động chạy các kiểm tra dưới đây khi có Pull Request hoặc push vào `main`/`develop`.

Backend:

```powershell
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm audit
```

Frontend:

```powershell
npm run typecheck
npm run lint
npm run build
npm audit
```

Kết quả trên máy khởi tạo:

- Backend typecheck, lint, build và e2e health: đạt.
- Frontend typecheck, lint, build; trang tổng quan và trang thuốc trả HTTP 200: đạt.
- Prisma generate/validate: đạt với Prisma 6.12.0; schema chưa có model nên không tạo migration.
- `npm audit`: 0 vulnerability cho cả hai ứng dụng sau khi loại dependency generator không dùng.
- PostgreSQL qua Docker Compose: `healthy`; `pg_isready` và truy vấn `SELECT 1`: đạt.
- Backend liveness trả HTTP 200; readiness trả HTTP 200 với trạng thái CSDL `connected`; CORS cho origin frontend local: đạt.
- Frontend chạy ở cổng 3002 trong lần kiểm tra vì cổng 3000 đang bị một tiến trình Node ngoài phiên kiểm tra chiếm. Kiểm tra bằng Chrome headless xác nhận trang tổng quan đã hydrate và hiển thị `Đã kết nối` cùng `pharmacy-api: ok`; cấu hình mẫu vẫn dùng cổng 3000.

## Ranh giới sở hữu

Người 1 điều phối layout/menu, API client, cấu hình chung, Prisma schema/migrations và lockfile. Người 2 sở hữu medicines, suppliers, inventory, goods-receipts, stocktakes. Người 3 sở hữu customers, prescriptions, sales, reports. Module sales chỉ dùng giao tiếp inventory đã thống nhất; không tự cập nhật lô.
