# Hệ thống quản lý nhà thuốc

Đồ án môn Phân tích thiết kế hệ thống thông tin — nhóm 3 thành viên.

**Trạng thái:** Đã có bộ khung frontend/backend và cấu hình PostgreSQL. Chưa triển khai đăng nhập, phân quyền, schema/migration nghiệp vụ, nhập kho, bán hàng hoặc kiểm kê.

## Công nghệ và phiên bản

| Thành phần | Phiên bản/cấu hình |
|---|---|
| Frontend | Next.js 16.3.7, React 19.2.8, TypeScript 5.9.3 |
| Backend | NestJS 12.1.1, TypeScript 6.0.3 |
| CSDL | PostgreSQL, Docker image `postgres:17-alpine` |
| ORM | Prisma 6.12.0 |
| Package manager | npm 11.9.0, có `package-lock.json` cho từng ứng dụng |
| Node.js | Khuyến nghị `^22.22.3` hoặc `>=24.15.0` |

Máy khởi tạo đang có Node.js 24.14.0. Build và kiểm thử đã chạy được, nhưng Nest CLI báo cảnh báo engine; nên nâng lên 24.15.0 trở lên hoặc dùng nhánh Node 22 phù hợp trước khi cả nhóm cài lại dependency.

Repository có `.nvmrc` dùng Node.js 22.22.3 và GitHub Actions kiểm tra Prisma, typecheck, lint, test và build cho cả backend/frontend trên Pull Request vào `main` hoặc `develop`.

## Cài đặt nhanh

Từ thư mục chứa file này:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local

docker compose up -d postgres
docker compose ps
docker compose exec -T postgres pg_isready -U pharmacy -d pharmacy

Set-Location backend
npm install
npm run prisma:generate
npm run start:dev
```

Mở terminal khác:

```powershell
Set-Location frontend
npm install
npm run dev
```

- Frontend: <http://localhost:3000>
- Backend liveness: <http://localhost:3001/api/v1/health>
- Backend readiness/CSDL: <http://localhost:3001/api/v1/health/ready>

Nếu cổng 5432 đã được PostgreSQL khác sử dụng, đổi `POSTGRES_PORT` ở `.env` gốc và cập nhật cổng tương ứng trong `backend/.env`. Không chạy `docker compose down -v` vì lệnh đó xóa volume dữ liệu.

Nếu cổng 3000 đang được ứng dụng khác sử dụng, đặt `FRONTEND_ORIGIN=http://localhost:3002` trong `backend/.env` rồi chạy frontend bằng `npm run dev -- --port 3002`. Không dừng tiến trình khác chỉ để lấy cổng nếu chưa xác định đó là tiến trình của dự án.

## Lệnh kiểm tra

```powershell
Set-Location backend
npm run prisma:validate
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build

Set-Location ../frontend
npm run typecheck
npm run lint
npm run build
```

## Cấu trúc

- `frontend/`: App Router, layout/menu, API client, health status và các trang khung “Đang phát triển”.
- `backend/`: cấu hình môi trường, validation/error filter, Prisma dùng chung, health API và các NestJS module rỗng theo nghiệp vụ.
- `backend/prisma/schema.prisma`: chỉ cấu hình PostgreSQL/Prisma; chưa có model hoặc migration nghiệp vụ.
- `compose.yaml`: PostgreSQL cục bộ với volume do Compose quản lý, tách theo tên project.
- `docs/`: đặc tả và quyết định của nhóm.

Đọc [AGENTS.md](AGENTS.md), [tổng quan](docs/01-project-overview.md), [quy tắc nghiệp vụ](docs/02-business-rules.md) và [nhật ký quyết định](docs/08-decisions.md) trước khi sửa. Không đưa `.env`, mật khẩu thật hoặc dữ liệu người bệnh thật lên Git.

## Tài liệu

| File | Nội dung |
|---|---|
| [01-project-overview](docs/01-project-overview.md) | Phạm vi, actor, công nghệ |
| [02-business-rules](docs/02-business-rules.md) | Quy trình, trạng thái, ràng buộc |
| [03-database-design](docs/03-database-design.md) | Thiết kế logic CSDL |
| [04-api-contract](docs/04-api-contract.md) | Đề xuất API cần review trước code |
| [05-task-plan](docs/05-task-plan.md) | Task và nhánh cho 3 người |
| [06-development-guide](docs/06-development-guide.md) | Cài đặt, chạy và kiểm tra |
| [07-git-workflow](docs/07-git-workflow.md) | Nhánh và Pull Request |
| [08-decisions](docs/08-decisions.md) | Đã chốt, đề xuất, còn mở |
| [09-prompts](docs/09-prompts.md) | Prompt dùng với AI |
| [10-review-summary](docs/10-review-summary.md) | Tổng hợp rà soát trước khởi tạo |
| [diagrams](docs/diagrams/README.md) | Mã nguồn sơ đồ Mermaid |
