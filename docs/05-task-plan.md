# 05 — Phân công nhóm 3 người

Người 1 quản lý và điều phối; Người 2 phụ trách kho; Người 3 phụ trách bán hàng. Mỗi người thực hiện frontend, backend, kiểm thử và tài liệu của phần mình. Chưa đặt thời hạn cụ thể vì chưa có ngày nộp.

## Người 1 — Quản lý dự án và điều phối

### `docs/project-baseline`

- [x] Chốt phạm vi.
- [x] Tổng hợp quy tắc.
- [x] Tạo backlog.
- [x] Ghi các điểm mở.

**Phụ thuộc:** Không.

### `chore/project-bootstrap`

- [x] Khởi tạo Next.js/NestJS.
- [x] môi trường mẫu.
- [x] lệnh chạy.
- [x] lint/format và kiểm tra build cơ bản.

**Phụ thuộc:** Công nghệ môi trường được chốt.

### `docs/api-contracts`

- [x] Quy ước lỗi/auth/users/roles, payload và quyền.
- [ ] Giao tiếp nội bộ sales–inventory (Người 2 + Người 3; chưa triển khai).

**Phụ thuộc:** Phạm vi.

### `feat/database-core`

- [x] Schema Prisma cho 17 bảng nghiệp vụ và AuthSession.
- [x] FK, chỉ mục, enum, CHECK và partial unique trong migration.
- [x] Migration nền PostgreSQL và migration lock.
- [x] Seed idempotent cho roles, tài khoản demo và danh mục demo.

**Kiểm chứng PostgreSQL migration/seed/e2e:** [x] Đạt trên PostgreSQL 17 local; migration, seed idempotent và hai lượt e2e đã xác nhận. Chi tiết: `docs/11-person-1-handoff.md`.

**Phụ thuộc:** PostgreSQL/Prisma đã chốt; schema và chiến lược migration được duyệt.

### `feat/auth-api`

- [x] Đăng nhập/đăng xuất và me bằng session cookie.
- [x] Session guard, roles guard và kiểm tra Origin/Referer.
- [x] Khóa tài khoản/nghỉ việc thu hồi phiên.

**Phụ thuộc:** Cơ chế xác thực, CSDL.

### `feat/app-shell`

- [x] Layout/menu theo vai trò và bảo vệ route phía giao diện.
- [x] Trang đăng nhập và API client xác thực.
- [x] Hợp đồng lỗi chuẩn.

**Phụ thuộc:** Hợp đồng auth.

### `feat/staff-management`

- [x] API/UI danh sách, tạo, sửa, tìm kiếm và phân trang nhân viên.
- [x] Gán/thay vai trò.
- [x] Khóa tài khoản, thu hồi phiên và bảo vệ quản lý hoạt động cuối.

**Phụ thuộc:** Auth, schema.

### `docs/integration-and-release`

- [x] Hướng dẫn cài và tài liệu bàn giao.
- [x] PostgreSQL migration/seed/e2e và browser smoke trong phạm vi Người 1; xem kết quả thực tế trong handoff.
- [ ] Tích hợp end-to-end với nghiệp vụ Người 2/3 sau khi các API đó có mặt.

**Phụ thuộc:** Các mốc chức năng.

## Người 2 — Thuốc và kho

### `feat/medicines-api`

- [ ] Tạo/sửa/tìm thuốc.
- [ ] giá.
- [ ] cần đơn.
- [ ] ngưỡng.
- [ ] ngừng bán.

**Phụ thuộc:** Schema, auth.

### `feat/medicines-ui`

- [ ] Danh sách.
- [ ] form.
- [ ] tìm kiếm.
- [ ] lỗi nhập liệu.

**Phụ thuộc:** App shell, hợp đồng API.

### `feat/suppliers`

- [ ] API/UI nhà cung cấp.
- [ ] thêm/sửa.
- [ ] ngừng dùng.

**Phụ thuộc:** Schema, shell.

### `feat/inventory-core`

- [ ] Tồn theo lô.
- [ ] khả dụng.
- [ ] chọn lô.
- [ ] cập nhật tồn/version trong transaction `Serializable`.
- [ ] retry giới hạn chạy lại toàn bộ transaction.

**Phụ thuộc:** Thuốc và lô.

### `feat/goods-receipts-api`

- [ ] Phiếu nháp.
- [ ] chi tiết giữ thuốc/số lô/hạn dự kiến.
- [ ] xác nhận tìm/tạo và gắn lô.
- [ ] xác nhận cộng tồn.
- [ ] hủy.
- [ ] chặn lặp.

**Phụ thuộc:** Inventory, supplier.

### `feat/goods-receipts-ui`

- [ ] Danh sách.
- [ ] form nhiều dòng.
- [ ] xem tổng.
- [ ] xác nhận/hủy.

**Phụ thuộc:** API nhập.

### `feat/stocktakes-api`

- [ ] Lập.
- [ ] chênh lệch.
- [ ] gửi/duyệt.
- [ ] lưu và kiểm tra version để chống số liệu cũ.

