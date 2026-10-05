# 01 — Tổng quan dự án

## Mục tiêu và phạm vi

Xây dựng ứng dụng web quản lý **một nhà thuốc**: thuốc, nhà cung cấp, nhập theo lô, tồn kho và hạn sử dụng, tư vấn/bán thuốc, đơn thuốc, hóa đơn, kiểm kê và báo cáo.

Phần mềm phục vụ bán trực tiếp tại quầy. Không bao gồm nhiều chi nhánh, giao hàng, thanh toán trực tuyến, công nợ, trả hàng sau bán, bảo hiểm y tế, liên thông đơn điện tử hoặc tự động kê đơn.

## Actor

| Vai trò | Công việc |
|---|---|
| BAN_THUOC | Tra cứu, tư vấn, kiểm tra đơn, lập và tra cứu hóa đơn. |
| QUAN_LY_KHO | Nhập thuốc, xem tồn và cảnh báo, lập kiểm kê. |
| QUAN_LY | Danh mục, tài khoản và vai trò, duyệt kiểm kê, báo cáo. |

Nhân viên bán thuốc đảm nhiệm công việc chuyên môn phù hợp; không tạo thêm actor riêng. Một tài khoản có thể có nhiều vai trò. Quyền quản lý không tự động bao gồm bán/kho trừ khi được gán thêm vai trò.
Khách hàng, nhà cung cấp và người kê đơn không đăng nhập phần mềm.

## Ba tình huống bán

1. Khách biết thuốc không kê đơn cần mua: tra cứu và lập hóa đơn.
2. Khách chưa có đơn cần tư vấn: nhân viên hỏi thông tin, chọn thuốc không kê đơn phù hợp hoặc hướng dẫn đi khám.
3. Khách có đơn: ghi nhận, kiểm tra đơn, đối chiếu thuốc, lập hóa đơn gắn với đơn.

Tư vấn tại quầy không tạo ra đơn kê thuốc. Phần mềm không tự đánh giá hoặc thay thế quyết định chuyên môn.

## Kiến trúc đã chọn

- Next.js: giao diện và tương tác người dùng.
- NestJS: API, xác thực, kiểm tra dữ liệu, nghiệp vụ, lưu trữ.
- TypeScript: ngôn ngữ chung.
- PostgreSQL: cơ sở dữ liệu quan hệ; mỗi thành viên dùng cơ sở dữ liệu cục bộ riêng.
- Prisma: ORM; cấu trúc cơ sở dữ liệu được đồng bộ bằng migration và dữ liệu mẫu dùng chung.
- Một repository có frontend/, backend/, docs/.
- Backend chia module auth, users, roles, medicines, suppliers, inventory, goods-receipts, stocktakes, customers, prescriptions, sales, reports.
- Auth/users/roles dùng PostgreSQL session cookie: token ngẫu nhiên nằm trong cookie HttpOnly, CSDL chỉ lưu SHA-256 hash; backend kiểm tra trạng thái account/employee và roles từ CSDL mỗi request. Origin/Referer được xác thực cho request ghi.
- Auth shell và trang quản lý nhân viên đã dùng API thật; các màn hình nghiệp vụ khác giữ trạng thái “Đang phát triển”.

## Kết quả bản đầu

Đăng nhập → tạo thuốc/nhà cung cấp → nhập lô → bán thuốc → trừ tồn → kiểm kê và duyệt → xem báo cáo. Kèm sơ đồ, thiết kế CSDL và tài liệu triển khai trong báo cáo môn học.

## Các điểm nghiệp vụ còn mở

FEFO/tie-break, ngưỡng và thời điểm hết hạn trong ngày, thời điểm thu tiền, đối chiếu dòng bán–đơn và quy tắc sửa đơn đã kiểm tra vẫn để thành viên sở hữu nghiệp vụ chốt trước khi triển khai phần liên quan. Quyết định session, ID, tiền và partial unique được ghi trong `docs/08-decisions.md` theo chỉ đạo triển khai của Người 1; điều này không hàm ý cả nhóm đã họp/duyệt.
