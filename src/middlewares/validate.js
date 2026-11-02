// src/middlewares/validate.js
const validateRegister = (req, res, next) => {
  const { ten_dang_nhap, mat_khau, id_vai_tro } = req.body;
  const errors = [];

  if (
    !ten_dang_nhap ||
    typeof ten_dang_nhap !== "string" ||
    ten_dang_nhap.trim().length === 0
  ) {
    errors.push("Tên đăng nhập là bắt buộc và phải là chuỗi không rỗng");
  }

  if (!mat_khau || typeof mat_khau !== "string" || mat_khau.length < 6) {
    errors.push("Mật khẩu là bắt buộc và phải có ít nhất 6 ký tự");
  }

  if (!id_vai_tro || typeof id_vai_tro !== "number" || id_vai_tro < 1) {
    errors.push("ID vai trò là bắt buộc và phải là số dương");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "Dữ liệu không hợp lệ", errors });
  }

  next();
};

const validateCreateSinhVien = (req, res, next) => {
  const {
    ma_sinh_vien,
    ho_ten,
    ma_chuyen_nganh,
    id_nguoi_dung,
    so_dien_thoai,
    email,
  } = req.body;
  const errors = [];

  if (
    !ma_sinh_vien ||
    typeof ma_sinh_vien !== "string" ||
    ma_sinh_vien.trim().length === 0
  ) {
    errors.push("Mã sinh viên là bắt buộc và phải là chuỗi không rỗng");
  }

  if (!ho_ten || typeof ho_ten !== "string" || ho_ten.trim().length === 0) {
    errors.push("Họ tên là bắt buộc và phải là chuỗi không rỗng");
  }

  if (
    !ma_chuyen_nganh ||
    typeof ma_chuyen_nganh !== "string" ||
    ma_chuyen_nganh.trim().length === 0
  ) {
    errors.push("Mã chuyên ngành là bắt buộc và phải là chuỗi không rỗng");
  }

  if (
    id_nguoi_dung !== undefined &&
    (typeof id_nguoi_dung !== "number" || id_nguoi_dung < 1)
  ) {
    errors.push("ID người dùng phải là số dương nếu được cung cấp");
  }

  if (
    so_dien_thoai !== undefined &&
    (typeof so_dien_thoai !== "string" || so_dien_thoai.trim().length === 0)
  ) {
    errors.push("Số điện thoại phải là chuỗi không rỗng nếu được cung cấp");
  }

  if (
    email !== undefined &&
    (typeof email !== "string" || !email.includes("@"))
  ) {
    errors.push("Email phải là chuỗi hợp lệ nếu được cung cấp");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "Dữ liệu không hợp lệ", errors });
  }

  next();
};

const validateCreateLopHocPhan = (req, res, next) => {
  const payload = { ...req.body };
  const errors = [];

  payload.id_hoc_ky =
    typeof payload.id_hoc_ky === "string"
      ? Number(payload.id_hoc_ky)
      : payload.id_hoc_ky;
  payload.so_luong_toi_da =
    typeof payload.so_luong_toi_da === "string"
      ? Number(payload.so_luong_toi_da)
      : payload.so_luong_toi_da;
  if (payload.so_luong_con_trong !== undefined) {
    payload.so_luong_con_trong =
      typeof payload.so_luong_con_trong === "string"
        ? Number(payload.so_luong_con_trong)
        : payload.so_luong_con_trong;
  }

  ["ma_giang_vien", "phong_hoc", "ngay_bat_dau", "ngay_ket_thuc"].forEach(
    (field) => {
      if (payload[field] === "") delete payload[field];
    },
  );

  if (
    !payload.ma_lop_hoc ||
    typeof payload.ma_lop_hoc !== "string" ||
    payload.ma_lop_hoc.trim().length === 0
  ) {
    errors.push("Mã lớp học phần là bắt buộc và phải là chuỗi không rỗng");
  }

  if (
    !payload.ma_mon_hoc ||
    typeof payload.ma_mon_hoc !== "string" ||
    payload.ma_mon_hoc.trim().length === 0
  ) {
    errors.push("Mã môn học là bắt buộc và phải là chuỗi không rỗng");
  }

  if (
    !payload.id_hoc_ky ||
    typeof payload.id_hoc_ky !== "number" ||
    Number.isNaN(payload.id_hoc_ky) ||
    payload.id_hoc_ky < 1
  ) {
    errors.push("ID học kỳ là bắt buộc và phải là số dương");
  }

  if (
    payload.ma_giang_vien !== undefined &&
    (typeof payload.ma_giang_vien !== "string" ||
      payload.ma_giang_vien.trim().length === 0)
  ) {
    errors.push("Mã giảng viên phải là chuỗi không rỗng nếu được cung cấp");
  }

  if (
    payload.phong_hoc !== undefined &&
    (typeof payload.phong_hoc !== "string" || payload.phong_hoc.trim().length === 0)
  ) {
    errors.push("Phòng học phải là chuỗi không rỗng nếu được cung cấp");
  }

  if (
    !payload.so_luong_toi_da ||
    typeof payload.so_luong_toi_da !== "number" ||
    Number.isNaN(payload.so_luong_toi_da) ||
    payload.so_luong_toi_da < 1
  ) {
    errors.push("Số lượng tối đa là bắt buộc và phải là số dương");
  }

  if (
    payload.so_luong_con_trong !== undefined &&
    (typeof payload.so_luong_con_trong !== "number" ||
      Number.isNaN(payload.so_luong_con_trong) ||
      payload.so_luong_con_trong < 0)
  ) {
    errors.push("Số lượng còn trống phải là số không âm nếu được cung cấp");
  }

  if (payload.ngay_bat_dau !== undefined && isNaN(Date.parse(payload.ngay_bat_dau))) {
    errors.push("Ngày bắt đầu phải là ngày hợp lệ nếu được cung cấp");
  }

  if (payload.ngay_ket_thuc !== undefined && isNaN(Date.parse(payload.ngay_ket_thuc))) {
    errors.push("Ngày kết thúc phải là ngày hợp lệ nếu được cung cấp");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "Dữ liệu không hợp lệ", errors });
  }

  req.body = payload;
  next();
};

module.exports = {
  validateRegister,
  validateCreateSinhVien,
  validateCreateLopHocPhan,
};