**Phụ thuộc:** Inventory, quyền.

### `feat/stocktakes-ui`

- [ ] Nhập thực tế.
- [ ] lý do.
- [ ] quản lý duyệt.

**Phụ thuộc:** API kiểm kê.

### `feat/stock-alerts`

- [ ] Tồn.
- [ ] lọc hạn.
- [ ] cảnh báo thiếu.
- [ ] UI.

**Phụ thuộc:** Inventory.

### `docs/inventory-workflows`

- [ ] Quy trình.
- [ ] sơ đồ.
- [ ] ảnh màn hình.
- [ ] kiểm thử kho.

**Phụ thuộc:** Chức năng đã tích hợp.

## Người 3 — Bán hàng

### `feat/customers`

- [ ] API/UI thêm, tìm, chọn khách.
- [ ] khách lẻ.

**Phụ thuộc:** Schema, shell.

### `feat/prescriptions-api`

- [ ] Thông tin và dòng đơn.
- [ ] liên kết thuốc tùy chọn.
- [ ] kiểm tra đơn.

**Phụ thuộc:** Schema, medicines.

### `feat/prescriptions-ui`

- [ ] Nhập/xem đơn.
- [ ] chọn cho hóa đơn.

**Phụ thuộc:** Hợp đồng đơn.

### `feat/sales-draft-api`

- [ ] Nháp.
- [ ] thêm/sửa/xóa dòng.
- [ ] tính tiền server.
- [ ] khách/ghi chú.

**Phụ thuộc:** Thuốc, đơn, khách.

### `feat/sales-ui`

- [ ] Tra cứu.
- [ ] giỏ hàng.
- [ ] số lượng.
- [ ] chọn khách/đơn.

**Phụ thuộc:** Shell, API nháp.

### `feat/sales-checkout-api`

- [ ] Kiểm tra đơn.
- [ ] tồn.
- [ ] xuất lô.
- [ ] transaction `Serializable` và retry toàn bộ có giới hạn.
- [ ] chống lặp.

**Phụ thuộc:** Inventory-core, API nháp.

### `feat/sales-checkout-ui`

- [ ] Xác nhận.
- [ ] trạng thái xử lý.
- [ ] lỗi.
- [ ] kết quả.

**Phụ thuộc:** API confirm.

### `feat/invoice-history`

- [ ] Danh sách.
- [ ] lọc ngày/trạng thái.
- [ ] chi tiết.

**Phụ thuộc:** Sales.

### `feat/sales-reports`

- [ ] Doanh thu.
- [ ] thuốc bán chạy.
- [ ] lọc thời gian.
- [ ] đối chiếu số.

**Phụ thuộc:** Hóa đơn hoàn tất.

### `feat/inventory-movement-report`

- [ ] Thiết kế báo cáo nhập–xuất–tồn theo transaction đã xác nhận/duyệt.
- [ ] Người 3 phối hợp Người 2 để thống nhất nguồn nhập, xuất và điều chỉnh tồn.
- [ ] API/UI/báo cáo chưa triển khai trong đợt Người 1.

**Phụ thuộc:** Inventory core, goods receipts, sales checkout và stocktakes.

### `docs/sales-workflows`

- [ ] Quy trình/sơ đồ.
- [ ] ảnh màn hình.
- [ ] kiểm thử bán.

**Phụ thuộc:** Chức năng đã tích hợp.

## Mốc tích hợp

| Mốc | Đầu ra |
|---|---|
| 1 | Phạm vi, CSDL, hợp đồng API thống nhất. |
| 2 | Bộ khung, đăng nhập, dữ liệu danh mục. |
| 3 | Nhập được thuốc, xem tồn, tạo hóa đơn nháp. |
| 4 | Bán và trừ tồn, kiểm kê/duyệt, cảnh báo/báo cáo. |
| 5 | Kiểm thử xuyên suốt, báo cáo và demo. |

## Phân chia báo cáo

- Người 1: Chương I; ERD và CSDL/Use Case tổng; cài đặt; tổng hợp.
- Người 2: quy trình/sơ đồ/UI kho và kiểm thử kho.
- Người 3: quy trình/sơ đồ/UI bán hàng và kiểm thử bán.
- Cả nhóm: kết quả thực hiện, hạn chế và thuyết trình.

## Definition of Done

- [ ] Đúng issue; không mở rộng ngoài task.
- [ ] Kiểm tra quyền và dữ liệu.
- [ ] UI kết nối API thật nếu có UI.
- [ ] Kiểm thử đường thành công và lỗi chính.
- [ ] Migration/tài liệu được cập nhật nếu cần.
- [ ] PR có hướng dẫn kiểm tra và người khác review.

Người 1 điều phối schema, cấu hình gốc, thư viện, layout. Người 2 sở hữu tồn kho. Người 3 dùng giao tiếp inventory đã thống nhất. API/UI có thể chuẩn bị song song bằng dữ liệu giả có đánh dấu, nhưng chưa coi hoàn tất cho đến khi tích hợp API thật.
