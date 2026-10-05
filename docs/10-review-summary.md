# 10 — Tổng hợp rà soát trước khi khởi tạo

Ngày rà soát: 30/09/2026. Tài liệu này tổng hợp trạng thái hiện tại; chi tiết nghiệp vụ, dữ liệu và API lần lượt nằm ở tài liệu 02–04.

## Nội dung đã chốt

- Phạm vi là một nhà thuốc, bán trực tiếp tại quầy. Bao gồm tài khoản/phân quyền, thuốc, nhà cung cấp, nhập theo lô, tồn và hạn dùng, kiểm kê/cảnh báo, khách hàng, đơn thuốc, bán hàng, hóa đơn và báo cáo.
- Không bao gồm nhiều chi nhánh, giao hàng, thanh toán trực tuyến, công nợ, trả hàng sau bán, bảo hiểm, liên thông đơn điện tử hoặc hệ thống tự kê đơn.
- Actor đăng nhập: `BAN_THUOC`, `QUAN_LY_KHO`, `QUAN_LY`; một tài khoản có thể có nhiều vai trò. Khách hàng, nhà cung cấp và người kê đơn không đăng nhập.
- Công nghệ: Next.js, NestJS, TypeScript, PostgreSQL và Prisma. Mỗi thành viên có PostgreSQL cục bộ riêng; schema và dữ liệu mẫu được thống nhất bằng migration/seed dùng chung.
- Người 1 điều phối dự án, cấu hình chung, CSDL, tài khoản/phân quyền; Người 2 phụ trách thuốc, nhà cung cấp, nhập/tồn/kiểm kê/cảnh báo; Người 3 phụ trách khách hàng, đơn thuốc, bán hàng, hóa đơn/báo cáo.
- Thuốc có nhiều lô và tồn theo từng lô. Một dòng hóa đơn có thể được phân bổ từ nhiều lô; tổng phân bổ phải bằng lượng bán và mọi lô phải thuộc đúng thuốc.
- Một đơn thuốc gắn tối đa một hóa đơn trong bản đầu. Hóa đơn không kê đơn được phép không có đơn thuốc.
- Giá giao dịch dùng số thập phân chính xác và được lưu ở dòng chứng từ. Backend tính tổng; thay đổi giá danh mục không sửa lịch sử.
- Mỗi thuốc dùng một đơn vị quản lý thống nhất; bản đầu chưa quy đổi hộp–vỉ–viên.
- Xác nhận nhập/bán và duyệt kiểm kê dùng transaction `Serializable`; retry xung đột có giới hạn chạy lại toàn bộ transaction. Transaction không chờ người dùng hoặc gọi dịch vụ ngoài, và vẫn phải kiểm tra đầy đủ trạng thái/tồn/version.
- Lô có `version` tăng mỗi lần tồn thay đổi; dòng kiểm kê lưu version lúc ghi nhận và phải kiểm tra lại trong transaction duyệt.
- Chứng từ phân biệt thời gian tạo, cập nhật và hoàn tất bằng `TIMESTAMPTZ`; báo cáo hoàn tất xác định ngày theo `Asia/Ho_Chi_Minh`.
- Phiếu nhập nháp chỉ lưu thông tin lô dự kiến. Xác nhận mới tìm/tạo lô, gắn chi tiết và tăng tồn/version trong cùng transaction.

## Đối chiếu và hướng xử lý

