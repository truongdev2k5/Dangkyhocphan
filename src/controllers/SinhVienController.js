// src/controllers/SinhVienController.js
const SinhVienService = require("../services/SinhVienService");
const { formatSinhVien, formatList } = require("../views/SinhVienView");

class SinhVienController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await SinhVienService.getAll({
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
      const sv = await SinhVienService.getOne(req.params.ma);
      res.json({ success: true, data: formatSinhVien(sv) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const sv = await SinhVienService.create(req.body);
      res.status(201).json({ success: true, data: formatSinhVien(sv) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const sv = await SinhVienService.update(req.params.ma, req.body);
      res.json({ success: true, data: formatSinhVien(sv) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await SinhVienService.delete(req.params.ma);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const sv = await SinhVienService.getByNguoiDung(req.user.id_nguoi_dung);
      res.json({ success: true, data: formatSinhVien(sv) });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SinhVienController();
