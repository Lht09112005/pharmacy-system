# Nhật ký tổng quan và bàn giao dự án

> Cập nhật gần nhất: 01/10/2026  
> Mục đích: giúp phiên làm việc mới nắm nhanh bối cảnh và trạng thái dự án mà không phải đọc lại toàn bộ repository.  
> Đây là bản tóm tắt vận hành, không thay thế đặc tả gốc. Khi sửa một phần cụ thể, vẫn đọc `AGENTS.md`, `docs/08-decisions.md` và tài liệu liên quan trực tiếp đến phần đó.

## 1. Tóm tắt nhanh cho phiên mới

- Dự án: hệ thống web quản lý **một nhà thuốc**, phục vụ bán trực tiếp tại quầy.
- Công nghệ đã chốt: Next.js, NestJS, TypeScript, PostgreSQL và Prisma.
- Repository chính là thư mục chứa file này, gồm `frontend/`, `backend/` và `docs/`; không có Git repository lồng.
- Package manager: npm; frontend và backend có `package-lock.json` riêng.
- Bộ khung đã tạo và đã kiểm tra end-to-end với PostgreSQL thật.
- Chưa có schema/migration nghiệp vụ, đăng nhập, phân quyền hoặc chức năng nhập kho, bán hàng, kiểm kê và báo cáo.
- API nghiệp vụ trong `docs/04-api-contract.md` vẫn là **đề xuất**, không được coi là API đã chốt hoặc đã triển khai.
- Không tự tạo commit, push hoặc merge nếu người dùng chưa yêu cầu rõ.

## 2. Phạm vi nghiệp vụ

### Trong phạm vi

- Tài khoản nhân viên và phân quyền.
- Thuốc, nhà cung cấp và lô thuốc.
- Phiếu nhập, tồn kho, hạn sử dụng, kiểm kê và cảnh báo.
- Khách hàng, đơn thuốc, bán hàng, hóa đơn và báo cáo.

### Ngoài phạm vi bản đầu

- Nhiều chi nhánh.
- Giao hàng và thanh toán trực tuyến.
- Công nợ, trả hàng sau bán và bảo hiểm y tế.
- Liên thông đơn thuốc điện tử.
- Hệ thống tự kê đơn hoặc tự thay thế quyết định chuyên môn.
- Quy đổi hộp–vỉ–viên; mỗi thuốc chỉ dùng một đơn vị quản lý thống nhất.

### Actor đăng nhập

| Mã vai trò | Trách nhiệm |
|---|---|
| `BAN_THUOC` | Tra cứu, tư vấn, kiểm tra đơn, lập và tra cứu hóa đơn. |
| `QUAN_LY_KHO` | Nhập thuốc, theo dõi tồn/cảnh báo và lập kiểm kê. |
| `QUAN_LY` | Quản lý danh mục, tài khoản/vai trò, duyệt kiểm kê và xem báo cáo. |

Một tài khoản có thể có nhiều vai trò. Khách hàng, nhà cung cấp và người kê đơn không đăng nhập.

## 3. Công nghệ và phiên bản hiện tại

| Thành phần | Phiên bản/cấu hình |
|---|---|
| Frontend | Next.js 16.3.7, React 19.2.8, TypeScript 5.9.3, App Router |
| Backend | NestJS 12.1.1, TypeScript 6.0.3 |
| ORM | Prisma 6.12.0 |
| CSDL local | PostgreSQL, Docker image `postgres:17-alpine` |
| Package manager | npm 11.9.0 |
| Node.js hỗ trợ | `^22.22.3` hoặc `>=24.15.0` |

Máy khởi tạo từng dùng Node.js 24.14.0. Build vẫn đạt nhưng Nest CLI cảnh báo engine; nên nâng lên 24.15.0 trở lên hoặc dùng Node 22 phù hợp.

## 4. Trạng thái đã hoàn thành

### Hạ tầng chung

