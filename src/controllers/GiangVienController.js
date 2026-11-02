// src/controllers/GiangVienController.js
const GiangVienService = require("../services/GiangVienService");
const { formatGiangVien, formatList } = require("../views/GiangVienView");

class GiangVienController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await GiangVienService.getAll({
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
      const gv = await GiangVienService.getOne(req.params.ma);
      res.json({ success: true, data: formatGiangVien(gv) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const gv = await GiangVienService.create(req.body);
      res.status(201).json({ success: true, data: formatGiangVien(gv) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const gv = await GiangVienService.update(req.params.ma, req.body);
      res.json({ success: true, data: formatGiangVien(gv) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await GiangVienService.delete(req.params.ma);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GiangVienController();
