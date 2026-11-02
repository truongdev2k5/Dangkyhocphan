// src/controllers/MonHocController.js
const MonHocService = require("../services/MonHocService");
const { formatMonHoc, formatList } = require("../views/MonHocView");

class MonHocController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, ...query } = req.query;
      const result = await MonHocService.getAll({
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
      const mh = await MonHocService.getOne(req.params.ma);
      res.json({ success: true, data: formatMonHoc(mh) });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const mh = await MonHocService.create(req.body);
      res.status(201).json({ success: true, data: formatMonHoc(mh) });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const mh = await MonHocService.update(req.params.ma, req.body);
      res.json({ success: true, data: formatMonHoc(mh) });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await MonHocService.delete(req.params.ma);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MonHocController();
