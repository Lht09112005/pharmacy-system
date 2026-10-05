# 09 — Prompt sử dụng với AI

## Prompt 1 — Rà soát tài liệu

```text
Đọc README.md, AGENTS.md và toàn bộ docs/ trong dự án quản lý một nhà thuốc này.
Tổng hợp phạm vi, actor, công nghệ đã chốt (gồm PostgreSQL và Prisma) và những quyết định còn mở.
Kiểm tra tính nhất quán giữa quy trình, schema và API đề xuất.
Chưa tạo chức năng nghiệp vụ. Liệt kê quyết định cần tôi chốt trước khi tạo bộ khung.
Không tự thay đổi PostgreSQL/Prisma hoặc chọn cơ chế xác thực thay nhóm.
```

## Prompt 2 — Tạo bộ khung

Dùng sau khi các quyết định cần thiết đã được ghi trong docs/08-decisions.md.

```text
Hãy tạo bộ khung dự án theo AGENTS.md và các tài liệu đã thống nhất trong docs/.
Frontend Next.js, backend NestJS, TypeScript, PostgreSQL và Prisma. Lấy runtime và cơ chế xác thực từ docs/08-decisions.md. Nếu còn thiếu quyết định bắt buộc, báo rõ; tiếp tục các phần độc lập có thể làm.

Yêu cầu:
1. Một repository: frontend/, backend/, docs/.
2. Chọn phiên bản ổn định tương thích theo quyết định; giữ lockfile và ghi phiên bản thật.
3. Backend có cấu hình môi trường, kết nối CSDL, health API, kiểm tra đầu vào và xử lý lỗi chung. Tạo cấu trúc module theo tài liệu, chưa triển khai nghiệp vụ nhập/bán/kiểm kê.
4. Frontend có layout, menu, trang khởi đầu, cấu hình gọi API và báo lỗi. Trang chưa làm ghi rõ đang phát triển.
5. Tạo .env.example mỗi app; không commit secret. Không tạo API giả báo thành công nghiệp vụ chưa triển khai.
6. Giữ và cập nhật tài liệu đã có; không ghi đè quyết định đã chốt bằng lựa chọn mới.
7. Cài dependency, chạy build/typecheck/lint và thử khởi động. Báo rõ kết quả thực tế và lỗi môi trường.
8. Cập nhật README và docs/06-development-guide.md bằng lệnh chạy có thật.
9. Chưa commit/push, chưa triển khai toàn bộ schema nghiệp vụ khi chưa có task đó.
```

## Prompt 3 — Rà trước GitHub

```text
Rà soát bộ khung: cài/chạy theo README, kết nối frontend/backend/CSDL, môi trường mẫu, secrets và file không nên commit. Sửa lỗi trong phạm vi bộ khung. Đối chiếu docs với code, ghi rõ module nào chỉ là khung. Chạy kiểm tra phù hợp, không khẳng định thành công cho bước chưa chạy. Chưa commit/push.
```

## Prompt 4 — Nhận task

Thay tên nhánh và mô tả trước khi dùng:

```text
Đọc AGENTS.md và tài liệu liên quan. Tôi làm nhánh feat/medicines-api, task triển khai API quản lý thuốc.
Kiểm tra code, schema, hợp đồng API và phần phụ thuộc đã có. Thực hiện đúng phạm vi. Không tự sửa module của thành viên khác để vượt qua phụ thuộc thiếu.
Nếu cần thay đổi schema hoặc cấu hình chung, nêu rõ tác động để phối hợp.
Hoàn thành: chạy kiểm tra phù hợp, cập nhật docs và soạn mô tả PR/cách kiểm tra. Chưa commit/push.
```
