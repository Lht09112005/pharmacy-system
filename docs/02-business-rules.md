# 02 — Nghiệp vụ và quy tắc dùng chung

Đây là mô hình nghiệp vụ của đồ án, không phải đặc tả triển khai pháp lý đầy đủ cho nhà thuốc thực tế.

## Quy trình

### Nhập thuốc

Tiếp nhận hàng → kiểm tra hàng thực nhận → ghi nhận sai lệch nếu có → chọn nhà cung cấp và tạo phiếu → nhập thuốc, số lô dự kiến, hạn, số lượng, giá → kiểm tra dữ liệu → lưu nháp hoặc xác nhận. Chi tiết nháp giữ thông tin lô dự kiến nhưng chưa tạo hoặc tăng tồn. Khi xác nhận, backend tìm hoặc tạo lô theo thuốc + số lô + hạn sử dụng, gắn chi tiết với lô, lưu phiếu và tăng tồn trong một transaction.

### Bán không kê đơn

Tiếp nhận nhu cầu → tra cứu/tư vấn → chọn thuốc không kê đơn → nhập số lượng → kiểm tra tồn còn hạn → tính tiền → xác nhận giao dịch → giao thuốc. Nếu cần đơn hoặc cần khám, chuyển sang quy trình phù hợp hoặc dừng bán. Lưu ghi chú tư vấn nếu cần.

### Bán theo đơn

Nhận và kiểm tra đơn → ghi người bệnh, người kê, ngày kê, các dòng thuốc → đối chiếu thuốc bán → kiểm tra tồn → lập hóa đơn gắn với đơn → xác nhận → xuất lô. Thiếu đơn hoặc đơn cần làm rõ thì chưa hoàn tất phần thuốc cần đơn.

### Kiểm kê

Tạo phiếu nháp từ các lô đã chọn → server chụp số lượng/version/thời điểm của từng lô trước khi đếm → ghi số thực tế và lý do chênh lệch → gửi quản lý → kiểm tra lại biến động tồn → duyệt hoặc yêu cầu rà soát. Dòng mới có `actualQuantity = NULL`; khi ghi số thực tế, `0` là giá trị hợp lệ. Client không tự gửi/sửa các trường snapshot. Chỉ duyệt mới điều chỉnh tồn.

### Báo cáo và cảnh báo

Tồn có thể bán loại trừ lô hết hạn. Cảnh báo tồn thấp so sánh với ngưỡng từng thuốc. Gần hết hạn dùng ngưỡng số ngày cấu hình. Doanh thu chỉ tính hóa đơn hoàn tất; nhập–xuất–tồn tính các giao dịch đã xác nhận và điều chỉnh đã duyệt.

## Ràng buộc

| Mã | Quy tắc |
|---|---|
| BR01 | Mỗi thuốc có thuộc tính cần đơn hay không. |
| BR02 | Hóa đơn chứa thuốc cần đơn phải có đơn và thông tin nhân viên kiểm tra. |
| BR03 | Một đơn gắn tối đa một hóa đơn chưa hủy. Hóa đơn nháp đã hủy giữ liên kết lịch sử và có thể được thay bằng hóa đơn mới; chưa hỗ trợ nhiều hóa đơn hoàn tất trên cùng đơn. |
| BR04 | Thuốc có nhiều lô; từng lô có hạn và tồn riêng. |
| BR05 | Không bán lô hết hạn hoặc vượt số lượng khả dụng. |
| BR06 | Một dòng hóa đơn có thể xuất nhiều lô; tổng xuất lô bằng lượng bán. |
| BR07 | Lô xuất phải thuộc đúng thuốc trên dòng hóa đơn. |
| BR08 | Giá giao dịch được lưu tại chi tiết; sửa giá danh mục không làm đổi hóa đơn cũ. |
| BR09 | Xác nhận phiếu/hóa đơn hoặc duyệt kiểm kê lặp không cập nhật tồn thêm lần nữa. |
| BR10 | Lưu chứng từ và thay đổi tồn cùng transaction; lỗi thì hoàn tác toàn bộ. |
| BR11 | Quyền được kiểm tra ở backend, không chỉ ẩn menu. |
| BR12 | Không xóa vật lý dữ liệu đã được tham chiếu trong giao dịch. |
| BR13 | Đơn được nhân viên kiểm tra chuyên môn; hệ thống không tự kê hoặc tự đổi thuốc. |
| BR14 | Nếu tồn thay đổi sau lúc kiểm kê, phải rà soát trước khi duyệt. |
| BR15 | Tiền không âm; lượng nhập/bán/xuất > 0; tồn và thực tế kiểm kê >= 0. |
| BR16 | Transaction xác nhận nhập, bán và duyệt kiểm kê dùng `Serializable`; xung đột được retry có giới hạn và mỗi lần retry chạy lại toàn bộ transaction. |
| BR17 | Transaction không chứa bước chờ người dùng hoặc gọi dịch vụ bên ngoài. `Serializable` không thay thế kiểm tra trạng thái, tồn, version và các quy tắc nghiệp vụ. |
| BR18 | Lô có `version` tăng mỗi lần tồn thay đổi. Duyệt kiểm kê phải kiểm tra version đã ghi và cập nhật tồn trong cùng transaction; khác version thì chuyển kiểm tra lại. |
| BR19 | Chứng từ lưu thời gian tạo, cập nhật và hoàn tất bằng `TIMESTAMPTZ`; báo cáo hoàn tất dùng thời điểm hoàn tất theo `Asia/Ho_Chi_Minh`. |

