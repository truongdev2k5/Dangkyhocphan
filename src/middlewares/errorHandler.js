// src/middlewares/errorHandler.js
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const header = req.headers["authorization"];
  const tokenFromHeader =
    typeof header === "string" &&
    header.trim().toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : null;

  const tokenFromQuery = req.query?.token || req.query?.access_token;
  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Thiếu token xác thực. Gửi header Authorization: Bearer <token> (hoặc query ?token=<token>)",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.vai_tro)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này",
      });
    }
    next();
  };

const errorHandler = (err, req, res, next) => {
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất)",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi" });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu tham chiếu không hợp lệ (môn học/học kỳ/giảng viên không tồn tại)",
    });
  }

  const status = err.status || 500;
  const message = err.message || "Lỗi máy chủ nội bộ";
  const extra = err.chi_tiet ? { chi_tiet: err.chi_tiet } : {};

  if (status === 500) console.error("[ERROR]", err);
  return res.status(status).json({ success: false, message, ...extra });
};

module.exports = { authenticate, authorize, errorHandler };
