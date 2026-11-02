// src/services/LichHocService.js
const prisma = require("../config/database");
const { getTenThu } = require("../utils/helpers");

// Chuyển "HH:MM:SS" → số phút từ 0h để so sánh
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const dayNames = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

class LichHocService {
  /**
   * Lấy lịch học đang có (da_duyet) của sinh viên trong học kỳ
   */
  async getLichHocSinhVien(ma_sinh_vien, id_hoc_ky) {
    const dkList = await prisma.danhSachDangKy.findMany({
      where: {
        ma_sinh_vien,
        trang_thai: "da_duyet",
        LopHocPhan: { id_hoc_ky: Number(id_hoc_ky) },
      },
      include: {
        LopHocPhan: {
          include: {
            MonHoc: { select: { ten_mon_hoc: true } },
            LichHocChiTiet: true,
          },
        },
      },
    });

    const lich = [];
    for (const dk of dkList) {
      for (const slot of dk.LopHocPhan.LichHocChiTiet) {
        lich.push({
          ma_lop_hoc: dk.ma_lop_hoc,
          ten_mon_hoc: dk.LopHocPhan.MonHoc.ten_mon_hoc,
          thu_trong_tuan: slot.thu_trong_tuan,
          ten_thu: getTenThu(slot.thu_trong_tuan),
          gio_bat_dau: slot.gio_bat_dau,
          gio_ket_thuc: slot.gio_ket_thuc,
        });
      }
    }
    return lich;
  }

  /**
   * Kiểm tra trùng lịch giữa lớp mới và lịch hiện tại.
   * Trả về mảng xung đột (rỗng = OK).
   */
  async kiemTraTrungLich(ma_sinh_vien, ma_lop_hoc_moi) {
    const lopMoi = await prisma.lopHocPhan.findUnique({
      where: { ma_lop_hoc: ma_lop_hoc_moi },
      include: { LichHocChiTiet: true },
    });
    if (!lopMoi) throw { status: 404, message: "Lớp học phần không tồn tại" };
    if (!lopMoi.LichHocChiTiet.length) return [];

    const lichHienTai = await this.getLichHocSinhVien(
      ma_sinh_vien,
      lopMoi.id_hoc_ky,
    );

    const xungDot = [];
    for (const slotMoi of lopMoi.LichHocChiTiet) {
      for (const cur of lichHienTai) {
        if (cur.thu_trong_tuan !== slotMoi.thu_trong_tuan) continue;
        const batDauMoi = toMinutes(slotMoi.gio_bat_dau);
        const ketThucMoi = toMinutes(slotMoi.gio_ket_thuc);
        const batDauCur = toMinutes(cur.gio_bat_dau);
        const ketThucCur = toMinutes(cur.gio_ket_thuc);

        // Overlap: (start1 < end2) && (start2 < end1)
        if (batDauCur < ketThucMoi && batDauMoi < ketThucCur) {
          xungDot.push({
            ma_lop_dang_hoc: cur.ma_lop_hoc,
            ten_mon_dang_hoc: cur.ten_mon_hoc,
            thu: dayNames[cur.thu_trong_tuan] || cur.thu_trong_tuan,
            gio_xung_dot: `${slotMoi.gio_bat_dau} – ${slotMoi.gio_ket_thuc}`,
          });
        }
      }
    }
    return xungDot;
  }
}

module.exports = new LichHocService();
