// src/services/SinhVienService.js
const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const { INCLUDE_SINH_VIEN } = require("../models");

class SinhVienService {
  async getAll({ ma_chuyen_nganh, search, page = 1, limit = 10 } = {}) {
    const where = {};
    if (ma_chuyen_nganh) where.ma_chuyen_nganh = ma_chuyen_nganh;
    if (search) {
      where.OR = [
        { ho_ten: { contains: search } },
        { ma_sinh_vien: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const total = await prisma.sinhVien.count({ where });
    const data = await prisma.sinhVien.findMany({
      where,
      include: INCLUDE_SINH_VIEN,
      orderBy: { ho_ten: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    };
  }

  async getOne(ma_sinh_vien) {
    const sv = await prisma.sinhVien.findUnique({
      where: { ma_sinh_vien },
      include: INCLUDE_SINH_VIEN,
    });
    if (!sv) throw { status: 404, message: "Không tìm thấy sinh viên" };
    return sv;
  }

  async create(data) {
    const {
      ma_sinh_vien,
      ho_ten,
      ma_chuyen_nganh,
      email,
      so_dien_thoai,
      ten_dang_nhap,
    } = data;
    const username = ten_dang_nhap || ma_sinh_vien;

    return await prisma.$transaction(async (tx) => {
      // Tìm id_vai_tro cho sinh_vien
      const vaiTro = await tx.vaiTro.findFirst({
        where: { ten_vai_tro: "sinh_vien" },
      });
      if (!vaiTro)
        throw { status: 500, message: "Vai trò sinh viên không tồn tại" };

      // Hash mật khẩu mặc định là mã sinh viên
      const hashedPassword = await bcrypt.hash(ma_sinh_vien, 10);

      // Tạo TaiKhoan
      const taiKhoan = await tx.taiKhoan.create({
        data: {
          ten_dang_nhap: username,
          mat_khau: hashedPassword,
          id_vai_tro: vaiTro.id_vai_tro,
        },
      });

      // Tạo SinhVien
      const sinhVien = await tx.sinhVien.create({
        data: {
          ma_sinh_vien,
          ho_ten,
          ma_chuyen_nganh,
          email,
          so_dien_thoai,
          id_nguoi_dung: taiKhoan.id_nguoi_dung,
        },
        include: INCLUDE_SINH_VIEN,
      });

      return {
        ...sinhVien,
        ten_dang_nhap: taiKhoan.ten_dang_nhap,
        mat_khau_mac_dinh: `Mật khẩu mặc định: ${ma_sinh_vien}`,
      };
    });
  }

  async update(ma_sinh_vien, data) {
    await this.getOne(ma_sinh_vien); // throws 404 if not found
    return prisma.sinhVien.update({
      where: { ma_sinh_vien },
      data,
      include: INCLUDE_SINH_VIEN,
    });
  }

  async delete(ma_sinh_vien) {
    await this.getOne(ma_sinh_vien);
    await prisma.sinhVien.delete({ where: { ma_sinh_vien } });
    return { message: "Xóa sinh viên thành công" };
  }

  async getByNguoiDung(id_nguoi_dung) {
    const sv = await prisma.sinhVien.findUnique({
      where: { id_nguoi_dung },
      include: INCLUDE_SINH_VIEN,
    });
    if (!sv) throw { status: 404, message: "Chưa liên kết hồ sơ sinh viên" };
    return sv;
  }
}

module.exports = new SinhVienService();
