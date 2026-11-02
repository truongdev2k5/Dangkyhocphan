// src/services/MonHocService.js
const prisma = require("../config/database");

class MonHocService {
  async getAll({ search, page = 1, limit = 10 } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { ten_mon_hoc: { contains: search } },
        { ma_mon_hoc: { contains: search } },
      ];
    }

    const total = await prisma.monHoc.count({ where });
    const data = await prisma.monHoc.findMany({
      where,
      orderBy: { ten_mon_hoc: "asc" },
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

  async getOne(ma_mon_hoc) {
    const mh = await prisma.monHoc.findUnique({
      where: { ma_mon_hoc },
    });
    if (!mh) throw { status: 404, message: "Không tìm thấy môn học" };
    return mh;
  }

  async create(data) {
    return prisma.monHoc.create({ data });
  }

  async update(ma_mon_hoc, data) {
    await this.getOne(ma_mon_hoc); // throws 404 if not found
    return prisma.monHoc.update({
      where: { ma_mon_hoc },
      data,
    });
  }

  async delete(ma_mon_hoc) {
    await this.getOne(ma_mon_hoc);
    await prisma.monHoc.delete({ where: { ma_mon_hoc } });
    return { message: "Xóa môn học thành công" };
  }
}

module.exports = new MonHocService();
