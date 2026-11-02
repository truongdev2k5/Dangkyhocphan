// src/routes/chuyenNganhRoutes.js
const router = require("express").Router();
const ChuyenNganhController = require("../controllers/ChuyenNganhController");
const { authenticate, authorize } = require("../middlewares/errorHandler");

router.get("/", authenticate, authorize("admin"), ChuyenNganhController.getAll);
router.get(
  "/:ma",
  authenticate,
  authorize("admin"),
  ChuyenNganhController.getOne,
);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  ChuyenNganhController.create,
);
router.put(
  "/:ma",
  authenticate,
  authorize("admin"),
  ChuyenNganhController.update,
);
router.delete(
  "/:ma",
  authenticate,
  authorize("admin"),
  ChuyenNganhController.delete,
);

module.exports = router;
