// src/routes/giangVienRoutes.js
const router              = require('express').Router();
const GiangVienController = require('../controllers/GiangVienController');
const { authenticate, authorize } = require('../middlewares/errorHandler');

router.get('/',       authenticate, GiangVienController.getAll);
router.get('/:ma',    authenticate, GiangVienController.getOne);
router.post('/',      authenticate, authorize('admin'), GiangVienController.create);
router.put('/:ma',    authenticate, authorize('admin'), GiangVienController.update);
router.delete('/:ma', authenticate, authorize('admin'), GiangVienController.delete);

module.exports = router;
