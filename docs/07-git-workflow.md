# 07 — Quy trình Git

## Nhánh

- main: bản ổn định để demo.
- develop: bản tích hợp.
- feat/<chuc-nang>: tính năng nhỏ.
- fix/<loi>: sửa lỗi.
- docs/<noi-dung>: tài liệu.
- chore/<noi-dung>: cấu hình.

Tạo từng nhánh khi bắt đầu task từ develop mới nhất; không tạo tất cả từ đầu hoặc dùng một nhánh dài hạn cho mỗi người.

## Khởi tạo repository trên máy

Tạo repo GitHub trống, không thêm README từ xa nếu đã có local. Chỉ chạy git init nếu chưa có repo:

```powershell
git init
git branch -M main
git status
git add .
git diff --cached --stat
```

Kiểm tra nội dung và file bí mật trước khi commit:

```powershell
git commit -m "chore: initialize project documentation"
git remote add origin https://github.com/TEN_TAI_KHOAN/pharmacy-management.git
git push -u origin main
git switch -c develop
git push -u origin develop
```

Thay URL trước khi chạy. Nếu có origin, kiểm tra bằng git remote -v; không thêm trùng. Không ghi đè lịch sử từ xa để xử lý lỗi push.

## Thành viên nhận task

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feat/medicines-api
```

Sau khi làm và kiểm tra:

```powershell
git status
git add <CAC_FILE_CUA_TASK>
git diff --cached
git commit -m "feat: add medicines API"
git push -u origin feat/medicines-api
```

Tạo PR vào develop. Người khác review rồi mới merge. Sau mốc ổn định, Người 1 đưa develop vào main. Không force-push main/develop.

Mỗi commit chỉ nên chứa một mục đích rõ ràng (ví dụ `chore`, `feat`, `fix`, `docs`, `test`). Không gộp cấu hình, tính năng và tài liệu không liên quan vào cùng một commit. Chỉ merge khi workflow CI của backend và frontend đều đạt.

## Hạn chế xung đột

- Người 1 điều phối schema/migration, lockfile, cấu hình gốc, layout/menu và API chung.
- Tài liệu mỗi nhóm viết ở file riêng.
- Nhánh phụ thuộc phải chờ nhánh nền được merge, hoặc ghi rõ cách xếp PR; không chép tay code từ nhánh chưa thống nhất.
- Nếu đổi schema cần migration mới; không sửa migration đã dùng chung.
- Nếu cả hai cần sửa file chung, thống nhất một người thực hiện phần đó rồi merge sớm.
- PR của Người 1 cũng cần Người 2 hoặc 3 review.
