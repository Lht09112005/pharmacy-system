# 04 — Hợp đồng API đề xuất

**Trạng thái:** Các endpoint `auth`, `users`, `roles` bên dưới đã được Người 1 triển khai theo prompt ngày 05/10/2026. Các endpoint thuốc/kho/bán/báo cáo còn lại vẫn là hợp đồng đề xuất, chưa có API nghiệp vụ.

## Quy ước đề xuất

- Prefix `/api/v1`; tài nguyên URL dùng tiếng Anh, JSON dùng camelCase.
- ID dùng số nguyên; giá tiền truyền/nhận bằng chuỗi thập phân để tránh làm tròn sai. Backend dùng Prisma `Decimal` để tính tiền; không chuyển sang JavaScript `number` và không tin tổng tiền client gửi. Số chữ số, tiền tệ và quy tắc làm tròn còn phải chốt.
- Ngày dạng `YYYY-MM-DD`; timestamp ISO 8601. Timestamp lưu bằng PostgreSQL `TIMESTAMPTZ`; hiển thị và xác định ngày báo cáo theo `Asia/Ho_Chi_Minh`.
- Trường thời gian chứng từ dự kiến dùng `createdAt`, `updatedAt`, `completedAt`; `completedAt` là null khi chưa hoàn tất. Báo cáo giao dịch hoàn tất lọc/nhóm theo `completedAt`, không theo `createdAt`.
- Danh sách: `page`, `pageSize`, `search`; response có `data`, `meta`.
- Thành công đối tượng: `{ "data": { ... } }`.
- Lỗi: `{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Không đủ tồn", "details": [], "path": "/api/v1/...", "timestamp": "..." } }`; `message` luôn là chuỗi và `details` luôn là mảng.
- HTTP: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED` (login sai dùng `INVALID_CREDENTIALS`); 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `STATE_CONFLICT` hoặc mã nghiệp vụ cụ thể; 429 `TOO_MANY_REQUESTS`; 503 `SERVICE_UNAVAILABLE`; 500 `INTERNAL_ERROR`.
- API auth dùng cookie `pharmacy_session` HttpOnly/SameSite=Lax/Path=`/api/v1`, token ngẫu nhiên 32 byte, session hash SHA-256 trong PostgreSQL, hết hạn sau 8 giờ. Không có refresh token; cookie Secure trong production.
- POST/PUT/PATCH/DELETE yêu cầu Origin khớp `FRONTEND_ORIGIN`; khi thiếu Origin chỉ chấp nhận Referer cùng origin. CORS không thay bước kiểm tra nguồn.
- Mọi API nghiệp vụ yêu cầu xác thực. Vai trò liệt kê bên dưới là quyền tối thiểu; một tài khoản có thể được gán thêm vai trò.

## Danh sách endpoint dự kiến

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Kiểm tra | GET /health | Liveness; không trả thông tin bí mật |
| Tài khoản | POST /auth/login; POST /auth/logout; GET /auth/me | Login/logout Public nhưng vẫn kiểm tra nguồn; me cần session |
| Nhân viên | GET/POST /users; PATCH /users/:id; PUT /users/:id/roles | QUAN_LY (đã triển khai) |
| Vai trò | GET /roles | QUAN_LY (đã triển khai; ba vai trò cố định) |
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

`prescriptionId: null` là hợp lệ cho hóa đơn không kê đơn. Khi có bất kỳ thuốc bắt buộc kê đơn, backend phải từ chối xác nhận nếu thiếu đơn hợp lệ và thông tin nhân viên kiểm tra. Một đơn có thể còn nhiều hóa đơn lịch sử nhưng chỉ tối đa một hóa đơn chưa hủy; hóa đơn nháp đã hủy giữ liên kết để tra cứu và cho phép tạo hóa đơn mới dùng lại đơn đó. Quy tắc này được cưỡng chế bằng partial unique index trong PostgreSQL.

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
  "lotIds": [1, 2]
}
```

Server tạo phiếu nháp và chụp tồn/version/thời điểm cho các lô; `actualQuantity` ban đầu là `null`. Sau khi đếm, `PATCH /stocktakes/:id` nhận `{ "items": [{ "itemId": 1, "actualQuantity": 89, "reason": "Chênh lệch cần đối chiếu" }] }`. Client không gửi/sửa `lotId`, `systemQuantity`, `recordedVersion` hoặc `recordedAt`. Chỉ gửi duyệt khi mọi dòng đã đếm; `0` hợp lệ. Duyệt kiểm tra version và điều chỉnh tồn trong cùng transaction. Biến động sau snapshot yêu cầu snapshot và lần đếm mới; không ghép số đếm cũ với version mới. API kiểm kê chưa triển khai; contract này được giao Người 2.

