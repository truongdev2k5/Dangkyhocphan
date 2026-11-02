// src/services/DangKyService.js
const prisma = require("../config/database");
const LichHocService = require("./LichHocService");

class DangKyService {
  // ── Private helpers ──────────────────────────────────────

  async _tongTinChi(
    ma_sinh_vien,
    id_hoc_ky,
    statuses = ["cho_duyet", "da_duyet"],
  ) {
    const rows = await prisma.danhSachDangKy.findMany({
      where: {
        ma_sinh_vien,
        trang_thai: { in: statuses },
        LopHocPhan: { id_hoc_ky },
      },
      include: {
        LopHocPhan: { include: { MonHoc: { select: { so_tin_chi: true } } } },
      },
    });
    return rows.reduce(
      (s, r) => s + (r.LopHocPhan?.MonHoc?.so_tin_chi ?? 0),
      0,
    );
  }

  async _ghiLichSu(
    tx,
    ma_sinh_vien,
    ma_lop_hoc,
    trang_thai_cu,
    trang_thai_moi,
  ) {
    await tx.lichSuDangKy.create({
      data: { ma_sinh_vien, ma_lop_hoc, trang_thai_cu, trang_thai_moi },
    });
  }

  // ── Sinh viên đăng ký ────────────────────────────────────
  async dangKy(ma_sinh_vien, ma_lop_hoc) {
    return prisma.$transaction(async (tx) => {
      // 1. Lấy lớp + học kỳ + môn (lock bằng cách đọc trong transaction)
      const lop = await tx.lopHocPhan.findUnique({
        where: { ma_lop_hoc },
        include: { HocKy: true, MonHoc: true },
      });
      if (!lop) throw { status: 404, message: "Lớp học phần không tồn tại" };

      // 2. Học kỳ mở đăng ký?
      const now = new Date();
      const hk = lop.HocKy;
      if (
        !hk.dang_kich_hoat ||
        now < hk.ngay_bat_dau_dk ||
        now > hk.ngay_ket_thuc_dk
      ) {
        throw {
          status: 400,
          message: "Học kỳ không trong thời gian mở đăng ký",
        };
      }

      // 3. Đã đăng ký chưa?
      const existed = await tx.danhSachDangKy.findUnique({
        where: { ma_sinh_vien_ma_lop_hoc: { ma_sinh_vien, ma_lop_hoc } },
      });
      if (existed && existed.trang_thai !== "da_huy") {
        throw { status: 409, message: "Bạn đã đăng ký lớp học phần này rồi" };
      }

      // 4. Giới hạn tín chỉ
      const cauHinh = await tx.cauHinhTinChi.findUnique({
        where: { id_hoc_ky: hk.id_hoc_ky },
      });
      if (!cauHinh) {
        throw {
          status: 400,
          message:
            "Học kỳ này chưa được cấu hình tín chỉ tối đa. Vui lòng liên hệ admin.",
        };
      }
      const tongHienTai = await this._tongTinChi(ma_sinh_vien, hk.id_hoc_ky);
      if (tongHienTai + lop.MonHoc.so_tin_chi > cauHinh.tin_chi_toi_da) {
        throw {
          status: 400,
          message: `Vượt giới hạn tín chỉ (tối đa ${cauHinh.tin_chi_toi_da}, hiện tại ${tongHienTai})`,
        };
      }

      // 5. Kiểm tra trùng lịch (gọi ngoài tx, chỉ đọc)
      const xungDot = await LichHocService.kiemTraTrungLich(
        ma_sinh_vien,
        ma_lop_hoc,
      );
      if (xungDot.length > 0) {
        throw { status: 400, message: "Trùng lịch học", chi_tiet: xungDot };
      }

      // 6. Upsert đăng ký
      const dk = existed
        ? await tx.danhSachDangKy.update({
            where: { ma_sinh_vien_ma_lop_hoc: { ma_sinh_vien, ma_lop_hoc } },
            data: {
              trang_thai: "cho_duyet",
              ghi_chu_tu_choi: null,
              ngay_dang_ky: new Date(),
            },
          })
        : await tx.danhSachDangKy.create({
            data: { ma_sinh_vien, ma_lop_hoc, trang_thai: "cho_duyet" },
          });

      await this._ghiLichSu(
        tx,
        ma_sinh_vien,
        ma_lop_hoc,
        existed?.trang_thai ?? null,
        "cho_duyet",
      );
      return dk;
    });
  }