- Có `compose.yaml` chạy riêng PostgreSQL với volume do Docker Compose quản lý.
- Có `.env.example`, `backend/.env.example` và `frontend/.env.example`.
- File môi trường thật được Git bỏ qua; không ghi mật khẩu hoặc chuỗi kết nối thật vào tài liệu.
- Đã cài dependency và lưu lockfile cho cả frontend/backend.
- Prisma Client đã generate và Prisma schema đã validate.

### Backend

- Đọc và kiểm tra biến môi trường khi khởi động.
- Prefix API: `/api/v1`.
- CORS lấy origin frontend từ biến môi trường.
- Có global validation pipe và định dạng lỗi chung.
- Có `PrismaModule`/`PrismaService` dùng chung.
- Có hai endpoint hạ tầng:
  - `GET /api/v1/health`: kiểm tra ứng dụng, không phụ thuộc CSDL.
  - `GET /api/v1/health/ready`: chạy `SELECT 1` để kiểm tra PostgreSQL.
- Đã tạo module rỗng: `auth`, `users`, `roles`, `medicines`, `suppliers`, `inventory`, `goods-receipts`, `stocktakes`, `customers`, `prescriptions`, `sales`, `reports`.
- Các module rỗng chưa có API giả trả thành công nghiệp vụ.

### Frontend

- Dùng Next.js App Router và TypeScript.
- Có layout, menu, trang tổng quan và API client cơ bản.
- Trang tổng quan gọi health API và hiển thị trạng thái kết nối backend.
- Có trang khung cho thuốc, nhà cung cấp, nhập kho, tồn kho, kiểm kê, bán hàng, khách hàng, đơn thuốc, hóa đơn, báo cáo và nhân viên.
- Trang chưa có nghiệp vụ hiển thị “Đang phát triển”.

### Kiểm tra gần nhất

Lần kiểm tra thực tế ngày 30/09/2026:

- Docker client/server hoạt động.
- Container `pharmacy-postgres` đạt trạng thái `healthy`.
- `pg_isready` và truy vấn `SELECT 1` thành công.
- Backend build và khởi động thành công.
- Liveness trả HTTP 200.
- Readiness trả HTTP 200 với CSDL `connected`.
- CORS cho frontend local hoạt động.
- Frontend khởi động thành công; kiểm tra bằng Chrome headless xác nhận trang đã hydrate, hiển thị “Đã kết nối” và `pharmacy-api: ok`.
- Backend/frontend được dừng sau kiểm tra; PostgreSQL được giữ chạy tại thời điểm bàn giao.
- Cổng 3000 khi đó bị một tiến trình Node khác chiếm nên frontend được kiểm tra tại cổng 3002; `backend/.env` local được đổi origin tương ứng. File mẫu vẫn dùng cổng 3000.

Trạng thái tiến trình/container có thể thay đổi giữa các phiên; luôn kiểm tra lại trước khi báo đang chạy.

## 5. Những phần chưa triển khai

- Prisma schema nghiệp vụ và migration đầu tiên.
- Seed dùng chung.
- Đăng nhập, đăng xuất, phiên và phân quyền.
- CRUD nhân viên, thuốc, nhà cung cấp và khách hàng.
- Phiếu nhập và cập nhật tồn.
- Chọn/xuất lô khi bán.
- Đơn thuốc, hóa đơn và báo cáo.
- Kiểm kê, phê duyệt và cảnh báo.
- DTO/hợp đồng API nghiệp vụ đã được duyệt.
- Kiểm thử nghiệp vụ và kiểm thử đồng thời.

Không tạo bảng/model giả chỉ để thử kết nối. `backend/prisma/schema.prisma` hiện chỉ cấu hình datasource/generator và chưa có model nghiệp vụ hoặc thư mục migration.

## 6. Quyết định nghiệp vụ và dữ liệu đã chốt

### Thuốc, lô và chứng từ

