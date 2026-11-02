// src/app.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const prisma = require("./config/database");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/authRoutes");
const sinhVienRoutes = require("./routes/sinhVienRoutes");
const giangVienRoutes = require("./routes/giangVienRoutes");
const lopHocPhanRoutes = require("./routes/lopHocPhanRoutes");
const dangKyRoutes = require("./routes/dangKyRoutes");
const lichHocRoutes = require("./routes/lichHocRoutes");
const hocKyRoutes = require("./routes/hocKyRoutes");
const chuyenNganhRoutes = require("./routes/chuyenNganhRoutes");
const monHocRoutes = require("./routes/monHocRoutes");

const app = express();
const PORT = process.env.PORT || 3001;
const API = "/api/v1";

// ── Middlewares ──────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend static files ───────────────────────────────
const frontendPath = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath));
app.get("/", (req, res) => res.sendFile(path.join(frontendPath, "login.html")));

// ── Health check ─────────────────────────────────────────────
async function healthCheckHandler(_, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", db: "connected", time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "ERROR", db: "disconnected" });
  }
}

app.get("/health", healthCheckHandler);
app.get(`${API}/health`, healthCheckHandler);

// ── Routes ────────────────────────────────────────────────────
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/sinh-vien`, sinhVienRoutes);
app.use(`${API}/giang-vien`, giangVienRoutes);
app.use(`${API}/lop-hoc-phan`, lopHocPhanRoutes);
app.use(`${API}/dang-ky`, dangKyRoutes);
app.use(`${API}/lich-hoc`, lichHocRoutes);
app.use(`${API}/hoc-ky`, hocKyRoutes);
app.use(`${API}/chuyen-nganh`, chuyenNganhRoutes);
app.use(`${API}/mon-hoc`, monHocRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Endpoint '${req.path}' không tồn tại` }),
);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
(async () => {
  try {
    await prisma.$connect();
    console.log("✅  Kết nối database (Prisma) thành công");
    app.listen(PORT, () =>
      console.log(
        `🚀  Server đang chạy tại http://localhost:${PORT}\n    Prisma Studio: npx prisma studio`,
      ),
    );
  } catch (err) {
    console.error("❌  Không thể kết nối database:", err.message);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;


