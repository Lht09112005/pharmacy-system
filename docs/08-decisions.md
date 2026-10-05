# 08 — Nhật ký quyết định

Ngày tổng hợp: 30/09/2026. “Đã chốt” phản ánh phạm vi/công nghệ đã được xác nhận; “Đề xuất” chưa phải lựa chọn cuối cùng.

## Đã chốt trước đó

D01–D20 là các quyết định nhóm đã ghi nhận trong nhật ký 30/09/2026.

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
| D19 | API dùng prefix `/api/v1`, tài nguyên tiếng Anh và JSON camelCase. Health API là API hạ tầng; các API nghiệp vụ trong tài liệu 04 vẫn cần review trước khi triển khai. |
| D20 | Phiên bản bộ khung: Next.js 16.3.7, React 19.2.8, NestJS 12.1.1, Prisma 6.12.0, PostgreSQL image `17-alpine`, npm 11.9.0. Yêu cầu Node.js `^22.22.3` hoặc `>=24.15.0`; máy khởi tạo dùng 24.14.0 và có cảnh báo engine dù build thành công. |

## Quyết định áp dụng trong lần triển khai của Người 1

Các quyết định dưới đây là mặc định do **Người 1 giao triển khai theo prompt ngày 05/10/2026**. Nguồn này không đại diện cho một cuộc họp hoặc phê duyệt của cả nhóm.

| Mã | Quyết định |
|---|---|
| D21 | Bộ khung dùng CSS thuần; tiếp tục dùng CSS hiện có. |
| D22 | Khóa chính dùng Prisma `Int` tự tăng; version tồn dùng `BigInt`. Model PascalCase/field camelCase ánh xạ bảng tiếng Việt viết hoa và cột snake_case theo thiết kế. |
| D23 | Tiền VND dùng `Decimal(14,2)` trong CSDL và chuỗi thập phân tại API; khi cần tính, làm tròn half-up 2 chữ số, không tính tiền bằng JavaScript `number`. |
| D24 | Ngày thuần dùng `DATE`; timestamp dùng `TIMESTAMPTZ(3)`. Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`. |
| D25 | Xác thực dùng cookie `pharmacy_session` HttpOnly, token ngẫu nhiên 32 byte; PostgreSQL chỉ lưu SHA-256 token. Phiên cố định 8 giờ, không gia hạn/refresh. |
| D26 | Mật khẩu dùng `node:crypto` scrypt bất đồng bộ với N=131072, r=8, p=1, maxmem=256 MiB, khóa 64 byte và salt ngẫu nhiên tối thiểu 16 byte. |
| D27 | Chỉ có vai trò `BAN_THUOC`, `QUAN_LY_KHO`, `QUAN_LY`; quyền là hợp các vai trò được gán. `QUAN_LY` không tự có quyền kho/bán. |
| D28 | Đơn thuốc giữ tên/hàm lượng/đơn vị nguyên bản, liên kết thuốc tùy chọn; lưu nhân viên và thời điểm kiểm tra. |
| D29 | Đơn thuốc có quan hệ lịch sử 1–N với hóa đơn; partial unique chỉ cho phép tối đa một hóa đơn chưa hủy trên một đơn. Hóa đơn nháp hủy giữ liên kết và có thể tạo hóa đơn mới; hóa đơn hoàn tất không hủy trong bản đầu. |
| D30 | Chi tiết kiểm kê lưu snapshot số lượng/version/thời điểm trước khi đếm; `actualQuantity=NULL` nghĩa là chưa đếm, 0 là số đếm hợp lệ. |
| D31 | Local/demo dùng một backend, frontend/backend cùng site; triển khai cross-site production chưa thuộc phạm vi. Cookie production cần HTTPS cùng site. |

Nguồn và ngày của D21–D31: Người 1 giao triển khai theo prompt, 05/10/2026.

## Đề xuất cần nhóm xác nhận

P04 về nội dung đơn nguyên bản/liên kết thuốc tùy chọn đã được chốt cho lần triển khai này tại D28; không đại diện quyết định của cả nhóm.

## Còn mở trước code phụ thuộc

- [x] Cookie session hay token, cách logout và khóa phiên: D25.
- [x] Thư viện giao diện: tiếp tục CSS thuần theo D21.
- [ ] Cách chia sẻ kiểu/hợp đồng API giữa frontend và backend (OpenAPI sinh kiểu hay package contracts): ____________________
- [x] Kiểu ID Prisma/PostgreSQL và tên vật lý: D22.
- [x] Precision, tiền tệ và quy tắc làm tròn: D23.
- [ ] Ngưỡng cảnh báo gần hết hạn và quy ước hết hạn theo ngày: ____________________
- [x] Đơn gắn hóa đơn nháp đã hủy có được dùng lại không: có, theo D29.
- [ ] Thu tiền trước/sau hoàn tất; xử lý khách đổi ý trước giao dịch: ____________________
- [ ] Chính sách chọn lô khi bán (đề xuất FEFO; cách xử lý các lô cùng hạn): ____________________
- [ ] Có cần liên kết từng dòng hóa đơn với dòng đơn thuốc để đối chiếu hay chỉ kiểm tra ở service: ____________________
- [ ] Quy tắc vô hiệu hóa lần kiểm tra đơn sau khi sửa nội dung: ____________________
- [ ] Ngày nộp, tên thành viên và thời hạn từng mốc: ____________________

Các mục đã đánh dấu được áp dụng theo chỉ đạo Người 1 ngày 05/10/2026; không hàm ý cả nhóm đã họp hoặc duyệt. Những mục còn trống tiếp tục mở; không tự chốt khi làm nghiệp vụ của Người 2/3.
