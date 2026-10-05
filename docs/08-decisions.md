# 08 — Nhật ký quyết định

Ngày tổng hợp: 30/09/2026. “Đã chốt” phản ánh phạm vi/công nghệ đã được xác nhận; “Đề xuất” chưa phải lựa chọn cuối cùng.

## Đã chốt

| Mã | Quyết định |
|---|---|
| D01 | Một nhà thuốc; ba vai trò: bán thuốc, kho, quản lý. |
| D02 | Nhân viên bán thuốc trực tiếp làm chuyên môn; không thêm actor chuyên môn riêng. |
| D03 | Next.js frontend, NestJS backend, TypeScript. |
| D04 | Nhóm 3 người; Người 1 quản lý dự án/điều phối. |
| D05 | Người 2 phụ trách thuốc/kho; Người 3 phụ trách bán hàng. |
| D06 | Quản lý thuốc theo lô, hạn sử dụng; một dòng bán có thể xuất nhiều lô. |
| D07 | Một đơn gắn tối đa một hóa đơn trong bản đầu; hóa đơn không kê đơn được phép không gắn đơn. |
| D08 | Băm mật khẩu; kiểm tra quyền ở backend; chứng từ/tồn cùng transaction; xác nhận lặp không cập nhật tồn hai lần. |
| D09 | CSDL PostgreSQL và ORM Prisma. |
| D10 | Mỗi thành viên dùng PostgreSQL cục bộ riêng; thống nhất cấu trúc bằng Prisma migration và dữ liệu mẫu dùng chung. |
| D11 | PostgreSQL dùng `DECIMAL/NUMERIC`, Prisma dùng `Decimal`, API truyền tiền bằng chuỗi thập phân; backend tính tổng và không tin tổng từ frontend. |
| D12 | Phải kiểm soát bán đồng thời để tồn không âm và phát hiện biến động tồn trong lúc kiểm kê chờ duyệt. |
| D13 | Mỗi thuốc dùng một đơn vị quản lý thống nhất; bản đầu chưa quy đổi hộp–vỉ–viên. |
| D14 | Transaction cập nhật tồn dùng mức cô lập PostgreSQL `Serializable` và retry có giới hạn; mỗi lần retry chạy lại toàn bộ transaction. Transaction không chờ người dùng hoặc gọi dịch vụ ngoài. Vẫn phải kiểm tra trạng thái chứng từ, tồn và chống xác nhận lặp. |
| D15 | LO_THUOC có trường `version`, tăng mỗi lần tồn thay đổi. CT_KIEM_KE lưu version lúc ghi nhận; kiểm tra version và điều chỉnh tồn nằm trong cùng transaction, version lệch thì yêu cầu kiểm tra lại. |
| D16 | Chứng từ phân biệt thời gian tạo, cập nhật, hoàn tất bằng `TIMESTAMPTZ`. Báo cáo giao dịch hoàn tất dùng thời điểm hoàn tất và xác định ngày theo `Asia/Ho_Chi_Minh`. |
| D17 | Chi tiết phiếu nhập nháp lưu thuốc, số lô và hạn dùng dự kiến nhưng chưa tạo tồn. Khi xác nhận, tìm hoặc tạo lô theo bộ ba này, gắn chi tiết với lô và tăng tồn trong cùng transaction. |
| D18 | Một repository gồm `frontend/`, `backend/`, `docs/`; dùng npm và lưu `package-lock.json` riêng cho hai ứng dụng. Frontend tổ chức theo App Router/feature, backend theo NestJS module; không có Git repository lồng. |
| D19 | Bộ khung dùng prefix `/api/v1`, tài nguyên tiếng Anh và JSON camelCase. Health API là API hạ tầng; các API nghiệp vụ trong tài liệu 04 vẫn cần review trước khi triển khai. |
| D20 | Phiên bản bộ khung: Next.js 16.3.7, React 19.2.8, NestJS 12.1.1, Prisma 6.12.0, PostgreSQL image `17-alpine`, npm 11.9.0. Yêu cầu Node.js `^22.22.3` hoặc `>=24.15.0`; máy khởi tạo dùng 24.14.0 và có cảnh báo engine dù build thành công. |
| D21 | Bộ khung dùng CSS thuần, chưa chọn thư viện UI. Xác thực/phiên chưa triển khai và vẫn thuộc task riêng; không tự mặc định token hoặc session. |

## Đề xuất cần nhóm xác nhận

| Mã | Nội dung | Người điều phối |
|---|---|---|
| P04 | Nội dung đơn lưu nguyên văn, ánh xạ ma_thuoc tùy chọn. | Người 1 + Người 3 |

## Còn mở trước code phụ thuộc

- [ ] Cookie session hay token, cách logout và khóa phiên: ____________________
- [ ] Thư viện giao diện: ____________________
- [ ] Cách chia sẻ kiểu/hợp đồng API giữa frontend và backend (OpenAPI sinh kiểu hay package contracts): ____________________
- [ ] Kiểu ID Prisma/PostgreSQL (`Int` hay `BigInt`) và quy ước tên bảng/cột vật lý: ____________________
- [ ] Số chữ số thập phân, tiền tệ và quy tắc làm tròn giá/tổng: ____________________
- [ ] Ngưỡng cảnh báo gần hết hạn và quy ước hết hạn theo ngày: ____________________
- [ ] Đơn gắn hóa đơn nháp đã hủy có được dùng lại không: ____________________
- [ ] Thu tiền trước/sau hoàn tất; xử lý khách đổi ý trước giao dịch: ____________________
- [ ] Chính sách chọn lô khi bán (đề xuất FEFO; cách xử lý các lô cùng hạn): ____________________
- [ ] Có cần liên kết từng dòng hóa đơn với dòng đơn thuốc để đối chiếu hay chỉ kiểm tra ở service: ____________________
- [ ] Quy tắc vô hiệu hóa lần kiểm tra đơn sau khi sửa nội dung: ____________________
- [ ] Ngày nộp, tên thành viên và thời hạn từng mốc: ____________________

AI được chuẩn bị công việc độc lập nhưng không được tự coi ô còn trống là quyết định đã được nhóm phê duyệt. Khi chốt, ghi người quyết định, ngày và lý do; cập nhật tài liệu/API/schema liên quan.
