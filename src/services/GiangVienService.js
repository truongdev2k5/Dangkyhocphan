// src/services/GiangVienService.js
const prisma = require("../config/database");

class GiangVienService {
  async getAll({ khoa, search, page = 1, limit = 10 } = {}) {
    const where = {};
    if (khoa) where.khoa = khoa;
    if (search) {
      where.OR = [
        { ho_ten: { contains: search } },
        { ma_giang_vien: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const total = await prisma.giangVien.count({ where });
    const data = await prisma.giangVien.findMany({
      where,
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

  async getOne(ma_giang_vien) {
    const gv = await prisma.giangVien.findUnique({ where: { ma_giang_vien } });
    if (!gv) throw { status: 404, message: "Không tìm thấy giảng viên" };
    return gv;
  }

  async create(data) {
    return prisma.giangVien.create({ data });
  }

  async update(ma_giang_vien, data) {
    await this.getOne(ma_giang_vien);
    return prisma.giangVien.update({ where: { ma_giang_vien }, data });
  }

  async delete(ma_giang_vien) {
    await this.getOne(ma_giang_vien);
    await prisma.giangVien.delete({ where: { ma_giang_vien } });
    return { message: "Xóa giảng viên thành công" };
  }
}

module.exports = new GiangVienService();