  // ── Admin duyệt ──────────────────────────────────────────
  async duyetDangKy(id_dang_ky) {
    return prisma.$transaction(async (tx) => {
      const dk = await tx.danhSachDangKy.findUnique({
        where: { id_dang_ky },
        include: {
          LopHocPhan: {
            include: {
              MonHoc: { select: { so_tin_chi: true } },
              HocKy: { select: { id_hoc_ky: true } },
            },
          },
        },
      });
      if (!dk) throw { status: 404, message: "Không tìm thấy đăng ký" };
      if (dk.trang_thai !== "cho_duyet") {
        throw {
          status: 400,
          message: `Không thể duyệt ở trạng thái "${dk.trang_thai}"`,
        };
      }

      const idHocKy = dk.LopHocPhan?.HocKy?.id_hoc_ky;
      const soTinChiLop = dk.LopHocPhan?.MonHoc?.so_tin_chi || 0;
      if (idHocKy) {
        const cauHinh = await tx.cauHinhTinChi.findUnique({
          where: { id_hoc_ky: idHocKy },
        });
        if (!cauHinh) {
          throw {
            status: 400,
            message:
              "Học kỳ này chưa được cấu hình tín chỉ tối đa. Không thể duyệt đăng ký.",
          };
        }

        const tongDaDuyet = await this._tongTinChi(
          dk.ma_sinh_vien,
          idHocKy,
          ["da_duyet"],
        );
        if (tongDaDuyet + soTinChiLop > cauHinh.tin_chi_toi_da) {
          throw {
            status: 400,
            message: `Không thể duyệt: sẽ vượt giới hạn tín chỉ kỳ này (tối đa ${cauHinh.tin_chi_toi_da}, đã duyệt ${tongDaDuyet})`,
          };
        }
      }

      // Giam cho trong an toan theo dieu kien > 0 de tranh overbook khi duyet dong thoi
      const seatResult = await tx.lopHocPhan.updateMany({
        where: {
          ma_lop_hoc: dk.ma_lop_hoc,
          so_luong_con_trong: { gt: 0 },
        },
        data: { so_luong_con_trong: { decrement: 1 } },
      });
      if (seatResult.count === 0) {
        throw { status: 400, message: "Lop da het cho" };
      }

      const updated = await tx.danhSachDangKy.update({
        where: { id_dang_ky },
        data: { trang_thai: "da_duyet" },
      });
      await this._ghiLichSu(
        tx,
        dk.ma_sinh_vien,
        dk.ma_lop_hoc,
        "cho_duyet",
        "da_duyet",
      );
      return updated;
    });
  }

  // ── Admin từ chối ────────────────────────────────────────
  async tuChoiDangKy(id_dang_ky, ghi_chu) {
    return prisma.$transaction(async (tx) => {
      const dk = await tx.danhSachDangKy.findUnique({ where: { id_dang_ky } });
      if (!dk) throw { status: 404, message: "Không tìm thấy đăng ký" };
      if (dk.trang_thai !== "cho_duyet") {
        throw {
          status: 400,
          message: `Không thể từ chối ở trạng thái "${dk.trang_thai}"`,
        };
      }

      const updated = await tx.danhSachDangKy.update({
        where: { id_dang_ky },
        data: { trang_thai: "tu_choi", ghi_chu_tu_choi: ghi_chu ?? null },
      });
      await this._ghiLichSu(
        tx,
        dk.ma_sinh_vien,
        dk.ma_lop_hoc,
        "cho_duyet",
        "tu_choi",
      );
      return updated;
    });
  }

  // ── Sinh viên hủy ────────────────────────────────────────
  async huyDangKy(ma_sinh_vien, id_dang_ky) {
    return prisma.$transaction(async (tx) => {
      const dk = await tx.danhSachDangKy.findFirst({
        where: { id_dang_ky, ma_sinh_vien },
      });
      if (!dk) throw { status: 404, message: "Không tìm thấy đăng ký" };
      if (["da_huy", "tu_choi"].includes(dk.trang_thai)) {
        throw {
          status: 400,
          message: "Đăng ký đã bị hủy hoặc từ chối trước đó",
        };
      }

      if (dk.trang_thai === "da_duyet") {
        throw {
          status: 400,
          message: "Dang ky da duyet khong the tu huy. Vui long lien he admin.",
        };
      }

      const updated = await tx.danhSachDangKy.update({
        where: { id_dang_ky },
        data: { trang_thai: "da_huy" },
      });
      await this._ghiLichSu(
        tx,
        ma_sinh_vien,
        dk.ma_lop_hoc,
        dk.trang_thai,
        "da_huy",
      );
      return updated;
    });
  }

  // ── Queries ──────────────────────────────────────────────
  async getDanhSachCuaSinhVien(ma_sinh_vien, id_hoc_ky) {
    return prisma.danhSachDangKy.findMany({
      where: {
        ma_sinh_vien,
        ...(id_hoc_ky ? { LopHocPhan: { id_hoc_ky: Number(id_hoc_ky) } } : {}),
      },
      include: {
        LopHocPhan: {
          include: {
            MonHoc: true,
            HocKy: true,
            GiangVien: true,
            LichHocChiTiet: true,
          },
        },
      },
      orderBy: { ngay_dang_ky: "desc" },
    });
  }

  async getDanhSachCuaLop(ma_lop_hoc, trang_thai) {
    return prisma.danhSachDangKy.findMany({
      where: { ma_lop_hoc, ...(trang_thai ? { trang_thai } : {}) },
      include: { SinhVien: { include: { ChuyenNganh: true } } },
      orderBy: { ngay_dang_ky: "asc" },
    });
  }

  async getAll(trang_thai, { page = 1, limit = 10 } = {}) {
    const where = trang_thai ? { trang_thai } : {};

    const total = await prisma.danhSachDangKy.count({ where });
    const data = await prisma.danhSachDangKy.findMany({
      where,
      include: {
        SinhVien: { include: { ChuyenNganh: true } },
        LopHocPhan: { include: { MonHoc: true, HocKy: true } },
      },
      orderBy: { ngay_dang_ky: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    };
  }

  async getLichSu(search = "") {
    const q = String(search || "").trim();
    const where = q
      ? {
          OR: [
            { ma_sinh_vien: { contains: q } },
            { ma_lop_hoc: { contains: q } },
            { trang_thai_cu: { contains: q } },
            { trang_thai_moi: { contains: q } },
            { SinhVien: { ho_ten: { contains: q } } },
            { LopHocPhan: { ma_lop_hoc: { contains: q } } },
          ],
        }
      : {};

    return prisma.lichSuDangKy.findMany({
      where,
      include: {
        SinhVien: true,
        LopHocPhan: true,
      },
      orderBy: { thoi_diem: "desc" },
    });
  }
}

module.exports = new DangKyService();
