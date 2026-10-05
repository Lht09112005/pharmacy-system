# Nhật ký tổng quan và bàn giao dự án

> Cập nhật: 05/10/2026. Đây là trạng thái repo sau phần Người 1; đặc tả chi tiết vẫn nằm trong `docs/`. Không tự commit, push hoặc merge.

## Tóm tắt

- Ứng dụng một nhà thuốc dùng Next.js, NestJS, Prisma và PostgreSQL. Repo có `frontend/`, `backend/` và `docs/`; npm dùng lockfile riêng cho mỗi ứng dụng.
- Đã triển khai nền dữ liệu với 17 bảng nghiệp vụ cộng `PHIEN_DANG_NHAP`, migration đầu có enum/FK/index/CHECK và partial unique đơn–hóa đơn; đã có seed demo, auth/session, phân quyền, API nhân viên/vai trò và giao diện đăng nhập/quản lý nhân viên.
- Thuốc, nhà cung cấp, lô/tồn, nhập kho, kiểm kê, khách hàng, đơn thuốc, bán hàng, hóa đơn và báo cáo vẫn thuộc phần Người 2/3. Không coi module khung hoặc hợp đồng dự kiến là API đã hoàn tất.
- Hướng dẫn setup: `README.md`; quyết định: `docs/08-decisions.md`; phân công/dependency: `docs/05-task-plan.md`; kiểm tra và blocker lần này: `docs/10-review-summary.md`, `docs/11-person-1-handoff.md`.

## Quyết định cần giữ

- Vai trò: `BAN_THUOC`, `QUAN_LY_KHO`, `QUAN_LY`; một tài khoản có thể có nhiều vai trò và quyền quản lý không tự cấp quyền bán/kho.
- Phiên là token ngẫu nhiên trong cookie HttpOnly, chỉ lưu SHA-256 trong CSDL, hết hạn sau 8 giờ; mọi request xác thực lại trạng thái tài khoản, nhân viên và vai trò. Thay đổi tài khoản/vai trò thu hồi phiên khi cần.
- POST/PUT/PATCH/DELETE cần Origin khớp `FRONTEND_ORIGIN`, hoặc Referer cùng origin khi thiếu Origin; CORS không thay kiểm tra này.
- Tiền là `DECIMAL(14,2)` và API truyền chuỗi; version tồn là `BIGINT`. Transaction nhập/bán/duyệt kiểm kê và tính nhất quán sales–inventory thuộc service nghiệp vụ do Người 2/3 triển khai.
- Một đơn có thể giữ nhiều hóa đơn lịch sử nhưng chỉ một hóa đơn chưa hủy; hóa đơn nháp hủy còn liên kết lịch sử và cho phép dùng lại đơn. Index một phần nằm trong migration SQL.
- Kiểm kê tạo snapshot trước khi đếm; `actualQuantity` ban đầu NULL; yêu cầu kiểm tra lại phải có snapshot/lần đếm mới.
- Quyết định triển khai trong `docs/08-decisions.md` đến từ prompt Người 1 ngày 05/10/2026, không hàm ý cả nhóm đã họp/phê duyệt.

## Kiểm tra và giới hạn môi trường

Các lệnh chạy và kết quả cụ thể được ghi trong `docs/10-review-summary.md` và `docs/11-person-1-handoff.md`. Phiên này dùng Podman Compose vì Docker CLI không có; service `pharmacy-postgres` đang chạy khỏe trên cổng 5432 với volume mới riêng của repo. `pharmacy` đã migrate, còn `pharmacy_test` và `pharmacy_ci` là DB test riêng đã migrate/e2e. Trạng thái service/volume có thể đổi giữa phiên; kiểm tra Podman trước khi dùng, và không reset/xóa volume.

Frontend `npm ci` báo 5 cảnh báo audit mức high; không chạy audit fix vì việc nâng dependency ngoài phạm vi. Kiểm tra frontend/backend local không phải kết quả CI từ xa. Luôn cập nhật tài liệu bàn giao theo đúng lệnh thực sự chạy.

## Môi trường và lệnh

Tạo `.env`, `backend/.env`, `frontend/.env.local` từ file mẫu chỉ khi các file chưa có; không ghi đè cấu hình local hoặc in secret. PostgreSQL phát triển dùng `docker compose up -d postgres`; không xóa volume/reset DB. Backend cần `DATABASE_URL`, `FRONTEND_ORIGIN`, `APP_TIMEZONE`; seed yêu cầu người dùng tự đặt `SEED_DEMO_PASSWORD` và từ chối production.

```sh
cd backend
npm ci
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run db:seed
npm run start:dev
```

```sh
cd frontend
npm ci
npm run dev
```

E2E chỉ nhận `TEST_DATABASE_URL` dùng giao thức PostgreSQL và database có tên chứa `test` hoặc `ci`; migration kiểm thử dùng cùng URL này, không fallback sang `DATABASE_URL`. Chạy `npm run db:test:migrate` trước `npm run test:e2e` trong backend. Không dùng SQLite/mock để thay kiểm chứng PostgreSQL.

## Phân công tiếp theo

- Người 2: thuốc, nhà cung cấp, tồn/lô/cảnh báo, nhập kho và kiểm kê; thực hiện invariants/transaction ghi trong docs.
- Người 3: khách hàng, đơn thuốc, checkout/hóa đơn và báo cáo; phối hợp Người 2 để chốt API nội bộ sales–inventory trước khi tích hợp.
- Còn chờ quyết định: FEFO/tie-break, hạn dùng trong ngày, ngưỡng cảnh báo, thời điểm thu tiền, đối chiếu từng dòng bán–đơn, sửa đơn đã kiểm tra. Không tự coi các mục này đã được chốt.