- Một thuốc có nhiều lô; tồn được quản lý theo từng lô.
- Lô được nhận diện theo thuốc + số lô + hạn sử dụng.
- Một dòng hóa đơn có thể xuất từ nhiều lô qua chi tiết xuất lô.
- Tổng lượng xuất lô phải bằng lượng bán và mọi lô phải thuộc đúng thuốc.
- Không bán lô hết hạn hoặc vượt tồn khả dụng.
- Một đơn thuốc gắn tối đa một hóa đơn trong bản đầu.
- Hóa đơn không kê đơn được phép không có đơn thuốc.
- Chứng từ có trạng thái nháp, hoàn tất hoặc hủy; chứng từ hoàn tất không bị sửa bằng API cập nhật chung.

### Tiền

- PostgreSQL dùng `DECIMAL/NUMERIC`; Prisma dùng `Decimal`.
- API truyền tiền bằng chuỗi thập phân, không dùng JavaScript `number` cho tính toán tiền.
- Backend tự tính tổng và không tin tổng tiền do frontend gửi.
- Giá giao dịch được lưu tại dòng chứng từ để lịch sử không thay đổi khi giá danh mục đổi.

### Transaction, tồn và đồng thời

- Xác nhận nhập, xác nhận bán và duyệt kiểm kê chạy trong transaction `Serializable`.
- Xung đột serialization/deadlock được retry có giới hạn; mỗi lần retry chạy lại toàn bộ transaction.
- Không chờ người dùng hoặc gọi dịch vụ ngoài bên trong transaction.
- Vẫn phải kiểm tra trạng thái chứng từ, tồn, đúng quan hệ thuốc–lô và version; không coi `Serializable` là đủ cho nghiệp vụ.
- Xác nhận lặp/đồng thời không được cập nhật tồn lần thứ hai.
- Lưu chứng từ và cập nhật tồn nằm trong cùng transaction; lỗi phải rollback toàn bộ.
- Sales dùng giao diện inventory chung và cùng Prisma transaction context; sales không tự cập nhật bảng lô, inventory không tự commit transaction con.

### Version tồn và kiểm kê

- Lô có trường `version`, tăng mỗi khi tồn lô thay đổi.
- Chi tiết kiểm kê lưu version tại thời điểm ghi nhận.
- Kiểm tra version và điều chỉnh tồn nằm trong cùng transaction duyệt.
- Nếu version đã thay đổi, không áp dụng số liệu cũ và yêu cầu kiểm tra lại.

### Phiếu nhập nháp

- Dòng phiếu nhập nháp lưu thuốc, số lô dự kiến và hạn sử dụng dự kiến.
- Lưu nháp không tạo lô tồn và không tăng tồn.
- Khi xác nhận, backend tìm hoặc tạo lô theo thuốc + số lô + hạn sử dụng, gắn dòng nhập với lô rồi tăng tồn/version trong cùng transaction.

### Thời gian

- Chứng từ phân biệt thời gian tạo, cập nhật và hoàn tất.
- Lưu timestamp bằng PostgreSQL `TIMESTAMPTZ`.
- Báo cáo giao dịch hoàn tất dùng thời điểm hoàn tất.
- Ngày hiển thị và ngày báo cáo được xác định theo `Asia/Ho_Chi_Minh`.

## 7. Trạng thái thiết kế CSDL và API

- `docs/03-database-design.md` là thiết kế logic tham chiếu, chưa phải migration đã triển khai.
- ERD hiện mô tả các quan hệ chính, gồm thuốc–lô, dòng hóa đơn–xuất lô, đơn thuốc–hóa đơn và version kiểm kê.
- `docs/04-api-contract.md` là hợp đồng **đề xuất cần review**.
- Chỉ health API là API đã triển khai.
- Không để frontend phụ thuộc tên endpoint, DTO hoặc mã lỗi nghiệp vụ đề xuất trước khi nhóm chốt.
- Khi schema/API/nghiệp vụ thay đổi, cập nhật đồng bộ tài liệu, ERD và kiểm thử liên quan.

## 8. Quyết định còn mở

Các nội dung dưới đây chưa được coi là yêu cầu cuối:

