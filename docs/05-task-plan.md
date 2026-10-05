# 05 — Phân công nhóm 3 người

Người 1 quản lý và điều phối; Người 2 phụ trách kho; Người 3 phụ trách bán hàng. Mỗi người thực hiện frontend, backend, kiểm thử và tài liệu của phần mình. Chưa đặt thời hạn cụ thể vì chưa có ngày nộp.

## Người 1 — Quản lý dự án và điều phối

### `docs/project-baseline`

- [ ] Chốt phạm vi.
- [ ] tổng hợp quy tắc.
- [ ] tạo backlog.
- [ ] ghi các điểm mở.

**Phụ thuộc:** Không.

### `chore/project-bootstrap`

- [x] Khởi tạo Next.js/NestJS.
- [x] môi trường mẫu.
- [x] lệnh chạy.
- [x] lint/format và kiểm tra build cơ bản.

**Phụ thuộc:** Công nghệ môi trường được chốt.

### `docs/api-contracts`

- [ ] Quy ước API.
- [ ] payload.
- [ ] quyền.
- [ ] giao tiếp sales–inventory.

**Phụ thuộc:** Phạm vi.

### `feat/database-core`

- [ ] Schema.
- [ ] FK/chỉ mục.
- [ ] migration nền.
- [ ] dữ liệu mẫu.

**Phụ thuộc:** PostgreSQL/Prisma đã chốt; schema và chiến lược migration được duyệt.

### `feat/auth-api`

- [ ] Đăng nhập/đăng xuất.
- [ ] me.
- [ ] kiểm tra quyền.
- [ ] khóa tài khoản.

**Phụ thuộc:** Cơ chế xác thực, CSDL.

### `feat/app-shell`

- [ ] Layout/menu.
- [ ] đăng nhập.
- [ ] API client.
- [ ] lỗi chung.

**Phụ thuộc:** Hợp đồng auth.

### `feat/staff-management`

- [ ] API/UI nhân viên.
- [ ] vai trò.
- [ ] khóa tài khoản.

**Phụ thuộc:** Auth, schema.

### `docs/integration-and-release`

- [ ] Tổng hợp báo cáo.
- [ ] hướng dẫn cài.
- [ ] kịch bản demo.
- [ ] rà tích hợp.

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
