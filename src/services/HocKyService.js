// src/services/HocKyService.js
const prisma = require("../config/database");

class HocKyService {
  _normalizeDateInput(value, fieldName) {
    if (!value) return value;
    if (value instanceof Date) return value;

    if (typeof value === "string") {
      // Accept yyyy-mm-dd from HTML date input.
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`);
      }
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    throw { status: 400, message: `${fieldName} không hợp lệ` };
  }

  async getAll({ search, page = 1, limit = 10 } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { ten_hoc_ky: { contains: search } },
        { nam_hoc: { contains: search } },
      ];
    }

    const total = await prisma.hocKy.count({ where });
    const data = await prisma.hocKy.findMany({
      where,
      orderBy: { id_hoc_ky: "desc" },
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

  async getOne(id_hoc_ky) {
    const hk = await prisma.hocKy.findUnique({
      where: { id_hoc_ky: parseInt(id_hoc_ky) },
    });
    if (!hk) throw { status: 404, message: "Không tìm thấy học kỳ" };
    return hk;
  }

  async create(data) {
    const payload = { ...data };
    payload.ngay_bat_dau_dk = this._normalizeDateInput(
      payload.ngay_bat_dau_dk,
      "Ngày bắt đầu đăng ký",
    );
    payload.ngay_ket_thuc_dk = this._normalizeDateInput(
      payload.ngay_ket_thuc_dk,
      "Ngày kết thúc đăng ký",
    );

    if (payload.ngay_bat_dau_dk > payload.ngay_ket_thuc_dk) {
      throw {
        status: 400,
        message: "Ngày bắt đầu đăng ký phải nhỏ hơn hoặc bằng ngày kết thúc đăng ký",
      };
    }

    return prisma.hocKy.create({ data: payload });
  }

  async update(id_hoc_ky, data) {
    await this.getOne(id_hoc_ky); // throws 404 if not found
    const payload = { ...data };
    if (payload.ngay_bat_dau_dk !== undefined) {
      payload.ngay_bat_dau_dk = this._normalizeDateInput(
        payload.ngay_bat_dau_dk,
        "Ngày bắt đầu đăng ký",
      );
    }
    if (payload.ngay_ket_thuc_dk !== undefined) {
      payload.ngay_ket_thuc_dk = this._normalizeDateInput(
        payload.ngay_ket_thuc_dk,
        "Ngày kết thúc đăng ký",
      );
    }
    if (
      payload.ngay_bat_dau_dk &&
      payload.ngay_ket_thuc_dk &&
      payload.ngay_bat_dau_dk > payload.ngay_ket_thuc_dk
    ) {
      throw {
        status: 400,
        message: "Ngày bắt đầu đăng ký phải nhỏ hơn hoặc bằng ngày kết thúc đăng ký",
      };
    }
    return prisma.hocKy.update({
      where: { id_hoc_ky: parseInt(id_hoc_ky) },
      data: payload,
    });
  }

  async delete(id_hoc_ky) {
    await this.getOne(id_hoc_ky);
    await prisma.hocKy.delete({ where: { id_hoc_ky: parseInt(id_hoc_ky) } });
    return { message: "Xóa học kỳ thành công" };
  }

  async toggleKichHoat(id_hoc_ky) {
    const hk = await this.getOne(id_hoc_ky);
    return prisma.hocKy.update({
      where: { id_hoc_ky: parseInt(id_hoc_ky) },
      data: { dang_kich_hoat: !hk.dang_kich_hoat },
    });
  }

  async getActive() {
    const hk = await prisma.hocKy.findFirst({
      where: { dang_kich_hoat: true },
      orderBy: { id_hoc_ky: "desc" },
    });
    if (!hk) throw { status: 404, message: "Khong tim thay hoc ky dang kich hoat" };
    return hk;
  }

  async getTinChiConfig(id_hoc_ky) {
    const id = parseInt(id_hoc_ky, 10);
    if (!id || Number.isNaN(id) || id < 1) {
      throw { status: 400, message: "Tham so id_hoc_ky khong hop le" };
    }

    const config = await prisma.cauHinhTinChi.findUnique({
      where: { id_hoc_ky: id },
    });

    return {
      id_hoc_ky: id,
      tin_chi_toi_da: config?.tin_chi_toi_da ?? null,
    };
  }
}

module.exports = new HocKyService();