## Xác nhận chứng từ

- Request confirm không được tự áp đặt tồn cuối hay tổng tiền.
- Backend đọc lại chứng từ và dữ liệu cần thiết trong transaction.
- Yêu cầu confirm lặp hoặc đồng thời không tạo xuất/nhập lần hai; nếu chứng từ đã hoàn tất thì trả lại trạng thái/kết quả hiện có theo hợp đồng idempotency sẽ chốt.
- Trạng thái terminal không được sửa bằng API PATCH chung.
- Sửa thông tin đơn cần vô hiệu hóa lần kiểm tra cũ nếu nội dung ảnh hưởng nghiệp vụ; quy tắc vẫn để Người 3 chốt trước khi code.
- Xung đột tồn hoặc phiên bản kiểm kê trả 409 với mã lỗi ổn định, dự kiến `INSUFFICIENT_STOCK`, `INVENTORY_CONFLICT` hoặc `STOCKTAKE_STALE`; danh sách mã cần review trước khi frontend phụ thuộc.
- Xác nhận nhập, bán và duyệt kiểm kê dùng transaction `Serializable`. Xung đột serialization/deadlock được retry có giới hạn; mỗi lần retry chạy lại toàn bộ callback transaction.
- Callback transaction không chờ người dùng hoặc gọi dịch vụ bên ngoài. Mọi dữ liệu cần từ bên ngoài transaction phải được chuẩn bị trước nhưng trạng thái chứng từ, tồn và version vẫn phải đọc/kiểm tra lại bên trong.

## Sales và inventory

Người 2 sở hữu xử lý tồn, Người 3 điều phối hoàn tất hóa đơn. Cùng dùng một Prisma transaction context. Inventory không tự commit một transaction độc lập khiến hóa đơn thất bại nhưng tồn đã bị trừ; sales không cập nhật trực tiếp bảng lô. Chữ ký phương thức nội bộ và chính sách chọn lô được hai người chốt trong task `docs/api-contracts` theo các bất biến tại tài liệu 03.

## API auth/users/roles đã triển khai

Tất cả đường dẫn có prefix `/api/v1`. Current user có dạng:

```json
{
  "accountId": 1,
  "employeeId": 1,
  "username": "manager.demo",
  "name": "Quản lý demo",
  "roles": ["QUAN_LY"]
}
```

- `POST /auth/login`: `{ "username": "manager.demo", "password": "..." }` → `200 { "data": CurrentUser }` và Set-Cookie. Username được trim/lowercase. Sai username/mật khẩu, tài khoản khóa hoặc nhân viên nghỉ đều trả `401 INVALID_CREDENTIALS`.
- `GET /auth/me`: cần cookie hợp lệ → `200 { "data": CurrentUser }`; trạng thái tài khoản/nhân viên/vai trò được đọc từ CSDL ở từng request.
- `POST /auth/logout`: Origin/Referer hợp lệ, cookie tùy chọn → `200 { "data": { "success": true } }`; lặp lại vẫn thành công và clear cùng cookie Path.
- `GET /roles`: chỉ `QUAN_LY` → `{ "data": [{ "code": "BAN_THUOC", "label": "Bán thuốc" }, { "code": "QUAN_LY_KHO", "label": "Quản lý kho" }, { "code": "QUAN_LY", "label": "Quản lý" }] }`.
- `GET /users?page=1&pageSize=20&search=`: chỉ `QUAN_LY`; ID sắp giảm dần, pageSize tối đa 100; trả `{ "data": EmployeeView[], "meta": { "page", "pageSize", "total", "totalPages" } }`.
- `POST /users`: `{ "name", "phone", "username", "password", "roles" }` → 201 và EmployeeView; Employee, Account, vai trò được tạo cùng transaction. `USERNAME_TAKEN` trả 409.
- `PATCH /users/:employeeId`: cho phép `name`, `phone`, `isWorking`, `isActive`; chỉ phone nhận null; cần ít nhất một field. Khóa account hoặc cho nhân viên nghỉ thu hồi session cùng transaction.
- `PUT /users/:employeeId/roles`: `{ "roles": ["BAN_THUOC", "QUAN_LY_KHO"] }` thay toàn bộ vai trò. Cả hai endpoint sửa/trả `EmployeeView` với nested account `{ id, username, isActive, roles }`; không trả password hash/session token.
- Thay đổi khiến không còn quản lý hoạt động trả 409 `LAST_ACTIVE_MANAGER`; employee không có account khi cần sửa account/vai trò trả 409 `ACCOUNT_NOT_FOUND`.
- Nhân viên có thể không có account trong schema và list trả `account: null`; đợt này chưa có endpoint gắn account vào nhân viên cũ, xóa nhân viên/account, sửa username hay đổi mật khẩu.
