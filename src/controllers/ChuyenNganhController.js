// src/controllers/ChuyenNganhController.js
const ChuyenNganhService = require("../services/ChuyenNganhService");
const { formatChuyenNganh, formatList } = require("../views/ChuyenNganhView");

class ChuyenNganhController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await ChuyenNganhService.getAll({
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
      const cn = await ChuyenNganhService.getOne(req.params.ma);
      res.json({ success: true, data: formatChuyenNganh(cn) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const cn = await ChuyenNganhService.create(req.body);
      res.status(201).json({ success: true, data: formatChuyenNganh(cn) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const cn = await ChuyenNganhService.update(req.params.ma, req.body);
      res.json({ success: true, data: formatChuyenNganh(cn) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await ChuyenNganhService.delete(req.params.ma);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChuyenNganhController();