1. Cookie session hay token; logout, thu hồi phiên và khóa tài khoản.
2. Thư viện UI.
3. OpenAPI sinh kiểu hay package contracts dùng chung.
4. Prisma `Int` hay `BigInt`, cùng quy ước tên bảng/cột vật lý.
5. Tiền tệ, precision/scale và quy tắc làm tròn.
6. Ngưỡng gần hết hạn và thời điểm một lô được coi là hết hạn trong ngày.
7. Đơn gắn hóa đơn nháp đã hủy có được dùng lại hay không.
8. Thời điểm thu tiền/hoàn tất và xử lý khách đổi ý trước hoàn tất.
9. Chính sách chọn lô khi bán; FEFO mới là đề xuất.
10. Có liên kết từng dòng hóa đơn với dòng đơn thuốc hay chỉ kiểm tra tại service.
11. Khi nào sửa đơn làm vô hiệu lần kiểm tra trước.
12. Nội dung đơn lưu nguyên văn và ánh xạ thuốc tùy chọn vẫn là đề xuất P04.
13. Ngày nộp, tên thành viên và thời hạn từng mốc.

Trước khi code phần phụ thuộc một quyết định mở, yêu cầu người dùng/nhóm chốt và ghi vào `docs/08-decisions.md`.

## 9. Phân công

### Người 1 — Điều phối, nền tảng và tài khoản

- Điều phối dự án, schema/migration, cấu hình gốc, dependency/lockfile và layout dùng chung.
- API contract, CSDL nền, seed, auth, users, roles và quản lý nhân viên.
- Tổng hợp tài liệu, tích hợp và phát hành.

### Người 2 — Thuốc và kho

- Medicines, suppliers, inventory và cảnh báo.
- Goods receipts, lô thuốc và cập nhật tồn.
- Stocktakes và xử lý version khi duyệt.
- Frontend, backend, kiểm thử và tài liệu cho phần kho.

### Người 3 — Bán hàng

- Customers và prescriptions.
- Sales, checkout, invoices và reports.
- Gọi inventory qua giao diện đã thống nhất; không tự cập nhật lô.
- Frontend, backend, kiểm thử và tài liệu cho phần bán.

Chi tiết task/checklist nằm trong `docs/05-task-plan.md`.

## 10. Cấu trúc repository

```text
pharmacy-management/
├── frontend/                 # Next.js App Router
│   └── src/
│       ├── app/              # route, layout và trang khung
│       ├── components/       # thành phần dùng chung
│       ├── features/         # logic theo tính năng
│       └── lib/              # API client, navigation, tiện ích chung
├── backend/                  # NestJS
│   ├── prisma/
│   │   └── schema.prisma     # chưa có model nghiệp vụ
│   └── src/
│       ├── common/           # filter/pipe/helper dùng chung
│       ├── config/           # kiểm tra biến môi trường
│       ├── prisma/           # PrismaModule/PrismaService
│       └── modules/          # module theo nghiệp vụ
├── docs/                     # đặc tả, quyết định, sơ đồ, kế hoạch
├── compose.yaml              # PostgreSQL local
├── AGENTS.md                 # quy tắc làm việc bắt buộc
├── README.md                 # cài đặt nhanh
└── process.md                # file bàn giao này
```

Không đưa nghiệp vụ riêng vào thư mục `common`/`lib` chỉ để tránh chọn module sở hữu.

## 11. Biến môi trường và lệnh chạy

Không ghi giá trị bí mật vào file này.

### Tạo file local nếu thiếu

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Các biến cần có:

- `.env`: `POSTGRES_PORT`, `POSTGRES_PASSWORD`.
- `backend/.env`: `DATABASE_URL`, `PORT`, `FRONTEND_ORIGIN`, `APP_TIMEZONE`.
- `frontend/.env.local`: `NEXT_PUBLIC_API_BASE_URL`.

### PostgreSQL

```powershell
docker compose up -d postgres
docker compose ps
docker compose exec -T postgres pg_isready -U pharmacy -d pharmacy
docker compose exec -T postgres psql -U pharmacy -d pharmacy -tAc "SELECT 1"
```

