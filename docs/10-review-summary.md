# 10 — Tổng hợp review và tình trạng sau triển khai Người 1

Ngày cập nhật: 05/10/2026. Quyết định kỹ thuật mới trong lượt này đến từ chỉ đạo triển khai của Người 1 theo `PROMPT_NGUOI_1.md`; không hàm ý cả nhóm đã họp hoặc phê duyệt.

## Đã triển khai trong repo

- Frontend `typecheck` chạy `next typegen` trước `tsc --noEmit`, giữ `LayoutProps<"/">` và tách root server layout với auth shell phía client.
- API error filter chuẩn hóa status/code/message/details/path/timestamp, giữ code/details có chủ đích và không trả stack/nội dung lỗi bất ngờ.
- Prisma schema có 17 bảng thiết kế và `PHIEN_DANG_NHAP`; migration đầu PostgreSQL có enum, FK, indexes, CHECK cùng hàng và partial unique `HOA_DON_ma_don_chua_huy_key`.
- Tiền được ánh xạ `DECIMAL(14,2)`; version tồn/snapshot là `BIGINT`; actual quantity kiểm kê nullable.
- Backend có scrypt, session cookie HttpOnly 8 giờ, kiểm tra Origin/Referer, auth/roles guards, login/me/logout, users/roles APIs và bảo vệ quản lý hoạt động cuối bằng transaction Serializable/retry.
- Frontend có login, auth state, role-aware shell/route/menu, API client credentials/cancellation, trang quản lý nhân viên và trạng thái lỗi/loading/phân trang.
- Seed dùng `SEED_DEMO_PASSWORD`, tạo ba role, ba tài khoản demo, ba thuốc và một supplier; không tạo tồn/chứng từ/patient demo và không ghi đè account đã có.
- CI có PostgreSQL 17 riêng cho backend và chạy migration test trước e2e; frontend typecheck/lint/build chạy sau `npm ci`.

## Review điểm dễ sai

- `Sale.prescriptionId` không có `@unique`; migration có partial unique trên các hóa đơn chưa hủy. Prisma relation là lịch sử 1–N.
- Quan hệ nhiều lần tới Employee dùng tên relation riêng cho reviewer, người lập và người duyệt.
- `actualQuantity=NULL` khác số 0; CHECK chỉ yêu cầu lý do khi số đếm khác snapshot.
- `Public` bỏ kiểm tra session nhưng không bỏ kiểm tra nguồn request cho POST login/logout.
- Cookie được clear tại cùng Path `/api/v1`; frontend không lưu token.
- Boolean DTO chỉ nhận boolean thật; username được trim/lowercase; status/roles/session cập nhật trong cùng transaction cần thiết.
- E2E dùng setup kiểm tra `TEST_DATABASE_URL` và gán URL test trước khi import AppModule; không mock guard/Prisma cho luồng tích hợp.

## Kiểm tra trong lượt cập nhật

Đạt: `npm ci` hai ứng dụng; frontend typecheck từ trạng thái không có `.next`/`next-env.d.ts` cũ, lint/build; backend Prisma generate/validate, typecheck, lint, 8 unit tests và build. PostgreSQL 17 chạy bằng Podman Compose của repo: migration áp dụng lên DB trống, deploy lần hai báo không còn migration; `db:test:migrate` thành công trên DB riêng. Hai lượt e2e PostgreSQL đều đạt (3 file, 11 test), một lượt trên DB rỗng để kiểm tra nhánh quản lý cuối và một lượt trên DB đã có dữ liệu seed để kiểm tra khả năng chạy lại. Seed local chạy hai lần; xác nhận tạo đúng ba role, ba account, ba thuốc, một nhà cung cấp, không tạo tồn/chứng từ/khách/đơn; lệnh seed cũng từ chối NODE_ENV=production.

Smoke thật: với DB bật, liveness/readiness lần lượt 200/200; trước đó khi DB tắt, liveness/readiness là 200/503 với error contract. Chromium headless đã thực hiện login → reload giữ session → logout/session cũ bị 401; tạo nhân viên → gán role bổ sung → sửa → khóa → login tài khoản bị khóa trả 401; tài khoản `BAN_THUOC` truy cập trực tiếp `/staff` bị UI từ chối và không tải danh sách. Account fixture giao diện đã được xóa khỏi DB test. `git diff --check` đạt. Đây là kiểm tra local, không phải trạng thái workflow GitHub từ xa; xem `docs/11-person-1-handoff.md`.

`npm ci` frontend báo 5 cảnh báo audit mức high; không chạy `npm audit fix`/nâng dependency vì ngoài phạm vi đã giao. Backend install không báo vulnerability.

Chưa chạy workflow GitHub từ xa vì không push theo yêu cầu. Service `pharmacy-postgres` của repo còn chạy với volume mới `pharmacy-system_pharmacy_postgres_data`; container/volume `aoi-*` có sẵn đã được giữ nguyên. DB phát triển đã migrate; dữ liệu seed tạm của lần kiểm tra đã dọn để người dùng có thể seed bằng mật khẩu do mình tự đặt. Hai database test riêng (`pharmacy_test`, `pharmacy_ci`) giữ migration và fixture demo cần thiết cho lần test kế tiếp.

## Phạm vi còn mở

FEFO/tie-break, ngưỡng và đầu/cuối ngày hết hạn, thời điểm thu tiền, đối chiếu dòng bán–đơn, quy tắc sửa đơn đã kiểm tra và giao tiếp method nội bộ sales–inventory vẫn chờ Người 2/3. Các module thuốc/kho/bán/báo cáo chưa có API nghiệp vụ. Báo cáo nhập–xuất–tồn là task phối hợp Người 3 và Người 2, chưa triển khai.
