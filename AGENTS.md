# Hướng dẫn cho AI và người phát triển

## Đọc trước khi sửa

1. README.md.
2. docs/01-project-overview.md và docs/02-business-rules.md.
3. docs/08-decisions.md để phân biệt đã chốt với đề xuất.
4. Tài liệu CSDL/API/task liên quan.

## Phạm vi và công nghệ

Một nhà thuốc; Next.js, NestJS, TypeScript, PostgreSQL và Prisma. Không tự thêm công nợ, hoàn trả, nhiều chi nhánh hoặc tự kê đơn. Cơ chế xác thực và các lựa chọn còn mở chỉ được coi đã chọn khi nhật ký quyết định có nội dung rõ.

## Quyền sở hữu

Người 1 điều phối schema/migrations, cấu hình gốc, thư viện/lockfile và layout chung. Người 2 quản lý tồn kho. Người 3 phụ trách bán hàng và dùng xử lý inventory chung. Thay đổi liên module cần nêu tác động và phối hợp.

## Thực hiện task

- Đọc mã hiện tại trước khi thêm mới; dùng quy ước và thư viện sẵn có.
- Làm đúng issue, giữ thay đổi tập trung và có thể review.
- Đánh dấu màn hình chưa làm; không tạo API giả trả thành công nghiệp vụ.
- Không sửa/xóa migration đã dùng chung, reset dữ liệu hoặc che lỗi bằng dữ liệu giả.
- Giá/tổng tiền, nhân viên thao tác, trạng thái và quyền được kiểm tra ở server.
- Xác nhận nhập/bán và duyệt kiểm kê cùng transaction `Serializable`; retry xung đột có giới hạn phải chạy lại toàn bộ transaction. Không chờ người dùng hoặc gọi dịch vụ ngoài trong transaction; vẫn kiểm tra trạng thái, tồn, version và xác nhận lặp.
- Không đưa secrets, .env hoặc dữ liệu người bệnh thật vào Git.
- Kiểm tra cần thiết cho phần thay đổi; nói rõ việc đã chạy và việc chưa chạy.
- Cập nhật docs khi thay đổi schema/API/nghiệp vụ.
- Không tự commit/push/merge khi chưa được yêu cầu. Khi đã được người dùng giao rõ thao tác đó thì thực hiện theo phạm vi được giao.
