// src/services/LopHocPhanService.js
const prisma = require("../config/database");
const { INCLUDE_LOP_HOC_PHAN } = require("../models");

class LopHocPhanService {
  async getAll({ id_hoc_ky, ma_mon_hoc, con_cho, page = 1, limit = 10 } = {}) {
    const where = {};
    if (id_hoc_ky) where.id_hoc_ky = Number(id_hoc_ky);
    if (ma_mon_hoc) where.ma_mon_hoc = ma_mon_hoc;
    if (con_cho === "true") where.so_luong_con_trong = { gt: 0 };

    const total = await prisma.lopHocPhan.count({ where });
    const data = await prisma.lopHocPhan.findMany({
      where,
      include: INCLUDE_LOP_HOC_PHAN,
      orderBy: { ma_lop_hoc: "asc" },
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

  async getOne(ma_lop_hoc) {
    const lop = await prisma.lopHocPhan.findUnique({
      where: { ma_lop_hoc },
      include: INCLUDE_LOP_HOC_PHAN,
    });
    if (!lop) throw { status: 404, message: "Không tìm thấy lớp học phần" };
    return lop;
  }

  async create(data) {
    const payload = { ...data };

    ["ma_giang_vien", "phong_hoc", "ngay_bat_dau", "ngay_ket_thuc"].forEach(
      (field) => {
        if (payload[field] === "") delete payload[field];
      },
    );

    if (typeof payload.ngay_bat_dau === "string" && payload.ngay_bat_dau) {
      payload.ngay_bat_dau = new Date(`${payload.ngay_bat_dau}T00:00:00.000Z`);
    }
    if (typeof payload.ngay_ket_thuc === "string" && payload.ngay_ket_thuc) {
      payload.ngay_ket_thuc = new Date(`${payload.ngay_ket_thuc}T00:00:00.000Z`);
    }
    if (
      payload.ngay_bat_dau &&
      payload.ngay_ket_thuc &&
      payload.ngay_bat_dau > payload.ngay_ket_thuc
    ) {
      throw {
        status: 400,
        message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
      };
    }

    const [monHoc, hocKy, giangVien] = await Promise.all([
      prisma.monHoc.findUnique({
        where: { ma_mon_hoc: payload.ma_mon_hoc },
        select: { ma_mon_hoc: true },
      }),
      prisma.hocKy.findUnique({
        where: { id_hoc_ky: Number(payload.id_hoc_ky) },
        select: { id_hoc_ky: true },
      }),
      payload.ma_giang_vien
        ? prisma.giangVien.findUnique({
            where: { ma_giang_vien: payload.ma_giang_vien },
            select: { ma_giang_vien: true },
          })
        : Promise.resolve(null),
    ]);

    if (!monHoc) throw { status: 400, message: "Môn học không tồn tại" };
    if (!hocKy) throw { status: 400, message: "Học kỳ không tồn tại" };
    if (payload.ma_giang_vien && !giangVien) {
      throw { status: 400, message: "Giảng viên không tồn tại" };
    }

    if (payload.so_luong_con_trong === undefined) {
      payload.so_luong_con_trong = payload.so_luong_toi_da;
    }
    if (payload.so_luong_con_trong > payload.so_luong_toi_da) {
      throw {
        status: 400,
        message: "Số lượng còn trống không được lớn hơn số lượng tối đa",
      };
    }

    return prisma.lopHocPhan.create({
      data: payload,
      include: INCLUDE_LOP_HOC_PHAN,
    });
  }

  async update(ma_lop_hoc, data) {
    await this.getOne(ma_lop_hoc);
    return prisma.lopHocPhan.update({
      where: { ma_lop_hoc },
      data,
      include: INCLUDE_LOP_HOC_PHAN,
    });
  }

  async delete(ma_lop_hoc) {
    await this.getOne(ma_lop_hoc);
    await prisma.lopHocPhan.delete({ where: { ma_lop_hoc } });
    return { message: "Xóa lớp học phần thành công" };
  }

  async setCauHinhTinChi(id_hoc_ky, tin_chi_toi_da) {
    const hocKy = await prisma.hocKy.findUnique({
      where: { id_hoc_ky: Number(id_hoc_ky) },
      select: { id_hoc_ky: true, dang_kich_hoat: true, ten_hoc_ky: true, nam_hoc: true },
    });

    if (!hocKy) {
      throw { status: 404, message: "Không tìm thấy học kỳ để cấu hình tín chỉ" };
    }

    if (!hocKy.dang_kich_hoat) {
      throw {
        status: 400,
        message: `Học kỳ ${hocKy.ten_hoc_ky} (${hocKy.nam_hoc}) chưa kích hoạt, không thể cấu hình tín chỉ`,
      };
    }

    return prisma.cauHinhTinChi.upsert({
      where: { id_hoc_ky: Number(id_hoc_ky) },
      update: { tin_chi_toi_da },
      create: { id_hoc_ky: Number(id_hoc_ky), tin_chi_toi_da },
    });
  }

  async getCauHinhTinChi(id_hoc_ky) {
    const config = await prisma.cauHinhTinChi.findUnique({
      where: { id_hoc_ky: Number(id_hoc_ky) },
    });
    if (!config) {
      throw { status: 404, message: "Chưa có cấu hình tín chỉ cho học kỳ này" };
    }
    return config;
  }
}

module.exports = new LopHocPhanService();