Không dùng `docker compose down -v`, không xóa/reset volume và không tác động container ngoài dự án nếu chưa được yêu cầu rõ.

### Backend

```powershell
Set-Location backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run start:dev
```

### Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Địa chỉ chuẩn:

- Frontend: `http://localhost:3000`.
- Backend liveness: `http://localhost:3001/api/v1/health`.
- Backend readiness: `http://localhost:3001/api/v1/health/ready`.

Nếu cổng 3000 bị chiếm, có thể dùng frontend cổng 3002 và phải đổi `FRONTEND_ORIGIN` local của backend cho khớp.

### Kiểm tra

```powershell
Set-Location backend
npm run prisma:validate
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build

Set-Location ../frontend
npm run typecheck
npm run lint
npm run build
```

## 12. Quy tắc làm việc quan trọng

- Đọc mã hiện có trước khi sửa và giữ thay đổi đúng phạm vi task.
- Không sửa/xóa migration đã chia sẻ, reset CSDL hoặc che lỗi bằng dữ liệu giả.
- Không tạo API giả trả thành công cho nghiệp vụ chưa làm.
- Quyền, giá/tổng, trạng thái và nhân viên thao tác phải được kiểm tra tại backend.
- Không xóa vật lý dữ liệu giao dịch đã được tham chiếu.
- Không đưa `.env`, mật khẩu, token hoặc dữ liệu người bệnh thật vào Git.
- Tách thay đổi theo module sở hữu; thay đổi liên module cần nêu tác động và phối hợp.
- Báo chính xác kiểm tra nào đã chạy và bước nào bị chặn.
- Không commit, push hoặc merge nếu chưa được giao rõ.

## 13. Trình tự đề xuất cho công việc tiếp theo

1. Chốt các quyết định ảnh hưởng migration đầu tiên: ID/tên vật lý, tiền, hạn dùng, đơn–hóa đơn và auth.
2. Review/chốt phần API contract cần cho task đầu tiên.
3. Người 1 tạo schema Prisma nền, migration đầu và seed dùng chung.
4. Triển khai auth/users/roles và app shell đăng nhập.
5. Người 2 triển khai thuốc, nhà cung cấp và inventory core.
6. Người 3 triển khai khách hàng, đơn thuốc và sales draft.
7. Chốt giao diện nội bộ sales–inventory trước checkout.
8. Triển khai nhập/xác nhận, checkout, kiểm kê và báo cáo theo dependency trong `docs/05-task-plan.md`.

## 14. Checklist bắt đầu một phiên mới

1. Đọc file này.
2. Đọc `AGENTS.md` và `docs/08-decisions.md`.
3. Xác định task và người/module sở hữu.
4. Chỉ đọc thêm tài liệu/mã nguồn trực tiếp liên quan đến task.
5. Kiểm tra `git status` và không ghi đè thay đổi có sẵn.
6. Kiểm tra Docker, cổng và file môi trường nếu cần chạy ứng dụng.
7. Xác minh quyết định phụ thuộc đã được chốt; nếu chưa, hỏi trước khi triển khai.
8. Sau khi làm xong, cập nhật mục trạng thái và ngày ở file này nếu có thay đổi đáng kể.

## 15. Tài liệu nguồn cần tra theo tình huống

| Nhu cầu | Tài liệu |
|---|---|
| Phạm vi và actor | `docs/01-project-overview.md` |
| Quy trình, trạng thái và bất biến | `docs/02-business-rules.md` |
| Thiết kế dữ liệu logic | `docs/03-database-design.md` |
| API đề xuất | `docs/04-api-contract.md` |
| Phân công và dependency | `docs/05-task-plan.md` |
| Cài đặt, chạy và kiểm tra | `docs/06-development-guide.md` |
| Git/PR | `docs/07-git-workflow.md` |
| Quyết định đã chốt/còn mở | `docs/08-decisions.md` |
| Tổng hợp rà soát | `docs/10-review-summary.md` |
| ERD và sơ đồ | `docs/diagrams/` |

