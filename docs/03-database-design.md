# 03 — Thiết kế cơ sở dữ liệu

Schema Prisma và migration PostgreSQL đầu đã được tạo trong `backend/prisma/`; migration cần được áp dụng riêng trên CSDL local/test bằng `prisma migrate deploy`. Mỗi thành viên dùng CSDL cục bộ riêng; không sửa/xóa migration đã chia sẻ.

Quy ước ánh xạ: khóa chính đơn dùng Prisma `Int` tự tăng; `BIGINT` chỉ dùng cho version; bảng nối tài khoản–vai trò dùng khóa ghép. Model PascalCase/field camelCase ánh xạ sang bảng tiếng Việt viết hoa/cột snake_case bằng `@@map`/`@map`. Tiền VND dùng PostgreSQL `DECIMAL(14,2)`/Prisma `Decimal`, API nhận/trả chuỗi thập phân; không tính bằng JavaScript `number`, làm tròn half-up 2 chữ số khi cần. Ngày thuần dùng `DATE`; timestamp dùng `TIMESTAMPTZ(3)`. Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`. Vai trò và trạng thái chứng từ được ràng buộc bằng PostgreSQL enum. FK bắt buộc trừ khi ghi `NULL`; FK lịch sử dùng `RESTRICT`, riêng bảng vai trò và session cascade theo tài khoản. Các `CHECK` và partial unique không biểu diễn được trong Prisma nằm trong migration SQL.

## NHAN_VIEN

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_nv | INT | PK |
| ho_ten | VARCHAR(100) | bắt buộc |
| sdt | VARCHAR(20) | NULL |
| dang_lam_viec | BOOLEAN | bắt buộc |

## TAI_KHOAN

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_tk | INT | PK |
| ma_nv | INT | FK NHAN_VIEN, UNIQUE |
| ten_dang_nhap | VARCHAR(50) | UNIQUE |
| mat_khau_hash | VARCHAR(255) | bắt buộc |
| hoat_dong | BOOLEAN | bắt buộc |

## VAI_TRO

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_vai_tro | INT | PK |
| ten_vai_tro | ENUM MA_VAI_TRO | UNIQUE; chỉ `BAN_THUOC`, `QUAN_LY_KHO`, `QUAN_LY` |

## TAI_KHOAN_VAI_TRO

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_tk | INT | PK ghép, FK TAI_KHOAN |
| ma_vai_tro | INT | PK ghép, FK VAI_TRO |

## THUOC

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_thuoc | INT | PK |
| ten_thuoc | VARCHAR(200) | bắt buộc |
| hoat_chat | VARCHAR(200) | NULL |
| ham_luong | VARCHAR(100) | NULL |
| dang_bao_che | VARCHAR(100) | NULL |
| don_vi_tinh | VARCHAR(50) | bắt buộc |
| gia_ban | DECIMAL(14,2) | >=0 |
| can_don | BOOLEAN | bắt buộc |
| nguong_canh_bao | INT | >=0 |
| dang_kinh_doanh | BOOLEAN | bắt buộc |

## LO_THUOC

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_lo | INT | PK |
| ma_thuoc | INT | FK THUOC |
| so_lo | VARCHAR(100) | bắt buộc |
| han_su_dung | DATE | bắt buộc |
| so_luong_ton | INT | >=0 |
| version | BIGINT | >=0, mặc định 0; tăng ở mọi thay đổi tồn đã commit |

## NHA_CUNG_CAP

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ncc | INT | PK |
| ten_ncc | VARCHAR(200) | bắt buộc |
| sdt | VARCHAR(20) | NULL |
| dia_chi | VARCHAR(255) | NULL |
| hoat_dong | BOOLEAN | bắt buộc |

## PHIEU_NHAP

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_pn | INT | PK |
| ma_ncc | INT | FK NHA_CUNG_CAP |
| ma_nv | INT | FK NHAN_VIEN |
| tao_luc | TIMESTAMPTZ | bắt buộc; thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | bắt buộc; thời điểm cập nhật gần nhất |
| hoan_tat_luc | TIMESTAMPTZ | NULL; chỉ ghi khi hoàn tất |
| tong_tien | DECIMAL(14,2) | >=0 |
| trang_thai | VARCHAR(20) | NHAP/HOAN_TAT/DA_HUY |

## CT_PHIEU_NHAP

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ct_nhap | INT | PK |
| ma_pn | INT | FK PHIEU_NHAP |
| ma_thuoc | INT | FK THUOC; thuốc dự kiến nhập |
| so_lo_du_kien | VARCHAR(100) | bắt buộc khi lưu nháp |
| han_su_dung_du_kien | DATE | bắt buộc khi lưu nháp |
| ma_lo | INT | FK LO_THUOC, NULL khi nháp; gắn khi hoàn tất |
| so_luong | INT | >0 |
| don_gia_nhap | DECIMAL(14,2) | >=0 |

## KHACH_HANG

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_kh | INT | PK |
| ho_ten | VARCHAR(100) | bắt buộc |
| sdt | VARCHAR(20) | NULL |

## DON_THUOC

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_don | INT | PK |
| ngay_ke | DATE | bắt buộc |
| nguoi_ke | VARCHAR(150) | bắt buộc |
| nguoi_benh | VARCHAR(255) | bắt buộc |
| nguoi_mua | VARCHAR(255) | NULL |
| anh_don | VARCHAR(500) | NULL |
| ma_nv_kiem_tra | INT | FK NHAN_VIEN, NULL |
| luc_kiem_tra | TIMESTAMPTZ | NULL |

## CT_DON_THUOC

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ct_don | INT | PK |
| ma_don | INT | FK DON_THUOC |
| ma_thuoc | INT | FK THUOC, NULL |
| ten_thuoc_tren_don | VARCHAR(200) | bắt buộc |
| ham_luong_tren_don | VARCHAR(100) | NULL |
| don_vi_tren_don | VARCHAR(50) | bắt buộc |
| so_luong_ke | INT | >0 |
| huong_dan | VARCHAR(255) | NULL |

## HOA_DON

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_hd | INT | PK |
| ma_nv | INT | FK NHAN_VIEN |
| ma_kh | INT | FK KHACH_HANG, NULL |
| ma_don | INT | FK DON_THUOC, NULL; partial unique trên hóa đơn chưa hủy |
| tao_luc | TIMESTAMPTZ | bắt buộc; thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | bắt buộc; thời điểm cập nhật gần nhất |
| hoan_tat_luc | TIMESTAMPTZ | NULL; chỉ ghi khi hoàn tất |
| ghi_chu_tu_van | TEXT | NULL |
| tong_tien | DECIMAL(14,2) | >=0 |
| trang_thai | VARCHAR(20) | NHAP/HOAN_TAT/DA_HUY |

## CT_HOA_DON

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ct_ban | INT | PK |
| ma_hd | INT | FK HOA_DON |
| ma_thuoc | INT | FK THUOC |
| so_luong | INT | >0 |
| don_gia_ban | DECIMAL(14,2) | >=0 |

## CT_XUAT_LO

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ct_xuat | INT | PK |
| ma_ct_ban | INT | FK CT_HOA_DON |
| ma_lo | INT | FK LO_THUOC |
| so_luong_xuat | INT | >0 |

## PHIEU_KIEM_KE

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_kk | INT | PK |
| ma_nguoi_lap | INT | FK NHAN_VIEN |
| ma_nguoi_duyet | INT | FK NHAN_VIEN, NULL |
| tao_luc | TIMESTAMPTZ | bắt buộc; thời điểm tạo |
| cap_nhat_luc | TIMESTAMPTZ | bắt buộc; thời điểm cập nhật gần nhất |
| hoan_tat_luc | TIMESTAMPTZ | NULL; thời điểm duyệt hoàn tất |
| trang_thai | VARCHAR(30) | NHAP/CHO_DUYET/DA_DUYET/KIEM_TRA_LAI |

## CT_KIEM_KE

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_ct_kk | INT | PK |
| ma_kk | INT | FK PHIEU_KIEM_KE |
| ma_lo | INT | FK LO_THUOC |
| so_luong_he_thong | INT | >=0 |
| version_ghi_nhan | BIGINT | >=0; LO_THUOC.version khi ghi số hệ thống |
| ghi_nhan_luc | TIMESTAMPTZ | bắt buộc; thời điểm ghi số hệ thống |
| so_luong_thuc_te | INT | NULL trước khi đếm; nếu có thì >=0; 0 là số đếm hợp lệ |
| ly_do | VARCHAR(255) | NULL khi chưa đếm/không lệch; bắt buộc khi đã đếm khác số hệ thống |

## PHIEN_DANG_NHAP

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ma_phien | INT | PK |
| ma_tk | INT | FK TAI_KHOAN, index; cascade khi tài khoản bị xóa |
| token_hash | VARCHAR(64) | UNIQUE; đúng 64 ký tự hex, không lưu token nguyên bản |
| tao_luc | TIMESTAMPTZ(3) | bắt buộc |
| het_han_luc | TIMESTAMPTZ(3) | bắt buộc; index |

## Quan hệ và ràng buộc bổ sung

- THUOC 1–N LO_THUOC. Lô được tìm/tạo theo UNIQUE (ma_thuoc, so_lo, han_su_dung).
- PHIEU_NHAP 1–N CT_PHIEU_NHAP. Dòng nháp bắt buộc có ma_thuoc, so_lo_du_kien, han_su_dung_du_kien và chưa bắt buộc có ma_lo.
- Khi xác nhận phiếu nhập, tìm hoặc tạo LO_THUOC theo (ma_thuoc, so_lo_du_kien, han_su_dung_du_kien), gắn ma_lo và tăng tồn/version trong cùng transaction. Lưu nháp không tạo tồn.
- Phiếu nhập `HOAN_TAT` bắt buộc mọi dòng có ma_lo; lô được gắn phải khớp thuốc, số lô và hạn dự kiến. Sau khi hoàn tất không được sửa các trường dự kiến hoặc ma_lo bằng API cập nhật chung.
- HOA_DON 1–N CT_HOA_DON; mỗi dòng có thể xuất nhiều lô qua CT_XUAT_LO.
- Tổng xuất của một dòng = số lượng bán; các lô phải thuộc đúng thuốc.
- DON_THUOC 1–N CT_DON_THUOC. Dòng đơn giữ nguyên tên/hàm lượng/đơn vị ghi trên đơn, FK thuốc tùy chọn.
- DON_THUOC và HOA_DON là quan hệ lịch sử 1–N: `HOA_DON.ma_don` nullable; partial unique `HOA_DON_ma_don_chua_huy_key` chỉ áp dụng khi `ma_don IS NOT NULL AND trang_thai <> 'DA_HUY'`. Hóa đơn hủy giữ liên kết lịch sử; có thể tạo hóa đơn mới cùng đơn. Nhiều hóa đơn không kê đơn vẫn hợp lệ.
- NHAN_VIEN 1–0..1 TAI_KHOAN; tài khoản có nhiều vai trò qua bảng nối.
- Không dùng giá hiện tại của THUOC để tính lại chứng từ cũ.
- Chỉ chứng từ hoàn tất mới có dữ liệu xuất thực tế. Hóa đơn nháp không bắt buộc có CT_XUAT_LO.
- UNIQUE (ma_ct_ban, ma_lo) và (ma_kk, ma_lo) đã có trong schema/migration.
- TAI_KHOAN_VAI_TRO có khóa ghép; role code và trạng thái được ràng buộc bằng enum PostgreSQL.
- AuthSession chứa token hash SHA-256 và hạn phiên 8 giờ; trạng thái account/employee/roles được đọc lại từ CSDL ở từng request.

## Bất biến transaction và đồng thời

Các bất biến đã chốt: lưu chứng từ và thay đổi tồn phải cùng một transaction; xác nhận lặp/đồng thời không thay đổi tồn hai lần; bán đồng thời không làm âm tồn; kiểm kê không được duyệt theo ảnh chụp tồn đã cũ. Bất kỳ lỗi nào khi hoàn tất phải rollback toàn bộ.

**Cơ chế đã chốt:**

- Dùng transaction PostgreSQL `Serializable` qua Prisma cho xác nhận nhập, bán và duyệt kiểm kê. Trong transaction, đọc lại dữ liệu/tính lại tổng, rồi chuyển trạng thái có điều kiện như hàng rào idempotency; chỉ transaction chuyển được trạng thái mới được đổi tồn. Lần gọi lặp trả kết quả hiện có và không đổi tồn/version lần nữa.
- Trừ từng lô bằng cập nhật nguyên tử có điều kiện `so_luong_ton >= so_luong_xuat`, xử lý lô theo thứ tự ổn định; một lô không cập nhật được thì rollback cả hóa đơn.
- Mọi cộng, trừ hoặc điều chỉnh tồn tăng LO_THUOC.version. Khi duyệt kiểm kê, kiểm tra version và cập nhật tồn trong cùng transaction; version khác `version_ghi_nhan` thì chuyển `KIEM_TRA_LAI` và không áp dụng số liệu cũ.
- Retry có giới hạn cho xung đột serialization/deadlock; mỗi lần retry chạy lại toàn bộ transaction từ đầu. Không retry lỗi nghiệp vụ như thiếu tồn.
- Transaction không chờ thao tác người dùng và không gọi dịch vụ bên ngoài. `Serializable` không thay thế kiểm tra trạng thái chứng từ, số lượng tồn, version, đúng thuốc–lô và các quy tắc nghiệp vụ khác.

## Lưu ý Prisma/PostgreSQL

- Dùng Prisma relation cho THUOC 1–N LO_THUOC, CT_HOA_DON 1–N CT_XUAT_LO và các FK; không nhúng danh sách lô vào một cột JSON.
- Dùng `Decimal` xuyên suốt backend và serialize thành chuỗi ở biên API. Tổng tiền do server tính và lưu với cùng quy tắc làm tròn đã chốt.
- Prisma schema, migration SQL và ERD phải mô tả cùng một quan hệ. Partial unique index, `CHECK` phức tạp hoặc khóa hàng bằng SQL là ngoại lệ có chủ đích và phải được chú thích trong migration/tài liệu.

## Bất biến do service của Người 2/3 kiểm tra

- Tổng lượng xuất lô bằng lượng bán; lô xuất thuộc đúng thuốc; chứng từ hoàn tất có ít nhất một dòng.
- Version lô tăng cùng mọi thay đổi tồn và được kiểm tra trong transaction khi duyệt kiểm kê.
- Quy tắc sửa đơn đã kiểm tra và kiểm tra lại sau chỉnh sửa vẫn để mở cho Người 3.
- FEFO/tie-break, ngưỡng gần hết hạn, đầu/cuối ngày hết hạn và thời điểm thu tiền vẫn để mở cho thành viên phụ trách.
- Schema không có bảng thanh toán/công nợ/hoàn trả; không tự bổ sung khi làm task khác.

Sơ đồ: xem [ERD](diagrams/erd.mmd). Sơ đồ và từ điển dữ liệu phải được cập nhật cùng migration.
