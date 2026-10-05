# 04 — Hợp đồng API đề xuất

**Trạng thái: bản đề xuất để Người 1, 2, 3 review; chưa xác nhận có API nào đã triển khai.** Cần cập nhật quyết định trước khi frontend/backend phụ thuộc vào các tên trường này.

## Quy ước đề xuất

- Prefix `/api/v1`; tài nguyên URL dùng tiếng Anh, JSON dùng camelCase.
- ID dùng số nguyên; giá tiền truyền/nhận bằng chuỗi thập phân để tránh làm tròn sai. Backend dùng Prisma `Decimal` để tính tiền; không chuyển sang JavaScript `number` và không tin tổng tiền client gửi. Số chữ số, tiền tệ và quy tắc làm tròn còn phải chốt.
- Ngày dạng `YYYY-MM-DD`; timestamp ISO 8601. Timestamp lưu bằng PostgreSQL `TIMESTAMPTZ`; hiển thị và xác định ngày báo cáo theo `Asia/Ho_Chi_Minh`.
- Trường thời gian chứng từ dự kiến dùng `createdAt`, `updatedAt`, `completedAt`; `completedAt` là null khi chưa hoàn tất. Báo cáo giao dịch hoàn tất lọc/nhóm theo `completedAt`, không theo `createdAt`.
- Danh sách: `page`, `pageSize`, `search`; response có `data`, `meta`.
- Thành công đối tượng: `{ "data": { ... } }`.
- Lỗi: `{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Không đủ tồn", "details": [] } }`.
- HTTP: 400 dữ liệu sai; 401 chưa đăng nhập; 403 thiếu quyền; 404 không có; 409 xung đột trạng thái hoặc tồn; 500 lỗi ngoài dự kiến.
- Cơ chế cookie/token chưa chọn; không tự mặc định localStorage hoặc tạo flow refresh khi chưa thống nhất.
- Mọi API nghiệp vụ yêu cầu xác thực. Vai trò liệt kê bên dưới là quyền tối thiểu; một tài khoản có thể được gán thêm vai trò.

## Danh sách endpoint dự kiến

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Kiểm tra | GET /health | Liveness; không trả thông tin bí mật |
| Tài khoản | POST /auth/login; POST /auth/logout; GET /auth/me | Theo cơ chế xác thực sẽ chọn |
| Nhân viên | GET/POST /users; PATCH /users/:id; PUT /users/:id/roles | QUAN_LY |
| Thuốc | GET /medicines; GET /medicines/:id | Các vai trò nội bộ |
| Thuốc | POST /medicines; PATCH /medicines/:id | QUAN_LY |
| Nhà cung cấp | GET /suppliers | QUAN_LY, QUAN_LY_KHO |
| Nhà cung cấp | POST /suppliers; PATCH /suppliers/:id | QUAN_LY |
| Tồn | GET /inventory/lots; GET /inventory/alerts | QUAN_LY_KHO, QUAN_LY |
| Tồn bán | GET /medicines/:id/availability | BAN_THUOC, QUAN_LY_KHO, QUAN_LY |
| Nhập | GET/POST /goods-receipts; GET/PATCH /goods-receipts/:id | QUAN_LY_KHO |
| Nhập | POST /goods-receipts/:id/confirm; POST /goods-receipts/:id/cancel | QUAN_LY_KHO |
| Kiểm kê | GET/POST /stocktakes; GET/PATCH /stocktakes/:id; POST /stocktakes/:id/submit | QUAN_LY_KHO; quản lý có quyền xem |
| Duyệt | POST /stocktakes/:id/approve; POST /stocktakes/:id/request-recheck | QUAN_LY |
| Khách | GET/POST /customers; PATCH /customers/:id | BAN_THUOC |
| Đơn | GET/POST /prescriptions; GET/PATCH /prescriptions/:id; POST /prescriptions/:id/review | BAN_THUOC |
| Bán | GET/POST /sales; GET/PATCH /sales/:id | BAN_THUOC; quản lý được xem lịch sử |
| Bán | POST /sales/:id/confirm; POST /sales/:id/cancel | BAN_THUOC |
| Báo cáo | GET /reports/revenue; GET /reports/top-medicines; GET /reports/inventory | QUAN_LY |

