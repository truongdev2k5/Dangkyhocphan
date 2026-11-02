// src/routes/lichHocRoutes.js
const router            = require('express').Router();
const LichHocController = require('../controllers/LichHocController');
const { authenticate, authorize } = require('../middlewares/errorHandler');

router.get('/cua-toi',          authenticate, authorize('sinh_vien'), LichHocController.getLichCuaToi);
router.get('/kiem-tra/:ma_lop', authenticate, authorize('sinh_vien'), LichHocController.kiemTraTrung);
router.post('/lop/:ma_lop',     authenticate, authorize('admin'),     LichHocController.themLich);
router.delete('/:id',           authenticate, authorize('admin'),     LichHocController.xoaLich);

module.exports = router;
