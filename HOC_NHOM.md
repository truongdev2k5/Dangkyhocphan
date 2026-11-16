# Demo Phòng học nhóm theo môn

## Chạy trên Windows với XAMPP

1. Bật **MySQL** trong XAMPP. Dùng một database demo riêng nếu muốn thử từ đầu, ví dụ `dang_ky_hoc_phan_demo`. Tạo database trong phpMyAdmin trước khi chạy migration.
2. Trong thư mục dự án, cấu hình `.env` với `DATABASE_URL` trỏ đến đúng database và `JWT_SECRET` riêng. Với cấu hình XAMPP cục bộ dùng tài khoản root không có mật khẩu, URL có dạng `mysql://root@localhost:3306/dang_ky_hoc_phan_demo`. Điều chỉnh theo cổng và tài khoản trên máy.
3. Chạy lần lượt trong PowerShell:

```powershell
npm ci
npx prisma migrate deploy
npx prisma generate
$env:STUDY_DEMO_PASSWORD = "DemoHocNhom@2026"
node prisma/seed-hoc-nhom-demo.js
npm run dev
```

Migration gốc có một ký tự thừa khiến database mới báo lỗi khi tạo bảng giảng viên. Bản cập nhật sửa ký tự đó. Nếu từng thử migration lỗi trên một database demo, hãy tạo một database demo trống khác.

Nếu database cũ đã tạo bảng bằng cách nhập SQL thủ công và Prisma báo P3005, hãy dùng một database demo trống để thử các bước trên. Với database cần giữ dữ liệu, xác minh lịch sử migration trước khi baseline.

Script demo thêm hai tài khoản riêng, hai lớp thuộc cùng môn Cơ sở dữ liệu và một đăng ký đã duyệt cho mỗi tài khoản. Script dùng học kỳ đang hoạt động, hoặc tạo học kỳ demo nếu chưa có. Có thể chạy lại với cùng mật khẩu ban đầu. Mật khẩu của tài khoản đã tồn tại được giữ nguyên.

## Kịch bản phỏng vấn

1. Mở [cổng sinh viên](http://localhost:3001) trong hai cửa sổ trình duyệt tách phiên, ví dụ một cửa sổ thường và một cửa sổ ẩn danh. Đăng nhập `HNDEMO01` và `HNDEMO02` bằng mật khẩu demo đã đặt.
2. Mỗi tài khoản vào **Đăng ký của tôi → Học nhóm**. Hai tài khoản ở hai lớp có mã khác nhau nhưng nhìn thấy cùng danh sách.
3. Với tài khoản Lan, chọn **Đặt buổi học**, nhập “Ôn JOIN và GROUP BY”, giờ bắt đầu sau giờ hiện tại khoảng 6 phút và giờ kết thúc sau đó một giờ. Dán link cuộc họp thật do Lan tạo trên Google Meet. Giờ nhập và hiển thị là giờ Việt Nam.
4. Với tài khoản Minh, bấm **Quan tâm**. Giữ trang đang mở. Khi còn 5 phút, nút **Vào Google Meet** tự bật. Thông báo mở phòng xuất hiện ở thanh trên trong lần đồng bộ gần nhất.
5. Có thể demo thêm **Sửa lịch** hoặc **Hủy buổi** bằng tài khoản Lan và xem thông báo tương ứng trên tài khoản Minh. Khi hủy, nút tham gia bị khóa. Tại giờ kết thúc, cổng sinh viên cũng khóa nút và hiển thị **Đã kết thúc**.

Ứng dụng chỉ cung cấp link trong cửa sổ tham gia. Google Meet quản lý quyền vào cuộc gọi theo cấu hình của chủ trì. Nhắc mở phòng đồng bộ trong cổng sinh viên khi trang đang mở hoặc khi quay lại trong thời gian buổi học còn hiệu lực. Thông báo đổi lịch và hủy được lưu trong database.

## Kiểm thử

```powershell
node --test tests/hocNhom.test.js
```

Bộ kiểm thử dùng adapter dữ liệu trong bộ nhớ và đồng hồ kiểm soát được để kiểm tra quy tắc nghiệp vụ.
