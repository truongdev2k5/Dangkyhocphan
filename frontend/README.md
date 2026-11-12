# Frontend Directory Structure

```
frontend/
├── login.html                    # Trang đăng nhập (chung)
│
├── admin/
│   ├── dashboard.html           # Giao diện dashboard admin
│   └── admin.js                 # Logic riêng admin
│
├── student/
│   ├── dashboard.html           # Giao diện dashboard sinh viên
│   └── student.js               # Logic riêng sinh viên
│
└── shared/
    ├── style.css                # CSS chung cho toàn bộ ứng dụng
    └── auth.js                  # Hàm xác thực và API call chung
```

## 📝 Cách Sử Dụng

### 1. **Mở ứng dụng:**

- Mở file `login.html` trong trình duyệt
- Hoặc sử dụng Live Server (nếu dùng VS Code)

### 2. **Đăng nhập:**

- **Admin**: `admin` / `Admin@123` → redirect tới `admin/dashboard.html`
- **Sinh viên**: `sv001` / `Sv001@123` → redirect tới `student/dashboard.html`

### 3. **Cấu trúc File:**

- `shared/auth.js` chứa: login, logout, apiCall (dùng chung)
- `shared/style.css` chứa: CSS toàn bộ app
- `admin/admin.js` chứa: tất cả logic admin
- `student/student.js` chứa: tất cả logic sinh viên

## 🎨 Tính Năng

### Admin:

- 📊 Dashboard (thống kê)
- 👥 Quản lý sinh viên
- 👨‍🏫 Quản lý giảng viên
- 📚 Quản lý lớp học phần
- ✍️ Duyệt/từ chối đăng ký
- 📜 Lịch sử đăng ký

### Sinh Viên:

- 📊 Trang chủ (thống kê)
- 📚 Danh sách lớp (tìm kiếm, đăng ký)
- ✍️ Đăng ký của tôi (hủy)
- 📅 Lịch học

## 🔧 Cách Mở Rộng

### Thêm chức năng mới cho Admin:

1. Tạo `<section>` mới trong `admin/dashboard.html`
2. Thêm link menu trong sidebar
3. Viết function trong `admin/admin.js`

### Thêm chức năng mới cho Sinh viên:

1. Tạo `<section>` mới trong `student/dashboard.html`
2. Thêm link menu trong sidebar
3. Viết function trong `student/student.js`
