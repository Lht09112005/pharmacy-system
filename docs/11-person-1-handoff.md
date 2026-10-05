# 11 — Bàn giao Người 1

Cập nhật 05/10/2026. Đây là phần triển khai theo `PROMPT_NGUOI_1.md`. Các quyết định D21–D31 là mặc định Người 1 giao áp dụng trong prompt, không được ghi nhận như cuộc họp/phê duyệt của cả nhóm.

## Phạm vi đã triển khai

- A: `frontend` chạy `next typegen && tsc --noEmit`; đã kiểm tra typecheck sau khi đưa `.next` và `next-env.d.ts` có sẵn ra khỏi đường dẫn.
- B: filter lỗi chung trả JSON gồm `code`, chuỗi `message`, mảng `details`, `path`, `timestamp`; bootstrap/CORS/ValidationPipe/filter dùng chung cho app và e2e. Lỗi validation, 404, 409 và 500 có cấu trúc thống nhất; nội dung exception bất ngờ không trả về client.
- C: Prisma schema có 17 bảng nghiệp vụ và `AuthSession` ánh xạ `PHIEN_DANG_NHAP`. Migration đầu có enum, FK, index, CHECK cùng hàng và partial unique `HOA_DON_ma_don_chua_huy_key`. Tiền dùng `DECIMAL(14,2)`, version snapshot là `BIGINT`, actual quantity ban đầu nullable. Thông tin chi tiết trong `docs/03-database-design.md`, ERD và migration.
- D: seed ba vai trò cố định, ba tài khoản demo (`manager.demo`, `warehouse.demo`, `sales.demo`), ba thuốc và một nhà cung cấp demo; cần người chạy tự cấp `SEED_DEMO_PASSWORD`. Seed không ghi lại account hiện hữu và không tạo tồn/chứng từ/khách hàng/đơn giả.
- E–F: auth/session, Origin/Referer protection, role guard, API auth/users/roles, DTO chặt, username chuẩn hóa/unique, session thu hồi khi khóa/nghỉ việc, bảo vệ quản lý hoạt động cuối bằng transaction Serializable/retry.
- G–H: trang login, khôi phục phiên từ cookie, xử lý 401/network error, shell/menu/route theo vai trò; quản lý nhân viên dùng API thật với tìm kiếm, phân trang, tạo/sửa/gán nhiều vai trò/khóa và các trạng thái loading/error/empty.
- I: CI thêm PostgreSQL 17 và thứ tự migrate → typecheck/lint/unit/e2e/build. Test PostgreSQL được viết cho ràng buộc schema, partial unique, seed, session/CSRF, users/roles, quyền và xung đột quản lý cuối.
- J: đồng bộ README, docs 01–06, 08, 10, ERD và `process.md` theo phần đã triển khai và phần còn giao.

## File và endpoint chính

- Backend: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261005000000_initial/`, `backend/prisma/seed.ts`; `backend/src/common/` (error contract, bootstrap, auth/guards, retry); `backend/src/modules/auth/`, `users/`, `roles/`; e2e trong `backend/test/`.
- Frontend: `frontend/src/features/auth/`, `frontend/src/components/app-shell.tsx`, `frontend/src/app/login/`, trang `frontend/src/app/staff/page.tsx`, API client/navigation/layout.
- API: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`; `GET/POST /api/v1/users`, `PATCH /api/v1/users/:id`, `PUT /api/v1/users/:id/roles`, `GET /api/v1/roles`; `GET /api/v1/health` và `GET /api/v1/health/ready`.
- Cookie `pharmacy_session` HttpOnly, SameSite=Lax, Path `/api/v1`, tuổi 8 giờ; chỉ lưu SHA-256 token trong PostgreSQL; production thêm Secure. Không có refresh token.
- E2E bắt buộc `TEST_DATABASE_URL` theo giao thức PostgreSQL, tên database có `test` hoặc `ci`; migration test và e2e không fallback `DATABASE_URL`.

## Lệnh và kết quả trong phiên này

Đạt:

- `npm ci` ở backend và frontend.
- Backend: `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test` (4 file, 8 test) và `npm run build`.
- Frontend: `npm run typecheck` khi `.next` và `next-env.d.ts` có sẵn đã được di chuyển tạm, `npm run lint`, `npm run build`.
- PostgreSQL 17 bằng Podman Compose: migration áp dụng trên DB phát triển mới; chạy deploy lần hai ra “No pending migrations”; `db:test:migrate` áp dụng thành công trên `pharmacy_test` và `pharmacy_ci` mới.
- PostgreSQL e2e đạt hai lượt: mỗi lượt 3 file/11 test; lượt đầu trên `pharmacy_test` có demo seed sẵn, lượt sau trên `pharmacy_ci` mới để xác nhận nhánh “quản lý cuối” và đồng thời trên DB sạch.
- Seed local chạy hai lần, xác nhận dữ liệu demo không nhân đôi và không sinh tồn/chứng từ/khách/đơn; bài seed e2e thay đổi trạng thái/hash/vai trò account có trước, chạy lại seed, xác nhận không bị ghi đè rồi khôi phục fixture. Seed ở NODE_ENV=production bị từ chối.
- Browser smoke bằng Chromium: login thành công, reload phục hồi session, logout làm session cũ trả 401; staff manager tạo nhân viên, gán thêm vai trò, sửa và khóa; account bị khóa đăng nhập nhận 401. Vai trò BAN_THUOC mở trực tiếp `/staff` nhận thông báo không đủ quyền và không tải staff list. Đã cleanup employee/account browser fixture.
- HTTP smoke: khi DB bật, liveness/readiness → 200/200; khi DB tắt, liveness/readiness → 200/503 `SERVICE_UNAVAILABLE`; frontend `/` và `/login` → 200.
- `git diff --check` đạt.

Giới hạn còn lại:

- Không push theo yêu cầu nên không có kết quả workflow GitHub từ xa; các job tương ứng đã chạy local, và workflow PostgreSQL 17 đã cập nhật.
- `npm ci` frontend báo 5 cảnh báo audit mức high. Không chạy `npm audit fix`/nâng dependency vì ngoài phạm vi.

Service `pharmacy-postgres` của repo còn chạy với volume mới `pharmacy-system_pharmacy_postgres_data`; DB `pharmacy` đã migrate và không còn demo account/dữ liệu demo seed bởi lượt kiểm tra, để người dùng tự chạy seed với mật khẩu của mình. `pharmacy_test` và `pharmacy_ci` là DB test riêng có migration và fixture seed. Container/volume `aoi-*` có sẵn trước đó không bị thay đổi; backend/frontend/Chromium do lượt này chạy đã dừng.

## Khởi động local

Từ repo, nếu file chưa tồn tại thì sao chép `.env.example`, `backend/.env.example`, `frontend/.env.example` thành `.env`, `backend/.env`, `frontend/.env.local`; giữ nguyên file cấu hình có sẵn. Khởi động PostgreSQL bằng `docker compose up -d postgres` (hoặc Podman Compose nếu đó là runtime đã cài), sau đó chạy:

```powershell
Set-Location backend
npm ci
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
```

Tự đặt `SEED_DEMO_PASSWORD` dài 8–128 ký tự trong môi trường local rồi chạy `npm run db:seed`. Không có mật khẩu mặc định trong repo; ba username demo là `manager.demo`, `warehouse.demo`, `sales.demo`. Sau đó chạy backend `npm run start:dev`; ở terminal khác chạy frontend bằng `npm ci` và `npm run dev`. Chi tiết biến môi trường/cổng nằm trong README và `docs/06-development-guide.md`.

Để chạy e2e, tạo database PostgreSQL riêng có tên như `pharmacy_test`, đặt `TEST_DATABASE_URL`, chạy `npm run db:test:migrate` rồi `npm run test:e2e` trong backend. Không dùng DB phát triển/thật và không reset/xóa volume.

## Việc tiếp theo của Người 2/3

- Người 2: medicines, suppliers, lô/tồn/cảnh báo, goods receipts và stocktakes; dùng các CHECK/version/snapshot trong schema và quy tắc docs 02–04.
- Người 3: customers, prescriptions, sales/invoices/reports; không cập nhật trực tiếp tồn lô.
- Người 2 và 3 cùng chốt method contract sales–inventory trước checkout: dùng cùng Prisma transaction context; inventory không tự commit transaction con.
- Task báo cáo nhập–xuất–tồn vẫn chưa làm, cần phối hợp Người 3/Người 2 như `docs/05-task-plan.md`.
- FEFO/tie-break, ngưỡng và mốc hết hạn trong ngày, thời điểm thu tiền, liên kết dòng bán–đơn, sửa đơn đã kiểm tra vẫn mở theo `docs/08-decisions.md`.

## PR dự kiến (chưa tạo)

**Tiêu đề:** `feat: add pharmacy schema, staff authentication, and management`

**Mô tả:** Thêm migration/schema PostgreSQL và seed demo an toàn; xây session auth cookie, role guards, API users/roles cùng giao diện login và quản lý nhân viên. Bổ sung error contract, test unit/PostgreSQL e2e và CI service PostgreSQL. Kiểm tra local đạt: migration PostgreSQL mới và lần deploy thứ hai, seed lặp an toàn, backend typecheck/lint/unit/e2e/build, frontend clean typecheck/lint/build, cùng Chromium flow login và quản lý nhân viên. Workflow GitHub từ xa chưa chạy vì không push.

Không tạo commit, push, merge, PR hoặc deploy trong lượt này.