Nhà cung cấp/người kê đơn không gọi API trực tiếp. Dữ liệu từng nhân viên được phép xem phải chốt ở ma trận quyền; không xem việc đăng nhập là đủ để truy cập mọi hồ sơ.

## Payload mẫu

Tạo hóa đơn nháp, tên trường dự kiến:

```json
{
  "customerId": null,
  "prescriptionId": null,
  "consultationNote": "",
  "items": [{ "medicineId": 1, "quantity": 10 }]
}
```

`prescriptionId: null` là hợp lệ cho hóa đơn không kê đơn. Khi có bất kỳ thuốc bắt buộc kê đơn, backend phải từ chối xác nhận nếu thiếu đơn hợp lệ và thông tin nhân viên kiểm tra. Một đơn chỉ được gắn tối đa một hóa đơn theo quy tắc ở tài liệu 02; cách xử lý hóa đơn nháp đã hủy còn mở.

Tạo phiếu nhập nháp:

```json
{
  "supplierId": 1,
  "items": [{
    "medicineId": 1,
    "batchNumber": "LO001",
    "expiryDate": "2027-12-31",
    "quantity": 100,
    "unitCost": "1500.00"
  }]
}
```

Payload nhập dùng `medicineId` + `batchNumber` + `expiryDate`. Khi lưu nháp, backend ghi ba giá trị này trên CT_PHIEU_NHAP, để `lotId` rỗng và không tạo/tăng tồn. Khi xác nhận, backend tìm hoặc tạo LO_THUOC theo đúng bộ ba, gắn `lotId` và tăng tồn/version trong cùng transaction. Client không tự đặt tồn.

Tạo kiểm kê dự kiến:

```json
{
  "items": [{ "lotId": 1, "actualQuantity": 89, "reason": "Chênh lệch cần đối chiếu" }]
}
```

Tồn hệ thống, người thao tác và thời điểm do server ghi; client không được tùy ý xác định các giá trị này.

## Xác nhận chứng từ

- Request confirm không được tự áp đặt tồn cuối hay tổng tiền.
- Backend đọc lại chứng từ và dữ liệu cần thiết trong transaction.
- Yêu cầu confirm lặp hoặc đồng thời không tạo xuất/nhập lần hai; nếu chứng từ đã hoàn tất thì trả lại trạng thái/kết quả hiện có theo hợp đồng idempotency sẽ chốt.
- Trạng thái terminal không được sửa bằng API PATCH chung.
- Sửa thông tin đơn cần vô hiệu hóa lần kiểm tra cũ nếu nội dung ảnh hưởng nghiệp vụ; chốt quy tắc trước khi code.
- Xung đột tồn hoặc phiên bản kiểm kê trả 409 với mã lỗi ổn định, dự kiến `INSUFFICIENT_STOCK`, `INVENTORY_CONFLICT` hoặc `STOCKTAKE_STALE`; danh sách mã cần review trước khi frontend phụ thuộc.
- Xác nhận nhập, bán và duyệt kiểm kê dùng transaction `Serializable`. Xung đột serialization/deadlock được retry có giới hạn; mỗi lần retry chạy lại toàn bộ callback transaction.
- Callback transaction không chờ người dùng hoặc gọi dịch vụ bên ngoài. Mọi dữ liệu cần từ bên ngoài transaction phải được chuẩn bị trước nhưng trạng thái chứng từ, tồn và version vẫn phải đọc/kiểm tra lại bên trong.

## Sales và inventory

Người 2 sở hữu xử lý tồn, Người 3 điều phối hoàn tất hóa đơn. Cùng dùng một Prisma transaction context. Inventory không tự commit một transaction độc lập khiến hóa đơn thất bại nhưng tồn đã bị trừ; sales không cập nhật trực tiếp bảng lô. Chữ ký phương thức nội bộ và chính sách chọn lô được hai người chốt trong task `docs/api-contracts` theo các bất biến tại tài liệu 03.
