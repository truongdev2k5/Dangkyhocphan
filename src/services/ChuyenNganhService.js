// src/services/ChuyenNganhService.js
const prisma = require("../config/database");

class ChuyenNganhService {
  async getAll({ search, page = 1, limit = 10 } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { ten_chuyen_nganh: { contains: search } },
        { ma_chuyen_nganh: { contains: search } },
      ];
    }

    const total = await prisma.chuyenNganh.count({ where });
    const data = await prisma.chuyenNganh.findMany({
      where,
      orderBy: { ten_chuyen_nganh: "asc" },
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

  async getOne(ma_chuyen_nganh) {
    const cn = await prisma.chuyenNganh.findUnique({
      where: { ma_chuyen_nganh },
    });
    if (!cn) throw { status: 404, message: "Không tìm thấy chuyên ngành" };
    return cn;
  }

  async create(data) {
    return prisma.chuyenNganh.create({ data });
  }

  async update(ma_chuyen_nganh, data) {
    await this.getOne(ma_chuyen_nganh); // throws 404 if not found
    return prisma.chuyenNganh.update({
      where: { ma_chuyen_nganh },
      data,
    });
  }

  async delete(ma_chuyen_nganh) {
    await this.getOne(ma_chuyen_nganh);
    await prisma.chuyenNganh.delete({ where: { ma_chuyen_nganh } });
    return { message: "Xóa chuyên ngành thành công" };
  }
}

module.exports = new ChuyenNganhService();