| Điểm rà soát | Kết quả/hướng xử lý |
|---|---|
| Tài liệu từng ghi CSDL/ORM chưa chọn | Đã thống nhất thành PostgreSQL/Prisma trong README, tổng quan, thiết kế CSDL, hướng dẫn, prompt và nhật ký quyết định. |
| Câu “Tồn có thể bán loại lô hết hạn” gây đảo nghĩa | Đã sửa thành tồn bán được **loại trừ** lô hết hạn. |
| THUOC–LO_THUOC và bán từ nhiều lô | Schema và ERD đã có quan hệ 1–N và bảng CT_XUAT_LO; bổ sung bất biến transaction, unique và kiểm tra đúng thuốc. |
| Payload nhập và CT_PHIEU_NHAP | Đã điều chỉnh schema: dòng nháp lưu thuốc/số lô/hạn dự kiến và `ma_lo` nullable; xác nhận tìm/tạo lô theo bộ ba, gắn FK rồi tăng tồn. |
| Đơn thuốc–hóa đơn | `HOA_DON.ma_don` nullable + unique phù hợp PostgreSQL: nhiều hóa đơn không kê đơn có NULL, mỗi đơn tối đa một hóa đơn. Việc tái dùng đơn sau khi hủy nháp vẫn cần quyết định vì ảnh hưởng loại unique index. |
| Tiền | Chuyển thành quy ước PostgreSQL `DECIMAL`/Prisma `Decimal` và chuỗi thập phân ở API; precision, tiền tệ và làm tròn còn mở. |
| Xác nhận lặp và bán đồng thời | Đã chốt `Serializable`, retry toàn bộ có giới hạn, cập nhật có điều kiện và kiểm tra nghiệp vụ trong transaction. |
| Kiểm kê có biến động | Đã chốt `version` trên lô và version ghi nhận ở chi tiết kiểm kê; lệch version thì yêu cầu kiểm tra lại. |
| Báo cáo theo thời gian | Đã chốt timestamp tạo/cập nhật/hoàn tất bằng `TIMESTAMPTZ` và ngày báo cáo theo `Asia/Ho_Chi_Minh`. |
| ERD thiếu quan hệ nhân viên kiểm tra/duyệt | Đã bổ sung quan hệ NHAN_VIEN–DON_THUOC và NHAN_VIEN–PHIEU_KIEM_KE. |
| API | Vẫn là hợp đồng **đề xuất**, chưa phải yêu cầu cuối hoặc API đã triển khai. Đã làm rõ decimal, đơn nullable, 409 xung đột và transaction sales–inventory. |

## Cấu trúc dự án đã khởi tạo

Bộ khung dùng `frontend/src/app` và `frontend/src/features/<feature>` cho giao diện/logic theo chức năng; `backend/src/modules/<module>` cho NestJS; `backend/prisma` do Người 1 điều phối. Phần dùng chung đặt ở `frontend/src/components`, `frontend/src/lib`, `backend/src/common`, `backend/src/config`, `backend/src/prisma`; không đưa nghiệp vụ riêng vào thư mục chung.

Ranh giới quan trọng: Người 2 cung cấp giao diện nghiệp vụ inventory nhận Prisma transaction context; Người 3 gọi giao diện đó khi hoàn tất sales, không tự cập nhật lô và inventory không tự commit transaction con. Cách chia sẻ contract frontend/backend chưa chốt.

## Quyết định còn mở trước migration/module liên quan

1. **ID và tên vật lý:** Prisma `Int` hay `BigInt`, quy ước `@map`/`@@map`. Đề xuất `Int` cho quy mô đồ án và thống nhất một quy ước tên trước migration đầu.
2. **Tiền:** tiền tệ, precision/scale và cách làm tròn. Đề xuất VND với scale phù hợp dữ liệu demo; không chốt `DECIMAL(12,2)` chỉ vì bản nháp đang ghi như vậy.
3. **Hạn dùng:** lô được coi hết hạn từ đầu hay cuối ngày nghiệp vụ `Asia/Ho_Chi_Minh`.
4. **Đơn/hóa đơn:** đơn gắn hóa đơn nháp đã hủy có được tái dùng; sửa đơn khi nào làm mất trạng thái đã kiểm tra; có cần liên kết từng dòng bán với dòng đơn. Các lựa chọn này ảnh hưởng unique index và schema.
5. **Hoàn tất bán:** thời điểm thu tiền, xử lý khách đổi ý trước hoàn tất, chính sách chọn lô. Đề xuất FEFO cho lô còn hạn, có quy tắc phụ ổn định khi cùng hạn.
6. **Xác thực:** cookie session hay token, cách logout/thu hồi khi khóa tài khoản. Bộ khung chưa triển khai hoặc tự chọn cơ chế này.
7. **Contract chia sẻ:** OpenAPI sinh kiểu hay package contracts. Bộ khung mới có kiểu health cục bộ; chưa tạo DTO nghiệp vụ trùng lặp.

Các đề xuất trên không được coi là quyết định đã duyệt cho đến khi được chuyển vào mục “Đã chốt” của tài liệu 08.
