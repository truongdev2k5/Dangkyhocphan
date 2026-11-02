// src/routes/sinhVienRoutes.js
const router = require("express").Router();
const SinhVienController = require("../controllers/SinhVienController");
const { authenticate, authorize } = require("../middlewares/errorHandler");
const { validateCreateSinhVien } = require("../middlewares/validate");

router.get(
  "/me",
  authenticate,
  authorize("sinh_vien"),
  SinhVienController.getMe,
);
router.get("/", authenticate, authorize("admin"), SinhVienController.getAll);
router.get("/:ma", authenticate, authorize("admin"), SinhVienController.getOne);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateCreateSinhVien,
  SinhVienController.create,
);
router.put("/:ma", authenticate, authorize("admin"), SinhVienController.update);
router.delete(
  "/:ma",
  authenticate,
  authorize("admin"),
  SinhVienController.delete,
);

module.exports = router;