## Trạng thái thống nhất cho thiết kế

- Phiếu nhập/hóa đơn: NHAP → HOAN_TAT hoặc NHAP → DA_HUY.
- Không hủy trực tiếp chứng từ HOAN_TAT trong bản đầu.
- Kiểm kê: NHAP → CHO_DUYET → DA_DUYET; hoặc CHO_DUYET → KIEM_TRA_LAI → NHAP.
- Chứng từ nháp có thể rỗng; khi hoàn tất phải có ít nhất một dòng.

## Quy trình kiểm kê được giao Người 2 triển khai

1. `POST /stocktakes` nhận `{ "lotIds": [1, 2] }`. Server tạo phiếu nháp và lưu `systemQuantity`, `recordedVersion`, `recordedAt` cho mỗi lô trong một lần chụp; `actualQuantity` bắt đầu là `NULL`.
2. `PATCH /stocktakes/:id` nhận các dòng `{ "itemId": 1, "actualQuantity": 89, "reason": "..." }`. Client không gửi `lotId`, `systemQuantity`, `recordedVersion` hoặc `recordedAt` để sửa snapshot.
3. Chỉ gửi duyệt khi tất cả dòng đã có actual quantity. `0` là số đếm hợp lệ và khác `NULL` (chưa đếm).
4. Khi duyệt, so sánh snapshot version với version hiện tại và điều chỉnh tồn trong cùng transaction. Biến động xảy ra sau snapshot, kể cả lúc đang đếm, phải chuyển yêu cầu sang kiểm tra lại.
5. Kiểm tra lại phải tạo snapshot và lần đếm mới; không được giữ số đếm cũ rồi gắn version mới.

## Các điểm còn mở trước nghiệp vụ tương ứng

- Thu tiền/thời điểm hoàn tất và cách xử lý khách đổi ý vẫn để Người 3 chốt khi làm checkout.
- Hạn dùng đầu/cuối ngày nghiệp vụ `Asia/Ho_Chi_Minh` vẫn để Người 2/3 chốt khi làm lô/tồn.
- Quy tắc vô hiệu lần kiểm tra đơn sau khi sửa nội dung vẫn để Người 3 chốt.

## Kiểm tra chấp nhận

1. Nhập 100, bán 10, tồn còn 90.
2. Thiếu tồn, lô hết hạn hoặc thiếu đơn bắt buộc: không hoàn tất.
3. Hai lượt bán đồng thời: không âm tồn.
4. Xác nhận lặp: chỉ có một lần cập nhật tồn.
5. Bán 10 từ hai lô 6+4: tổng xuất đúng 10.
6. Lỗi ở bước lưu cuối: không có thay đổi tồn/chứng từ dở dang.
7. Kiểm kê đang chờ duyệt có biến động: yêu cầu rà soát.
8. Báo cáo bỏ phiếu nháp/hủy và khớp dữ liệu chi tiết.
9. Lưu phiếu nhập nháp: chưa tạo lô tồn hoặc tăng tồn; xác nhận mới gắn/tạo lô và tăng đúng một lần.
10. Gây xung đột serialization: retry chạy lại toàn bộ transaction trong giới hạn và kết quả cuối không cập nhật tồn trùng.
11. Báo cáo theo ngày dùng thời điểm hoàn tất quy đổi sang `Asia/Ho_Chi_Minh`, không dùng thời điểm tạo nháp.
