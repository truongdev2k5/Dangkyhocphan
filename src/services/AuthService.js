// src/services/AuthService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

class AuthService {
  // ── Login ────────────────────────────────────────────────
  async login(ten_dang_nhap, mat_khau) {
    const tk = await prisma.taiKhoan.findUnique({
      where: { ten_dang_nhap },
      include: { VaiTro: true, SinhVien: true },
    });

    if (!tk || !tk.trang_thai) {
      throw { status: 401, message: "Tên đăng nhập hoặc mật khẩu không đúng" };
    }

    const hopLe = await bcrypt.compare(mat_khau, tk.mat_khau);
    if (!hopLe) {
      throw { status: 401, message: "Tên đăng nhập hoặc mật khẩu không đúng" };
    }

    const payload = {
      id_nguoi_dung: tk.id_nguoi_dung,
      ten_dang_nhap: tk.ten_dang_nhap,
      vai_tro: tk.VaiTro.ten_vai_tro,
      ma_sinh_vien: tk.SinhVien?.ma_sinh_vien ?? null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    return { token, nguoi_dung: payload };
  }

  // ── Register (admin only) ────────────────────────────────
  async register({ ten_dang_nhap, mat_khau, id_vai_tro }) {
    const exists = await prisma.taiKhoan.findUnique({
      where: { ten_dang_nhap },
    });
    if (exists) throw { status: 409, message: "Tên đăng nhập đã tồn tại" };

    const hash = await bcrypt.hash(mat_khau, 10);
    const tk = await prisma.taiKhoan.create({
      data: { ten_dang_nhap, mat_khau: hash, id_vai_tro },
      select: {
        id_nguoi_dung: true,
        ten_dang_nhap: true,
        id_vai_tro: true,
        created_at: true,
      },
    });
    return tk;
  }

  // ── Đổi mật khẩu ────────────────────────────────────────
  async doiMatKhau(id_nguoi_dung, mat_khau_cu, mat_khau_moi) {
    const tk = await prisma.taiKhoan.findUnique({ where: { id_nguoi_dung } });
    if (!tk) throw { status: 404, message: "Không tìm thấy tài khoản" };

    const hopLe = await bcrypt.compare(mat_khau_cu, tk.mat_khau);
    if (!hopLe) throw { status: 400, message: "Mật khẩu cũ không đúng" };

    await prisma.taiKhoan.update({
      where: { id_nguoi_dung },
      data: { mat_khau: await bcrypt.hash(mat_khau_moi, 10) },
    });
    return { message: "Đổi mật khẩu thành công" };
  }

  // ── Khoá / Mở tài khoản (admin) ─────────────────────────
  async setTrangThai(id_nguoi_dung, trang_thai) {
    const tk = await prisma.taiKhoan.update({
      where: { id_nguoi_dung },
      data: { trang_thai },
      select: { id_nguoi_dung: true, ten_dang_nhap: true, trang_thai: true },
    });
    return tk;
  }

  // ── Reset mật khẩu (admin) ─────────────────────────────
  async resetMatKhau(id_nguoi_dung, mat_khau_moi) {
    const tk = await prisma.taiKhoan.findUnique({ where: { id_nguoi_dung } });
    if (!tk) throw { status: 404, message: "Không tìm thấy tài khoản" };

    const newPassword = mat_khau_moi || "Abcd@1234";
    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.taiKhoan.update({
      where: { id_nguoi_dung },
      data: { mat_khau: hash },
    });

    return { message: "Đặt lại mật khẩu thành công" };
  }
}

module.exports = new AuthService();
