// src/controllers/HocKyController.js
const HocKyService = require("../services/HocKyService");
const { formatHocKy, formatList } = require("../views/HocKyView");
const prisma = require("../config/database");

class HocKyController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await HocKyService.getAll({
        ...query,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({
        success: true,
        data: formatList(result.data),
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const hk = await HocKyService.getOne(req.params.id);
      res.json({ success: true, data: formatHocKy(hk) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const hk = await HocKyService.create(req.body);
      res.status(201).json({ success: true, data: formatHocKy(hk) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const hk = await HocKyService.update(req.params.id, req.body);
      res.json({ success: true, data: formatHocKy(hk) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await HocKyService.delete(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async toggleKichHoat(req, res, next) {
    try {
      const hk = await HocKyService.toggleKichHoat(req.params.id);
      res.json({ success: true, data: formatHocKy(hk) });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req, res, next) {
    try {
      const [svCount, gvCount, lopCount, choDuyetCount] = await Promise.all([
        prisma.sinhVien.count(),
        prisma.giangVien.count(),
        prisma.lopHocPhan.count(),
        prisma.danhSachDangKy.count({ where: { trang_thai: "cho_duyet" } }),
      ]);
      res.json({
        success: true,
        data: { svCount, gvCount, lopCount, choDuyetCount },
      });
    } catch (err) {
      console.error("Error in getStats:", err);
      next(err);
    }
  }

  async getActive(req, res, next) {
    try {
      const hk = await HocKyService.getActive();
      res.json({ success: true, data: formatHocKy(hk) });
    } catch (err) {
      next(err);
    }
  }

  async getTinChiConfig(req, res, next) {
    try {
      const data = await HocKyService.getTinChiConfig(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HocKyController();
