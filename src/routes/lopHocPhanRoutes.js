// src/routes/lopHocPhanRoutes.js
const router = require("express").Router();
const LopHocPhanController = require("../controllers/LopHocPhanController");
const { authenticate, authorize } = require("../middlewares/errorHandler");
const { validateCreateLopHocPhan } = require("../middlewares/validate");

router.get("/", authenticate, LopHocPhanController.getAll);
router.get("/:ma", authenticate, LopHocPhanController.getOne);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateCreateLopHocPhan,
  LopHocPhanController.create,
);
router.put(
  "/:ma",
  authenticate,
  authorize("admin"),
  LopHocPhanController.update,
);
router.delete(
  "/:ma",
  authenticate,
  authorize("admin"),
  LopHocPhanController.delete,
);

// Cấu hình giới hạn tín chỉ cho học kỳ
router.put(
  "/hoc-ky/:id_hoc_ky/tin-chi",
  authenticate,
  authorize("admin"),
  LopHocPhanController.setCauHinhTinChi,
);
router.get(
  "/hoc-ky/:id_hoc_ky/tin-chi",
  authenticate,
  LopHocPhanController.getCauHinhTinChi,
);

// Compatibility alias: some clients send :id instead of :id_hoc_ky
router.put(
  "/hoc-ky/:id/tin-chi",
  authenticate,
  authorize("admin"),
  LopHocPhanController.setCauHinhTinChi,
);
router.get(
  "/hoc-ky/:id/tin-chi",
  authenticate,
  LopHocPhanController.getCauHinhTinChi,
);

module.exports = router;
